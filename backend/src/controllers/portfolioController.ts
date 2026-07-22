import { Response } from 'express';
import { poolPromise, sql } from '../config/db';

// Yeni Portföy Ekleme (POST /api/portfolios/add) - Korumalı
export const addPortfolio = async (req: any, res: Response) => {
  const { 
    tip, tur, fiyat, metrekare, odaSayisi, 
    il, ilce, mahalle, evSahibiAdi, evSahibiTelefon 
  } = req.body;
  const { firmaId, userId } = req.user; // Token'dan çözülen FirmaId ve KullanıcıId

  if (!tip || !tur || !fiyat || !il || !ilce || !evSahibiAdi || !evSahibiTelefon || !metrekare) {
    return res.status(400).json({ message: 'Zorunlu tüm alanları doldurunuz.' });
  }

  try {
    const pool = await poolPromise;

    // Varsayılan kaparo ve depozito oranları hesaplaması
    const fiyatNum = Number(fiyat);
    const kaparoMiktari = tur === 'SATILIK' ? fiyatNum * 0.02 : fiyatNum * 2;
    const depozitoMiktari = tur === 'KIRALIK' ? fiyatNum * 2 : 0;

    const result = await pool.request()
      .input('firmaId', sql.UniqueIdentifier, firmaId)
      .input('gorevliUzmanId', sql.UniqueIdentifier, userId)
      .input('tip', sql.NVarChar, tip)
      .input('tur', sql.NVarChar, tur)
      .input('fiyat', sql.Decimal(18, 2), fiyatNum)
      .input('metrekare', sql.Int, Number(metrekare))
      .input('odaSayisi', sql.NVarChar, tip === 'ARSA' ? '' : odaSayisi || '')
      .input('kaparoMiktari', sql.Decimal(18, 2), kaparoMiktari)
      .input('depozitoMiktari', sql.Decimal(18, 2), depozitoMiktari)
      .input('il', sql.NVarChar, il)
      .input('ilce', sql.NVarChar, ilce)
      .input('mahalle', sql.NVarChar, mahalle || '')
      .input('evSahibiAdi', sql.NVarChar, evSahibiAdi)
      .input('evSahibiTelefon', sql.NVarChar, evSahibiTelefon)
      .query(`
        INSERT INTO Portfoyler (
          FirmaId, GorevliUzmanId, Tip, Tur, Fiyat, Metrekare, OdaSayisi,
          KaparoMiktari, DepozitoMiktari, Il, Ilce, Mahalle, 
          EvSahibiAdi, EvSahibiTelefon, Durum
        )
        OUTPUT inserted.Id
        VALUES (
          @firmaId, @gorevliUzmanId, @tip, @tur, @fiyat, @metrekare, @odaSayisi,
          @kaparoMiktari, @depozitoMiktari, @il, @ilce, @mahalle,
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
      kaparo: Number(p.KaparoMiktari || 0),
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

    // Varsayılan kaparo ve depozito oranları hesaplaması
    const fiyatNum = Number(fiyat);
    const kaparoMiktari = tur === 'SATILIK' ? fiyatNum * 0.02 : fiyatNum * 2;
    const depozitoMiktari = tur === 'KIRALIK' ? fiyatNum * 2 : 0;

    // 3. Güncelleme sorgusu
    await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .input('tip', sql.NVarChar, tip)
      .input('tur', sql.NVarChar, tur)
      .input('fiyat', sql.Decimal(18, 2), fiyatNum)
      .input('metrekare', sql.Int, Number(metrekare))
      .input('odaSayisi', sql.NVarChar, tip === 'ARSA' ? '' : odaSayisi || '')
      .input('kaparoMiktari', sql.Decimal(18, 2), kaparoMiktari)
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
            KaparoMiktari = @kaparoMiktari,
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
