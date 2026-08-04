import { Router } from 'express';
import multer from 'multer';
import { authenticateJWT } from '../middleware/auth';
import { uploadPortfolioImage, deletePortfolioImage, getPortfolioImages, setCoverImage, uploadProfilePicture, deleteProfilePicture, getFirmDocuments, uploadFirmDocument, deleteFirmDocument } from '../controllers/uploadController';

const router = Router();

// ─── Multer: Bellek modu (dosyayı diske yazmaz, Buffer olarak tutar) ──────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 
      'video/mp4', 'video/webm', 'video/quicktime',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // Word
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // Excel
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Desteklenmeyen dosya türü: ${file.mimetype}`));
    }
  },
});

// ─── Rotalar ──────────────────────────────────────────────────────────────────

// GET /api/upload/portfolio-images/:portfoyId
// Bir portföye ait fotoğrafları SQL DB'den getirir
router.get(
  '/portfolio-images/:portfoyId',
  authenticateJWT,
  getPortfolioImages
);

// POST /api/upload/portfolio-image
// Form-data: field="image", optional: portfoyId, isKapak
router.post(
  '/portfolio-image',
  authenticateJWT,
  upload.single('image'),
  uploadPortfolioImage
);

// PUT /api/upload/portfolio-image/set-cover
// Body: { portfoyId, fotoId }
router.put(
  '/portfolio-image/set-cover',
  authenticateJWT,
  setCoverImage
);

// DELETE /api/upload/portfolio-image
// Body: { blobName } veya { url }, optional: { fotoId }
router.delete(
  '/portfolio-image',
  authenticateJWT,
  deletePortfolioImage
);

// ─── Profil Fotoğrafı Rotaları ────────────────────────────────────────────────

// POST /api/upload/profile-picture
// Form-data: field="image"
router.post(
  '/profile-picture',
  authenticateJWT,
  upload.single('image'),
  uploadProfilePicture
);

// DELETE /api/upload/profile-picture
router.delete(
  '/profile-picture',
  authenticateJWT,
  deleteProfilePicture
);

// ─── Firma Evrakları Rotaları ──────────────────────────────────────────────────

// GET /api/upload/firm-documents
router.get(
  '/firm-documents',
  authenticateJWT,
  getFirmDocuments
);

// POST /api/upload/firm-document/:docType
router.post(
  '/firm-document/:docType',
  authenticateJWT,
  upload.single('document'),
  uploadFirmDocument
);

// DELETE /api/upload/firm-document/:docType
router.delete(
  '/firm-document/:docType',
  authenticateJWT,
  deleteFirmDocument
);

export default router;
