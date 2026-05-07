import express from 'express';
import {
  getTrips,
  createTrip,
  updateTrip,
  deleteTrip,
  getTripById,
  generatePackingList,
  updatePackingStatus
} from '../controllers/tripsController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Routes
router.get('/', getTrips);
router.post('/', createTrip);
router.get('/:id', getTripById);
router.put('/:id', updateTrip);
router.delete('/:id', deleteTrip);
router.post('/:id/generate-packing', generatePackingList);
router.patch('/:id/packing/:itemId', updatePackingStatus);

export default router;