import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { poolPromise, sql } from '../config/db';

// Çalışan/Danışman Ekleme (POST /api/employees/add) - Sadece Broker (YETKILI)
export const addEmployee = async (req: any, res: Response) => {
  const { ad, soyad, eposta, telefon } = req.body;
  const { firmaId } = req.user; // Token'dan alınan FirmaId

  if (!ad || !soyad || !eposta) {
    return res.status(400).json({ message: 'Ad, soyad ve e-posta zorunludur.' });
  }

  try {
    const pool = await poolPromise;

    // 1. Firmanın paket tipini ve AbonelikPaketleri kotasını sorgula
    const firmaResult = await pool.request()
      .input('firmaId', sql.UniqueIdentifier, firmaId)
      .query(`
        SELECT f.PaketTipi, p.CalisanKotasi 
        FROM Firmalar f
        LEFT JOIN AbonelikPaketleri p ON (
          (f.PaketTipi = 'DENEME' AND p.PaketAdi = 'Deneme') OR
          (f.PaketTipi = 'BASIC' AND p.PaketAdi = 'Basic') OR
          (f.PaketTipi = 'PREMIUM' AND p.PaketAdi = 'Premium')
        )
        WHERE f.Id = @firmaId
      `);

    if (firmaResult.recordset.length === 0) {
      return res.status(404).json({ message: 'İlişkili firma bulunamadı.' });
    }

    const { PaketTipi: paketTipi, CalisanKotasi: calisanKotasi } = firmaResult.recordset[0];
    const effectiveLimit = calisanKotasi !== undefined && calisanKotasi !== null ? calisanKotasi : (paketTipi === 'PREMIUM' ? null : 4);

    // 2. Mevcut çalışan (UZMAN) sayısını sorgula
    const countResult = await pool.request()
      .input('firmaId', sql.UniqueIdentifier, firmaId)
      .query("SELECT COUNT(*) as UserCount FROM Kullanicilar WHERE FirmaId = @firmaId AND Rol = 'UZMAN'");

    const currentUserCount = countResult.recordset[0].UserCount;

    // 3. Paket kota kontrolü (Sınırlı kota tanımlı ise ve limit aşıldıysa engelle)
    if (effectiveLimit !== null && currentUserCount >= effectiveLimit) {
      return res.status(400).json({ 
        message: `Paket limitinize ulaştınız. ${paketTipi} planda en fazla ${effectiveLimit} gayrimenkul uzmanı (danışman) ekleyebilirsiniz. Lütfen PREMIUM pakete yükseltin.` 
      });
    }

    // 4. Mükerrer E-posta kontrolü
    const checkEmail = await pool.request()
      .input('eposta', sql.NVarChar, eposta)
      .query('SELECT Id FROM Kullanicilar WHERE Eposta = @eposta');

    if (checkEmail.recordset.length > 0) {
      return res.status(400).json({ message: 'Bu e-posta adresi ile kayıtlı başka bir kullanıcı mevcut.' });
    }

    // 5. Varsayılan geçici şifre oluşturma ('Homey123!') ve hashleme
    const geciciSifre = 'Homey123!';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(geciciSifre, salt);

    // 6. Danışman kullanıcısını kaydet (Rol: UZMAN, IlkGirisMi: 1, AktifMi: 1)
    await pool.request()
      .input('firmaId', sql.UniqueIdentifier, firmaId)
      .input('ad', sql.NVarChar, ad)
      .input('soyad', sql.NVarChar, soyad)
      .input('eposta', sql.NVarChar, eposta)
      .input('sifreHash', sql.NVarChar, passwordHash)
      .input('telefon', sql.NVarChar, telefon || null)
      .query(`
        INSERT INTO Kullanicilar (FirmaId, Ad, Soyad, Eposta, SifreHash, Telefon, Rol, IlkGirisMi, AktifMi)
        VALUES (@firmaId, @ad, @soyad, @eposta, @sifreHash, @telefon, 'UZMAN', 1, 1)
      `);

    res.status(201).json({
      message: 'Gayrimenkul uzmanı başarıyla eklendi. Geçici giriş şifresi: Homey123!',
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
    const pool = await poolPromise;

    // Şifre hash'i hariç tüm çalışan listesini çekme ve ciro tutarlarını hesaplama
    const result = await pool.request()
      .input('firmaId', sql.UniqueIdentifier, firmaId)
      .query(`
        SELECT k.Id, k.Ad, k.Soyad, k.Eposta, k.Telefon, k.Rol, k.IlkGirisMi, k.AktifMi, ISNULL(k.OfisteMi, 0) as OfisteMi, k.KayitTarihi,
               (SELECT COUNT(*) FROM Portfoyler WHERE GorevliUzmanId = k.Id) as SozlesmeSayisi,
               (SELECT ISNULL(SUM(CASE WHEN Tur = 'SATILIK' THEN Fiyat * 0.02 ELSE Fiyat END), 0) 
                FROM Portfoyler 
                WHERE GorevliUzmanId = k.Id AND (Durum = 'KIRALANDI_SATILDI' OR Durum = 'KAPORA_ASAMASINDA')) as KazanilanCiro
        FROM Kullanicilar k
        WHERE k.FirmaId = @firmaId
        ORDER BY k.KayitTarihi ASC
      `);

    // Front-end'e uygun formatta verileri döndürme
    const list = result.recordset.map(emp => ({
      id: emp.Id,
      ad: emp.Ad || '',
      soyad: emp.Soyad || '',
      eposta: emp.Eposta || '',
      telefon: emp.Telefon || '',
      rol: emp.Rol || 'UZMAN',
      ilkGirisMi: emp.IlkGirisMi,
      sozlesmeSayisi: emp.SozlesmeSayisi || 0,
      getirdigiPara: Number(emp.KazanilanCiro || 0),
      durum: !emp.AktifMi ? 'Pasif' : (emp.OfisteMi ? 'Ofiste' : 'Sahada'),
      ofisteMi: !!emp.OfisteMi
    }));

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
    const pool = await poolPromise;

    // Çalışanın aynı firmaya ait olup olmadığını kontrol et
    const checkEmployee = await pool.request()
      .input('id', sql.UniqueIdentifier, employeeId)
      .input('firmaId', sql.UniqueIdentifier, firmaId)
      .query('SELECT Id FROM Kullanicilar WHERE Id = @id AND FirmaId = @firmaId');

    if (checkEmployee.recordset.length === 0) {
      return res.status(404).json({ message: 'Belirtilen çalışan firmanızda bulunamadı.' });
    }

    // Şifreyi varsayılan geçici şifreye ('Homey123!') sıfırla ve IlkGirisMi = 1 yap
    const geciciSifre = 'Homey123!';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(geciciSifre, salt);

    await pool.request()
      .input('id', sql.UniqueIdentifier, employeeId)
      .input('sifreHash', sql.NVarChar, passwordHash)
      .query(`
        UPDATE Kullanicilar
        SET SifreHash = @sifreHash, IlkGirisMi = 1
        WHERE Id = @id
      `);

    res.json({ message: 'Çalışan şifresi başarıyla "Homey123!" olarak sıfırlandı.' });

  } catch (error: any) {
    console.error('[HOMEY API] resetEmployeePassword Error:', error);
    res.status(500).json({ message: 'Şifre sıfırlanırken sunucu hatası oluştu.', error: error.message });
  }
};
