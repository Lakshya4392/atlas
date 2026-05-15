import { Request, Response } from 'express';
import prisma from '../config/prisma';
import cloudinary from '../config/cloudinary';
import { client } from '@gradio/client';

export const generateDigitalTwin = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    if (!req.file) return res.status(400).json({ success: false, error: 'No image uploaded' });
    
    console.log(`\n🧍‍♂️ ═══ AI DIGITAL TWIN GENERATION ═══`);
    console.log(`   User: ${userId}`);
    
    // Convert buffer to blob for gradio
    const imageBlob = new Blob([new Uint8Array(req.file.buffer)], { type: req.file.mimetype });

    console.log(`   📡 Connecting to Hugging Face InstantID...`);
    
    let avatarUrl = '';
    let savedMasks: Record<string, string> = {};
    
    try {
      const hfToken = process.env.HF_TOKEN || process.env.HF_TOKEN_2 || process.env.HF_TOKEN_3;
      if (!hfToken) throw new Error("Missing HF_TOKEN");

      console.log(`   ✂️ Extracting Full Body using Segformer API...`);
      
      const sharpModule = await import('sharp');
      const sharp = sharpModule.default;

      // Log original size
      const originalSize = (req.file.buffer.length / 1024).toFixed(2);
      console.log(`   📸 Original Image Size: ${originalSize} KB`);

      // Compress image to prevent Hugging Face payload size limit crashes (fetch failed)
      const compressedBuffer = await sharp(req.file.buffer)
        .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();
        
      const compressedSize = (compressedBuffer.length / 1024).toFixed(2);
      console.log(`   🗜️ Compressed Image for AI: ${compressedSize} KB`);

      const MAX_RETRIES = 3;
      let segments: any[] = [];
      let success = false;
      let lastError = '';

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
         try {
            console.log(`   📡 Calling HuggingFace API (Attempt ${attempt}/${MAX_RETRIES})...`);
            
            const segRes = await fetch('https://router.huggingface.co/hf-inference/models/mattmdjaga/segformer_b2_clothes', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${hfToken}`,
                'Content-Type': 'image/jpeg',
              },
              body: compressedBuffer,
            });

            if (!segRes.ok) {
              const errText = await segRes.text();
              console.log(`   ❌ HF API Error Status: ${segRes.status} | Msg: ${errText.substring(0, 100)}`);
              throw new Error(`API error (${segRes.status}): ${errText}`);
            }

            segments = await segRes.json() as any[];
            if (segments && segments.length > 0) {
               console.log(`   ✅ API Success! Found ${segments.length} body segments.`);
               success = true;
               break; // Success!
            } else {
               console.log(`   ⚠️ API Success but returned 0 segments.`);
            }
         } catch (err: any) {
            lastError = err.message;
            console.log(`   ⚠️ Attempt ${attempt} failed with error: ${lastError}`);
            if (attempt < MAX_RETRIES) {
                console.log(`   ⏳ Waiting 2 seconds before retry...`);
                await new Promise(res => setTimeout(res, 2000));
            }
         }
      }

      if (!success) throw new Error(`Segformer failed after ${MAX_RETRIES} attempts. Last Error: ${lastError}`);
      
      // Combine all segments EXCEPT background
      const bodySegments = segments.filter(s => !s.label.toLowerCase().includes('background'));

      const metadata = await sharp(req.file.buffer).metadata();
      const width = metadata.width!;
      const height = metadata.height!;

      let combinedMaskBuffer = await sharp({
        create: { width, height, channels: 3, background: { r: 0, g: 0, b: 0 } }
      }).png().toBuffer();

      for (const seg of bodySegments) {
        const maskBuf = Buffer.from(seg.mask, 'base64');
        const resizedMask = await sharp(maskBuf).resize(width, height, { fit: 'fill' }).greyscale().png().toBuffer();
        combinedMaskBuffer = await sharp(combinedMaskBuffer).composite([{ input: resizedMask, blend: 'add' as any }]).png().toBuffer();
      }

      const alphaMask = await sharp(combinedMaskBuffer)
        .greyscale()
        .resize(width, height)
        .blur(1.0)
        .raw()
        .toBuffer();
      
      const originalRGBA = await sharp(req.file.buffer).resize(width, height).ensureAlpha().raw().toBuffer();

      const resultRGBA = Buffer.from(originalRGBA);
      for (let p = 0; p < alphaMask.length; p++) {
        // If mask is dark, make pixel WHITE
        if (alphaMask[p] < 50) {
           resultRGBA[p * 4] = 255;     // R
           resultRGBA[p * 4 + 1] = 255; // G
           resultRGBA[p * 4 + 2] = 255; // B
           resultRGBA[p * 4 + 3] = 255; // A (Opaque)
        } else {
           // Blend edges with white
           const alpha = alphaMask[p] / 255;
           const invAlpha = 1 - alpha;
           resultRGBA[p * 4] = Math.round(resultRGBA[p * 4] * alpha + 255 * invAlpha);
           resultRGBA[p * 4 + 1] = Math.round(resultRGBA[p * 4 + 1] * alpha + 255 * invAlpha);
           resultRGBA[p * 4 + 2] = Math.round(resultRGBA[p * 4 + 2] * alpha + 255 * invAlpha);
           resultRGBA[p * 4 + 3] = 255; // Always opaque
        }
      }

      const finalBodyBuffer = await sharp(resultRGBA, { raw: { width, height, channels: 4 } })
        .jpeg({ quality: 90 }) // Save as JPEG since there's no transparency
        .toBuffer();

      console.log(`   ☁️ Uploading extracted full-body twin to Cloudinary...`);
      avatarUrl = await new Promise((resolve, reject) => {
         cloudinary.uploader.upload_stream({ folder: 'atla_avatars' }, (error, result) => {
            if (error || !result) return reject(error);
            resolve(result.secure_url);
         }).end(finalBodyBuffer);
      }) as string;

      console.log(`   ✅ Perfect Full-Body Twin with White Background extracted successfully!`);

      // ── STEP 2: Save the Segment Masks for Virtual Try-On ──
      console.log(`   🧠 Saving exact Body Segments for Future Try-Ons...`);
      
      // Save specific important body parts as base64 to the DB
      const importantLabels = ['upper-clothes', 'dress', 'pants', 'skirt', 'left-arm', 'right-arm', 'left-leg', 'right-leg', 'face', 'hair', 'left-shoe', 'right-shoe'];
      for (const seg of segments) {
         if (importantLabels.some(l => seg.label.toLowerCase().includes(l))) {
             savedMasks[seg.label] = seg.mask; // base64 mask
         }
      }
      
    } catch (hfError: any) {
      console.log(`   ⚠️ Background removal/segmentation failed: ${hfError.message}`);
      throw new Error(`AI Segmentation failed. Please try again with a clearer photo. Error: ${hfError.message}`);
    }

    // ── STEP 3: Save to Database ──
    await prisma.user.update({
      where: { id: userId as string },
      data: {
        digitalTwinUrl: avatarUrl,
        bodyMasks: savedMasks,
        poseKeypoints: { status: 'normalized', version: '1.0' }
      }
    });

    console.log(`   ✅ Digital Twin Data fully synchronized to Database!`);
    res.json({ success: true, twinUrl: avatarUrl, masks: savedMasks });

  } catch (error: any) {
    console.error('❌ Digital Twin Generation Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};
