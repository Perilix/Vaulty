import pg from 'pg';
import 'dotenv/config';

const { Pool, types } = pg;

// Renvoyer les colonnes DATE (OID 1082) telles quelles ("YYYY-MM-DD"),
// sans conversion de fuseau horaire — l'affichage reste déterministe côté client.
types.setTypeParser(1082, (v) => v);

// Sur Render, DATABASE_URL est fourni par la base managée. En local (docker-compose),
// on assemble l'URL depuis les variables PG* si DATABASE_URL n'est pas défini.
const connectionString =
  process.env.DATABASE_URL ||
  `postgresql://${process.env.PGUSER || 'vaulty'}:${process.env.PGPASSWORD || 'vaulty'}@${
    process.env.PGHOST || 'localhost'
  }:${process.env.PGPORT || '5432'}/${process.env.PGDATABASE || 'vaulty'}`;

// Render impose SSL sur ses bases Postgres ; en local on le désactive.
const useSsl = /render\.com|sslmode=require/.test(connectionString) || process.env.PGSSL === 'true';

export const pool = new Pool({
  connectionString,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
});

export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const res = await pool.query(text, params);
  return res.rows as T[];
}
