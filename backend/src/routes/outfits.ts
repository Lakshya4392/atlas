import express from 'express';
import {
  getOutfits,
  createOutfit,
  updateOutfit,
  deleteOutfit,
  getOutfitById,
  wearOutfit,
  rateOutfit
} from '../controllers/outfitsController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Routes
router.get('/', getOutfits);
router.post('/', createOutfit);
router.get('/:id', getOutfitById);
router.put('/:id', updateOutfit);
router.delete('/:id', deleteOutfit);
router.post('/:id/wear', wearOutfit);
router.post('/:id/rate', rateOutfit);

export default router;