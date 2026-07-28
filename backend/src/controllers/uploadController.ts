import { Request, Response } from 'express';
import { poolPromise, sql } from '../config/db';
import { uploadFileToBlob, deleteFileFromBlob, extractBlobNameFromUrl } from '../services/blobService';

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
        const pool = await poolPromise;

        // Portföy varlığını ve sahipliğini kontrol et
        const portCheck = await pool.request()
          .input('portfoyId', sql.UniqueIdentifier, portfoyId)
          .input('firmaId', sql.UniqueIdentifier, firmaId)
          .query('SELECT GorevliUzmanId FROM Portfoyler WHERE Id = @portfoyId AND FirmaId = @firmaId');

        if (portCheck.recordset.length === 0) {
          res.status(404).json({ message: 'Portföy bulunamadı veya yetkiniz yok.' });
          return;
        }

        const isOwner = portCheck.recordset[0].GorevliUzmanId === userId;
        const isYetkili = role === 'YETKILI';

        if (!isOwner && !isYetkili) {
          res.status(403).json({ message: 'Bu portföye fotoğraf eklemek için yetkiniz bulunmamaktadır. Sadece kendi portföylerinize fotoğraf ekleyebilirsiniz.' });
          return;
        }

        // 12 Fotoğraf Sınırı Kontrolü
        const countRes = await pool.request()
          .input('portfoyId', sql.UniqueIdentifier, portfoyId)
          .query('SELECT COUNT(*) as photoCount FROM PortfoyFotograflari WHERE PortfoyID = @portfoyId');
        
        const count = countRes.recordset[0]?.photoCount || 0;
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

    // 2. portfoyId geldiyse SQL Database [PortfoyFotograflari] Tablosuna Ekle
    if (portfoyId) {
      try {
        const pool = await poolPromise;

        const countRes = await pool.request()
          .input('portfoyId', sql.UniqueIdentifier, portfoyId)
          .query('SELECT COUNT(*) as photoCount FROM PortfoyFotograflari WHERE PortfoyID = @portfoyId');
        const currentCount = countRes.recordset[0]?.photoCount || 0;
        const setAsCover = isKapak || currentCount === 0;

        const insertResult = await pool.request()
          .input('portfoyId', sql.UniqueIdentifier, portfoyId)
          .input('fotoUrl', sql.NVarChar, url)
          .input('sira', sql.Int, setAsCover ? 1 : currentCount + 1)
          .query(`
            INSERT INTO PortfoyFotograflari (PortfoyID, FotoUrl, Sira)
            OUTPUT INSERTED.Id
            VALUES (@portfoyId, @fotoUrl, @sira)
          `);

        if (insertResult.recordset.length > 0) {
          fotoId = insertResult.recordset[0].Id;
        }
      } catch (dbErr: any) {
        console.error('[UploadController] SQL PortfoyFotograflari ekleme hatası:', dbErr.message);
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

    // 2. SQL Database [PortfoyFotograflari] Tablosundan Sil
    try {
      const pool = await poolPromise;
      if (fotoId) {
        await pool.request()
          .input('fotoId', sql.UniqueIdentifier, fotoId)
          .query('DELETE FROM PortfoyFotograflari WHERE Id = @fotoId');
      } else if (url) {
        await pool.request()
          .input('fotoUrl', sql.NVarChar, url)
          .query('DELETE FROM PortfoyFotograflari WHERE FotoUrl = @fotoUrl');
      }
    } catch (dbErr: any) {
      console.error('[UploadController] SQL PortfoyFotograflari silme hatası:', dbErr.message);
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

    const pool = await poolPromise;
    // Seçilen fotoğrafı Sıra = 1 yap, diğerlerini arttır
    await pool.request()
      .input('portfoyId', sql.UniqueIdentifier, portfoyId)
      .query('UPDATE PortfoyFotograflari SET Sira = ISNULL(Sira, 1) + 1 WHERE PortfoyID = @portfoyId');

    await pool.request()
      .input('fotoId', sql.UniqueIdentifier, fotoId)
      .query('UPDATE PortfoyFotograflari SET Sira = 1 WHERE Id = @fotoId');

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

    const pool = await poolPromise;
    const result = await pool.request()
      .input('portfoyId', sql.UniqueIdentifier, portfoyId)
      .query('SELECT Id, PortfoyID, FotoUrl as FotografUrl, CASE WHEN ISNULL(Sira, 99) = 1 THEN 1 ELSE 0 END as IsKapak FROM PortfoyFotograflari WHERE PortfoyID = @portfoyId ORDER BY ISNULL(Sira, 99) ASC');

    res.json(result.recordset);
  } catch (error: any) {
    console.error('[UploadController] getPortfolioImages hatası:', error);
    res.status(500).json({ message: 'Portföy fotoğrafları çekilirken hata oluştu.', error: error.message });
  }
};

