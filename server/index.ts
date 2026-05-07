import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import Replicate from 'replicate';
import { fal } from '@fal-ai/client';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { Readable } from 'stream';

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
    const { email, name } = req.body;
    console.log(`📝 Registration attempt: name="${name}", email="${email}"`);

    if (!email || !name) {
      return res.status(400).json({ success: false, error: 'Name and email are required' });
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.log(`✅ User already exists, logging in: ${email}`);
      return res.json({ success: true, user: existing });
    }

    const user = await prisma.user.create({
      data: { email, name, style: 'Minimalist' },
    });
    console.log(`✅ User created successfully: ${user.id}`);
    res.json({ success: true, user });
  } catch (error: any) {
    console.error('❌ Registration failed:', error.message);
    res.status(400).json({ success: false, error: error.message });
  }
});

// ── Login ──
app.post('/api/login', async (req, res) => {
  try {
    const { email } = req.body;
    console.log(`🔑 Login attempt: email="${email}"`);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    console.log(`✅ Login successful: ${user.name}`);
    res.json({ success: true, user });
  } catch (error: any) {
    console.error('❌ Login failed:', error.message);
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
    const { userId, name, occasion, itemIds, aiGenerated, weather } = req.body;
    if (!userId || !name || !itemIds?.length) {
      return res.status(400).json({ success: false, error: 'userId, name, and itemIds are required' });
    }
    const outfit = await prisma.outfit.create({
      data: {
        userId,
        name,
        occasion: occasion || 'Casual',
        aiGenerated: aiGenerated || false,
        weather: weather || '',
        items: {
          create: itemIds.map((id: string) => ({ clothingItemId: id })),
        },
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

    Readable.from(req.file.buffer).pipe(stream);
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

// ── Start Server ──
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Update user avatar
app.put('/api/user/:id/avatar', async (req, res) => {
  const { id } = req.params;
  const { avatarUrl } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id },
      data: { avatar: avatarUrl },
    });
    res.json({ success: true, user });
  } catch (error) {
    console.error('Update avatar error:', error);
    res.status(500).json({ success: false, error: 'Failed to update avatar' });
  }
});

// AI Virtual Try-On Endpoint — NVIDIA Pipeline
// Step 1: Garment image → NVIDIA VLM → text description
// Step 2: User photo + description → NVIDIA Flux edit → result
app.post('/api/try-on', async (req, res) => {
  const { garm_img, human_img, description } = req.body;

  const NVIDIA_KEY = process.env.NVIDIA_API_KEY;

  if (!NVIDIA_KEY) {
    return res.status(400).json({ success: false, error: 'NVIDIA_API_KEY not configured.' });
  }

  if (!garm_img || !human_img) {
    return res.status(400).json({ success: false, error: 'garm_img and human_img are required' });
  }

  try {
    console.log('🚀 NVIDIA Try-On Pipeline Starting...');

    // ── Step 1: Describe the garment using NVIDIA VLM ──
    console.log('👁️  Step 1: Describing garment with NVIDIA VLM...');

    let garmentDescription = description || '';

    try {
      const visionRes = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NVIDIA_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'microsoft/phi-3.5-vision-instruct',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image_url',
                  image_url: { url: garm_img },
                },
                {
                  type: 'text',
                  text: 'Describe this clothing item in detail for a fashion AI. Include: garment type, color, fabric texture, fit style, notable design details (buttons, patterns, collar, sleeves). Be specific and concise. Max 2 sentences.',
                },
              ],
            },
          ],
          max_tokens: 150,
          temperature: 0.3,
        }),
      });

      if (visionRes.ok) {
        const visionData = await visionRes.json();
        garmentDescription = visionData.choices?.[0]?.message?.content?.trim() || description;
        console.log('✅ Garment described:', garmentDescription);
      } else {
        console.warn('⚠️ VLM failed, using fallback description:', description);
      }
    } catch (visionErr: any) {
      console.warn('⚠️ VLM error, using fallback:', visionErr.message);
    }

    // ── Step 2: Edit user photo with NVIDIA Flux ──
    console.log('🎨 Step 2: Applying garment to user photo with NVIDIA Flux...');

    const editPrompt = `The person in this photo is now wearing: ${garmentDescription}. Keep the person's face, body, pose, and background exactly the same. Only change the clothing to match the description. Photorealistic, high quality fashion photo.`;

    const fluxRes = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NVIDIA_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'black-forest-labs/flux.2-klein-4b',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: human_img },
              },
              {
                type: 'text',
                text: editPrompt,
              },
            ],
          },
        ],
        max_tokens: 1024,
        temperature: 0.2,
      }),
    });

    if (!fluxRes.ok) {
      const errText = await fluxRes.text();
      console.error('❌ Flux error:', errText);
      throw new Error(`NVIDIA Flux error ${fluxRes.status}: ${errText}`);
    }

    const fluxData = await fluxRes.json();

    // Flux returns base64 image in content
    const content = fluxData.choices?.[0]?.message?.content;
    console.log('Flux response content type:', typeof content);

    // Extract image URL or base64
    let resultUrl = '';

    if (typeof content === 'string' && content.startsWith('data:image')) {
      // base64 — upload to Cloudinary
      console.log('📤 Uploading base64 result to Cloudinary...');
      const uploadResult = await new Promise<string>((resolve, reject) => {
        cloudinary.uploader.upload(content, { folder: 'atla_tryon' }, (err, result) => {
          if (err) reject(err);
          else resolve(result?.secure_url || '');
        });
      });
      resultUrl = uploadResult;
    } else if (typeof content === 'string' && content.startsWith('http')) {
      resultUrl = content;
    } else if (Array.isArray(content)) {
      // content array format
      for (const part of content) {
        if (part.type === 'image_url') {
          resultUrl = part.image_url?.url || '';
          break;
        } else if (part.type === 'text' && part.text?.startsWith('data:image')) {
          // upload base64
          const uploadResult = await new Promise<string>((resolve, reject) => {
            cloudinary.uploader.upload(part.text, { folder: 'atla_tryon' }, (err, result) => {
              if (err) reject(err);
              else resolve(result?.secure_url || '');
            });
          });
          resultUrl = uploadResult;
          break;
        }
      }
    }

    if (!resultUrl) {
      console.error('❌ No image in Flux response:', JSON.stringify(fluxData).substring(0, 500));
      throw new Error('No image returned from NVIDIA Flux');
    }

    console.log('✅ Try-On Complete:', resultUrl);
    res.json({ success: true, url: resultUrl });

  } catch (error: any) {
    console.error('❌ NVIDIA Try-On Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

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
