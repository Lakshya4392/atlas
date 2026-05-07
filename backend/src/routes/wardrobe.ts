import express from 'express';
import {
  getWardrobe,
  addItem,
  updateItem,
  deleteItem,
  getItemById,
  getCategories,
  searchItems,
  getStats
} from '../controllers/wardrobeController';
import { authenticate } from '../middleware/auth';
import { upload } from '../utils/upload';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Routes
router.get('/', getWardrobe);
router.get('/stats', getStats);
router.get('/categories', getCategories);
router.get('/search', searchItems);
router.get('/:id', getItemById);
router.post('/', upload.array('images', 5), addItem);
router.put('/:id', upload.array('images', 5), updateItem);
router.delete('/:id', deleteItem);

export default router;