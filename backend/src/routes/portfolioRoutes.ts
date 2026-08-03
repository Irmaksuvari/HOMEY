import { Router } from 'express';
import { addPortfolio, listPortfolios, editPortfolio, closePortfolioTransaction, getCompletedPortfolios, updatePortfolioPublishState } from '../controllers/portfolioController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

// Yeni Portföy Ekleme (Giriş yapmış tüm danışman/broker ekleyebilir)
router.post('/add', authenticateJWT, addPortfolio);

// Portföyleri Listeleme (Giriş yapmış tüm danışman/broker görebilir)
router.get('/list', authenticateJWT, listPortfolios);

// Tamamlanan Portföyleri Listeleme (Satıldı / Kiralandı)
router.get('/completed', authenticateJWT, getCompletedPortfolios);

// Portföy Düzenleme (Sadece yetkili veya ilgili sorumlu uzman düzenleyebilir)
router.put('/edit/:id', authenticateJWT, editPortfolio);

// Portföy Yayın Durumu Güncelleme
router.put('/:id/publish', authenticateJWT, updatePortfolioPublishState);

// Portföy İşlemini Kapat (Satıldı / Kiralandı Yap)
router.post('/:id/satis-kapat', authenticateJWT, closePortfolioTransaction);

export default router;

