import { Router } from 'express';
import { addPortfolio, listPortfolios, editPortfolio } from '../controllers/portfolioController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

// Yeni Portföy Ekleme (Giriş yapmış tüm danışman/broker ekleyebilir)
router.post('/add', authenticateJWT, addPortfolio);

// Portföyleri Listeleme (Giriş yapmış tüm danışman/broker görebilir)
router.get('/list', authenticateJWT, listPortfolios);

// Portföy Düzenleme (Sadece yetkili veya ilgili sorumlu uzman düzenleyebilir)
router.put('/edit/:id', authenticateJWT, editPortfolio);

export default router;
