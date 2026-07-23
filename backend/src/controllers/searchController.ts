import { Response } from 'express';
import { poolPromise, sql } from '../config/db';

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

  const searchTerm = `%${q}%`;
  const lowerQ = q.toLowerCase();

  // 5. Sistem Sayfaları — her zaman client-side filtrelenir, DB sorgusu gerekmez
  const matchedPages = SYSTEM_PAGES.filter(
    page => page.title.toLowerCase().includes(lowerQ) || page.description.toLowerCase().includes(lowerQ)
  );

  try {
    const pool = await poolPromise;

    // Tüm DB sorgularını paralel ve izole olarak çalıştır
    const [portfoliosResult, clientsResult, employeesResult, appointmentsResult] = await Promise.all([

      // 1. Portföyler Sorgusu
      pool.request()
        .input('firmaId', sql.UniqueIdentifier, firmaId)
        .input('searchTerm', sql.NVarChar, searchTerm)
        .query(`
          SELECT TOP 5
            p.Id, p.Tip, p.Tur, p.Fiyat, p.Metrekare, p.OdaSayisi, p.Il, p.Ilce, p.Mahalle,
            p.GorevliUzmanId, u.Ad as UzmanAd, u.Soyad as UzmanSoyad
          FROM Portfoyler p
          LEFT JOIN Kullanicilar u ON p.GorevliUzmanId = u.Id
          WHERE p.FirmaId = @firmaId
            AND (p.Tip LIKE @searchTerm OR p.Tur LIKE @searchTerm OR p.Il LIKE @searchTerm OR p.Ilce LIKE @searchTerm OR p.Mahalle LIKE @searchTerm)
          ORDER BY p.KayitTarihi DESC
        `).catch(() => ({ recordset: [] })),

      // 2. Müşteriler Sorgusu (gerçek sütun adları: AradigiEmlakTipi, Müşteri_Tipi, AradigiButce)
      pool.request()
        .input('firmaId', sql.UniqueIdentifier, firmaId)
        .input('searchTerm', sql.NVarChar, searchTerm)
        .query(`
          SELECT TOP 5
            Id, Ad, Soyad, Telefon, AradigiButce, AradigiEmlakTipi, [Müşteri_Tipi] as MusteriTipi
          FROM Musteriler
          WHERE FirmaId = @firmaId
            AND (Ad LIKE @searchTerm OR Soyad LIKE @searchTerm OR Telefon LIKE @searchTerm)
          ORDER BY KayitTarihi DESC
        `).catch(() => ({ recordset: [] })),

      // 3. Kullanıcılar / Danışmanlar Sorgusu
      pool.request()
        .input('firmaId', sql.UniqueIdentifier, firmaId)
        .input('searchTerm', sql.NVarChar, searchTerm)
        .query(`
          SELECT TOP 5
            Id, Ad, Soyad, Eposta, Rol, IlkGirisMi
          FROM Kullanicilar
          WHERE FirmaId = @firmaId
            AND (Ad LIKE @searchTerm OR Soyad LIKE @searchTerm OR Eposta LIKE @searchTerm)
        `).catch(() => ({ recordset: [] })),

      // 4. Randevular Sorgusu
      pool.request()
        .input('firmaId', sql.UniqueIdentifier, firmaId)
        .input('searchTerm', sql.NVarChar, searchTerm)
        .query(`
          SELECT TOP 5
            r.Id, r.PortfoyId, r.RandevuZamani, r.Durum,
            p.Tip as PortfoyTip, p.Ilce,
            u.Ad as UzmanAd, u.Soyad as UzmanSoyad,
            m.Ad as MusteriAd, m.Soyad as MusteriSoyad
          FROM Randevular r
          INNER JOIN Portfoyler p ON r.PortfoyId = p.Id
          INNER JOIN Kullanicilar u ON r.TeklifEdenUzmanId = u.Id
          INNER JOIN Musteriler m ON r.MusteriId = m.Id
          WHERE (u.FirmaId = @firmaId OR p.FirmaId = @firmaId)
            AND (p.Tip LIKE @searchTerm OR u.Ad LIKE @searchTerm OR m.Ad LIKE @searchTerm OR p.Ilce LIKE @searchTerm OR r.Durum LIKE @searchTerm)
          ORDER BY r.RandevuZamani DESC
        `).catch(() => ({ recordset: [] })),
    ]);

    res.json({
      portfolios: portfoliosResult.recordset.map((p: any) => ({
        id: p.Id,
        tip: p.Tip,
        tur: p.Tur,
        fiyat: p.Fiyat,
        metrekare: p.Metrekare,
        odaSayisi: p.OdaSayisi,
        il: p.Il,
        ilce: p.Ilce,
        mahalle: p.Mahalle,
        gorevliUzman: `${p.UzmanAd || ''} ${p.UzmanSoyad || ''}`.trim()
      })),
      clients: clientsResult.recordset.map((c: any) => ({
        id: c.Id,
        ad: `${c.Ad} ${c.Soyad}`.trim(),
        telefon: c.Telefon,
        butce: c.AradigiButce,
        tip: c.AradigiEmlakTipi || 'TÜMÜ',
        musteriTipi: c.MusteriTipi || 'ALICI'
      })),
      employees: employeesResult.recordset.map((e: any) => ({
        id: e.Id,
        ad: e.Ad,
        soyad: e.Soyad,
        eposta: e.Eposta,
        rol: e.Rol,
        ilkGirisMi: e.IlkGirisMi
      })),
      appointments: appointmentsResult.recordset.map((a: any) => ({
        id: a.Id,
        portfoyId: a.PortfoyId,
        randevuZamani: a.RandevuZamani,
        durum: a.Durum,
        portfoyTip: a.PortfoyTip,
        ilce: a.Ilce,
        uzman: `${a.UzmanAd} ${a.UzmanSoyad}`.trim(),
        musteri: `${a.MusteriAd} ${a.MusteriSoyad}`.trim()
      })),
      pages: matchedPages
    });

  } catch (error: any) {
    console.error('[HOMEY API] globalSearch Error:', error);
    // Bile DB hata verse bile sistem sayfalarını döndür
    res.json({
      portfolios: [],
      clients: [],
      employees: [],
      appointments: [],
      pages: matchedPages
    });
  }
};
