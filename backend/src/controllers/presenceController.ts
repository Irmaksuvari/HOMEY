import { Response } from 'express';
import { User } from '../models/User';

// POST /api/user/toggle-office-status
// Giriş yapan kullanıcının OfisteMi durumunu tersine çevirir
export const toggleOfficeStatus = async (req: any, res: Response) => {
  const { userId } = req.user;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    }

    const mevcutDurum: boolean = !!user.OfisteMi;
    const yeniDurum = !mevcutDurum;

    user.OfisteMi = yeniDurum;
    await user.save();

    res.json({
      ofisteMi: yeniDurum,
      message: yeniDurum ? 'Ofis durumunuz "Ofisteyim" olarak güncellendi.' : 'Ofis durumunuz "Ofiste Değilim" olarak güncellendi.'
    });

  } catch (error: any) {
    console.error('[HOMEY API] toggleOfficeStatus Error:', error);
    res.status(500).json({ message: 'Durum güncellenirken sunucu hatası oluştu.', error: error.message });
  }
};

// GET /api/user/active-in-office
// Aynı firmadaki OfisteMi = 1 olan kullanıcıları listeler
export const getActiveInOffice = async (req: any, res: Response) => {
  const { firmaId } = req.user;

  try {
    const activeUsers = await User.find({
      FirmaId: firmaId,
      OfisteMi: true,
      AktifMi: true
    }).sort({ Ad: 1 });

    const users = activeUsers.map((u: any) => ({
      id: u._id,
      ad: u.Ad,
      soyad: u.Soyad,
      rol: u.Rol,
      eposta: u.Eposta,
      ofisteMi: !!u.OfisteMi
    }));

    res.json(users);

  } catch (error: any) {
    console.error('[HOMEY API] getActiveInOffice Error:', error);
    res.status(500).json({ message: 'Ofis listesi alınırken sunucu hatası oluştu.', error: error.message });
  }
};

// GET /api/user/my-status
// Giriş yapan kullanıcının güncel ofis durumunu döndürür
export const getMyOfficeStatus = async (req: any, res: Response) => {
  const { userId } = req.user;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    }

    res.json({ ofisteMi: !!user.OfisteMi });

  } catch (error: any) {
    console.error('[HOMEY API] getMyOfficeStatus Error:', error);
    res.status(500).json({ message: 'Durum sorgulanırken sunucu hatası oluştu.', error: error.message });
  }
};
