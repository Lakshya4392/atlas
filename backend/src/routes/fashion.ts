import { Router } from 'express';
import { searchFashion, getPersonalizedFeed, getCachedItem, getByCategory, seedAllCategories } from '../controllers/fashionController';

const router = Router();

// GET /api/fashion/search?q=
router.get('/search', searchFashion);

// GET /api/fashion/feed/:userId
router.get('/feed/:userId', getPersonalizedFeed);

// GET /api/fashion/category/:cat  (Shoes, Tops, Bottoms, Outerwear, Accessories)
router.get('/category/:cat', getByCategory);

// POST /api/fashion/seed  (seed all categories from SerpAPI)
router.post('/seed', seedAllCategories);

// GET /api/fashion/item/:id
router.get('/item/:id', getCachedItem);

export default router;
