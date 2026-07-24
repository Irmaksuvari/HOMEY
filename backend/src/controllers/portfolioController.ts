import { Response } from 'express';
import { poolPromise, sql } from '../config/db';

// Yeni Portföy Ekleme (POST /api/portfolios/add) - Korumalı
export const addPortfolio = async (req: any, res: Response) => {
  const { 
    tip, tur, fiyat, metrekare, odaSayisi, 
    il, ilce, mahalle, semt, cadde, sokak, evSahibiAdi, evSahibiTelefon,
    kaporaMiktari: reqKaporaMiktari, depozitoMiktari: reqDepozitoMiktari
  } = req.body;
  const { firmaId, userId } = req.user; // Token'dan çözülen FirmaId ve KullanıcıId

  if (!tip || !tur || !fiyat || !il || !ilce || !evSahibiAdi || !evSahibiTelefon || !metrekare) {
    return res.status(400).json({ message: 'Zorunlu tüm alanları doldurunuz.' });
  }

  try {
    const pool = await poolPromise;

    // Varsayılan kapora ve depozito oranları hesaplaması
    const fiyatNum = Number(fiyat);
    let kaporaMiktari = tur === 'SATILIK' ? fiyatNum * 0.02 : fiyatNum * 2;
    let depozitoMiktari = tur === 'KIRALIK' ? fiyatNum * 2 : 0;

    if (reqKaporaMiktari !== undefined && reqKaporaMiktari !== null && reqKaporaMiktari !== '') {
      kaporaMiktari = Number(reqKaporaMiktari);
    }
    if (reqDepozitoMiktari !== undefined && reqDepozitoMiktari !== null && reqDepozitoMiktari !== '') {
      depozitoMiktari = Number(reqDepozitoMiktari);
    }

    const result = await pool.request()
      .input('firmaId', sql.UniqueIdentifier, firmaId)
      .input('gorevliUzmanId', sql.UniqueIdentifier, userId)
      .input('tip', sql.NVarChar, tip)
      .input('tur', sql.NVarChar, tur)
      .input('fiyat', sql.Decimal(18, 2), fiyatNum)
      .input('metrekare', sql.Int, Number(metrekare))
      .input('odaSayisi', sql.NVarChar, tip === 'ARSA' ? '' : odaSayisi || '')
      .input('kaporaMiktari', sql.Decimal(18, 2), kaporaMiktari)
      .input('depozitoMiktari', sql.Decimal(18, 2), depozitoMiktari)
      .input('il', sql.NVarChar, il)
      .input('ilce', sql.NVarChar, ilce)
      .input('mahalle', sql.NVarChar, mahalle || '')
      .input('semt', sql.NVarChar, semt || '')
      .input('cadde', sql.NVarChar, cadde || '')
      .input('sokak', sql.NVarChar, sokak || '')
      .input('evSahibiAdi', sql.NVarChar, evSahibiAdi)
      .input('evSahibiTelefon', sql.NVarChar, evSahibiTelefon)
      .query(`
        INSERT INTO Portfoyler (
          FirmaId, GorevliUzmanId, Tip, Tur, Fiyat, Metrekare, OdaSayisi,
          KaporaMiktari, DepozitoMiktari, Il, Ilce, Mahalle, Semt, Cadde, Sokak,
          EvSahibiAdi, EvSahibiTelefon, Durum
        )
        OUTPUT inserted.Id
        VALUES (
          @firmaId, @gorevliUzmanId, @tip, @tur, @fiyat, @metrekare, @odaSayisi,
          @kaporaMiktari, @depozitoMiktari, @il, @ilce, @mahalle, @semt, @cadde, @sokak,
          @evSahibiAdi, @evSahibiTelefon, 'BOSTA'
        )
      `);

    const newPortfolioId = result.recordset[0].Id;

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
    const pool = await poolPromise;

    // Firmaya ait portföyleri ve sorumlu uzman ad-soyadını çekme
    const result = await pool.request()
      .input('firmaId', sql.UniqueIdentifier, firmaId)
      .query(`
        SELECT p.*, k.Ad as UzmanAd, k.Soyad as UzmanSoyad
        FROM Portfoyler p
        INNER JOIN Kullanicilar k ON p.GorevliUzmanId = k.Id
        WHERE p.FirmaId = @firmaId
        ORDER BY p.KayitTarihi DESC
      `);

    // Ön yüze uygun formatta eşleme (map)
    const list = result.recordset.map(p => ({
      id: p.Id,
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
      gorevliUzman: `${p.UzmanAd} ${p.UzmanSoyad}`,
      gorevliUzmanId: p.GorevliUzmanId,
      evSahibiAdi: p.EvSahibiAdi,
      evSahibiTelefon: p.EvSahibiTelefon,
      durum: p.Durum
    }));

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
    il, ilce, mahalle, evSahibiAdi, evSahibiTelefon 
  } = req.body;
  const { firmaId, userId, rol } = req.user;

  if (!tip || !tur || !fiyat || !il || !ilce || !evSahibiAdi || !evSahibiTelefon || !metrekare) {
    return res.status(400).json({ message: 'Zorunlu tüm alanları doldurunuz.' });
  }

  try {
    const pool = await poolPromise;

    // 1. Portföyün varlığını ve sahipliğini kontrol et
    const checkResult = await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .input('firmaId', sql.UniqueIdentifier, firmaId)
      .query('SELECT GorevliUzmanId FROM Portfoyler WHERE Id = @id AND FirmaId = @firmaId');

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Güncellenmek istenen portföy bulunamadı.' });
    }

    const currentGorevliUzmanId = checkResult.recordset[0].GorevliUzmanId;

    // 2. Yetki kontrolü: Broker (YETKILI) veya portföyün kendi danışmanı güncelleyebilir
    if (rol !== 'YETKILI' && currentGorevliUzmanId !== userId) {
      return res.status(403).json({ message: 'Bu portföyü düzenlemek için yetkiniz bulunmamaktadır.' });
    }

    // Varsayılan kapora ve depozito oranları hesaplaması
    const fiyatNum = Number(fiyat);
    const kaporaMiktari = tur === 'SATILIK' ? fiyatNum * 0.02 : fiyatNum * 2;
    const depozitoMiktari = tur === 'KIRALIK' ? fiyatNum * 2 : 0;

    // 3. Güncelleme sorgusu
    await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .input('tip', sql.NVarChar, tip)
      .input('tur', sql.NVarChar, tur)
      .input('fiyat', sql.Decimal(18, 2), fiyatNum)
      .input('metrekare', sql.Int, Number(metrekare))
      .input('odaSayisi', sql.NVarChar, tip === 'ARSA' ? '' : odaSayisi || '')
      .input('kaporaMiktari', sql.Decimal(18, 2), kaporaMiktari)
      .input('depozitoMiktari', sql.Decimal(18, 2), depozitoMiktari)
      .input('il', sql.NVarChar, il)
      .input('ilce', sql.NVarChar, ilce)
      .input('mahalle', sql.NVarChar, mahalle || '')
      .input('evSahibiAdi', sql.NVarChar, evSahibiAdi)
      .input('evSahibiTelefon', sql.NVarChar, evSahibiTelefon)
      .query(`
        UPDATE Portfoyler
        SET Tip = @tip,
            Tur = @tur,
            Fiyat = @fiyat,
            Metrekare = @metrekare,
            OdaSayisi = @odaSayisi,
            KaporaMiktari = @kaporaMiktari,
            DepozitoMiktari = @depozitoMiktari,
            Il = @il,
            Ilce = @ilce,
            Mahalle = @mahalle,
            EvSahibiAdi = @evSahibiAdi,
            EvSahibiTelefon = @evSahibiTelefon
        WHERE Id = @id
      `);

    res.json({ message: 'Portföy başarıyla güncellendi.' });

  } catch (error: any) {
    console.error('[HOMEY API] editPortfolio Error:', error);
    res.status(500).json({ message: 'Portföy güncellenirken sunucu hatası oluştu.', error: error.message });
  }
};

// İşlemi Kapat / Satıldı - Kiralandı Yap (POST /api/portfolios/:id/satis-kapat or /api/portfoyler/:id/satis-kapat)
export const closePortfolioTransaction = async (req: any, res: Response) => {
  const { id: portfoyId } = req.params;
  const { islemTuru, islemBedeli, hizmetBedeliCiro, islemTarihi, aciklama } = req.body;
  const { userId, firmaId, role } = req.user;

  if (!portfoyId) {
    return res.status(400).json({ message: 'Portföy ID zorunludur.' });
  }

  if (!islemTuru || islemBedeli === undefined || hizmetBedeliCiro === undefined) {
    return res.status(400).json({ message: 'İşlem türü, işlem bedeli ve ciro tutarı zorunludur.' });
  }

  const pool = await poolPromise;

  try {
    // 1. Portföy varlık ve yetki kontrolü
    const checkResult = await pool.request()
      .input('portfoyId', sql.UniqueIdentifier, portfoyId)
      .input('firmaId', sql.UniqueIdentifier, firmaId)
      .query('SELECT Id, GorevliUzmanId, Tur FROM Portfoyler WHERE Id = @portfoyId AND FirmaId = @firmaId');

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Portföy bulunamadı veya bu işlem için yetkiniz yok.' });
    }

    const portfolio = checkResult.recordset[0];
    const isOwner = portfolio.GorevliUzmanId === userId;
    const isYetkili = role === 'YETKILI';

    if (!isOwner && !isYetkili) {
      return res.status(403).json({ message: 'Bu portföy işlemini kapatmak için yetkiniz bulunmamaktadır. Sadece ilgili uzman veya yetkili kapatabilir.' });
    }

    const finalDurum = (islemTuru.toUpperCase() === 'KIRALAMA' || portfolio.Tur === 'KIRALIK') ? 'KIRALANDI' : 'SATILDI';
    const closingDate = islemTarihi ? new Date(islemTarihi) : new Date();

    // 2. Transaction başlatma
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // a. Update dbo.Portfoyler.Durum to 'SATILDI' or 'KIRALANDI'
      await transaction.request()
        .input('portfoyId', sql.UniqueIdentifier, portfoyId)
        .input('durum', sql.NVarChar, finalDurum)
        .query(`
          UPDATE Portfoyler
          SET Durum = @durum
          WHERE Id = @portfoyId
        `);

      // b. Insert new record into dbo.SatisIslemleri
      await transaction.request()
        .input('portfoyId', sql.UniqueIdentifier, portfoyId)
        .input('danismanId', sql.UniqueIdentifier, userId)
        .input('islemTuru', sql.NVarChar, islemTuru.toUpperCase())
        .input('islemBedeli', sql.Decimal(18, 2), Number(islemBedeli))
        .input('hizmetBedeliCiro', sql.Decimal(18, 2), Number(hizmetBedeliCiro))
        .input('islemTarihi', sql.DateTime, closingDate)
        .input('aciklama', sql.NVarChar, aciklama || null)
        .query(`
          INSERT INTO SatisIslemleri (PortfoyID, DanismanID, IslemTuru, IslemBedeli, HizmetBedeliCiro, IslemTarihi, Aciklama)
          VALUES (@portfoyId, @danismanId, @islemTuru, @islemBedeli, @hizmetBedeliCiro, @islemTarihi, @aciklama)
        `);

      await transaction.commit();

      res.json({
        message: `Portföy başarıyla '${finalDurum}' olarak kapatıldı ve ciro kaydı işlendi.`,
        durum: finalDurum,
        islemBedeli: Number(islemBedeli),
        hizmetBedeliCiro: Number(hizmetBedeliCiro)
      });

    } catch (txErr: any) {
      await transaction.rollback().catch(() => {});
      throw txErr;
    }

  } catch (error: any) {
    console.error('[HOMEY API] closePortfolioTransaction Error:', error);
    res.status(500).json({ message: 'Portföy işlemi kapatılırken hata oluştu.', error: error.message });
  }
};
