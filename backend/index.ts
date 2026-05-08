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

    Readable.from((req as any).file.buffer).pipe(stream);
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

// AI Virtual Try-On Endpoint — Vertex AI Imagen 2 Pipeline
// Step 1: Garment image → NVIDIA phi-4-multimodal → detailed text description
// Step 2: User photo + garment description → Vertex AI Imagen 2 (image editing) → result
app.post('/api/try-on', async (req, res) => {
  const { garm_img, human_img, description } = req.body;

  const NVIDIA_KEY = process.env.NVIDIA_API_KEY || process.env.EXPO_PUBLIC_NVIDIA_API_KEY;
  const VERTEX_PROJECT = process.env.VERTEX_PROJECT_ID;
  const VERTEX_LOCATION = process.env.VERTEX_LOCATION || 'us-central1';
  const VERTEX_KEY_JSON = process.env.VERTEX_SERVICE_ACCOUNT_JSON;

  if (!VERTEX_PROJECT || !VERTEX_KEY_JSON) {
    return res.status(400).json({ 
      success: false, 
      error: 'Vertex AI not configured. Need VERTEX_PROJECT_ID and VERTEX_SERVICE_ACCOUNT_JSON in .env' 
    });
  }

  if (!garm_img || !human_img) {
    return res.status(400).json({ success: false, error: 'garm_img and human_img are required' });
  }

  try {
    console.log('🚀 Vertex AI Imagen 2 Try-On Pipeline Starting...');

    // ── Step 1: Describe garment using NVIDIA phi-4-multimodal ──
    let garmentDescription = description || 'stylish clothing item';

    if (NVIDIA_KEY) {
      try {
        console.log('👁️  Step 1: Describing garment with NVIDIA phi-4-multimodal...');
        const visionRes = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${NVIDIA_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'microsoft/phi-4-multimodal-instruct',
            messages: [{
              role: 'user',
              content: [
                { type: 'image_url', image_url: { url: garm_img } },
                { type: 'text', text: 'Describe this clothing item in detail for a fashion AI. Include: garment type, color, fabric texture, fit style, notable design details. Be specific. Max 2 sentences.' }
              ]
            }],
            max_tokens: 150,
            temperature: 0.3,
          }),
        });

        if (visionRes.ok) {
          const visionData = (await visionRes.json()) as any;
          const desc = visionData.choices?.[0]?.message?.content?.trim();
          if (desc) {
            garmentDescription = desc;
            console.log('✅ Garment described:', garmentDescription);
          }
        }
      } catch (visionErr: any) {
        console.warn('⚠️ NVIDIA VLM failed, using fallback description:', visionErr.message);
      }
    }

    // ── Step 2: Get access token for Vertex AI ──
    console.log('🔑 Step 2: Authenticating with Vertex AI...');
    
    const { GoogleAuth } = await import('google-auth-library');
    
    // Parse service account JSON (stored as base64 or raw JSON string)
    let serviceAccountKey;
    try {
      const decoded = Buffer.from(VERTEX_KEY_JSON, 'base64').toString('utf8');
      serviceAccountKey = JSON.parse(decoded);
    } catch {
      serviceAccountKey = JSON.parse(VERTEX_KEY_JSON);
    }

    const auth = new GoogleAuth({
      credentials: serviceAccountKey,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });

    const accessToken = await auth.getAccessToken();
    console.log('✅ Vertex AI authenticated');

    // ── Step 3: Download user image and convert to base64 ──
    console.log('📥 Step 3: Fetching user image...');
    const humanImgRes = await fetch(human_img);
    const humanImgBuffer = await humanImgRes.arrayBuffer();
    const humanImgBase64 = Buffer.from(humanImgBuffer).toString('base64');
    const humanImgMime = humanImgRes.headers.get('content-type') || 'image/jpeg';

    // ── Step 4: Call Vertex AI Imagen 2 edit endpoint ──
    console.log('🎨 Step 4: Calling Vertex AI Imagen 2 image editing...');

    // Advanced prompt for better VTO results
    const editPrompt = `Photorealistic fashion photography. A person wearing ${garmentDescription}. The person, their face, body proportions, pose, and the background must remain identical to the original photo. Only the clothing should be replaced with the described garment. High resolution, 8k, professional lighting.`;

    const vertexEndpoint = `https://${VERTEX_LOCATION}-aiplatform.googleapis.com/v1/projects/${VERTEX_PROJECT}/locations/${VERTEX_LOCATION}/publishers/google/models/imagegeneration@006:predict`;

    const vertexPayload = {
      instances: [{
        prompt: editPrompt,
        image: {
          bytesBase64Encoded: humanImgBase64,
          mimeType: humanImgMime,
        },
      }],
      parameters: {
        sampleCount: 1,
        // We use EDIT_MODE_INPAINT_INSERTION but without a mask, Imagen 2 tries to identify the subject.
        // For better results, it's recommended to provide a mask, but we'll try instruction-based editing.
        editConfig: {
          editMode: 'EDIT_MODE_DEFAULT', // Changed to DEFAULT for instruction-based editing without a mask
        },
        outputOptions: {
          mimeType: 'image/jpeg',
          compressionQuality: 95,
        },
      },
    };

    const vertexRes = await fetch(vertexEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(vertexPayload),
    });

    if (!vertexRes.ok) {
      const errText = await vertexRes.text();
      console.error('❌ Vertex AI error:', errText);
      throw new Error(`Vertex AI error ${vertexRes.status}: ${errText}`);
    }

    const vertexData = (await vertexRes.json()) as any;
    const resultBase64 = vertexData.predictions?.[0]?.bytesBase64Encoded;

    if (!resultBase64) {
      console.error('❌ No image in Vertex response:', JSON.stringify(vertexData).substring(0, 500));
      throw new Error('No image returned from Vertex AI Imagen 2. The prompt might have been blocked or the image couldn\'t be processed.');
    }

    // ── Step 5: Upload result to Cloudinary ──
    console.log('📤 Step 5: Uploading result to Cloudinary...');
    const dataUri = `data:image/jpeg;base64,${resultBase64}`;
    
    const uploadResult = await new Promise<string>((resolve, reject) => {
      cloudinary.uploader.upload(dataUri, { 
        folder: 'atla_tryon',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }]
      }, (err, result) => {
        if (err) reject(err);
        else resolve(result?.secure_url || '');
      });
    });

    console.log('✅ Try-On Complete:', uploadResult);
    res.json({ success: true, url: uploadResult });

  } catch (error: any) {
    console.error('❌ Vertex AI Try-On Pipeline Failed:', error.message);
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
