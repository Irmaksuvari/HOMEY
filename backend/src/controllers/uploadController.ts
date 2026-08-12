import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { uploadFileToBlob, deleteFileFromBlob, extractBlobNameFromUrl } from '../services/blobService';
import { Portfolio } from '../models/Portfolio';
import { PortfolioPhoto } from '../models/PortfolioPhoto';
import { User } from '../models/User';
import { FirmDocument } from '../models/FirmDocument';

// ─── Sabitler ─────────────────────────────────────────────────────────────────
const CONTAINER_NAME = 'portfoy-fotograflari'; // Azure'daki container adı
const MAX_FILE_SIZE_MB = 10;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];

// ─── Portföy Fotoğrafı Yükle & DB'ye Kaydet ─────────────────────────────────
/**
 * POST /api/upload/portfolio-image
 * Body: multipart/form-data  →  field: "image", optional: "portfoyId"
 * Yanıt: { message, url, blobName, fotoId }
 */
export const uploadPortfolioImage = async (req: any, res: Response): Promise<void> => {
  try {
    const file = req.file as Express.Multer.File | undefined;

    if (!file) {
      res.status(400).json({ message: 'Lütfen bir dosya yükleyin (alan adı: "image").' });
      return;
    }

    // MIME türü kontrolü
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      res.status(400).json({
        message: `Desteklenmeyen dosya türü: ${file.mimetype}. İzin verilenler: ${ALLOWED_MIME_TYPES.join(', ')}`
      });
      return;
    }

    // Boyut kontrolü
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      res.status(400).json({ message: `Dosya boyutu ${MAX_FILE_SIZE_MB}MB sınırını aşıyor.` });
      return;
    }

    const portfoyId = req.body?.portfoyId || null;
    const isKapak = req.body?.isKapak === 'true' || req.body?.isKapak === true;
    const { userId, firmaId, role } = req.user;

    // Sahiplik ve Yetki Kontrolü (portfoyId varsa)
    if (portfoyId) {
      try {
        const portCheck = await Portfolio.findOne({ _id: portfoyId, FirmaId: firmaId });

        if (!portCheck) {
          res.status(404).json({ message: 'Portföy bulunamadı veya yetkiniz yok.' });
          return;
        }

        const isOwner = portCheck.GorevliUzmanId === userId;
        const isYetkili = role === 'YETKILI';

        if (!isOwner && !isYetkili) {
          res.status(403).json({ message: 'Bu portföye fotoğraf eklemek için yetkiniz bulunmamaktadır. Sadece kendi portföylerinize fotoğraf ekleyebilirsiniz.' });
          return;
        }

        // 12 Fotoğraf Sınırı Kontrolü
        const count = await PortfolioPhoto.countDocuments({ PortfoyId: portfoyId });
        
        if (count >= 12) {
          res.status(400).json({ message: 'Bir portföye en fazla 12 adet fotoğraf eklenebilir.' });
          return;
        }
      } catch (checkErr: any) {
        console.error('[UploadController] Yetki kontrolü hatası:', checkErr.message);
      }
    }

    const prefix = portfoyId ? `portfolios/${portfoyId}` : 'portfolios/genel';

    // 1. Azure Blob Storage'a Yükle
    const { url, blobName } = await uploadFileToBlob(
      file.buffer,
      file.originalname,
      CONTAINER_NAME,
      prefix
    );

    let fotoId: string | null = null;

    // 2. portfoyId geldiyse MongoDB'ye Ekle
    if (portfoyId) {
      try {
        const currentCount = await PortfolioPhoto.countDocuments({ PortfoyId: portfoyId });
        const setAsCover = isKapak || currentCount === 0;

        const newPhotoId = uuidv4();
        await PortfolioPhoto.create({
          _id: newPhotoId,
          PortfoyId: portfoyId,
          FotoUrl: url,
          Sira: setAsCover ? 1 : currentCount + 1
        });
        fotoId = newPhotoId;
      } catch (dbErr: any) {
        console.error('[UploadController] Mongoose PortfolioPhoto ekleme hatası:', dbErr.message);
      }
    }

    res.status(201).json({
      message: 'Fotoğraf başarıyla yüklendi ve kaydedildi.',
      url,
      blobName,
      fotoId,
      portfoyId,
      container: CONTAINER_NAME,
      size: file.size,
      mimeType: file.mimetype,
    });
  } catch (error: any) {
    console.error('[UploadController] uploadPortfolioImage hatası:', error);
    res.status(500).json({ message: 'Dosya yüklenirken sunucu hatası oluştu.', error: error.message });
  }
};

// ─── Portföy Fotoğrafı Sil (Storage & DB) ──────────────────────────────────
/**
 * DELETE /api/upload/portfolio-image
 * Body: { blobName } veya { url }, optional: { fotoId }
 */
export const deletePortfolioImage = async (req: Request, res: Response): Promise<void> => {
  try {
    let blobName: string | null = req.body?.blobName || null;
    const fotoId: string | null = req.body?.fotoId || null;
    const url: string | null = req.body?.url || null;

    // blobName yoksa URL'den çıkarmayı dene
    if (!blobName && url) {
      blobName = extractBlobNameFromUrl(url, CONTAINER_NAME);
    }

    if (!blobName && !fotoId && !url) {
      res.status(400).json({ message: '"blobName", "fotoId" veya "url" alanlarından en az biri zorunludur.' });
      return;
    }

    // 1. Azure Blob Storage'dan Sil (blobName varsa)
    let storageDeleted = false;
    if (blobName) {
      storageDeleted = await deleteFileFromBlob(CONTAINER_NAME, blobName);
    }

    // 2. MongoDB'den Sil
    try {
      if (fotoId) {
        await PortfolioPhoto.deleteOne({ _id: fotoId });
      } else if (url) {
        await PortfolioPhoto.deleteOne({ FotoUrl: url });
      }
    } catch (dbErr: any) {
      console.error('[UploadController] Mongoose PortfolioPhoto silme hatası:', dbErr.message);
    }

    res.json({
      message: 'Fotoğraf başarıyla silindi.',
      storageDeleted,
      blobName,
      fotoId
    });
  } catch (error: any) {
    console.error('[UploadController] deletePortfolioImage hatası:', error);
    res.status(500).json({ message: 'Silme işlemi sırasında sunucu hatası oluştu.', error: error.message });
  }
};

// ─── Kapak Fotoğrafı Seç ──────────────────────────────────────────────────
/**
 * PUT /api/upload/portfolio-image/set-cover
 * Body: { portfoyId, fotoId }
 */
export const setCoverImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { portfoyId, fotoId } = req.body;
    if (!portfoyId || !fotoId) {
      res.status(400).json({ message: 'portfoyId ve fotoId zorunludur.' });
      return;
    }

    // Seçilen fotoğrafı Sıra = 1 yap, diğerlerini arttır
    await PortfolioPhoto.updateMany(
      { PortfoyId: portfoyId },
      { $inc: { Sira: 1 } }
    );

    await PortfolioPhoto.updateOne(
      { _id: fotoId },
      { $set: { Sira: 1 } }
    );

    res.json({ message: 'Kapak fotoğrafı başarıyla güncellendi.', fotoId });
  } catch (error: any) {
    console.error('[UploadController] setCoverImage hatası:', error);
    res.status(500).json({ message: 'Kapak fotoğrafı ayarlanırken hata oluştu.', error: error.message });
  }
};

// ─── Portföy Fotoğraflarını Listele ──────────────────────────────────────────
/**
 * GET /api/upload/portfolio-images/:portfoyId
 */
export const getPortfolioImages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { portfoyId } = req.params;
    if (!portfoyId) {
      res.status(400).json({ message: 'Portföy ID zorunludur.' });
      return;
    }

    const photos = await PortfolioPhoto.find({ PortfoyId: portfoyId }).sort({ Sira: 1 });
    
    const result = photos.map(p => ({
      Id: p._id,
      PortfoyId: p.PortfoyId,
      FotografUrl: p.FotoUrl,
      IsKapak: (p.Sira === 1) ? 1 : 0
    }));

    res.json(result);
  } catch (error: any) {
    console.error('[UploadController] getPortfolioImages hatası:', error);
    res.status(500).json({ message: 'Portföy fotoğrafları çekilirken hata oluştu.', error: error.message });
  }
};

// ─── Profil Fotoğrafı Yükle ──────────────────────────────────────────────────
export const uploadProfilePicture = async (req: any, res: Response): Promise<void> => {
  console.log('[UploadController] uploadProfilePicture called');
  try {
    const file = req.file as Express.Multer.File | undefined;
    if (!file) {
      console.log('[UploadController] no file found');
      res.status(400).json({ message: 'Lütfen bir dosya yükleyin.' });
      return;
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype) && !file.mimetype.startsWith('video/')) {
      res.status(400).json({ message: `Desteklenmeyen dosya türü: ${file.mimetype}` });
      return;
    }

    const { userId } = req.user;
    console.log('[UploadController] User ID:', userId);

    // Mevcut fotoğrafı al ve Azure'dan sil
    const user = await User.findOne({ _id: userId });
    
    const currentUrl = user?.ProfilFoto;
    if (currentUrl) {
      const oldBlobName = extractBlobNameFromUrl(currentUrl, CONTAINER_NAME);
      if (oldBlobName) {
        await deleteFileFromBlob(CONTAINER_NAME, oldBlobName).catch(e => console.error('Eski profil fotoğrafı silinirken hata:', e));
      }
    }

    // Yeni fotoğrafı yükle
    const prefix = `Kullanicilar/${userId}`;
    const { url } = await uploadFileToBlob(file.buffer, file.originalname, CONTAINER_NAME, prefix);

    // Veritabanını güncelle
    await User.updateOne({ _id: userId }, { $set: { ProfilFoto: url } });

    res.status(201).json({ message: 'Profil fotoğrafı güncellendi.', url });
  } catch (error: any) {
    console.error('[UploadController] uploadProfilePicture hatası:', error);
    res.status(500).json({ message: 'Dosya yüklenirken sunucu hatası oluştu.', error: error.message });
  }
};

// ─── Profil Fotoğrafını Sil ──────────────────────────────────────────────────
export const deleteProfilePicture = async (req: any, res: Response): Promise<void> => {
  try {
    const { userId } = req.user;

    const user = await User.findOne({ _id: userId });

    const currentUrl = user?.ProfilFoto;
    if (!currentUrl) {
      res.status(400).json({ message: 'Silinecek profil fotoğrafı bulunamadı.' });
      return;
    }

    const oldBlobName = extractBlobNameFromUrl(currentUrl, CONTAINER_NAME);
    if (oldBlobName) {
      await deleteFileFromBlob(CONTAINER_NAME, oldBlobName);
    }

    await User.updateOne({ _id: userId }, { $set: { ProfilFoto: null } });

    res.json({ message: 'Profil fotoğrafı başarıyla silindi.' });
  } catch (error: any) {
    console.error('[UploadController] deleteProfilePicture hatası:', error);
    res.status(500).json({ message: 'Dosya silinirken hata oluştu.', error: error.message });
  }
};

// ─── Firma Evrakları ─────────────────────────────────────────────────────────

const ALLOWED_DOC_TYPES = [
  'KiraKontratSablonu', 
  'TahliyeTaahhutnamesiSablonu', 
  'SenetSablonu', 
  'OnSatisSozlesmesiSablonu', 
  'YetkilendirmeSozlesmesiSablonu'
];

export const getFirmDocuments = async (req: any, res: Response): Promise<void> => {
  try {
    const { firmaId } = req.user;

    const result = await FirmDocument.findOne({ FirmaId: firmaId });

    if (!result) {
      res.json({});
      return;
    }
    
    res.json({
      KiraKontratSablonu: result.KiraKontratSablonu,
      TahliyeTaahhutnamesiSablonu: result.TahliyeTaahhutnamesiSablonu,
      SenetSablonu: result.SenetSablonu,
      OnSatisSozlesmesiSablonu: result.OnSatisSozlesmesiSablonu,
      YetkilendirmeSozlesmesiSablonu: result.YetkilendirmeSozlesmesiSablonu
    });
  } catch (error: any) {
    console.error('[UploadController] getFirmDocuments hatası:', error);
    res.status(500).json({ message: 'Evraklar getirilirken sunucu hatası oluştu.', error: error.message });
  }
};

export const uploadFirmDocument = async (req: any, res: Response): Promise<void> => {
  try {
    const { firmaId, rol } = req.user;
    const { docType } = req.params;

    if (rol !== 'YETKILI') {
      res.status(403).json({ message: 'Yetkisiz erişim.' });
      return;
    }

    if (!ALLOWED_DOC_TYPES.includes(docType)) {
      res.status(400).json({ message: 'Geçersiz evrak türü.' });
      return;
    }

    const file = req.file as Express.Multer.File | undefined;
    if (!file) {
      res.status(400).json({ message: 'Lütfen bir dosya yükleyin.' });
      return;
    }

    // Mevcut evrak var mı kontrol et, varsa Azure'dan sil
    const existingDoc = await FirmDocument.findOne({ FirmaId: firmaId });

    const currentUrl = existingDoc ? (existingDoc as any)[docType] : null;
    
    if (currentUrl) {
      const oldBlobName = extractBlobNameFromUrl(currentUrl, CONTAINER_NAME);
      if (oldBlobName) {
        await deleteFileFromBlob(CONTAINER_NAME, oldBlobName).catch(e => console.error('Eski belge silinirken hata:', e));
      }
    }

    // Yeni dosyayı Azure Blob Storage'a yükle (Private url olarak)
    const prefix = `firma-evraklari/${firmaId}/${docType}`;
    const { url } = await uploadFileToBlob(file.buffer, file.originalname, CONTAINER_NAME, prefix);

    // Veritabanını güncelle veya ekle
    if (existingDoc) {
      const updateData: any = { GuncellemeTarihi: new Date() };
      updateData[docType] = url;
      await FirmDocument.updateOne({ FirmaId: firmaId }, { $set: updateData });
    } else {
      const createData: any = {
        _id: uuidv4(),
        FirmaId: firmaId,
        OlusturulmaTarihi: new Date(),
        GuncellemeTarihi: new Date()
      };
      createData[docType] = url;
      await FirmDocument.create(createData);
    }

    res.status(201).json({ message: 'Evrak başarıyla yüklendi.', url });
  } catch (error: any) {
    console.error('[UploadController] uploadFirmDocument hatası:', error);
    res.status(500).json({ message: 'Dosya yüklenirken sunucu hatası oluştu.', error: error.message });
  }
};

export const deleteFirmDocument = async (req: any, res: Response): Promise<void> => {
  try {
    const { firmaId, rol } = req.user;
    const { docType } = req.params;

    if (rol !== 'YETKILI') {
      res.status(403).json({ message: 'Yetkisiz erişim.' });
      return;
    }

    if (!ALLOWED_DOC_TYPES.includes(docType)) {
      res.status(400).json({ message: 'Geçersiz evrak türü.' });
      return;
    }

    const existingDoc = await FirmDocument.findOne({ FirmaId: firmaId });

    const currentUrl = existingDoc ? (existingDoc as any)[docType] : null;
    
    if (!currentUrl) {
      res.status(400).json({ message: 'Silinecek evrak bulunamadı.' });
      return;
    }

    const oldBlobName = extractBlobNameFromUrl(currentUrl, CONTAINER_NAME);
    if (oldBlobName) {
      await deleteFileFromBlob(CONTAINER_NAME, oldBlobName);
    }

    const updateData: any = { GuncellemeTarihi: new Date() };
    updateData[docType] = null;
    
    await FirmDocument.updateOne({ FirmaId: firmaId }, { $set: updateData });

    res.json({ message: 'Evrak başarıyla silindi.' });
  } catch (error: any) {
    console.error('[UploadController] deleteFirmDocument hatası:', error);
    res.status(500).json({ message: 'Evrak silinirken hata oluştu.', error: error.message });
  }
};
