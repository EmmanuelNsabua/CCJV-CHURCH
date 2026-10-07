# 026 — Plan directeur d'implémentation du backend

> **Nature :** plan de réalisation. **Aucun code applicatif n'est écrit à ce stade** —
> `docs/025` §21 et §23 l'interdisent explicitement avant validation.
> **Structure imposée par :** `docs/025-prompt_maitre_conception_roadmap_backend.md`.
> **Sources :** `docs/020` → `docs/025`, code `backend/`, types et mocks `frontend/src/`.
> **Règle de priorité appliquée :** décision métier > modèle métier > UML >
> architecture logicielle > documentation historique > code existant.

---

# ÉTAPE A — Audit de préparation

## A.1 Ce qui existe réellement

Le backend **n'est pas vierge** : une première implémentation a été livrée,
testée et déployée, mais elle a été conçue **avant** la publication des documents
020 à 024, sur le modèle à 5 tables de `docs/005`/`docs/006`.

| Élément | État réel vérifié | Preuve |
| --- | --- | --- |
| Express + TypeScript + Drizzle | Existant | `backend/src/` |
| Architecture 4 couches | Existante | `domain/`, `application` (modules), `infrastructure/`, `presentation/` |
| PostgreSQL Supabase | Migré | 16 tables appliquées |
| Migrations versionnées | Existantes | `backend/drizzle/0000_*.sql` |
| Authentification Supabase | Fonctionnelle | JWKS validé, jeton réel vérifié |
| Autorisation | **Un seul rôle** | `ROLE_ADMIN` dans `admin.ts` |
| Modules métier | 14 modules | departments, events, publications, media, leaders, testimonies, community-faces, scriptures, schedule, social-links, settings, static-pages, prayer-requests, admin |
| Tests | 13 suites, **363 tests** | `npm test` |
| OpenAPI | 28 chemins, 60 opérations | `openapi.json` |
| Déploiement Railway | **En ligne** | `https://ccjv-api-production.up.railway.app` |
| Seed | 28 médias, 70 lignes | `seed.ts` |

## A.2 Ce qui manque au regard du modèle 020–024

Vérifié par comptage sur les documents de conception **et** sur le code :

| Concept du modèle | Occurrences dans `docs/020–025` | Occurrences dans le code | Verdict |
| --- | --- | --- | --- |
| `Ecodume` | 56 | **0** | **Conflit total — voir A.3** |
| `Ecodim` | **0** | **97** | Idem |
| `SUPER_ADMIN` | 16 | 0 | À créer |
| `DEPARTMENT_MANAGER` | 19 | 0 | À créer |
| `ROLE_ADMIN` | **0** | rôle unique existant | **Rôle inexistant dans le modèle** |
| Scopes `GLOBAL` / `DEPARTMENT` / `PRIVATE` | 19 / 56 / 10 | 0 | À créer |
| `PENDING` (prière) | 11 | 0 | À créer |
| `PRAYED` | **0** | état existant | **État inexistant dans le modèle** |
| `ARCHIVED` (publication) | 35 | 0 | À créer |
| `MediaAccess` | 38 | 0 | À créer |
| `Notification` | 44 | 0 | À créer |
| `archived_at` | 1 | 0 | À créer |
| `HouseGroup` | 5 | — | **À ne pas créer** (non-entité) |
| `Affaires Sociales` | 4 | 0 | À créer |
| `Presse` | 34 | 0 | À créer |

**Conclusion de l'audit :** il ne s'agit pas d'étendre le backend existant, mais
de **refondre son socle d'identité et d'autorisation** et d'**étendre son modèle
de contenu**. Les lot 0 et 1 de `docs/025` correspondent donc à un travail réel,
pas à une formalité.

## A.3 Conflits identifiés

### C1 — Nom du département enfants : `Ecodim` vs `Ecodume` (BLOQUANT)

Le modèle impose `Ecodume` comme **nom canonique** (`docs/025` §5.3) — 56
occurrences dans les documents 020–025, **zéro** occurrence de `Ecodim`.
Le code contient **97 occurrences d'`Ecodim`** et aucune d'`Ecodume`.

**Portée du conflit :** libellés frontend, données déjà en base
(`departments.name = "Enfants / Ecodim"`), seed, documentation 001–019.

`docs/025` §20 interdit de modifier silencieusement le modèle métier.
**Ce conflit n'est pas résolu par le présent plan** : il est porté en décision
bloquante **DB-1**.

### C2 — Départements divergents

| Modèle (`docs/025` §5.3) | Base actuelle (seed) |
| --- | --- |
| Presse | Adultes |
| Ecodume | Enfants / Ecodim |
| Affaires Sociales | Chorale |

Aucune correspondance terme à terme. **DB-2** : les départements actuels sont-ils
à conserver, renommer, ou remplacer ?

### C3 — Rôle applicatif inexistant dans le modèle

`ROLE_ADMIN` n'apparaît **nulle part** dans 020–025. Le modèle définit
`SUPER_ADMIN`, `ADMIN`, `DEPARTMENT_MANAGER`. L'enum `admin_role` actuel est donc
obsolète, et le compte administrateur déjà créé en production devra être migré.
**DB-3** : quel rôle attribuer aux comptes existants lors de la migration ?

### C4 — États de prière

Le modèle prévoit `PENDING`/`ARCHIVED` ; le code utilise `NEW`/`PRAYED`.
`PRAYED` n'existe pas dans le modèle. Migration d'enum requise.

### C5 — Champs de prière incompatibles avec l'exigence de confidentialité

Le code stocke `requester_contact` (WhatsApp/téléphone). `docs/025` §9 précise :
*« Le visiteur peut être anonyme ou identifié uniquement par son nom. Pas
d'e-mail ni de téléphone à ce stade. »* Le champ doit être **supprimé** — et les
données déjà collectées le cas échéant traitées selon **DB-4**.

### C6 — Événements globaux : décision non vérifiée

`docs/025` §Lot 6 impose : *« vérifier avant implémentation la décision finale
concernant les événements globaux. Ne pas inventer cette règle. »* Le code actuel
autorise `department_id = NULL` (événement général). **Je n'ai pas pu vérifier
cette décision** dans les documents 021–024 faute de lecture intégrale.
Porter en décision bloquante **DB-5** — ne pas présumer.

---

# ÉTAPE B — Matrice de réalisation

| Élément | Modèle | Code existant | À créer | Dépendances | Critère de fin |
| --- | --- | --- | --- | --- | --- |
| Base de données | 020–024 | 16 tables (ancien modèle) | ~8 tables, 2 enums modifiés | — | Migration reproductible, `db:migrate` idempotent |
| Migrations | Drizzle | 1 migration | Migrations additives + migration de données | DB-1, DB-2, DB-3 | Base reconstruite depuis zéro sans erreur |
| Auth | Supabase Auth | Opérationnelle | Contexte utilisateur enrichi | — | Jeton vérifié, profil chargé |
| Users | Profil admin | `admin_profiles` | Champs `role`, `scope`, `department_id` | C3 | 4 rôles persistables |
| Roles | 4 rôles | `ROLE_ADMIN` | Enum `SUPER_ADMIN`/`ADMIN`/`DEPARTMENT_MANAGER` | DB-3 | Enum migré sans perte |
| Scopes | 3 scopes | — | Enum `GLOBAL`/`DEPARTMENT`/`PRIVATE` | — | Scope porté par le profil |
| Departments | Entité | 3 lignes seedées | Jeu conforme au modèle | DB-1, DB-2 | CRUD + association utilisateurs |
| Publications | Dépt. obligatoire, 3 max | Dépt. optionnel, 2 états | `ARCHIVED`, `archived_at`, règle des 3 | Lot 2 | Règle atomique testée sous concurrence |
| Events | Périmètre à confirmer | CRUD complet | Scope départemental éventuel | DB-5 | Conforme à la décision retenue |
| Media | Bibliothèque globale | `media` sans droits | Inchangé (pas de `department_id`) | — | Aucun `department_id` ajouté |
| MediaAccess | USE/MANAGE/DELETE | **Absent** | Table + policies | Lot 1 | Publication ne référence que des médias autorisés |
| Pages | Éditoriales structurées | `static_pages` JSON | Templates + schémas par page | Lot 1 | Structure non éditable par le back-office |
| PrayerRequest | PENDING/ARCHIVED, privée | NEW/PRAYED + contact | Crypto, états, suppression contact | Lot 1, DB-4 | Super Admin techniquement incapable de lire |
| Notifications | Entité persistée | **Absente** | Table + destinataires + lu/non-lu | Lot 2 | Notification sans contenu de prière |
| Settings | Config | `site_settings` | Inchangé | — | Éditable, clés en liste blanche |
| API | REST `/api/v1` | 60 opérations | Nouvelles routes scopées | Lots 1–9 | Convention homogène |
| OpenAPI | Contrat | 28 chemins | Mis à jour à chaque lot | Lots 1–9 | Reflète le comportement réel |
| Tests | §12 Lot 12 | 363 tests | Tests RBAC, crypto, concurrence | Chaque lot | Matrice de tests couverte |
| Intégration frontend | Lot 11 | Partielle | Mocks restants remplacés | Lots 3–9 | Aucun fallback trompeur |

---

# ÉTAPE C — Découpage en lots

## Lot 0 — Fondations — *déjà largement réalisé*

Structure, configuration validée par Zod, Express, TypeScript, Drizzle,
connexion PostgreSQL, erreurs normalisées, logging à champs masqués, validation
Zod, Jest, conventions (`IMPLEMENTATION_SPEC.md`).

**Reste à faire :** ESLint n'est **pas** configuré côté backend — `npm run lint`
échoue. À combler ici, car un socle sans lint n'est pas un socle.

## Lot 1 — Identité et autorisation *(le vrai point de départ)*

Supabase Auth (existant), contexte utilisateur, profils, **4 rôles**,
**3 scopes**, association départementale, middleware d'authentification,
`AuthorizationService`, policies centralisées.

**Critères essentiels :** `ADMIN`, `DEPARTMENT_MANAGER + Presse`,
`DEPARTMENT_MANAGER + Ecodume`, `SUPER_ADMIN` produisent des décisions
cohérentes. Le RBAC **ne code pas en dur** `PRESSE` ou `ECODUME` comme rôles.

## Lot 2 — Départements et utilisateurs

`Department`, gestion des responsables, création de comptes par l'Admin,
activation/désactivation, association rôle + scope + département.

**À tester explicitement :** ADMIN crée un Responsable Presse / Ecodume ;
ADMIN **ne peut pas** créer un SUPER_ADMIN ; Presse **n'accède pas** à Ecodume ;
Ecodume **n'accède pas** à Presse.

## Lot 3 — Pages éditoriales structurées

Modèle Page, templates, validation Zod des contenus, lecture publique,
lecture/édition back-office, protection de la structure, fallback et états vides.
**Aucun page builder** : le back-office édite des champs, jamais la structure.

## Lot 4 — Publications

CRUD, statut à 3 états, **département obligatoire**, `published_at`,
`archived_at`, permissions, pagination et filtres.

Puis la règle : **3 `PUBLISHED` maximum par département**, transactionnelle et
sûre en concurrence. Les brouillons ne comptent pas. L'archivage est **persistant**
— jamais un simple filtre dynamique.

## Lot 5 — Médiathèque

`Media`, Storage, upload, métadonnées, **`MediaAccess`**, permissions
USE/MANAGE/DELETE, contrôle MIME/type/taille, suppression, orphelins.

**À tester :** média global + accès Presse + accès Ecodume, et les refus.

## Lot 6 — Événements

CRUD, dates, localisation, publication, lecture publique, périmètre
départemental **si confirmé** (DB-5). **Ne pas inventer la règle des
événements globaux.**

## Lot 7 — Notifications

Notification, destinataires, lecture, marquage comme lu, persistance.
Préparer l'intégration avec `PrayerRequest`. **Aucun contenu de prière dans la
notification.**

## Lot 8 — Demandes de prière *(priorité sécurité)*

Endpoint public, validation, rate limiting, anti-abus, **chiffrement**, stockage,
policy privée, déchiffrement Admin, archivage, notification, audit sans contenu
sensible.

**Préalable obligatoire :** produire une **mini-spécification cryptographique
validée** avant d'écrire la moindre ligne de crypto. Voir Étape I.7 (DB-6 à DB-9).
`docs/025` §Lot 8 : *« Ne jamais implémenter un chiffrement approximatif
uniquement pour faire fonctionner le MVP. »*

## Lot 9 — Settings et données éditoriales complémentaires

Décider, **pour chacun**, s'il s'agit d'une donnée persistée, d'une
configuration, d'un contenu éditorial, d'une donnée dérivée ou d'un mock à
supprimer : `SiteSettings`, `SocialLink`, `ScheduleEntry`, `Verse`,
`RhythmEntry`, `Leader`, `Testimony`, `CommunityFace`.

**État actuel :** tous sont **déjà persistés** dans mon implémentation.
`docs/025` §Lot 9 avertit : *« Ne pas créer automatiquement une table pour chaque
type frontend. »* Ce lot doit donc **justifier ou retirer** ces tables —
c'est un travail de réduction, pas d'ajout.

## Lot 10 — API et contrat OpenAPI

Formaliser méthodes, paramètres, DTO, authentification, permissions, scopes,
réponses, erreurs, pagination, filtres. OpenAPI doit refléter le comportement
réellement implémenté.

## Lot 11 — Intégration frontend

Ordre imposé : pages dynamiques → pages éditoriales → événements →
publications → départements → médias → recherche/sitemap.

**Supprimer les faux succès et les fallbacks trompeurs identifiés par l'audit** —
notamment le formulaire de prière qui simulait l'envoi (désormais réel) et les
replis silencieux vers les mocks.

## Lot 12 — Tests et durcissement

Unitaires (policies, services, archivage, validation, crypto abstraite),
intégration (PostgreSQL, repositories, API, Auth, Storage, transactions),
fonctionnels (workflows, RBAC, publications, médias, prières),
sécurité (accès inter-départements, Super Admin vs prières, endpoints publics,
rate limiting, uploads, fuites).

---

# ÉTAPE D — Dépendances

```text
Lot 0  Fondations (quasi fait, + ESLint)
   ↓
Lot 1  Identité et autorisation          ← PRIMITIVE : conditionne tout
   ↓
Lot 2  Départements et utilisateurs
   ↓
   ├── Lot 3  Pages éditoriales
   ├── Lot 4  Publications (règle des 3)
   ├── Lot 5  Médiathèque + MediaAccess
   └── Lot 6  Événements (sous DB-5)
        ↓
Lot 7  Notifications
   ↓
Lot 8  Demandes de prière (crypto)       ← après Lot 1 et Lot 7
   ↓
Lot 9  Settings et données complémentaires (réduction)
   ↓
Lot 10 API et OpenAPI
   ↓
Lot 11 Intégration frontend
   ↓
Lot 12 Tests et durcissement
```

**Corrections apportées à l'ordre proposé par `docs/025` :**

1. `docs/025` §13 place « Intégration frontend » **avant** « Tests finaux ».
   Je conserve cet ordre, mais **le Lot 12 n'est pas un lot terminal** : chaque
   lot doit apporter ses propres tests (Étape E). Le Lot 12 ne fait que combler
   les trous transverses et durcir.
2. `docs/025` §13 suggère `Lot 4 / Lot 5 / Lot 6` en parallèle. Les Lots 4 et 5
   dépendent **tous deux du Lot 2** (département obligatoire pour les
   publications ; `MediaAccess` par département) mais **pas l'un de l'autre** :
   la parallélisation est donc valide, à condition d'avoir tranché DB-1 et DB-2.
3. **Le Lot 9 doit passer avant le Lot 10**, car retirer des tables après avoir
   documenté leurs endpoints obligerait à réécrire le contrat OpenAPI.
4. **Le Lot 8 exige le Lot 1** (policy privée, refus Super Admin) **et le Lot 7**
   (notification à la création). Il ne peut pas être avancé, malgré sa priorité
   de sécurité : sa priorité est de **qualité**, pas d'ordonnancement.

---

# ÉTAPE E — Definition of Done par lot

Un lot n'est **pas** terminé parce que le code compile. Il l'est lorsque :

| Critère | Vérification |
| --- | --- |
| Comportement métier implémenté | Démonstration sur données réelles |
| Validations présentes | Schémas Zod + tests de cas négatifs |
| Autorisations testées | Tests 401/403 par rôle **et par scope** |
| Tests nécessaires passants | `npm test` vert, aucun test affaibli |
| Migrations reproductibles | Base reconstruite depuis zéro |
| API documentée | OpenAPI régénéré et conforme au comportement réel |
| Erreurs gérées | Codes normalisés, pas de fuite interne |
| Logs sans donnée sensible | Contrôle des sérialiseurs |
| Aucune règle métier côté frontend uniquement | Revue des pages concernées |

**Spécifique au Lot 1 :** les quatre combinaisons rôle × scope produisent des
décisions **explicites et testées**, y compris les refus.
**Spécifique au Lot 8 :** un test démontre qu'un `SUPER_ADMIN` **échoue** à lire
une prière, et que le déchiffrement est refusé **avant** d'être tenté.

---

# ÉTAPE F — Ordre d'implémentation

1. Fondations (Lot 0, compléter ESLint)
2. **Sécurité et identité (Lot 1)** — primitive conditionnant tout le reste
3. Modèle de données (Lots 2, 3, 4, 5, 6, 7, 9)
4. Règles métier (règle des 3, `MediaAccess`, états)
5. API et OpenAPI (Lot 10)
6. Intégration frontend (Lot 11)
7. Tests et durcissement (Lot 12)

Conforme au §15 : on ne commence pas par les fonctionnalités les plus visibles.

---

# ÉTAPE G — Risques

| # | Risque | Impact | Probabilité | Mitigation | Dépendance |
| --- | --- | --- | --- | --- | --- |
| **R1** | **Cryptographie des prières** : clé globale accessible au backend → Super Admin capable de lire | **Critique** — détruit la promesse faite aux fidèles | **Élevée** sans spécification préalable | Mini-spécification validée avant code ; séparation des privilèges ; autorisation **avant** déchiffrement ; refus testé | DB-6 → DB-9 |
| **R2** | **Concurrence sur l'archivage** : deux publications simultanées → 4 `PUBLISHED` | Élevé — règle métier violée silencieusement | Moyenne | Transaction + verrou ; test de concurrence explicite | Lot 4 |
| **R3** | **RBAC mal appliqué** : policy dispersée ou oubliée sur une route | **Critique** — fuite inter-départements | **Élevée** si non centralisé | Policies centralisées ; test paramétré de **toutes** les routes protégées (déjà en place, à étendre aux scopes) | Lot 1 |
| **R4** | **Fuite de données sensibles** dans logs ou notifications | **Critique** | Moyenne | Sérialiseurs masquants (existants) ; notification sans contenu ; audit sans contenu | Lots 7, 8 |
| **R5** | **Incohérence frontend/backend** : 97 occurrences d'`Ecodim` contre un modèle qui dit `Ecodume` | Élevé — confusion durable | **Certaine** (constatée) | Trancher DB-1 avant tout ; migration de données + libellés | DB-1 |
| **R6** | **Médias accessibles sans autorisation** | Élevé | Moyenne | `MediaAccess` avec USE/MANAGE/DELETE distincts ; test « Presse ↔ Ecodume » | Lot 5 |

---

# ÉTAPE H — Périmètre MVP

## Indispensable

Lot 0 (dont ESLint), Lot 1 complet, Lot 2, Lots 3–6, Lot 7 (au moins la
persistance), Lot 8, Lot 10, puis Lot 11 sur les pages déjà dynamiques et Lot 12
sur les parcours critiques.

**Justification :** sans le Lot 1, aucun cloisonnement n'existe — or c'est la
raison d'être des responsables Presse et Ecodume. Sans le Lot 8, la promesse de
confidentialité n'est pas tenue. Ces deux lots ne sont pas négociables.

## Livrable plus tard

- **Lot 9 (réduction)** : la réduction des tables complémentaires peut suivre la
  mise en service ; elle n'ajoute aucun risque de sécurité.
- **Lot 11, points 6 et 7** (médias, recherche/sitemap) : dépendent de sources
  stabilisées, sans impact sur la promesse faite aux fidèles.
- Historique/audit avancé, tableaux de bord riches.

## Hors périmètre

- **Page builder** — interdit par `docs/025` §8.
- **`HouseGroup` comme entité autonome** — explicitement exclu (§5.3).
- **E-mail / téléphone sur les demandes de prière** — exclus (§9).
- **Accès des Department Managers et du Super Admin aux prières** — refusé par
  conception (§9).

**Exclusion justifiée à signaler :** je place la **réduction du Lot 9** hors du
chemin critique. Créer des tables inutiles est un défaut, mais en **retirer**
après mise en service expose à une perte de données. La prudence commande de
livrer d'abord, de réduire ensuite — avec sauvegarde.

---

# ÉTAPE I — Livrables

## I.1 Architecture d'implémentation

```text
backend/src/
├── config/                 env validé par Zod
├── domain/
│   ├── entities/           types métier purs (aucune dépendance infra)
│   ├── rules/              règles : statut, règle des 3, archivage
│   └── repositories/       contrats (interfaces)
├── modules/                un dossier par ressource
│   └── <ressource>/        schema · serializer · service · controller · routes
├── infrastructure/
│   ├── database/           schéma Drizzle · migrations · seed
│   ├── repositories/       implémentations Drizzle
│   ├── supabase/           client · auth (JWKS) · storage
│   ├── crypto/             (Lot 8) chiffrement des prières
│   └── logger/             journalisation masquée
├── presentation/
│   ├── middlewares/        auth · authorize · validate · error-handler
│   └── openapi/            contrat
├── shared/
│   ├── errors/             hiérarchie + 24 codes
│   ├── http/               réponse · pagination
│   └── utils/
├── container.ts            injection de dépendances
├── app.ts                  composition Express
└── server.ts               démarrage et arrêt propre
```

**Nouveaux dossiers par rapport à l'existant :** `infrastructure/crypto/`
(Lot 8) et, dans `domain/rules/`, les règles de publication (Lot 4).

## I.2 Plan de migration

Ordre imposé par les dépendances :

1. `ALTER TYPE admin_role` → `SUPER_ADMIN`, `ADMIN`, `DEPARTMENT_MANAGER`
   *(additif avant retrait — jamais l'inverse)*
2. Enum `user_scope` → `GLOBAL`, `DEPARTMENT`, `PRIVATE`
3. `admin_profiles` : + `scope`, + `department_id` (FK nullable)
4. Enum `publication_status` : + `ARCHIVED`
5. `publications` : + `archived_at`, `department_id` **NOT NULL**
6. Enum `prayer_status` → `PENDING`, `ARCHIVED` ; `prayer_requests` :
   − `requester_contact`
7. Table `media_access` (`media_id`, `department_id`, `can_use`, `can_manage`,
   `can_delete`)
8. Table `notifications` (+ destinataires)
9. **Migrations de données** : renommage Ecodume (DB-1), reprise des
   départements (DB-2), reprise des rôles (DB-3), reprise des états de prière.

⚠️ **Aucune migration destructive ne sera appliquée sans sauvegarde préalable.**

## I.3 Plan API

Ordre d'implémentation (nouveautés en gras) :

| # | Ressource | Opérations |
| --- | --- | --- |
| 1 | `/auth` | `GET /me` *(existant, enrichi rôle + scope + département)* |
| 2 | **`/admin/users`** | `GET`, `POST`, `PATCH`, `DELETE` — création de responsables, refus de créer un SUPER_ADMIN |
| 3 | `/departments` | existant, + filtre par scope |
| 4 | **`/pages`** | existant, structure protégée |
| 5 | `/publications` | existant, + `ARCHIVED`, + transition `publish`/`unpublish` |
| 6 | **`/media/:id/access`** | `GET`, `PUT` — USE / MANAGE / DELETE |
| 7 | `/events` | existant, périmètre selon DB-5 |
| 8 | **`/notifications`** | `GET`, `PATCH /:id/read` |
| 9 | `/prayer-requests` | public `POST` ; admin `GET`, `PATCH` (archivage) |
| 10 | `/settings`, `/media`, `/leaders`, etc. | existants, revus au Lot 9 |

## I.4 Plan RBAC — `Role × Scope × Resource × Action`

| Rôle | Scope | Resource | Actions autorisées | Refus caractéristiques |
| --- | --- | --- | --- | --- |
| `SUPER_ADMIN` | GLOBAL | Users, Departments, Publications, Events, Media, Pages, Settings | tout | **PrayerRequest : refus total** |
| `ADMIN` | GLOBAL | Publications, Events, Media, Pages, Users (hors SUPER_ADMIN), PrayerRequest | CRUD + lecture/déchiffrement prières | Ne peut pas créer de SUPER_ADMIN |
| `DEPARTMENT_MANAGER` | DEPARTMENT | Publications, Media *(selon MediaAccess)*, Events *(selon DB-5)* | CRUD **dans son seul département** | Presse ↛ Ecodume, Ecodume ↛ Presse ; **PrayerRequest : refus** |
| `DEPARTMENT_MANAGER` | PRIVATE | — | — | Scope réservé aux données privées |
| *(visiteur)* | PUBLIC | PrayerRequest | `CREATE` uniquement | Aucune lecture |

**Règle structurante (§19) :** `PRIVATE` **ne se réduit pas** à un contrôle de
rôle `ADMIN`. Le refus opposé au Super Admin doit venir du **mécanisme
cryptographique**, pas seulement d'une policy — sinon un Super Admin
contournerait la règle en modifiant la policy.

## I.5 Plan de tests — `Feature × Unit × Integration × Functional × Security`

| Fonctionnalité | Unit | Integration | Functional | Security |
| --- | --- | --- | --- | --- |
| RBAC / scopes | policies par combinaison | profils en base | parcours par rôle | **accès inter-départements** |
| Publications | règle des 3 | repositories | publier/archiver | Dépt. A ↛ Dépt. B |
| Archivage | transaction | **concurrence** | cycle complet | — |
| Médias | validation MIME | Storage | upload → usage | **MediaAccess refusé** |
| Pages | schémas Zod | lecture/écriture | édition back-office | structure non modifiable |
| Prières | **crypto abstraite** | stockage chiffré | création → notification → archivage | **Super Admin incapable de lire** |
| Notifications | destinataires | persistance | lecture/marquage | **aucun contenu de prière** |
| API | — | 60+ opérations | conventions | 401/403 paramétrés |

*Base existante réutilisable : 363 tests, dont un test paramétré de 40 routes
protégées et une garde anti-vacuité.*

## I.6 Roadmap

| Lot | Contenu | Dépend de | Estimation relative |
| --- | --- | --- | --- |
| 0 | ESLint + compléments | — | **XS** |
| 1 | Identité, rôles, scopes, policies | 0 | **L** |
| 2 | Départements et utilisateurs | 1 | **M** |
| 3 | Pages éditoriales | 2 | **M** |
| 4 | Publications + règle des 3 | 2 | **L** |
| 5 | Médiathèque + `MediaAccess` | 2 | **L** |
| 6 | Événements | 2, DB-5 | **S** |
| 7 | Notifications | 2 | **S** |
| 8 | Prières + crypto | 1, 7, DB-6→9 | **XL** |
| 9 | Settings (réduction) | 4, 5, 6 | **M** |
| 10 | API + OpenAPI | 3–9 | **M** |
| 11 | Intégration frontend | 10 | **L** |
| 12 | Tests et durcissement | 11 | **M** |

## I.7 Décisions bloquantes

Uniquement celles nécessaires **avant d'écrire du code** :

| # | Décision | Bloque | Nature |
| --- | --- | --- | --- |
| **DB-1** | `Ecodim` → `Ecodume` : renommage complet, ou simple libellé d'affichage ? | Lots 2, 11 | **Métier — non tranchable par l'agent** |
| **DB-2** | Départements : conserver Adultes/Enfants/Chorale, renommer, ou remplacer par Presse/Ecodume/Affaires Sociales ? | Lots 2, 4, 5 | **Métier** |
| **DB-3** | Rôle des comptes administrateurs existants après migration de l'enum ? | Lot 1 | Technique, à confirmer |
| **DB-4** | Données de contact déjà collectées sur des demandes de prière : suppression ? | Lot 8 | **Juridique et éthique** |
| **DB-5** | Événements globaux : `Event.department_id` obligatoire ou nullable ? **La documentation déclare elle-même la décision non prise** — voir §Compléments | Lot 6 | **Métier — décision ouverte de la conception** |
| **DB-6** | Modèle cryptographique : qui détient les clés, et comment le Super Admin en est-il exclu ? | Lot 8 | **Critique** |
| **DB-7** | Multi-Admin : une clé par Admin, ou une clé partagée scellée par Admin ? | Lot 8 | Critique |
| **DB-8** | Récupération et rotation : que se passe-t-il si tous les Admins perdent leur accès ? | Lot 8 | Critique |
| **DB-9** | Périmètre exact du refus Super Admin : le contenu seul, ou aussi l'existence et les métadonnées ? | Lot 8 | Critique |

**DB-6 à DB-9 conditionnent le Lot 8.** `docs/025` §Lot 8 impose de produire une
mini-spécification validée **avant** d'écrire la cryptographie ; je m'y conforme.

---

# COMPLÉMENTS ISSUS DES DÉPOUILLEMENTS DE `docs/020` À `docs/024`

> Ces compléments corrigent et complètent les sections précédentes, rédigées avant
> lecture intégrale des documents de conception. Sources : `docs/extraits/020-021-extrait.md`
> (94 Ko) et `docs/extraits/022-024-extrait.md` (103 Ko), qui dépouillent
> `020` (920 l.), `021` (852 l.), `022` (718 l.), `023` (861 l.) et `024` (1371 l.),
> chaque affirmation tracée par document, section, ligne et citation littérale.

## 1. Ce que les documents contiennent réellement

| Document | Contenu recensé |
| --- | --- |
| `020` | Back-office : écrans, rôles, matrices d'autorisation (§18), 27 règles d'exclusion |
| `021` | Modèle métier : 29 entités, **64 règles métier**, **12 invariants** (I1–I12), 3 matrices |
| `022` | UML statique : **11 classes + 6 énumérations**, 16 relations, 6 agrégats, 6 contraintes |
| `023` | UML dynamique : **13 diagrammes de séquence**, **3 diagrammes d'états**, 7 cas d'usage |
| `024` | Architecture : 39 sections, 4 couches, **10 modules**, **7 policies**, 8 use cases, A1–A10, 10 interdits, **10 événements d'audit**, 12 lots |

## 2. Points désormais tranchés par citation

### 2.1 Identifiants — `UUID` (contradiction antérieure levée)

Un **seul** type d'identifiant est écrit dans `022`, `023` et `024` : **`UUID`**
(14 attributs dans `022` ; `024 L787` : « `departmentId` est un UUID valide »).
**Aucune occurrence** d'`integer`, `bigint` ou `serial` dans les trois documents.

⚠️ Mais `022 L666` liste explicitement *« les clés et index »* parmi les points
**non tranchés** : **aucune clé primaire ni étrangère n'est déclarée**. Le type est
acquis, la contrainte de clé ne l'est pas.

### 2.2 `Ecodume` — renommage acté

`Ecodume` est la **seule** graphie des trois documents ; **`Ecodim` : 0 occurrence**.
Occurrences relevées : `022` L242, L342, L349 · `023` L209, L218, L220, L225, L230,
L248, L255, L258, L259, L589, L600, L601, L605 · `024` L384, L1277.
Le conflit **n'est évoqué nulle part** dans `022`/`023`/`024` : il n'oppose donc pas
les documents entre eux, mais **la documentation au code** (97 occurrences).

### 2.3 Départements — des exemples, pas une liste normative

`022 §4 L240-L244` donne `PRESSE` / `ECODUME` / `AFFAIRES-SOCIALES` sous l'intitulé
**« Exemples de données : »**. `AFFAIRES-SOCIALES` n'apparaît **dans aucun autre**
des trois documents. **Aucune liste exhaustive ni normative** n'existe dans
`022`/`023`/`024`.

**Conséquence :** l'affirmation du plan initial (« le modèle cite Presse, Ecodume,
Affaires Sociales ») était **infidèle** — ce sont des exemples. DB-2 reste ouverte,
mais sa formulation est corrigée.

### 2.4 Événements globaux — décision ouverte, déclarée comme telle

**Ni autorisés, ni interdits : la décision est explicitement reportée.**

- `022 L18` : *« Les choix qui restent ouverts dans le modèle métier sont
  explicitement signalés, notamment la possibilité d'événements globaux et le
  mécanisme cryptographique des demandes de prière. »*
- `022 §6 L294` : *« Un événement peut-il être global à l'église et donc ne posséder
  aucun département ? »* — L296 : cardinalité conditionnelle
  `Department 0..1 ─────── 0..* Event` — L302 : *« Cette décision doit être arrêtée
  avant le GEL. »*
- `022 §14 L626-L627` : `Department 1 ───── 0..* Event` / **`[à confirmer]`**
- `023 §18 D1 L771-L777` : *« Déterminer si `Event.department_id` est obligatoire ou
  nullable pour permettre des événements globaux. »*
- `024 §6.5 L296` : *« rattachement départemental si applicable »*
- `024 §37 L1298` : les événements globaux figurent dans la liste de ce qui
  *« ne doit pas être considéré comme implicitement résolu »*

Corroboré par les absences : aucun invariant `I1`–`I12` ne porte sur `Event`
(`021 §17`) ; aucun périmètre pour des événements globaux (`021 §18`) ; aucune ligne
correspondante dans la matrice `020 §18`.

**DB-5 n'est donc pas un défaut de lecture : c'est une décision ouverte de la conception.**

### 2.5 Cryptographie des prières — principe normatif, mécanisme ouvert

**Ce qui est normatif et doit être implémenté tel quel :**

- Refus du Super Admin : `022 L470` — *« le Super Admin ne doit pas pouvoir obtenir
  le contenu en clair d'une demande de prière »* ; `022 §14 L654-655` —
  *« SUPER_ADMIN → aucune lecture PrayerRequest »* ; `023 L462`, `L807` ;
  `024 §9 L436` — *« SUPER_ADMIN → DENY »*, `L899` — *« Le Super Admin reçoit 403. »*
- **Refus avant déchiffrement** : `023 L487` — *« Le refus doit intervenir **avant le
  déchiffrement**. »*, flux interdit `L491-L503` ; `024 L442`, `L458`, `L889-L897`.
- Interdiction de la clé globale : `024 L1045` — *« la clé permettant de déchiffrer les
  demandes de prière ne doit pas être simplement assimilée à un secret backend global »*.
- Forme de la donnée chiffrée : `022 L161-163` — `EncryptedData` (`ciphertext`,
  `nonce`, `keyReference`), `<<value object>>`.
- Interface : `024 L478` — `encrypt()` / `decryptForAdmin()`.

**Ce qui est explicitement ouvert :**

- `022 L466` : *« Le détail cryptographique n'est volontairement pas fixé »*
- `023 L791-L803` : liste « Formaliser : » incluant *gestion de plusieurs Admins ;
  rotation ; révocation ; récupération ; perte de clé*
- `024 L504` : *« Le choix concret du protocole et de la gestion multi-Admin doit être
  arrêté avant implémentation. »*
- `024 L1295-L1297` : points ouverts

**Algorithme, longueur de clé, seuil, partage et procédure : absents de `022`/`023`/`024`.**

**Conclusion :** DB-6 à DB-9 sont **confirmées comme décisions réellement ouvertes**,
et non comme un défaut de lecture. `docs/025` §Lot 8 exige une mini-spécification
validée avant tout code cryptographique — cette exigence porte donc sur une
conception **à produire**, pas à retrouver.

### 2.6 Rôles — trois énumérés, un quatrième jamais nommé

`021 L134` annonce *« Le modèle comprend quatre rôles »* puis n'énumère que
**`SUPER_ADMIN`, `ADMIN`, `DEPARTMENT_MANAGER`**. `docs/025 L130` reproduit le même
schéma. Le quatrième rôle **n'est nommé nulle part**. → conflit n° 14 ci-dessous.

## 3. Ce que la documentation ne traite pas

À écrire « **non traité dans 020–024** » et à porter en décision, jamais à inférer :

| Sujet | Constat |
| --- | --- |
| Contrat d'API | **Aucun** endpoint, méthode, paramètre, filtre, enveloppe de réponse ni code d'erreur. `021 §1 L16` : *« Il ne constitue pas encore le schéma SQL final, ni le contrat OpenAPI »*. Seuls : « REST / JSON » (`020 §19 L745`), 5 contrôles de requête (`020 §20 L795-801`), 7 permissions d'exemple, « validation Zod » (`021 §20.4 L746`) |
| Concurrence de l'archivage | Rien sur transactions, verrous, isolation, conflits, ordre de départage à date égale. **Le critère même de « récence » n'est pas défini** (`021 §8.3 L331`) |
| Types de données | **Aucun** type SQL ou TypeScript pour aucun attribut |
| Modèle média exact | MIME, taille max, buckets, vignettes, suppression, orphelins, structure interne de `MediaAccess` (`021 §20.3`) |
| Modèle éditorial des pages | Champs éditables, variantes, validation, fallback, contenu vide (`021 §20.4`) |
| Statut des 8 entités frontend | `Leader`, `Testimony`, `CommunityFace`, `Verse`, `RhythmEntry`, `SocialLink`, `ScheduleEntry`, `SiteSettings` → `021 §20.5`, non tranché |
| Suppression / historique / audit par ressource | `021 §20.6` |
| Cycle de vie des comptes, mots de passe, sessions | Non traité |
| Variables d'environnement | Présentes **uniquement** dans `024 §29` : `DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`, `CRYPTO_KEY` |
| Procédure de gel | Uniquement dans `docs/025` ; les documents 020–024 sont **pré-GEL** |

**`docs/020` est totalement muet sur la confidentialité des prières** — ce volet
provient exclusivement de `021 §5.1`, `§6.1`, `§12`, `§13`, `§14`, `§17-I10`, `§20.2`.

## 4. Conflits documentaires

Toute divergence est signalée ; **aucune n'est arbitrée silencieusement** (`docs/025` §20).

### 4.1 Divergences entre `020` et `021`

| # | Conflit | Passages en regard |
| --- | --- | --- |
| C-1 | **Accès du Super Admin** | `020 §4.1 L139` : *« accéder à tous les contenus »* ⇄ `021 §5.1 L154` : *« Le rôle SUPER_ADMIN **ne peut pas lire les demandes de prière.** »* |
| C-2 | **Droit « Utilisateurs » de l'Admin** | `020 §18 L726` : aucune ligne « Utilisateurs » ⇄ `021 §7 L250` : *« Utilisateurs \| Oui \| Création des responsables \| Non »* |
| C-3 | **Validation préalable à la publication** | `021 §7 L273` : *« n'a pas besoin d'une validation préalable de l'Admin pour publier »* ⇄ `020 §10 L464-476` et `§22.1` laissés ouverts |
| C-4 | **Seuil d'archivage** | `020` : *« reste à définir »* ⇄ `021` : **3 par département** |
| C-5 | **Critère d'accès média** | `020` raisonne sur `Media.department` ⇄ `021 §17 I3` l'interdit |
| C-7 | **Graphie du département** | `020` : « Press » ⇄ `021` : « Presse » / `PRESSE` |
| C-11 | **Cardinalité `Notification`** | `022 L180` : `Notification 0..* → 1 PrayerRequest` (sens inverse) et relation absente de la liste `§14` |

*Neuf autres divergences sont détaillées dans `docs/extraits/020-021-extrait.md` (C-1 à C-11) et six incohérences internes à `020`/`021` y sont également recensées.*

### 4.2 Divergences entre `022`, `023` et `024`

| # | Conflit | Passages en regard |
| --- | --- | --- |
| C2-1 | **Événements globaux** | `022 L626` : `obligatoire [à confirmer]` ⇄ `024 L296` : `si applicable` ⇄ `023 L777` : ouvert |
| C2-2 | **Archivage** | `022 L272` : déclencheur unique = règle des trois ⇄ `023 L528` : *« archivage explicite autorisé »* + `024 L831` : `POST /publications/:id/archive` |
| C2-3 | **Permissions média** — **incohérence interne à `023`** | `023 §12 L574-L580` (hiérarchie USE→MANAGE→DELETE) ⇄ `023 §12 L583` et `§18 D2 L789` (*« favorise la seconde interprétation »* = trois permissions indépendantes) |
| C2-4 | **Super Admin** — incohérence interne à `024` | `024 §8 L419` : *« autorisé selon la politique globale »* ⇄ `§9 L436` : `DENY` |
| C2-5 | **Clients** | `024 §25` (clients parallèles) ⇄ `§31` (chaîne Public → Backoffice → API) |
| C2-6 | **Sens de dépendance** | `024 §31` (`Domain ↓ Infrastructure`) ⇄ `§34` (*« Le domaine ne dépend pas : Express/Drizzle/Supabase/Next.js/Railway »*) et `§2` (Domain ∥ Infrastructure) |
| C2-7 | **URL publique des médias** | `024 §12 L555` : *« doit **éviter** »* ⇄ `§33 L1186` : interdiction ferme |
| C2-8 | **Nom de fonction** | `023 L429` : `decryptForAuthorizedAdmin` ⇄ `024 L478` : `decryptForAdmin` |
| C2-9 | **Nom du rôle** | `024 L438` : `MANAGER` ⇄ `022 L39`, `024 L424` : `DEPARTMENT_MANAGER` |
| C2-10 | **Intitulé du scénario 3** | `022 L712` ⇄ `023 L20` |
| C2-12 | **Liste des relations `§14`** | `022 L621-L636` omet `Page`, `PrayerRequest`, `Notification–PrayerRequest`, `Department 0..1–0..* UserRole` |

### 4.3 Conflits avec le code existant

| # | Conflit | Constat |
| --- | --- | --- |
| C3-1 | **`Ecodume` ⇄ `Ecodim`** | 56 occurrences dans `020`–`025`, **0** dans le code ; 97 occurrences d'`Ecodim` dans le code, **0** d'`Ecodume`. Non traité par `022`/`023`/`024` |
| C3-2 | **`ROLE_ADMIN`** | 0 occurrence dans `020`–`025` ; rôle unique du code |
| C3-3 | **États de prière** | Modèle : `PENDING`/`ARCHIVED`. Code : `NEW`/`PRAYED`. `PRAYED` : 0 occurrence dans les documents |
| C3-4 | **Contact de prière** | `docs/025 §9` : *« Pas d'e-mail ni de téléphone »*. Code : `requester_contact` |
| C3-5 | **Quatrième rôle** | `021 L134` et `docs/025 L130` annoncent **quatre** rôles, **trois** sont nommés |

---

# TRAÇABILITÉ

Pour chaque grande section de ce plan, les documents dont elle procède.

| Section du plan | Sources |
| --- | --- |
| Étape A — Audit | `docs/017`, `docs/019`, audit direct du code `backend/`, `docs/extraits/*` |
| Étape A.3 — Conflits | `docs/extraits/020-021-extrait.md`, `docs/extraits/022-024-extrait.md` |
| Étape B — Matrice | `docs/021` (entités), `docs/022` (classes/relations), code `backend/` |
| Étape C — Lots | `docs/025 §12` (structure imposée), `docs/024 §41` (les 12 lots) |
| Étape D — Dépendances | `docs/025 §13`, corrigé selon `docs/024 §41` |
| Étape E — Definition of Done | `docs/025 §14` |
| Étape F — Ordre | `docs/025 §15` |
| Étape G — Risques | `docs/025 §16` (R1–R6), alimenté par `docs/021 §17` (invariants) |
| Étape H — MVP | `docs/025 §17`, `docs/024 §37` (points non résolus) |
| I.1 — Architecture | `docs/024 §2-§6` (couches, modules, 7 policies) |
| I.2 — Migration | `docs/022` (11 classes, 6 énumérations, 16 relations), `docs/021 §17` (invariants) |
| I.3 — API | `docs/024 §12` (modules/policies) — **le contrat détaillé n'existe pas dans 020–024** |
| I.4 — RBAC | `docs/021 §5.1`, `§6.1`, `§7` (matrice), `020 §18` (matrice), `docs/022 §14` |
| I.5 — Tests | `docs/025 §12 Lot 12`, `docs/024` (10 événements d'audit) |
| I.6 — Roadmap | `docs/024 §41`, `docs/025 §13` |
| I.7 — Décisions bloquantes | `docs/022 L18`, `L294-302`, `L626` ; `023 D1 L777`, `L791-803` ; `024 L1298`, `L504`, `L1045` ; `docs/025 §20` |
| Compléments §1–§4 | `docs/extraits/020-021-extrait.md`, `docs/extraits/022-024-extrait.md` |

---

# CONCLUSION

L'audit établit que le backend existant est **fonctionnel mais conçu sur un
modèle périmé**. Le Lot 1 — identité et autorisation — est la primitive qui
conditionne tous les autres, et il s'agit d'une **refonte**, non d'un ajout.

La lecture intégrale de `docs/020` à `docs/024` — via les dépouillements
citationnels de `docs/extraits/` — **corrige trois affirmations du plan initial** :
les identifiants sont des **`UUID`** (et non un point de désaccord) ; les
départements `PRESSE`/`ECODUME`/`AFFAIRES-SOCIALES` sont des **exemples de données**,
pas une liste normative ; et les **événements globaux** sont une **décision ouverte
déclarée comme telle**, non un point que j'aurais manqué.

Elle confirme en revanche, citations en main, que **la cryptographie des prières est
une conception à produire**, non à retrouver : algorithme, gestion des clés,
multi-Administrateur, rotation, révocation et récupération sont explicitement
renvoyés à une formalisation ultérieure.

Trois décisions exigent votre arbitrage avant tout code : **DB-1** (renommage
Ecodim → Ecodume : 97 occurrences dans le code, 0 dans le modèle), **DB-2**
(départements réellement retenus) et **DB-6 à DB-9** (spécification cryptographique,
dont dépend la promesse de confidentialité faite aux fidèles). **DB-5** (événements
globaux) doit être tranchée par vous, la documentation refusant de le faire.

Conformément à `docs/025` §21 et §23, **aucune implémentation n'a été engagée**.
Le plan attend votre validation.
