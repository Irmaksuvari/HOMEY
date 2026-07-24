import { Router } from 'express';
import { getDashboardSummary } from '../controllers/dashboardController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

// Ofis Finansal Dashboard Özet Verileri (Sadece YETKILI erişebilir)
router.get('/summary', authenticateJWT, getDashboardSummary);

export default router;
