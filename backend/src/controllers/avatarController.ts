import { Request, Response } from 'express';
import prisma from '../config/prisma';
import cloudinary from '../config/cloudinary';

export const generateDigitalTwin = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    
    let buffer: Buffer;
    let mimetype = 'image/jpeg';

    if (req.file) {
      buffer = req.file.buffer;
      mimetype = req.file.mimetype;
    } else if (req.body.image && req.body.image.startsWith('data:image')) {
      const parts = req.body.image.split(',');
      mimetype = parts[0].match(/:(.*?);/)[1];
      buffer = Buffer.from(parts[1], 'base64');
    } else {
      return res.status(400).json({ success: false, error: 'No image uploaded' });
    }
    
    console.log(`\n🧍‍♂️ ═══ AI DIGITAL TWIN GENERATION (GROQ VISION + IMGLY) ═══`);
    console.log(`   User: ${userId}`);
    
    try {
      const sharpModule = await import('sharp');
      const sharp = sharpModule.default;

      // STEP 1: Standardize to 3:4
      console.log(`   📏 Standardizing image to 3:4 Portrait Ratio (768x1024)...`);
      const processBuffer = await sharp(buffer)
        .resize(768, 1024, { fit: 'cover', position: 'top' })
        .jpeg({ quality: 90 })
        .toBuffer();

      // STEP 2: Validate with NVIDIA Vision (Llama 3.2 90B Vision)
      console.log(`   🔍 Validating with NVIDIA Llama Vision...`);
      const nvidiaKey = process.env.EXPO_PUBLIC_NVIDIA_API_KEY;
      if (!nvidiaKey) {
        throw new Error("EXPO_PUBLIC_NVIDIA_API_KEY is missing from .env");
      }

      // Compress for vision API (max 4MB base64)
      const compressedBuf = await sharp(processBuffer).resize(512, 682).jpeg({ quality: 60 }).toBuffer();
      const base64Img = compressedBuf.toString('base64');

      const nvidiaRes = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${nvidiaKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'meta/llama-3.2-90b-vision-instruct',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `You are a photo validator for a Virtual Try-On fashion app. Analyze this image and reply ONLY with valid JSON (no markdown, no code blocks).

Check:
1. Is there a clearly visible human person?
2. Is their face visible?
3. Is upper body (torso) visible?
4. Is lower body (legs/pants/skirt down to knees or below) visible?

Reply format:
{"hasPerson":true,"hasFace":true,"hasUpperBody":true,"hasLowerBody":true,"errorReason":""}`
                },
                {
                  type: 'image_url',
                  image_url: { url: `data:image/jpeg;base64,${base64Img}` }
                }
              ]
            }
          ],
          temperature: 0.1,
          max_tokens: 200,
        })
      });

      if (!nvidiaRes.ok) {
        const errText = await nvidiaRes.text();
        throw new Error(`NVIDIA Vision API failed (${nvidiaRes.status}): ${errText}`);
      }

      const nvidiaData = await nvidiaRes.json() as any;
      const responseText = nvidiaData.choices?.[0]?.message?.content;
      
      if (!responseText) throw new Error("Empty response from NVIDIA Vision");
      
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const validation = JSON.parse(cleanJson);

      console.log(`   🧐 Groq Vision Result:`, validation);

      if (!validation.hasPerson || !validation.hasFace || !validation.hasUpperBody) {
         throw new Error("VALIDATION_ERROR: " + (validation.errorReason || "No clear person detected. Please upload a clear photo of yourself."));
      }

      if (!validation.hasLowerBody) {
         throw new Error("VALIDATION_ERROR: Half-body photo detected! Please upload a full-body standing photo so you can try on outfits accurately.");
      }

      console.log(`   ✅ Pose & Body Validation Passed!`);

      // STEP 3: Remove Background via HuggingFace RMBG-2.0 (cloud, no crash)
      console.log(`   ✂️ Removing background via HF RMBG-2.0...`);
      const hfToken = process.env.HF_TOKEN || process.env.HF_TOKEN_2 || process.env.HF_TOKEN_3;
      if (!hfToken) throw new Error("HF_TOKEN missing in .env for background removal");

      let bgRemovedBuffer: Buffer | null = null;
      for (let attempt = 1; attempt <= 4; attempt++) {
        try {
          const bgRes = await fetch('https://router.huggingface.co/hf-inference/models/briaai/RMBG-2.0', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${hfToken}`,
              'Content-Type': 'image/jpeg',
            },
            body: processBuffer,
          });
          if (!bgRes.ok) {
            const errText = await bgRes.text();
            throw new Error(`RMBG API error (${bgRes.status}): ${errText}`);
          }
          bgRemovedBuffer = Buffer.from(await bgRes.arrayBuffer());
          console.log(`   ✅ Background Removed! (${(bgRemovedBuffer.length/1024).toFixed(0)} KB)`);
          break;
        } catch (err: any) {
          if (attempt < 4) {
            console.log(`   ⏳ RMBG model warming up... (attempt ${attempt}/4)`);
            await new Promise(r => setTimeout(r, 5000));
          } else {
            throw new Error(`Background removal failed: ${err.message}`);
          }
        }
      }

      // STEP 4: Upload transparent avatar to Cloudinary
      console.log(`   ☁️ Uploading to Cloudinary...`);
      const uploadResult = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: 'atlas/avatars', format: 'png' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(bgRemovedBuffer);
      });

      const avatarUrl = uploadResult.secure_url;
      console.log(`   ✅ Upload Done: ${avatarUrl}`);

      // STEP 5: Save to DB
      await prisma.user.update({
        where: { id: userId },
        data: { digitalTwinUrl: avatarUrl }
      });

      console.log(`   ✅ Digital Twin Complete!\n`);
      return res.json({ success: true, twinUrl: avatarUrl });

    } catch (error: any) {
      console.error('❌ Digital Twin Error:', error.message);
      return res.status(500).json({ success: false, error: error.message });
    }
  } catch (error) {
    console.error('❌ General Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to generate Digital Twin' });
  }
};
