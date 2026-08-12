import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Client } from '../models/Client';
import { Portfolio } from '../models/Portfolio';
import { Appointment } from '../models/Appointment';
import { Sale } from '../models/Sale';

// Müşteri Ekleme (POST /api/clients/add) - Korumalı
export const addClient = async (req: any, res: Response) => {
  const { ad, soyad, telefon, aradigiButce, aradigiEmlakTipi, musteriTipi } = req.body;
  const { firmaId, userId } = req.user;

  if (!ad || !telefon || !musteriTipi) {
    return res.status(400).json({ message: 'Ad, telefon ve müşteri tipi alanları zorunludur.' });
  }

  try {
    const newClient = await Client.create({
      _id: uuidv4(),
      FirmaId: firmaId,
      KayitEdenUzmanId: userId,
      Ad: ad,
      Soyad: soyad || '',
      Telefon: telefon,
      AradigiButce: aradigiButce ? Number(aradigiButce) : null,
      AradigiEmlakTipi: aradigiEmlakTipi || null,
      Müşteri_Tipi: musteriTipi,
      is_active: 1
    });

    res.status(201).json({ message: 'Müşteri başarıyla kaydedildi.' });
  } catch (error: any) {
    console.error('[HOMEY API] addClient Error:', error);
    res.status(500).json({ message: 'Müşteri kaydedilirken sunucu hatası oluştu.', error: error.message });
  }
};

// Müşterileri Listeleme (GET /api/clients/list) - Korumalı
export const listClients = async (req: any, res: Response) => {
  const { firmaId } = req.user;
  const userId = req.user?.userId || req.user?.id;

  try {
    // Portfolios of this user
    const portfolios = await Portfolio.find({ GorevliUzmanId: userId, MulkSahibiId: { $ne: null } });
    const portfolioClientIds = portfolios.map(p => p.MulkSahibiId);

    // Appointments of this user
    const appointments = await Appointment.find({ TeklifEdenUzmanId: userId, MusteriId: { $ne: null } });
    const appointmentClientIds = appointments.map(a => a.MusteriId);

    // Sales of this user
    const sales = await Sale.find({ DanismanID: userId, AliciMusteriID: { $ne: null } });
    const saleClientIds = sales.map(s => s.AliciMusteriID);

    const validClientIds = [
      ...portfolioClientIds,
      ...appointmentClientIds,
      ...saleClientIds
    ];

    const clients = await Client.find({
      FirmaId: firmaId,
      $or: [
        { KayitEdenUzmanId: userId },
        { _id: { $in: validClientIds } }
      ]
    }).sort({ KayitTarihi: -1 });

    const mapped = clients.map((c: any) => ({
      id: c._id,
      ad: c.Ad,
      soyad: c.Soyad,
      telefon: c.Telefon,
      butce: Number(c.AradigiButce || 0),
      tip: c.AradigiEmlakTipi || 'TÜMÜ',
      musteriTipi: c.Müşteri_Tipi || 'ALICI',
      isActive: c.is_active === undefined || c.is_active === null ? true : (Boolean(c.is_active) || c.is_active === 1)
    }));

    res.json(mapped);
  } catch (error: any) {
    console.error('[HOMEY API] listClients Error:', error);
    res.status(500).json({ message: 'Müşteriler çekilirken sunucu hatası oluştu.', error: error.message });
  }
};

// Müşteri Aktif/Pasif Durum Değiştirme (PUT /api/clients/toggle-status/:id) - Korumalı
export const toggleClientStatus = async (req: any, res: Response) => {
  const { id } = req.params;
  const { isActive } = req.body;
  const { firmaId } = req.user;

  try {
    await Client.updateOne(
      { _id: id, FirmaId: firmaId },
      { $set: { is_active: isActive ? 1 : 0 } }
    );

    res.json({ message: 'Müşteri durumu güncellendi.', isActive });
  } catch (error: any) {
    console.error('[HOMEY API] toggleClientStatus Error:', error);
    res.status(500).json({ message: 'Müşteri durumu güncellenirken hata oluştu.', error: error.message });
  }
};

