import express from 'express';
import 'express-async-errors';
import cors from 'cors';
import 'dotenv/config';

import { login, requireAuth } from './auth.js';
import { clientsRouter } from './routes/clients.js';
import { invoicesRouter } from './routes/invoices.js';
import { metaRouter } from './routes/meta.js';
import { migrate } from './migrate.js';
import { seed } from './seed.js';
import { pool, query } from './db.js';

const app = express();

app.use(cors());
app.use(express.json());

// --- API ---
const api = express.Router();
api.get('/health', (_req, res) => res.json({ ok: true }));
api.post('/auth/login', login);

// Tout le reste de l'API nécessite une authentification
api.use(requireAuth);
api.use('/clients', clientsRouter);
api.use('/invoices', invoicesRouter);
api.use('/', metaRouter); // /dashboard, /profile

app.use('/api', api);

// Gestion d'erreurs simple
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Erreur serveur.' });
});

const PORT = Number(process.env.PORT) || 3000;

async function start() {
  if (process.env.AUTO_MIGRATE !== 'false') {
    try {
      await migrate();
      // Seed initial uniquement si la base est vide (utile au 1er déploiement)
      if (process.env.AUTO_SEED === 'true') {
        const [{ count }] = await query<{ count: string }>('SELECT COUNT(*)::text AS count FROM clients');
        if (Number(count) === 0) {
          console.log('[startup] base vide -> seed des données de démonstration');
          await seed();
        }
      }
    } catch (e) {
      console.error('[startup] migration/seed échoué :', e);
    }
  }
  app.listen(PORT, () => console.log(`[vaulty] API sur http://localhost:${PORT}`));
}

start();

process.on('SIGTERM', () => pool.end().then(() => process.exit(0)));
