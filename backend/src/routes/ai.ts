import express from 'express';
import { chat, generateOutfit, getChatHistory } from '../controllers/aiController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Routes
router.post('/chat', chat);
router.post('/generate-outfit', generateOutfit);
router.get('/chats', getChatHistory);

export default router;