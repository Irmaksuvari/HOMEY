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
  const { userId, firmaId } = req.user;
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

    // Randevu oluşturulduğu andan itibaren MusteriSurecleri tablosuna 1. Aşama kaydı at
    try {
      await pool.request()
        .input('musteriId', sql.UniqueIdentifier, musteriId)
        .input('portfoyId', sql.UniqueIdentifier, portfoyId)
        .input('randevuId', sql.UniqueIdentifier, newAppointmentId)
        .input('danismanId', sql.UniqueIdentifier, userId)
        .input('firmaId', sql.UniqueIdentifier, firmaId || null)
        .input('stageId', sql.Int, 1)
        .input('asamaAdi', sql.NVarChar, 'Sonuç Bekleyenler / Yeni Gösterim')
        .query(`
          IF NOT EXISTS (SELECT 1 FROM MusteriSurecleri WHERE MusteriId = @musteriId AND PortfoyId = @portfoyId)
          BEGIN
            INSERT INTO MusteriSurecleri (Id, MusteriId, PortfoyId, RandevuId, DanismanId, FirmaId, AsamaId, AsamaAdi, OlusturmaTarihi, GuncellemeTarihi)
            VALUES (NEWID(), @musteriId, @portfoyId, @randevuId, @danismanId, @firmaId, @stageId, @asamaAdi, GETDATE(), GETDATE())
          END
        `);
      console.log(`[HOMEY API] Yeni Randevu -> MusteriSurecleri 1. Aşama eklendi (Musteri: ${musteriId})`);
    } catch (stageErr: any) {
      console.error('[HOMEY API] Initial MusteriSurecleri insert note:', stageErr.message);
    }

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

    const request = pool.request()
      .input('appointmentId', sql.UniqueIdentifier, appointmentId)
      .input('durum', sql.NVarChar, requestedStatus);

    if (requestedStatus === 'REJECTED') {
      await request.query(`
        DELETE FROM Randevular
        WHERE Id = @appointmentId
      `);
    } else {
      await request.query(`
        UPDATE Randevular
        SET Durum = @durum
        WHERE Id = @appointmentId
      `);
    }

    let messageText = `Randevu durumu '${requestedStatus}' olarak güncellendi.`;
    if (requestedStatus === 'CANCELLED') messageText = 'Randevu talebiniz iptal edildi.';
    else if (requestedStatus === 'APPROVED') messageText = 'Randevu talebi onaylandı.';
    else if (requestedStatus === 'REJECTED') messageText = 'Randevu talebi reddedilerek kalıcı olarak silindi.';

    res.json({ message: messageText });

  } catch (error: any) {
    console.error('[HOMEY API] updateAppointmentStatus Error:', error);
    res.status(500).json({ message: 'Randevu durumu güncellenirken hata oluştu.', error: error.message });
  }
};

// Süreç Aşamalarını Getir (GET /api/appointments/process-stages)
export const getProcessStages = async (req: any, res: Response) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT Id, AsamaAdi, Sira, Durum, Aciklama
      FROM SurecAsamalari
      ORDER BY Sira ASC
    `);

    // Eğer veritabanı tablosu henüz boşsa varsayılan 6 aşamayı döndür
    if (!result.recordset || result.recordset.length === 0) {
      return res.json([
        { id: 1, asamaAdi: 'Sonuç Bekleyenler / Yeni Gösterim', sira: 1 },
        { id: 2, asamaAdi: 'Düşünme Aşaması', sira: 2 },
        { id: 3, asamaAdi: 'Pazarlık / Teklif', sira: 3 },
        { id: 4, asamaAdi: 'Kapora Alındı', sira: 4 },
        { id: 5, asamaAdi: 'Sözleşme / Tapu', sira: 5 },
        { id: 6, asamaAdi: 'Tamamlandı (Satıldı/Kiralandı)', sira: 6 }
      ]);
    }

    const stages = result.recordset.map(r => ({
      id: r.Id,
      asamaAdi: r.AsamaAdi,
      sira: r.Sira,
      durum: r.Durum,
      aciklama: r.Aciklama
    }));

    res.json(stages);
  } catch (error: any) {
    // Veritabanı tablosu henüz sorgulanamıyorsa güvenli varsayılan yanıt döndür
    console.log('[HOMEY API] SurecAsamalari tablosu okunurken varsayılan aşamalar kullanıldı:', error.message);
    res.json([
      { id: 1, asamaAdi: 'Sonuç Bekleyenler / Yeni Gösterim', sira: 1 },
      { id: 2, asamaAdi: 'Düşünme Aşaması', sira: 2 },
      { id: 3, asamaAdi: 'Pazarlık / Teklif', sira: 3 },
      { id: 4, asamaAdi: 'Kapora Alındı', sira: 4 },
      { id: 5, asamaAdi: 'Sözleşme / Tapu', sira: 5 },
      { id: 6, asamaAdi: 'Tamamlandı (Satıldı/Kiralandı)', sira: 6 }
    ]);
  }
};

// Müşteri Süreç Kayıtlarını Getir (GET /api/appointments/client-processes)
export const getClientProcesses = async (req: any, res: Response) => {
  const { firmaId } = req.user;

  try {
    const pool = await poolPromise;

    // MusteriSurecleri tablosu yoksa boş dön
    const tableCheck = await pool.request().query(`
      SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'MusteriSurecleri'
    `);
    if (!tableCheck.recordset[0]?.cnt) {
      return res.json([]);
    }

    const result = await pool.request()
      .input('firmaId', sql.UniqueIdentifier, firmaId || null)
      .query(`
        SELECT
          ms.Id,
          ms.MusteriId,
          ms.PortfoyId,
          ms.DanismanId,
          ms.FirmaId,
          ms.AsamaId,
          ms.AsamaAdi,
          ms.Aciklama,
          ms.OlusturmaTarihi,
          ms.GuncellemeTarihi,
          m.Ad AS MusteriAd,
          m.Soyad AS MusteriSoyad,
          m.Telefon AS MusteriTelefon,
          m.[Müşteri_Tipi] AS MusteriTipi,
          p.Tip AS PortfoyTip,
          p.Tur AS PortfoyTur,
          p.Fiyat AS PortfoyFiyat,
          p.Il AS PortfoyIl,
          p.Ilce AS PortfoyIlce,
          p.Mahalle AS PortfoyMahalle,
          k.Ad AS DanismanAd,
          k.Soyad AS DanismanSoyad
        FROM MusteriSurecleri ms
        LEFT JOIN Musteriler m ON ms.MusteriId = m.Id
        LEFT JOIN Portfoyler p ON ms.PortfoyId = p.Id
        LEFT JOIN Kullanicilar k ON ms.DanismanId = k.Id
        WHERE (@firmaId IS NULL OR ms.FirmaId = @firmaId OR p.FirmaId = @firmaId)
        ORDER BY ms.GuncellemeTarihi DESC
      `);

    const processes = result.recordset.map((row: any) => ({
      id: row.Id,
      musteriId: row.MusteriId,
      portfoyId: row.PortfoyId,
      danismanId: row.DanismanId,
      firmaId: row.FirmaId,
      asamaId: row.AsamaId,
      asamaAdi: row.AsamaAdi,
      aciklama: row.Aciklama,
      kayitTarihi: row.OlusturmaTarihi,
      guncellemeTarihi: row.GuncellemeTarihi,
      musteriAd: row.MusteriAd,
      musteriSoyad: row.MusteriSoyad,
      musteriTelefon: row.MusteriTelefon,
      musteriTipi: row.MusteriTipi,
      musteri: `${row.MusteriAd || ''} ${row.MusteriSoyad || ''}`.trim(),
      portfoyTip: row.PortfoyTip,
      portfoyTur: row.PortfoyTur,
      portfoyFiyat: row.PortfoyFiyat,
      portfoyIl: row.PortfoyIl,
      portfoyIlce: row.PortfoyIlce,
      portfoyMahalle: row.PortfoyMahalle,
      danismanAd: row.DanismanAd,
      danismanSoyad: row.DanismanSoyad,
      danisman: `${row.DanismanAd || ''} ${row.DanismanSoyad || ''}`.trim(),
    }));

    res.json(processes);
  } catch (error: any) {
    console.error('[HOMEY API] getClientProcesses Error:', error);
    res.status(500).json({ message: 'Süreç kayıtları alınırken hata oluştu.', error: error.message });
  }
};

// Randevu Süreç Aşamasını Güncelle (POST /api/appointments/update-stage)
export const updateAppointmentStage = async (req: any, res: Response) => {
  const { appointmentId, stageId, asamaAdi } = req.body;
  const { firmaId, userId } = req.user;

  if (!appointmentId || !stageId) {
    return res.status(400).json({ message: 'Randevu ID ve Aşama ID zorunludur.' });
  }

  try {
    const pool = await poolPromise;

    // 1. Randevu bilgilerini al
    const appRes = await pool.request()
      .input('id', sql.UniqueIdentifier, appointmentId)
      .query('SELECT Id, PortfoyId, MusteriId, TeklifEdenUzmanId FROM Randevular WHERE Id = @id');

    if (appRes.recordset.length === 0) {
      return res.status(404).json({ message: 'Randevu bulunamadı.' });
    }

    const app = appRes.recordset[0];

    // 2. MusteriSurecleri tablosuna kaydet/güncelle
    try {
      const stageRequest = pool.request()
        .input('musteriId', sql.UniqueIdentifier, app.MusteriId || null)
        .input('portfoyId', sql.UniqueIdentifier, app.PortfoyId || null)
        .input('randevuId', sql.UniqueIdentifier, appointmentId)
        .input('danismanId', sql.UniqueIdentifier, userId || null)
        .input('firmaId', sql.UniqueIdentifier, firmaId || null)
        .input('stageId', sql.Int, Number(stageId))
        .input('asamaAdi', sql.NVarChar, asamaAdi || '');

      await stageRequest.query(`
        IF EXISTS (SELECT 1 FROM MusteriSurecleri WHERE MusteriId = @musteriId AND PortfoyId = @portfoyId)
        BEGIN
          UPDATE MusteriSurecleri
          SET AsamaId = @stageId,
              AsamaAdi = @asamaAdi,
              DanismanId = @danismanId,
              FirmaId = @firmaId,
              GuncellemeTarihi = GETDATE()
          WHERE MusteriId = @musteriId AND PortfoyId = @portfoyId
        END
        ELSE
        BEGIN
          INSERT INTO MusteriSurecleri (Id, MusteriId, PortfoyId, RandevuId, DanismanId, FirmaId, AsamaId, AsamaAdi, OlusturmaTarihi, GuncellemeTarihi)
          VALUES (NEWID(), @musteriId, @portfoyId, @randevuId, @danismanId, @firmaId, @stageId, @asamaAdi, GETDATE(), GETDATE())
        END
      `);
      console.log(`[HOMEY API] MusteriSurecleri kaydı eklendi/güncellendi: Musteri=${app.MusteriId}, Stage=${stageId} (${asamaAdi})`);
    } catch (dbErr: any) {
      console.error('[HOMEY API] MusteriSurecleri insert/update error:', dbErr.message);
    }

    res.json({ message: `Randevu süreç aşaması '${asamaAdi || stageId}' olarak güncellendi.` });

  } catch (error: any) {
    console.error('[HOMEY API] updateAppointmentStage Error:', error);
    res.status(500).json({ message: 'Randevu aşaması güncellenirken hata oluştu.', error: error.message });
  }
};

// Mevcut Tüm Randevuları MusteriSurecleri Tablosuna Ekle (POST /api/appointments/backfill-stages)
export const backfillExistingAppointments = async (req: any, res: Response) => {
  const { firmaId } = req.user;

  try {
    const pool = await poolPromise;

    // Tabloyu oluştur (yoksa)
    await pool.request().query(`
      IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'MusteriSurecleri')
      BEGIN
        CREATE TABLE MusteriSurecleri (
          Id UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
          MusteriId UNIQUEIDENTIFIER NULL,
          PortfoyId UNIQUEIDENTIFIER NULL,
          DanismanId UNIQUEIDENTIFIER NULL,
          FirmaId UNIQUEIDENTIFIER NULL,
          AsamaId INT NULL,
          AsamaAdi NVARCHAR(255) NULL,
          Aciklama NVARCHAR(MAX) NULL,
          KayitTarihi DATETIME DEFAULT GETDATE(),
          GuncellemeTarihi DATETIME DEFAULT GETDATE()
        );
      END
    `);

    // Mevcut tüm randevuları çek - MusteriSurecleri'nde kaydı olmayan randevular
    const existing = await pool.request()
      .input('firmaId', sql.UniqueIdentifier, firmaId || null)
      .query(`
        SELECT r.Id, r.MusteriId, r.PortfoyId, r.TeklifEdenUzmanId, p.FirmaId AS PortfoyFirmaId
        FROM Randevular r
        LEFT JOIN Portfoyler p ON r.PortfoyId = p.Id
        WHERE r.MusteriId IS NOT NULL
          AND r.PortfoyId IS NOT NULL
          AND (@firmaId IS NULL OR p.FirmaId = @firmaId)
          AND NOT EXISTS (
            SELECT 1 FROM MusteriSurecleri ms
            WHERE ms.MusteriId = r.MusteriId AND ms.PortfoyId = r.PortfoyId
          )
      `);

    const rows = existing.recordset;
    let insertedCount = 0;

    for (const row of rows) {
      try {
        await pool.request()
          .input('musteriId', sql.UniqueIdentifier, row.MusteriId)
          .input('portfoyId', sql.UniqueIdentifier, row.PortfoyId)
          .input('randevuId', sql.UniqueIdentifier, row.Id || null)
          .input('danismanId', sql.UniqueIdentifier, row.TeklifEdenUzmanId || null)
          .input('firmaId', sql.UniqueIdentifier, row.PortfoyFirmaId || firmaId || null)
          .input('stageId', sql.Int, 1)
          .input('asamaAdi', sql.NVarChar, 'Sonuç Bekleyenler / Yeni Gösterim')
          .query(`
            INSERT INTO MusteriSurecleri (Id, MusteriId, PortfoyId, RandevuId, DanismanId, FirmaId, AsamaId, AsamaAdi, OlusturmaTarihi, GuncellemeTarihi)
            VALUES (NEWID(), @musteriId, @portfoyId, @randevuId, @danismanId, @firmaId, @stageId, @asamaAdi, GETDATE(), GETDATE())
          `);
        insertedCount++;
      } catch (rowErr: any) {
        console.warn('[HOMEY API] Backfill row error:', rowErr.message);
      }
    }

    console.log(`[HOMEY API] Backfill tamamlandı: ${insertedCount} randevu MusteriSurecleri tablosuna eklendi.`);
    res.json({
      message: `${insertedCount} mevcut randevu süreç tablosuna (1. Aşama) eklendi.`,
      total: rows.length,
      inserted: insertedCount
    });

  } catch (error: any) {
    console.error('[HOMEY API] backfillExistingAppointments Error:', error);
    res.status(500).json({ message: 'Mevcut randevular eklenirken hata oluştu.', error: error.message });
  }
};

// Teşhis: MusteriSurecleri ve Randevular tablosu durumunu kontrol et (GET /api/appointments/diagnose)
export const diagnoseMusteriSurecleri = async (req: any, res: Response) => {
  const { firmaId, userId } = req.user;

  try {
    const pool = await poolPromise;
    const report: any = { firmaId, userId, checks: [] };

    // 1. Randevular tablosunda kayıt var mı?
    try {
      const r1 = await pool.request().query(`SELECT COUNT(*) as cnt FROM Randevular`);
      report.checks.push({ label: 'Randevular (toplam)', value: r1.recordset[0].cnt });
    } catch (e: any) { report.checks.push({ label: 'Randevular (hata)', value: e.message }); }

    // 2. Randevular tablosunda MusteriId ve PortfoyId dolu mu?
    try {
      const r2 = await pool.request().query(`
        SELECT COUNT(*) as cnt FROM Randevular WHERE MusteriId IS NOT NULL AND PortfoyId IS NOT NULL
      `);
      report.checks.push({ label: 'Randevular (MusteriId+PortfoyId dolu)', value: r2.recordset[0].cnt });
    } catch (e: any) { report.checks.push({ label: 'Randevular MusteriId check (hata)', value: e.message }); }

    // 3. MusteriSurecleri tablosu var mı?
    try {
      const r3 = await pool.request().query(`
        SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'MusteriSurecleri'
      `);
      report.checks.push({ label: 'MusteriSurecleri tablosu mevcut mu?', value: r3.recordset[0].cnt > 0 ? 'EVET' : 'HAYIR' });
    } catch (e: any) { report.checks.push({ label: 'MusteriSurecleri kontrol (hata)', value: e.message }); }

    // 4. MusteriSurecleri tablosunda kayıt var mı?
    try {
      const r4 = await pool.request().query(`SELECT COUNT(*) as cnt FROM MusteriSurecleri`);
      report.checks.push({ label: 'MusteriSurecleri (toplam kayıt)', value: r4.recordset[0].cnt });
    } catch (e: any) { report.checks.push({ label: 'MusteriSurecleri kayıt sayısı (hata)', value: e.message }); }

    // 5. Randevular tablosundan örnek satırlar
    try {
      const r5 = await pool.request().query(`SELECT TOP 3 Id, MusteriId, PortfoyId, TeklifEdenUzmanId FROM Randevular`);
      report.checks.push({ label: 'Randevular (ilk 3 satır)', value: r5.recordset });
    } catch (e: any) { report.checks.push({ label: 'Randevular örnek (hata)', value: e.message }); }

    // 6. Portfoyler'de FirmaId var mı?
    try {
      const r6 = await pool.request()
        .input('firmaId', sql.UniqueIdentifier, firmaId || null)
        .query(`SELECT COUNT(*) as cnt FROM Portfoyler WHERE FirmaId = @firmaId`);
      report.checks.push({ label: `Portfoyler (firmaId=${firmaId})`, value: r6.recordset[0].cnt });
    } catch (e: any) { report.checks.push({ label: 'Portfoyler firmaId check (hata)', value: e.message }); }

    // 7. Randevular + Portfoyler JOIN ile backfill sorgusu gibi çalıştır
    try {
      const r7 = await pool.request()
        .input('firmaId2', sql.UniqueIdentifier, firmaId || null)
        .query(`
          SELECT COUNT(*) as cnt
          FROM Randevular r
          LEFT JOIN Portfoyler p ON r.PortfoyId = p.Id
          WHERE r.MusteriId IS NOT NULL
            AND r.PortfoyId IS NOT NULL
            AND (@firmaId2 IS NULL OR p.FirmaId = @firmaId2)
        `);
      report.checks.push({ label: 'Backfill JOIN sorgusu sonucu', value: r7.recordset[0].cnt });
    } catch (e: any) { report.checks.push({ label: 'Backfill JOIN (hata)', value: e.message }); }

    res.json(report);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

