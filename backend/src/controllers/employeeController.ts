import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { sendEmail } from '../services/emailService';
import { User } from '../models/User';
import { Firm } from '../models/Firm';
import { SubscriptionPackage } from '../models/SubscriptionPackage';
import { Portfolio } from '../models/Portfolio';

// Çalışan/Danışman Ekleme (POST /api/employees/add) - Sadece Broker (YETKILI)
export const addEmployee = async (req: any, res: Response) => {
  const { ad, soyad, eposta, telefon } = req.body;
  const { firmaId } = req.user; 

  if (!ad || !soyad || !eposta) {
    return res.status(400).json({ message: 'Ad, soyad ve e-posta zorunludur.' });
  }

  try {
    const firma = await Firm.findById(firmaId);
    if (!firma) {
      return res.status(404).json({ message: 'İlişkili firma bulunamadı.' });
    }

    const mapPaket = { 'DENEME': 'Deneme', 'BASIC': 'Basic', 'PREMIUM': 'Premium' } as any;
    const pAdi = mapPaket[firma.PaketTipi] || firma.PaketTipi;
    
    const paket = await SubscriptionPackage.findOne({ PaketAdi: pAdi });
    const calisanKotasi = paket ? paket.CalisanKotasi : null;
    
    const effectiveLimit = calisanKotasi !== undefined && calisanKotasi !== null ? calisanKotasi : (firma.PaketTipi === 'PREMIUM' ? null : 4);

    const currentUserCount = await User.countDocuments({ FirmaId: firmaId, $or: [{ SilindiMi: false }, { SilindiMi: { $exists: false } }] });

    if (effectiveLimit !== null && currentUserCount >= effectiveLimit) {
      return res.status(400).json({ 
        message: `Paket limitinize ulaştınız. ${firma.PaketTipi} planda toplam en fazla ${effectiveLimit} kullanıcı (yetkili dahil) barındırabilirsiniz. Lütfen PREMIUM pakete yükseltin.` 
      });
    }

    const checkEmail = await User.findOne({ Eposta: eposta });
    if (checkEmail) {
      return res.status(400).json({ message: 'Bu e-posta adresi ile kayıtlı başka bir kullanıcı mevcut.' });
    }

    const geciciSifre = 'Homey123!';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(geciciSifre, salt);

    const newId = uuidv4();
    await User.create({
      _id: newId,
      FirmaId: firmaId,
      Ad: ad,
      Soyad: soyad,
      Eposta: eposta,
      SifreHash: passwordHash,
      Telefon: telefon || null,
      Rol: 'UZMAN',
      IlkGirisMi: true,
      AktifMi: true,
      OfisteMi: true,
      KayitTarihi: new Date(),
      SilindiMi: false
    });

    const emailResult = await sendEmail(
      eposta,
      'Homey CRM - Hesabınız Oluşturuldu',
      `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #4F46E5;">Homey CRM'e Hoş Geldiniz!</h2>
          <p>Sayın <strong>${ad} ${soyad}</strong>, firmanız tarafından adınıza bir hesabınız oluşturulmuştur.</p>
          <p>Geçici giriş şifreniz: <strong style="font-size: 18px; color: #E11D48;">${geciciSifre}</strong></p>
          <p>Sisteme ilk girişinizde güvenlik amacıyla şifrenizi değiştirmeniz istenecektir.</p>
          <br/>
          <p>İyi çalışmalar dileriz.</p>
        </div>
      `
    );

    let msg = 'Gayrimenkul uzmanı başarıyla eklendi ve şifresi mail olarak gönderildi.';
    if (!emailResult.success) {
      msg = 'Gayrimenkul uzmanı eklendi ancak şifre maili GÖNDERİLEMEDİ! Lütfen mail adresini ve gönderim ayarlarını kontrol edin.';
    }

    res.status(201).json({
      message: msg,
      employee: { ad, soyad, eposta, rol: 'UZMAN', durum: 'Ofiste' }
    });

  } catch (error: any) {
    console.error('[HOMEY API] addEmployee Error:', error);
    res.status(500).json({ message: 'Çalışan eklenirken bir sunucu hatası oluştu.', error: error.message });
  }
};

// Çalışanları Listeleme (GET /api/employees/list) - Korumalı
export const listEmployees = async (req: any, res: Response) => {
  const { firmaId } = req.user;

  try {
    const users = await User.find({ FirmaId: firmaId, $or: [{ SilindiMi: false }, { SilindiMi: { $exists: false } }] }).sort({ KayitTarihi: 1 });

    const userIds = users.map(u => u._id);
    
    // Aggregate portfolios for stats
    const stats = await Portfolio.aggregate([
      { $match: { GorevliUzmanId: { $in: userIds } } },
      { $group: {
          _id: '$GorevliUzmanId',
          SozlesmeSayisi: { $sum: 1 },
          KazanilanCiro: {
            $sum: {
              $cond: [
                { $in: ['$Durum', ['KIRALANDI_SATILDI', 'KAPORA_ASAMASINDA']] },
                { $cond: [ { $eq: ['$Tur', 'SATILIK'] }, { $multiply: ['$Fiyat', 0.02] }, '$Fiyat' ] },
                0
              ]
            }
          }
      }}
    ]);

    const statsMap = stats.reduce((acc: any, curr: any) => {
      acc[curr._id] = curr;
      return acc;
    }, {});

    const list = users.map((emp: any) => {
      const st = statsMap[emp._id] || { SozlesmeSayisi: 0, KazanilanCiro: 0 };
      return {
        id: emp._id,
        ad: emp.Ad || '',
        soyad: emp.Soyad || '',
        eposta: emp.Eposta || '',
        telefon: emp.Telefon || '',
        rol: emp.Rol || 'UZMAN',
        ilkGirisMi: emp.IlkGirisMi,
        profilFoto: emp.ProfilFoto || null,
        sozlesmeSayisi: st.SozlesmeSayisi,
        getirdigiPara: Number(st.KazanilanCiro),
        durum: !emp.AktifMi ? 'Pasif' : (emp.OfisteMi ? 'Ofiste' : 'Sahada'),
        ofisteMi: !!emp.OfisteMi
      };
    });

    res.json(list);

  } catch (error: any) {
    console.error('[HOMEY API] listEmployees Error:', error);
    res.status(500).json({ message: 'Çalışan listesi çekilirken sunucu hatası oluştu.', error: error.message });
  }
};

// Çalışan Şifresini Sıfırlama (POST /api/employees/reset-password) - Sadece Broker (YETKILI)
export const resetEmployeePassword = async (req: any, res: Response) => {
  const { employeeId } = req.body;
  const { firmaId } = req.user;

  if (!employeeId) {
    return res.status(400).json({ message: 'Çalışan ID belirtilmelidir.' });
  }

  try {
    const employee = await User.findOne({ _id: employeeId, FirmaId: firmaId });
    
    if (!employee) {
      return res.status(404).json({ message: 'Belirtilen çalışan firmanızda bulunamadı.' });
    }

    const geciciSifre = 'Homey123!';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(geciciSifre, salt);

    employee.SifreHash = passwordHash;
    employee.IlkGirisMi = true;
    await employee.save();

    res.json({ message: 'Çalışan şifresi başarıyla "Homey123!" olarak sıfırlandı.' });

  } catch (error: any) {
    console.error('[HOMEY API] resetEmployeePassword Error:', error);
    res.status(500).json({ message: 'Şifre sıfırlanırken sunucu hatası oluştu.', error: error.message });
  }
};

// Çalışan Silme ve Portföy Aktarımı (DELETE /api/employees/:id)
export const deleteEmployee = async (req: any, res: Response) => {
  const { id } = req.params;
  const { reassignedUserId } = req.body;
  const { firmaId } = req.user;

  if (!reassignedUserId) {
    return res.status(400).json({ message: 'Lütfen aktif portföylerin aktarılacağı kişiyi seçin.' });
  }

  if (id === reassignedUserId) {
    return res.status(400).json({ message: 'Portföyler aynı kullanıcıya aktarılamaz.' });
  }

  try {
    const targetCheck = await User.findOne({ 
      _id: reassignedUserId, 
      FirmaId: firmaId, 
      $or: [{ SilindiMi: false }, { SilindiMi: { $exists: false } }] 
    });
    
    if (!targetCheck) {
      return res.status(404).json({ message: 'Hedef kullanıcı bulunamadı veya silinmiş.' });
    }

    // 1. Reassign Portfolios
    await Portfolio.updateMany(
      { GorevliUzmanId: id, FirmaId: firmaId, Durum: { $nin: ['KIRALANDI_SATILDI', 'TAMAMLANDI'] } },
      { $set: { GorevliUzmanId: reassignedUserId } }
    );

    // 2. Delete / Anonymize User
    const e = await User.findOne({ _id: id, FirmaId: firmaId });
    if (e) {
      e.SilindiMi = true;
      e.AktifMi = false;
      e.Eposta = `deleted_${uuidv4()}_${e.Eposta}`;
      e.SifreHash = '';
      await e.save();
    }

    res.json({ message: 'Çalışan başarıyla silindi ve aktif portföyleri devredildi.' });

  } catch (error: any) {
    console.error('[HOMEY API] deleteEmployee Error:', error);
    res.status(500).json({ message: 'Çalışan silinirken sunucu hatası oluştu.', error: error.message });
  }
};
