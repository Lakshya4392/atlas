import { Router } from 'express';
import upload from '../config/multer';
import { getItem, getAllItems, addItem, updateItem, deleteItem, extractClothing, flatlay } from '../controllers/clothesController';

const router = Router();

// Order matters: specific routes before parameterized ones
router.post('/extract', upload.single('image'), extractClothing);
router.post('/flatlay', upload.single('image'), flatlay);
router.get('/item/:id', getItem);
router.get('/:userId', getAllItems);
router.post('/', addItem);
router.patch('/:id', updateItem);
router.delete('/:id', deleteItem);

export default router;
