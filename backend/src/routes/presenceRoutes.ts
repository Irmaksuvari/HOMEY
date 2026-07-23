import { Router } from 'express';
import { toggleOfficeStatus, getActiveInOffice, getMyOfficeStatus } from '../controllers/presenceController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

// GET /api/user/my-status — Giriş yapan kullanıcının ofis durumunu sorgula
router.get('/my-status', authenticateJWT, getMyOfficeStatus);

// POST /api/user/toggle-office-status — Kullanıcı ofis durumunu tersine çevir
router.post('/toggle-office-status', authenticateJWT, toggleOfficeStatus);

// GET /api/user/active-in-office — Ofisteki kullanıcıları listele
router.get('/active-in-office', authenticateJWT, getActiveInOffice);

export default router;
