# Backend CCJV — API REST

API du site du **Centre Chrétien Jésus ma Vie** (CCJV). Elle est l'unique porte
d'entrée des données du site : le frontend Next.js ne parle jamais directement à
PostgreSQL ni à Supabase Storage, et la clé `service_role` ne quitte jamais ce
processus.

## Rôle

- **Lecture publique** : départements, événements, publications, responsables,
  témoignages, visages de la communauté, versets, programme hebdomadaire, liens
  sociaux, pages statiques.
- **Écriture administrée** : création, mise à jour et suppression réservées à un
  administrateur **authentifié, actif et titulaire du rôle** `ROLE_ADMIN`.
- **Formulaire de prière** : seul point d'écriture publique, volontairement
  limité (5 dépôts par heure et par IP) et jamais exposé en lecture.
- **Médias** : téléversement vers Supabase Storage après vérification du **type
  réel** du fichier par ses octets d'en-tête — jamais par son extension.

Le détail des contrats (sérialisation alignée sur `frontend/src/types/index.ts`,
codes d'erreur, pagination, tri en liste blanche) est décrit dans
[`docs/IMPLEMENTATION_SPEC.md`](./docs/IMPLEMENTATION_SPEC.md).

## Stack

| Élément | Choix |
| --- | --- |
| Exécution | Node.js ≥ 20 (image `node:22-alpine` en production) |
| Langage | TypeScript 7 (`strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`) |
| HTTP | Express 5 |
| Validation | Zod 4 (entrées) |
| Base de données | PostgreSQL (Supabase) via Drizzle ORM |
| Stockage | Supabase Storage |
| Authentification | Supabase Auth (jetons JWT vérifiés contre les clés JWKS) |
| Journalisation | pino (`LOG_LEVEL`, secrets masqués) |
| Tests | Vitest 5 + supertest |

## Prérequis

- Node.js 20 ou plus récent, npm 10+.
- Un projet Supabase (base PostgreSQL + Storage + Auth) accessible.
- L'URL de connexion **via le pooler** en mode session (port `5432`) : les
  projets Supabase récents n'exposent qu'une connexion directe IPv6, inutilisable
  depuis un réseau IPv4.

## Installation

```bash
cd backend
npm ci
cp .env.example .env          # Copy-Item .env.example .env sous PowerShell
# renseigner les valeurs dans .env
npm run db:migrate            # crée le schéma
npm run seed                  # (facultatif) contenus de démonstration
npm run dev                   # http://localhost:4000/api/v1
```

## Variables d'environnement

La liste complète, avec commentaires, est dans [`.env.example`](./.env.example).
`src/config/env.ts` valide la configuration au démarrage : une variable manquante
ou invalide interrompt le processus avec un message explicite plutôt que de
provoquer une erreur obscure à la première requête.

| Variable | Rôle | Défaut |
| --- | --- | --- |
| `NODE_ENV` | `development` \| `test` \| `production` | `development` |
| `PORT` | Port d'écoute (injecté par Railway) | `4000` |
| `DATABASE_URL` | **Requis.** URL PostgreSQL via le pooler (port 5432) | — |
| `SUPABASE_URL` | **Requis.** URL du projet Supabase | — |
| `SUPABASE_ANON_KEY` | **Requis.** Clé publique | — |
| `SUPABASE_SERVICE_ROLE_KEY` | **Requis.** Clé serveur — ne jamais l'exposer | — |
| `SUPABASE_STORAGE_BUCKET` | Bucket des médias | `ccjv-media` |
| `API_VERSION` | Préfixe d'API (`/api/v1`) | `v1` |
| `CORS_ORIGIN` | Origines autorisées, séparées par des virgules | `http://localhost:3000` |
| `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX` | Limitation globale | `60000` / `120` |
| `MAX_UPLOAD_BYTES` | Taille maximale d'un téléversement | `5242880` (5 Mo) |
| `LOG_LEVEL` | `fatal`…`silent` | `info` |

Aucun secret n'est versionné : `.env` est ignoré par Git et exclu de l'image
Docker.

## Scripts disponibles

| Script | Effet |
| --- | --- |
| `npm run dev` | Serveur de développement avec rechargement (`tsx watch`) |
| `npm run build` | Compilation TypeScript vers `dist/` |
| `npm start` | Exécution de l'API compilée (`node dist/server.js`) |
| `npm run typecheck` | Vérification des types sans émission |
| `npm run lint` | ESLint sur `src` et `tests` |
| `npm test` / `npm run test:watch` | Tests Vitest (exécution unique / mode veille) |
| `npm run db:generate` | Génère une migration depuis le schéma Drizzle |
| `npm run db:migrate` | Applique les migrations de `drizzle/` |
| `npm run db:studio` | Explorateur de base Drizzle Studio |
| `npm run seed` | Insère les contenus de démonstration |
| `npm run admin:create` | Création du premier administrateur |
| `npm run openapi` | Génère le document OpenAPI |

Les scripts `seed` et `openapi` délèguent respectivement à
`src/infrastructure/database/seed.ts` et
`src/presentation/openapi/generate.ts` : ces deux fichiers doivent être présents
dans l'arbre pour que les commandes aboutissent.

## Base de données et migrations

```bash
npm run db:generate   # après toute modification de src/infrastructure/database/schema
npm run db:migrate    # applique drizzle/*.sql sur DATABASE_URL
```

- Les migrations sont **versionnées** dans `drizzle/` et **jamais** appliquées
  automatiquement au démarrage : une migration est une opération sensible, qui
  doit être déclenchée volontairement. Le script prend un verrou consultatif
  PostgreSQL, ce qui rend l'opération sûre même si deux instances démarrent en
  parallèle.
- Drizzle journalise les migrations appliquées dans
  `drizzle.__drizzle_migrations` : `db:migrate` est donc idempotent.
- Dans un conteneur (dépendances de développement absentes), la même opération
  s'exécute avec `node dist/infrastructure/database/migrate.js`, qui lit
  `./drizzle`.

## Création du premier administrateur

```bash
npm run admin:create
```

Le script crée le compte auprès de Supabase Auth puis la ligne correspondante
dans `admin_profiles`. **Aucun mot de passe n'est stocké dans la base
applicative** : l'authentification est entièrement déléguée à Supabase Auth, et
`admin_profiles.id` est égal à `auth.users.id`.

Procédure manuelle équivalente, si nécessaire :

1. Créer l'utilisateur dans **Supabase → Authentication → Users** et relever son
   UUID.
2. Insérer le profil correspondant (le nom d'utilisateur est unique, sans
   distinction de casse) :

```sql
insert into public.admin_profiles (id, username, display_name, role, is_active)
values ('<uuid-de-auth.users>', 'pasteur', 'Pasteur responsable', 'ROLE_ADMIN', true);
```

Un compte authentifié auprès de Supabase **mais absent de `admin_profiles`**, ou
désactivé (`is_active = false`), n'obtient aucun droit : la réponse est `403
FORBIDDEN`.

## Tests

```bash
npm test          # exécution unique
npm run test:watch
```

- Les tests **unitaires** (dossier `tests/unit/`) s'exécutent **sans base de
  données ni réseau** : les repositories sont remplacés par des doubles et les
  middlewares sont appelés directement. Ils couvrent la génération de slug, le
  calcul du statut d'un événement, la détection du type réel des fichiers, la
  pagination et le tri, la hiérarchie d'erreurs, l'autorisation des routes
  administratives et la validation Zod.
- Le test d'**intégration** (`tests/integration/`) traverse l'application Express
  réelle avec `supertest` : `GET /api/v1/health`, route inconnue → `404
  { error: { code: "NOT_FOUND" } }`, en-têtes de durcissement. Il nécessite que
  l'application soit composable et que la base réponde ; à défaut, il est ignoré
  en l'annonçant plutôt que de faire échouer la suite.

## Endpoints principaux

Préfixe commun : `/api/v1` (variable `API_VERSION`). Les identifiants acceptent
un **UUID ou un slug** sur les routes de détail ; les collections sont paginées
(`?page=1&limit=20`) et triées par une colonne issue d'une liste blanche serveur
(`?sort=-published_at`).

| Ressource | Chemin | Méthodes | Authentification |
| --- | --- | --- | --- |
| Santé | `/api/v1/health` | `GET` | Public (interroge la base) |
| Départements | `/api/v1/departments` | `GET /`, `GET /:idOrSlug` | Public |
| | | `POST /`, `PATCH /:idOrSlug`, `DELETE /:idOrSlug` | `Authorization: Bearer <jeton>` + `ROLE_ADMIN` |
| Événements | `/api/v1/events` | `GET /`, `GET /:idOrSlug` | Public |
| | | `POST /`, `PATCH /:idOrSlug`, `DELETE /:idOrSlug` | `ROLE_ADMIN` |
| Publications | `/api/v1/publications` | `GET /`, `GET /:idOrSlug` | Public (brouillons exclus) |
| | | `POST /`, `PATCH /:idOrSlug`, `DELETE /:idOrSlug` | `ROLE_ADMIN` |
| Responsables | `/api/v1/leaders` | `GET /`, `GET /:idOrSlug` | Public |
| | | `POST /`, `PATCH /:idOrSlug`, `DELETE /:idOrSlug` | `ROLE_ADMIN` |
| Témoignages | `/api/v1/testimonies` | `GET /`, `GET /:idOrSlug` | Public |
| | | `POST /`, `PATCH /:idOrSlug`, `DELETE /:idOrSlug` | `ROLE_ADMIN` |
| Visages de la communauté | `/api/v1/community-faces` | `GET /`, `GET /:idOrSlug` | Public |
| | | `POST /`, `PATCH /:idOrSlug`, `DELETE /:idOrSlug` | `ROLE_ADMIN` |
| Versets | `/api/v1/scriptures` | `GET /`, `GET /:key` | Public |
| | | `POST /`, `PATCH /:key`, `DELETE /:key` | `ROLE_ADMIN` |
| Programme | `/api/v1/schedule` | `GET /` | Public |
| | | `POST /`, `PATCH /:id`, `DELETE /:id` | `ROLE_ADMIN` |
| Liens sociaux | `/api/v1/social-links` | `GET /` | Public |
| | | `POST /`, `PATCH /:id`, `DELETE /:id` | `ROLE_ADMIN` |
| Réglages du site | `/api/v1/settings` | `GET /` | Public |
| | | `PUT /` | `ROLE_ADMIN` |
| Pages statiques | `/api/v1/pages` | `GET /:pageKey` | Public |
| | | `PUT /:pageKey` | `ROLE_ADMIN` |
| Médias | `/api/v1/media` | `POST /` (multipart), `DELETE /:id` | `ROLE_ADMIN` |
| Demandes de prière | `/api/v1/prayer-requests` | `POST /` | **Public** (5/heure/IP) |
| | | `GET /`, `GET /:id`, `PATCH /:id`, `DELETE /:id` | `ROLE_ADMIN` |
| Administration | `/api/v1/admin/me` | `GET` | Administrateur **actif** |
| | `/api/v1/admin/profiles` | `GET` | `ROLE_ADMIN` |

Notes d'authentification :

- L'en-tête attendu est `Authorization: Bearer <jeton Supabase>`. Le jeton est
  vérifié contre les clés publiques JWKS du projet (signature, expiration,
  émetteur) : aucune clé partagée n'est manipulée côté serveur.
- Une requête sans jeton, ou avec un jeton invalide, reçoit `401 AUTH_REQUIRED`.
  Un jeton valide mais sans profil administratif actif reçoit `403 FORBIDDEN`.
- Le rôle est contrôlé côté serveur, au niveau du router : aucun controller ne
  teste de permission lui-même.
- Les réponses d'erreur respectent un format unique :
  `{ "error": { "code": "...", "message": "...", "details": ... } }`.
  Les collections répondent `{ "data": [...], "meta": { page, limit, total,
  totalPages } }`.

## Déploiement Railway

1. **Root Directory = `backend`.** Le dépôt contient aussi `frontend/` ; Railway
   doit donc construire uniquement le sous-dossier du backend (Settings →
   Source → Root Directory).
2. La configuration de déploiement est versionnée dans
   [`railway.json`](./railway.json) : constructeur `DOCKERFILE`, chemin
   `Dockerfile`, redémarrage sur échec (5 tentatives) et contrôle de santé sur
   `/api/v1/health`.
3. L'image est construite en deux étapes ([`Dockerfile`](./Dockerfile)) :
   compilation TypeScript, puis image finale `node:22-alpine` contenant `dist/`,
   les dépendances de production, `drizzle/` et rien d'autre. L'application
   tourne avec l'utilisateur non-root `node`.
4. **Variables à définir dans Railway** : `NODE_ENV=production`,
   `DATABASE_URL` (pooler, port 5432), `SUPABASE_URL`, `SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`, `CORS_ORIGIN` (URL du
   frontend déployé), `API_VERSION`, `RATE_LIMIT_*`, `MAX_UPLOAD_BYTES`,
   `LOG_LEVEL`. Railway injecte `PORT` lui-même : le serveur la lit et `EXPOSE`
   n'est qu'une déclaration.
5. **Migrations** : à exécuter une fois après le premier déploiement, et à chaque
   nouvelle migration. Depuis un poste disposant des dépendances de développement
   (`railway run npm run db:migrate`), ou dans le conteneur avec
   `node dist/infrastructure/database/migrate.js`.
6. **Contrôle de santé** : `/api/v1/health` interroge réellement la base
   (`select 1`). Une instance qui répond `200 { "status": "ok" }` est saine ;
   `503 { "status": "error", "database": "down" }` signale une base injoignable —
   Railway ne route alors aucun trafic vers l'instance. C'est volontaire : un
   « ok » de complaisance masquerait une panne de base.

### Points de vigilance

- **Sortie de compilation.** `tsc` ne réécrit pas les alias de `tsconfig.json` :
  `dist/` conserve des imports `@/...` ainsi que des imports relatifs sans
  extension (`./schema`). Or `package.json` déclare `"type": "module"` : ces
  spécificateurs ne sont pas résolus par Node tel quel, et
  `node dist/server.js` échoue sur `Cannot find package '@/app'`. Le correctif
  appartient à la configuration TypeScript (émission `nodenext` avec extensions
  explicites, réécriture des alias, ou étape de bundling) ; il n'est pas appliqué
  ici pour ne pas modifier des fichiers hors périmètre.
- **Taille des corps de requête** : `express.json({ limit: "1mb" })`. Les images
  passent par `multipart/form-data` (multer) et sont bornées par
  `MAX_UPLOAD_BYTES`.
- **Journalisation** : `Authorization`, `Cookie` et les champs sensibles
  (`password`, `token`, texte de demande de prière, coordonnées) sont masqués
  avant écriture.
