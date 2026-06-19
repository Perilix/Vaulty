import { Router } from 'express';
import { pool, query } from '../db.js';
import { uid } from '../auth.js';

export const invoicesRouter = Router();

invoicesRouter.get('/', async (req, res) => {
  const { status, q } = req.query as { status?: string; q?: string };
  const params: any[] = [uid(req)];
  let where = ' WHERE i.user_id = $1';
  if (status && status !== 'all') {
    params.push(status);
    where += ` AND i.statut = $${params.length}`;
  }
  if (q) {
    params.push(`%${q.toLowerCase()}%`);
    where += ` AND (LOWER(i.client_name) LIKE $${params.length} OR LOWER(i.id) LIKE $${params.length})`;
  }
  const rows = await query(
    `SELECT i.id, i.client_id, i.client_name, i.issued_on, i.due_on, i.statut, i.tva_rate,
            COALESCE(SUM(l.qty * l.unit_price), 0) AS ht
       FROM invoices i
       LEFT JOIN invoice_lines l ON l.invoice_id = i.id
       ${where}
      GROUP BY i.id
      ORDER BY i.issued_on DESC NULLS LAST, i.id DESC`,
    params,
  );
  res.json(
    rows.map((r: any) => {
      const ht = Number(r.ht);
      const tva = (ht * Number(r.tva_rate)) / 100;
      return { ...r, ht, tva, ttc: ht + tva };
    }),
  );
});

// Prochain numéro de facture (F-YYYY-NNN), par utilisateur
async function nextInvoiceId(userId: string): Promise<string> {
  const year = 2026;
  const [row] = await query<{ max: string | null }>(
    `SELECT MAX(SUBSTRING(id FROM 9)::int)::text AS max
       FROM invoices WHERE user_id = $1 AND id LIKE $2`,
    [userId, `F-${year}-%`],
  );
  const next = (row?.max ? parseInt(row.max, 10) : 0) + 1;
  return `F-${year}-${String(next).padStart(3, '0')}`;
}

invoicesRouter.get('/meta/next-number', async (req, res) => {
  res.json({ id: await nextInvoiceId(uid(req)) });
});

invoicesRouter.get('/:id', async (req, res) => {
  const [invoice] = await query(
    `SELECT id, client_id, client_name, issued_on, due_on, statut, tva_rate, notes
       FROM invoices WHERE id = $1 AND user_id = $2`,
    [req.params.id, uid(req)],
  );
  if (!invoice) return res.status(404).json({ error: 'Facture introuvable.' });
  const lines = await query(
    `SELECT id, description, qty, unit_price, position FROM invoice_lines
      WHERE invoice_id = $1 ORDER BY position`,
    [req.params.id],
  );
  const ht = lines.reduce((a: number, l: any) => a + Number(l.qty) * Number(l.unit_price), 0);
  const tva = (ht * Number(invoice.tva_rate)) / 100;
  res.json({ ...invoice, lines, ht, tva, ttc: ht + tva });
});

invoicesRouter.post('/', async (req, res) => {
  const b = req.body ?? {};
  const userId = uid(req);
  const lines: any[] = Array.isArray(b.lines) ? b.lines : [];
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const id = b.id || (await nextInvoiceId(userId));
    await client.query(
      `INSERT INTO invoices (id, user_id, client_id, client_name, issued_on, due_on, statut, tva_rate, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        id, userId, b.client_id || null, b.client_name || '', b.issued_on || null,
        b.due_on || null, b.statut || 'draft', b.tva_rate ?? 20, b.notes || null,
      ],
    );
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      await client.query(
        `INSERT INTO invoice_lines (invoice_id, description, qty, unit_price, position)
         VALUES ($1,$2,$3,$4,$5)`,
        [id, l.description || '', Number(l.qty) || 0, Number(l.unit_price) || 0, i],
      );
    }
    await client.query('COMMIT');
    res.status(201).json({ id });
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
});

invoicesRouter.patch('/:id', async (req, res) => {
  const { statut } = req.body ?? {};
  if (!statut) return res.status(400).json({ error: 'Champ "statut" requis.' });
  const rows = await query(
    `UPDATE invoices SET statut = $1 WHERE id = $2 AND user_id = $3 RETURNING id, statut`,
    [statut, req.params.id, uid(req)],
  );
  if (!rows.length) return res.status(404).json({ error: 'Facture introuvable.' });
  res.json(rows[0]);
});

// Mise à jour complète d'une facture (champs + lignes)
invoicesRouter.put('/:id', async (req, res) => {
  const b = req.body ?? {};
  const userId = uid(req);
  const id = req.params.id;
  const lines: any[] = Array.isArray(b.lines) ? b.lines : [];
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const upd = await client.query(
      `UPDATE invoices SET client_id=$1, client_name=$2, issued_on=$3, due_on=$4,
              statut=$5, tva_rate=$6, notes=$7
         WHERE id=$8 AND user_id=$9 RETURNING id`,
      [
        b.client_id || null, b.client_name || '', b.issued_on || null, b.due_on || null,
        b.statut || 'draft', b.tva_rate ?? 20, b.notes || null, id, userId,
      ],
    );
    if (!upd.rowCount) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Facture introuvable.' });
    }
    await client.query(`DELETE FROM invoice_lines WHERE invoice_id = $1`, [id]);
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      await client.query(
        `INSERT INTO invoice_lines (invoice_id, description, qty, unit_price, position)
         VALUES ($1,$2,$3,$4,$5)`,
        [id, l.description || '', Number(l.qty) || 0, Number(l.unit_price) || 0, i],
      );
    }
    await client.query('COMMIT');
    res.json({ id });
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
});

invoicesRouter.delete('/:id', async (req, res) => {
  const rows = await query(
    `DELETE FROM invoices WHERE id=$1 AND user_id=$2 RETURNING id`,
    [req.params.id, uid(req)],
  );
  if (!rows.length) return res.status(404).json({ error: 'Facture introuvable.' });
  res.json({ ok: true });
});
