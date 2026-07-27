import { Router } from 'express';
import { getFirmaSettings, upsertFirmaSettings } from '../controllers/firmaSettingsController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

// Bütün ayar işlemleri yetki (token) gerektirir
router.get('/', authenticateJWT as any, getFirmaSettings);
router.post('/', authenticateJWT as any, upsertFirmaSettings);

export default router;
