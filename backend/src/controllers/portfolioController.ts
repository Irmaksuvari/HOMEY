import { Response } from 'express';
import { poolPromise, sql } from '../config/db';

// Yeni Portföy Ekleme (POST /api/portfolios/add) - Korumalı
export const addPortfolio = async (req: any, res: Response) => {
  const {
    tip, tur, fiyat, metrekare, odaSayisi,
    il, ilce, mahalle, semt, cadde, sokak, evSahibiAdi, evSahibiTelefon,
    kaporaMiktari: reqKaporaMiktari, depozitoMiktari: reqDepozitoMiktari,
    isPublished: reqIsPublished,
    aciklama, otoparkTipi, isinmaTipi, balkonDurumu, esyaDurumu, kullanimDurumu,
    tapuDurumu, hasAsansor, isKrediyeUygun, isTakasaUygun, isAcilSatilik, isFiyatiDustu
  } = req.body;
  const { firmaId, userId } = req.user;

  if (!tip || !tur || !fiyat || !il || !ilce || !evSahibiAdi || !evSahibiTelefon || !metrekare) {
    return res.status(400).json({ message: 'Zorunlu tüm alanları doldurunuz.' });
  }

  try {
    const pool = await poolPromise;

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
      .input('isPublished', sql.Bit, isPublished)
      .input('aciklama', sql.NVarChar(sql.MAX), aciklama || '')
      .input('otoparkTipi', sql.NVarChar, otoparkTipi || '')
      .input('isinmaTipi', sql.NVarChar, isinmaTipi || '')
      .input('balkonDurumu', sql.NVarChar, balkonDurumu || '')
      .input('esyaDurumu', sql.NVarChar, esyaDurumu || '')
      .input('kullanimDurumu', sql.NVarChar, kullanimDurumu || '')
      .input('tapuDurumu', sql.NVarChar, tur === 'SATILIK' ? (tapuDurumu || '') : '')
      .input('hasAsansor', sql.Bit, hasAsansor === true || hasAsansor === 'true' || hasAsansor === 1)
      .input('isKrediyeUygun', sql.Bit, tur === 'SATILIK' ? (isKrediyeUygun === true || isKrediyeUygun === 'true' || isKrediyeUygun === 1) : 0)
      .input('isTakasaUygun', sql.Bit, tur === 'SATILIK' ? (isTakasaUygun === true || isTakasaUygun === 'true' || isTakasaUygun === 1) : 0)
      .input('isAcilSatilik', sql.Bit, isAcilSatilik === true || isAcilSatilik === 'true' || isAcilSatilik === 1)
      .input('isFiyatiDustu', sql.Bit, isFiyatiDustu === true || isFiyatiDustu === 'true' || isFiyatiDustu === 1)
      .query(`
        INSERT INTO Portfoyler (
          FirmaId, GorevliUzmanId, Tip, Tur, Fiyat, Metrekare, OdaSayisi,
          KaporaMiktari, DepozitoMiktari, Il, Ilce, Mahalle, Semt, Cadde, Sokak,
          EvSahibiAdi, EvSahibiTelefon, Durum, IsPublished, Aciklama, OtoparkTipi,
          IsinmaTipi, BalkonDurumu, EsyaDurumu, KullanimDurumu, TapuDurumu, HasAsansor,
          IsKrediyeUygun, IsTakasaUygun, IsAcilSatilik, IsFiyatiDustu
        )
        OUTPUT inserted.Id
        VALUES (
          @firmaId, @gorevliUzmanId, @tip, @tur, @fiyat, @metrekare, @odaSayisi,
          @kaporaMiktari, @depozitoMiktari, @il, @ilce, @mahalle, @semt, @cadde, @sokak,
          @evSahibiAdi, @evSahibiTelefon, 'BOSTA', @isPublished, @aciklama, @otoparkTipi,
          @isinmaTipi, @balkonDurumu, @esyaDurumu, @kullanimDurumu, @tapuDurumu, @hasAsansor,
          @isKrediyeUygun, @isTakasaUygun, @isAcilSatilik, @isFiyatiDustu
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
        SELECT p.*, k.Ad as UzmanAd, k.Soyad as UzmanSoyad,
          STUFF((
            SELECT ',' + pf.FotoUrl
            FROM PortfoyFotograflari pf
            WHERE pf.PortfoyID = p.Id
            ORDER BY ISNULL(pf.Sira, 99) ASC, pf.Id DESC
            FOR XML PATH(''), TYPE
          ).value('.', 'NVARCHAR(MAX)'), 1, 1, '') as TumFotograflar
        FROM Portfoyler p
        INNER JOIN Kullanicilar k ON p.GorevliUzmanId = k.Id
        WHERE p.FirmaId = @firmaId
          AND UPPER(ISNULL(p.Durum, 'BOSTA')) NOT IN ('SATILDI', 'KIRALANDI', 'KIRALANDI_SATILDI', 'TAMAMLANDI')
        ORDER BY p.KayitTarihi DESC
      `);

    // Ön yüze uygun formatta eşleme (map)
    const list = result.recordset.map(p => {
      const photos = p.TumFotograflar ? String(p.TumFotograflar).split(',').filter(Boolean) : [];
      return {
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
        semt: p.Semt || '',
        cadde: p.Cadde || '',
        sokak: p.Sokak || '',
        gorevliUzman: `${p.UzmanAd} ${p.UzmanSoyad}`,
        gorevliUzmanId: p.GorevliUzmanId,
        evSahibiAdi: p.EvSahibiAdi,
        evSahibiTelefon: p.EvSahibiTelefon,
        durum: p.Durum,
        isPublished: p.IsPublished === true || p.IsPublished === 1 || p.IsPublished === '1' || p.IsPublished === 'true' || p.IsPublished === 'TRUE',
        aciklama: p.Aciklama || '',
        otoparkTipi: p.OtoparkTipi || '',
        isinmaTipi: p.IsinmaTipi || '',
        balkonDurumu: p.BalkonDurumu || '',
        esyaDurumu: p.EsyaDurumu || '',
        kullanimDurumu: p.KullanimDurumu || '',
        tapuDurumu: p.TapuDurumu || '',
        hasAsansor: p.HasAsansor === true || p.HasAsansor === 1 || p.HasAsansor === '1' || p.HasAsansor === 'true',
        isKrediyeUygun: p.IsKrediyeUygun === true || p.IsKrediyeUygun === 1 || p.IsKrediyeUygun === '1' || p.IsKrediyeUygun === 'true',
        isTakasaUygun: p.IsTakasaUygun === true || p.IsTakasaUygun === 1 || p.IsTakasaUygun === '1' || p.IsTakasaUygun === 'true',
        isAcilSatilik: p.IsAcilSatilik === true || p.IsAcilSatilik === 1 || p.IsAcilSatilik === '1' || p.IsAcilSatilik === 'true',
        isFiyatiDustu: p.IsFiyatiDustu === true || p.IsFiyatiDustu === 1 || p.IsFiyatiDustu === '1' || p.IsFiyatiDustu === 'true',
        yetkilendirmeSozlesmesiYapildi: p.YetkilendirmeSozlesmesiYapildi === true || p.YetkilendirmeSozlesmesiYapildi === 1 || p.YetkilendirmeSozlesmesiYapildi === '1' || p.YetkilendirmeSozlesmesiYapildi === 'true',
        fotograflar: photos,
        kapakFoto: photos[0] || null
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
    tapuDurumu, hasAsansor, isKrediyeUygun, isTakasaUygun, isAcilSatilik, isFiyatiDustu
  } = req.body;
  const { firmaId, userId, rol } = req.user;

  if (!tip || !tur || !fiyat || !il || !ilce || !evSahibiAdi || !evSahibiTelefon || !metrekare) {
    return res.status(400).json({ message: 'Zorunlu tüm alanları doldurunuz.' });
  }

  try {
    const pool = await poolPromise;

    const checkResult = await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .input('firmaId', sql.UniqueIdentifier, firmaId)
      .query('SELECT GorevliUzmanId FROM Portfoyler WHERE Id = @id AND FirmaId = @firmaId');

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Güncellenmek istenen portföy bulunamadı.' });
    }

    const currentGorevliUzmanId = checkResult.recordset[0].GorevliUzmanId;

    if (currentGorevliUzmanId !== userId) {
      return res.status(403).json({ message: 'Bu portföyü düzenlemek için yetkiniz bulunmamaktadır.' });
    }

    const fiyatNum = Number(fiyat);
    const kaporaMiktari = tur === 'SATILIK' ? fiyatNum * 0.02 : fiyatNum * 2;
    const depozitoMiktari = tur === 'KIRALIK' ? fiyatNum * 2 : 0;

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
      .input('semt', sql.NVarChar, semt || '')
      .input('cadde', sql.NVarChar, cadde || '')
      .input('sokak', sql.NVarChar, sokak || '')
      .input('evSahibiAdi', sql.NVarChar, evSahibiAdi)
      .input('evSahibiTelefon', sql.NVarChar, evSahibiTelefon)
      .input('aciklama', sql.NVarChar(sql.MAX), aciklama || '')
      .input('otoparkTipi', sql.NVarChar, otoparkTipi || '')
      .input('isinmaTipi', sql.NVarChar, isinmaTipi || '')
      .input('balkonDurumu', sql.NVarChar, balkonDurumu || '')
      .input('esyaDurumu', sql.NVarChar, esyaDurumu || '')
      .input('kullanimDurumu', sql.NVarChar, kullanimDurumu || '')
      .input('tapuDurumu', sql.NVarChar, tur === 'SATILIK' ? (tapuDurumu || '') : '')
      .input('hasAsansor', sql.Bit, hasAsansor === true || hasAsansor === 'true' || hasAsansor === 1)
      .input('isKrediyeUygun', sql.Bit, tur === 'SATILIK' ? (isKrediyeUygun === true || isKrediyeUygun === 'true' || isKrediyeUygun === 1) : 0)
      .input('isTakasaUygun', sql.Bit, tur === 'SATILIK' ? (isTakasaUygun === true || isTakasaUygun === 'true' || isTakasaUygun === 1) : 0)
      .input('isAcilSatilik', sql.Bit, isAcilSatilik === true || isAcilSatilik === 'true' || isAcilSatilik === 1)
      .input('isFiyatiDustu', sql.Bit, isFiyatiDustu === true || isFiyatiDustu === 'true' || isFiyatiDustu === 1)
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
            Semt = @semt,
            Cadde = @cadde,
            Sokak = @sokak,
            EvSahibiAdi = @evSahibiAdi,
            EvSahibiTelefon = @evSahibiTelefon,
            Aciklama = @aciklama,
            OtoparkTipi = @otoparkTipi,
            IsinmaTipi = @isinmaTipi,
            BalkonDurumu = @balkonDurumu,
            EsyaDurumu = @esyaDurumu,
            KullanimDurumu = @kullanimDurumu,
            TapuDurumu = @tapuDurumu,
            HasAsansor = @hasAsansor,
            IsKrediyeUygun = @isKrediyeUygun,
            IsTakasaUygun = @isTakasaUygun,
            IsAcilSatilik = @isAcilSatilik,
            IsFiyatiDustu = @isFiyatiDustu
        WHERE Id = @id
      `);

    res.json({ message: 'Portföy başarıyla güncellendi.' });

  } catch (error: any) {
    console.error('[HOMEY API] editPortfolio Error:', error);
    res.status(500).json({ message: 'Portföy güncellenirken sunucu hatası oluştu.', error: error.message });
  }
};

export const updatePortfolioPublishState = async (req: any, res: Response) => {
  const { id } = req.params;
  const { isPublished } = req.body;
  const { firmaId, userId, rol } = req.user;

  if (id === undefined || id === null || id === '') {
    return res.status(400).json({ message: 'Portföy ID bilgisi eksik.' });
  }

  try {
    const pool = await poolPromise;

    const checkResult = await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .input('firmaId', sql.UniqueIdentifier, firmaId)
      .query('SELECT GorevliUzmanId FROM Portfoyler WHERE Id = @id AND FirmaId = @firmaId');

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Portföy bulunamadı.' });
    }

    const currentGorevliUzmanId = checkResult.recordset[0].GorevliUzmanId;

    if (currentGorevliUzmanId !== userId) {
      return res.status(403).json({ message: 'Bu portföyün yayın durumunu değiştirmek için yetkiniz yok.' });
    }

    const normalizedPublished = Boolean(isPublished);

    await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .input('isPublished', sql.Bit, normalizedPublished)
      .query('UPDATE Portfoyler SET IsPublished = @isPublished WHERE Id = @id');

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
  const role = req.user?.rol || req.user?.role;

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

    if (!isOwner) {
      return res.status(403).json({ message: 'Bu portföy işlemini kapatmak için yetkiniz bulunmamaktadır. Sadece portföy sahibi işlemi kapatabilir.' });
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

      const validAliciMusteriId = (typeof aliciMusteriId === 'string' && aliciMusteriId.trim().length > 0) ? aliciMusteriId.trim() : null;

      // b. Insert new record into dbo.SatisIslemleri
      await transaction.request()
        .input('portfoyId', sql.UniqueIdentifier, portfoyId)
        .input('danismanId', sql.UniqueIdentifier, userId)
        .input('aliciMusteriId', sql.UniqueIdentifier, validAliciMusteriId)
        .input('islemTuru', sql.NVarChar, islemTuru.toUpperCase())
        .input('islemBedeli', sql.Decimal(18, 2), Number(islemBedeli))
        .input('hizmetBedeliCiro', sql.Decimal(18, 2), Number(hizmetBedeliCiro))
        .input('islemTarihi', sql.DateTime, closingDate)
        .input('aciklama', sql.NVarChar, aciklama || null)
        .query(`
          INSERT INTO SatisIslemleri (PortfoyID, DanismanID, AliciMusteriId, IslemTuru, IslemBedeli, HizmetBedeliCiro, IslemTarihi, Aciklama)
          VALUES (@portfoyId, @danismanId, @aliciMusteriId, @islemTuru, @islemBedeli, @hizmetBedeliCiro, @islemTarihi, @aciklama)
        `);

      // c. Satın alma işlemi gerçekleştikten sonra işlemi yapan müşteriyi pasif yap (is_active = 0)
      if (validAliciMusteriId) {
        await transaction.request()
          .input('aliciMusteriId', sql.UniqueIdentifier, validAliciMusteriId)
          .query(`
            IF COL_LENGTH('Musteriler', 'is_active') IS NULL
            BEGIN
              ALTER TABLE Musteriler ADD is_active BIT NOT NULL DEFAULT 1;
            END
            UPDATE Musteriler
            SET is_active = 0
            WHERE Id = @aliciMusteriId
          `);
      }

      // d. O portföye ait tüm randevuları veritabanından tamamen sil
      await transaction.request()
        .input('portfoyId', sql.UniqueIdentifier, portfoyId)
        .query(`
          DELETE FROM Randevular
          WHERE PortfoyId = @portfoyId
        `);

      await transaction.commit();

      res.json({
        message: `Portföy başarıyla '${finalDurum}' olarak kapatıldı ve ciro kaydı işlendi.`,
        durum: finalDurum,
        islemBedeli: Number(islemBedeli),
        hizmetBedeliCiro: Number(hizmetBedeliCiro)
      });

    } catch (txErr: any) {
      await transaction.rollback().catch(() => { });
      throw txErr;
    }

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
    const pool = await poolPromise;

    let result;
    try {
      result = await pool.request()
        .input('firmaId', sql.UniqueIdentifier, firmaId || null)
        .input('userId', sql.UniqueIdentifier, userId || null)
        .query(`
          SELECT 
            CAST(s.IslemID AS NVARCHAR(36)) AS Id,
            ISNULL(p.Tip, 'DAIRE') AS Tip,
            ISNULL(p.Tur, CASE WHEN UPPER(s.IslemTuru) = 'KIRALAMA' THEN 'KIRALIK' ELSE 'SATILIK' END) AS Tur,
            ISNULL(s.IslemBedeli, ISNULL(p.Fiyat, 0)) AS Fiyat,
            p.Metrekare, 
            p.OdaSayisi,
            p.KaporaMiktari, 
            p.DepozitoMiktari, 
            ISNULL(p.Il, 'İstanbul') AS Il, 
            ISNULL(p.Ilce, 'Merkez') AS Ilce, 
            p.Mahalle,
            p.EvSahibiAdi, 
            p.EvSahibiTelefon,
            ISNULL(p.Durum, CASE WHEN UPPER(s.IslemTuru) = 'KIRALAMA' THEN 'KIRALANDI' ELSE 'SATILDI' END) AS Durum,
            ISNULL(p.GorevliUzmanId, s.DanismanID) AS GorevliUzmanId,
            k.Ad AS UzmanAd, 
            k.Soyad AS UzmanSoyad,
            s.IslemID AS SatisIslemId, 
            s.DanismanID AS IslemYapanDanismanId,
            s.IslemTuru, 
            s.IslemBedeli, 
            s.HizmetBedeliCiro, 
            s.IslemTarihi, 
            s.Aciklama AS IslemAciklama,
            dk.Ad AS IslemYapanAd, 
            dk.Soyad AS IslemYapanSoyad,
            s.AliciMusteriID AS AliciMusteriId,
            m.Ad AS AliciMusteriAd
          FROM SatisIslemleri s
          LEFT JOIN Portfoyler p ON s.PortfoyID = p.Id
          LEFT JOIN Kullanicilar dk ON s.DanismanID = dk.Id
          LEFT JOIN Kullanicilar k ON p.GorevliUzmanId = k.Id
          LEFT JOIN Musteriler m ON s.AliciMusteriID = m.Id
          WHERE (@firmaId IS NULL OR dk.FirmaId = @firmaId OR p.FirmaId = @firmaId)

          UNION ALL

          SELECT 
            CAST(p.Id AS NVARCHAR(36)) AS Id,
            p.Tip,
            p.Tur,
            p.Fiyat,
            p.Metrekare,
            p.OdaSayisi,
            p.KaporaMiktari,
            p.DepozitoMiktari,
            p.Il,
            p.Ilce,
            p.Mahalle,
            p.EvSahibiAdi,
            p.EvSahibiTelefon,
            p.Durum,
            p.GorevliUzmanId,
            k.Ad AS UzmanAd,
            k.Soyad AS UzmanSoyad,
            NULL AS SatisIslemId,
            p.GorevliUzmanId AS IslemYapanDanismanId,
            CASE WHEN p.Tur = 'KIRALIK' THEN 'KIRALAMA' ELSE 'SATIS' END AS IslemTuru,
            p.Fiyat AS IslemBedeli,
            0 AS HizmetBedeliCiro,
            p.KayitTarihi AS IslemTarihi,
            NULL AS IslemAciklama,
            k.Ad AS IslemYapanAd,
            k.Soyad AS IslemYapanSoyad,
            NULL AS AliciMusteriId,
            NULL AS AliciMusteriAd
          FROM Portfoyler p
          LEFT JOIN Kullanicilar k ON p.GorevliUzmanId = k.Id
          WHERE UPPER(ISNULL(p.Durum, '')) IN ('SATILDI', 'KIRALANDI', 'KIRALANDI_SATILDI')
            AND (@firmaId IS NULL OR p.FirmaId = @firmaId)

          ORDER BY IslemTarihi DESC
        `);
    } catch (sqlErr: any) {
      console.warn('[HOMEY API] Full SatisIslemleri query fallback triggered:', sqlErr.message);
      // SatisIslemleri veya Musteriler tablosunda kolon uyuşmazlığı varsa sadece Portfoyler tablosundan tamamlananları getir
      result = await pool.request()
        .input('firmaId', sql.UniqueIdentifier, firmaId || null)
        .query(`
          SELECT 
            CAST(p.Id AS NVARCHAR(36)) AS Id,
            p.Tip, p.Tur, p.Fiyat, p.Metrekare, p.OdaSayisi,
            p.KaporaMiktari, p.DepozitoMiktari, p.Il, p.Ilce, p.Mahalle,
            p.EvSahibiAdi, p.EvSahibiTelefon, p.Durum, p.GorevliUzmanId,
            k.Ad AS UzmanAd, k.Soyad AS UzmanSoyad,
            NULL AS SatisIslemId, p.GorevliUzmanId AS IslemYapanDanismanId,
            CASE WHEN p.Tur = 'KIRALIK' THEN 'KIRALAMA' ELSE 'SATIS' END AS IslemTuru,
            p.Fiyat AS IslemBedeli, 0 AS HizmetBedeliCiro, p.KayitTarihi AS IslemTarihi,
            NULL AS IslemAciklama, k.Ad AS IslemYapanAd, k.Soyad AS IslemYapanSoyad,
            NULL AS AliciMusteriId, NULL AS AliciMusteriAd
          FROM Portfoyler p
          LEFT JOIN Kullanicilar k ON p.GorevliUzmanId = k.Id
          WHERE UPPER(ISNULL(p.Durum, '')) IN ('SATILDI', 'KIRALANDI', 'KIRALANDI_SATILDI')
            AND (@firmaId IS NULL OR p.FirmaId = @firmaId)
        `);
    }

    const list = result.recordset.map((p: any) => {
      const islemBedeliNum = p.IslemBedeli !== null && p.IslemBedeli !== undefined ? Number(p.IslemBedeli) : Number(p.Fiyat || 0);
      const ciroNum = p.HizmetBedeliCiro !== null && p.HizmetBedeliCiro !== undefined ? Number(p.HizmetBedeliCiro) : 0;

      return {
        id: p.Id,
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
        evSahibiAdi: p.EvSahibiAdi || 'Mülk Sahibi',
        evSahibiTelefon: p.EvSahibiTelefon || '',
        durum: p.Durum || (p.IslemTuru === 'KIRALAMA' ? 'KIRALANDI' : 'SATILDI'),
        gorevliUzmanId: p.GorevliUzmanId,
        gorevliUzman: p.UzmanAd ? `${p.UzmanAd} ${p.UzmanSoyad || ''}`.trim() : (p.IslemYapanAd ? `${p.IslemYapanAd} ${p.IslemYapanSoyad || ''}`.trim() : 'Danışman'),
        satisIslemId: p.SatisIslemId,
        islemYapanDanismanId: p.IslemYapanDanismanId || p.GorevliUzmanId,
        islemTuru: p.IslemTuru || (p.Durum === 'SATILDI' ? 'SATIS' : 'KIRALAMA'),
        islemBedeli: islemBedeliNum,
        hizmetBedeliCiro: ciroNum,
        islemTarihi: p.IslemTarihi,
        islemAciklama: p.IslemAciklama,
        islemYapanDanisman: p.IslemYapanAd ? `${p.IslemYapanAd} ${p.IslemYapanSoyad || ''}`.trim() : (p.UzmanAd ? `${p.UzmanAd} ${p.UzmanSoyad || ''}`.trim() : 'Danışman'),
        aliciMusteriId: p.AliciMusteriId,
        aliciMusteri: p.AliciMusteriAd || null
      };
    });

    res.json(list);

  } catch (error: any) {
    console.error('[HOMEY API] getCompletedPortfolios Error:', error);
    res.json([]);
  }
};



