import { Router } from 'express';
import { query } from '../db.js';

export const clientsRouter = Router();

clientsRouter.get('/', async (_req, res) => {
  const rows = await query(
    `SELECT id, name, type, contact, email, phone, address, city, siret, conditions,
            statut, ca, encours, factures, delai
       FROM clients ORDER BY name`,
  );
  res.json(rows);
});

clientsRouter.get('/:id', async (req, res) => {
  const [client] = await query(
    `SELECT id, name, type, contact, email, phone, address, city, siret, conditions,
            statut, ca, encours, factures, delai
       FROM clients WHERE id = $1`,
    [req.params.id],
  );
  if (!client) return res.status(404).json({ error: 'Client introuvable.' });
  const invoices = await query(
    `SELECT id, client_name, issued_on, due_on, statut FROM invoices
      WHERE client_id = $1 ORDER BY issued_on DESC NULLS LAST, id DESC`,
    [req.params.id],
  );
  res.json({ ...client, invoices });
});

clientsRouter.post('/', async (req, res) => {
  const b = req.body ?? {};
  if (!b.name || !b.email) {
    return res.status(400).json({ error: 'Le nom et l’email sont requis.' });
  }
  const id = 'c' + Date.now();
  const [row] = await query(
    `INSERT INTO clients (id, name, type, contact, email, phone, address, city, siret, conditions, statut)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'Bon payeur') RETURNING *`,
    [
      id, b.name, b.type || 'entreprise', b.contact || null, b.email,
      b.phone || null, b.address || null, b.city || null, b.siret || null,
      b.conditions || 'Net 30 jours',
    ],
  );
  res.status(201).json(row);
});
