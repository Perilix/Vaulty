-- Vaulty — schéma de base de données (multi-utilisateurs)
-- Idempotent et auto-réparant : peut s'appliquer sur une base vierge OU sur une
-- ancienne base (tables sans user_id) sans intervention manuelle.

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clients (
  id          TEXT PRIMARY KEY,
  user_id     TEXT REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'entreprise',
  contact     TEXT,
  email       TEXT,
  phone       TEXT,
  address     TEXT,
  city        TEXT,
  siret       TEXT,
  conditions  TEXT DEFAULT 'Net 30 jours',
  statut      TEXT NOT NULL DEFAULT 'Bon payeur',
  ca          NUMERIC(14,2) NOT NULL DEFAULT 0,
  encours     NUMERIC(14,2) NOT NULL DEFAULT 0,
  factures    INTEGER NOT NULL DEFAULT 0,
  delai       INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoices (
  id          TEXT PRIMARY KEY,
  user_id     TEXT REFERENCES users(id) ON DELETE CASCADE,
  client_id   TEXT REFERENCES clients(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  issued_on   DATE,
  due_on      DATE,
  statut      TEXT NOT NULL DEFAULT 'draft',
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

-- Migration des bases antérieures (tables créées sans user_id) :
ALTER TABLE clients  ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id) ON DELETE CASCADE;

-- app_settings est passé d'une PK (key) à (user_id, key).
-- On ne supprime l'ANCIENNE table (sans user_id) qu'une seule fois ; si elle a déjà
-- la bonne structure, on n'y touche pas (les profils enregistrés sont préservés).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'app_settings')
     AND NOT EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_name = 'app_settings' AND column_name = 'user_id'
     ) THEN
    DROP TABLE app_settings;
  END IF;
END $$;
CREATE TABLE IF NOT EXISTS app_settings (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key     TEXT NOT NULL,
  value   JSONB NOT NULL,
  PRIMARY KEY (user_id, key)
);

CREATE INDEX IF NOT EXISTS idx_clients_user ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_lines_invoice ON invoice_lines(invoice_id);
