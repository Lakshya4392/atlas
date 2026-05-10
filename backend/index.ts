import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import Replicate from 'replicate';
import { fal } from '@fal-ai/client';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { Readable } from 'stream';
import bcrypt from 'bcryptjs';
import fashionRoutes from './src/routes/fashion';

const prisma = new PrismaClient();
const app = express();
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// fal.ai config for virtual try-on
fal.config({
  credentials: process.env.FAL_KEY,
});

if (process.env.REPLICATE_API_TOKEN) {
  console.log('✅ Replicate Token Loaded (starts with:', process.env.REPLICATE_API_TOKEN.substring(0, 5), '...)');
} else {
  console.log('❌ Replicate Token MISSING in .env');
}

app.use(cors());
app.use(express.json());

// ── Fashion Search Routes ──
app.use('/api/fashion', fashionRoutes);

// ── Cloudinary Config ──
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Multer Config (Memory Storage) ──
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ── Request Logger (so you can see every request in your terminal) ──
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url} → ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// ── Health Check ──
app.get('/api/test', async (req, res) => {
  try {
    const userCount = await prisma.user.count();
    res.json({
      success: true,
      message: 'Alta Daily Backend is live and connected to Neon PostgreSQL!',
      usersCount: userCount,
    });
  } catch (error: any) {
    console.error('Database connection failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ── Register ──
app.post('/api/register', async (req, res) => {
  try {
    const { email, name, password } = req.body;
    console.log(`📝 Registration attempt: name="${name}", email="${email}"`);

    if (!email || !name || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password are required' });
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: { email, name, password: hashedPassword, style: 'Minimalist' },
    });
    console.log(`✅ User created successfully: ${user.id}`);
    
    // Don't send password back to client
    const { password: _, ...userWithoutPassword } = user;
    res.json({ success: true, user: userWithoutPassword });
  } catch (error: any) {
    console.error('❌ Registration failed:', error.message);
    res.status(400).json({ success: false, error: error.message });
  }
});

// ── Login ──
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`🔑 Login attempt: email="${email}"`);

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (!user.password) {
      return res.status(400).json({ success: false, error: 'Invalid login method for this user' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    console.log(`✅ Login successful: ${user.name}`);
    
    const { password: _, ...userWithoutPassword } = user;
    res.json({ success: true, user: userWithoutPassword });
  } catch (error: any) {
    console.error('❌ Login failed:', error.message);
    res.status(400).json({ success: false, error: error.message });
  }
});

// ── Get single clothing item detail ──
app.get('/api/clothes/item/:id', async (req, res) => {
  try {
    const item = await prisma.clothingItem.findUnique({
      where: { id: req.params.id },
    });
    if (!item) return res.status(404).json({ success: false, error: 'Item not found' });
    res.json({ success: true, item });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ── Get all clothing items for a user ──
app.get('/api/clothes/:userId', async (req, res) => {
  try {
    const items = await prisma.clothingItem.findMany({
      where: { userId: req.params.userId },
    });
    res.json({ success: true, items });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ── Get all outfits for a user ──
app.get('/api/outfits/:userId', async (req, res) => {
  try {
    const outfits = await prisma.outfit.findMany({
      where: { userId: req.params.userId },
      include: { items: { include: { clothingItem: true } } },
    });
    res.json({ success: true, outfits });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ── Save AI-Generated Outfit ──
app.post('/api/outfits', async (req, res) => {
  try {
    const { userId, name, occasion, itemIds, aiGenerated, weather, imageUrl } = req.body;
    if (!userId || !name) {
      return res.status(400).json({ success: false, error: 'userId and name are required' });
    }
    const outfit = await prisma.outfit.create({
      data: {
        userId,
        name,
        occasion: occasion || 'Casual',
        aiGenerated: aiGenerated || false,
        weather: weather || '',
        imageUrl: imageUrl || null,
        ...(itemIds && itemIds.length > 0 ? {
          items: {
            create: itemIds.map((id: string) => ({ clothingItemId: id })),
          }
        } : {})
      },
      include: { items: { include: { clothingItem: true } } },
    });
    res.json({ success: true, outfit });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ── Get User Stats ──
app.get('/api/user/:userId/stats', async (req, res) => {
  try {
    const { userId } = req.params;
    const [user, clothesCount, outfitsCount, favorites] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.clothingItem.count({ where: { userId } }),
      prisma.outfit.count({ where: { userId } }),
      prisma.clothingItem.count({ where: { userId, favorite: true } }),
    ]);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({
      success: true,
      stats: {
        clothesCount,
        outfitsCount,
        favoritesCount: favorites,
        streak: user.streak,
        level: user.level,
        style: user.style,
      },
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ── Update Clothing Item (favorite, wearCount) ──
app.patch('/api/clothes/:id', async (req, res) => {
  try {
    const { favorite, wearCount } = req.body;
    const item = await prisma.clothingItem.update({
      where: { id: req.params.id },
      data: {
        ...(favorite !== undefined && { favorite }),
        ...(wearCount !== undefined && { wearCount }),
        ...(wearCount !== undefined && { lastWorn: new Date() }),
      },
    });
    res.json({ success: true, item });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ── Delete Clothing Item ──
app.delete('/api/clothes/:id', async (req, res) => {
  try {
    await prisma.clothingItem.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ── Upload to Cloudinary ──
app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    // Convert buffer to stream for Cloudinary
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'atla_wardrobe' },
      (error, result) => {
        if (error) return res.status(500).json({ success: false, error: error.message });
        res.json({ success: true, url: result?.secure_url });
      }
    );

    Readable.from((req as any).file.buffer).pipe(stream);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ══════════════════════════════════════════════════════════════
// ── AI Wardrobe Extraction Pipeline (Cloudinary + HuggingFace) ──
// Step 1: Cloudinary background removal
// Step 2: HuggingFace clothing segmentation (segformer_b2_clothes)
// Step 3: HuggingFace image enhancement (flat-lay)
// Step 4: Gemini AI tagging (name, color, category, brand)
// ══════════════════════════════════════════════════════════════

// ── Rate Limiter: 1 extraction at a time per user ──
const extractionLocks = new Map<string, number>(); // userId -> timestamp
const EXTRACTION_COOLDOWN_MS = 30_000; // 30 second cooldown between requests

function isRateLimited(userId: string): boolean {
  const lastTime = extractionLocks.get(userId);
  if (lastTime && Date.now() - lastTime < EXTRACTION_COOLDOWN_MS) return true;
  return false;
}

// ── Helper: Call HuggingFace Inference API ──
async function callHuggingFace(model: string, imageBuffer: Buffer, hfToken: string): Promise<Buffer> {
  const url = `https://router.huggingface.co/hf-inference/models/${model}`;
  console.log(`   🔗 HF calling: ${url}`);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${hfToken}`,
    },
    body: imageBuffer,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`HF error (${response.status}): ${errText.substring(0, 200)}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

// ── Helper: AI Tag via Groq (Llama 3.2 Vision) ──
async function aiTagGarment(imageUrl: string): Promise<{ name: string; category: string; color: string; brand: string }> {
  const GROQ_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;
  if (!GROQ_KEY) {
    console.log('   ⚠️ No Groq key, using fallback tags');
    return { name: 'Clothing Item', category: 'tops', color: 'Unknown', brand: 'Unknown' };
  }

  try {
    console.log('   🔗 Calling Groq Vision API...');
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: imageUrl },
              },
              {
                type: 'text',
                text: `You are a fashion AI. Analyze this clothing item image and return ONLY a valid JSON object with these exact keys:
{
  "name": "descriptive name of the garment, e.g. 'Navy Blue Slim Fit Chinos'",
  "category": "one of: tops, bottoms, outerwear, shoes, accessories, dresses, activewear",
  "color": "primary color, e.g. 'Navy Blue'",
  "brand": "brand name if visible, otherwise 'Unknown'"
}
Return ONLY the JSON, no markdown, no explanation.`
              }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 200,
      }),
    });

    if (!groqRes.ok) {
      const errBody = await groqRes.text();
      console.error(`   ⚠️ Groq HTTP ${groqRes.status}: ${errBody.substring(0, 200)}`);
      throw new Error('Groq API failed');
    }

    const groqData = await groqRes.json();
    const text = groqData?.choices?.[0]?.message?.content || '';
    console.log(`   📝 Groq response: ${text.substring(0, 150)}`);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e: any) {
    console.error('   ⚠️ Groq tagging failed:', e.message);
  }
  return { name: 'Clothing Item', category: 'tops', color: 'Unknown', brand: 'Unknown' };
}

// ── Main Extraction Endpoint ──
app.post('/api/clothes/extract', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image uploaded' });
    }

    const userId = req.body.userId || 'anonymous';

    // ── Rate limit check ──
    if (isRateLimited(userId)) {
      const remaining = Math.ceil((EXTRACTION_COOLDOWN_MS - (Date.now() - (extractionLocks.get(userId) || 0))) / 1000);
      return res.status(429).json({
        success: false,
        error: `Please wait ${remaining}s before extracting another item. This protects against API limits.`,
        retryAfter: remaining,
      });
    }
    extractionLocks.set(userId, Date.now());

    console.log('\n👗 ═══ AI WARDROBE EXTRACTION PIPELINE ═══');
    console.log(`   User: ${userId}`);

    const imageBuffer = (req as any).file.buffer;
    console.log(`   Image size: ${(imageBuffer.length / 1024).toFixed(0)} KB`);

    // ── STEP 1: Clothing Segmentation + Extraction ──
    console.log('   [1/3] 👔 Extracting clothing (HF Segformer + Sharp)...');

    let clothingBuffer: Buffer;
    const MAX_RETRIES = 3;
    const hfTokens = [];
    if (process.env.HF_TOKEN) hfTokens.push(process.env.HF_TOKEN);
    if (process.env.HF_TOKEN_2) hfTokens.push(process.env.HF_TOKEN_2);
    if (process.env.HF_TOKEN_3) hfTokens.push(process.env.HF_TOKEN_3);

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const currentToken = hfTokens[(attempt - 1) % hfTokens.length] || '';
        console.log(`   🔄 Attempt ${attempt}/${MAX_RETRIES} (Using Token ${(attempt - 1) % hfTokens.length + 1})...`);
        const sharpModule = await import('sharp');
        const sharp = sharpModule.default;

        // Call HuggingFace segformer via raw API (SDK mask format is broken)
        console.log('   📡 Calling HuggingFace segformer_b2_clothes...');
        const segRes = await fetch('https://router.huggingface.co/hf-inference/models/mattmdjaga/segformer_b2_clothes', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${currentToken}`,
            'Content-Type': 'image/jpeg',
          },
          body: imageBuffer,
        });

        if (!segRes.ok) {
          const errText = await segRes.text();
          throw new Error(`HF API error (${segRes.status}): ${errText.substring(0, 200)}`);
        }

        const segments = await segRes.json();
        console.log(`   📊 Got ${segments.length} segments: ${segments.map((s: any) => s.label).join(', ')}`);

        // Keep ONLY clothing labels
        const clothingLabels = [
          'upper-clothes', 'lower-clothes', 'skirt', 'pants', 'dress',
          'belt', 'left-shoe', 'right-shoe', 'hat', 'bag', 'scarf',
        ];

        const clothingSegments = segments.filter((s: any) =>
          clothingLabels.some(label => s.label.toLowerCase().includes(label.toLowerCase()))
        );

        if (clothingSegments.length === 0) {
          throw new Error('No clothing detected in image. Try a clearer photo.');
        }

        // Smart Extraction: ONLY extract individual items (Top and Bottom separately)
        // No more "Full Outfit" combined slide unless it can't be separated.
        const upperLabels = ['upper-clothes', 'dress', 'shirt', 'jacket', 'coat', 'top'];
        const lowerLabels = ['pants', 'lower-clothes', 'skirt', 'shorts', 'left-leg', 'right-leg', 'belt'];
        
        const itemsToProcess: any[][] = [];
        
        const upperSegs = clothingSegments.filter((s: any) => upperLabels.some(l => s.label.toLowerCase().includes(l)));
        const lowerSegs = clothingSegments.filter((s: any) => lowerLabels.some(l => s.label.toLowerCase().includes(l)));
        
        if (upperSegs.length > 0) itemsToProcess.push(upperSegs);
        if (lowerSegs.length > 0) itemsToProcess.push(lowerSegs);
        
        // Fallback: If AI couldn't classify it as top or bottom, just process the whole thing
        if (itemsToProcess.length === 0) {
          itemsToProcess.push(clothingSegments);
        }

        console.log(`   👕 Detected ${itemsToProcess.length} distinct garment items to extract.`);

        const metadata = await sharp(imageBuffer).metadata();
        const width = metadata.width!;
        const height = metadata.height!;

        const extractedItems = [];

        // Process each clothing item group
        for (let i = 0; i < itemsToProcess.length; i++) {
          const itemSegments = itemsToProcess[i];
          console.log(`\n   --- Processing Item ${i + 1}/${itemsToProcess.length} ---`);

          // 1. Combine masks for this specific item
          let combinedMaskBuffer = await sharp({
            create: { width, height, channels: 3, background: { r: 0, g: 0, b: 0 } }
          }).png().toBuffer();

          for (const seg of itemSegments) {
            const maskBuf = Buffer.from(seg.mask, 'base64');
            const resizedMask = await sharp(maskBuf).resize(width, height, { fit: 'fill' }).greyscale().png().toBuffer();
            combinedMaskBuffer = await sharp(combinedMaskBuffer).composite([{ input: resizedMask, blend: 'add' as any }]).png().toBuffer();
          }

          // Blur the mask slightly for smooth anti-aliased (feathered) edges
          const alphaMask = await sharp(combinedMaskBuffer)
            .greyscale()
            .resize(width, height)
            .blur(1.5) // Soften mask edges for a premium studio look
            .raw()
            .toBuffer();
          
          const originalRGBA = await sharp(imageBuffer).resize(width, height).ensureAlpha().raw().toBuffer();

          const resultRGBA = Buffer.from(originalRGBA);
          for (let p = 0; p < alphaMask.length; p++) {
            // Apply smooth transparency instead of harsh jagged edges
            resultRGBA[p * 4 + 3] = alphaMask[p];
          }

          // First, trim transparent pixels and get the bounding box size
          const trimmedData = await sharp(resultRGBA, { raw: { width, height, channels: 4 } })
            .trim({ threshold: 5 })
            .toBuffer({ resolveWithObject: true });

          const trimWidth = trimmedData.info.width;
          const trimHeight = trimmedData.info.height;

          // Smart Noise Rejection: Prevent false positives (like AI detecting a shadow as a shirt)
          // If the item (Slide 2 or 3) takes up less than 5% of the total image area, discard it.
          if (i > 0 && (trimWidth * trimHeight) < (width * height * 0.05)) {
             console.log(`   ⚠️ Item ${i + 1} is tiny noise (${trimWidth}x${trimHeight}), skipping to prevent false positive.`);
             continue;
          }

          let clothingBuffer = await sharp(trimmedData.data, { raw: { width: trimWidth, height: trimHeight, channels: 4 } })
            .extend({ top: 80, bottom: 80, left: 80, right: 80, background: { r: 245, g: 245, b: 245, alpha: 1 } })
            .flatten({ background: { r: 245, g: 245, b: 245 } })
            .png().toBuffer();

          if (clothingBuffer.length < 500) {
             console.log(`   ⚠️ Item ${i + 1} extraction failed (too small), skipping.`);
             continue;
          }

          // 2. Smart Routing Controller (Vision AI decides if Generative Ironing is needed)
          console.log(`   🧠 Item ${i + 1}: Analyzing posture & wrinkles...`);
          let needsGeneration = true; // Default to true (assume it needs ironing)
          const NVIDIA_KEY = process.env.EXPO_PUBLIC_NVIDIA_API_KEY;
          const base64Img = `data:image/png;base64,${clothingBuffer.toString('base64')}`;

          try {
            const checkRes = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${NVIDIA_KEY}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                model: 'meta/llama-3.2-90b-vision-instruct',
                messages: [{ role: 'user', content: [
                  { type: 'text', text: 'Analyze this clothing item. Is it laid out relatively straight and flat (like a good product photo), or is it heavily wrinkled, crumpled, folded, or tilted? Reply with ONLY the word "STRAIGHT" if it is flat and good enough, or "CRUMPLED" if it needs to be artificially straightened.' },
                  { type: 'image_url', image_url: { url: base64Img } }
                ]}],
                temperature: 0.1, max_tokens: 10,
              })
            });
            
            if (checkRes.ok) {
               const checkData = await checkRes.json();
               const answer = checkData.choices[0].message.content.trim().toUpperCase();
               console.log(`   ⚖️ Controller Decision: ${answer}`);
               if (answer.includes('STRAIGHT')) {
                  needsGeneration = false;
               }
            }
          } catch (e) {
             console.log(`   ⚠️ Controller failed, defaulting to Generative.`);
          }

          if (!needsGeneration) {
             console.log(`   ✨ Item ${i + 1}: Good posture detected. Using 100% Original Pixels (Local Polish)...`);
             try {
                const sharpModule = await import('sharp');
                const sharp = sharpModule.default;
                clothingBuffer = await sharp(clothingBuffer)
                  .sharpen({ sigma: 0.5, m1: 0.2, m2: 0.2, x1: 2, y2: 10, y3: 20 })
                  .toBuffer();
             } catch(err) {
                console.log(`   ⚠️ Local Polish failed, using original buffer.`);
             }
          } else {
            console.log(`   ✨ Item ${i + 1}: Needs ironing. Proceeding to Generative Flat-Lay...`);
            try {
              const visionRes = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${NVIDIA_KEY}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  model: 'meta/llama-3.2-90b-vision-instruct',
                  messages: [{ role: 'user', content: [
                    { type: 'text', text: 'Act as a Master Fashion Replica AI. Analyze this clothing item and describe it with MICRO-PRECISION so an image generator can recreate it 1:1. Describe the exact base color, fabric texture, and silhouette. Critically detail EVERY pattern, graphic, text, or logo, including their EXACT placement, scale, colors, and spacing (e.g., "small black bamboo leaves on the lower left", "thick white stripes on collar"). Mention pockets, buttons, or stitching depth. Ignore ALL background noise. Max 100 words.' },
                    { type: 'image_url', image_url: { url: base64Img } }
                  ]}],
                  temperature: 0.1, max_tokens: 250,
                })
              });
              
              if (visionRes.ok) {
                const visionData = await visionRes.json();
                const description = visionData.choices[0].message.content.trim();
                console.log(`   📝 Target Design (NVIDIA): ${description}`);
                
                const prompt = `${description}, perfect 1:1 replica, single isolated clothing item, perfectly straight, professionally ironed flat-lay e-commerce product photo, studio lighting, pristine solid white background, high end fashion photography, photorealistic 8k, ultra-detailed textures, no extra objects, clean edges`;
                
                let fluxSuccess = false;
                for (let tIndex = 0; tIndex < hfTokens.length; tIndex++) {
                  try {
                    console.log(`   🎨 Calling FLUX.1 (Token ${tIndex + 1})...`);
                    const fluxRes = await fetch('https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell', {
                      method: 'POST',
                      headers: { 'Authorization': `Bearer ${hfTokens[tIndex]}`, 'Content-Type': 'application/json' },
                      body: JSON.stringify({ inputs: prompt })
                    });

                    if (fluxRes.ok) {
                      const generatedBuf = Buffer.from(await fluxRes.arrayBuffer());
                      if (generatedBuf.length > 1000) {
                        clothingBuffer = generatedBuf;
                        fluxSuccess = true;
                        break;
                      }
                    } else {
                       console.log(`   ⚠️ FLUX Token ${tIndex + 1} rejected.`);
                    }
                  } catch (e) {
                     console.log(`   ⚠️ FLUX Token ${tIndex + 1} error.`);
                  }
                }
                if (!fluxSuccess) console.log(`   ⚠️ All FLUX tokens failed, using original.`);
              }
            } catch (genErr) {
              console.log(`   ⚠️ Item ${i + 1}: Generative failed, using original.`);
            }
          }

          // 3. Upload & Tag
          console.log(`   ☁️ Uploading Item ${i + 1}...`);
          const finalUrl: string = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload(`data:image/png;base64,${clothingBuffer.toString('base64')}`, 
              { folder: 'atla_closet', transformation: [{ quality: 'auto', fetch_format: 'auto' }] }, 
              (err, result) => { if (err || !result) reject(err); else resolve(result.secure_url); }
            );
          });

          console.log(`   🏷️ Tagging Item ${i + 1}...`);
          const tags = await aiTagGarment(finalUrl);
          
          extractedItems.push({ url: finalUrl, tags });
        }

        if (extractedItems.length === 0) throw new Error('Failed to process any items from the image');

        console.log('\n   ═══ PIPELINE COMPLETE ═══\n');
        return res.json({ success: true, items: extractedItems });

      } catch (segErr: any) {
        console.log(`   ⚠️ Attempt ${attempt} failed: ${segErr.message}`);
        if (attempt === MAX_RETRIES) throw new Error(`Extraction failed: ${segErr.message}`);
        await new Promise(r => setTimeout(r, 5000));
      }
    }
  } catch (error: any) {
    console.error('❌ Extraction Pipeline Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ── Legacy flat-lay endpoint (redirects to extract) ──
app.post('/api/clothes/flatlay', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image uploaded' });
    }

    // Upload raw to Cloudinary and return URL (simple fallback)
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
});

// ── Add New Clothing Item ──
app.post('/api/clothes', async (req, res) => {
  try {
    const { userId, name, category, color, brand, imageUrl, tags } = req.body;
    
    if (!userId || !name || !imageUrl) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const item = await prisma.clothingItem.create({
      data: {
        userId,
        name,
        category,
        color,
        brand,
        imageUrl,
        tags: tags || [],
      },
    });

    res.json({ success: true, item });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ══════════════════════════════════════════════════
// ── Smart Outfit Search Pipeline v2 ──
// Priority: User's Closet → Cached DB (by category) → Live SerpAPI
// Every result gets cached with category tag
// ══════════════════════════════════════════════════
app.post('/api/outfit/search-items', async (req, res) => {
  try {
    const { userId, queries } = req.body;
    
    if (!queries || !Array.isArray(queries) || queries.length === 0) {
      return res.status(400).json({ success: false, error: 'queries array is required' });
    }

    console.log(`\n🔍 ═══ Outfit Pipeline v2 ═══`);
    console.log(`   User: ${userId || 'anonymous'}`);
    console.log(`   Items to find: ${queries.length}`);

    const results = await Promise.all(queries.map(async (q: any, idx: number) => {
      const searchTerm = q.searchQuery || q.name || 'fashion item';
      const category = q.category || q.type || 'unknown';
      const closetItemId = q.closetItemId || '';
      
      console.log(`\n  [${idx + 1}/${queries.length}] ${category.toUpperCase()}: "${q.name}"`);

      try {
        // ═══ LEVEL 1: USER'S OWN CLOSET ═══
        if (userId && closetItemId) {
          const closetItem = await prisma.clothingItem.findUnique({
            where: { id: closetItemId },
          });
          if (closetItem && closetItem.imageUrl) {
            console.log(`    ✅ L1 CLOSET HIT: "${closetItem.name}"`);
            return {
              type: q.type, category, name: closetItem.name, reason: q.reason,
              imageUrl: closetItem.imageUrl, title: closetItem.name,
              brand: closetItem.brand || '', price: '', link: '',
              source: 'from_closet', closetItemId: closetItem.id,
            };
          }
        }
        
        // Fuzzy closet match by category + color
        if (userId) {
          const colorWords = searchTerm.split(' ').filter((w: string) => 
            ['black','white','blue','navy','brown','grey','gray','red','green','beige','khaki','pink'].includes(w.toLowerCase())
          );
          const closetMatch = await prisma.clothingItem.findFirst({
            where: {
              userId,
              AND: [
                { category: { contains: category, mode: 'insensitive' } },
                ...(colorWords.length > 0 ? [{ color: { contains: colorWords[0], mode: 'insensitive' as any } }] : []),
              ],
            },
          });
          if (closetMatch && closetMatch.imageUrl) {
            console.log(`    ✅ L1 CLOSET FUZZY: "${closetMatch.name}"`);
            return {
              type: q.type, category, name: closetMatch.name, reason: q.reason + ' (from your closet!)',
              imageUrl: closetMatch.imageUrl, title: closetMatch.name,
              brand: closetMatch.brand || '', price: '', link: '',
              source: 'from_closet', closetItemId: closetMatch.id,
            };
          }
        }

        // ═══ LEVEL 2: CACHED PRODUCTS DB ═══
        let cached = await prisma.cachedProduct.findMany({ where: { query: searchTerm }, take: 5 });

        if (cached.length === 0) {
          const keywords = searchTerm.split(' ').filter((w: string) => w.length > 3 && !['mens','womens'].includes(w.toLowerCase()));
          if (keywords.length > 0) {
            cached = await prisma.cachedProduct.findMany({
              where: { AND: keywords.slice(0, 2).map((word: string) => ({ title: { contains: word, mode: 'insensitive' as any } })) },
              take: 5,
            });
          }
        }
        
        if (cached.length === 0 && category !== 'unknown') {
          cached = await prisma.cachedProduct.findMany({ where: { category }, take: 10 });
          cached = cached.sort(() => 0.5 - Math.random());
        }

        if (cached.length > 0) {
          const best = cached[0];
          console.log(`    ✅ L2 CACHE: "${best.title}"`);
          return {
            type: q.type, category, name: q.name || best.title, reason: q.reason,
            imageUrl: best.thumbnail, title: best.title, brand: best.brand,
            price: best.price, link: best.link, source: 'from_cache',
          };
        }

        // ═══ LEVEL 3: LIVE SERPAPI ═══
        console.log(`    🌐 L3 SERPAPI: "${searchTerm}"...`);
        const { searchFashionProducts } = await import('./src/services/serpApiService');
        const apiResults = await searchFashionProducts(searchTerm);
        
        if (apiResults.length > 0) {
          try {
            await prisma.cachedProduct.createMany({
              data: apiResults.slice(0, 10).map((r: any) => ({
                query: searchTerm, category,
                title: r.title || '', brand: r.brand || '', price: r.price || '',
                thumbnail: r.thumbnail || '', link: r.link || '', source: r.source || '',
              })),
              skipDuplicates: true,
            });
            console.log(`    📦 Cached ${Math.min(apiResults.length, 10)} under "${category}"`);
          } catch (e) { /* non-fatal */ }

          const best = apiResults[0];
          console.log(`    ✅ L3 API: "${best.title}"`);
          return {
            type: q.type, category, name: q.name || best.title, reason: q.reason,
            imageUrl: best.thumbnail, title: best.title, brand: best.brand,
            price: best.price, link: best.link, source: 'from_api',
          };
        }

        // ═══ LEVEL 4: TYPE FALLBACK ═══
        const typeKw = q.type === 'top' ? 'shirt' : q.type === 'bottom' ? 'pants' : q.type === 'footwear' ? 'shoes' : 'watch';
        const fallback = await prisma.cachedProduct.findFirst({ where: { title: { contains: typeKw, mode: 'insensitive' as any } } });
        if (fallback) {
          console.log(`    ⚠️ L4 FALLBACK: "${fallback.title}"`);
          return {
            type: q.type, category, name: q.name || fallback.title, reason: q.reason,
            imageUrl: fallback.thumbnail, title: fallback.title, brand: fallback.brand,
            price: fallback.price, link: fallback.link, source: 'from_fallback',
          };
        }

        console.log(`    ✗ NO MATCH`);
        return { type: q.type, category, name: q.name, reason: q.reason, imageUrl: null, title: q.name, brand: '', price: '', link: '', source: 'none' };

      } catch (err: any) {
        console.error(`    ✗ ERROR: ${err.message}`);
        return { type: q.type, category, name: q.name, reason: q.reason, imageUrl: null, title: q.name, brand: '', price: '', link: '', source: 'error' };
      }
    }));

    const closetN = results.filter(r => r.source === 'from_closet').length;
    const cacheN = results.filter(r => r.source === 'from_cache').length;
    const apiN = results.filter(r => r.source === 'from_api').length;
    console.log(`\n✅ Pipeline Done: ${closetN} closet | ${cacheN} cache | ${apiN} API | ${results.filter(r => !r.imageUrl).length} missing\n`);
    
    res.json({ success: true, items: results });
  } catch (error: any) {
    console.error('❌ Outfit search pipeline failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ── Start Server ──
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Update user avatar
app.put('/api/user/:id/avatar', async (req, res) => {
  const { id } = req.params;
  const { avatarUrl } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id },
      data: { avatar: avatarUrl } as any,
    });
    res.json({ success: true, user });
  } catch (error) {
    console.error('Update avatar error:', error);
    res.status(500).json({ success: false, error: 'Failed to update avatar' });
  }
});

// ── Update User Preferred Brands ──
app.put('/api/user/:id/brands', async (req, res) => {
  const { id } = req.params;
  const { brands } = req.body; // Expects an array of strings
  
  if (!Array.isArray(brands)) {
    return res.status(400).json({ success: false, error: 'brands must be an array of strings' });
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data: { preferredBrands: brands },
    });
    res.json({ success: true, user });
  } catch (error: any) {
    console.error('Update brands error:', error);
    res.status(500).json({ success: false, error: 'Failed to update preferred brands' });
  }
});

// ── Complete Onboarding Data ──
app.put('/api/user/:id/onboarding', async (req, res) => {
  const { id } = req.params;
  const { occupation, wearPreference, hearSource, brands } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id },
      data: { 
        ...(occupation !== undefined && { occupation }),
        ...(wearPreference !== undefined && { wearPreference }),
        ...(hearSource !== undefined && { hearSource }),
        ...(brands && { preferredBrands: brands })
      },
    });
    res.json({ success: true, user });
  } catch (error: any) {
    console.error('Update onboarding error:', error);
    res.status(500).json({ success: false, error: 'Failed to save onboarding data' });
  }
});

// AI Virtual Try-On Endpoint — Hugging Face IDM-VTON Pipeline (FREE)
app.post('/api/try-on', async (req, res) => {
  const { garm_img, human_img, description } = req.body;
  
  const tokens = [];
  if (process.env.HF_TOKEN) tokens.push(process.env.HF_TOKEN);
  if (process.env.HF_TOKEN_2) tokens.push(process.env.HF_TOKEN_2);
  if (process.env.HF_TOKEN_3) tokens.push(process.env.HF_TOKEN_3);

  if (tokens.length === 0) {
    return res.status(400).json({ success: false, error: 'Hugging Face Token not configured. Add HF_TOKEN in .env' });
  }
  if (!garm_img || !human_img) {
    return res.status(400).json({ success: false, error: 'garm_img and human_img are required' });
  }

  try {
    console.log('🚀 Hugging Face IDM-VTON Try-On Pipeline Starting...');
    const { Client } = await import('@gradio/client');

    // Step 1: Fetch images and convert to Blobs
    console.log('📥 Fetching input images...');
    const humanRes = await fetch(human_img);
    const humanBlob = await humanRes.blob();

    const garmRes = await fetch(garm_img);
    const garmBlob = await garmRes.blob();

    let result = null;
    let lastError = null;
    let success = false;

    // Step 2: Try-On Fallback System Loop
    for (let i = 0; i < tokens.length; i++) {
      try {
        let isBottom = false;
        const lowerDesc = (description || '').toLowerCase();
        if (lowerDesc.match(/pant|jean|short|skirt|bottom|trouser|legging/)) {
          isBottom = true;
        }

        if (isBottom) {
          console.log(`🔑 [Token ${i + 1}/${tokens.length}] Bottom garment detected. Routing to levihsu/OOTDiffusion...`);
          const client = await Client.connect("levihsu/OOTDiffusion", { hf_token: tokens[i] });
          
          console.log(`🎨 Generating Lower-Body Try-On...`);
          // OOTDiffusion typically takes vton_img, garm_img, category, n_samples, n_steps, image_scale, seed
          result = await client.predict("/process_dc", {
            vton_img: humanBlob,
            garm_img: garmBlob,
            category: "Lower-body",
            n_samples: 1,
            n_steps: 20,
            image_scale: 2,
            seed: -1,
          }) as any;
        } else {
          console.log(`🔑 [Token ${i + 1}/${tokens.length}] Top garment detected. Routing to yisol/IDM-VTON...`);
          const client = await Client.connect("yisol/IDM-VTON", { hf_token: tokens[i] });

          console.log(`🎨 Generating Upper-Body Try-On...`);
          const dictObj = { background: humanBlob, layers: [], composite: null };

          result = await client.predict("/tryon", {
            dict: dictObj,
            garm_img: garmBlob,
            garment_des: description || "clothing item",
            is_checked: true,
            is_checked_crop: false,
            denoise_steps: 30,
            seed: 42,
          }) as any;
        }

        success = true;
        break; // Exit loop if successful
      } catch (err: any) {
        console.warn(`⚠️ Token ${i + 1} failed: ${err.message}`);
        lastError = err;
      }
    }

    if (!success) {
      console.log('⚠️ All Hugging Face tokens failed/exhausted. 🔄 Switching to Replicate Fallback API...');
      
      if (!process.env.REPLICATE_API_TOKEN) {
         throw new Error("Hugging Face exhausted and no Replicate Fallback Token found.");
      }

      const Replicate = require('replicate');
      const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
      
      let isBottom = false;
      const lowerDesc = (description || '').toLowerCase();
      if (lowerDesc.match(/pant|jean|short|skirt|bottom|trouser|legging/)) {
        isBottom = true;
      }

      try {
        const output = await replicate.run(
          "cuuupid/idm-vton:c871bb9b046607b680449ecbae55fd8c6d945e0a1948644bf2361b3d021d3ff4",
          {
            input: {
              crop: false,
              seed: 42,
              steps: 30,
              category: isBottom ? "lower_body" : "upper_body",
              garm_img: garm_img,
              human_img: human_img,
              garment_des: description || "clothing item"
            }
          }
        );

        if (!output) throw new Error("Replicate API returned empty output");
        result = output;
        success = true;
        console.log('✅ Replicate Fallback Successful!');
      } catch (repErr: any) {
        throw new Error(`Both HuggingFace and Replicate failed. Last Error: ${repErr.message}`);
      }
    }

    console.log('✅ Generation Complete! Processing result...');
    let generatedImageUrl = ''; 
    if (result && result.data && Array.isArray(result.data) && result.data[0] && result.data[0].url) {
      generatedImageUrl = result.data[0].url;
    } else if (Array.isArray(result) && result[0] && result[0].url) {
      generatedImageUrl = result[0].url;
    } else if (result && result.url) {
      generatedImageUrl = result.url;
    } else if (typeof result === 'string') {
      generatedImageUrl = result;
    }

    if (!generatedImageUrl) {
      throw new Error("Invalid output format from Hugging Face Space");
    }

    console.log('📤 Uploading result to Cloudinary...');
    const imgRes = await fetch(generatedImageUrl);
    const imageBuffer = Buffer.from(await imgRes.arrayBuffer());
    const dataUri = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;

    const uploadResult = await new Promise<string>((resolve, reject) => {
      cloudinary.uploader.upload(dataUri, { folder: 'atla_tryon', transformation: [{ quality: 'auto', fetch_format: 'auto' }] }, (err, result) => {
        if (err) reject(err);
        else resolve(result?.secure_url || '');
      });
    });

    console.log('🎉 Try-On Pipeline Complete:', uploadResult);
    res.json({ success: true, url: uploadResult });
  } catch (error: any) {
    console.error('❌ Hugging Face Try-On Pipeline Failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// AI Avatar Generation Endpoint (Hugging Face Free Tier)
app.post('/api/generate-avatar', async (req, res) => {
  const { gender } = req.body;
  const tokens = [];
  if (process.env.HF_TOKEN) tokens.push(process.env.HF_TOKEN);
  if (process.env.HF_TOKEN_2) tokens.push(process.env.HF_TOKEN_2);
  if (process.env.HF_TOKEN_3) tokens.push(process.env.HF_TOKEN_3);

  if (tokens.length === 0) {
    return res.status(400).json({ success: false, error: 'Hugging Face Token missing.' });
  }

  try {
    const prompt = `Full body fashion photography, realistic ${gender || 'female'} model standing straight against a plain white studio background, wearing a simple fitted white t-shirt and grey leggings, photorealistic, 4k, natural lighting, looking directly at camera, neutral expression, hands at sides.`;
    
    console.log('🎨 Generating AI Avatar with Hugging Face FLUX...');
    
    let response = null;
    let success = false;
    let lastError = null;

    for (let i = 0; i < tokens.length; i++) {
      try {
        console.log(`🔑 [Token ${i + 1}/${tokens.length}] Sending inference request...`);
        response = await fetch(
          "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell",
          {
            headers: {
              Authorization: `Bearer ${tokens[i]}`,
              "Content-Type": "application/json",
            },
            method: "POST",
            body: JSON.stringify({ inputs: prompt }),
          }
        );

        if (!response.ok) {
          const err = await response.text();
          throw new Error(err);
        }
        
        success = true;
        break;
      } catch (err: any) {
        console.warn(`⚠️ Token ${i + 1} failed: ${err.message}`);
        lastError = err;
      }
    }

    if (!success || !response) {
      throw lastError || new Error("All Hugging Face tokens failed.");
    }

    console.log('📤 Uploading generated avatar to Cloudinary...');
    const imageBuffer = Buffer.from(await response.arrayBuffer());
    const dataUri = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;

    const uploadResult = await new Promise<string>((resolve, reject) => {
      cloudinary.uploader.upload(dataUri, { 
        folder: 'atla_avatars',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }]
      }, (err, result) => {
        if (err) reject(err);
        else resolve(result?.secure_url || '');
      });
    });

    res.json({ success: true, url: uploadResult });
  } catch (error: any) {
    console.error('❌ AI Avatar Generation Failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('═══════════════════════════════════════════');
    console.log(`  🚀 Alta Daily Backend`);
    console.log(`  Running on http://0.0.0.0:${PORT}`);
    console.log(`  Test DB:  http://localhost:${PORT}/api/test`);
    console.log('═══════════════════════════════════════════');
    console.log('');
    console.log('Waiting for requests...');
  });
}

export default app;
// Trigger restart
