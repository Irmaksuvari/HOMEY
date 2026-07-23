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
        p.Tip as PortfoyTip, p.Tur as PortfoyTur, p.Fiyat as PortfoyFiyat, p.Il, p.Ilce, p.Mahalle,
        u.Ad as UzmanAd, u.Soyad as UzmanSoyad,
        m.Ad as MusteriAd, m.Soyad as MusteriSoyad, m.Telefon as MusteriTelefon
      FROM Randevular r
      INNER JOIN Portfoyler p ON r.PortfoyId = p.Id
      INNER JOIN Kullanicilar u ON r.TeklifEdenUzmanId = u.Id
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
  const { portfoyId, musteriId, randevuZamani } = req.body;

  if (!portfoyId || !musteriId || !randevuZamani) {
    return res.status(400).json({ message: 'Portföy, müşteri ve randevu zamanı zorunludur.' });
  }

  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input('portfoyId', sql.UniqueIdentifier, portfoyId)
      .input('teklifEdenUzmanId', sql.UniqueIdentifier, userId)
      .input('musteriId', sql.UniqueIdentifier, musteriId)
      .input('randevuZamani', sql.DateTime, new Date(randevuZamani))
      .input('durum', sql.NVarChar, 'PENDING')
      .query(`
        INSERT INTO Randevular (PortfoyId, TeklifEdenUzmanId, MusteriId, RandevuZamani, Durum)
        OUTPUT inserted.Id
        VALUES (@portfoyId, @teklifEdenUzmanId, @musteriId, @randevuZamani, @durum)
      `);

    const newAppointmentId = result.recordset[0].Id;

    res.status(201).json({
      message: 'Randevu talebi başarıyla kaydedildi.',
      id: newAppointmentId
    });

  } catch (error: any) {
    console.error('[HOMEY API] createAppointment Error:', error);
    res.status(500).json({ message: 'Randevu kaydı oluşturulurken hata oluştu.', error: error.message });
  }
};

// Randevu Durumunu Güncelle (POST /api/appointments/update-status)
export const updateAppointmentStatus = async (req: any, res: Response) => {
  const { appointmentId, durum } = req.body; // 'APPROVED' veya 'REJECTED'

  if (!appointmentId || !durum) {
    return res.status(400).json({ message: 'Randevu ID ve yeni durum belirtilmelidir.' });
  }

  try {
    const pool = await poolPromise;

    await pool.request()
      .input('appointmentId', sql.UniqueIdentifier, appointmentId)
      .input('durum', sql.NVarChar, durum.toUpperCase())
      .query(`
        UPDATE Randevular
        SET Durum = @durum
        WHERE Id = @appointmentId
      `);

    res.json({ message: `Randevu durumu '${durum}' olarak güncellendi.` });

  } catch (error: any) {
    console.error('[HOMEY API] updateAppointmentStatus Error:', error);
    res.status(500).json({ message: 'Randevu durumu güncellenirken hata oluştu.', error: error.message });
  }
};
