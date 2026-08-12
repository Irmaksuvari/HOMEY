import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Appointment } from '../models/Appointment';
import { AppointmentArchive } from '../models/AppointmentArchive';
import { Portfolio } from '../models/Portfolio';
import { User } from '../models/User';
import { Client } from '../models/Client';
import { ClientProcess } from '../models/ClientProcess';
import { ProcessStage } from '../models/ProcessStage';

// Randevu Listesini Getir (GET /api/appointments/list?startDate=...&endDate=...&portfoyId=...)
export const listAppointments = async (req: any, res: Response) => {
  const { firmaId } = req.user;
  const userId = req.user?.userId || req.user?.id;
  const { startDate, endDate, portfoyId } = req.query;

  try {
    let matchStage: any = {};
    
    if (portfoyId) {
      matchStage.PortfoyId = portfoyId;
    }
    
    if (startDate && endDate) {
      matchStage.RandevuZamani = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    }

    const appointmentsAggr = await Appointment.aggregate([
      { $match: matchStage },
      { $lookup: { from: 'Portfoyler', localField: 'PortfoyId', foreignField: '_id', as: 'Portfoy' } },
      { $unwind: { path: '$Portfoy', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'Kullanicilar', localField: 'TeklifEdenUzmanId', foreignField: '_id', as: 'Uzman' } },
      { $unwind: { path: '$Uzman', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'Kullanicilar', localField: 'Portfoy.GorevliUzmanId', foreignField: '_id', as: 'PortfoySahibi' } },
      { $unwind: { path: '$PortfoySahibi', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'Musteriler', localField: 'MusteriId', foreignField: '_id', as: 'Musteri' } },
      { $unwind: { path: '$Musteri', preserveNullAndEmptyArrays: true } },
      {
        $match: {
          $or: [
            { 'Uzman.FirmaId': firmaId },
            { 'Portfoy.FirmaId': firmaId }
          ],
          $and: [
            {
              $or: [
                { 'TeklifEdenUzmanId': userId },
                { 'Portfoy.GorevliUzmanId': userId }
              ]
            }
          ]
        }
      },
      { $sort: { RandevuZamani: 1 } }
    ]);

    const appointments = appointmentsAggr.map(r => {
      const dateObj = new Date(r.RandevuZamani);
      return {
        id: r._id,
        portfoyId: r.PortfoyId,
        portfoyTip: r.Portfoy?.Tip || 'DAIRE',
        portfoyTur: r.Portfoy?.Tur || 'SATILIK',
        portfoyFiyat: r.Portfoy?.Fiyat || 0,
        il: r.Portfoy?.Il || '',
        ilce: r.Portfoy?.Ilce || '',
        mahalle: r.Portfoy?.Mahalle || '',
        talepEden: r.Uzman ? `${r.Uzman.Ad || ''} ${r.Uzman.Soyad || ''}`.trim() : '',
        talepEdenId: r.TeklifEdenUzmanId,
        portfoySahibi: r.PortfoySahibi ? `${r.PortfoySahibi.Ad || ''} ${r.PortfoySahibi.Soyad || ''}`.trim() : '',
        portfoySahibiId: r.Portfoy?.GorevliUzmanId,
        musteri: r.Musteri ? `${r.Musteri.Ad || ''} ${r.Musteri.Soyad || ''}`.trim() : '',
        musteriTelefon: r.Musteri?.Telefon || '',
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
    const newAppointmentId = uuidv4();

    await Appointment.create({
      _id: newAppointmentId,
      PortfoyId: portfoyId,
      TeklifEdenUzmanId: userId,
      MusteriId: musteriId,
      RandevuZamani: new Date(randevuZamani),
      Durum: initialStatus,
      KayitTarihi: new Date()
    });

    try {
      const existingProcess = await ClientProcess.findOne({ MusteriId: musteriId, PortfoyId: portfoyId });
      
      if (!existingProcess) {
        await ClientProcess.create({
          _id: uuidv4(),
          MusteriId: musteriId,
          PortfoyId: portfoyId,
          RandevuId: newAppointmentId,
          DanismanId: userId,
          FirmaId: firmaId,
          AsamaId: 1,
          AsamaAdi: 'Portföy yüklendi',
          OlusturmaTarihi: new Date(),
          GuncellemeTarihi: new Date()
        });
        console.log(`[HOMEY API] Yeni Randevu -> MusteriSurecleri 1. Aşama eklendi (Musteri: ${musteriId})`);
      }
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
    const appointmentAggr = await Appointment.aggregate([
      { $match: { _id: appointmentId } },
      { $lookup: { from: 'Portfoyler', localField: 'PortfoyId', foreignField: '_id', as: 'Portfoy' } },
      { $unwind: { path: '$Portfoy', preserveNullAndEmptyArrays: true } }
    ]);

    if (appointmentAggr.length === 0) {
      return res.status(404).json({ message: 'Randevu kaydı bulunamadı.' });
    }

    const appointment = appointmentAggr[0];
    const isPortfolioOwner = appointment.Portfoy?.GorevliUzmanId === userId;
    const isRequester = appointment.TeklifEdenUzmanId === userId;

    if (requestedStatus === 'CANCELLED' || requestedStatus === 'IPTAL') {
      if (!isRequester && !isPortfolioOwner) {
        return res.status(403).json({ message: 'Bu randevu talebini iptal etme yetkiniz bulunmamaktadır.' });
      }
    } else if (requestedStatus === 'APPROVED' || requestedStatus === 'REJECTED') {
      if (!isPortfolioOwner) {
        return res.status(403).json({ 
          message: 'Gittiğiniz talebi onaylama veya reddetme yetkiniz yoktur. Yalnızca durumu gözlemleyebilir veya talebi iptal edebilirsiniz.' 
        });
      }
    }

    if (requestedStatus === 'REJECTED' || requestedStatus === 'CANCELLED' || requestedStatus === 'IPTAL') {
      await AppointmentArchive.create({
        _id: appointment._id,
        PortfoyId: appointment.PortfoyId,
        TeklifEdenUzmanId: appointment.TeklifEdenUzmanId,
        MusteriId: appointment.MusteriId,
        RandevuZamani: appointment.RandevuZamani,
        Durum: requestedStatus,
        KayitTarihi: appointment.KayitTarihi
      });
      await Appointment.deleteOne({ _id: appointmentId });
    } else {
      await Appointment.updateOne({ _id: appointmentId }, { $set: { Durum: requestedStatus } });
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
    const result = await ProcessStage.find().sort({ SiraNo: 1 });

    if (result.length === 0) {
      return res.json([
        { id: 1, asamaAdi: 'Portföy & Randevu Süreci', sira: 1 },
        { id: 3, asamaAdi: 'Anlaşma süreci', sira: 2 },
        { id: 4, asamaAdi: 'Satıldı/Kiralandı', sira: 3 },
        { id: 5, asamaAdi: 'Vazgeçildi', sira: 4 }
      ]);
    }

    const stages = result.map(r => ({
      id: r.Id,
      asamaAdi: r.Baslik,
      sira: r.SiraNo,
      durum: r.IsActive
    }));

    res.json(stages);
  } catch (error: any) {
    console.log('[HOMEY API] SurecAsamalari tablosu okunurken varsayılan aşamalar kullanıldı:', error.message);
    res.json([
      { id: 1, asamaAdi: 'Portföy & Randevu Süreci', sira: 1 },
      { id: 3, asamaAdi: 'Anlaşma süreci', sira: 2 },
      { id: 4, asamaAdi: 'Satıldı/Kiralandı', sira: 3 },
      { id: 5, asamaAdi: 'Vazgeçildi', sira: 4 }
    ]);
  }
};

// Müşteri Süreç Kayıtlarını Getir (GET /api/appointments/client-processes)
export const getClientProcesses = async (req: any, res: Response) => {
  const { firmaId } = req.user;
  const userId = req.user?.userId || req.user?.id;

  try {
    const processesAggr = await ClientProcess.aggregate([
      { $lookup: { from: 'Musteriler', localField: 'MusteriId', foreignField: '_id', as: 'Musteri' } },
      { $unwind: { path: '$Musteri', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'Portfoyler', localField: 'PortfoyId', foreignField: '_id', as: 'Portfoy' } },
      { $unwind: { path: '$Portfoy', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'Musteriler', localField: 'Portfoy.MulkSahibiId', foreignField: '_id', as: 'MulkSahibi' } },
      { $unwind: { path: '$MulkSahibi', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'Kullanicilar', localField: 'DanismanId', foreignField: '_id', as: 'Danisman' } },
      { $unwind: { path: '$Danisman', preserveNullAndEmptyArrays: true } },
      {
        $match: {
          $or: [
            { FirmaId: firmaId },
            { 'Portfoy.FirmaId': firmaId }
          ],
          $and: [
            {
              $or: [
                { DanismanId: userId },
                { 'Portfoy.GorevliUzmanId': userId }
              ]
            }
          ]
        }
      },
      { $sort: { GuncellemeTarihi: -1 } }
    ]);

    const processes = processesAggr.map((row: any) => ({
      id: row._id,
      musteriId: row.MusteriId,
      portfoyId: row.PortfoyId,
      danismanId: row.DanismanId,
      firmaId: row.FirmaId,
      asamaId: row.AsamaId,
      asamaAdi: row.AsamaAdi,
      randevuId: row.RandevuId,
      aciklama: row.Aciklama,
      evraklarTamamlandi: row.EvraklarTamamlandi,
      kayitTarihi: row.OlusturmaTarihi,
      guncellemeTarihi: row.GuncellemeTarihi,
      musteriAd: row.Musteri?.Ad,
      musteriSoyad: row.Musteri?.Soyad,
      musteriTelefon: row.Musteri?.Telefon,
      musteri: row.Musteri ? `${row.Musteri.Ad || ''} ${row.Musteri.Soyad || ''}`.trim() : null,
      musteriTipi: row.Musteri?.Müşteri_Tipi,
      portfoyBaslik: row.Portfoy?.Baslik,
      portfoyTip: row.Portfoy?.Tip,
      portfoyTur: row.Portfoy?.Tur,
      portfoyFiyat: row.Portfoy?.Fiyat,
      portfoyIl: row.Portfoy?.Il,
      portfoyIlce: row.Portfoy?.Ilce,
      portfoyMahalle: row.Portfoy?.Mahalle,
      danisman: row.Danisman ? `${row.Danisman.Ad || ''} ${row.Danisman.Soyad || ''}`.trim() : null,
      evSahibi: row.MulkSahibi ? `${row.MulkSahibi.Ad || ''} ${row.MulkSahibi.Soyad || ''}`.trim() : null
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
    const appAggr = await Appointment.aggregate([
      { $match: { _id: appointmentId } },
      { $lookup: { from: 'Portfoyler', localField: 'PortfoyId', foreignField: '_id', as: 'Portfoy' } },
      { $unwind: { path: '$Portfoy', preserveNullAndEmptyArrays: true } }
    ]);

    if (appAggr.length === 0) {
      return res.status(404).json({ message: 'Randevu bulunamadı.' });
    }

    const app = appAggr[0];

    if (app.TeklifEdenUzmanId !== userId && app.Portfoy?.GorevliUzmanId !== userId) {
      return res.status(403).json({ message: 'Bu randevu aşamasını güncellemek için yetkiniz bulunmamaktadır.' });
    }

    try {
      const existingProcess = await ClientProcess.findOne({ MusteriId: app.MusteriId, PortfoyId: app.PortfoyId });
      
      if (existingProcess) {
        await ClientProcess.updateOne(
          { MusteriId: app.MusteriId, PortfoyId: app.PortfoyId },
          { 
            $set: { 
              AsamaId: Number(stageId), 
              AsamaAdi: asamaAdi || '', 
              DanismanId: userId || null, 
              FirmaId: firmaId || null, 
              GuncellemeTarihi: new Date() 
            } 
          }
        );
      } else {
        await ClientProcess.create({
          _id: uuidv4(),
          MusteriId: app.MusteriId,
          PortfoyId: app.PortfoyId,
          RandevuId: appointmentId,
          DanismanId: userId,
          FirmaId: firmaId,
          AsamaId: Number(stageId),
          AsamaAdi: asamaAdi || '',
          OlusturmaTarihi: new Date(),
          GuncellemeTarihi: new Date()
        });
      }
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
    const existing = await Appointment.aggregate([
      { $match: { MusteriId: { $ne: null }, PortfoyId: { $ne: null } } },
      { $lookup: { from: 'Portfoyler', localField: 'PortfoyId', foreignField: '_id', as: 'Portfoy' } },
      { $unwind: { path: '$Portfoy', preserveNullAndEmptyArrays: true } },
      { $match: { $or: [ { 'Portfoy.FirmaId': firmaId } ] } } // In mongo backfill we only look at firm's portfolios
    ]);

    let insertedCount = 0;

    for (const row of existing) {
      try {
        const proc = await ClientProcess.findOne({ MusteriId: row.MusteriId, PortfoyId: row.PortfoyId });
        if (!proc) {
          await ClientProcess.create({
            _id: uuidv4(),
            MusteriId: row.MusteriId,
            PortfoyId: row.PortfoyId,
            RandevuId: row._id,
            DanismanId: row.TeklifEdenUzmanId || null,
            FirmaId: row.Portfoy?.FirmaId || firmaId || null,
            AsamaId: 1,
            AsamaAdi: 'Portföy yüklendi',
            OlusturmaTarihi: new Date(),
            GuncellemeTarihi: new Date()
          });
          insertedCount++;
        }
      } catch (rowErr: any) {
        console.warn('[HOMEY API] Backfill row error:', rowErr.message);
      }
    }

    console.log(`[HOMEY API] Backfill tamamlandı: ${insertedCount} randevu MusteriSurecleri tablosuna eklendi.`);
    res.json({
      message: `${insertedCount} mevcut randevu süreç tablosuna (1. Aşama) eklendi.`,
      total: existing.length,
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
    const report: any = { firmaId, userId, checks: [] };

    try {
      const c1 = await Appointment.countDocuments();
      report.checks.push({ label: 'Randevular (toplam)', value: c1 });
    } catch (e: any) { report.checks.push({ label: 'Randevular (hata)', value: e.message }); }

    try {
      const c2 = await Appointment.countDocuments({ MusteriId: { $ne: null }, PortfoyId: { $ne: null } });
      report.checks.push({ label: 'Randevular (MusteriId+PortfoyId dolu)', value: c2 });
    } catch (e: any) { report.checks.push({ label: 'Randevular MusteriId check (hata)', value: e.message }); }

    try {
      report.checks.push({ label: 'MusteriSurecleri tablosu mevcut mu?', value: 'EVET' });
    } catch (e: any) { report.checks.push({ label: 'MusteriSurecleri kontrol (hata)', value: e.message }); }

    try {
      const c4 = await ClientProcess.countDocuments();
      report.checks.push({ label: 'MusteriSurecleri (toplam kayıt)', value: c4 });
    } catch (e: any) { report.checks.push({ label: 'MusteriSurecleri kayıt sayısı (hata)', value: e.message }); }

    try {
      const r5 = await Appointment.find().limit(3).select('MusteriId PortfoyId TeklifEdenUzmanId');
      report.checks.push({ label: 'Randevular (ilk 3 satır)', value: r5 });
    } catch (e: any) { report.checks.push({ label: 'Randevular örnek (hata)', value: e.message }); }

    try {
      const c6 = await Portfolio.countDocuments({ FirmaId: firmaId });
      report.checks.push({ label: `Portfoyler (firmaId=${firmaId})`, value: c6 });
    } catch (e: any) { report.checks.push({ label: 'Portfoyler firmaId check (hata)', value: e.message }); }

    res.json(report);
  } catch (error: any) {
    console.error('[HOMEY API] diagnose error:', error.message);
    res.status(500).json({ message: 'Teşhis sırasında bir hata oluştu.', error: error.message });
  }
};

// POST /api/appointments/update-documents-status
export const updateProcessDocumentsStatus = async (req: any, res: Response) => {
  const { processId, status } = req.body;
  const firmaId = req.user?.firmaId;

  if (!processId) {
    return res.status(400).json({ message: 'Süreç ID (processId) gereklidir.' });
  }

  try {
    await ClientProcess.updateOne(
      { _id: processId, ...(firmaId ? { FirmaId: firmaId } : {}) },
      { $set: { EvraklarTamamlandi: status ? true : false, GuncellemeTarihi: new Date() } }
    );
      
    res.json({ message: 'Evrak durumu başarıyla güncellendi.' });
  } catch (error: any) {
    console.error('[HOMEY API] updateProcessDocumentsStatus error:', error.message);
    res.status(500).json({ message: 'Evrak durumu güncellenirken bir hata oluştu.' });
  }
};

