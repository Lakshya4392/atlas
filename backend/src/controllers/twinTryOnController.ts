import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import cloudinary from '../config/cloudinary';

const prisma = new PrismaClient();

export const twinTryOn = async (req: Request, res: Response) => {
  const { userId, garm_img, category } = req.body;
  
  if (!userId || !garm_img) {
    return res.status(400).json({ success: false, error: 'userId and garm_img are required' });
  }

  try {
    console.log(`🤖 Starting Zero-API Try-On for user ${userId}...`);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user || !user.digitalTwinUrl || !user.bodyMasks) {
       return res.status(400).json({ success: false, error: 'Digital Twin or Body Masks not found. Please regenerate twin.' });
    }

    const masks: any = user.bodyMasks;
    if (Object.keys(masks).length === 0) {
       console.log('⚠️ Warning: No body masks found for user. Using generic placement.');
    }

    // Helper to find mask case-insensitively
    const getMask = (labels: string[]) => {
      const keys = Object.keys(masks);
      for (const label of labels) {
        const foundKey = keys.find(k => k.toLowerCase().includes(label.toLowerCase()));
        if (foundKey) return masks[foundKey];
      }
      return null;
    };

    console.log('📥 Fetching Garment image...');
    const garmRes = await fetch(garm_img);
    const garmBuffer = Buffer.from(await garmRes.arrayBuffer());
    
    console.log('📥 Fetching Digital Twin image...');
    const twinRes = await fetch(user.digitalTwinUrl);
    const twinBuffer = Buffer.from(await twinRes.arrayBuffer());

    const sharpModule = await import('sharp');
    const sharp = sharpModule.default;

    const twinMetadata = await sharp(twinBuffer).metadata();
    const width = twinMetadata.width!;
    const height = twinMetadata.height!;

    console.log(`📐 Calculating clothing placement for category: ${category || 'Unknown'}`);
    
    const lowerCategory = (category || '').toLowerCase();
    const isBottom = !!lowerCategory.match(/pant|jean|short|skirt|bottom|trouser|legging/);

    let targetWidth = Math.round(width * 0.4);
    let targetHeight = Math.round(height * 0.4);
    let topCoord = Math.round(isBottom ? height * 0.5 : height * 0.2);
    let leftCoord = Math.round((width - targetWidth) / 2);

    const targetMaskBase64 = isBottom 
      ? getMask(['pants', 'skirt', 'left-leg']) 
      : getMask(['upper-clothes', 'torso-skin', 'dress']);
    
    if (targetMaskBase64) {
      console.log(`✅ Found ${isBottom ? 'Lower-Body' : 'Torso'} mask. Calculating precise placement...`);
      const maskBuffer = Buffer.from(targetMaskBase64, 'base64');
      const fullMask = await sharp(maskBuffer)
          .resize(width, height, { fit: 'fill' })
          .greyscale()
          .png()
          .toBuffer();
      
      const maskTrimmed = await sharp(fullMask)
          .trim({ threshold: 5 })
          .toBuffer({ resolveWithObject: true });
      
      targetWidth = Math.round(maskTrimmed.info.width);
      targetHeight = Math.round(maskTrimmed.info.height);
      topCoord = Math.round(Math.abs(maskTrimmed.info.trimOffsetTop || 0));
      leftCoord = Math.round(Math.abs(maskTrimmed.info.trimOffsetLeft || 0));
      
      // If it's a bottom and we only found one leg, we might need to expand width slightly
      if (isBottom && !getMask(['pants', 'skirt'])) {
          targetWidth = targetWidth * 2;
      }
    } else {
      console.log('⚠️ No exact body segment mask found. Using fallback center placement.');
    }

    console.log(`👕 Resizing garment to: ${targetWidth}x${targetHeight} at (${leftCoord}, ${topCoord})`);
    
    console.log(`✨ Dynamically removing background from garment...`);
    const { removeBackground } = await import('@imgly/background-removal-node');
    const garmBlob = new Blob([garmBuffer], { type: 'image/jpeg' });
    const transparentGarmBlob = await removeBackground(garmBlob);
    const transparentGarmBuffer = Buffer.from(await transparentGarmBlob.arrayBuffer());

    // Resize the transparent garment to fit the torso bounding box precisely
    const garmentResized = await sharp(transparentGarmBuffer)
        .resize(targetWidth, targetHeight, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();

    console.log(`🖌️ Compositing garment onto Twin...`);
    // 2. We composite the Transparent Garment onto the Twin at the calculated Torso coordinates
    let finalBuffer = await sharp(twinBuffer)
        .composite([{ input: garmentResized, top: topCoord, left: leftCoord }])
        .png()
        .toBuffer();

    console.log(`🦾 Applying Foreground Depth Overlays...`);
    // 3. We layer the original Arms/Shoes OVER the garment so it looks naturally worn.
    const overlays = [];
    
    // Always layer arms (hands can fall in front of pants too)
    const leftArmBase = getMask(['left-arm']);
    if (leftArmBase) {
        const leftArmMask = await sharp(Buffer.from(leftArmBase, 'base64'))
            .resize(width, height, { fit: 'fill' }).greyscale().png().toBuffer();
        
        const leftArmOriginal = await sharp(twinBuffer)
            .ensureAlpha()
            .joinChannel(leftArmMask)
            .png().toBuffer();
            
        overlays.push({ input: leftArmOriginal, top: 0, left: 0 });
    }
    
    const rightArmBase = getMask(['right-arm']);
    if (rightArmBase) {
        const rightArmMask = await sharp(Buffer.from(rightArmBase, 'base64'))
            .resize(width, height, { fit: 'fill' }).greyscale().png().toBuffer();
            
        const rightArmOriginal = await sharp(twinBuffer)
            .ensureAlpha()
            .joinChannel(rightArmMask)
            .png().toBuffer();
            
        overlays.push({ input: rightArmOriginal, top: 0, left: 0 });
    }

    // If it's a bottom, layer the shoes so pants go behind shoes
    if (isBottom) {
        const leftShoeBase = getMask(['left-shoe']);
        if (leftShoeBase) {
            const lShoeMask = await sharp(Buffer.from(leftShoeBase, 'base64')).resize(width, height, { fit: 'fill' }).greyscale().png().toBuffer();
            const lShoeOrig = await sharp(twinBuffer).ensureAlpha().joinChannel(lShoeMask).png().toBuffer();
            overlays.push({ input: lShoeOrig, top: 0, left: 0 });
        }
        const rightShoeBase = getMask(['right-shoe']);
        if (rightShoeBase) {
            const rShoeMask = await sharp(Buffer.from(rightShoeBase, 'base64')).resize(width, height, { fit: 'fill' }).greyscale().png().toBuffer();
            const rShoeOrig = await sharp(twinBuffer).ensureAlpha().joinChannel(rShoeMask).png().toBuffer();
            overlays.push({ input: rShoeOrig, top: 0, left: 0 });
        }
    }

    // Apply the arm foreground overlays
    if (overlays.length > 0) {
        finalBuffer = await sharp(finalBuffer).composite(overlays).png().toBuffer();
    }

    // Convert back to JPEG to save space
    finalBuffer = await sharp(finalBuffer).jpeg({ quality: 90 }).toBuffer();

    console.log('☁️ Uploading final Try-On to Cloudinary...');
    const uploadResult = await new Promise<string>((resolve, reject) => {
      cloudinary.uploader.upload_stream({ folder: 'atla_tryon' }, (err, result) => {
        if (err || !result) reject(err);
        else resolve(result.secure_url);
      }).end(finalBuffer);
    });

    console.log('✅ Zero-API Try-On Complete! URL:', uploadResult);
    res.json({ success: true, url: uploadResult });
    
  } catch (error: any) {
    console.error('❌ Zero-API Twin Try-On Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};
