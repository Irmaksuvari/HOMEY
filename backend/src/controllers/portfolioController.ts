import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Portfolio } from '../models/Portfolio';
import { Client } from '../models/Client';
import { Sale } from '../models/Sale';
import { User } from '../models/User';
import { Appointment } from '../models/Appointment';

// Yeni Portföy Ekleme (POST /api/portfolios/add) - Korumalı
export const addPortfolio = async (req: any, res: Response) => {
  const {
    tip, tur, fiyat, metrekare, odaSayisi,
    il, ilce, mahalle, semt, cadde, sokak, evSahibiAdi, evSahibiTelefon,
    kaporaMiktari: reqKaporaMiktari, depozitoMiktari: reqDepozitoMiktari,
    isPublished: reqIsPublished,
    aciklama, otoparkTipi, isinmaTipi, balkonDurumu, esyaDurumu, kullanimDurumu,
    tapuDurumu, hasAsansor, isKrediyeUygun, isTakasaUygun, isAcilSatilik, isFiyatiDustu, baslik,
    latitude, longitude
  } = req.body;
  const { firmaId, userId } = req.user;

  if (!tip || !tur || !fiyat || !il || !ilce || !evSahibiAdi || !evSahibiTelefon || !metrekare) {
    return res.status(400).json({ message: 'Zorunlu tüm alanları doldurunuz.' });
  }

  try {
    const fiyatNum = Number(fiyat);
    let kaporaMiktari = tur === 'SATILIK' ? fiyatNum * 0.02 : fiyatNum * 2;
    let depozitoMiktari = tur === 'KIRALIK' ? fiyatNum * 2 : 0;

    if (reqKaporaMiktari !== undefined && reqKaporaMiktari !== null && reqKaporaMiktari !== '') {
      kaporaMiktari = Number(reqKaporaMiktari);
    }
    if (reqDepozitoMiktari !== undefined && reqDepozitoMiktari !== null && reqDepozitoMiktari !== '') {
      depozitoMiktari = Number(reqDepozitoMiktari);
    }

    const isPublished = reqIsPublished === undefined || reqIsPublished === null || reqIsPublished === ''
      ? true
      : Boolean(reqIsPublished);

    let client = await Client.findOne({ Telefon: evSahibiTelefon, FirmaId: firmaId });
    let mulkSahibiId = client?._id;

    if (!client) {
      mulkSahibiId = uuidv4();
      await Client.create({
        _id: mulkSahibiId,
        FirmaId: firmaId,
        KayitEdenUzmanId: userId,
        Ad: evSahibiAdi,
        Soyad: '',
        Telefon: evSahibiTelefon,
        Müşteri_Tipi: 'Mülk Sahibi',
        KayitTarihi: new Date(),
        IsActive: true,
        is_active: true
      });
    }

    const newPortfolioId = uuidv4();
    await Portfolio.create({
      _id: newPortfolioId,
      FirmaId: firmaId,
      GorevliUzmanId: userId,
      MulkSahibiId: mulkSahibiId,
      Tip: tip,
      Tur: tur,
      Fiyat: fiyatNum,
      Metrekare: Number(metrekare),
      OdaSayisi: tip === 'ARSA' ? '' : (odaSayisi || ''),
      KaporaMiktari: kaporaMiktari,
      DepozitoMiktari: depozitoMiktari,
      Il: il,
      Ilce: ilce,
      Mahalle: mahalle || '',
      Semt: semt || '',
      Cadde: cadde || '',
      Sokak: sokak || '',
      EvSahibiAdi: evSahibiAdi,
      EvSahibiTelefon: evSahibiTelefon,
      Durum: 'BOSTA',
      IsPublished: isPublished,
      Aciklama: aciklama || '',
      OtoparkTipi: otoparkTipi || '',
      IsinmaTipi: isinmaTipi || '',
      BalkonDurumu: balkonDurumu || '',
      EsyaDurumu: esyaDurumu || '',
      KullanimDurumu: kullanimDurumu || '',
      TapuDurumu: tur === 'SATILIK' ? (tapuDurumu || '') : '',
      HasAsansor: hasAsansor === true || hasAsansor === 'true' || hasAsansor === 1,
      IsKrediyeUygun: tur === 'SATILIK' ? (isKrediyeUygun === true || isKrediyeUygun === 'true' || isKrediyeUygun === 1) : false,
      IsTakasaUygun: tur === 'SATILIK' ? (isTakasaUygun === true || isTakasaUygun === 'true' || isTakasaUygun === 1) : false,
      IsAcilSatilik: isAcilSatilik === true || isAcilSatilik === 'true' || isAcilSatilik === 1,
      IsFiyatiDustu: isFiyatiDustu === true || isFiyatiDustu === 'true' || isFiyatiDustu === 1,
      Baslik: baslik || '',
      Latitude: latitude ? parseFloat(latitude) : null,
      Longitude: longitude ? parseFloat(longitude) : null,
      KayitTarihi: new Date()
    });

    res.status(201).json({
      message: 'Portföy başarıyla kaydedildi.',
      portfolioId: newPortfolioId
    });

  } catch (error: any) {
    console.error('[HOMEY API] addPortfolio Error:', error);
    res.status(500).json({ message: 'Portföy eklenirken sunucu hatası oluştu.', error: error.message });
  }
};

// Portföyleri Listeleme (GET /api/portfolios/list) - Korumalı
export const listPortfolios = async (req: any, res: Response) => {
  const { firmaId } = req.user;

  try {
    const portfolios = await Portfolio.aggregate([
      { 
        $match: { 
          FirmaId: firmaId, 
          Durum: { $nin: ['SATILDI', 'KIRALANDI', 'KIRALANDI_SATILDI', 'TAMAMLANDI'] },
          SilindiMi: { $ne: true }
        } 
      },
      { $lookup: { from: 'Kullanicilar', localField: 'GorevliUzmanId', foreignField: '_id', as: 'Uzman' } },
      { $unwind: { path: '$Uzman', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'Musteriler', localField: 'MulkSahibiId', foreignField: '_id', as: 'MulkSahibi' } },
      { $unwind: { path: '$MulkSahibi', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'PortfoyFotograflari', localField: '_id', foreignField: 'PortfoyId', as: 'Fotograflar' } },
      { $sort: { KayitTarihi: -1 } }
    ]);

    const list = portfolios.map(p => {
      const msAd = p.MulkSahibi?.Ad || '';
      const msSoyad = p.MulkSahibi?.Soyad ? ` ${p.MulkSahibi.Soyad}` : '';
      const sEvSahibiAdi = p.MulkSahibi ? `${msAd}${msSoyad}`.trim() : null;
      const sEvSahibiTelefon = p.MulkSahibi?.Telefon || null;
      
      return {
        id: p._id,
        tip: p.Tip,
        tur: p.Tur,
        fiyat: Number(p.Fiyat),
        metrekare: p.Metrekare,
        odaSayisi: p.OdaSayisi,
        kapora: Number(p.KaporaMiktari ?? p.KaparoMiktari ?? 0),
        depozito: Number(p.DepozitoMiktari || 0),
        il: p.Il,
        ilce: p.Ilce,
        mahalle: p.Mahalle,
        semt: p.Semt || '',
        cadde: p.Cadde || '',
        sokak: p.Sokak || '',
        gorevliUzman: p.Uzman ? `${p.Uzman.Ad} ${p.Uzman.Soyad}`.trim() : '',
        gorevliUzmanId: p.GorevliUzmanId,
        evSahibiAdi: sEvSahibiAdi || p.EvSahibiAdi,
        evSahibiTelefon: sEvSahibiTelefon || p.EvSahibiTelefon,
        durum: p.Durum,
        isPublished: p.IsPublished === true || p.IsPublished === 'true',
        aciklama: p.Aciklama || '',
        otoparkTipi: p.OtoparkTipi || '',
        isinmaTipi: p.IsinmaTipi || '',
        balkonDurumu: p.BalkonDurumu || '',
        esyaDurumu: p.EsyaDurumu || '',
        kullanimDurumu: p.KullanimDurumu || '',
        tapuDurumu: p.TapuDurumu || '',
        hasAsansor: p.HasAsansor === true || p.HasAsansor === 'true',
        isKrediyeUygun: p.IsKrediyeUygun === true || p.IsKrediyeUygun === 'true',
        isTakasaUygun: p.IsTakasaUygun === true || p.IsTakasaUygun === 'true',
        isAcilSatilik: p.IsAcilSatilik === true || p.IsAcilSatilik === 'true',
        isFiyatiDustu: p.IsFiyatiDustu === true || p.IsFiyatiDustu === 'true',
        yetkilendirmeSozlesmesiYapildi: p.YetkilendirmeSozlesmesiYapildi === true || p.YetkilendirmeSozlesmesiYapildi === 'true',
        baslik: p.Baslik,
        createdAt: p.KayitTarihi,
        fotograflar: p.Fotograflar ? p.Fotograflar.map((f: any) => f.FotoUrl) : [],
        kapakFoto: p.Fotograflar && p.Fotograflar.length > 0 
          ? (p.Fotograflar.find((f: any) => f.Sira === 1)?.FotoUrl || p.Fotograflar[0].FotoUrl) 
          : null,
        latitude: p.Latitude || null,
        longitude: p.Longitude || null
      };
    });

    res.json(list);

  } catch (error: any) {
    console.error('[HOMEY API] listPortfolios Error:', error);
    res.status(500).json({ message: 'Portföyler çekilirken sunucu hatası oluştu.', error: error.message });
  }
};

// Portföy Düzenleme / Güncelleme (PUT /api/portfolios/edit/:id) - Korumalı
export const editPortfolio = async (req: any, res: Response) => {
  const { id } = req.params;
  const {
    tip, tur, fiyat, metrekare, odaSayisi,
    il, ilce, mahalle, semt, cadde, sokak, evSahibiAdi, evSahibiTelefon,
    aciklama, otoparkTipi, isinmaTipi, balkonDurumu, esyaDurumu, kullanimDurumu,
    tapuDurumu, hasAsansor, isKrediyeUygun, isTakasaUygun, isAcilSatilik, isFiyatiDustu, baslik,
    latitude, longitude
  } = req.body;
  const { firmaId, userId } = req.user;

  if (!tip || !tur || !fiyat || !il || !ilce || !evSahibiAdi || !evSahibiTelefon || !metrekare) {
    return res.status(400).json({ message: 'Zorunlu tüm alanları doldurunuz.' });
  }

  try {
    const portfolio = await Portfolio.findOne({ _id: id, FirmaId: firmaId });
    
    if (!portfolio) {
      return res.status(404).json({ message: 'Güncellenmek istenen portföy bulunamadı.' });
    }

    if (portfolio.GorevliUzmanId !== userId) {
      return res.status(403).json({ message: 'Bu portföyü düzenlemek için yetkiniz bulunmamaktadır.' });
    }

    const fiyatNum = Number(fiyat);
    const kaporaMiktari = tur === 'SATILIK' ? fiyatNum * 0.02 : fiyatNum * 2;
    const depozitoMiktari = tur === 'KIRALIK' ? fiyatNum * 2 : 0;

    let client = await Client.findOne({ Telefon: evSahibiTelefon, FirmaId: firmaId });
    let mulkSahibiId = client?._id;

    if (!client) {
      mulkSahibiId = uuidv4();
      await Client.create({
        _id: mulkSahibiId,
        FirmaId: firmaId,
        KayitEdenUzmanId: portfolio.GorevliUzmanId,
        Ad: evSahibiAdi,
        Soyad: '',
        Telefon: evSahibiTelefon,
        Müşteri_Tipi: 'Mülk Sahibi',
        KayitTarihi: new Date(),
        IsActive: true,
        is_active: true
      });
    }

    await Portfolio.updateOne({ _id: id }, {
      $set: {
        Tip: tip,
        Tur: tur,
        Fiyat: fiyatNum,
        Metrekare: Number(metrekare),
        OdaSayisi: tip === 'ARSA' ? '' : (odaSayisi || ''),
        KaporaMiktari: kaporaMiktari,
        DepozitoMiktari: depozitoMiktari,
        Il: il,
        Ilce: ilce,
        Mahalle: mahalle || '',
        Semt: semt || '',
        Cadde: cadde || '',
        Sokak: sokak || '',
        EvSahibiAdi: evSahibiAdi,
        EvSahibiTelefon: evSahibiTelefon,
        MulkSahibiId: mulkSahibiId,
        Aciklama: aciklama || '',
        OtoparkTipi: otoparkTipi || '',
        IsinmaTipi: isinmaTipi || '',
        BalkonDurumu: balkonDurumu || '',
        EsyaDurumu: esyaDurumu || '',
        KullanimDurumu: kullanimDurumu || '',
        TapuDurumu: tur === 'SATILIK' ? (tapuDurumu || '') : '',
        HasAsansor: hasAsansor === true || hasAsansor === 'true' || hasAsansor === 1,
        IsKrediyeUygun: tur === 'SATILIK' ? (isKrediyeUygun === true || isKrediyeUygun === 'true' || isKrediyeUygun === 1) : false,
        IsTakasaUygun: tur === 'SATILIK' ? (isTakasaUygun === true || isTakasaUygun === 'true' || isTakasaUygun === 1) : false,
        IsAcilSatilik: isAcilSatilik === true || isAcilSatilik === 'true' || isAcilSatilik === 1,
        IsFiyatiDustu: isFiyatiDustu === true || isFiyatiDustu === 'true' || isFiyatiDustu === 1,
        Baslik: baslik || '',
        Latitude: latitude ? parseFloat(latitude) : null,
        Longitude: longitude ? parseFloat(longitude) : null
      }
    });

    res.json({ message: 'Portföy başarıyla güncellendi.' });

  } catch (error: any) {
    console.error('[HOMEY API] editPortfolio Error:', error);
    res.status(500).json({ message: 'Portföy güncellenirken sunucu hatası oluştu.', error: error.message });
  }
};

export const updatePortfolioPublishState = async (req: any, res: Response) => {
  const { id } = req.params;
  const { isPublished } = req.body;
  const { firmaId, userId } = req.user;

  if (id === undefined || id === null || id === '') {
    return res.status(400).json({ message: 'Portföy ID bilgisi eksik.' });
  }

  try {
    const portfolio = await Portfolio.findOne({ _id: id, FirmaId: firmaId });
    if (!portfolio) {
      return res.status(404).json({ message: 'Portföy bulunamadı.' });
    }

    if (portfolio.GorevliUzmanId !== userId) {
      return res.status(403).json({ message: 'Bu portföyün yayın durumunu değiştirmek için yetkiniz yok.' });
    }

    const normalizedPublished = Boolean(isPublished);
    portfolio.IsPublished = normalizedPublished;
    await portfolio.save();

    res.json({
      message: normalizedPublished ? 'Portföy yayınlandı.' : 'Portföy gizlendi.',
      isPublished: normalizedPublished
    });
  } catch (error: any) {
    console.error('[HOMEY API] updatePortfolioPublishState Error:', error);
    res.status(500).json({ message: 'Yayın durumu güncellenirken sunucu hatası oluştu.', error: error.message });
  }
};

// İşlemi Kapat / Satıldı - Kiralandı Yap (POST /api/portfolios/:id/satis-kapat or /api/portfoyler/:id/satis-kapat)
export const closePortfolioTransaction = async (req: any, res: Response) => {
  const { id: portfoyId } = req.params;
  const { islemTuru, islemBedeli, hizmetBedeliCiro, islemTarihi, aciklama, aliciMusteriId } = req.body;
  const userId = req.user?.userId || req.user?.id;
  const firmaId = req.user?.firmaId;

  if (!portfoyId) {
    return res.status(400).json({ message: 'Portföy ID zorunludur.' });
  }

  if (!islemTuru || islemBedeli === undefined || hizmetBedeliCiro === undefined) {
    return res.status(400).json({ message: 'İşlem türü, işlem bedeli ve ciro tutarı zorunludur.' });
  }

  try {
    const portfolio = await Portfolio.findOne({ _id: portfoyId, FirmaId: firmaId });

    if (!portfolio) {
      return res.status(404).json({ message: 'Portföy bulunamadı veya bu işlem için yetkiniz yok.' });
    }

    if (portfolio.GorevliUzmanId !== userId) {
      return res.status(403).json({ message: 'Bu portföyü kapatmak için yetkiniz bulunmamaktadır.' });
    }

    const finalDurum = (islemTuru.toUpperCase() === 'KIRALAMA' || portfolio.Tur === 'KIRALIK') ? 'KIRALANDI' : 'SATILDI';
    const closingDate = islemTarihi ? new Date(islemTarihi) : new Date();

    portfolio.Durum = finalDurum;
    await portfolio.save();

    const validAliciMusteriId = (typeof aliciMusteriId === 'string' && aliciMusteriId.trim().length > 0) ? aliciMusteriId.trim() : null;

    const saleId = uuidv4();
    await Sale.create({
      _id: saleId,
      PortfoyID: portfoyId,
      DanismanID: userId,
      AliciMusteriID: validAliciMusteriId,
      IslemTuru: islemTuru.toUpperCase(),
      IslemBedeli: Number(islemBedeli),
      HizmetBedeliCiro: Number(hizmetBedeliCiro),
      IslemTarihi: closingDate,
      Aciklama: aciklama || null
    });

    if (validAliciMusteriId) {
      await Client.updateOne({ _id: validAliciMusteriId }, { $set: { is_active: false, IsActive: false } });
    }

    await Appointment.updateMany({ PortfoyId: portfoyId }, { $set: { Durum: 'COMPLETED' } });

    res.json({
      message: `Portföy başarıyla '${finalDurum}' olarak kapatıldı ve ciro kaydı işlendi.`,
      durum: finalDurum,
      islemBedeli: Number(islemBedeli),
      hizmetBedeliCiro: Number(hizmetBedeliCiro)
    });

  } catch (error: any) {
    console.error('[HOMEY API] closePortfolioTransaction Error:', error);
    res.status(500).json({ message: 'Portföy işlemi kapatılırken hata oluştu.', error: error.message });
  }
};

// Tamamlanan (Satıldı / Kiralandı) Portföyleri Listeleme (GET /api/portfolios/completed) - Korumalı
export const getCompletedPortfolios = async (req: any, res: Response) => {
  const userId = req.user?.userId || req.user?.id;
  const firmaId = req.user?.firmaId;

  try {
    const sales = await Sale.aggregate([
      { 
        $lookup: { from: 'Portfoyler', localField: 'PortfoyID', foreignField: '_id', as: 'Portfoy' } 
      },
      { $unwind: { path: '$Portfoy', preserveNullAndEmptyArrays: true } },
      { 
        $match: {
          $or: [
            { DanismanID: firmaId ? null : userId }, 
            { 'Portfoy.FirmaId': firmaId }
          ],
          'Portfoy.SilindiMi': { $ne: true }
        }
      },
      { $lookup: { from: 'Kullanicilar', localField: 'DanismanID', foreignField: '_id', as: 'IslemYapan' } },
      { $unwind: { path: '$IslemYapan', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'Kullanicilar', localField: 'Portfoy.GorevliUzmanId', foreignField: '_id', as: 'Uzman' } },
      { $unwind: { path: '$Uzman', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'Musteriler', localField: 'AliciMusteriID', foreignField: '_id', as: 'Alici' } },
      { $unwind: { path: '$Alici', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'Musteriler', localField: 'Portfoy.MulkSahibiId', foreignField: '_id', as: 'MulkSahibi' } },
      { $unwind: { path: '$MulkSahibi', preserveNullAndEmptyArrays: true } },
      { $sort: { IslemTarihi: -1 } }
    ]);

    const completedWithoutSale = await Portfolio.aggregate([
      { 
        $match: { 
          FirmaId: firmaId, 
          Durum: { $in: ['SATILDI', 'KIRALANDI', 'KIRALANDI_SATILDI'] },
          SilindiMi: { $ne: true }
        } 
      },
      { 
        $lookup: { from: 'SatisIslemleri', localField: '_id', foreignField: 'PortfoyID', as: 'Sales' } 
      },
      { $match: { Sales: { $size: 0 } } },
      { $lookup: { from: 'Kullanicilar', localField: 'GorevliUzmanId', foreignField: '_id', as: 'Uzman' } },
      { $unwind: { path: '$Uzman', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'Musteriler', localField: 'MulkSahibiId', foreignField: '_id', as: 'MulkSahibi' } },
      { $unwind: { path: '$MulkSahibi', preserveNullAndEmptyArrays: true } },
      { $sort: { KayitTarihi: -1 } }
    ]);

    let combined: any[] = [];

    for (const s of sales) {
      combined.push({
        id: s._id,
        baslik: s.Portfoy?.Baslik,
        tip: s.Portfoy?.Tip || 'DAIRE',
        tur: s.Portfoy?.Tur || (s.IslemTuru === 'KIRALAMA' ? 'KIRALIK' : 'SATILIK'),
        fiyat: Number(s.IslemBedeli || s.Portfoy?.Fiyat || 0),
        metrekare: s.Portfoy?.Metrekare,
        odaSayisi: s.Portfoy?.OdaSayisi,
        kapora: Number(s.Portfoy?.KaporaMiktari || 0),
        depozito: Number(s.Portfoy?.DepozitoMiktari || 0),
        il: s.Portfoy?.Il || 'İstanbul',
        ilce: s.Portfoy?.Ilce || 'Merkez',
        mahalle: s.Portfoy?.Mahalle || '',
        evSahibiAdi: s.MulkSahibi ? `${s.MulkSahibi.Ad} ${s.MulkSahibi.Soyad}`.trim() : (s.Portfoy?.EvSahibiAdi || 'Mülk Sahibi'),
        evSahibiTelefon: s.MulkSahibi?.Telefon || s.Portfoy?.EvSahibiTelefon || '',
        durum: s.Portfoy?.Durum || (s.IslemTuru === 'KIRALAMA' ? 'KIRALANDI' : 'SATILDI'),
        gorevliUzmanId: s.Portfoy?.GorevliUzmanId || s.DanismanID,
        gorevliUzman: s.Uzman ? `${s.Uzman.Ad} ${s.Uzman.Soyad}`.trim() : (s.IslemYapan ? `${s.IslemYapan.Ad} ${s.IslemYapan.Soyad}`.trim() : 'Danışman'),
        satisIslemId: s._id,
        islemYapanDanismanId: s.DanismanID,
        islemTuru: s.IslemTuru,
        islemBedeli: Number(s.IslemBedeli || 0),
        hizmetBedeliCiro: Number(s.HizmetBedeliCiro || 0),
        islemTarihi: s.IslemTarihi,
        islemAciklama: s.Aciklama,
        islemYapanDanisman: s.IslemYapan ? `${s.IslemYapan.Ad} ${s.IslemYapan.Soyad}`.trim() : '',
        aliciMusteriId: s.AliciMusteriID,
        aliciMusteri: s.Alici ? `${s.Alici.Ad} ${s.Alici.Soyad}`.trim() : null
      });
    }

    for (const p of completedWithoutSale) {
      combined.push({
        id: p._id,
        baslik: p.Baslik,
        tip: p.Tip || 'DAIRE',
        tur: p.Tur || 'SATILIK',
        fiyat: Number(p.Fiyat || 0),
        metrekare: p.Metrekare,
        odaSayisi: p.OdaSayisi,
        kapora: Number(p.KaporaMiktari || 0),
        depozito: Number(p.DepozitoMiktari || 0),
        il: p.Il || 'İstanbul',
        ilce: p.Ilce || 'Merkez',
        mahalle: p.Mahalle || '',
        evSahibiAdi: p.MulkSahibi ? `${p.MulkSahibi.Ad} ${p.MulkSahibi.Soyad}`.trim() : (p.EvSahibiAdi || 'Mülk Sahibi'),
        evSahibiTelefon: p.MulkSahibi?.Telefon || p.EvSahibiTelefon || '',
        durum: p.Durum,
        gorevliUzmanId: p.GorevliUzmanId,
        gorevliUzman: p.Uzman ? `${p.Uzman.Ad} ${p.Uzman.Soyad}`.trim() : 'Danışman',
        satisIslemId: null,
        islemYapanDanismanId: p.GorevliUzmanId,
        islemTuru: p.Tur === 'KIRALIK' ? 'KIRALAMA' : 'SATIS',
        islemBedeli: Number(p.Fiyat || 0),
        hizmetBedeliCiro: 0,
        islemTarihi: p.KayitTarihi,
        islemAciklama: null,
        islemYapanDanisman: p.Uzman ? `${p.Uzman.Ad} ${p.Uzman.Soyad}`.trim() : 'Danışman',
        aliciMusteriId: null,
        aliciMusteri: null
      });
    }

    res.json(combined);

  } catch (error: any) {
    console.error('[HOMEY API] getCompletedPortfolios Error:', error);
    res.json([]);
  }
};



