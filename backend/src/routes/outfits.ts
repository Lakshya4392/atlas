import { Router } from 'express';
import { getOutfits, saveOutfit, searchItems } from '../controllers/outfitController';

const router = Router();

router.post('/search-items', searchItems);
router.get('/:userId', getOutfits);
router.post('/', saveOutfit);

export default router;
