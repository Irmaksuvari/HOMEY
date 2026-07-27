import { Router } from 'express';
import { getDashboardSummary, getPersonalStats } from '../controllers/dashboardController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

// Ofis Finansal Dashboard Özet Verileri (Sadece YETKILI erişebilir)
router.get('/summary', authenticateJWT, getDashboardSummary);

router.get('/personal-stats', authenticateJWT, getPersonalStats);

export default router;
