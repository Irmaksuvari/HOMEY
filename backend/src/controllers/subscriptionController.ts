import { Response } from 'express';
import { poolPromise, sql } from '../config/db';

// Firmanın Aktif Abonelik Detaylarını ve Gelecek Paket Bilgisini Getirme (GET /api/subscription/details)
export const getSubscriptionDetails = async (req: any, res: Response) => {
  const { firmaId } = req.user;

  try {
    const pool = await poolPromise;

    // Firmaya ve aktif aboneliğe ait tüm detayları çekme
    const result = await pool.request()
      .input('firmaId', sql.UniqueIdentifier, firmaId)
      .query(`
        SELECT 
          f.FirmaAdi, f.PaketTipi as FirmaPaketTipi, f.AbonelikTipi as FirmaAbonelikTipi, f.AbonelikBitisTarihi as FirmaBitisTarihi,
          fa.AbonelikID, fa.PaketID, fa.Periyot, fa.BaslangicTarihi, fa.BitisTarihi, fa.Durum,
          fa.GelecekPaketID, fa.GelecekPeriyot,
          ap.PaketAdi as MevcutPaketAdi, ap.CalisanKotasi as MevcutCalisanKotasi, ap.DenemeSuresiGun,
          gap.PaketAdi as GelecekPaketAdi, gap.CalisanKotasi as GelecekCalisanKotasi
        FROM Firmalar f
        LEFT JOIN FirmaAbonelikleri fa ON f.Id = fa.FirmaID AND fa.Durum = 'Aktif'
        LEFT JOIN AbonelikPaketleri ap ON fa.PaketID = ap.PaketID
        LEFT JOIN AbonelikPaketleri gap ON fa.GelecekPaketID = gap.PaketID
        WHERE f.Id = @firmaId
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Firma abonelik bilgisi bulunamadı.' });
    }

    const row = result.recordset[0];

    const now = new Date();
    const baslangicTarihi = row.BaslangicTarihi ? new Date(row.BaslangicTarihi) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const bitisTarihi = row.BitisTarihi ? new Date(row.BitisTarihi) : (row.FirmaBitisTarihi ? new Date(row.FirmaBitisTarihi) : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000));

    // Gün hesaplamaları
    const diffMs = bitisTarihi.getTime() - now.getTime();
    const kalanGun = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    const toplamMs = Math.max(1000 * 60 * 60 * 24, bitisTarihi.getTime() - baslangicTarihi.getTime());
    const gecenMs = Math.max(0, now.getTime() - baslangicTarihi.getTime());
    const ilerlemeYuzdesi = Math.min(100, Math.max(0, Math.round((gecenMs / toplamMs) * 100)));

    // Mevcut paket adı belirleme
    let paketAdi = row.MevcutPaketAdi || row.FirmaPaketTipi || 'Deneme';
    if (paketAdi.toUpperCase() === 'DENEME') paketAdi = 'Deneme';
    else if (paketAdi.toUpperCase() === 'BASIC') paketAdi = 'Basic';
    else if (paketAdi.toUpperCase() === 'PREMIUM') paketAdi = 'Premium';

    res.json({
      firmaAdi: row.FirmaAdi,
      mevcutPaket: {
        paketId: row.PaketID || 1,
        paketAdi: paketAdi,
        periyot: row.Periyot || row.FirmaAbonelikTipi || (paketAdi === 'Deneme' ? 'Deneme' : 'Aylik'),
        calisanKotasi: row.MevcutCalisanKotasi !== undefined && row.MevcutCalisanKotasi !== null ? row.MevcutCalisanKotasi : (paketAdi === 'Premium' ? null : 4),
        durum: row.Durum || 'Aktif',
        baslangicTarihi: baslangicTarihi.toISOString(),
        bitisTarihi: bitisTarihi.toISOString()
      },
      kalanGun: kalanGun,
      ilerlemeYuzdesi: ilerlemeYuzdesi,
      uyariVerilsinMi: kalanGun <= 7,
      gelecekPaket: row.GelecekPaketID ? {
        paketId: row.GelecekPaketID,
        paketAdi: row.GelecekPaketAdi || (row.GelecekPaketID === 2 ? 'Basic' : 'Premium'),
        periyot: row.GelecekPeriyot || 'Aylik',
        calisanKotasi: row.GelecekCalisanKotasi !== undefined && row.GelecekCalisanKotasi !== null ? row.GelecekCalisanKotasi : (row.GelecekPaketID === 3 ? null : 4)
      } : null
    });

  } catch (error: any) {
    console.error('[HOMEY API] getSubscriptionDetails Error:', error);
    res.status(500).json({ message: 'Abonelik detayları çekilirken sunucu hatası oluştu.', error: error.message });
  }
};

// Gelecek Paket Değişimi Planlama (POST /api/subscription/schedule-change) - Sadece Broker (YETKILI)
export const schedulePackageChange = async (req: any, res: Response) => {
  const { firmaId } = req.user;
  const { gelecekPaketAdi, gelecekPeriyot } = req.body; // 'Basic' veya 'Premium', 'AYLIK' veya 'YILLIK'

  if (!gelecekPaketAdi || !gelecekPeriyot) {
    return res.status(400).json({ message: 'Gelecek paket adı ve periyodu belirtilmelidir.' });
  }

  const normalizedPaketAdi = gelecekPaketAdi.charAt(0).toUpperCase() + gelecekPaketAdi.slice(1).toLowerCase();
  const normalizedPeriyot = gelecekPeriyot.toUpperCase() === 'YILLIK' ? 'Yillik' : 'Aylik';

  try {
    const pool = await poolPromise;

    // 1. Gelecek paketin PaketID bilgisini çek
    const paketResult = await pool.request()
      .input('paketAdi', sql.NVarChar, normalizedPaketAdi)
      .query('SELECT PaketID FROM AbonelikPaketleri WHERE PaketAdi = @paketAdi');

    if (paketResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Belirtilen paket sistemde bulunamadı.' });
    }

    const gelecekPaketId = paketResult.recordset[0].PaketID;

    // 2. FirmaAbonelikleri tablosunda GelecekPaketID ve GelecekPeriyot güncelle
    const updateResult = await pool.request()
      .input('firmaId', sql.UniqueIdentifier, firmaId)
      .input('gelecekPaketId', sql.Int, gelecekPaketId)
      .input('gelecekPeriyot', sql.NVarChar, normalizedPeriyot)
      .query(`
        UPDATE FirmaAbonelikleri
        SET GelecekPaketID = @gelecekPaketId, GelecekPeriyot = @gelecekPeriyot
        WHERE FirmaID = @firmaId AND Durum = 'Aktif'
      `);

    // Eğer FirmaAbonelikleri tablosunda aktif satır yoksa oluştursun
    if (updateResult.rowsAffected[0] === 0) {
      await pool.request()
        .input('firmaId', sql.UniqueIdentifier, firmaId)
        .input('gelecekPaketId', sql.Int, gelecekPaketId)
        .input('gelecekPeriyot', sql.NVarChar, normalizedPeriyot)
        .query(`
          INSERT INTO FirmaAbonelikleri (FirmaID, PaketID, Periyot, BaslangicTarihi, BitisTarihi, Durum, GelecekPaketID, GelecekPeriyot)
          VALUES (@firmaId, 1, 'Deneme', GETDATE(), DATEADD(day, 30, GETDATE()), 'Aktif', @gelecekPaketId, @gelecekPeriyot)
        `);
    }

    res.json({
      message: `Abonelik değişikliğiniz kaydedildi! Mevcut paket dönemi bittiğinde otomatik olarak ${normalizedPaketAdi} (${normalizedPeriyot === 'Yillik' ? 'Yıllık' : 'Aylık'}) paketine geçiş yapılacaktır.`,
      gelecekPaket: {
        paketId: gelecekPaketId,
        paketAdi: normalizedPaketAdi,
        periyot: normalizedPeriyot
      }
    });

  } catch (error: any) {
    console.error('[HOMEY API] schedulePackageChange Error:', error);
    res.status(500).json({ message: 'Paket değişimi planlanırken sunucu hatası oluştu.', error: error.message });
  }
};

// Gelecek Paket Değişim Planını İptal Etme (POST /api/subscription/cancel-schedule) - Sadece Broker (YETKILI)
export const cancelScheduledChange = async (req: any, res: Response) => {
  const { firmaId } = req.user;

  try {
    const pool = await poolPromise;

    await pool.request()
      .input('firmaId', sql.UniqueIdentifier, firmaId)
      .query(`
        UPDATE FirmaAbonelikleri
        SET GelecekPaketID = NULL, GelecekPeriyot = NULL
        WHERE FirmaID = @firmaId
      `);

    res.json({ message: 'Gelecek paket değişim planı başarıyla iptal edildi.' });

  } catch (error: any) {
    console.error('[HOMEY API] cancelScheduledChange Error:', error);
    res.status(500).json({ message: 'Plan iptal edilirken sunucu hatası oluştu.', error: error.message });
  }
};
