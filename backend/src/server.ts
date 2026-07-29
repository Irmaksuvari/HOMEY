import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { poolPromise } from './config/db';
import { authenticateJWT, AuthenticatedRequest } from './middleware/auth';
import authRoutes from './routes/authRoutes';
import employeeRoutes from './routes/employeeRoutes';
import portfolioRoutes from './routes/portfolioRoutes';
import clientRoutes from './routes/clientRoutes';
import subscriptionRoutes from './routes/subscriptionRoutes';
import appointmentRoutes from './routes/appointmentRoutes';
import searchRoutes from './routes/searchRoutes';
import presenceRoutes from './routes/presenceRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import firmaSettingsRoutes from './routes/firmaSettingsRoutes';
import uploadRoutes from './routes/uploadRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Server Sağlık Kontrolü (Healthcheck), DB ve Blob Storage Bağlantı Testi
app.get('/api/health', async (req, res) => {
  let dbStatus = 'disconnected';
  let blobStatus = 'disconnected';
  let dbError = null;
  let blobError = null;
  let serverTime = null;

  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      IF COL_LENGTH('Musteriler', 'is_active') IS NULL
      BEGIN
        ALTER TABLE Musteriler ADD is_active BIT NOT NULL DEFAULT 1;
      END

      -- 1. Geçmişte gerçekleşmiş satış/kiralama işlemlerindeki müşterileri pasife al (is_active = 0)
      UPDATE Musteriler
      SET is_active = 0
      WHERE Id IN (
        SELECT AliciMusteriId 
        FROM SatisIslemleri 
        WHERE AliciMusteriId IS NOT NULL
      );

      -- 2. Satılmış veya kiralanmış portföylere ait tüm randevuları sil
      DELETE FROM Randevular
      WHERE PortfoyId IN (
        SELECT Id FROM Portfoyler WHERE Durum IN ('SATILDI', 'KIRALANDI', 'KIRALANDI_SATILDI', 'TAMAMLANDI')
      );

      SELECT GETDATE() as ServerTime
    `);
    dbStatus = 'connected';
    serverTime = result.recordset[0].ServerTime;
  } catch (error: any) {
    dbError = error.message;
  }

  try {
    const { BlobServiceClient } = await import('@azure/storage-blob');
    const connStr = process.env.BLOB_STG_CONNECTION_STRING || '';
    if (connStr) {
      const blobServiceClient = BlobServiceClient.fromConnectionString(connStr);
      const containerClient = blobServiceClient.getContainerClient('portfoy-fotograflari');
      await containerClient.createIfNotExists();
      blobStatus = 'connected';
    } else {
      blobError = 'BLOB_STG_CONNECTION_STRING tanımlı değil.';
    }
  } catch (error: any) {
    blobError = error.message;
  }

  const isHealthy = dbStatus === 'connected' && blobStatus === 'connected';

  res.status(isHealthy ? 200 : 500).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    database: dbStatus,
    blobStorage: blobStatus,
    serverTime,
    errors: { dbError, blobError }
  });
});

// Korumalı Örnek Router (Kimlik Doğrulama Testi İçin)
app.get('/api/profile', authenticateJWT, (req: AuthenticatedRequest, res) => {
  res.json({
    message: 'Korumalı profil verilerine ulaşıldı.',
    user: req.user
  });
});

// API Rotaları Kaydı
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/portfolios', portfolioRoutes);
app.use('/api/portfoyler', portfolioRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/user', presenceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/firma/komisyon-ayarlari', firmaSettingsRoutes);
app.use('/api/upload', uploadRoutes);
// Arayüz Statik Dosyalarını Sunma
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
const altFrontendDistPath = path.join(__dirname, '../frontend/dist');
const activeFrontendPath = fs.existsSync(frontendDistPath) ? frontendDistPath : (fs.existsSync(altFrontendDistPath) ? altFrontendDistPath : frontendDistPath);

app.use(express.static(activeFrontendPath));

app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    const indexPath = path.join(activeFrontendPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(200).send('HOMEY API is running successfully. Frontend build index.html not found.');
    }
  }
});

app.listen(PORT, () => {
  console.log(`[HOMEY API] Server ${PORT} portunda çalışmaya başladı.`);
});

export default app;
