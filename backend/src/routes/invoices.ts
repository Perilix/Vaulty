import { Router } from 'express';
import { pool, query } from '../db.js';

export const invoicesRouter = Router();

// Totaux d'une facture calculés depuis ses lignes
async function totalsFor(invoiceId: string, tvaRate = 20) {
  const lines = await query<{ qty: string; unit_price: string }>(
    `SELECT qty, unit_price FROM invoice_lines WHERE invoice_id = $1`,
    [invoiceId],
  );
  const ht = lines.reduce((a, l) => a + Number(l.qty) * Number(l.unit_price), 0);
  const tva = (ht * tvaRate) / 100;
  return { ht, tva, ttc: ht + tva };
}

invoicesRouter.get('/', async (req, res) => {
  const { status, q } = req.query as { status?: string; q?: string };
  const params: any[] = [];
  let where = '';
  if (status && status !== 'all') {
    params.push(status);
    where += ` WHERE i.statut = $${params.length}`;
  }
  if (q) {
    params.push(`%${q.toLowerCase()}%`);
    where += `${where ? ' AND' : ' WHERE'} (LOWER(i.client_name) LIKE $${params.length} OR LOWER(i.id) LIKE $${params.length})`;
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

invoicesRouter.get('/:id', async (req, res) => {
  const [invoice] = await query(
    `SELECT id, client_id, client_name, issued_on, due_on, statut, tva_rate, notes
       FROM invoices WHERE id = $1`,
    [req.params.id],
  );
  if (!invoice) return res.status(404).json({ error: 'Facture introuvable.' });
  const lines = await query(
    `SELECT id, description, qty, unit_price, position FROM invoice_lines
      WHERE invoice_id = $1 ORDER BY position`,
    [req.params.id],
  );
  const totals = await totalsFor(invoice.id, Number(invoice.tva_rate));
  res.json({ ...invoice, lines, ...totals });
});

// Génère le prochain numéro de facture (F-YYYY-NNN)
async function nextInvoiceId(): Promise<string> {
  const year = 2026;
  const [row] = await query<{ max: string | null }>(
    `SELECT MAX(SUBSTRING(id FROM 9)::int)::text AS max FROM invoices WHERE id LIKE $1`,
    [`F-${year}-%`],
  );
  const next = (row?.max ? parseInt(row.max, 10) : 0) + 1;
  return `F-${year}-${String(next).padStart(3, '0')}`;
}

invoicesRouter.get('/meta/next-number', async (_req, res) => {
  res.json({ id: await nextInvoiceId() });
});

invoicesRouter.post('/', async (req, res) => {
  const b = req.body ?? {};
  const lines: any[] = Array.isArray(b.lines) ? b.lines : [];
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const id = b.id || (await nextInvoiceId());
    await client.query(
      `INSERT INTO invoices (id, client_id, client_name, issued_on, due_on, statut, tva_rate, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        id, b.client_id || null, b.client_name || '', b.issued_on || null,
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
    `UPDATE invoices SET statut = $1 WHERE id = $2 RETURNING id, statut`,
    [statut, req.params.id],
  );
  if (!rows.length) return res.status(404).json({ error: 'Facture introuvable.' });
  res.json(rows[0]);
});
