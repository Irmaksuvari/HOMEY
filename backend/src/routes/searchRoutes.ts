import { Router } from 'express';
import { globalSearch } from '../controllers/searchController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

// GET /api/search?q=...
router.get('/', authenticateJWT, globalSearch);

export default router;
