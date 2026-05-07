import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { Readable } from 'stream';

const prisma = new PrismaClient();
const app = express();

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
