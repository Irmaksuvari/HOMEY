import { Router } from 'express';
import { addClient, listClients } from '../controllers/clientController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

// Müşteri Ekleme (Giriş yapmış tüm danışman/broker ekleyebilir)
router.post('/add', authenticateJWT, addClient);

// Müşterileri Listeleme (Giriş yapmış tüm danışman/broker görebilir)
router.get('/list', authenticateJWT, listClients);

export default router;
