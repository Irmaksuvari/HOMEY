import { Response } from 'express';
import { Portfolio } from '../models/Portfolio';
import { Client } from '../models/Client';
import { User } from '../models/User';
import { Appointment } from '../models/Appointment';

const SYSTEM_PAGES = [
  { id: 'dashboard', title: 'Ana Sayfa', description: 'Metrikler ve Genel Özet' },
  { id: 'portfolios', title: 'Portföyler', description: 'Gayrimenkul ve İlan Listesi' },
  { id: 'appointments', title: 'Randevular & Ajanda', description: 'Gösterimler ve Randevu Takvimi' },
  { id: 'clients', title: 'Müşteriler (CRM)', description: 'Alıcı ve Satıcı Adayları' },
  { id: 'calculator', title: 'Komisyon Hesaplayıcı', description: 'Paylaşım ve Senaryo Hesaplama' },
  { id: 'analytics', title: 'Ciro Raporları', description: 'Gelir ve Ofis Performansı' },
  { id: 'team', title: 'Danışman Yönetimi', description: 'Ofis Çalışanları ve Şifre İşlemleri' },
  { id: 'subscription', title: 'Abonelik Yönetimi', description: 'Paket ve Lisans Süreleri' },
  { id: 'settings', title: 'Komisyon Ayarları', description: 'Ofis Oran Senaryoları' },
];

export const globalSearch = async (req: any, res: Response) => {
  const { firmaId } = req.user;
  const q = req.query.q ? String(req.query.q).trim() : '';

  if (!q || q.length < 2) {
    return res.json({ portfolios: [], clients: [], employees: [], appointments: [], pages: [] });
  }

  const lowerQ = q.toLowerCase();
  const searchRegex = new RegExp(q, 'i');

  const matchedPages = SYSTEM_PAGES.filter(
    page => page.title.toLowerCase().includes(lowerQ) || page.description.toLowerCase().includes(lowerQ)
  );

  try {
    const [portfoliosResult, clientsResult, employeesResult, appointmentsResult] = await Promise.all([
      // 1. Portfolios Search
      Portfolio.aggregate([
        { $match: { FirmaId: firmaId, $or: [
          { Tip: searchRegex }, { Tur: searchRegex }, { Il: searchRegex }, { Ilce: searchRegex }, { Mahalle: searchRegex }
        ]}},
        { $sort: { KayitTarihi: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'Kullanicilar', localField: 'GorevliUzmanId', foreignField: '_id', as: 'Uzman' } },
        { $unwind: { path: '$Uzman', preserveNullAndEmptyArrays: true } }
      ]),

      // 2. Clients Search
      Client.find({
        FirmaId: firmaId,
        $or: [{ Ad: searchRegex }, { Soyad: searchRegex }, { Telefon: searchRegex }]
      }).sort({ KayitTarihi: -1 }).limit(5),

      // 3. Employees Search
      User.find({
        FirmaId: firmaId,
        $or: [{ Ad: searchRegex }, { Soyad: searchRegex }, { Eposta: searchRegex }]
      }).limit(5),

      // 4. Appointments Search (Using aggregate for JOINs)
      Appointment.aggregate([
        { $lookup: { from: 'Portfoyler', localField: 'PortfoyId', foreignField: '_id', as: 'Portfoy' } },
        { $unwind: { path: '$Portfoy', preserveNullAndEmptyArrays: true } },
        { $lookup: { from: 'Kullanicilar', localField: 'TeklifEdenUzmanId', foreignField: '_id', as: 'Uzman' } },
        { $unwind: { path: '$Uzman', preserveNullAndEmptyArrays: true } },
        { $lookup: { from: 'Musteriler', localField: 'MusteriId', foreignField: '_id', as: 'Musteri' } },
        { $unwind: { path: '$Musteri', preserveNullAndEmptyArrays: true } },
        { $match: { 
          $and: [
            { $or: [ { 'Uzman.FirmaId': firmaId }, { 'Portfoy.FirmaId': firmaId } ] },
            { $or: [
              { 'Portfoy.Tip': searchRegex },
              { 'Uzman.Ad': searchRegex },
              { 'Musteri.Ad': searchRegex },
              { 'Portfoy.Ilce': searchRegex },
              { 'Durum': searchRegex }
            ]}
          ]
        }},
        { $sort: { RandevuZamani: -1 } },
        { $limit: 5 }
      ])
    ]);

    res.json({
      portfolios: portfoliosResult.map((p: any) => ({
        id: p._id,
        tip: p.Tip,
        tur: p.Tur,
        fiyat: p.Fiyat,
        metrekare: p.Metrekare,
        odaSayisi: p.OdaSayisi,
        il: p.Il,
        ilce: p.Ilce,
        mahalle: p.Mahalle,
        gorevliUzman: `${p.Uzman?.Ad || ''} ${p.Uzman?.Soyad || ''}`.trim()
      })),
      clients: clientsResult.map((c: any) => ({
        id: c._id,
        ad: `${c.Ad || ''} ${c.Soyad || ''}`.trim(),
        telefon: c.Telefon,
        butce: c.AradigiButce,
        tip: c.AradigiEmlakTipi || 'TÜMÜ',
        musteriTipi: c.Müşteri_Tipi || 'ALICI'
      })),
      employees: employeesResult.map((e: any) => ({
        id: e._id,
        ad: e.Ad,
        soyad: e.Soyad,
        eposta: e.Eposta,
        rol: e.Rol,
        ilkGirisMi: e.IlkGirisMi
      })),
      appointments: appointmentsResult.map((a: any) => ({
        id: a._id,
        portfoyId: a.PortfoyId,
        randevuZamani: a.RandevuZamani,
        durum: a.Durum,
        portfoyTip: a.Portfoy?.Tip,
        ilce: a.Portfoy?.Ilce,
        uzman: `${a.Uzman?.Ad || ''} ${a.Uzman?.Soyad || ''}`.trim(),
        musteri: `${a.Musteri?.Ad || ''} ${a.Musteri?.Soyad || ''}`.trim()
      })),
      pages: matchedPages
    });

  } catch (error: any) {
    console.error('[HOMEY API] globalSearch Error:', error);
    res.json({
      portfolios: [],
      clients: [],
      employees: [],
      appointments: [],
      pages: matchedPages
    });
  }
};
