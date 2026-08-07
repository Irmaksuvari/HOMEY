import { Router } from 'express';
import { registerBroker, login, changePassword, updateTheme } from '../controllers/authController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

// Aday Broker/Firma Kayıt Rotası
router.post('/register-broker', registerBroker);

// Kullanıcı Giriş Rotası
router.post('/login', login);

// Şifre Değiştirme Rotası (İlk girişte zorunlu şifre sıfırlama veya normal değişiklik)
router.post('/change-password', authenticateJWT, changePassword);

// Tema Değiştirme Rotası
router.put('/theme', authenticateJWT, updateTheme);

export default router;
