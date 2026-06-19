import { fileURLToPath } from 'node:url';
import { pool, query } from './db.js';
import { migrate } from './migrate.js';

/* Données vitrine reprises du prototype de design (data.js) */

const clients = [
  { id: 'c1', name: 'Atelier Moreau', type: 'entreprise', contact: 'Léa Moreau', email: 'lea@ateliermoreau.fr', city: 'Lyon', siret: '812 456 789 00021', ca: 28450, encours: 4200, factures: 14, delai: 18, statut: 'Bon payeur' },
  { id: 'c2', name: 'Studio Kline', type: 'entreprise', contact: 'Marc Klein', email: 'm.klein@studiokline.com', city: 'Paris', siret: '503 221 980 00014', ca: 41200, encours: 9800, factures: 9, delai: 41, statut: 'À surveiller' },
  { id: 'c3', name: 'Brasserie du Port', type: 'entreprise', contact: 'Inès Fabre', email: 'contact@brasserieduport.fr', city: 'Marseille', siret: '729 118 442 00033', ca: 15680, encours: 0, factures: 22, delai: 12, statut: 'Bon payeur' },
  { id: 'c4', name: 'Novaled SAS', type: 'entreprise', contact: 'Hugo Petit', email: 'compta@novaled.fr', city: 'Nantes', siret: '441 905 233 00027', ca: 63900, encours: 14500, factures: 7, delai: 52, statut: 'En retard' },
  { id: 'c5', name: 'Camille Rousseau', type: 'particulier', contact: 'Camille Rousseau', email: 'camille.r@gmail.com', city: 'Bordeaux', siret: '—', ca: 8200, encours: 1100, factures: 6, delai: 9, statut: 'Bon payeur' },
  { id: 'c6', name: 'Groupe Helsa', type: 'entreprise', contact: 'Sofia Nardin', email: 'achats@helsa-groupe.com', city: 'Lille', siret: '388 027 651 00045', ca: 52300, encours: 6300, factures: 11, delai: 33, statut: 'À surveiller' },
];

const invoices = [
  { id: 'F-2026-082', client: 'Novaled SAS', date: '02 juin', echeance: '02 juil.', montant: 8400, statut: 'overdue' },
  { id: 'F-2026-081', client: 'Groupe Helsa', date: '28 mai', echeance: '27 juin', montant: 6300, statut: 'pending' },
  { id: 'F-2026-080', client: 'Studio Kline', date: '24 mai', echeance: '23 juin', montant: 4800, statut: 'pending' },
  { id: 'F-2026-079', client: 'Atelier Moreau', date: '20 mai', echeance: '19 juin', montant: 4200, statut: 'pending' },
  { id: 'F-2026-078', client: 'Brasserie du Port', date: '16 mai', echeance: '15 juin', montant: 2150, statut: 'paid' },
  { id: 'F-2026-077', client: 'Camille Rousseau', date: '12 mai', echeance: '11 juin', montant: 1100, statut: 'overdue' },
  { id: 'F-2026-076', client: 'Novaled SAS', date: '09 mai', echeance: '08 juin', montant: 6100, statut: 'paid' },
  { id: 'F-2026-075', client: 'Groupe Helsa', date: '05 mai', echeance: '04 juin', montant: 3900, statut: 'paid' },
  { id: 'F-2026-074', client: 'Atelier Moreau', date: '28 avr.', echeance: '28 mai', montant: 2750, statut: 'paid' },
  { id: 'F-2026-073', client: 'Studio Kline', date: '22 avr.', echeance: '22 mai', montant: 5200, statut: 'paid' },
  { id: 'F-2026-072', client: 'Brasserie du Port', date: '18 avr.', echeance: '18 mai', montant: 1480, statut: 'paid' },
  { id: 'F-2026-071', client: 'Novaled SAS', date: '14 avr.', echeance: '14 mai', montant: 7300, statut: 'paid' },
];

const kpis = {
  caMois: 34800, caMoisTrend: 11.4,
  caAnnee: 312400, caAnneeTrend: 18.2,
  impayes: 25700, impayesNb: 4, retardNb: 2,
  delaiMoyen: 31, delaiTrend: -4,
  recouvrement: 86, recouvrementTrend: 3,
  tvaCollectee: 8240, tvaDeductible: 3060, tvaAReverser: 5180,
  tresorerie: 42600, tresorerieTrend: 9.3,
  resultat: 11900, produits: 34800, chargesTotal: 22900,
  months: ['Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc', 'Janv', 'Févr', 'Mars', 'Avr', 'Mai', 'Juin'],
  caEncaisse: [18200, 16400, 21300, 24800, 22100, 28600, 19400, 23200, 27800, 31200, 29400, 34800],
  caFacture: [20100, 19800, 23400, 26100, 25300, 30200, 22800, 26400, 30100, 33800, 34200, 39600],
};

const profile = {
  raisonSociale: 'Studio Vaulty',
  siret: '902 118 334 00018',
  email: 'compta@studio-vaulty.fr',
  regimeTva: 'Réel normal',
  devise: 'EUR (€)',
  adresse: '12 rue des Capucins\n69001 Lyon',
  ownerName: 'Thomas Bernard',
};

const MONTHS: Record<string, string> = {
  janv: '01', févr: '02', mars: '03', avr: '04', mai: '05', juin: '06',
  juil: '07', août: '08', sept: '09', oct: '10', nov: '11', déc: '12',
};

function parseFrDate(s: string, year = 2026): string {
  const [day, rawMonth] = s.trim().split(' ');
  const month = MONTHS[rawMonth.replace('.', '').toLowerCase()] || '01';
  return `${year}-${month}-${day.padStart(2, '0')}`;
}

// Lignes générées pour chaque facture, dont la somme HT = montant.
function linesFor(total: number) {
  const a = Math.round(total * 0.6);
  const b = total - a;
  return [
    { description: 'Prestation de conseil — phase 1', qty: 1, unit_price: a },
    { description: 'Développement & intégration', qty: 1, unit_price: b },
  ];
}

export async function seed() {
  await migrate();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('TRUNCATE invoice_lines, invoices, clients RESTART IDENTITY CASCADE');

    for (const c of clients) {
      await client.query(
        `INSERT INTO clients (id, name, type, contact, email, city, siret, statut, ca, encours, factures, delai)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [c.id, c.name, c.type, c.contact, c.email, c.city, c.siret, c.statut, c.ca, c.encours, c.factures, c.delai],
      );
    }

    const byName = new Map(clients.map((c) => [c.name, c.id]));
    for (const iv of invoices) {
      await client.query(
        `INSERT INTO invoices (id, client_id, client_name, issued_on, due_on, statut, tva_rate, notes)
         VALUES ($1,$2,$3,$4,$5,$6,20,$7)`,
        [
          iv.id, byName.get(iv.client) ?? null, iv.client,
          parseFrDate(iv.date), parseFrDate(iv.echeance), iv.statut,
          'Paiement par virement — IBAN FR76 3000 4000 0500 0012 3456 789',
        ],
      );
      const lines = linesFor(iv.montant);
      for (let i = 0; i < lines.length; i++) {
        const l = lines[i];
        await client.query(
          `INSERT INTO invoice_lines (invoice_id, description, qty, unit_price, position)
           VALUES ($1,$2,$3,$4,$5)`,
          [iv.id, l.description, l.qty, l.unit_price, i],
        );
      }
    }

    await client.query(
      `INSERT INTO app_settings (key, value) VALUES ('kpis', $1), ('profile', $2)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [JSON.stringify(kpis), JSON.stringify(profile)],
    );

    await client.query('COMMIT');
    console.log('[seed] données insérées ✓');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seed()
    .then(() => pool.end())
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
