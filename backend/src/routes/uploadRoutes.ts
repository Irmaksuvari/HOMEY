import { Router } from 'express';
import multer from 'multer';
import { authenticateJWT } from '../middleware/auth';
import { uploadPortfolioImage, deletePortfolioImage, getPortfolioImages, setCoverImage } from '../controllers/uploadController';

const router = Router();

// ─── Multer: Bellek modu (dosyayı diske yazmaz, Buffer olarak tutar) ──────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
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

export default router;
