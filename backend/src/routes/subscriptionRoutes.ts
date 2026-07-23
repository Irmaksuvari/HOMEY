import { Router } from 'express';
import { authenticateJWT, requireBroker } from '../middleware/auth';
import { 
  getSubscriptionDetails, 
  schedulePackageChange, 
  cancelScheduledChange 
} from '../controllers/subscriptionController';

const router = Router();

// GET /api/subscription/details
router.get('/details', authenticateJWT, getSubscriptionDetails);

// POST /api/subscription/schedule-change (Broker only)
router.post('/schedule-change', authenticateJWT, requireBroker, schedulePackageChange);

// POST /api/subscription/cancel-schedule (Broker only)
router.post('/cancel-schedule', authenticateJWT, requireBroker, cancelScheduledChange);

export default router;
