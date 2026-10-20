# 018 — Décisions de conception du backend CCJV

> **Nature :** spécification d'implémentation. Résout les points laissés
> « À décider » par `docs/017` §19 et §20, en s'appuyant sur `docs/002`, `003`,
> `004`, `005`, `006` et sur l'inspection du frontend réel.
> **Règle :** aucune décision n'est prise contre un document validé. Quand deux
> documents divergent, la contradiction est nommée et l'arbitrage est justifié.

---

## 0. Écarts constatés entre `docs/017` et l'état réel du dépôt

`docs/017` a été rédigé sur une arborescence qui a évolué depuis. Ces écarts sont
corrigés ici, car ils conditionnent l'intégration frontend (§22).

| Point | `docs/017` | État réel observé | Conséquence |
| --- | --- | --- | --- |
| Nombre de routes | 30 | **21** `page.tsx` | Le contrat API ne dépend pas des routes |
| `/qui-sommes-nous/ce-que-nous-croyons`, `/d-ou-nous-venons`, `/qui-nous-dirige` | présentes | **absentes** | — |
| `/organisation/departements`, `/departements/[slug]`, `/responsables` | présentes | **absentes** (supprimées) | Les départements ne sont plus des routes |
| `/organisation` | hub supprimé (palier 1) | **présent** (recréé, non commité) | — |
| `/communaute/parcours-nouveau`, `/communaute/priere-et-intercession` | — | présentes sous ces noms | Noms de routes instables |
| `src/components/forms/` | absent | **`PrayerRequestForm.tsx` présent** | Besoin backend non documenté — §3 |
| Appels réseau dans `src/` | aucun | **aucun** (3 mentions en commentaires) | Intégration = création complète du client |

**Conséquence structurante :** le frontend a été remanié plusieurs fois sur les
trois dernières semaines et l'est encore (fichiers non commités d'OpenCode :
`organisation/page.tsx`, `OrganisationExplorer.tsx`, `DepartmentModal.tsx`).
Le **modèle de données**, lui, est stable : il vient de `docs/005`/`006` et de
`src/types/index.ts`. La conception backend s'appuie donc sur le domaine, pas sur
l'arborescence des routes.

---

## 1. Contradictions de la documentation et arbitrages

| # | Contradiction | Arbitrage retenu | Justification |
| --- | --- | --- | --- |
| 1 | `events.is_archived` : présent (`docs/005` §2.3) vs supprimé (`docs/006` §5) | **Supprimé.** Statut calculé depuis `event_date` | `docs/006` est postérieur et explicite ; confirmé par `src/types/index.ts` |
| 2 | `Admin` persistant avec `password_hash` (`docs/005` §2.1, `docs/006` §2.2) vs auth Supabase Auth (`docs/004` §23) | **Pas de mot de passe en base.** Table de profil liée à `auth.users.id` | `docs/006` §2.2 précise lui-même que l'authentification est déléguée et que seules les informations applicatives sont conservées |
| 3 | Entités `Leader`, `Testimony`, `CommunityFace` absentes du schéma 5 tables | **Persistées** | Demande explicite du cahier d'implémentation §4 ; rendues dynamiquement par le frontend |
| 4 | `PageKey` = `ACCUEIL`/`QUI_SOMMES_NOUS`/`COMMUNAUTE`/`CONTACT` (`src/types`) vs `ACCUEIL`/`QUI_SOMMES_NOUS`/`ORGANISATION`/`CONTACT` (`docs/006` §7) | **Liste ouverte** pilotée par les `pageKey` existants en base | Les hubs ne sont plus des pages ; les clés réellement éditables sont les pages servies |
| 5 | IDs `INTEGER` (`docs/005`) vs `UUID / Integer` (`docs/006`) vs `string` en mock | **UUID v4** (sauf mention contraire) | `auth.users.id` est un UUID ; évite l'énumération publique ; évite les collisions de seed |
| 6 | `DRAFT`/`PUBLISHED` : « supprimable » (`docs/006` §20) vs opérations « publier / dé publier » exigées (cahier §8) | **Statut conservé sur `publications`** | L'exigence fonctionnelle d'administration est explicite et postérieure |

---

## 2. Emplacement et structure du backend

**Décision : même dépôt, dossier `server/`.** Un seul dépôt existe ; `docs/`,
frontend et backend restent co-localisés ; Railway pointera sa *Root Directory*
sur `server/`. Aucun indice dans la documentation ne justifie un dépôt séparé.

```text
CCJV-CHURCH/
├── src/                  # frontend Next.js (inchangé dans son architecture)
├── server/               # backend Express + TypeScript
│   ├── src/
│   │   ├── config/       # env validé par Zod
│   │   ├── domain/       # entities, types, contrats de repositories  (0 dépendance infra)
│   │   ├── application/  # services / use cases
│   │   ├── infrastructure/
│   │   │   ├── database/ # schéma Drizzle, client
│   │   │   ├── repositories/
│   │   │   ├── supabase/ # auth (JWKS) + storage
│   │   │   └── logger/
│   │   ├── presentation/ # routes, controllers, middlewares, DTO
│   │   ├── shared/       # erreurs, validation, http, slug
│   │   ├── app.ts        # composition root (DI)
│   │   └── server.ts
│   ├── drizzle/          # migrations versionnées (SQL généré)
│   ├── tests/
│   ├── drizzle.config.ts
│   ├── openapi.yaml      # généré depuis les schémas Zod
│   ├── Dockerfile
│   ├── railway.json
│   └── .env.example
└── docs/
```

La dépendance du `domain` vers l'infrastructure est **inverse** :
`domain/repositories/*.ts` déclarent des interfaces, `infrastructure/repositories`
les implémentent. `domain` n'importe ni Express, ni Drizzle, ni Supabase
(`docs/004` §8).

---

## 3. Besoin backend non documenté : les demandes de prière

`src/components/forms/PrayerRequestForm.tsx` collecte **intention, prénom
optionnel, contact optionnel et niveau de confidentialité**, puis **simule**
l'envoi (`setTimeout`) en affichant « Votre demande a bien été reçue ». Aucun
document ne mentionne cette fonctionnalité.

**Décision : implémenter `POST /api/v1/prayer-requests` et la table
`prayer_requests`.**

Justification : le formulaire existe, il promet une réception, et le principe
« jamais de faux système » interdit de laisser une simulation se faire passer
pour un envoi réel. Champs : `id`, `request_text`, `requester_name?`,
`requester_contact?`, `confidentiality` (`private` | `community`), `status`
(`NEW`|`PRAYED`), `created_at`, `handled_at?`.

Sécurité spécifique : endpoint **public** (aucune authentification requise pour
déposer une intention), donc **rate limité**, taille de texte bornée, et
**jamais exposé en lecture publique** — la consultation est réservée à
l'administration. C'est une donnée personnelle sensible : elle n'apparaît dans
aucune réponse publique et n'est jamais journalisée en clair.

---

## 4. Schéma de données final

14 tables. Pas de table « au cas où » : chacune sert une fonctionnalité
identifiée du frontend ou du back-office.

### 4.1 Authentification et administration

| Table | Colonnes | Notes |
| --- | --- | --- |
| `admin_profiles` | `id uuid PK` (= `auth.users.id`), `username citext UNIQUE`, `role` enum `ROLE_ADMIN`, `is_active bool`, `created_at`, `updated_at` | **Aucun mot de passe.** Le hash reste chez Supabase Auth |

`role` est un **enum extensible** (`ROLE_ADMIN` aujourd'hui) pour permettre
l'ajout de `ROLE_DEPARTMENT_EDITOR` sans migration destructrice — `docs/001` §3
et `docs/002` §6 prévoient des rôles plus fins hors V1.

### 4.2 Contenu dynamique

| Table | Colonnes principales | Contraintes / index |
| --- | --- | --- |
| `departments` | `id uuid PK`, `name`, `slug UNIQUE`, `description`, `responsible_name`, `tagline`, `meeting_schedule`, `banner_media_id FK→media`, `key_points text[]`, `position int`, `created_at`, `updated_at` | `slug` unique ; `position` pour l'ordre d'affichage |
| `events` | `id uuid PK`, `title`, `slug UNIQUE`, `description`, `excerpt`, `event_date date NOT NULL`, `event_time time`, `location`, `image_media_id FK→media`, `banner_media_id FK→media`, `department_id FK→departments NULL`, `practical_info text[]`, `created_at`, `updated_at` | **Pas de `is_archived`.** Index `(event_date)` ; index `(department_id)` |
| `publications` | `id uuid PK`, `title`, `slug UNIQUE`, `type` enum, `category` enum, `content_url`, `description`, `body text[]`, `author`, `published_at date NOT NULL`, `status` enum `DRAFT`\|`PUBLISHED`, `cover_media_id FK→media`, `created_at`, `updated_at` | Index `(published_at DESC)`, `(category)`, `(status)` |
| `leaders` | `id uuid PK`, `name`, `role`, `scope`, `bio`, `photo_media_id FK→media`, `department_id FK→departments NULL`, `position int`, `created_at`, `updated_at` | Annuaire des responsables |
| `testimonies` | `id uuid PK`, `quote`, `person_name`, `person_role`, `photo_media_id FK→media`, `position int`, `created_at`, `updated_at` | Témoignages |
| `community_faces` | `id uuid PK`, `person_name`, `caption`, `photo_media_id FK→media`, `position int`, `created_at`, `updated_at` | Visages (scrollytelling d'accueil) |

### 4.3 Contenu éditable structuré

| Table | Colonnes | Notes |
| --- | --- | --- |
| `static_pages` | `id uuid PK`, `page_key text UNIQUE`, `content jsonb NOT NULL`, `updated_at`, `updated_by FK→admin_profiles NULL` | Voir §5 |
| `scriptures` | `id uuid PK`, `key text UNIQUE` (ex. `rassemblement`), `text`, `reference`, `translation`, `context`, `created_at`, `updated_at` | Versets référencés par clé depuis les pages. `translation` par défaut `Louis Segond 1910` |
| `schedule_entries` | `id uuid PK`, `day`, `title`, `time_label`, `audience`, `is_confirmed bool`, `position int`, `created_at`, `updated_at` | Rythme hebdomadaire. `is_confirmed` reprend le flag `confirmed` du frontend |
| `social_links` | `id uuid PK`, `label`, `href`, `position int`, `created_at`, `updated_at` | Instagram, TikTok, etc. |
| `site_settings` | `key text PK`, `value text`, `updated_at` | Adresse, WhatsApp, dates de fondation, nom |

> **`site_settings` en clé/valeur est un choix délibéré et borné.** Il ne
> contient que des scalaires institutionnels déjà présents dans
> `src/data/mock/site.ts`. Tout ce qui est une liste ordonnée ou une entité a sa
> propre table. Cela évite de transformer le site en CMS générique
> (cahier §9) tout en rendant ces valeurs éditables.

### 4.4 Médias

| Table | Colonnes | Notes |
| --- | --- | --- |
| `media` | `id uuid PK`, `bucket`, `path UNIQUE`, `public_url`, `mime_type`, `size_bytes`, `width`, `height`, `alt`, `uploaded_by FK→admin_profiles NULL`, `created_at` | Registre des fichiers réellement téléversés |
| `event_media` | `event_id FK`, `media_id FK`, `position int`, PK composite | Galerie ordonnée |
| `department_media` | `department_id FK`, `media_id FK`, `position int`, PK composite | Galerie ordonnée |

### 4.5 Le contrat API expose des URL, la base stocke des références

`src/types/index.ts` déclare `imageUrl?: string`, `bannerImage?: string`,
`gallery?: string[]`, `contentUrl?: string`, `photo?: string`. C'est le contrat
du frontend et il ne doit pas bouger.

**Décision :** en base, ces champs sont des références `media` (intégrité,
traçabilité, pas d'orphelin silencieux) ; en API, ils sont **sérialisés en URL
publiques** — le contrat documenté est strictement respecté. Les galeries sont
résolues depuis les tables de jointure et renvoyées en `string[]` ordonné.

---

## 5. Structuration de `static_pages.content`

`docs/017` §20 Q2 laisse le choix entre texte libre, JSON structuré ou blocs.
`docs/005` §2.5 dit « texte riche / HTML simple » ; `docs/017` §16-4 objecte que
le contenu réel est multi-sections.

**Décision : `jsonb` validé par un registre Zod, un schéma par `page_key`.**

```ts
// server/src/domain/content/page-content.ts
export const pageContentSchemas = {
  accueil: z.object({
    hero: z.object({ title: z.string().max(120), intro: z.string().max(600) }),
    // …uniquement des champs TEXTUELS nommés
  }),
  "qui-sommes-nous": z.object({ /* … */ }),
} satisfies Record<string, z.ZodTypeAny>
```

Trois raisons :
1. Le back-office édite des **champs nommés**, pas du HTML — pas de risque
   d'injection ni de mise en page cassée par un éditeur.
2. Le schéma Zod **est** la source de vérité, donc OpenAPI et validation restent
   alignés (`docs/004` §15).
3. Les `page_key` inconnues sont rejetées : impossible d'écrire un contenu que le
   frontend ne saura pas lire.

**Ce qui n'est PAS dans `static_pages` :** la mise en page, l'ordre des sections,
les listes (événements, publications, départements) — elles viennent de leurs
tables.

---

## 6. Contrat API `/api/v1`

### 6.1 Ressources publiques (lecture seule)

| Méthode | Route | Filtres |
| --- | --- | --- |
| `GET` | `/events` | `page`, `limit`, `status` (`UPCOMING`\|`ARCHIVED`), `departmentId`, `sort` |
| `GET` | `/events/:idOrSlug` | — |
| `GET` | `/departments` | `page`, `limit` |
| `GET` | `/departments/:idOrSlug` | — |
| `GET` | `/publications` | `page`, `limit`, `type`, `category`, `sort` |
| `GET` | `/publications/:idOrSlug` | — |
| `GET` | `/leaders` · `/testimonies` · `/community-faces` | `page`, `limit` |
| `GET` | `/schedule` | — |
| `GET` | `/scriptures` · `/scriptures/:key` | — |
| `GET` | `/settings` | — (regroupe `site_settings` + `social_links`) |
| `GET` | `/pages/:pageKey` | — |
| `POST` | `/prayer-requests` | **public**, rate limité |
| `GET` | `/health` | — |

Les ressources publiques **ne renvoient jamais** de contenu `DRAFT`, ni de
donnée administrative, ni `prayer_requests`.

### 6.2 Ressources d'administration (authentifiées + `ROLE_ADMIN`)

`POST` / `PATCH` / `DELETE` sur `/events`, `/departments`, `/publications`,
`/leaders`, `/testimonies`, `/community-faces`, `/schedule`, `/scriptures`,
`/social-links`, `/settings`, `PATCH /pages/:pageKey`, `POST /media`,
`GET /prayer-requests`.

`GET /admin/me` retourne le profil et le rôle — utilisé par le back-office.

### 6.3 Conventions

- **Réponses de collection** : `{ data: [], meta: { page, limit, total, totalPages } }`.
- **Réponse individuelle** : la ressource directement.
- **Erreurs** : `{ error: { code, message, details? } }`.
- **Codes** : ceux de `docs/004` §26 (`AUTH_REQUIRED`, `FORBIDDEN`,
  `VALIDATION_ERROR`, `*_NOT_FOUND`, `DUPLICATE_SLUG`, `FILE_TOO_LARGE`,
  `INVALID_FILE_TYPE`, `INTERNAL_ERROR`) complétés par `RATE_LIMITED` et
  `UNAUTHENTICATED_ADMIN`.
- **Pagination** : `page` ≥ 1 (défaut 1), `limit` 1–100 (défaut 20).
- **Tri** : `sort` en liste blanche par ressource — jamais un nom de colonne
  libre.
- **Identifiant** : `:idOrSlug` accepte un UUID **ou** un slug, ce qui permet au
  frontend d'utiliser ses URL actuelles (`/publications/[slug]`) sans requête
  supplémentaire. Deux modules font exception sur le **nom** du paramètre, pas
  sur son sens : `enseignements` et `resources` nomment `:id` toutes leurs routes
  (la lecture y accepte toujours un UUID ou un slug), parce qu'un contrat
  OpenAPI ne peut pas porter deux gabarits équivalents (`{id}` et `{idOrSlug}`)
  pour la même URL.
- **Slug — arbitrage du 23/10/2026 : une adresse, pas une identité.** Un slug
  explicite déjà pris est désormais **suffixé** (`mon-titre`, `mon-titre-2`,
  `mon-titre-3`…) au lieu d'être refusé en `409 DUPLICATE_SLUG`. Motif : les
  titres éditoriaux ne doivent pas être contraints par l'URL (deux « Culte du
  dimanche », deux « Enseignement du mercredi » sont légitimes). L'identité
  canonique reste l'`id` UUID — les routes `:idOrSlug` acceptent les deux — et
  le slug reste lisible pour le référencement. Le code `DUPLICATE_SLUG` subsiste
  dans `docs/004` §26 pour mémoire, mais **aucune route applicative ne le lève
  plus** : le seul cas résiduel serait une collision concurrente sur
  `publications.slug`, protégée par son index unique. Un slug **UUID brut**
  n'a pas été retenu : il rendrait les URL illisibles sans rien apporter, la
  base identifiant déjà chaque ressource par un UUID.

---

## 7. Authentification et autorisation

**Authentification** (`docs/004` §23) : jeton `Authorization: Bearer <token>`
vérifié côté serveur. La signature est validée contre les clés publiques JWKS de
Supabase (`/auth/v1/.well-known/jwks.json`, mise en cache), avec vérification de
`exp`, `aud` et `iss`. **Aucun appel réseau par requête** : le JWKS est mis en
cache — contrainte de performance `docs/006` §22.

**Autorisation** : distincte et centralisée.

```text
requireAuth       → jeton valide ?                       sinon 401 AUTH_REQUIRED
requireRole(...)  → rôle suffisant ?                     sinon 403 FORBIDDEN
requireSelf       → ressource dans le périmètre ?        sinon 403 FORBIDDEN
```

Un middleware unique `authorize(policy)` consomme une politique déclarative par
route. Aucune vérification de rôle dispersée dans un controller (cahier §26).

`ROLE_ADMIN` est le seul rôle actif en V1 ; l'enum et le registre de permissions
sont conçus pour accueillir des rôles fins sans réécriture (`docs/004` §24).

---

## 8. Médias et Supabase Storage

- **Bucket** : `ccjv-media` (public en lecture, écriture serveur uniquement).
- **Dossiers** : `events/`, `departments/`, `publications/`, `leaders/`,
  `testimonies/`, `community/`, `pages/`, `resources/` — un préfixe par usage.
- **Types autorisés** : `image/jpeg`, `image/png`, `image/webp`, `image/avif`.
  **Taille max : 5 Mo.**
- **Vérification par signature binaire** (*magic bytes*), pas seulement par
  l'extension ou le `Content-Type` déclaré : un client peut mentir (cahier §14).
- **Nom de fichier généré côté serveur** (`<uuid>.<ext>` déduit du type réel) :
  aucun nom fourni par le client n'atteint le Storage.
- **Suppression** : refuse par défaut si le média est référencé (intégrité), sauf
  `?force=true` explicite.
- Le `SUPABASE_SERVICE_ROLE_KEY` ne quitte **jamais** le serveur (`docs/004` §33).

### 8.1 Exception documentaire : PDF et dossier `resources/` (arbitrage du 23/10/2026)

L'espace **Ressources** promet des documents téléchargeables ; le stockage, lui,
n'acceptait que des images. Le formulaire de dépôt envoyait donc un PDF vers
`pages/` et recevait `415 INVALID_FILE_TYPE` : la fonctionnalité n'a jamais pu
servir.

Décision retenue — **exception portée par le dossier, pas élargissement
global** :

- `resources/` est le **seul** dossier qui accepte `application/pdf` (magic
  bytes `%PDF-`), et il n'accepte **que** cela : une photo n'y a pas de sens,
  la fiche annonçant un document.
- Tous les autres dossiers restent strictement image. Un PDF dans `events/` est
  refusé comme avant : le site y attend une illustration.
- **Plafonds distincts** : 5 Mo pour les images (les pages publiques n'ont rien
  à gagner d'une photo plus lourde), `MAX_UPLOAD_BYTES` — porté à 20 Mo — pour
  les documents, un PDF de brochure dépassant régulièrement 5 Mo.
- Les dimensions (`width`/`height`) restent `NULL` pour un document : elles ne
  sont mesurées que sur une image.

---

## 9. Erreurs, logs, observabilité

- Hiérarchie d'erreurs applicative (`AppError` → `NotFoundError`,
  `ValidationError`, `ConflictError`, `AuthError`, `ForbiddenError`,
  `PayloadTooLargeError`, `UnsupportedMediaTypeError`).
- Middleware d'erreur unique en fin de pipeline : traduit l'erreur en réponse
  normalisée. **En production, aucune stack trace ni message interne** — corps
  générique `INTERNAL_ERROR`, détail uniquement dans les logs serveur.
- Journalisation structurée JSON (`pino`) avec `requestId` par requête.
- **Jamais journalisés** : jeton, en-tête `Authorization`, corps des demandes de
  prière, identifiants de contact, secrets.
- Chaque écriture administrative produit une ligne d'audit structurée
  (`action`, `resource`, `resourceId`, `adminId`, `result`).

---

## 10. Performance

- Pagination obligatoire sur toutes les collections.
- Sélection explicite des colonnes ; jamais de `SELECT *` sur une jointure large.
- **Pas de N+1** : les médias et départements sont chargés par jointure ou par
  `IN (...)` groupé, jamais en boucle.
- Index posés sur `events(event_date)`, `events(department_id)`,
  `publications(published_at DESC)`, `publications(category)`,
  `publications(status)`, tous les `slug`, toutes les FK.
- Cache HTTP : `Cache-Control: public, max-age=60, stale-while-revalidate=300` sur
  les lectures publiques ; `no-store` sur les routes d'administration.
- Compression `gzip`/`brotli` via `compression`.

---

## 11. Tests

Sans dépendance à une base distante pour être exécutables :

| Niveau | Objet | Outil |
| --- | --- | --- |
| Unitaire | Services métier (génération de slug, calcul de statut, règles de publication) | Vitest |
| Unitaire | Schémas Zod (cas valides **et** invalides) | Vitest |
| Unitaire | Middlewares d'autorisation (401 / 403 / passage) | Vitest + jetons signés de test |
| Unitaire | Vérification de fichiers (MIME, taille, magic bytes) | Vitest |
| Intégration | Repositories sur PostgreSQL réel | Vitest + base de test |
| Bout en bout | Endpoints critiques via `supertest` | Vitest |

Les cas négatifs exigés au cahier §21 sont couverts explicitement : non
authentifié, sans permission, données invalides, ressource inexistante, conflit
de slug, accès à une ressource interdite.

---

## 13. Environnement de vérification — RÉSOLU

Un projet Supabase a été provisionné via la CLI, la stack locale étant
impossible (Docker installé mais **WSL2 absent** de la machine).

| Élément | Valeur |
| --- | --- |
| Projet | `ccjv-church` |
| Référence | `fcdyqwconmymcznsaykw` |
| Région | Central EU (Francfort) |
| Organisation | `zpiouipvljtebodcpyif` |
| Hôte base | `aws-1-eu-central-1.pooler.supabase.com:5432` (mode session) |

**Le pooler est obligatoire** : l'hôte direct `db.<ref>.supabase.co` ne possède
aucun enregistrement `A`. Le projet est IPv6-only, inutilisable depuis un réseau
IPv4. Deux hôtes de pooler existaient ; `aws-0` répondait
« tenant/user not found » — c'est `aws-1` qui héberge ce projet.

Les secrets vivent dans `backend/.env`, ignoré par Git.

### Vérifications réellement effectuées

| Critère du cahier §29 | État | Preuve |
| --- | --- | --- |
| Les migrations fonctionnent | **Vérifié** | 16 tables et 6 enums créés en base ; 1 migration enregistrée dans `drizzle.__drizzle_migrations` |
| L'authentification fonctionne | **Vérifié** | Connexion réelle, jeton `aud=authenticated` / `iss` conforme, vérification JWKS réussie |
| Le schéma est fonctionnel | **Vérifié** | Colonnes, index, contraintes et FK lus depuis `information_schema` |
| Les médias fonctionnent | Voir `backend/README.md` | Bucket de stockage et cycle upload/suppression |
| Le backend peut être déployé | Préparé | `Dockerfile` multi-étapes, `railway.json`, health check sur la base |

### Compte administrateur d'amorçage

Créé par `backend/scripts/create-admin.ts` (compte Supabase Auth + profil
`admin_profiles` avec `ROLE_ADMIN`). Le mot de passe n'est **jamais** stocké en
base : il appartient à Supabase Auth.

---

## 14. Reste à fournir par CCJV (hors périmètre du code)

Ces éléments ne peuvent pas être inventés et ne bloquent pas l'implémentation :

1. **Confession de foi CCJV** (19 emplacements `TODO` du frontend).
2. **Identités réelles** des responsables, témoignages, visages communauté.
3. **Horaires confirmés** du culte dominical et de l'Ecodim.
4. **Numéro WhatsApp réel** (actuellement `+243 123 456 789`, démonstration).
5. **Liens YouTube réels** des enseignements (les deux liens actuels sont des
   valeurs de démonstration).
