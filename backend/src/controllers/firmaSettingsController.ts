import { Response } from 'express';
import { poolPromise, sql } from '../config/db';

export const getFirmaSettings = async (req: any, res: Response) => {
  try {
    const { firmaId } = req.user;
    if (!firmaId) {
      return res.status(401).json({ message: 'Yetkilendirme hatası (FirmaId bulunamadı).' });
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input('FirmaId', sql.UniqueIdentifier, firmaId)
      .query(`
        SELECT * FROM FirmaKomisyonAyarlari
        WHERE FirmaId = @FirmaId
      `);

    if (result.recordset.length === 0) {
      // Eğer henüz kayıt yoksa varsayılan değerler dönebiliriz.
      return res.status(200).json({
        KiralamaKomisyonOrani: 1.00,
        KiralamaKdv: 20.00,
        KiralamaDepozitoSiniri: 3,
        KiralamaPesinKira: 1,
        KiralamaKaporaTipi: 'ESNEK',
        SatisAliciKomisyon: 2.00,
        SatisSaticiKomisyon: 2.00,
        TapuHarciAlici: 2.00,
        TapuHarciSatici: 2.00,
        DonerSermayeBedeli: 0.00,
        SatisKaporaOrani: 5.00,
        DisOfisPortfoyPayi: 50.00,
        DisOfisMusteriPayi: 50.00,
        IciPortfoyPayi: 50.00,
        IciMusteriPayi: 50.00,
        BrokerDanismanPayi: 50.00,
        BrokerOfisPayi: 50.00,
        KademeliDanismanPayi: 60.00,
        KademeliOfisPayi: 40.00,
        MasaUcretiTutar: 0.00,
        MasaDanismanPayi: 70.00
      });
    }

    return res.status(200).json(result.recordset[0]);
  } catch (err: any) {
    console.error('Error in getFirmaSettings:', err);
    return res.status(500).json({ message: 'Ayarlar getirilirken sunucu hatası oluştu.' });
  }
};

export const upsertFirmaSettings = async (req: any, res: Response) => {
  try {
    const { firmaId, rol } = req.user;
    
    if (rol !== 'YETKILI') {
      return res.status(403).json({ message: 'Bu ayarları sadece firma yetkilisi değiştirebilir.' });
    }

    const {
      KiralamaKomisyonOrani, KiralamaKdv, KiralamaDepozitoSiniri, KiralamaPesinKira, KiralamaKaporaTipi,
      SatisAliciKomisyon, SatisSaticiKomisyon, TapuHarciAlici, TapuHarciSatici, DonerSermayeBedeli, SatisKaporaOrani,
      DisOfisPortfoyPayi, DisOfisMusteriPayi,
      IciPortfoyPayi, IciMusteriPayi, BrokerDanismanPayi, BrokerOfisPayi, KademeliDanismanPayi, KademeliOfisPayi, MasaUcretiTutar, MasaDanismanPayi
    } = req.body;

    const pool = await poolPromise;
    
    // Check if exists
    const checkResult = await pool.request()
      .input('FirmaId', sql.UniqueIdentifier, firmaId)
      .query(`SELECT Id FROM FirmaKomisyonAyarlari WHERE FirmaId = @FirmaId`);
      
    if (checkResult.recordset.length > 0) {
      // UPDATE
      await pool.request()
        .input('FirmaId', sql.UniqueIdentifier, firmaId)
        .input('KiralamaKomisyonOrani', sql.Decimal(18,2), KiralamaKomisyonOrani ?? 1.00)
        .input('KiralamaKdv', sql.Decimal(18,2), KiralamaKdv ?? 20.00)
        .input('KiralamaDepozitoSiniri', sql.Int, KiralamaDepozitoSiniri ?? 3)
        .input('KiralamaPesinKira', sql.Int, KiralamaPesinKira ?? 1)
        .input('KiralamaKaporaTipi', sql.NVarChar(50), KiralamaKaporaTipi ?? 'ESNEK')
        .input('SatisAliciKomisyon', sql.Decimal(18,2), SatisAliciKomisyon ?? 2.00)
        .input('SatisSaticiKomisyon', sql.Decimal(18,2), SatisSaticiKomisyon ?? 2.00)
        .input('TapuHarciAlici', sql.Decimal(18,2), TapuHarciAlici ?? 2.00)
        .input('TapuHarciSatici', sql.Decimal(18,2), TapuHarciSatici ?? 2.00)
        .input('DonerSermayeBedeli', sql.Decimal(18,2), DonerSermayeBedeli ?? 0.00)
        .input('SatisKaporaOrani', sql.Decimal(18,2), SatisKaporaOrani ?? 5.00)
        .input('DisOfisPortfoyPayi', sql.Decimal(18,2), DisOfisPortfoyPayi ?? 50.00)
        .input('DisOfisMusteriPayi', sql.Decimal(18,2), DisOfisMusteriPayi ?? 50.00)
        .input('IciPortfoyPayi', sql.Decimal(18,2), IciPortfoyPayi ?? 50.00)
        .input('IciMusteriPayi', sql.Decimal(18,2), IciMusteriPayi ?? 50.00)
        .input('BrokerDanismanPayi', sql.Decimal(18,2), BrokerDanismanPayi ?? 50.00)
        .input('BrokerOfisPayi', sql.Decimal(18,2), BrokerOfisPayi ?? 50.00)
        .input('KademeliDanismanPayi', sql.Decimal(18,2), KademeliDanismanPayi ?? 60.00)
        .input('KademeliOfisPayi', sql.Decimal(18,2), KademeliOfisPayi ?? 40.00)
        .input('MasaUcretiTutar', sql.Decimal(18,2), MasaUcretiTutar ?? 0.00)
        .input('MasaDanismanPayi', sql.Decimal(18,2), MasaDanismanPayi ?? 70.00)
        .query(`
          UPDATE FirmaKomisyonAyarlari SET
            KiralamaKomisyonOrani = @KiralamaKomisyonOrani,
            KiralamaKdv = @KiralamaKdv,
            KiralamaDepozitoSiniri = @KiralamaDepozitoSiniri,
            KiralamaPesinKira = @KiralamaPesinKira,
            KiralamaKaporaTipi = @KiralamaKaporaTipi,
            SatisAliciKomisyon = @SatisAliciKomisyon,
            SatisSaticiKomisyon = @SatisSaticiKomisyon,
            TapuHarciAlici = @TapuHarciAlici,
            TapuHarciSatici = @TapuHarciSatici,
            DonerSermayeBedeli = @DonerSermayeBedeli,
            SatisKaporaOrani = @SatisKaporaOrani,
            DisOfisPortfoyPayi = @DisOfisPortfoyPayi,
            DisOfisMusteriPayi = @DisOfisMusteriPayi,
            IciPortfoyPayi = @IciPortfoyPayi,
            IciMusteriPayi = @IciMusteriPayi,
            BrokerDanismanPayi = @BrokerDanismanPayi,
            BrokerOfisPayi = @BrokerOfisPayi,
            KademeliDanismanPayi = @KademeliDanismanPayi,
            KademeliOfisPayi = @KademeliOfisPayi,
            MasaUcretiTutar = @MasaUcretiTutar,
            MasaDanismanPayi = @MasaDanismanPayi,
            GuncellemeTarihi = GETDATE()
          WHERE FirmaId = @FirmaId
        `);
    } else {
      // INSERT
      await pool.request()
        .input('FirmaId', sql.UniqueIdentifier, firmaId)
        .input('KiralamaKomisyonOrani', sql.Decimal(18,2), KiralamaKomisyonOrani ?? 1.00)
        .input('KiralamaKdv', sql.Decimal(18,2), KiralamaKdv ?? 20.00)
        .input('KiralamaDepozitoSiniri', sql.Int, KiralamaDepozitoSiniri ?? 3)
        .input('KiralamaPesinKira', sql.Int, KiralamaPesinKira ?? 1)
        .input('KiralamaKaporaTipi', sql.NVarChar(50), KiralamaKaporaTipi ?? 'ESNEK')
        .input('SatisAliciKomisyon', sql.Decimal(18,2), SatisAliciKomisyon ?? 2.00)
        .input('SatisSaticiKomisyon', sql.Decimal(18,2), SatisSaticiKomisyon ?? 2.00)
        .input('TapuHarciAlici', sql.Decimal(18,2), TapuHarciAlici ?? 2.00)
        .input('TapuHarciSatici', sql.Decimal(18,2), TapuHarciSatici ?? 2.00)
        .input('DonerSermayeBedeli', sql.Decimal(18,2), DonerSermayeBedeli ?? 0.00)
        .input('SatisKaporaOrani', sql.Decimal(18,2), SatisKaporaOrani ?? 5.00)
        .input('DisOfisPortfoyPayi', sql.Decimal(18,2), DisOfisPortfoyPayi ?? 50.00)
        .input('DisOfisMusteriPayi', sql.Decimal(18,2), DisOfisMusteriPayi ?? 50.00)
        .input('IciPortfoyPayi', sql.Decimal(18,2), IciPortfoyPayi ?? 50.00)
        .input('IciMusteriPayi', sql.Decimal(18,2), IciMusteriPayi ?? 50.00)
        .input('BrokerDanismanPayi', sql.Decimal(18,2), BrokerDanismanPayi ?? 50.00)
        .input('BrokerOfisPayi', sql.Decimal(18,2), BrokerOfisPayi ?? 50.00)
        .input('KademeliDanismanPayi', sql.Decimal(18,2), KademeliDanismanPayi ?? 60.00)
        .input('KademeliOfisPayi', sql.Decimal(18,2), KademeliOfisPayi ?? 40.00)
        .input('MasaUcretiTutar', sql.Decimal(18,2), MasaUcretiTutar ?? 0.00)
        .input('MasaDanismanPayi', sql.Decimal(18,2), MasaDanismanPayi ?? 70.00)
        .query(`
          INSERT INTO FirmaKomisyonAyarlari (
            FirmaId, KiralamaKomisyonOrani, KiralamaKdv, KiralamaDepozitoSiniri, KiralamaPesinKira, KiralamaKaporaTipi,
            SatisAliciKomisyon, SatisSaticiKomisyon, TapuHarciAlici, TapuHarciSatici, DonerSermayeBedeli, SatisKaporaOrani,
            DisOfisPortfoyPayi, DisOfisMusteriPayi, IciPortfoyPayi, IciMusteriPayi, BrokerDanismanPayi, BrokerOfisPayi,
            KademeliDanismanPayi, KademeliOfisPayi, MasaUcretiTutar, MasaDanismanPayi
          ) VALUES (
            @FirmaId, @KiralamaKomisyonOrani, @KiralamaKdv, @KiralamaDepozitoSiniri, @KiralamaPesinKira, @KiralamaKaporaTipi,
            @SatisAliciKomisyon, @SatisSaticiKomisyon, @TapuHarciAlici, @TapuHarciSatici, @DonerSermayeBedeli, @SatisKaporaOrani,
            @DisOfisPortfoyPayi, @DisOfisMusteriPayi, @IciPortfoyPayi, @IciMusteriPayi, @BrokerDanismanPayi, @BrokerOfisPayi,
            @KademeliDanismanPayi, @KademeliOfisPayi, @MasaUcretiTutar, @MasaDanismanPayi
          )
        `);
    }

    return res.status(200).json({ message: 'Ayarlar başarıyla kaydedildi.' });

  } catch (err: any) {
    console.error('Error in upsertFirmaSettings:', err);
    return res.status(500).json({ message: 'Ayarlar kaydedilirken sunucu hatası oluştu.' });
  }
};
