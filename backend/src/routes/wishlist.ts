import express from 'express';
import { getWishlist, addToWishlist, removeFromWishlist, toggleSaved } from '../controllers/wishlistController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Routes
router.get('/', getWishlist);
router.post('/', addToWishlist);
router.delete('/:id', removeFromWishlist);
router.patch('/:id/toggle', toggleSaved);

export default router;