import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { poolPromise, sql } from '../config/db';

const JWT_SECRET = process.env.JWT_SECRET || 'homey_super_secret_jwt_key_2026_change_me_in_production';

// Broker & Firma Kayıt (POST /api/auth/register-broker)
export const registerBroker = async (req: Request, res: Response) => {
  const { firmaAdi, vergiNo, sehir, ad, soyad, eposta, sifre, telefon, paketTipi, abonelikTipi } = req.body;

  if (!firmaAdi || !vergiNo || !sehir || !ad || !soyad || !eposta || !sifre) {
    return res.status(400).json({ message: 'Lütfen zorunlu tüm alanları doldurunuz.' });
  }

  const selectedPaketTipi = (paketTipi || 'DENEME').toUpperCase(); // 'DENEME', 'BASIC', 'PREMIUM'
  const selectedAbonelikTipi = (abonelikTipi || 'AYLIK').toUpperCase(); // 'AYLIK', 'YILLIK'

  try {
    const pool = await poolPromise;

    // Eposta mükerrerlik kontrolü
    const checkEmail = await pool.request()
      .input('eposta', sql.NVarChar, eposta)
      .query('SELECT Id FROM Kullanicilar WHERE Eposta = @eposta');

    if (checkEmail.recordset.length > 0) {
      return res.status(400).json({ message: 'Bu e-posta adresi ile zaten bir kullanıcı mevcut.' });
    }

    // Şifre Hashleme
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(sifre, salt);

    // İşlem adımları için transaction başlatma
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // 1. Abonelik bitiş tarihi ve periyot belirleme
      const bitisTarihi = new Date();
      let dbPeriyot: string | null = null;

      if (selectedPaketTipi === 'DENEME') {
        bitisTarihi.setDate(bitisTarihi.getDate() + 30);
        dbPeriyot = null;
      } else if (selectedAbonelikTipi === 'YILLIK') {
        bitisTarihi.setFullYear(bitisTarihi.getFullYear() + 1);
        dbPeriyot = 'Yillik';
      } else { // AYLIK
        bitisTarihi.setMonth(bitisTarihi.getMonth() + 1);
        dbPeriyot = 'Aylik';
      }

      // Firmayı kaydet
      const insertFirmaResult = await transaction.request()
        .input('firmaAdi', sql.NVarChar, firmaAdi)
        .input('vergiNo', sql.NVarChar, vergiNo)
        .input('sehir', sql.NVarChar, sehir)
        .input('paketTipi', sql.NVarChar, selectedPaketTipi)
        .input('abonelikTipi', sql.NVarChar, selectedAbonelikTipi)
        .input('bitisTarihi', sql.DateTime, bitisTarihi)
        .query(`
          INSERT INTO Firmalar (FirmaAdi, VergiNo, Sehir, PaketTipi, AbonelikTipi, AbonelikBitisTarihi)
          OUTPUT inserted.Id
          VALUES (@firmaAdi, @vergiNo, @sehir, @paketTipi, @abonelikTipi, @bitisTarihi)
        `);

      const newFirmaId = insertFirmaResult.recordset[0].Id;

      // 2. AbonelikPaketleri tablosundan PaketID bul ve FirmaAbonelikleri tablosuna ekle
      const dbPaketAdi = selectedPaketTipi === 'DENEME' ? 'Deneme' : selectedPaketTipi === 'BASIC' ? 'Basic' : 'Premium';
      const paketResult = await transaction.request()
        .input('paketAdi', sql.NVarChar, dbPaketAdi)
        .query('SELECT PaketID FROM AbonelikPaketleri WHERE PaketAdi = @paketAdi');

      let paketId = 1; // Fallback
      if (paketResult.recordset.length > 0) {
        paketId = paketResult.recordset[0].PaketID;
      }

      await transaction.request()
        .input('firmaId', sql.UniqueIdentifier, newFirmaId)
        .input('paketId', sql.Int, paketId)
        .input('periyot', sql.NVarChar, dbPeriyot)
        .input('bitisTarihi', sql.DateTime, bitisTarihi)
        .query(`
          INSERT INTO FirmaAbonelikleri (FirmaID, PaketID, Periyot, BaslangicTarihi, BitisTarihi, Durum)
          VALUES (@firmaId, @paketId, @periyot, GETDATE(), @bitisTarihi, 'Aktif')
        `);

      // 3. Broker Kullanıcısını kaydet (Rol: YETKILI, IlkGirisMi: 0 çünkü kendisi şifre seçti)
      const insertUserResult = await transaction.request()
        .input('firmaId', sql.UniqueIdentifier, newFirmaId)
        .input('ad', sql.NVarChar, ad)
        .input('soyad', sql.NVarChar, soyad)
        .input('eposta', sql.NVarChar, eposta)
        .input('sifreHash', sql.NVarChar, passwordHash)
        .input('telefon', sql.NVarChar, telefon || null)
        .query(`
          INSERT INTO Kullanicilar (FirmaId, Ad, Soyad, Eposta, SifreHash, Telefon, Rol, IlkGirisMi, AktifMi)
          OUTPUT inserted.Id
          VALUES (@firmaId, @ad, @soyad, @eposta, @sifreHash, @telefon, 'YETKILI', 0, 1)
        `);

      const newUserId = insertUserResult.recordset[0].Id;

      // 4. Varsayılan Komisyon Ayarlarını tohumla (seed)
      await transaction.request()
        .input('firmaId', sql.UniqueIdentifier, newFirmaId)
        .query(`
          INSERT INTO KomisyonAyarlari (FirmaId, SenaryoA_OfisYuzde, SenaryoA_DanismanYuzde, 
                                        SenaryoB_OfisYuzde, SenaryoB_PortfoySahibiYuzde, SenaryoB_MusteriGetirenYuzde,
                                        SenaryoC_DisOrtakYuzde, SenaryoC_OfisYuzde, SenaryoC_DanismanYuzde)
          VALUES (@firmaId, 40.00, 60.00, 40.00, 30.00, 30.00, 50.00, 40.00, 60.00)
        `);

      await transaction.commit();

      res.status(201).json({
        message: 'Firma ve Broker kaydı başarıyla oluşturuldu. Abonelik başlatıldı.',
        firmaId: newFirmaId,
        userId: newUserId,
        paketTipi: selectedPaketTipi,
        abonelikTipi: selectedAbonelikTipi
      });

    } catch (innerErr) {
      await transaction.rollback();
      throw innerErr;
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
    const pool = await poolPromise;

    // Kullanıcı ve ilişkili firma bilgilerini çekme (LEFT JOIN if firma is missing)
    const result = await pool.request()
      .input('eposta', sql.NVarChar, cleanEmail)
      .query(`
        SELECT k.Id, k.FirmaId, k.Ad, k.Soyad, k.Eposta, k.SifreHash, k.Telefon, k.Rol, k.IlkGirisMi, k.AktifMi,
               f.FirmaAdi, f.PaketTipi, f.AbonelikBitisTarihi
        FROM Kullanicilar k
        LEFT JOIN Firmalar f ON k.FirmaId = f.Id
        WHERE LOWER(TRIM(k.Eposta)) = LOWER(@eposta)
      `);

    if (result.recordset.length === 0) {
      return res.status(401).json({ message: 'E-posta veya şifre hatalı.' });
    }

    const user = result.recordset[0];

    // Kullanıcı aktiflik kontrolü
    if (!user.AktifMi) {
      return res.status(403).json({ message: 'Hesabınız askıya alınmıştır. Lütfen yöneticinizle irtibata geçin.' });
    }

    // Şifre Hash Kontrolü
    if (!user.SifreHash || typeof user.SifreHash !== 'string') {
      return res.status(401).json({ message: 'E-posta veya şifre hatalı.' });
    }

    // Safe Şifre Doğrulama (Bcrypt exception guard)
    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(cleanPassword, user.SifreHash);
    } catch (bcryptErr) {
      console.warn('[HOMEY API] Bcrypt comparison error:', bcryptErr);
      isMatch = false;
    }

    if (!isMatch) {
      return res.status(401).json({ message: 'E-posta veya şifre hatalı.' });
    }

    // JWT Token Üretme
    const payload = {
      userId: user.Id,
      firmaId: user.FirmaId,
      rol: user.Rol,
      eposta: user.Eposta
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

    res.json({
      token,
      user: {
        id: user.Id,
        firmaId: user.FirmaId,
        firmaAdi: user.FirmaAdi || 'HOMEY',
        ad: user.Ad,
        soyad: user.Soyad,
        eposta: user.Eposta,
        rol: user.Rol,
        ilkGirisMi: user.IlkGirisMi,
        paketTipi: user.PaketTipi || 'DENEME',
        abonelikBitisTarihi: user.AbonelikBitisTarihi
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
    const pool = await poolPromise;

    // Mevcut şifreyi doğrula
    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, userId)
      .query('SELECT SifreHash FROM Kullanicilar WHERE Id = @id');

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    }

    const currentHash = result.recordset[0].SifreHash;

    const isMatch = await bcrypt.compare(eskiSifre, currentHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Eski şifreniz hatalı.' });
    }

    // Yeni Şifreyi Hashle
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(yeniSifre, salt);

    // Güncelle ve IlkGirisMi sıfırla
    await pool.request()
      .input('id', sql.UniqueIdentifier, userId)
      .input('sifreHash', sql.NVarChar, newHash)
      .query(`
        UPDATE Kullanicilar
        SET SifreHash = @sifreHash, IlkGirisMi = 0
        WHERE Id = @id
      `);

    res.json({ message: 'Şifreniz başarıyla güncellendi.' });

  } catch (error: any) {
    console.error('[HOMEY API] changePassword Error:', error);
    res.status(500).json({ message: 'Şifre güncellenirken sunucu hatası oluştu.', error: error.message });
  }
};
