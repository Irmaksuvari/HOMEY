import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { poolPromise } from './config/db';
import { authenticateJWT, AuthenticatedRequest } from './middleware/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Server Sağlık Kontrolü (Healthcheck) ve DB Bağlantı Testi
app.get('/api/health', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT GETDATE() as ServerTime');
    res.json({
      status: 'healthy',
      database: 'connected',
      serverTime: result.recordset[0].ServerTime
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message
    });
  }
});

// Korumalı Örnek Router (Kimlik Doğrulama Testi İçin)
app.get('/api/profile', authenticateJWT, (req: AuthenticatedRequest, res) => {
  res.json({
    message: 'Korumalı profil verilerine ulaşıldı.',
    user: req.user
  });
});

// Arayüz Statik Dosyalarını Sunma
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDistPath));

app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  }
});

app.listen(PORT, () => {
  console.log(`[HOMEY API] Server ${PORT} portunda çalışmaya başladı.`);
});

export default app;
