import { Response } from 'express';
import { poolPromise, sql } from '../config/db';

// GET /api/dashboard/summary — Ofis Finansal Dashboard Verileri (Sadece YETKILI)
export const getDashboardSummary = async (req: any, res: Response) => {
  const { firmaId, rol } = req.user;

  if (rol !== 'YETKILI') {
    return res.status(403).json({ message: 'Bu sayfaya yalnızca yetkili kullanıcılar erişebilir.' });
  }

  try {
    const pool = await poolPromise;

    // --- Tarih hesaplamaları ---
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // 1. Aylık Toplam Ofis Cirosu (Bu Ay)
    const ciroThisMonth = await pool.request()
      .input('firmaId', sql.UniqueIdentifier, firmaId)
      .input('startDate', sql.DateTime, thisMonthStart)
      .input('endDate', sql.DateTime, thisMonthEnd)
      .query(`
        SELECT ISNULL(SUM(s.HizmetBedeliCiro), 0) AS toplam
        FROM SatisIslemleri s
        INNER JOIN Portfoyler p ON s.PortfoyID = p.Id
        WHERE p.FirmaId = @firmaId
          AND s.IslemTarihi >= @startDate AND s.IslemTarihi <= @endDate
      `);

    // 2. Aylık Toplam Ofis Cirosu (Geçen Ay)
    const ciroLastMonth = await pool.request()
      .input('firmaId', sql.UniqueIdentifier, firmaId)
      .input('startDate', sql.DateTime, lastMonthStart)
      .input('endDate', sql.DateTime, lastMonthEnd)
      .query(`
        SELECT ISNULL(SUM(s.HizmetBedeliCiro), 0) AS toplam
        FROM SatisIslemleri s
        INNER JOIN Portfoyler p ON s.PortfoyID = p.Id
        WHERE p.FirmaId = @firmaId
          AND s.IslemTarihi >= @startDate AND s.IslemTarihi <= @endDate
      `);

    // 3. Yeni Müşteri Sayısı (Bu Ay)
    const musteriThisMonth = await pool.request()
      .input('firmaId', sql.UniqueIdentifier, firmaId)
      .input('startDate', sql.DateTime, thisMonthStart)
      .input('endDate', sql.DateTime, thisMonthEnd)
      .query(`
        SELECT COUNT(*) AS toplam
        FROM Musteriler
        WHERE FirmaId = @firmaId
          AND KayitTarihi >= @startDate AND KayitTarihi <= @endDate
      `);

    // 4. Yeni Müşteri Sayısı (Geçen Ay)
    const musteriLastMonth = await pool.request()
      .input('firmaId', sql.UniqueIdentifier, firmaId)
      .input('startDate', sql.DateTime, lastMonthStart)
      .input('endDate', sql.DateTime, lastMonthEnd)
      .query(`
        SELECT COUNT(*) AS toplam
        FROM Musteriler
        WHERE FirmaId = @firmaId
          AND KayitTarihi >= @startDate AND KayitTarihi <= @endDate
      `);

    // 5. Kapanan İşlem Sayısı (Bu Ay)
    const kapananIslem = await pool.request()
      .input('firmaId', sql.UniqueIdentifier, firmaId)
      .input('startDate', sql.DateTime, thisMonthStart)
      .input('endDate', sql.DateTime, thisMonthEnd)
      .query(`
        SELECT COUNT(*) AS toplam
        FROM SatisIslemleri s
        INNER JOIN Portfoyler p ON s.PortfoyID = p.Id
        WHERE p.FirmaId = @firmaId
          AND s.IslemTarihi >= @startDate AND s.IslemTarihi <= @endDate
      `);

    // 6. Aktif İlan Stoğu Bedeli
    const aktifIlanBedeli = await pool.request()
      .input('firmaId', sql.UniqueIdentifier, firmaId)
      .query(`
        SELECT ISNULL(SUM(Fiyat), 0) AS toplam, COUNT(*) AS adet
        FROM Portfoyler
        WHERE FirmaId = @firmaId AND Durum = 'BOSTA'
      `);

    // 7. Son 6 Ay Ciro Trend (Aylık)
    const ciroTrend = await pool.request()
      .input('firmaId', sql.UniqueIdentifier, firmaId)
      .query(`
        SELECT 
          YEAR(s.IslemTarihi) AS yil,
          MONTH(s.IslemTarihi) AS ay,
          ISNULL(SUM(s.HizmetBedeliCiro), 0) AS toplam
        FROM SatisIslemleri s
        INNER JOIN Portfoyler p ON s.PortfoyID = p.Id
        WHERE p.FirmaId = @firmaId
          AND s.IslemTarihi >= DATEADD(MONTH, -5, DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1))
        GROUP BY YEAR(s.IslemTarihi), MONTH(s.IslemTarihi)
        ORDER BY yil, ay
      `);

    // Son 6 ayı doldur (veri olmayan aylar için 0)
    const aylar = [];
    const ayIsimleri = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const yil = d.getFullYear();
      const ay = d.getMonth() + 1;
      const match = ciroTrend.recordset.find((r: any) => r.yil === yil && r.ay === ay);
      aylar.push({
        ay: ayIsimleri[d.getMonth()],
        yil,
        ciro: match ? Number(match.toplam) : 0
      });
    }

    // 8. Portföy Tipi Dağılımı
    const tipDagilimi = await pool.request()
      .input('firmaId', sql.UniqueIdentifier, firmaId)
      .query(`
        SELECT Tip, COUNT(*) AS adet
        FROM Portfoyler
        WHERE FirmaId = @firmaId
        GROUP BY Tip
        ORDER BY adet DESC
      `);

    // 9. Danışman Performans Liderlik Tablosu
    const danismanPerformans = await pool.request()
      .input('firmaId', sql.UniqueIdentifier, firmaId)
      .input('startDate', sql.DateTime, thisMonthStart)
      .input('endDate', sql.DateTime, thisMonthEnd)
      .query(`
        SELECT 
          k.Id AS danismanId,
          k.Ad,
          k.Soyad,
          (SELECT COUNT(*) FROM Portfoyler WHERE GorevliUzmanId = k.Id AND Durum = 'BOSTA') AS aktifPortfoySayisi,
          ISNULL((
            SELECT COUNT(*)
            FROM SatisIslemleri s2
            INNER JOIN Portfoyler p2 ON s2.PortfoyID = p2.Id
            WHERE s2.DanismanID = k.Id
              AND s2.IslemTarihi >= @startDate AND s2.IslemTarihi <= @endDate
          ), 0) AS buAyKapananIslem,
          ISNULL((
            SELECT SUM(s3.HizmetBedeliCiro)
            FROM SatisIslemleri s3
            INNER JOIN Portfoyler p3 ON s3.PortfoyID = p3.Id
            WHERE s3.DanismanID = k.Id
              AND s3.IslemTarihi >= @startDate AND s3.IslemTarihi <= @endDate
          ), 0) AS buAyCiro
        FROM Kullanicilar k
        WHERE k.FirmaId = @firmaId AND k.Rol != 'YETKILI'
        ORDER BY buAyCiro DESC
      `);

    // --- Yanıt ---
    const aylikCiro = Number(ciroThisMonth.recordset[0].toplam);
    const gecenAyCiro = Number(ciroLastMonth.recordset[0].toplam);
    const yeniMusteri = Number(musteriThisMonth.recordset[0].toplam);
    const gecenAyMusteri = Number(musteriLastMonth.recordset[0].toplam);

    res.json({
      aylikCiro,
      gecenAyCiro,
      ciroDegisimYuzde: gecenAyCiro > 0 ? Math.round(((aylikCiro - gecenAyCiro) / gecenAyCiro) * 100) : (aylikCiro > 0 ? 100 : 0),
      yeniMusteriSayisi: yeniMusteri,
      gecenAyMusteriSayisi: gecenAyMusteri,
      musteriDegisimYuzde: gecenAyMusteri > 0 ? Math.round(((yeniMusteri - gecenAyMusteri) / gecenAyMusteri) * 100) : (yeniMusteri > 0 ? 100 : 0),
      kapananIslemSayisi: Number(kapananIslem.recordset[0].toplam),
      aktifIlanBedeli: Number(aktifIlanBedeli.recordset[0].toplam),
      aktifIlanAdet: Number(aktifIlanBedeli.recordset[0].adet),
      aylikCiroTrend: aylar,
      portfoyTipDagilimi: tipDagilimi.recordset.map((r: any) => ({
        tip: r.Tip,
        adet: r.adet
      })),
      danismanPerformans: danismanPerformans.recordset.map((r: any) => ({
        id: r.danismanId,
        ad: r.Ad,
        soyad: r.Soyad,
        aktifPortfoySayisi: r.aktifPortfoySayisi,
        buAyKapananIslem: r.buAyKapananIslem,
        buAyCiro: Number(r.buAyCiro)
      }))
    });

  } catch (error: any) {
    console.error('[HOMEY API] getDashboardSummary Error:', error);
    res.status(500).json({ message: 'Dashboard verileri getirilirken hata oluştu.', error: error.message });
  }
};
