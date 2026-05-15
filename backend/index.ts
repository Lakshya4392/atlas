import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fal } from '@fal-ai/client';
import prisma from './src/config/prisma';
import { requestLogger } from './src/middleware/logger';
import apiRoutes from './src/routes/index';

const app = express();

// ── Third-party Config ──
fal.config({
  credentials: process.env.FAL_KEY,
});

// ── Middleware ──
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// ── Health Check ──
app.get('/api/test', async (req, res) => {
  try {
    const userCount = await prisma.user.count();
    res.json({
      success: true,
      message: 'Fashion X Backend is live and connected to Neon PostgreSQL!',
      usersCount: userCount,
    });
  } catch (error: any) {
    console.error('Database connection failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ── Mount All API Routes ──
app.use('/api', apiRoutes);

// ── Start Server ──
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('═══════════════════════════════════════════');
    console.log(`  🚀 Fashion X Backend`);
    console.log(`  Running on http://0.0.0.0:${PORT}`);
    console.log(`  Test DB:  http://localhost:${PORT}/api/test`);
    console.log('═══════════════════════════════════════════');
    console.log('');
    console.log('Waiting for requests...');
  });
}

export default app;
