import { Response } from 'express';
import { Sale } from '../models/Sale';
import { Portfolio } from '../models/Portfolio';
import { Client } from '../models/Client';
import { User } from '../models/User';
import mongoose from 'mongoose';

// GET /api/dashboard/summary — Ofis Finansal Dashboard Verileri (Sadece YETKILI)
export const getDashboardSummary = async (req: any, res: Response) => {
  const { firmaId, rol } = req.user;

  if (rol !== 'YETKILI') {
    return res.status(403).json({ message: 'Bu sayfaya yalnızca yetkili kullanıcılar erişebilir.' });
  }

  try {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Filter Portfolios by FirmaId first to limit the join space
    const firmPortfolios = await Portfolio.find({ FirmaId: firmaId, SilindiMi: { $ne: true } }).select('_id');
    const firmPortfolioIds = firmPortfolios.map(p => p._id);

    // 1. Toplam Ofis Cirosu
    const ciroThisMonthAggr = await Sale.aggregate([
      { $match: { PortfoyID: { $in: firmPortfolioIds } } },
      { $group: { _id: null, toplam: { $sum: '$HizmetBedeliCiro' } } }
    ]);
    const aylikCiro = ciroThisMonthAggr[0]?.toplam || 0;

    // 2. Geçen Ay Toplam Ofis Cirosu
    const ciroLastMonthAggr = await Sale.aggregate([
      { $match: { PortfoyID: { $in: firmPortfolioIds }, IslemTarihi: { $gte: lastMonthStart, $lte: lastMonthEnd } } },
      { $group: { _id: null, toplam: { $sum: '$HizmetBedeliCiro' } } }
    ]);
    const gecenAyCiro = ciroLastMonthAggr[0]?.toplam || 0;

    // 3. Yeni Müşteri Sayısı (Son 1 Hafta)
    const yeniMusteri = await Client.countDocuments({ FirmaId: firmaId, KayitTarihi: { $gte: oneWeekAgo } });

    // 4. Yeni Müşteri Sayısı (Önceki 1 Hafta)
    const gecenAyMusteri = await Client.countDocuments({ FirmaId: firmaId, KayitTarihi: { $gte: twoWeeksAgo, $lt: oneWeekAgo } });

    // 5. Kapanan İşlem Sayısı
    const kapananIslem = await Sale.countDocuments({ PortfoyID: { $in: firmPortfolioIds } });

    // 6. Aktif İlan Stoğu Bedeli
    const aktifIlanAggr = await Portfolio.aggregate([
      { $match: { FirmaId: firmaId, Durum: 'BOSTA', SilindiMi: { $ne: true } } },
      { $group: { _id: null, toplam: { $sum: '$Fiyat' }, adet: { $sum: 1 } } }
    ]);
    const aktifIlanBedeli = aktifIlanAggr[0]?.toplam || 0;
    const aktifIlanAdet = aktifIlanAggr[0]?.adet || 0;

    // 7. Son 6 Ay Ciro Trend
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const ciroTrend = await Sale.aggregate([
      { $match: { PortfoyID: { $in: firmPortfolioIds }, IslemTarihi: { $gte: sixMonthsAgo } } },
      { $group: { 
          _id: { yil: { $year: '$IslemTarihi' }, ay: { $month: '$IslemTarihi' } },
          toplam: { $sum: '$HizmetBedeliCiro' }
      }},
      { $sort: { '_id.yil': 1, '_id.ay': 1 } }
    ]);

    const aylar = [];
    const ayIsimleri = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const yil = d.getFullYear();
      const ay = d.getMonth() + 1;
      const match = ciroTrend.find(r => r._id.yil === yil && r._id.ay === ay);
      aylar.push({
        ay: ayIsimleri[d.getMonth()],
        yil,
        ciro: match ? Number(match.toplam) : 0
      });
    }

    // 8. Portföy Tipi Dağılımı
    const tipDagilimi = await Portfolio.aggregate([
      { 
        $match: { 
          FirmaId: firmaId, 
          SilindiMi: { $ne: true },
          Durum: { $nin: ['SATILDI', 'KIRALANDI', 'KIRALANDI_SATILDI', 'TAMAMLANDI'] }
        } 
      },
      { $group: { _id: '$Tip', adet: { $sum: 1 } } },
      { $sort: { adet: -1 } }
    ]);

    // 9. Danışman Performans Liderlik Tablosu
    const users = await User.find({ FirmaId: firmaId, Rol: { $ne: 'YETKILI' }, SilindiMi: { $ne: true } });
    const userIds = users.map(u => u._id);
    
    const danismanPortfoyler = await Portfolio.aggregate([
      { $match: { GorevliUzmanId: { $in: userIds }, Durum: 'BOSTA', SilindiMi: { $ne: true } } },
      { $group: { _id: '$GorevliUzmanId', count: { $sum: 1 } } }
    ]);
    const dpMap = danismanPortfoyler.reduce((acc, curr) => { acc[curr._id] = curr.count; return acc; }, {});

    const danismanSatislar = await Sale.aggregate([
      { $match: { DanismanID: { $in: userIds }, IslemTarihi: { $gte: thisMonthStart, $lte: thisMonthEnd } } },
      { $group: { _id: '$DanismanID', islemCount: { $sum: 1 }, toplamCiro: { $sum: '$HizmetBedeliCiro' } } }
    ]);
    const dsMap = danismanSatislar.reduce((acc, curr) => { acc[curr._id] = curr; return acc; }, {});

    let danismanPerformans = users.map((u: any) => {
      const aktifPortfoySayisi = dpMap[u._id] || 0;
      const satis = dsMap[u._id] || { islemCount: 0, toplamCiro: 0 };
      const buAyKapananIslem = satis.islemCount;
      const buAyCiro = satis.toplamCiro;
      const performansPuani = (buAyKapananIslem * 50) + (aktifPortfoySayisi * 10) + (buAyCiro / 1000);

      return {
        id: u._id,
        ad: u.Ad,
        soyad: u.Soyad,
        aktifPortfoySayisi,
        buAyKapananIslem,
        buAyCiro,
        performansPuani
      };
    });

    danismanPerformans.sort((a, b) => b.performansPuani - a.performansPuani || b.buAyCiro - a.buAyCiro);

    res.json({
      aylikCiro,
      gecenAyCiro,
      ciroDegisimYuzde: gecenAyCiro > 0 ? Math.round(((aylikCiro - gecenAyCiro) / gecenAyCiro) * 100) : (aylikCiro > 0 ? 100 : 0),
      yeniMusteriSayisi: yeniMusteri,
      gecenAyMusteriSayisi: gecenAyMusteri,
      musteriDegisimYuzde: gecenAyMusteri > 0 ? Math.round(((yeniMusteri - gecenAyMusteri) / gecenAyMusteri) * 100) : (yeniMusteri > 0 ? 100 : 0),
      kapananIslemSayisi: kapananIslem,
      aktifIlanBedeli,
      aktifIlanAdet,
      aylikCiroTrend: aylar,
      portfoyTipDagilimi: tipDagilimi.map(r => ({ tip: r._id, adet: r.adet })),
      danismanPerformans
    });

  } catch (error: any) {
    console.error('[HOMEY API] getDashboardSummary Error:', error);
    res.status(500).json({ message: 'Dashboard verileri getirilirken hata oluştu.', error: error.message });
  }
};


export const getPersonalStats = async (req: any, res: any) => {
  const userId = req.user?.userId || req.user?.id;
  try {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const personalRevenue = await Sale.aggregate([
      { $match: { DanismanID: userId, IslemTarihi: { $gte: startOfMonth } } },
      { $group: { _id: null, AylikCiro: { $sum: '$HizmetBedeliCiro' }, IslemSayisi: { $sum: 1 } } }
    ]);
      
    res.json({ 
      aylikCiro: personalRevenue[0]?.AylikCiro || 0,
      islemSayisi: personalRevenue[0]?.IslemSayisi || 0
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};
