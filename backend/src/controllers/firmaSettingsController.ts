import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { FirmCommissionSetting } from '../models/FirmCommissionSetting';

export const getFirmaSettings = async (req: any, res: Response) => {
  try {
    const { firmaId } = req.user;
    if (!firmaId) {
      return res.status(401).json({ message: 'Yetkilendirme hatası (FirmaId bulunamadı).' });
    }

    const result = await FirmCommissionSetting.findOne({ FirmaId: firmaId });

    if (!result) {
      // Eğer henüz kayıt yoksa varsayılan değerler dönebiliriz.
      return res.status(200).json({
        YetkilendirmeSarti: false,
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

    return res.status(200).json(result);
  } catch (err: any) {
    console.error('Error in getFirmaSettings:', err);
    return res.status(500).json({ message: 'Ayarlar getirilirken sunucu hatası oluştu.' });
  }
};

export const upsertFirmaSettings = async (req: any, res: Response) => {
  try {
    console.log("upsertFirmaSettings body:", req.body);
    const { firmaId, rol } = req.user;
    
    if (rol !== 'YETKILI') {
      return res.status(403).json({ message: 'Bu ayarları sadece firma yetkilisi değiştirebilir.' });
    }

    const {
      YetkilendirmeSarti,
      KiralamaKomisyonOrani, KiralamaKdv, KiralamaDepozitoSiniri, KiralamaPesinKira, KiralamaKaporaTipi,
      SatisAliciKomisyon, SatisSaticiKomisyon, TapuHarciAlici, TapuHarciSatici, DonerSermayeBedeli, SatisKaporaOrani,
      DisOfisPortfoyPayi, DisOfisMusteriPayi,
      IciPortfoyPayi, IciMusteriPayi, BrokerDanismanPayi, BrokerOfisPayi, KademeliDanismanPayi, KademeliOfisPayi, MasaUcretiTutar, MasaDanismanPayi
    } = req.body;

    const existingSetting = await FirmCommissionSetting.findOne({ FirmaId: firmaId });
      
    if (existingSetting) {
      // UPDATE
      await FirmCommissionSetting.updateOne(
        { FirmaId: firmaId },
        {
          $set: {
            YetkilendirmeSarti: YetkilendirmeSarti === true || YetkilendirmeSarti === 'true',
            KiralamaKomisyonOrani: KiralamaKomisyonOrani ?? 1.00,
            KiralamaKdv: KiralamaKdv ?? 20.00,
            KiralamaDepozitoSiniri: KiralamaDepozitoSiniri ?? 3,
            KiralamaPesinKira: KiralamaPesinKira ?? 1,
            KiralamaKaporaTipi: KiralamaKaporaTipi ?? 'ESNEK',
            SatisAliciKomisyon: SatisAliciKomisyon ?? 2.00,
            SatisSaticiKomisyon: SatisSaticiKomisyon ?? 2.00,
            TapuHarciAlici: TapuHarciAlici ?? 2.00,
            TapuHarciSatici: TapuHarciSatici ?? 2.00,
            DonerSermayeBedeli: DonerSermayeBedeli ?? 0.00,
            SatisKaporaOrani: SatisKaporaOrani ?? 5.00,
            DisOfisPortfoyPayi: DisOfisPortfoyPayi ?? 50.00,
            DisOfisMusteriPayi: DisOfisMusteriPayi ?? 50.00,
            IciPortfoyPayi: IciPortfoyPayi ?? 50.00,
            IciMusteriPayi: IciMusteriPayi ?? 50.00,
            BrokerDanismanPayi: BrokerDanismanPayi ?? 50.00,
            BrokerOfisPayi: BrokerOfisPayi ?? 50.00,
            KademeliDanismanPayi: KademeliDanismanPayi ?? 60.00,
            KademeliOfisPayi: KademeliOfisPayi ?? 40.00,
            MasaUcretiTutar: MasaUcretiTutar ?? 0.00,
            MasaDanismanPayi: MasaDanismanPayi ?? 70.00,
            GuncellemeTarihi: new Date()
          }
        }
      );
    } else {
      // INSERT
      await FirmCommissionSetting.create({
        _id: uuidv4(),
        FirmaId: firmaId,
        YetkilendirmeSarti: YetkilendirmeSarti === true || YetkilendirmeSarti === 'true',
        KiralamaKomisyonOrani: KiralamaKomisyonOrani ?? 1.00,
        KiralamaKdv: KiralamaKdv ?? 20.00,
        KiralamaDepozitoSiniri: KiralamaDepozitoSiniri ?? 3,
        KiralamaPesinKira: KiralamaPesinKira ?? 1,
        KiralamaKaporaTipi: KiralamaKaporaTipi ?? 'ESNEK',
        SatisAliciKomisyon: SatisAliciKomisyon ?? 2.00,
        SatisSaticiKomisyon: SatisSaticiKomisyon ?? 2.00,
        TapuHarciAlici: TapuHarciAlici ?? 2.00,
        TapuHarciSatici: TapuHarciSatici ?? 2.00,
        DonerSermayeBedeli: DonerSermayeBedeli ?? 0.00,
        SatisKaporaOrani: SatisKaporaOrani ?? 5.00,
        DisOfisPortfoyPayi: DisOfisPortfoyPayi ?? 50.00,
        DisOfisMusteriPayi: DisOfisMusteriPayi ?? 50.00,
        IciPortfoyPayi: IciPortfoyPayi ?? 50.00,
        IciMusteriPayi: IciMusteriPayi ?? 50.00,
        BrokerDanismanPayi: BrokerDanismanPayi ?? 50.00,
        BrokerOfisPayi: BrokerOfisPayi ?? 50.00,
        KademeliDanismanPayi: KademeliDanismanPayi ?? 60.00,
        KademeliOfisPayi: KademeliOfisPayi ?? 40.00,
        MasaUcretiTutar: MasaUcretiTutar ?? 0.00,
        MasaDanismanPayi: MasaDanismanPayi ?? 70.00,
        GuncellemeTarihi: new Date()
      });
    }

    return res.status(200).json({ message: 'Ayarlar başarıyla kaydedildi.' });

  } catch (err: any) {
    console.error('Error in upsertFirmaSettings:', err);
    return res.status(500).json({ message: 'Ayarlar kaydedilirken sunucu hatası oluştu.' });
  }
};
