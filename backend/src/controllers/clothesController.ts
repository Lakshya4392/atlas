import { Request, Response } from 'express';
import { Readable } from 'stream';
import crypto from 'crypto';
import prisma from '../config/prisma';
import cloudinary from '../config/cloudinary';
import { aiTagGarment } from '../services/aiTagService';

// ── Rate Limiter: 1 extraction at a time per user ──
const extractionLocks = new Map<string, number>();
const EXTRACTION_COOLDOWN_MS = 30_000;

function isRateLimited(userId: string): boolean {
  const lastTime = extractionLocks.get(userId);
  if (lastTime && Date.now() - lastTime < EXTRACTION_COOLDOWN_MS) return true;
  return false;
}

// ── Get single clothing item ──
export const getItem = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const item = await prisma.clothingItem.findUnique({ where: { id } });
    if (!item) return res.status(404).json({ success: false, error: 'Item not found' });
    res.json({ success: true, item });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ── Get all items for user ──
export const getAllItems = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const items = await prisma.clothingItem.findMany({
      where: { userId },
      orderBy: { lastWorn: 'desc' },
    });
    res.json({ success: true, items });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ── Add item ──
export const addItem = async (req: Request, res: Response) => {
  try {
    const { userId, name, category, color, brand, imageUrl, transparentImageUrl, pHash, tags } = req.body;

    // Check for duplicates by pHash
    if (pHash && userId) {
      const existing = await prisma.clothingItem.findFirst({ where: { pHash, userId } });
      if (existing) {
        return res.status(409).json({ success: false, error: 'Duplicate item', itemId: existing.id });
      }
    }

    const item = await prisma.clothingItem.create({
      data: {
        name: name || 'Clothing Item',
        category: category || 'tops',
        color: color || 'Unknown',
        brand: brand || 'Unknown',
        imageUrl: imageUrl || '',
        transparentImageUrl: transparentImageUrl || imageUrl || '',
        pHash: pHash || null,
        tags: tags || ['ai-extracted'],
        userId,
      },
    });
    res.json({ success: true, item });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// ── Update item ──
export const updateItem = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const item = await prisma.clothingItem.update({
      where: { id },
      data: req.body,
    });
    res.json({ success: true, item });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// ── Delete item ──
export const deleteItem = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.clothingItem.delete({ where: { id } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// ── Legacy flat-lay endpoint ──
export const flatlay = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image uploaded' });
    }

    const url: string = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'atla_closet' },
        (error, result) => {
          if (error || !result) return reject(new Error('Upload failed'));
          resolve(result.secure_url);
        }
      );
      Readable.from((req as any).file.buffer).pipe(stream);
    });

    res.json({ success: true, url });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ══════════════════════════════════════════════════════════════
// ── AI Wardrobe Extraction Pipeline ──
// Step 0: Duplicate detection (pHash)
// Step 1: HuggingFace RMBG background removal
// Step 2: Upload to Cloudinary
// Step 3: NVIDIA Vision posture check + optional FLUX.1 generation
// Step 4: Groq AI tagging
// ══════════════════════════════════════════════════════════════
export const extractClothing = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image uploaded' });
    }

    const userId = req.body.userId || 'anonymous';
    const imageBuffer = (req as any).file.buffer;

    console.log('\n👗 ═══ AI WARDROBE EXTRACTION PIPELINE ═══');
    console.log(`   User: ${userId}`);
    console.log(`   Image size: ${(imageBuffer.length / 1024).toFixed(0)} KB`);

    // ── STEP 0: System 2 - Duplicate Detection ──
    const pHash = crypto.createHash('sha256').update(imageBuffer).digest('hex');
    console.log(`   Hash: ${pHash.substring(0, 8)}...`);
    
    if (userId !== 'anonymous') {
      try {
        const existingItem = await prisma.clothingItem.findFirst({
          where: { pHash, userId }
        });

        if (existingItem) {
          console.log(`   🔍 Duplicate Detected! Returning cached item.`);
          return res.json({ 
            success: true, 
            items: [{ 
              url: existingItem.transparentImageUrl || existingItem.imageUrl, 
              tags: existingItem.tags,
              pHash: existingItem.pHash,
              isDuplicate: true,
              itemId: existingItem.id
            }] 
          });
        }
      } catch (dbErr: any) {
        console.log(`   ⚠️ DB check failed (continuing anyway): ${dbErr.message}`);
      }
    }

    // ── STEP 1: Background Removal (Local @imgly) ──
    console.log('   [1/4] 👔 Extracting CLOTHING ONLY (Local AI)...');
    let processedBuffer = imageBuffer;
    let bgRemoved = false;

    try {
      const sharpModule = await import('sharp');
      const sharp = sharpModule.default;
      const { removeBackground } = await import('@imgly/background-removal-node');
      
      console.log('   🔄 Running background removal locally...');
      const imgBlob = new Blob([imageBuffer], { type: 'image/jpeg' });
      const blob = await removeBackground(imgBlob);
      const arrayBuffer = await blob.arrayBuffer();
      const maskBuffer = Buffer.from(arrayBuffer);

      // Crop transparent edges
      const trimmedData = await sharp(maskBuffer)
        .trim({ threshold: 5 })
        .toBuffer({ resolveWithObject: true });

      const trimWidth = trimmedData.info.width;
      const trimHeight = trimmedData.info.height;

      // Add a clean light grey background
      processedBuffer = await sharp(trimmedData.data, { raw: { width: trimWidth, height: trimHeight, channels: 4 } })
        .extend({ top: 60, bottom: 60, left: 60, right: 60, background: { r: 245, g: 245, b: 245, alpha: 1 } })
        .flatten({ background: { r: 245, g: 245, b: 245 } })
        .png().toBuffer();

      bgRemoved = true;
      console.log(`   ✅ Clothing extracted locally! (${(processedBuffer.length / 1024).toFixed(0)} KB)`);
    } catch (e: any) {
      console.log(`   ⚠️ Local background removal failed: ${e.message}`);
      console.log('   ⚠️ Using original image as fallback.');
    }

    // ── STEP 2: Upload to Cloudinary ──
    console.log('   [2/4] ☁️ Uploading to Cloudinary...');
    const mimeType = bgRemoved ? 'image/png' : 'image/jpeg';
    const uploadUrl: string = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        `data:${mimeType};base64,${processedBuffer.toString('base64')}`, 
        { folder: 'atla_closet' }, 
        (err, result) => { 
          if (err || !result) {
            console.log(`   ❌ Cloudinary upload failed: ${err?.message || 'unknown'}`);
            return reject(new Error('Cloudinary upload failed'));
          }
          resolve(result.secure_url); 
        }
      );
    });
    console.log(`   ✅ Uploaded: ${uploadUrl.substring(0, 60)}...`);

    let finalImageUrl = uploadUrl;

    // ── STEP 3: Smart Routing Controller (Vision AI) ──
    console.log('   [3/4] 🧠 Analyzing posture & wrinkles...');
    const NVIDIA_KEY = process.env.EXPO_PUBLIC_NVIDIA_API_KEY;
    let needsGeneration = true;

    if (NVIDIA_KEY) {
      try {
        const checkRes = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${NVIDIA_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'meta/llama-3.2-90b-vision-instruct',
            messages: [{ role: 'user', content: [
              { type: 'text', text: 'Analyze this clothing item. Is it laid out relatively straight and flat (like a good product photo), or is it heavily wrinkled, crumpled, folded, or tilted? Reply with ONLY the word "STRAIGHT" if it is flat and good enough, or "CRUMPLED" if it needs to be artificially straightened.' },
              { type: 'image_url', image_url: { url: uploadUrl } }
            ]}],
            temperature: 0.1, max_tokens: 10,
          })
        });
        
        if (checkRes.ok) {
          const checkData = await checkRes.json() as any;
          const answer = checkData.choices[0].message.content.trim().toUpperCase();
          console.log(`   ⚖️ Controller Decision: ${answer}`);
          if (answer.includes('STRAIGHT')) {
            needsGeneration = false;
          }
        } else {
          console.log(`   ⚠️ NVIDIA returned ${checkRes.status}, skipping vision.`);
        }
      } catch (e: any) {
        console.log(`   ⚠️ Vision check failed: ${e.message}`);
      }
    } else {
      console.log(`   ⚠️ No NVIDIA key, skipping vision check.`);
      needsGeneration = false;
    }

    if (!needsGeneration) {
      console.log(`   ✨ Good posture. Using current image.`);
    } else {
      console.log(`   ✨ Needs improvement. Generating flat-lay...`);
      try {
        const visionRes = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${NVIDIA_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'meta/llama-3.2-90b-vision-instruct',
            messages: [{ role: 'user', content: [
              { type: 'text', text: 'Act as a Master Fashion Replica AI. Analyze this clothing item and describe it with MICRO-PRECISION so an image generator can recreate it 1:1. Describe the exact base color, fabric texture, and silhouette. Critically detail EVERY pattern, graphic, text, or logo. Ignore ALL background noise. Max 100 words.' },
              { type: 'image_url', image_url: { url: uploadUrl } }
            ]}],
            temperature: 0.1, max_tokens: 250,
          })
        });
        
        if (visionRes.ok) {
          const visionData = await visionRes.json() as any;
          const description = visionData.choices[0].message.content.trim();
          console.log(`   📝 Design: ${description.substring(0, 100)}...`);
          
          const prompt = `${description}, perfect 1:1 replica, single isolated clothing item, perfectly straight, professionally ironed flat-lay e-commerce product photo, studio lighting, pristine solid white background, high end fashion photography, photorealistic 8k, ultra-detailed textures, no extra objects, clean edges`;
          
          let fluxSuccess = false;
          if (process.env.VERTEX_PROJECT_ID && process.env.VERTEX_SERVICE_ACCOUNT_JSON) {
            try {
              console.log(`   🎨 Calling Vertex AI Imagen...`);
              const projectId = process.env.VERTEX_PROJECT_ID;
              const location = process.env.VERTEX_LOCATION || 'us-central1';
              const serviceAccountBase64 = process.env.VERTEX_SERVICE_ACCOUNT_JSON;
              
              const credentialsJson = Buffer.from(serviceAccountBase64, 'base64').toString('utf8');
              const credentials = JSON.parse(credentialsJson);
      
              const { GoogleAuth } = await import('google-auth-library');
              const axiosModule = await import('axios');
              const axios = axiosModule.default;
      
              const auth = new GoogleAuth({
                credentials,
                scopes: 'https://www.googleapis.com/auth/cloud-platform'
              });
      
              const client = await auth.getClient();
              const token = await client.getAccessToken();
      
              const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/imagen-3.0-generate-001:predict`;
              
              const response = await axios.post(url, {
                instances: [{ prompt: prompt }],
                parameters: { sampleCount: 1, aspectRatio: "1:1" }
              }, {
                headers: { Authorization: `Bearer ${token.token}` }
              });

              if (response.data && response.data.predictions && response.data.predictions[0] && response.data.predictions[0].bytesBase64Encoded) {
                const generatedBase64 = response.data.predictions[0].bytesBase64Encoded;
                const generatedBuf = Buffer.from(generatedBase64, 'base64');
                console.log(`   ✅ Vertex AI generated ${(generatedBuf.length / 1024).toFixed(0)} KB`);
                
                const genUrl: string = await new Promise((resolve, reject) => {
                  cloudinary.uploader.upload(
                    `data:image/png;base64,${generatedBase64}`, 
                    { folder: 'atla_closet' }, 
                    (err, result) => { 
                      if (err || !result) return reject(err);
                      resolve(result.secure_url); 
                    }
                  );
                });
                finalImageUrl = genUrl;
                fluxSuccess = true;
              }
            } catch (err: any) {
              console.warn('   ⚠️ Vertex AI Imagen failed:', err.response?.data || err.message);
            }
          }
          if (!fluxSuccess) console.log(`   ⚠️ Vertex AI failed, using current image.`);
        } else {
          console.log(`   ⚠️ NVIDIA Vision returned ${visionRes.status}`);
        }
      } catch (genErr: any) {
        console.log(`   ⚠️ Generative failed: ${genErr.message}`);
      }
    }

    // ── STEP 4: AI Tagging ──
    console.log('   [4/4] 🏷️ Generating AI tags...');
    const tags = await aiTagGarment(finalImageUrl);
    console.log(`   ✅ Tags: [${tags.category}] ${tags.name} (${tags.color})`);

    const extractedItems = [{ 
      url: finalImageUrl, 
      transparentImageUrl: finalImageUrl, 
      tags, 
      pHash, 
      isDuplicate: false 
    }];

    console.log('\n   ═══ PIPELINE COMPLETE ═══\n');
    return res.json({ success: true, items: extractedItems });

  } catch (error: any) {
    console.error('❌ Extraction Pipeline Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};
