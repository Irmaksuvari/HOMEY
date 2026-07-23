import { Response } from 'express';
import { poolPromise, sql } from '../config/db';

// POST /api/user/toggle-office-status
// Giriş yapan kullanıcının OfisteMi durumunu tersine çevirir
export const toggleOfficeStatus = async (req: any, res: Response) => {
  const { userId, firmaId } = req.user;

  try {
    const pool = await poolPromise;

    // Mevcut durumu oku
    const currentResult = await pool.request()
      .input('userId', sql.UniqueIdentifier, userId)
      .query('SELECT OfisteMi FROM Kullanicilar WHERE Id = @userId');

    if (currentResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    }

    const mevcutDurum: boolean = currentResult.recordset[0].OfisteMi;
    const yeniDurum = !mevcutDurum;

    // Durumu güncelle
    await pool.request()
      .input('userId', sql.UniqueIdentifier, userId)
      .input('yeniDurum', sql.Bit, yeniDurum ? 1 : 0)
      .query('UPDATE Kullanicilar SET OfisteMi = @yeniDurum WHERE Id = @userId');

    res.json({
      ofisteMi: yeniDurum,
      message: yeniDurum ? 'Ofis durumunuz "Ofisteyim" olarak güncellendi.' : 'Ofis durumunuz "Ofiste Değilim" olarak güncellendi.'
    });

  } catch (error: any) {
    console.error('[HOMEY API] toggleOfficeStatus Error:', error);
    res.status(500).json({ message: 'Durum güncellenirken sunucu hatası oluştu.', error: error.message });
  }
};

// GET /api/user/active-in-office
// Aynı firmadaki OfisteMi = 1 olan kullanıcıları listeler
export const getActiveInOffice = async (req: any, res: Response) => {
  const { firmaId } = req.user;

  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input('firmaId', sql.UniqueIdentifier, firmaId)
      .query(`
        SELECT Id, Ad, Soyad, Rol, Eposta, OfisteMi
        FROM Kullanicilar
        WHERE FirmaId = @firmaId
          AND OfisteMi = 1
          AND AktifMi = 1
        ORDER BY Ad ASC
      `);

    const users = result.recordset.map((u: any) => ({
      id: u.Id,
      ad: u.Ad,
      soyad: u.Soyad,
      rol: u.Rol,
      eposta: u.Eposta,
      ofisteMi: !!u.OfisteMi
    }));

    res.json(users);

  } catch (error: any) {
    console.error('[HOMEY API] getActiveInOffice Error:', error);
    res.status(500).json({ message: 'Ofis listesi alınırken sunucu hatası oluştu.', error: error.message });
  }
};

// GET /api/user/my-status
// Giriş yapan kullanıcının güncel ofis durumunu döndürür
export const getMyOfficeStatus = async (req: any, res: Response) => {
  const { userId } = req.user;

  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input('userId', sql.UniqueIdentifier, userId)
      .query('SELECT OfisteMi FROM Kullanicilar WHERE Id = @userId');

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    }

    res.json({ ofisteMi: !!result.recordset[0].OfisteMi });

  } catch (error: any) {
    console.error('[HOMEY API] getMyOfficeStatus Error:', error);
    res.status(500).json({ message: 'Durum sorgulanırken sunucu hatası oluştu.', error: error.message });
  }
};
