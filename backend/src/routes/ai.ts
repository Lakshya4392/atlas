import { Router } from 'express';
import { tryOn, generateAvatar } from '../controllers/aiController';
import { twinTryOn } from '../controllers/twinTryOnController';

const router = Router();

router.post('/try-on', tryOn);
router.post('/twin-try-on', twinTryOn);
router.post('/generate-avatar', generateAvatar);

export default router;
