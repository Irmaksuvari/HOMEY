"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAgent = exports.requireBroker = exports.authenticateJWT = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'homey_super_secret_jwt_key_2026_change_me_in_production';
// JWT Token Doğrulama Middleware'i
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1]; // "Bearer TOKEN_VALUE"
        jsonwebtoken_1.default.verify(token, JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.status(403).json({ message: 'Geçersiz veya süresi dolmuş token.' });
            }
            req.user = decoded;
            next();
        });
    }
    else {
        res.status(401).json({ message: 'Yetkilendirme başlığı (Authorization header) bulunamadı.' });
    }
};
exports.authenticateJWT = authenticateJWT;
// Rol Kontrolü Middleware'i (Sadece Yetkili/Broker erişimi için)
const requireBroker = (req, res, next) => {
    if (req.user && req.user.rol === 'YETKILI') {
        next();
    }
    else {
        res.status(403).json({ message: 'Bu işlemi gerçekleştirmek için YETKİLİ (Broker) olmalısınız.' });
    }
};
exports.requireBroker = requireBroker;
// Rol Kontrolü Middleware'i (Uzman/Agent erişimi için)
const requireAgent = (req, res, next) => {
    if (req.user && req.user.rol === 'UZMAN') {
        next();
    }
    else {
        res.status(403).json({ message: 'Bu işlemi gerçekleştirmek için Gayrimenkul Uzmanı olmalısınız.' });
    }
};
exports.requireAgent = requireAgent;
