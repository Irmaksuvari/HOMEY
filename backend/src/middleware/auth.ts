import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'homey_super_secret_jwt_key_2026_change_me_in_production';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    firmaId: string;
    rol: 'YETKILI' | 'UZMAN';
    eposta: string;
  };
}

// JWT Token Doğrulama Middleware'i
export const authenticateJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1]; // "Bearer TOKEN_VALUE"

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: 'Geçersiz veya süresi dolmuş token.' });
      }

      req.user = decoded as AuthenticatedRequest['user'];
      next();
    });
  } else {
    res.status(401).json({ message: 'Yetkilendirme başlığı (Authorization header) bulunamadı.' });
  }
};

// Rol Kontrolü Middleware'i (Sadece Yetkili/Broker erişimi için)
export const requireBroker = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (req.user && req.user.rol === 'YETKILI') {
    next();
  } else {
    res.status(403).json({ message: 'Bu işlemi gerçekleştirmek için YETKİLİ (Broker) olmalısınız.' });
  }
};

// Rol Kontrolü Middleware'i (Uzman/Agent erişimi için)
export const requireAgent = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (req.user && req.user.rol === 'UZMAN') {
    next();
  } else {
    res.status(403).json({ message: 'Bu işlemi gerçekleştirmek için Gayrimenkul Uzmanı olmalısınız.' });
  }
};
