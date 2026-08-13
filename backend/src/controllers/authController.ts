import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import { Firm } from '../models/Firm';
import { SubscriptionPackage } from '../models/SubscriptionPackage';
import { FirmSubscription } from '../models/FirmSubscription';
import { User } from '../models/User';
import { CommissionSetting } from '../models/CommissionSetting';
import { sendEmail } from '../services/emailService';

const JWT_SECRET = process.env.JWT_SECRET || 'homey_super_secret_jwt_key_2026_change_me_in_production';

// Broker & Firma Kayıt (POST /api/auth/register-broker)
export const registerBroker = async (req: Request, res: Response) => {
  const { firmaAdi, vergiNo, sehir, ad, soyad, eposta, sifre, telefon, paketTipi, abonelikTipi } = req.body;

  if (!firmaAdi || !vergiNo || !sehir || !ad || !soyad || !eposta || !sifre) {
    return res.status(400).json({ message: 'Lütfen zorunlu tüm alanları doldurunuz.' });
  }

  const selectedPaketTipi = (paketTipi || 'DENEME').toUpperCase(); // 'DENEME', 'BASIC', 'PREMIUM'
  const selectedAbonelikTipi = (abonelikTipi || 'AYLIK').toUpperCase(); // 'AYLIK', 'YILLIK'

  const session = await mongoose.startSession();

  try {
    const checkEmail = await User.findOne({ Eposta: eposta });
    if (checkEmail) {
      return res.status(400).json({ message: 'Bu e-posta adresi ile zaten bir kullanıcı mevcut.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(sifre, salt);

    session.startTransaction();

    try {
      const bitisTarihi = new Date();
      let dbPeriyot: string | null = null;

      if (selectedPaketTipi === 'DENEME') {
        bitisTarihi.setDate(bitisTarihi.getDate() + 30);
        dbPeriyot = null;
      } else if (selectedAbonelikTipi === 'YILLIK') {
        bitisTarihi.setFullYear(bitisTarihi.getFullYear() + 1);
        dbPeriyot = 'Yillik';
      } else { 
        bitisTarihi.setMonth(bitisTarihi.getMonth() + 1);
        dbPeriyot = 'Aylik';
      }

      const newFirmaId = uuidv4();
      await Firm.create([{
        _id: newFirmaId,
        FirmaAdi: firmaAdi,
        VergiNo: vergiNo,
        Sehir: sehir,
        PaketTipi: selectedPaketTipi,
        AbonelikTipi: selectedAbonelikTipi,
        AbonelikBitisTarihi: bitisTarihi,
        KayitTarihi: new Date()
      }], { session });

      const dbPaketAdi = selectedPaketTipi === 'DENEME' ? 'Deneme' : selectedPaketTipi === 'BASIC' ? 'Basic' : 'Premium';
      const paketResult = await SubscriptionPackage.findOne({ PaketAdi: dbPaketAdi }).session(session);

      let paketId = paketResult ? paketResult.PaketID : 1;

      await FirmSubscription.create([{
        FirmaID: newFirmaId,
        PaketID: paketId,
        Periyot: dbPeriyot,
        BaslangicTarihi: new Date(),
        BitisTarihi: bitisTarihi,
        Durum: 'Aktif'
      }], { session });

      const newUserId = uuidv4();
      await User.create([{
        _id: newUserId,
        FirmaId: newFirmaId,
        Ad: ad,
        Soyad: soyad,
        Eposta: eposta,
        SifreHash: passwordHash,
        Telefon: telefon || null,
        Rol: 'YETKILI',
        IlkGirisMi: false,
        AktifMi: true,
        OfisteMi: true,
        KayitTarihi: new Date(),
        SilindiMi: false
      }], { session });

      await CommissionSetting.create([{
        FirmaId: newFirmaId,
        SenaryoA_OfisYuzde: 40.00,
        SenaryoA_DanismanYuzde: 60.00,
        SenaryoB_OfisYuzde: 40.00,
        SenaryoB_PortfoySahibiYuzde: 30.00,
        SenaryoB_MusteriGetirenYuzde: 30.00,
        SenaryoC_DisOrtakYuzde: 50.00,
        SenaryoC_OfisYuzde: 40.00,
        SenaryoC_DanismanYuzde: 60.00
      }], { session });

      await session.commitTransaction();

      res.status(201).json({
        message: 'Firma ve Broker kaydı başarıyla oluşturuldu. Abonelik başlatıldı.',
        firmaId: newFirmaId,
        userId: newUserId,
        paketTipi: selectedPaketTipi,
        abonelikTipi: selectedAbonelikTipi
      });

    } catch (innerErr) {
      await session.abortTransaction();
      throw innerErr;
    } finally {
      session.endSession();
    }

  } catch (error: any) {
    console.error('[HOMEY API] registerBroker Error:', error);
    res.status(500).json({ message: 'Kayıt sırasında bir hata oluştu.', error: error.message });
  }
};

// Kullanıcı Girişi (POST /api/auth/login)
export const login = async (req: Request, res: Response) => {
  const { eposta, sifre } = req.body || {};

  if (!eposta || !sifre) {
    return res.status(400).json({ message: 'E-posta ve şifre girilmelidir.' });
  }

  const cleanEmail = typeof eposta === 'string' ? eposta.trim().toLowerCase() : '';
  const cleanPassword = typeof sifre === 'string' ? sifre : String(sifre);

  if (!cleanEmail || !cleanPassword) {
    return res.status(400).json({ message: 'Geçersiz e-posta veya şifre formatı.' });
  }

  try {
    const user = await User.aggregate([
      { $match: { Eposta: new RegExp(`^${cleanEmail}$`, 'i'), $or: [{ SilindiMi: false }, { SilindiMi: { $exists: false } }] } },
      { $lookup: { from: 'Firmalar', localField: 'FirmaId', foreignField: '_id', as: 'Firma' } },
      { $unwind: { path: '$Firma', preserveNullAndEmptyArrays: true } }
    ]);

    if (user.length === 0) {
      return res.status(401).json({ message: 'E-posta veya şifre hatalı.' });
    }

    const matchedUser = user[0];

    if (!matchedUser.AktifMi) {
      return res.status(403).json({ message: 'Hesabınız askıya alınmıştır. Lütfen yöneticinizle irtibata geçin.' });
    }

    if (!matchedUser.SifreHash || typeof matchedUser.SifreHash !== 'string') {
      return res.status(401).json({ message: 'E-posta veya şifre hatalı.' });
    }

    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(cleanPassword, matchedUser.SifreHash);
    } catch (bcryptErr) {
      console.warn('[HOMEY API] Bcrypt comparison error:', bcryptErr);
      isMatch = false;
    }

    if (!isMatch) {
      return res.status(401).json({ message: 'E-posta veya şifre hatalı.' });
    }

    const payload = {
      id: matchedUser._id,
      userId: matchedUser._id,
      firmaId: matchedUser.FirmaId,
      rol: matchedUser.Rol,
      eposta: matchedUser.Eposta
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

    res.json({
      token,
      user: {
        id: matchedUser._id,
        firmaId: matchedUser.FirmaId,
        firmaAdi: matchedUser.Firma?.FirmaAdi || 'HOMEY',
        ad: matchedUser.Ad,
        soyad: matchedUser.Soyad,
        eposta: matchedUser.Eposta,
        rol: matchedUser.Rol,
        ilkGirisMi: matchedUser.IlkGirisMi,
        paketTipi: matchedUser.Firma?.PaketTipi || 'DENEME',
        abonelikBitisTarihi: matchedUser.Firma?.AbonelikBitisTarihi,
        profilFoto: matchedUser.ProfilFoto,
        temaTercihi: matchedUser.TemaTercihi
      }
    });

  } catch (error: any) {
    console.error('[HOMEY API] login Error:', error);
    res.status(500).json({ message: 'Giriş yapılırken sunucu hatası oluştu.', error: error.message });
  }
};

// Şifre Değiştirme (POST /api/auth/change-password) - Korumalı Rota
export const changePassword = async (req: any, res: Response) => {
  const { eskiSifre, yeniSifre } = req.body;
  const userId = req.user?.userId;

  if (!eskiSifre || !yeniSifre) {
    return res.status(400).json({ message: 'Eski şifre ve yeni şifre girilmelidir.' });
  }

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    }

    const currentHash = user.SifreHash;

    const isMatch = await bcrypt.compare(eskiSifre, currentHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Eski şifreniz hatalı.' });
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(yeniSifre, salt);

    user.SifreHash = newHash;
    user.IlkGirisMi = false;
    await user.save();

    res.json({ message: 'Şifreniz başarıyla güncellendi.' });

  } catch (error: any) {
    console.error('[HOMEY API] changePassword Error:', error);
    res.status(500).json({ message: 'Şifre güncellenirken sunucu hatası oluştu.', error: error.message });
  }
};

export const updateTheme = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { theme } = req.body;

  if (!userId) {
    return res.status(401).json({ message: 'Yetkisiz erişim.' });
  }

  if (!['light', 'dark', 'system'].includes(theme)) {
    return res.status(400).json({ message: 'Geçersiz tema tercihi.' });
  }

  try {
    await User.updateOne({ _id: userId }, { $set: { TemaTercihi: theme } });
    res.json({ message: 'Tema başarıyla güncellendi.' });
  } catch (error: any) {
    console.error('[HOMEY API] updateTheme Error:', error);
    res.status(500).json({ message: 'Tema güncellenirken hata oluştu.', error: error.message });
  }
};

export const googleLogin = async (req: Request, res: Response) => {
  const { accessToken } = req.body;
  if (!accessToken) {
    return res.status(400).json({ message: 'Google accessToken eksik.' });
  }

  try {
    const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (!googleRes.ok) {
      return res.status(400).json({ message: 'Google doğrulaması başarısız oldu (Geçersiz token).' });
    }

    const payload = (await googleRes.json()) as any;
    if (!payload || !payload.email) {
      return res.status(400).json({ message: 'Google doğrulamasından e-posta adresi alınamadı.' });
    }

    const cleanEmail = payload.email.trim().toLowerCase();
    
    const user = await User.aggregate([
      { $match: { Eposta: new RegExp(`^${cleanEmail}$`, 'i'), $or: [{ SilindiMi: false }, { SilindiMi: { $exists: false } }] } },
      { $lookup: { from: 'Firmalar', localField: 'FirmaId', foreignField: '_id', as: 'Firma' } },
      { $unwind: { path: '$Firma', preserveNullAndEmptyArrays: true } }
    ]);

    if (user.length === 0) {
      return res.status(401).json({ message: 'Firma yetkiliniz tarafından mailinize bir üyelik atanmamıştı bu nedenle giriş yapamıyorsunuz.' });
    }

    const matchedUser = user[0];

    if (!matchedUser.AktifMi) {
      return res.status(403).json({ message: 'Hesabınız askıya alınmıştır. Lütfen yöneticinizle irtibata geçin.' });
    }

    const token = jwt.sign(
      {
        id: matchedUser._id,
        userId: matchedUser._id,
        firmaId: matchedUser.FirmaId,
        rol: matchedUser.Rol,
        eposta: matchedUser.Eposta,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Giriş başarılı',
      token,
      user: {
        id: matchedUser._id,
        firmaId: matchedUser.FirmaId,
        firmaAdi: matchedUser.Firma?.FirmaAdi || '',
        ad: matchedUser.Ad,
        soyad: matchedUser.Soyad,
        eposta: matchedUser.Eposta,
        rol: matchedUser.Rol,
        ilkGirisMi: matchedUser.IlkGirisMi,
        temaTercihi: matchedUser.TemaTercihi || 'light',
        paketTipi: matchedUser.Firma?.PaketTipi || '',
        abonelikBitisTarihi: matchedUser.Firma?.AbonelikBitisTarihi
      }
    });

  } catch (error: any) {
    console.error('[HOMEY API] googleLogin Error:', error);
    res.status(401).json({ message: 'Google ile giriş başarısız oldu.', error: error.message });
  }
};

// Şifremi Unuttum (POST /api/auth/forgot-password)
export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'E-posta adresi gereklidir.' });
  }

  try {
    const user = await User.findOne({ Eposta: email });
    if (!user) {
      // Return success even if not found to prevent email enumeration
      return res.status(200).json({ message: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.' });
    }

    const resetToken = uuidv4();
    const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour

    await User.findByIdAndUpdate(user._id, {
      ResetToken: resetToken,
      ResetTokenExpires: resetTokenExpires
    });

    const resetUrl = `http://localhost:5173/?resetToken=${resetToken}`;
    
    const emailHtml = `
      <h2>Şifre Sıfırlama Talebi</h2>
      <p>Merhaba ${user.Ad},</p>
      <p>Hesabınız için şifre sıfırlama talebinde bulundunuz.</p>
      <p>Aşağıdaki bağlantıya tıklayarak yeni şifrenizi belirleyebilirsiniz:</p>
      <a href="${resetUrl}" style="display:inline-block;padding:10px 20px;background-color:#10b981;color:white;text-decoration:none;border-radius:5px;">Şifremi Sıfırla</a>
      <p>Bu bağlantı 1 saat boyunca geçerlidir. Eğer bu talebi siz yapmadıysanız bu e-postayı dikkate almayınız.</p>
    `;

    await sendEmail(user.Eposta, 'HOMEY - Şifre Sıfırlama', emailHtml);

    res.status(200).json({ message: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Sunucu hatası oluştu.' });
  }
};

// Şifreyi Sıfırla (POST /api/auth/reset-password)
export const resetPassword = async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ message: 'Geçersiz istek. Token ve yeni şifre gereklidir.' });
  }

  try {
    const user = await User.findOne({
      ResetToken: token,
      ResetTokenExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Geçersiz veya süresi dolmuş sıfırlama bağlantısı.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await User.findByIdAndUpdate(user._id, {
      SifreHash: passwordHash,
      $unset: { ResetToken: 1, ResetTokenExpires: 1 }
    });

    res.status(200).json({ message: 'Şifreniz başarıyla güncellendi. Artık yeni şifrenizle giriş yapabilirsiniz.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Sunucu hatası oluştu.' });
  }
};
