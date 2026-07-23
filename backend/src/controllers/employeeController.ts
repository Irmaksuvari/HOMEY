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

    // 1. Firmanın paket tipini sorgula
    const firmaResult = await pool.request()
      .input('firmaId', sql.UniqueIdentifier, firmaId)
      .query('SELECT PaketTipi FROM Firmalar WHERE Id = @firmaId');

    if (firmaResult.recordset.length === 0) {
      return res.status(404).json({ message: 'İlişkili firma bulunamadı.' });
    }

    const paketTipi = firmaResult.recordset[0].PaketTipi;

    // 2. Mevcut çalışan (UZMAN) sayısını sorgula
    const countResult = await pool.request()
      .input('firmaId', sql.UniqueIdentifier, firmaId)
      .query("SELECT COUNT(*) as UserCount FROM Kullanicilar WHERE FirmaId = @firmaId AND Rol = 'UZMAN'");

    const currentUserCount = countResult.recordset[0].UserCount;

    // 3. Paket tipine göre limit kontrolü (BASIC ve DENEME planları için maksimum 4 çalışan)
    if ((paketTipi === 'BASIC' || paketTipi === 'DENEME') && currentUserCount >= 4) {
      return res.status(400).json({ 
        message: `Paket limitinize ulaştınız. ${paketTipi} planda en fazla 4 gayrimenkul uzmanı (danışman) ekleyebilirsiniz. Lütfen PREMIUM pakete yükseltin.` 
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

    // Şifre hash'i hariç tüm çalışan listesini çekme
    const result = await pool.request()
      .input('firmaId', sql.UniqueIdentifier, firmaId)
      .query(`
        SELECT Id, Ad, Soyad, Eposta, Telefon, Rol, IlkGirisMi, AktifMi, KayitTarihi,
               (SELECT COUNT(*) FROM Portfoyler WHERE GorevliUzmanId = Kullanicilar.Id) as SozlesmeSayisi
        FROM Kullanicilar
        WHERE FirmaId = @firmaId
        ORDER BY KayitTarihi ASC
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
      getirdigiPara: 0, // Analitiklerden toplanacak
      durum: emp.AktifMi ? 'Ofiste' : 'Pasif'
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
