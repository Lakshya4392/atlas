import express from 'express';
import { getAnalytics, getWearPatterns, getStyleInsights } from '../controllers/analyticsController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Routes
router.get('/', getAnalytics);
router.get('/wear-patterns', getWearPatterns);
router.get('/style-insights', getStyleInsights);

export default router;