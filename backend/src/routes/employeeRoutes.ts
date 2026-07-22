import { Router } from 'express';
import { addEmployee, listEmployees, resetEmployeePassword } from '../controllers/employeeController';
import { authenticateJWT, requireBroker } from '../middleware/auth';

const router = Router();

// Danışman/Çalışan Ekleme Rotası (Sadece Broker/YETKILI yetkisi ile)
router.post('/add', authenticateJWT, requireBroker, addEmployee);

// Çalışanları Listeleme Rotası (Korumalı)
router.get('/list', authenticateJWT, listEmployees);

// Çalışan Şifresi Sıfırlama Rotası (Sadece Broker/YETKILI yetkisi ile)
router.post('/reset-password', authenticateJWT, requireBroker, resetEmployeePassword);

export default router;
