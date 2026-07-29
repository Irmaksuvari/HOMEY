import { Router } from 'express';
import { addClient, listClients, toggleClientStatus } from '../controllers/clientController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

// Müşteri Ekleme (Giriş yapmış tüm danışman/broker ekleyebilir)
router.post('/add', authenticateJWT, addClient);

// Müşterileri Listeleme (Giriş yapmış tüm danışman/broker görebilir)
router.get('/list', authenticateJWT, listClients);

// Müşteri Aktif/Pasif Durumunu Güncelleme
router.put('/toggle-status/:id', authenticateJWT, toggleClientStatus);

export default router;
