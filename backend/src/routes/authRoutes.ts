import { Router } from 'express';
import { registerBroker, login, changePassword, updateTheme, googleLogin, forgotPassword, resetPassword } from '../controllers/authController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

// Aday Broker/Firma Kayıt Rotası
router.post('/register-broker', registerBroker);

// Kullanıcı Giriş Rotası
router.post('/login', login);

// Google ile Giriş Rotası
router.post('/google-login', googleLogin);

// Şifre Değiştirme Rotası (İlk girişte zorunlu şifre sıfırlama veya normal değişiklik)
router.post('/change-password', authenticateJWT, changePassword);

// Şifremi Unuttum
router.post('/forgot-password', forgotPassword);

// Şifreyi Sıfırla
router.post('/reset-password', resetPassword);

// Tema Değiştirme Rotası
router.put('/theme', authenticateJWT, updateTheme);

export default router;
