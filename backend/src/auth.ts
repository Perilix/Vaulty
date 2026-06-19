import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { query } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const TOKEN_TTL = '30d';

export interface AuthedRequest extends Request {
  userId?: string;
}

/** Récupère l'id utilisateur déposé par requireAuth */
export function uid(req: Request): string {
  return (req as AuthedRequest).userId!;
}

function tokenFor(userId: string) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

function publicUser(u: any) {
  return { id: u.id, email: u.email, name: u.name };
}

// POST /api/auth/register { email, password, name }
export async function register(req: Request, res: Response) {
  const { email, password, name } = req.body ?? {};
  if (typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Email invalide.' });
  }
  if (typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'Le mot de passe doit faire au moins 6 caractères.' });
  }
  const normalized = email.trim().toLowerCase();
  const [existing] = await query(`SELECT id FROM users WHERE email = $1`, [normalized]);
  if (existing) return res.status(409).json({ error: 'Un compte existe déjà avec cet email.' });

  const hash = await bcrypt.hash(password, 10);
  const id = 'u' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
  const [user] = await query(
    `INSERT INTO users (id, email, password_hash, name) VALUES ($1,$2,$3,$4)
     RETURNING id, email, name`,
    [id, normalized, hash, (name || '').trim() || null],
  );
  res.status(201).json({ token: tokenFor(user.id), user: publicUser(user) });
}

// POST /api/auth/login { email, password }
export async function login(req: Request, res: Response) {
  const { email, password } = req.body ?? {};
  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Email et mot de passe requis.' });
  }
  const [user] = await query(
    `SELECT id, email, name, password_hash FROM users WHERE email = $1`,
    [email.trim().toLowerCase()],
  );
  if (!user) return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
  res.json({ token: tokenFor(user.id), user: publicUser(user) });
}

// GET /api/auth/me  (route protégée) — renvoie l'utilisateur courant
export async function me(req: Request, res: Response) {
  const [user] = await query(`SELECT id, email, name FROM users WHERE id = $1`, [uid(req)]);
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });
  res.json(publicUser(user));
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Non authentifié.' });
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string };
    (req as AuthedRequest).userId = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: 'Session expirée.' });
  }
}
