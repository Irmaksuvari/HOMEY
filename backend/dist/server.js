"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("./config/db");
const auth_1 = require("./middleware/auth");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Server Sağlık Kontrolü (Healthcheck) ve DB Bağlantı Testi
app.get('/api/health', async (req, res) => {
    try {
        const pool = await db_1.poolPromise;
        const result = await pool.request().query('SELECT GETDATE() as ServerTime');
        res.json({
            status: 'healthy',
            database: 'connected',
            serverTime: result.recordset[0].ServerTime
        });
    }
    catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            database: 'disconnected',
            error: error.message
        });
    }
});
// Korumalı Örnek Router (Kimlik Doğrulama Testi İçin)
app.get('/api/profile', auth_1.authenticateJWT, (req, res) => {
    res.json({
        message: 'Korumalı profil verilerine ulaşıldı.',
        user: req.user
    });
});
app.listen(PORT, () => {
    console.log(`[HOMEY API] Server ${PORT} portunda çalışmaya başladı.`);
});
exports.default = app;
