import { Router } from 'express';
import upload from '../config/multer';
import { uploadImage } from '../controllers/uploadController';

const router = Router();

router.post('/', upload.single('image'), uploadImage);

export default router;
