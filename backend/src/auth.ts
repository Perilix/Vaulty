import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const APP_PASSWORD = process.env.APP_PASSWORD || 'vaulty';
const TOKEN_TTL = '7d';

export function login(req: Request, res: Response) {
  const { password } = req.body ?? {};
  if (typeof password !== 'string' || password.length === 0) {
    return res.status(400).json({ error: 'Mot de passe requis.' });
  }
  if (password !== APP_PASSWORD) {
    return res.status(401).json({ error: 'Mot de passe incorrect.' });
  }
  const token = jwt.sign({ sub: 'owner' }, JWT_SECRET, { expiresIn: TOKEN_TTL });
  res.json({ token });
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Non authentifié.' });
  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Session expirée.' });
  }
}
