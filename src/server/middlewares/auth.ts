import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../lib/auth';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
    businessId: string | null;
  };
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyToken(token) as any;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function requireSuperAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== 'superadmin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}

export function requireBusinessAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}
