# Vaulty — Suivi de factures & compta

Application web de suivi de factures et de comptabilité (tableau de bord, factures, clients, paramètres).

- **Frontend** : Angular 19 (standalone + signals) — design porté depuis `design_handoff_vaulty/`
- **Backend** : Node + Express + TypeScript, API REST
- **Base de données** : PostgreSQL
- **Auth** : inscription + connexion par email/mot de passe (JWT, bcrypt) — **chaque utilisateur a sa propre compta isolée**
- **Déploiement** : Docker → Render

## Architecture

**Deux services séparés** + une base de données :

- `vaulty-web` — conteneur **nginx** : sert le frontend Angular et **proxifie `/api`** vers le backend (donc pas de CORS, même origine côté navigateur).
- `vaulty-api` — conteneur **Node** : l'API REST seule.
- `vaulty-db` — **PostgreSQL**.

```
Vaulty/
├── frontend/
│   ├── Dockerfile           build Angular → nginx
│   └── nginx.conf.template  sert le front + proxy /api -> backend
├── backend/
│   └── Dockerfile           API Node/Express
├── docker-compose.yml       dev/local : db + api + web
└── render.yaml              blueprint Render (2 web services + Postgres)
```

## Lancer en local

### Option A — tout en Docker (le plus simple)

```bash
docker compose up -d --build
```

L'app est sur **http://localhost:8080** (le front nginx ; il proxifie l'API).
Ouvre l'app, **crée un compte** (page Inscription), puis connecte-toi. L'API est aussi sur :3000, Postgres sur :5433.

### Option B — dev avec rechargement à chaud

```bash
# 1. Base de données
docker compose up -d db

# 2. Backend (port 3000)
cd backend
cp .env.example .env        # ajuster si besoin (DATABASE_URL pointe sur localhost:5433)
npm install
npm run dev                 # applique le schéma automatiquement au démarrage

# 3. Frontend (port 4200, proxy /api -> :3000)
cd ../frontend
npm install
npm start
```

Frontend de dev : http://localhost:4200 (crée un compte pour commencer)

## Variables d'environnement (backend)

| Variable | Rôle | Défaut |
|---|---|---|
| `DATABASE_URL` | URL Postgres (sinon `PGHOST`/`PGUSER`/… ) | localhost |
| `APP_PASSWORD` | mot de passe de connexion à l'app | `vaulty` |
| `JWT_SECRET` | secret de signature des tokens | dev only |
| `PORT` | port d'écoute | `3000` |
| `AUTO_MIGRATE` | applique le schéma au démarrage | `true` |
| `AUTO_SEED` | seed les données de démo si la base est vide | non défini |

## Déploiement sur Render

1. Pousser ce dépôt sur GitHub.
2. Sur Render : **New → Blueprint**, sélectionner le repo. Render lit `render.yaml` et crée :
   - une base **Postgres** managée (`vaulty-db`),
   - le **backend** Docker (`vaulty-api`) relié à la base via `DATABASE_URL`,
   - le **frontend** Docker nginx (`vaulty-web`) qui proxifie `/api` vers `vaulty-api` (adresse interne injectée via `BACKEND_HOSTPORT`).
3. Définir la variable **`APP_PASSWORD`** sur le service `vaulty-api` (le mot de passe de connexion). `JWT_SECRET` est généré automatiquement.
4. Ouvrir l'URL du service **`vaulty-web`**.
5. Au premier déploiement, le schéma est créé et les données de démo sont insérées (`AUTO_SEED=true`). Pour repartir sur une base vide, mettre `AUTO_SEED=false` et vider la table `clients`.

> Plan gratuit : la base Postgres gratuite de Render expire après ~30 jours et le service web se met en veille après inactivité (premier chargement plus lent). Passer en plan payant pour la production.

## API (extrait)

| Méthode | Route | Description |
|---|---|---|
| POST | `/api/auth/login` | connexion (renvoie un JWT) |
| GET | `/api/dashboard` | KPIs + encaissements à venir |
| GET/POST | `/api/clients` | liste / création de clients |
| GET/PUT/DELETE | `/api/clients/:id` | fiche client (+ factures) / modifier / supprimer |
| GET/POST | `/api/invoices` | liste (filtres `status`,`q`) / création |
| GET/PUT/DELETE | `/api/invoices/:id` | détail (+ lignes/totaux) / modifier / supprimer |
| PATCH | `/api/invoices/:id` | changer le statut (ex: marquer payée) |
| GET | `/api/invoices/meta/next-number` | prochain numéro de facture |
| GET/PUT | `/api/profile` | profil entreprise |

Toutes les routes sauf `/api/auth/login` et `/api/health` exigent un en-tête `Authorization: Bearer <token>`.
