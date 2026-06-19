import { Router } from 'express';
import { query } from '../db.js';
import { uid } from '../auth.js';

export const clientsRouter = Router();

// Agrégats calculés depuis les factures (CA encaissé, encours, nb de factures, nb payées)
const CLIENT_SELECT = `
  WITH inv AS (
    SELECT i.id, i.client_id, i.statut,
           COALESCE(SUM(l.qty * l.unit_price), 0) * (1 + i.tva_rate / 100.0) AS ttc
      FROM invoices i LEFT JOIN invoice_lines l ON l.invoice_id = i.id
     WHERE i.user_id = $1
     GROUP BY i.id
  )
  SELECT c.id, c.name, c.type, c.contact, c.email, c.phone, c.address, c.city, c.siret,
         c.conditions, c.statut,
         COALESCE(SUM(inv.ttc) FILTER (WHERE inv.statut = 'paid'), 0)                      AS ca,
         COALESCE(SUM(inv.ttc) FILTER (WHERE inv.statut IN ('pending','overdue')), 0)      AS encours,
         COUNT(inv.id)                                                                     AS factures,
         COUNT(inv.id) FILTER (WHERE inv.statut = 'paid')                                  AS payees
    FROM clients c
    LEFT JOIN inv ON inv.client_id = c.id
`;

clientsRouter.get('/', async (req, res) => {
  const rows = await query(
    `${CLIENT_SELECT} WHERE c.user_id = $1 GROUP BY c.id ORDER BY c.name`,
    [uid(req)],
  );
  res.json(rows);
});

clientsRouter.get('/:id', async (req, res) => {
  const [client] = await query(
    `${CLIENT_SELECT} WHERE c.user_id = $1 AND c.id = $2 GROUP BY c.id`,
    [uid(req), req.params.id],
  );
  if (!client) return res.status(404).json({ error: 'Client introuvable.' });
  const invRows = await query(
    `SELECT i.id, i.client_name, i.issued_on, i.due_on, i.statut, i.tva_rate,
            COALESCE(SUM(l.qty * l.unit_price), 0) AS ht
       FROM invoices i LEFT JOIN invoice_lines l ON l.invoice_id = i.id
      WHERE i.client_id = $1 AND i.user_id = $2
      GROUP BY i.id
      ORDER BY i.issued_on DESC NULLS LAST, i.id DESC`,
    [req.params.id, uid(req)],
  );
  const invoices = invRows.map((r: any) => {
    const ht = Number(r.ht);
    const ttc = ht * (1 + Number(r.tva_rate) / 100);
    return { ...r, ht, ttc };
  });
  res.json({ ...client, invoices });
});

clientsRouter.post('/', async (req, res) => {
  const b = req.body ?? {};
  if (!b.name || !b.email) {
    return res.status(400).json({ error: 'Le nom et l’email sont requis.' });
  }
  const id = 'c' + Date.now();
  const [row] = await query(
    `INSERT INTO clients (id, user_id, name, type, contact, email, phone, address, city, siret, conditions, statut)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'Bon payeur') RETURNING *`,
    [
      id, uid(req), b.name, b.type || 'entreprise', b.contact || null, b.email,
      b.phone || null, b.address || null, b.city || null, b.siret || null,
      b.conditions || 'Net 30 jours',
    ],
  );
  res.status(201).json(row);
});

clientsRouter.put('/:id', async (req, res) => {
  const b = req.body ?? {};
  if (!b.name || !b.email) {
    return res.status(400).json({ error: 'Le nom et l’email sont requis.' });
  }
  const rows = await query(
    `UPDATE clients SET name=$1, type=$2, contact=$3, email=$4, phone=$5,
            address=$6, city=$7, siret=$8, conditions=$9
       WHERE id=$10 AND user_id=$11 RETURNING *`,
    [
      b.name, b.type || 'entreprise', b.contact || null, b.email, b.phone || null,
      b.address || null, b.city || null, b.siret || null, b.conditions || 'Net 30 jours',
      req.params.id, uid(req),
    ],
  );
  if (!rows.length) return res.status(404).json({ error: 'Client introuvable.' });
  res.json(rows[0]);
});

clientsRouter.delete('/:id', async (req, res) => {
  const rows = await query(
    `DELETE FROM clients WHERE id=$1 AND user_id=$2 RETURNING id`,
    [req.params.id, uid(req)],
  );
  if (!rows.length) return res.status(404).json({ error: 'Client introuvable.' });
  res.json({ ok: true });
});
