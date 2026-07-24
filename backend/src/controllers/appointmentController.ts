import { Response } from 'express';
import { poolPromise, sql } from '../config/db';

// Randevu Listesini Getir (GET /api/appointments/list?startDate=...&endDate=...&portfoyId=...)
export const listAppointments = async (req: any, res: Response) => {
  const { firmaId } = req.user;
  const { startDate, endDate, portfoyId } = req.query;

  try {
    const pool = await poolPromise;

    let queryStr = `
      SELECT 
        r.Id, r.PortfoyId, r.TeklifEdenUzmanId, r.MusteriId, r.RandevuZamani, r.Durum, r.KayitTarihi,
        p.Tip as PortfoyTip, p.Tur as PortfoyTur, p.Fiyat as PortfoyFiyat, p.Il, p.Ilce, p.Mahalle, p.GorevliUzmanId as PortfoySahibiUzmanId,
        u.Ad as UzmanAd, u.Soyad as UzmanSoyad,
        pu.Ad as PortfoySahibiAd, pu.Soyad as PortfoySahibiSoyad,
        m.Ad as MusteriAd, m.Soyad as MusteriSoyad, m.Telefon as MusteriTelefon
      FROM Randevular r
      INNER JOIN Portfoyler p ON r.PortfoyId = p.Id
      INNER JOIN Kullanicilar u ON r.TeklifEdenUzmanId = u.Id
      LEFT JOIN Kullanicilar pu ON p.GorevliUzmanId = pu.Id
      INNER JOIN Musteriler m ON r.MusteriId = m.Id
      WHERE (u.FirmaId = @firmaId OR p.FirmaId = @firmaId)
    `;

    const request = pool.request().input('firmaId', sql.UniqueIdentifier, firmaId);

    if (portfoyId) {
      request.input('portfoyId', sql.UniqueIdentifier, portfoyId as string);
      queryStr += ` AND r.PortfoyId = @portfoyId`;
    }

    if (startDate && endDate) {
      request.input('startDate', sql.DateTime, new Date(startDate as string));
      request.input('endDate', sql.DateTime, new Date(endDate as string));
      queryStr += ` AND r.RandevuZamani >= @startDate AND r.RandevuZamani <= @endDate`;
    }

    queryStr += ` ORDER BY r.RandevuZamani ASC`;

    const result = await request.query(queryStr);

    const appointments = result.recordset.map(r => {
      const dateObj = new Date(r.RandevuZamani);
      return {
        id: r.Id,
        portfoyId: r.PortfoyId,
        portfoyTip: r.PortfoyTip || 'DAIRE',
        portfoyTur: r.PortfoyTur || 'SATILIK',
        portfoyFiyat: r.PortfoyFiyat || 0,
        il: r.Il || '',
        ilce: r.Ilce || '',
        mahalle: r.Mahalle || '',
        talepEden: `${r.UzmanAd || ''} ${r.UzmanSoyad || ''}`.trim(),
        talepEdenId: r.TeklifEdenUzmanId,
        portfoySahibi: `${r.PortfoySahibiAd || ''} ${r.PortfoySahibiSoyad || ''}`.trim(),
        portfoySahibiId: r.PortfoySahibiUzmanId,
        musteri: `${r.MusteriAd || ''} ${r.MusteriSoyad || ''}`.trim(),
        musteriTelefon: r.MusteriTelefon || '',
        musteriId: r.MusteriId,
        randevuZamani: r.RandevuZamani,
        zaman: dateObj.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        tarih: dateObj.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
        gun: dateObj.getDate(),
        ay: dateObj.getMonth() + 1,
        yil: dateObj.getFullYear(),
        durum: r.Durum || 'PENDING'
      };
    });

    res.json(appointments);

  } catch (error: any) {
    console.error('[HOMEY API] listAppointments Error:', error);
    res.status(500).json({ message: 'Randevular getirilirken sunucu hatası oluştu.', error: error.message });
  }
};

// Yeni Randevu Ekle (POST /api/appointments/create)
export const createAppointment = async (req: any, res: Response) => {
  const { userId } = req.user;
  const { portfoyId, musteriId, randevuZamani, durum } = req.body;

  if (!portfoyId || !musteriId || !randevuZamani) {
    return res.status(400).json({ message: 'Portföy, müşteri ve randevu zamanı zorunludur.' });
  }

  const initialStatus = durum ? durum.toUpperCase() : 'PENDING';

  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input('portfoyId', sql.UniqueIdentifier, portfoyId)
      .input('teklifEdenUzmanId', sql.UniqueIdentifier, userId)
      .input('musteriId', sql.UniqueIdentifier, musteriId)
      .input('randevuZamani', sql.DateTime, new Date(randevuZamani))
      .input('durum', sql.NVarChar, initialStatus)
      .query(`
        INSERT INTO Randevular (PortfoyId, TeklifEdenUzmanId, MusteriId, RandevuZamani, Durum)
        OUTPUT inserted.Id
        VALUES (@portfoyId, @teklifEdenUzmanId, @musteriId, @randevuZamani, @durum)
      `);

    const newAppointmentId = result.recordset[0].Id;

    res.status(201).json({
      message: initialStatus === 'APPROVED' ? 'Randevu başarıyla oluşturuldu ve onaylandı.' : 'Randevu talebi başarıyla kaydedildi.',
      id: newAppointmentId
    });

  } catch (error: any) {
    console.error('[HOMEY API] createAppointment Error:', error);
    res.status(500).json({ message: 'Randevu kaydı oluşturulurken hata oluştu.', error: error.message });
  }
};

// Randevu Durumunu Güncelle (POST /api/appointments/update-status)
export const updateAppointmentStatus = async (req: any, res: Response) => {
  const { userId, role } = req.user;
  const { appointmentId, durum } = req.body; // 'APPROVED', 'REJECTED', 'CANCELLED'

  if (!appointmentId || !durum) {
    return res.status(400).json({ message: 'Randevu ID ve yeni durum belirtilmelidir.' });
  }

  const requestedStatus = durum.toUpperCase();

  try {
    const pool = await poolPromise;

    // Randevunun ve bağlı portföyün sahibini kontrol et
    const appCheck = await pool.request()
      .input('appointmentId', sql.UniqueIdentifier, appointmentId)
      .query(`
        SELECT r.Id, r.PortfoyId, r.TeklifEdenUzmanId, p.GorevliUzmanId AS PortfoySahibiUzmanId
        FROM Randevular r
        LEFT JOIN Portfoyler p ON r.PortfoyId = p.Id
        WHERE r.Id = @appointmentId
      `);

    if (appCheck.recordset.length === 0) {
      return res.status(404).json({ message: 'Randevu kaydı bulunamadı.' });
    }

    const appointment = appCheck.recordset[0];
    const isPortfolioOwner = appointment.PortfoySahibiUzmanId === userId;
    const isRequester = appointment.TeklifEdenUzmanId === userId;
    const isYetkili = role === 'YETKILI';

    if (requestedStatus === 'CANCELLED' || requestedStatus === 'IPTAL') {
      // İptal etme yetkisi: Talep eden, Portföy sahibi veya Yetkili
      if (!isRequester && !isPortfolioOwner && !isYetkili) {
        return res.status(403).json({ message: 'Bu randevu talebini iptal etme yetkiniz bulunmamaktadır.' });
      }
    } else if (requestedStatus === 'APPROVED' || requestedStatus === 'REJECTED') {
      // Onaylama / Reddetme yetkisi: Sadece Portföy sahibi veya Yetkili (Talep eden onaylayamaz/reddedemez)
      if (!isPortfolioOwner && !isYetkili) {
        return res.status(403).json({ 
          message: 'Gittiğiniz talebi onaylama veya reddetme yetkiniz yoktur. Yalnızca durumu gözlemleyebilir veya talebi iptal edebilirsiniz.' 
        });
      }
    }

    await pool.request()
      .input('appointmentId', sql.UniqueIdentifier, appointmentId)
      .input('durum', sql.NVarChar, requestedStatus)
      .query(`
        UPDATE Randevular
        SET Durum = @durum
        WHERE Id = @appointmentId
      `);

    let messageText = `Randevu durumu '${requestedStatus}' olarak güncellendi.`;
    if (requestedStatus === 'CANCELLED') messageText = 'Randevu talebiniz iptal edildi.';
    else if (requestedStatus === 'APPROVED') messageText = 'Randevu talebi onaylandı.';
    else if (requestedStatus === 'REJECTED') messageText = 'Randevu talebi reddedildi.';

    res.json({ message: messageText });

  } catch (error: any) {
    console.error('[HOMEY API] updateAppointmentStatus Error:', error);
    res.status(500).json({ message: 'Randevu durumu güncellenirken hata oluştu.', error: error.message });
  }
};
