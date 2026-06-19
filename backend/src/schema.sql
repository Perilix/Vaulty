-- Vaulty — schéma de base de données

CREATE TABLE IF NOT EXISTS clients (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'entreprise',   -- entreprise | particulier
  contact     TEXT,
  email       TEXT,
  phone       TEXT,
  address     TEXT,
  city        TEXT,
  siret       TEXT,
  conditions  TEXT DEFAULT 'Net 30 jours',
  statut      TEXT NOT NULL DEFAULT 'Bon payeur',   -- Bon payeur | À surveiller | En retard
  -- Métriques affichées (snapshot ; on pourra les recalculer plus tard)
  ca          NUMERIC(14,2) NOT NULL DEFAULT 0,
  encours     NUMERIC(14,2) NOT NULL DEFAULT 0,
  factures    INTEGER NOT NULL DEFAULT 0,
  delai       INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoices (
  id          TEXT PRIMARY KEY,                     -- ex: F-2026-082
  client_id   TEXT REFERENCES clients(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,                        -- dénormalisé pour l'affichage
  issued_on   DATE,
  due_on      DATE,
  statut      TEXT NOT NULL DEFAULT 'draft',        -- paid | pending | overdue | draft
  notes       TEXT,
  tva_rate    NUMERIC(5,2) NOT NULL DEFAULT 20,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoice_lines (
  id          SERIAL PRIMARY KEY,
  invoice_id  TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL DEFAULT '',
  qty         NUMERIC(12,2) NOT NULL DEFAULT 1,
  unit_price  NUMERIC(12,2) NOT NULL DEFAULT 0,
  position    INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_lines_invoice ON invoice_lines(invoice_id);

-- Réglages applicatifs (KPIs vitrine, profil entreprise, préférences) en JSON
CREATE TABLE IF NOT EXISTS app_settings (
  key   TEXT PRIMARY KEY,
  value JSONB NOT NULL
);
