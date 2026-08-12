import { Response } from 'express';
import { Firm } from '../models/Firm';
import { FirmSubscription } from '../models/FirmSubscription';
import { SubscriptionPackage } from '../models/SubscriptionPackage';

// Firmanın Aktif Abonelik Detaylarını ve Gelecek Paket Bilgisini Getirme (GET /api/subscription/details)
export const getSubscriptionDetails = async (req: any, res: Response) => {
  const { firmaId } = req.user;

  try {
    const firmData = await Firm.aggregate([
      { $match: { _id: firmaId } },
      { $lookup: { from: 'FirmaAbonelikleri', localField: '_id', foreignField: 'FirmaID', as: 'Abonelik' } },
      { $unwind: { path: '$Abonelik', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'AbonelikPaketleri', localField: 'Abonelik.PaketID', foreignField: 'PaketID', as: 'MevcutPaket' } },
      { $unwind: { path: '$MevcutPaket', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'AbonelikPaketleri', localField: 'Abonelik.GelecekPaketID', foreignField: 'PaketID', as: 'GelecekPaket' } },
      { $unwind: { path: '$GelecekPaket', preserveNullAndEmptyArrays: true } }
    ]);

    if (firmData.length === 0) {
      return res.status(404).json({ message: 'Firma abonelik bilgisi bulunamadı.' });
    }

    const row = firmData[0];

    const now = new Date();
    const baslangicTarihi = row.Abonelik?.BaslangicTarihi ? new Date(row.Abonelik.BaslangicTarihi) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const bitisTarihi = row.Abonelik?.BitisTarihi ? new Date(row.Abonelik.BitisTarihi) : (row.AbonelikBitisTarihi ? new Date(row.AbonelikBitisTarihi) : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000));

    // Gün hesaplamaları
    const diffMs = bitisTarihi.getTime() - now.getTime();
    const kalanGun = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    const toplamMs = Math.max(1000 * 60 * 60 * 24, bitisTarihi.getTime() - baslangicTarihi.getTime());
    const gecenMs = Math.max(0, now.getTime() - baslangicTarihi.getTime());
    const ilerlemeYuzdesi = Math.min(100, Math.max(0, Math.round((gecenMs / toplamMs) * 100)));

    // Mevcut paket adı belirleme
    let paketAdi = row.MevcutPaket?.PaketAdi || row.PaketTipi || 'Deneme';
    if (paketAdi.toUpperCase() === 'DENEME') paketAdi = 'Deneme';
    else if (paketAdi.toUpperCase() === 'BASIC') paketAdi = 'Basic';
    else if (paketAdi.toUpperCase() === 'PREMIUM') paketAdi = 'Premium';

    res.json({
      firmaAdi: row.FirmaAdi,
      mevcutPaket: {
        paketId: row.Abonelik?.PaketID || 1,
        paketAdi: paketAdi,
        periyot: row.Abonelik?.Periyot || row.AbonelikTipi || (paketAdi === 'Deneme' ? 'Deneme' : 'Aylik'),
        calisanKotasi: row.MevcutPaket?.CalisanKotasi !== undefined && row.MevcutPaket?.CalisanKotasi !== null ? row.MevcutPaket.CalisanKotasi : (paketAdi === 'Premium' ? null : 4),
        durum: row.Abonelik?.Durum || 'Aktif',
        baslangicTarihi: baslangicTarihi.toISOString(),
        bitisTarihi: bitisTarihi.toISOString()
      },
      kalanGun: kalanGun,
      ilerlemeYuzdesi: ilerlemeYuzdesi,
      uyariVerilsinMi: kalanGun <= 7,
      gelecekPaket: row.Abonelik?.GelecekPaketID ? {
        paketId: row.Abonelik.GelecekPaketID,
        paketAdi: row.GelecekPaket?.PaketAdi || (row.Abonelik.GelecekPaketID === 2 ? 'Basic' : 'Premium'),
        periyot: row.Abonelik?.GelecekPeriyot || 'Aylik',
        calisanKotasi: row.GelecekPaket?.CalisanKotasi !== undefined && row.GelecekPaket?.CalisanKotasi !== null ? row.GelecekPaket.CalisanKotasi : (row.Abonelik.GelecekPaketID === 3 ? null : 4)
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
    const paketResult = await SubscriptionPackage.findOne({ PaketAdi: normalizedPaketAdi });

    if (!paketResult) {
      return res.status(404).json({ message: 'Belirtilen paket sistemde bulunamadı.' });
    }

    const gelecekPaketId = paketResult.PaketID;

    const updateResult = await FirmSubscription.updateOne(
      { FirmaID: firmaId, Durum: 'Aktif' },
      { $set: { GelecekPaketID: gelecekPaketId, GelecekPeriyot: normalizedPeriyot } }
    );

    if (updateResult.modifiedCount === 0 && updateResult.matchedCount === 0) {
      const now = new Date();
      const future = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      await FirmSubscription.create({
        FirmaID: firmaId,
        PaketID: 1,
        Periyot: 'Deneme',
        BaslangicTarihi: now,
        BitisTarihi: future,
        Durum: 'Aktif',
        GelecekPaketID: gelecekPaketId,
        GelecekPeriyot: normalizedPeriyot
      });
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
    await FirmSubscription.updateMany(
      { FirmaID: firmaId },
      { $unset: { GelecekPaketID: "", GelecekPeriyot: "" } }
    );

    res.json({ message: 'Gelecek paket değişim planı başarıyla iptal edildi.' });

  } catch (error: any) {
    console.error('[HOMEY API] cancelScheduledChange Error:', error);
    res.status(500).json({ message: 'Plan iptal edilirken sunucu hatası oluştu.', error: error.message });
  }
};
