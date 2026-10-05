import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { queryOne } from './db.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'datapro_gajuwaka_secure_exam_secret_2026';

export interface AuthUser {
  id: number;
  name: string;
  username: string;
  email: string;
  role: string;
  role_id: number;
  status: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      role_id: user.role_id,
      status: user.status
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access token required. Please log in.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    
    // Check if user is still active in database
    const user = queryOne<any>(
      `SELECT u.id, u.name, u.username, u.email, u.status, u.role_id, r.role_name as role
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [decoded.id]
    );

    if (!user || user.status !== 'ACTIVE') {
      res.status(403).json({ error: 'Account deactivated or invalid. Please contact administrator.' });
      return;
    }

    req.user = {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      role_id: user.role_id,
      status: user.status
    };
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired session token.' });
    return;
  }
}

export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (req.user.role === 'SUPER_ADMIN') {
      // Super Admin has universal access
      next();
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ 
        error: `Access denied. Your role (${req.user.role}) is not permitted to perform this action.` 
      });
      return;
    }

    next();
  };
}
