import { Router } from 'express';
import { query } from '../db.js';
import { uid } from '../auth.js';

export const metaRouter = Router();

async function setting<T = any>(userId: string, key: string): Promise<T | null> {
  const [row] = await query<{ value: T }>(
    `SELECT value FROM app_settings WHERE user_id = $1 AND key = $2`,
    [userId, key],
  );
  return row ? row.value : null;
}

const MONTHS_FR = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

// KPIs + listes pour le tableau de bord — calculés depuis les vraies factures
metaRouter.get('/dashboard', async (req, res) => {
  // Toutes les factures de l'utilisateur avec leur HT (somme des lignes)
  const rows = await query<{ id: string; statut: string; issued_on: string | null; tva_rate: string; ht: string }>(
    `SELECT i.id, i.statut, i.issued_on, i.tva_rate,
            COALESCE(SUM(l.qty * l.unit_price), 0) AS ht
       FROM invoices i LEFT JOIN invoice_lines l ON l.invoice_id = i.id
      WHERE i.user_id = $1
      GROUP BY i.id`,
    [uid(req)],
  );

  const ttcOf = (r: any) => Number(r.ht) * (1 + Number(r.tva_rate) / 100);
  const tvaOf = (r: any) => Number(r.ht) * (Number(r.tva_rate) / 100);

  const paid = rows.filter((r) => r.statut === 'paid');
  const unpaid = rows.filter((r) => r.statut === 'pending' || r.statut === 'overdue');
  const overdue = rows.filter((r) => r.statut === 'overdue');

  const now = new Date();
  const year = now.getFullYear();

  const encaisse = paid.reduce((a, r) => a + ttcOf(r), 0);
  const caAnnee = paid
    .filter((r) => r.issued_on && new Date(r.issued_on).getFullYear() === year)
    .reduce((a, r) => a + ttcOf(r), 0);
  const enAttente = unpaid.reduce((a, r) => a + ttcOf(r), 0);
  const tvaCollectee = paid.reduce((a, r) => a + tvaOf(r), 0);
  // CA déclaré (HT encaissé) et cotisations URSSAF (12,8 %)
  const caDeclare = paid.reduce((a, r) => a + Number(r.ht), 0);
  const urssaf = caDeclare * 0.128;

  // Courbe : CA encaissé HT par mois (12 derniers mois)
  const buckets: { key: string; label: string; total: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(year, now.getMonth() - i, 1);
    buckets.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: MONTHS_FR[d.getMonth()], total: 0 });
  }
  for (const r of paid) {
    if (!r.issued_on) continue;
    const ym = r.issued_on.slice(0, 7);
    const b = buckets.find((x) => x.key === ym);
    if (b) b.total += Number(r.ht); // CA HT déclaré
  }
  // Marge nette = CA HT - 12,8 % URSSAF
  const URSSAF_RATE = 0.128;
  const caSeries = buckets.map((b) => Math.round(b.total));
  const margeSeries = buckets.map((b) => Math.round(b.total * (1 - URSSAF_RATE)));
  const margeTotal = margeSeries.reduce((a, v) => a + v, 0);

  const upcoming = await query(
    `SELECT i.id, i.client_name, i.due_on, i.statut,
            COALESCE(SUM(l.qty * l.unit_price), 0) AS ht
       FROM invoices i LEFT JOIN invoice_lines l ON l.invoice_id = i.id
      WHERE i.user_id = $1 AND i.statut IN ('pending','overdue')
      GROUP BY i.id
      ORDER BY i.due_on ASC NULLS LAST
      LIMIT 5`,
    [uid(req)],
  );

  res.json({
    kpis: {
      encaisse,
      caAnnee,
      enAttente,
      impayesNb: unpaid.length,
      retardNb: overdue.length,
      tvaCollectee,
      caDeclare,
      urssaf,
      months: buckets.map((b) => b.label),
      caEncaisse: caSeries,   // CA HT par mois
      marge: margeSeries,     // marge nette par mois (après URSSAF)
      margeTotal,
    },
    upcoming: upcoming.map((r: any) => ({ ...r, ht: Number(r.ht) })),
  });
});

metaRouter.get('/profile', async (req, res) => {
  res.json((await setting(uid(req), 'profile')) ?? {});
});

metaRouter.put('/profile', async (req, res) => {
  await query(
    `INSERT INTO app_settings (user_id, key, value) VALUES ($1, 'profile', $2)
     ON CONFLICT (user_id, key) DO UPDATE SET value = EXCLUDED.value`,
    [uid(req), JSON.stringify(req.body ?? {})],
  );
  res.json(req.body ?? {});
});
