import { Response } from 'express';
import { poolPromise, sql } from '../config/db';

// Müşteri Ekleme (POST /api/clients/add) - Korumalı
export const addClient = async (req: any, res: Response) => {
  const { ad, soyad, telefon, aradigiButce, aradigiEmlakTipi, musteriTipi } = req.body;
  const { firmaId, userId } = req.user;

  if (!ad || !telefon || !musteriTipi) {
    return res.status(400).json({ message: 'Ad, telefon ve müşteri tipi alanları zorunludur.' });
  }

  try {
    const pool = await poolPromise;
    await pool.request()
      .input('firmaId', sql.UniqueIdentifier, firmaId)
      .input('kayitEdenUzmanId', sql.UniqueIdentifier, userId)
      .input('ad', sql.NVarChar, ad)
      .input('soyad', sql.NVarChar, soyad || '')
      .input('telefon', sql.NVarChar, telefon)
      .input('aradigiButce', sql.Decimal(18, 2), aradigiButce ? Number(aradigiButce) : null)
      .input('aradigiEmlakTipi', sql.NVarChar, aradigiEmlakTipi || null)
      .input('musteriTipi', sql.NVarChar, musteriTipi)
      .query(`
        INSERT INTO Musteriler (
          FirmaId, KayitEdenUzmanId, Ad, Soyad, Telefon, AradigiButce, AradigiEmlakTipi, Müşteri_Tipi
        )
        VALUES (
          @firmaId, @kayitEdenUzmanId, @ad, @soyad, @telefon, @aradigiButce, @aradigiEmlakTipi, @musteriTipi
        )
      `);

    res.status(201).json({ message: 'Müşteri başarıyla kaydedildi.' });
  } catch (error: any) {
    console.error('[HOMEY API] addClient Error:', error);
    res.status(500).json({ message: 'Müşteri kaydedilirken sunucu hatası oluştu.', error: error.message });
  }
};

// Müşterileri Listeleme (GET /api/clients/list) - Korumalı
export const listClients = async (req: any, res: Response) => {
  const { firmaId } = req.user;

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('firmaId', sql.UniqueIdentifier, firmaId)
      .query('SELECT * FROM Musteriler WHERE FirmaId = @firmaId ORDER BY KayitTarihi DESC');

    const mapped = result.recordset.map(c => ({
      id: c.Id,
      ad: c.Ad,
      soyad: c.Soyad,
      telefon: c.Telefon,
      butce: Number(c.AradigiButce || 0),
      tip: c.AradigiEmlakTipi || 'TÜMÜ',
      musteriTipi: c.Müşteri_Tipi || 'ALICI'
    }));

    res.json(mapped);
  } catch (error: any) {
    console.error('[HOMEY API] listClients Error:', error);
    res.status(500).json({ message: 'Müşteriler çekilirken sunucu hatası oluştu.', error: error.message });
  }
};
