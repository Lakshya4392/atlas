import { Router } from 'express';
import { searchFashion, getPersonalizedFeed, getCachedItem } from '../controllers/fashionController';

const router = Router();

// GET /api/fashion/search?q=
router.get('/search', searchFashion);

// GET /api/fashion/feed/:userId
router.get('/feed/:userId', getPersonalizedFeed);

// GET /api/fashion/item/:id
router.get('/item/:id', getCachedItem);

export default router;
