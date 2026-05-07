import express from 'express';
import { getProfile, updateProfile, updateSettings, getStats } from '../controllers/userController';
import { authenticate } from '../middleware/auth';
import { upload } from '../utils/upload';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Routes
router.get('/profile', getProfile);
router.put('/profile', upload.single('avatar'), updateProfile);
router.put('/settings', updateSettings);
router.get('/stats', getStats);

export default router;