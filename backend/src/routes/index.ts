import { Router } from 'express';
import authRoutes from './auth';
import clothesRoutes from './clothes';
import outfitRoutes from './outfits';
import userRoutes from './user';
import aiRoutes from './ai';
import uploadRoutes from './upload';
import fashionRoutes from './fashion';

const router = Router();

// Mount all route groups
router.use('/', authRoutes);              // POST /api/register, /api/login
router.use('/clothes', clothesRoutes);    // /api/clothes/*
router.use('/outfits', outfitRoutes);     // /api/outfits/*
router.use('/outfit', outfitRoutes);      // /api/outfit/search-items (legacy path)
router.use('/user', userRoutes);          // /api/user/*
router.use('/', aiRoutes);               // POST /api/try-on, /api/generate-avatar
router.use('/upload', uploadRoutes);      // POST /api/upload
router.use('/fashion', fashionRoutes);    // /api/fashion/*

export default router;
