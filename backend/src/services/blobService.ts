import { BlobServiceClient, ContainerClient, BlockBlobClient } from '@azure/storage-blob';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

// ─── Ortam Değişkenleri ───────────────────────────────────────────────────────
const CONNECTION_STRING = process.env.BLOB_STG_CONNECTION_STRING || '';
const ACCOUNT_NAME = process.env.BLOB_STG_ACCOUNT_NAME || '';

if (!CONNECTION_STRING || !ACCOUNT_NAME) {
  console.warn('[BlobService] UYARI: BLOB_STG_CONNECTION_STRING veya BLOB_STG_ACCOUNT_NAME tanımlı değil!');
}

// ─── Blob Service Client ──────────────────────────────────────────────────────
const blobServiceClient = BlobServiceClient.fromConnectionString(CONNECTION_STRING);

// ─── Yardımcı: Container client al (yoksa oluştur) ───────────────────────────
async function getContainerClient(containerName: string): Promise<ContainerClient> {
  const containerClient = blobServiceClient.getContainerClient(containerName);
  await containerClient.createIfNotExists();
  return containerClient;
}

// ─── Yardımcı: Dosya uzantısından content-type belirle ───────────────────────
function getContentType(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  const map: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
  return map[ext] || 'application/octet-stream';
}

// ─── Yardımcı: Benzersiz blob adı üret ───────────────────────────────────────
function generateBlobName(originalName: string, prefix?: string): string {
  const ext = path.extname(originalName);
  const uniqueId = uuidv4();
  return prefix ? `${prefix}/${uniqueId}${ext}` : `${uniqueId}${ext}`;
}

// ─── Ana Fonksiyon: Dosya yükle ───────────────────────────────────────────────
/**
 * Azure Blob Storage'a bir dosya yükler.
 *
 * @param fileBuffer  - Dosyanın Buffer içeriği (multer'dan gelen req.file.buffer)
 * @param originalName - Orijinal dosya adı (uzantıyı belirlemek için)
 * @param containerName - Hedef container adı (ör. "portfoy-fotograflari")
 * @param prefix - Blob adı öneki / klasör yolu (ör. "portfolios/portfoy-id")
 * @returns Yüklenen blob'un public URL'i ve blob adı
 */
export async function uploadFileToBlob(
  fileBuffer: Buffer,
  originalName: string,
  containerName: string,
  prefix?: string
): Promise<{ url: string; blobName: string }> {
  const containerClient = await getContainerClient(containerName);
  const blobName = generateBlobName(originalName, prefix);
  const blockBlobClient: BlockBlobClient = containerClient.getBlockBlobClient(blobName);

  await blockBlobClient.uploadData(fileBuffer, {
    blobHTTPHeaders: {
      blobContentType: getContentType(originalName),
      blobCacheControl: 'public, max-age=31536000',
    },
  });

  // Private storage olduğu için tarayıcının okuyabileceği SAS URL üret (10 yıl geçerli)
  const sasUrl = await generateBlobSASUrl(containerName, blobName);
  return { url: sasUrl, blobName };
}

/**
 * Private olan Blob'lar için okuma yetkili SAS URL üretir.
 */
export async function generateBlobSASUrl(containerName: string, blobName: string): Promise<string> {
  try {
    const { generateBlobSASQueryParameters, BlobSASPermissions, StorageSharedKeyCredential } = await import('@azure/storage-blob');
    
    // Connection string'den AccountKey çıkar
    const matches = CONNECTION_STRING.match(/AccountKey=([^;]+)/);
    const accountKey = matches ? matches[1] : '';

    if (ACCOUNT_NAME && accountKey) {
      const sharedKeyCredential = new StorageSharedKeyCredential(ACCOUNT_NAME, accountKey);
      const expiresOn = new Date();
      expiresOn.setFullYear(expiresOn.getFullYear() + 10); // 10 Yıl geçerli

      const sasOptions = {
        containerName,
        blobName,
        permissions: BlobSASPermissions.parse("r"), // Read yetkisi
        startsOn: new Date(),
        expiresOn,
      };

      const sasToken = generateBlobSASQueryParameters(sasOptions, sharedKeyCredential).toString();
      return `https://${ACCOUNT_NAME}.blob.core.windows.net/${containerName}/${blobName}?${sasToken}`;
    }
  } catch (err) {
    console.error('[BlobService] SAS URL üretme hatası:', err);
  }

  return `https://${ACCOUNT_NAME}.blob.core.windows.net/${containerName}/${blobName}`;
}

// ─── Dosya sil ────────────────────────────────────────────────────────────────
/**
 * Azure Blob Storage'dan bir blob siler.
 *
 * @param containerName - Blob'un bulunduğu container
 * @param blobName      - Silinecek blob'un adı (path dahil, ör. "portfolios/uuid.jpg")
 * @returns Silme başarılı mı?
 */
export async function deleteFileFromBlob(containerName: string, blobName: string): Promise<boolean> {
  try {
    const containerClient = await getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.deleteIfExists({ deleteSnapshots: 'include' });
    return true;
  } catch (err) {
    console.error('[BlobService] Silme hatası:', err);
    return false;
  }
}

// ─── URL'den blob adını çıkar ─────────────────────────────────────────────────
/**
 * Tam blob URL'inden container sonrasındaki blob adını döndürür.
 * Örn: https://blobhomey.blob.core.windows.net/portfoy-fotograflari/portfolios/uuid.jpg
 *   → "portfolios/uuid.jpg"
 */
export function extractBlobNameFromUrl(url: string, containerName: string): string | null {
  try {
    const marker = `/${containerName}/`;
    const idx = url.indexOf(marker);
    if (idx === -1) return null;
    return url.substring(idx + marker.length);
  } catch {
    return null;
  }
}
