# CCJV — Référence du projet pour la conception du backend

> **Nature :** Rapport de reconnaissance — ANALYSE uniquement, aucune implémentation.
> **Périmètre :** Documentation `/docs` (001 à 016) + inspection du frontend `src/` + `public/`.
> **Règle de traçabilité :** chaque information importante indique sa provenance :
> `[Source : docs/...]` = explicitement documenté,
> `[Source : src/...]` = observé dans le code,
> `Déduit` = déduit, `À décider` = reste à décider.

---

## 1. Résumé du projet

Le Centre Chrétien Jésus ma Vie (CCJV) est une église basée à Lubumbashi, en République Démocratique du Congo, fondée le 17 mars 2023 [Source : docs/001-cahier_des_charges.md, src/data/mock/site.ts].

Le projet comprend :

- Un **site public vitrine** Next.js déjà implémenté (30 routes, données mockées) [Source : src/app/].
- Un **back-office** prévu mais **non implémenté** [Source : docs/002-specifications_fonctionnelle.md §3].
- Un **backend API** prévu mais **non implémenté** : Express + TypeScript sur Railway, PostgreSQL via Supabase, Supabase Auth, Supabase Storage, frontend Next.js sur Vercel [Source : docs/004-architecture_logicielle_25092026_043710.md §3].

Objectif de cette phase : fournir une base factuelle fiable pour la conception du backend, sans modifier l'architecture existante ni créer de tables, routes, migrations ou fichiers backend.

---

## 2. Objectifs métier identifiés

| Objectif | Provenance |
|---|---|
| Présenter l'église, sa vision, ses activités et son organisation | [Source : docs/001-cahier_des_charges.md §2] |
| Informer sur les événements (cultes, activités enfants, rencontres départements) | [Source : docs/001-cahier_des_charges.md §2] |
| Publier des contenus multimédias (vidéos, photos, annonces) | [Source : docs/001-cahier_des_charges.md §2] |
| Offrir un espace d'administration utilisable sans technicien | [Source : docs/001-cahier_des_charges.md §2] |
| Permettre de maintenir le site sans modifier le code frontend (CMS) | [Source : docs/002-specifications_fonctionnelle.md §3.6] |
| Rester léger et rapide malgré une connexion parfois limitée à Lubumbashi | [Source : docs/001-cahier_des_charges.md §5, docs/003-architecture_technique.md §3] |
| Permettre l'évolutivité (nouvelles rubriques / fonctionnalités) | [Source : docs/001-cahier_des_charges.md §5] |

---

## 3. Fonctionnalités existantes

### 3.1 Site public — 30 routes observées

| Route | Type | Source |
|---|---|---|
| `/` | Accueil (12 sections éditoriales) | [Source : src/app/page.tsx] |
| `/qui-sommes-nous` | Hub éditorial | [Source : src/app/qui-sommes-nous/page.tsx] |
| `/qui-sommes-nous/ce-que-nous-croyons` | Confession de foi | [Source : src/app/qui-sommes-nous/ce-que-nous-croyons/page.tsx] |
| `/qui-sommes-nous/d-ou-nous-venons` | Histoire + Timeline | [Source : src/app/qui-sommes-nous/d-ou-nous-venons/page.tsx] |
| `/qui-sommes-nous/qui-nous-dirige` | Leadership | [Source : src/app/qui-sommes-nous/qui-nous-dirige/page.tsx] |
| `/vie-de-leglise/evenements` | Liste événements (à venir + archives) | [Source : src/app/vie-de-leglise/evenements/page.tsx] |
| `/vie-de-leglise/evenements/[slug]` | Fiche événement | [Source : src/app/vie-de-leglise/evenements/[slug]/page.tsx] |
| `/vie-de-leglise/ou-nous-trouver` | Contact / accès (remplace `/contact`) | [Source : src/app/vie-de-leglise/ou-nous-trouver/page.tsx] |
| `/vie-de-leglise/faire-un-don` | Dons (présentation, pas de paiement) | [Source : src/app/vie-de-leglise/faire-un-don/page.tsx] |
| `/communaute/groupes-de-maison` | Groupes | [Source : src/app/communaute/groupes-de-maison/page.tsx] |
| `/communaute/parcours-nouveau` | Parcours nouveaux | [Source : src/app/communaute/parcours-nouveau/page.tsx] |
| `/communaute/priere-et-intercession` | Prière | [Source : src/app/communaute/priere-et-intercession/page.tsx] |
| `/communaute/temoignages` | Témoignages (carrousel) | [Source : src/app/communaute/temoignages/page.tsx] |
| `/organisation` | Hub organisation | [Source : src/app/organisation/page.tsx] |
| `/organisation/departements` | Liste départements | [Source : src/app/organisation/departements/page.tsx — observé via glob, voir docs/014] |
| `/organisation/departements/[slug]` | Fiche département | [Source : docs/014-audit_pages_refactor.md §14] |
| `/publications/actualites` | Actualités | [Source : src/app/publications/actualites/page.tsx] |
| `/publications/enseignements` | Enseignements (vidéo externe) | [Source : src/app/publications/enseignements/page.tsx] |
| `/publications/mediatheque` | Médiathèque (galerie) | [Source : src/app/publications/mediatheque/page.tsx] |
| `/publications/ressources` | Ressources (liste éditoriale) | [Source : src/app/publications/ressources/page.tsx] |
| `/publications/[slug]` | Fiche publication | [Source : src/app/publications/[slug]/page.tsx] |
| `/mentions-legales`, `/confidentialite`, `/conditions`, `/accessibilite` | Pages légales (gabarit `LegalPage`) | [Source : src/app/mentions-legales/page.tsx, etc., docs/014] |
| `/recherche` | Recherche interne (index statique, plafond 30 résultats) | [Source : src/app/recherche/page.tsx, docs/014 §30] |

Note : les 5 pôles (`/qui-sommes-nous`, `/vie-de-leglise`, `/communaute`, `/organisation`, `/publications` en tant que pages) ne sont plus des destinations selon le palier 1 — « un pôle n'est pas une destination », sans redirection, 404 attendu [Source : docs/015-architecture_editoriale.md §4.5, docs/016-guide_composition_pages.md §3.1, src/lib/nav.ts].

### 3.2 Back-office — inexistant

Aucune route `/admin` observée dans `src/`. Le back-office est uniquement spécifié : authentification, dashboard, CRUD événements / départements / publications, édition pages statiques [Source : docs/002-specifications_fonctionnelle.md §3].

### 3.3 Fonctionnalités administratives déjà esquissées

Aucun formulaire admin, aucun appel API, aucun client REST observé. Les mocks contiennent des commentaires explicites `à remplacer par l'API /api/v1/...` [Source : src/data/mock/events.ts, src/data/mock/publications.ts, src/data/mock/departments.ts].

---

## 4. Architecture frontend observée

### 4.1 Stack

| Élément | Valeur | Source |
|---|---|---|
| Framework | Next.js 15.5.26 (App Router) | [Source : docs/012-audit_et_architecture.md §1.1] |
| Langage | TypeScript strict | [Source : docs/012 §1.1] |
| Style | Tailwind CSS v4.3.3, tokens `@theme`, coins droits, sans ombre | [Source : docs/012 §1.1, docs/010-design_system.md] |
| Polices | Lora + Inter via `next/font` (self-hosted) | [Source : src/app/layout.tsx] |
| Images | `next/image`, fichiers locaux `/media/`, vignettes YouTube distantes `i.ytimg.com` | [Source : src/app/page.tsx, src/components/shared/YouTubeThumb.tsx] |
| SEO | `metadata`, `sitemap.ts`, `robots.ts`, `generateStaticParams` + `generateMetadata` sur `[slug]` | [Source : src/app/sitemap.ts, docs/014] |

### 4.2 Organisation

```text
src/
├── app/                  # 30 routes
├── components/
│   ├── ui/               # Button, Badge, EmptyState
│   ├── layout/           # Header, Footer, FullscreenMenu, IntroCurtain
│   ├── shared/           # Section, PageHeader, VerseSection, WeekRhythm, etc.
│   ├── composition/      # Band, HeroEditorial, HeroPhoto, HeroPractical, etc.
│   ├── editorial/        # Prose, FeatureImage, PhotoGallery, ScriptureBlock, etc.
│   ├── archetypes/       # EditorialPage, NarrativePage, ListingPage, DetailPage, etc.
│   └── forms/            # PrayerRequestForm
├── features/
│   ├── events/           # FeaturedEvent, EventRow, EventsSection (+ EventCard inutilisé)
│   ├── publications/     # TeachingFeature, TeachingCard, PublicationCard
│   ├── pages/            # Hero
│   └── search/           # SearchClient
├── data/mock/            # site, departments, events, publications, leaders, community, testimonies, verses, images
├── lib/                  # nav.ts, seo.ts, utils.ts
└── types/                # index.ts (Department, Event, Publication, StaticPage)
```

[Source : observation `src/` via glob + docs/014-audit_pages_refactor.md §B].

### 4.3 Système de chargement de données actuel

- Import direct des mocks : `upcomingEvents`, `getDepartmentName`, `getPublicationsByCategory`, `communityFaces`, `images`, `site`, `weeklyRhythm`, `verses` [Source : src/app/page.tsx].
- Helpers : `getEventBySlug`, `getDepartmentBySlug`, `getPublicationBySlug`, `getPublicationsByCategory` [Source : src/data/mock/events.ts, departments.ts, publications.ts].
- Statut événement calculé côté frontend via `getEventStatus(eventDate)` (comparaison date ISO) [Source : src/lib/utils.ts].
- Aucun `fetch`, aucun client API, aucun appel réseau vers un backend [Source : observation `src/`].
- Recherche : filtrage client (`useMemo`) sur index statique construit au rendu serveur depuis `primaryNav`, `events`, `departments`, `publications` [Source : docs/014 §30].

### 4.4 Types TypeScript (contrat actuel, aligné futur `/api/v1/*`)

```ts
// [Source : src/types/index.ts]
type PublicationType = "VIDEO" | "PHOTO" | "TEXTE";
type EventStatus = "UPCOMING" | "ARCHIVED"; // calculé, jamais persisté
interface Department { id; name; slug; description?; responsibleName?; bannerImage?; meetingSchedule?; keyPoints?: string[]; gallery?: string[]; tagline? }
interface Event { id; title; slug; description?; eventDate: string; eventTime?; location?; imageUrl?; departmentId?: string | null; status: EventStatus; excerpt?; bannerImage?; gallery?: string[]; practicalInfo?: string[] }
interface Publication { id; title; slug; type; contentUrl?; description?; publishedAt: string; category?: "ACTUALITE"|"ENSEIGNEMENT"|"MEDIA"|"RESSOURCE"; author?; body?: string[] }
type PageKey = "ACCUEIL" | "QUI_SOMMES_NOUS" | "COMMUNAUTE" | "CONTACT";
interface StaticPage { id; pageKey: PageKey; content: string }
```

---

## 5. Pages et fonctionnalités nécessitant des données backend

### A. Strictement statique (pas de backend requis)

Structure, layout, design system, navigation (structure des pôles), pages légales, parcours nouveaux (étapes + FAQ en dur), groupes de maison (descriptif), faire-un-don (destinations en dur) [Source : src/app/communaute/parcours-nouveau/page.tsx, src/app/communaute/groupes-de-maison/page.tsx, src/app/vie-de-leglise/faire-un-don/page.tsx, docs/014].

### B. Éditable depuis le futur Back-Office

Textes Hero / sections accueil, textes Qui sommes-nous / Ce que nous croyons / D'où nous venons / Qui nous dirige, textes Où nous trouver / Prière / Organisation / Publications / Communauté, versets affichés, horaires hebdomadaires, réseaux sociaux, adresse et WhatsApp [Source : src/app/page.tsx, src/data/mock/site.ts, src/data/mock/verses.ts, docs/002 §3.6].

### C. Dynamique (CRUD backend requis)

Événements, départements, publications, responsables (leaders), témoignages, visages communauté [Source : src/data/mock/events.ts, departments.ts, publications.ts, leaders.ts, testimonies.ts, community.ts].

### D. Dépendant d'une relation entre plusieurs entités

- `Event.departmentId` → Department (null = général) [Source : src/types/index.ts, docs/006 §4].
- `Publication.category` (filtrage rubriques) [Source : src/types/index.ts, src/data/mock/publications.ts].
- `Leader.departmentId` → Department [Source : src/data/mock/leaders.ts — observé].
- `Event.gallery`, `Department.gallery` (listes d'images) [Source : src/types/index.ts].

### E. Susceptible d'être stocké dans Supabase Storage

`imageUrl`, `bannerImage`, `gallery` (événements, départements), `contentUrl` pour PHOTO, `photo` (leaders, testimonies, community), images curatoriales `images.*`, logos `logo.png` / `logo_2.png` [Source : src/types/index.ts, src/data/mock/images.ts, public/].

### F. Dépendant d'une authentification ou permission

Back-office `/admin`, opérations POST/PATCH/DELETE sur events / departments / publications / pages, POST `/api/v1/media` [Source : docs/002 §3, docs/004 §17-21].

---

## 6. Contenus statiques éditables

### 6.1 Données institutionnelles confirmées

| Donnée | Valeur | Source |
|---|---|---|
| Nom | Centre Chrétien Jésus ma Vie (CCJV) — Lubumbashi, RDC | [Source : src/data/mock/site.ts] |
| Fondation | 17 mars 2023 | [Source : src/data/mock/site.ts, docs/008 §6] |
| Ecodim | 2 juillet 2023 | [Source : src/data/mock/site.ts] |
| Visionnaire | Pasteur Manasse Mwamba | [Source : src/data/mock/site.ts] |
| Adresse | Quartier Hewa Bora, Avenue Djoloko, Lubumbashi | [Source : src/data/mock/site.ts, docs/015 §5] |
| Chorale | Lundi 16h30–18h30, mercredi dans la nuit, samedi 16h30–18h30 (confirmé) | [Source : src/data/mock/site.ts] |
| Instagram / TikTok | `ecodim_ccjv` | [Source : src/data/mock/site.ts, docs/008 §6] |

### 6.2 Données de démonstration / placeholders

Horaires culte dominical et Ecodim (Dimanche 09h00), WhatsApp `+243 123 456 789` / `wa.me/243123456789`, contenus événements / publications / départements rédigés pour la démo, `ContentPending` / `TODO — … À FOURNIR` (19 emplacements), aucune légende photo affirmative [Source : src/data/mock/site.ts, docs/015 §5, docs/016 §5].

### 6.3 Volumes éditoriaux mesurés

Accueil ≈ 360 mots en dur, Parcours nouveaux ≈ 290, Ce que nous croyons ≈ 270 (doctrinal), Groupes de maison ≈ 210, Faire-un-don ≈ 200, Communauté ≈ 200, D'où nous venons ≈ 190, Organisation ≈ 190 ; fiches `[slug]` ≈ 30–40 mots (alimentées par mocks) [Source : docs/014-audit_pages_refactor.md §1].

---

## 7. Contenus dynamiques

Voir §5-C et §4.4 pour les champs complets.

- **Events :** 7 mocks (4 UPCOMING, 3 ARCHIVED), tri croissant (à venir) / décroissant (archives), `status` dérivé, `excerpt`, `bannerImage`, `gallery`, `practicalInfo` [Source : src/data/mock/events.ts].
- **Departments :** 3 mocks (Adultes, Enfants/Ecodim, Chorale), `tagline`, `meetingSchedule`, `keyPoints`, `gallery`, `bannerImage` [Source : src/data/mock/departments.ts].
- **Publications :** 10 mocks, tri décroissant, `VIDEO` (YouTube externe), `PHOTO` (`/media/...`), `TEXTE` (`body: string[]`), `category`, `author` [Source : src/data/mock/publications.ts].
- **Leaders :** 5 entrées (pasteur + 4 responsables, portraits en arche) [Source : src/data/mock/leaders.ts, docs/014 §09/§12].
- **Testimonies :** 4 entrées (carrousel `TestimonyCarousel`) [Source : src/data/mock/testimonies.ts, docs/014 §24].
- **CommunityFaces :** 5 visages (scrollytelling, double branche DOM desktop/mobile) [Source : src/data/mock/community.ts, docs/014 §01].
- **Verses / Rhythm :** versets Louis Segond 1910 (à valider par CCJV), `weeklyRhythm` avec flag `confirmed` [Source : src/data/mock/verses.ts, src/data/mock/site.ts, docs/012 §1.4].

---

## 8. Médias et besoins Supabase Storage

### 8.1 Inventaire actuel

- `public/media/` : 41 fichiers `ccjv-01.jpeg` … `ccjv-41.jpeg`, 32/41 utilisés, 86 occurrences dans `src/` [Source : docs/014 §C.2-C.3, docs/015 §4.3].
- `public/images/` : 41 originaux WhatsApp (38–245 Ko, déjà compressés mais non optimisés web, pas de WebP/AVIF) [Source : docs/008 §3.2].
- `public/logo.png` (1254×1254, 405 Ko), `logo_2.png` [Source : docs/008 §3.1, public/].
- Clés `images.ts` : `hero`, `identite`, `louange`, `communaute`, `ecodim`, `portraitLarge` utilisées ; `portraitA`, `portraitB`, `galleryImages`, `images.hero` déclarés mais jamais importés ; 1 chemin codé en dur (`/media/ccjv-15.jpeg` ligne 121 fiche département) [Source : docs/014 §B-C].
- YouTube : vignettes distantes `i.ytimg.com`, aucune iframe, aucun autoplay, jamais d'hébergement direct [Source : src/components/shared/YouTubeThumb.tsx, docs/003 §3].

### 8.2 Besoins Storage à couvrir (sans concevoir la solution)

Upload / remplacement / suppression (photos événements, départements, publications PHOTO, leaders, témoignages, communauté, images curatoriales), métadonnées + association média ↔ contenu, validation extension/MIME + taille, organisation logique des buckets/dossiers, permissions d'accès, URLs publiques exploitables (`imageUrl`, `bannerImage`, `gallery`, `contentUrl`, `photo`) [Source : docs/004 §21, docs/006 §13].

---

## 9. Besoins d'authentification

- Supabase Auth, flux : Admin → Login → Supabase Auth → Access Token → Next.js → `Authorization: Bearer <token>` → Express → validation → identification [Source : docs/004 §23].
- `GET /api/v1/pages/:pageKey` public, `PATCH` admin ; `GET` collections public, écritures admin ; `POST /api/v1/media` admin ; `GET /api/v1/health` monitoring [Source : docs/004 §17-22].
- Pipeline : CORS → Rate Limiting → Authentication → Authorization → Validation Zod → Controller → Service [Source : docs/004 §25].
- Variables : frontend `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` ; backend `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (jamais exposée au navigateur), `CORS_ORIGIN` [Source : docs/004 §31].

---

## 10. Rôles et permissions déjà identifiables

| Rôle | Objectif | Périmètre | Source |
|---|---|---|---|
| Visiteur | Consulter le site public | Lecture seule | [Source : docs/001 §3] |
| Administrateur (`ROLE_ADMIN`, seul rôle V1) | Gérer tout le contenu via back-office | CRUD départements/événements/publications, PATCH pages statiques, upload médias, dashboard | [Source : docs/002 §3, docs/004 §24, docs/006 §2.2] |
| Éditeur (optionnel, hors V1) | Responsable de département | Publier dans sa rubrique — reporté | [Source : docs/001 §3, docs/002 §6] |

Règles : seul l'admin écrit ; site public en lecture seule ; autorisation vérifiée côté API indépendamment du frontend [Source : docs/002 §5, docs/006 §21.5]. Détail CRUD par ressource : voir docs/002 §3.3-3.6.

---

## 11. Entités métier identifiables

**Documentées (5) :** `Admin`, `Department`, `Event`, `Publication`, `StaticPage` — services externes (Supabase Auth/Storage, YouTube, Facebook) non persistés [Source : docs/006 §2].

**Observées en plus dans le frontend (non documentées au schéma) :** `Leader`, `Testimony`, `CommunityFace`, `Verse`, `RhythmEntry`, `SocialLink`, `NavItem`/`NavChild` [Source : src/data/mock/leaders.ts, testimonies.ts, community.ts, verses.ts, site.ts, src/lib/nav.ts].

**Calculée :** `EventStatus` (`UPCOMING` si `eventDate >= today`, sinon `ARCHIVED`) [Source : src/lib/utils.ts, docs/006 §5].

---

## 12. Relations entre entités identifiables

- `Department 1 — 0..* Event` (principale, `departmentId` nullable, null = général) [Source : docs/006 §4, src/types/index.ts].
- `Admin` gère Departments / Events / Publications / StaticPages (pas de FK `created_by` en V1, traçabilité reportée) [Source : docs/005 §3, docs/006 §2.2].
- Publications et pages statiques autonomes en V1 [Source : docs/005 §3].
- Observé : `Publication.category`, `Leader.departmentId`, galeries (`string[]`), `body: string[]` (TEXTE), `practicalInfo: string[]`, `keyPoints: string[]` [Source : src/types/index.ts, src/data/mock/].
- À décider : association Media ↔ Contenu, User ↔ Rôle [Déduit].

---

## 13. Contraintes techniques

Stack figée : TypeScript, Next.js (Vercel), Node+Express (Railway), PostgreSQL + Drizzle ORM, Supabase Auth/Storage, Zod, REST `/api/v1`, OpenAPI, Namecheap DNS [Source : docs/004 §3, §36].

Architecture 4 couches (Presentation → Application → Domain → Infrastructure), API-first, backend autorité métier, infra découplée du domaine, MVP sans sur-ingénierie [Source : docs/004 §4-13].

Patterns : Repository + Service Layer + DI retenus ; Strategy/Factory/Observer non retenus V1 [Source : docs/004 §27]. SOLID appliqué [Source : docs/004 §28].

Contrats : collections `{data[], meta{page,limit,total,totalPages}}`, ressource individuelle directe, erreurs `{error{code,message}}` avec codes `AUTH_REQUIRED`, `FORBIDDEN`, `VALIDATION_ERROR`, `*_NOT_FOUND`, `DUPLICATE_SLUG`, `FILE_TOO_LARGE`, `INVALID_FILE_TYPE` [Source : docs/004 §26, §34].

Endpoints prévus : `GET/POST/PATCH/DELETE /events`, `/departments`, `/publications` (filtres `page,limit,status,departmentId,type`), `GET/PATCH /pages/:pageKey`, `POST /media`, `GET /health` [Source : docs/004 §17-22].

Interdit : `Next.js → PostgreSQL`, `Next.js → Service Role`, frontend → secrets backend [Source : docs/004 §33].

---

## 14. Contraintes de sécurité

HTTPS, mots de passe via Supabase Auth (jamais en clair), tokens vérifiés backend, autorisation backend, secrets en env (jamais versionnés), rate limiting, validation Zod (bodies + params + query), CORS explicite, contrôle extension/MIME + taille uploads, sauvegardes BDD + médias, erreurs non verbeuses en prod, `SUPABASE_SERVICE_ROLE_KEY` jamais au navigateur, limitation tentatives login back-office [Source : docs/003 §4, docs/004 §30].

---

## 15. Contraintes de performance

Contexte Lubumbashi : bande passante limitée, pages légères, images compressées, minimum de scripts externes, vidéos externes (pas d'hébergement direct) [Source : docs/001 §5, docs/003 §3].

Frontend : Server Components, pré-rendu, peu de JS client, lazy loading, code splitting, WebP/AVIF, `next/image` + `sizes`/`fill`/`priority`/`blur`, `next/font` self-hosted, pas d'autoplay, pas de WebGL/carrousel lourd, pas de parallax mobile, `transform`/`opacity` uniquement, `prefers-reduced-motion` [Source : docs/004 §29, docs/009 §6, docs/010 §2.12].

API : pagination, réponses limitées, filtrage serveur, sélection des champs, index `(event_date,is_archived)` et `(published_at DESC)` — ce dernier à réévaluer vu suppression `is_archived` — cache HTTP pertinent, éviter requêtes inutiles [Source : docs/004 §29, docs/005 §2.3-2.4, docs/006 §22].

SEO : `title`/`description` uniques, openGraph/twitter/canonical, `lang="fr"`, `sitemap.xml`, `robots.txt`, un seul `h1`, slugs minuscules sans accents [Source : docs/011 §8].

---

## 16. Éléments encore ambigus

1. `PageKey` inclut `COMMUNAUTE`/`CONTACT` alors que ce sont des hubs sans contenu stocké [Source : src/types/index.ts vs docs/006 §7].
2. `Leader`, `Testimony`, `CommunityFace`, `Verse`, `RhythmEntry` existent en mocks mais absents du schéma 5 tables [Source : src/data/mock/ vs docs/005].
3. `category` optionnel mais utilisé pour filtrage/routage rubriques [Source : src/types/index.ts].
4. `content: string` de `StaticPage` vs contenu réel multi-sections structuré [Source : src/types/index.ts vs src/app/page.tsx].
5. Modèle TEXTE : `body: string[]` observé mais « à préciser lors du schéma final » [Source : src/types/index.ts, docs/006 §6].
6. Galeries / `practicalInfo` / `keyPoints` : tableaux de strings, pas d'entités [Source : src/types/index.ts].
7. Navigation `mainNav` codée en dur, index recherche construit au rendu [Source : src/lib/nav.ts, src/app/recherche/page.tsx].
8. État `DRAFT`/`PUBLISHED` évoqué mais « supprimable si pas de brouillon en V1 » [Source : docs/006 §20].
9. Placeholders : `TODO — CONTENU À FOURNIR` vs lorem (proposition : TODO pour faits réels, lorem pour décoratif — à confirmer) [Source : docs/013 §K].
10. Versets jamais inventés (Louis Segond 1910 à valider) ; prière/don = présentation + point d'intégration, jamais de faux système [Source : docs/012 §1.4, docs/013 §J].

---

## 17. Contradictions trouvées dans la documentation

| # | Contradiction | Détail |
|---|---|---|
| 1 | `is_archived` | Schéma SQL le définit (booléen + index) ; modélisation le supprime (calculé) — suivre la modélisation, aligner `005` avant backend [Source : docs/005 §2.3 vs docs/006 §5, docs/008 §5.2] |
| 2 | Vert logo | Charte `#1E7A1E` vs logo réel quasi monochrome + menthe ponctuelle — décision : garder `#1E7A1E` en interface [Source : docs/007 §2 vs docs/008 §5.3] |
| 3 | Fiche événement | Specs mentionnent « fiche », structure V1 sans `/evenements/[slug]` — en pratique la fiche `[slug]` existe dans le code [Source : docs/002 §2.4 vs docs/008 §5.4 vs src/app/vie-de-leglise/evenements/[slug]/page.tsx] |
| 4 | Périmètre pages | CDC 6 pages vs 30 routes implémentées (hubs + sous-pages + transversales) [Source : docs/001 §4.1 vs src/app/] |
| 5 | Entités | 5 tables documentées vs 9+ entités mockées [Source : docs/005 vs src/data/mock/] |
| 6 | IDs | Schéma SQL en `INTEGER` auto-incrément vs UML `UUID / Integer` vs mocks `string` (`evt-001`, `dep-adultes`) [Source : docs/005 vs docs/006 vs src/types/index.ts] |

---

## 18. Décisions déjà figées

Stack, couches, patterns, version `/api/v1`, formats de réponse, `ROLE_ADMIN` seul en V1, départements dynamiques, vidéos externes, état événement calculé, hébergements Vercel/Railway, DNS Namecheap, design (palette, Lora/Inter, boutons carrés, cartes sans ombre, coins droits, croix visible, menu plein écran, CTA « Nous rejoindre » → `/contact`, WhatsApp contextuel, WCAG 2.2 AA) [Source : docs/004 §36, docs/006 §5, docs/008 §5.1].

Règle du GEL : toute modification fondamentale (stack, architecture, modèle métier, API, auth, stockage) après Phase 3 = modification de périmètre reportée en Phase 6 [Source : docs/004 §37].

---

## 19. Décisions qui nécessitent encore une conception

Schéma SQL final (alignement `is_archived`, IDs uuid vs integer, persistance ou non de leaders/témoignages/visages/versets/horaires), structuration `StaticPage.content`, statut galeries/`practicalInfo`/`body`, nature de `category`, navigation dynamique ou non, recherche (index, endpoint), brouillon ou non, organisation Storage, routes back-office, RBAC détaillé, contrat `/media`, cache, pagination par défaut [À décider].

---

## 20. Questions importantes à résoudre avant l'implémentation

### Données
1. Créer des tables pour `leaders`, `testimonies`, `community_faces`, `verses`, `rhythm_entries` ou les laisser en config/statique ? [À décider]
2. `StaticPage.content` : texte libre, JSON structuré, ou blocs ? [À décider]
3. `gallery`, `practicalInfo`, `keyPoints`, `body` : colonnes JSON ou tables liées ? [À décider]
4. `category` : enum ou table de référence ? [À décider]
5. `slug` : génération serveur + unicité (`DUPLICATE_SLUG`) confirmées ? [Source : docs/004 §26, docs/006 §21]

### API
6. Endpoints back-office exacts + filtres (`page,limit,status,departmentId,type`) + tri (chrono asc/desc) ? [Source : docs/004 §17-19]
7. Endpoint recherche globale ou recherche statique conservée ? [À décider]
8. Format d'erreur uniforme + codes figés en OpenAPI ? [Source : docs/004 §26]

### Auth
9. Création du premier admin, reset password, sessions vs JWT (via Supabase Auth) ? [À décider]
10. RBAC extensible dès V1 ou simple `isAdmin` avec `ROLE_ADMIN` ? [Source : docs/004 §24]

### Médias
11. Taille max, types MIME autorisés, organisation buckets/dossiers, thumbnails, orphelins ? [À décider — cadre docs/004 §21]

### Contenu / CMS
12. WYSIWYG vs blocs, brouillons, historique, multilingue ? [À décider]
13. Politique `ContentPending` / `TODO` conservée côté back-office ? [Source : docs/015 §5, docs/016 §5]

### Perf / Déploiement
14. Cache HTTP, optimisation images, file d'uploads, migrations Drizzle, env prod, staging, sauvegardes ? [À décider — cadre docs/004 §29-32]

---

*Fin du rapport — en attente des instructions pour l'étape suivante. Aucun backend conçu, aucune table/route/migration créée.*
