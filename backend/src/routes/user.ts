import { Router } from 'express';
import { getStats, updateAvatar, updateBrands, completeOnboarding } from '../controllers/userController';
import { generateDigitalTwin } from '../controllers/avatarController';
import upload from '../config/multer';

const router = Router();

router.get('/:userId/stats', getStats);
router.put('/:id/avatar', updateAvatar);
router.put('/:id/brands', updateBrands);
router.put('/:id/onboarding', completeOnboarding);
router.post('/:id/digital-twin', upload.single('image'), generateDigitalTwin);

export default router;
