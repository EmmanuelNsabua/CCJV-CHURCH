# Audit stratégique du frontend — Système éditorial et Back-Office CCJV

**Projet :** Centre Chrétien Jésus ma Vie (CCJV) — Lubumbashi, RDC
**Objet :** déterminer, pour chaque élément visible du site, ce qui reste défini par le code, ce qui doit devenir administrable, ce qui doit provenir d'une donnée dynamique, et comment les trois niveaux collaborent.
**Phase :** Phase 3 — étape ② « Audit stratégique frontend », en amont du modèle éditorial et du modèle de données.
**Nature :** audit en lecture seule. Aucun fichier de code, migration, table ou API n'a été créé ni modifié.
**Périmètre observé :** `frontend/src` (21 routes servies), `backend/src` (schéma, modules, autorisation), `docs/001`–`docs/020`, `backend/docs/IMPLEMENTATION_SPEC.md`, données mockées, assets.

---

## 0. Note liminaire — sources de vérité et méthode

### 0.1 Document de référence introuvable

Le prompt de mission désigne un document « `CCJV_conception_backoffice.md` ». **Ce fichier n'existe nulle part dans le dépôt** (recherche récursive sur tout le projet, y compris `.git` ; une seule occurrence du motif `*backoffice*`).

Le document de conception du Back-Office est en réalité :

> `docs/020-conception_backoffice.md` — 20 760 octets, 920 lignes, titre « Document de conception — Back-Office CCJV », qui se désigne lui-même comme « document maître initial » (ligne 918).

**Fait notable : aucun autre document du dépôt ne référence `019` ni `020`.** Le document maître du Back-Office est orphelin dans sa propre documentation. Toute l'analyse qui suit s'appuie donc sur `docs/020` comme source documentaire de référence.

### 0.2 Règle de conflit appliquée

Conformément à la consigne : **le code prime sur la documentation lorsqu'il s'agit de décrire le comportement réellement implémenté.** En cas de divergence, les trois éléments sont donnés : ce que fait le code, ce que prévoit la documentation, et la divergence elle-même. Aucune correction silencieuse n'a été effectuée.

### 0.3 Niveaux de certitude utilisés

| Étiquette | Signification |
|---|---|
| **CONFIRMÉ** | Établi par lecture directe du code ou d'un document cité avec sa ligne |
| **INFÉRÉ** | Déduction architecturale à partir d'éléments confirmés, non écrite explicitement |
| **AMBIGU** | Deux sources se contredisent, ou une source est inexploitable |
| **À DÉCIDER** | Décision humaine requise ; aucune source ne tranche |

### 0.4 Sources effectivement consultées

- **Code frontend :** les 21 fichiers de route sous `frontend/src/app/**` (lecture intégrale), `layout.tsx`, `template.tsx`, `sitemap.ts`, `robots.ts`, les 8 archétypes, les 5 héros de composition, `features/pages/Hero.tsx`, ~30 composants éditoriaux/partagés/UI, les 9 modules `data/mock/*`, `lib/nav.ts`, `lib/api/{client,endpoints,index,types}.ts`, `types/index.ts`, `lib/{utils,seo}.ts`, `globals.css`.
- **Code backend :** les 10 fichiers `infrastructure/database/schema/*`, `presentation/middlewares/auth.ts`, `infrastructure/supabase/{auth,storage}.ts`, `domain/**`, les 14 modules `modules/*`, `drizzle/0000_*.sql`, `seed-data.ts`, `app.ts`.
- **Documentation :** `docs/001`–`docs/020` (les 20 fichiers), `backend/docs/IMPLEMENTATION_SPEC.md`, `backend/README.md`, `frontend/README.md`, `backend/openapi.json` (index des chemins et schémas).

---

## 1. Résumé exécutif

### 1.1 La conclusion centrale

Le projet **ne part pas de zéro**. Il contient déjà trois couches, dont deux sont correctement conçues — et dont l'une est presque entièrement débranchée.

| Couche | État réel | Verdict |
|---|---|---|
| **1. Structure / design system** | Construite et fonctionnelle : `Band` (6 tons, 5 respirations, 3 largeurs), 8 archétypes de page, 5 héros, 16 briques éditoriales, primitives UI | **Saine, à préserver telle quelle** |
| **2. Contenu éditorial** | **Modélisé côté backend, jamais lu par le frontend.** `static_pages` (jsonb), `site_settings`, `social_links`, `scriptures`, `schedule_entries` existent en base et en API… et ont **zéro site d'appel** dans le frontend | **Le problème principal de cet audit** |
| **3. Entités dynamiques** | Branchée sur 10 fichiers de page / 21 sites d'appel : départements, événements, publications, responsables, témoignages, visages | **Fonctionnelle, mais incomplète et asymétrique** |
| **4. Couche accidentelle : les mocks** | 9 modules `data/mock/*` alimentent encore **11 pages**, `sitemap.ts` et la recherche | **Dette à résorber avant toute mise en production** |

Autrement dit : **le Back-Office a déjà son dos, mais le site ne s'y est pas encore branché.** La difficulté du chantier n'est donc pas principalement « modéliser le contenu » — c'est **recâbler le frontend sur une couche éditoriale qui existe déjà et n'est pas consommée**, tout en préservant une composition visuelle qui, aujourd'hui, est écrite en dur dans le JSX des pages.

### 1.2 Les cinq constats déterminants

**① La couche éditoriale existe et n'est pas branchée — c'est le fait le plus important de l'audit.**

`frontend/src/lib/api/endpoints.ts` exporte `getSettings()`, `getPage(pageKey)`, `getScriptures()`, `getScripture(key)`, `getSchedule()`, `getDepartment(slug)`. Ces six fonctions sont **correctement écrites, typées et documentées** — et **aucune n'est appelée par une seule page**. Tandis que 11 pages continuent de lire `@/data/mock/site`, `@/data/mock/verses` et `site.weeklyRhythm`. La conséquence est mécanique : le nom de l'église, l'adresse, le numéro WhatsApp, les versets et le rythme de la semaine **ne peuvent pas être modifiés depuis un Back-Office aujourd'hui**, alors que la base de données sait déjà les stocker.

**② Le modèle d'autorisation de `docs/020` n'est pas implémenté — et son implémentation est bloquée par une colonne absente.**

`backend/src/infrastructure/database/schema/enums.ts:16` définit `adminRoleEnum = pgEnum("admin_role", ["ROLE_ADMIN"])` — **un enum à valeur unique**. `admin_profiles` (`schema/admin.ts`) porte `role`, `isActive`, mais **aucune colonne `department_id` ni `scope`**. Le modèle `ROLE + SCOPE` de `docs/020` §5/§20 exige une portée par département : elle n'existe nulle part. Un responsable Press ne peut donc être ni représenté, ni restreint.

**③ Le cycle de vie des publications ne correspond pas à la documentation.**

`docs/020` §8 exige `BROUILLON → PUBLIÉ → ARCHIVÉ`. Le code implémente `publicationStatusEnum = pgEnum("publication_status", ["DRAFT", "PUBLISHED"])` — **`ARCHIVED` n'existe pas**. Pire, la valeur par défaut est `PUBLISHED` (`schema/publications.ts:54`, arbitrage n°6 de `docs/018`), c'est-à-dire l'inverse d'un workflow éditorial commençant par un brouillon. Et côté frontend, `Publication` (`types/index.ts:58-73`) **n'a aucun champ de statut** : un brouillon est aujourd'hui inreprésentable à l'écran.

**④ La possession départementale est asymétrique — elle bloque `docs/020` §9.**

`events.departmentId` **existe** (`schema/events.ts:51`, FK `ON DELETE SET NULL`) : les événements sont bien rattachables à un département. Mais `publications` **n'a aucune colonne `department_id`** (`schema/publications.ts`) et `media` non plus. Or `docs/020` §9 impose explicitement « `Publication` → `department` / `owner scope` » et §22.4 laisse ouverte la propriété des médias. **Le modèle de données contredit aujourd'hui le modèle de permissions cible pour l'entité la plus sensible du système.**

**⑤ La composition visuelle est écrite en dur dans les pages, pas dans les archétypes.**

`docs/015` a défini un système de composition en 8 archétypes et 2 niveaux (`Band` + briques). Ce système est **correctement implémenté**… mais adopté par **9 pages sur 21**. Les pages les plus lourdes — `/qui-sommes-nous` (30 Ko), `/vie-de-leglise/evenements` (37 Ko), `/vie-de-leglise/faire-un-don` (29 Ko), `/organisation` (25 Ko) — sont précisément celles qui **n'utilisent aucun archétype** et composent des `<section>` brutes avec des classes utilitaires locales. `DirectoryPage` n'est utilisé par **aucune route**. L'archétype `InformationPage` n'est pas utilisé par `/ou-nous-trouver`, `NarrativePage` pas par `/qui-sommes-nous`.

### 1.3 Un sixième constat, décisif pour la feuille de route

**L'API actuelle ne suffit pas encore à porter un Back-Office.** Au-delà des entités, un Back-Office exige cinq mécanismes qui **n'existent pas** :

| Mécanisme attendu | État vérifié | Conséquence |
|---|---|---|
| **Gestion des utilisateurs** | **Aucune route, aucune méthode** pour créer, désactiver ou changer le rôle d'un administrateur | L'écran « Utilisateurs » de `docs/020` §15 est **impossible** en l'état |
| **Traduction des erreurs** | Une collision de `slug` ou une violation de FK renvoie **500 `INTERNAL_ERROR`** ; aucune correspondance Postgres n'existe | Un formulaire qui enregistre un slug déjà pris affichera « erreur interne » à un éditeur non technique |
| **Concurrence** | Upserts « dernier écrivain gagne », ni ETag ni `If-Match` | Deux éditeurs simultanés s'écrasent **silencieusement** |
| **Corbeille** | Tout `DELETE` est **définitif** ; aucune restauration | Une suppression accidentelle est irréversible |
| **Journal d'activité** | **Aucune table d'audit** ; seules deux colonnes d'acteur existent, et elles ne retiennent que le **dernier** écrivain (`static_pages.updated_by`, `media.uploaded_by`) | `docs/020` §15 prévoit un « Journal d'activité » qui n'a aucun support |

S'y ajoute une **fuite de donnée** : `updatedBy` (UUID d'administrateur) est renvoyé par `GET /api/v1/pages/:pageKey`, **route publique non authentifiée**, alors que le commentaire du serializer affirme qu'il ne l'est pas.

**Ce que cela change :** le chantier n'est pas seulement « modéliser le contenu et construire des écrans ». Il comporte une **étape backend préalable** (scope, gestion des utilisateurs, correspondance des erreurs, corbeille, audit) qui doit être identifiée comme telle dans la feuille de route, sous peine de découvrir ces manques au moment de l'implémentation.

**À l'inverse, sept éléments ont été vérifiés et jugés sains** — notamment l'invisibilité des brouillons, appliquée **deux fois** (filtre au service *et* en lecture unitaire), et la cohérence **exacte** entre la migration SQL et le schéma Drizzle sur les 16 tables. Le détail est en §14.0.

### 1.4 La réponse à la question centrale

> « Pour chaque élément visible du site, quelle partie doit rester définie par le code, quelle partie doit devenir administrable, quelle partie doit provenir d'une donnée dynamique ? »

| Niveau | Contenu | Volume relatif |
|---|---|---|
| **Reste dans le code (`STATIC_CODE`)** | Ordre des sections, tons, respirations, grille, typographie, animations, responsive, variantes de composants, logique de navigation, calcul du statut d'événement, scripts d'alternance, plafonds d'affichage | ~70 % de ce qui est « visible » est en réalité **structurel** |
| **Devient administrable (`EDITORIAL_CONTENT`)** | Textes institutionnels et éditoriaux, titres de sections, accroches, CTA, images d'illustration, versets, rythme hebdomadaire, réglages scalaires, informations de département | ~20 % |
| **Devient dynamique (`DYNAMIC_ENTITY`)** | Départements, événements, publications, responsables, témoignages, visages, médias | ~10 % du code, mais ~100 % des listes répétées |

Le point contre-intuitif — et c'est la conclusion la plus importante pour la conception du Back-Office — est que **la masse du travail éditorial ne porte pas sur les entités dynamiques** (déjà branchées) **mais sur les ~1 500 mots de prose institutionnelle aujourd'hui enterrés dans le JSX** de `/`, `/qui-sommes-nous`, `/organisation`, `/faire-un-don` et des 4 pages légales. C'est là que se trouve le véritable besoin d'administration.

---

## 2. Cartographie du frontend

### 2.1 Routes réellement servies — 21 routes (19 statiques + 2 dynamiques)

| # | Route | Fichier | Taille | Archétype | Sections |
|---|---|---|---|---|---|
| 1 | `/` | `app/page.tsx` | 13,2 Ko | *composition libre* | 12 |
| 2 | `/qui-sommes-nous` | `app/qui-sommes-nous/page.tsx` | 30,1 Ko | **aucun (brut)** | 14 |
| 3 | `/vie-de-leglise/evenements` | `app/vie-de-leglise/evenements/page.tsx` | 37,5 Ko | **aucun (brut)** | 11 |
| 4 | `/vie-de-leglise/evenements/[slug]` | `…/evenements/[slug]/page.tsx` | 9,0 Ko | `EventPage` | 5 slots |
| 5 | `/vie-de-leglise/faire-un-don` | `…/faire-un-don/page.tsx` | 29,6 Ko | **aucun (brut)** | 9 |
| 6 | `/vie-de-leglise/ou-nous-trouver` | `…/ou-nous-trouver/page.tsx` | 17,2 Ko | **aucun (brut)** | 5 |
| 7 | `/communaute/groupes-de-maison` | `…/groupes-de-maison/page.tsx` | 20,7 Ko | **aucun (brut)** | 7 |
| 8 | `/communaute/parcours-nouveau` | `…/parcours-nouveau/page.tsx` | 19,5 Ko | **aucun (brut)** | 6 |
| 9 | `/communaute/priere-et-intercession` | `…/priere-et-intercession/page.tsx` | 20,5 Ko | **aucun (brut)** | 7 |
| 10 | `/communaute/temoignages` | `…/temoignages/page.tsx` | 11,1 Ko | `NarrativePage` | 7 slots |
| 11 | `/organisation` | `app/organisation/page.tsx` | 25,9 Ko | **aucun (brut)** | 7 |
| 12 | `/publications/actualites` | `…/publications/actualites/page.tsx` | 8,6 Ko | `ListingPage` | 5 slots |
| 13 | `/publications/enseignements` | `…/publications/enseignements/page.tsx` | 7,9 Ko | `MediaPage` | 6 slots |
| 14 | `/publications/mediatheque` | `…/publications/mediatheque/page.tsx` | 6,7 Ko | `MediaPage` | 5 slots |
| 15 | `/publications/ressources` | `…/publications/ressources/page.tsx` | 9,3 Ko | `ListingPage` | 5 slots |
| 16 | `/publications/[slug]` | `…/publications/[slug]/page.tsx` | 14,2 Ko | `DetailPage` | 6 slots |
| 17 | `/recherche` | `app/recherche/page.tsx` | 5,4 Ko | `InformationPage` | 4 slots |
| 18-21 | `/mentions-legales`, `/confidentialite`, `/conditions`, `/accessibilite` | `app/<slug>/page.tsx` | 2,0–2,6 Ko | `LegalPage` | 3 |

**Transverses :** `layout.tsx` (Header, FullscreenMenu, Footer, IntroCurtain, `<main id="contenu">`), `template.tsx`, `sitemap.ts`, `robots.ts`.

### 2.2 Divergences majeures entre la documentation et le code

**Divergence D1 — Le nombre de routes.** `docs/015` §1 énonce « Audit exhaustif des **30 routes** ». Son tableau §4.2 « Livré » en liste 22. Le code en sert **21**. *(Source : code)*

**Divergence D2 — Six routes déclarées « Livré » n'existent pas.**

`docs/015` §4.2 les présente comme livrées ; aucune n'a de fichier :

| Route déclarée « Livré » | Réalité |
|---|---|
| `/qui-sommes-nous/ce-que-nous-croyons` | **404 — inexistante** |
| `/qui-sommes-nous/d-ou-nous-venons` | **404 — inexistante** |
| `/qui-sommes-nous/qui-nous-dirige` | **404 — inexistante** |
| `/organisation/responsables` | **404 — inexistante** |
| `/organisation/departements` | **404 — inexistante** |
| `/organisation/departements/[slug]` | **404 — inexistante** |

Le contenu de ces six pages a été **re-consolidé en deux pages uniques** (`/qui-sommes-nous` à 14 sections, `/organisation` à 7 sections). `docs/015` §4.5 annonçait pourtant l'inverse (« un pôle n'est pas une destination ») et affirmait que les cinq pôles répondraient 404 sans redirection.

**Divergence D3 — Le retour partiel des pôles comme destinations.** `lib/nav.ts:39-44,101-106` déclare `href` sur `/qui-sommes-nous` **et** `/organisation` avec `ready: true` : ce sont redevenus des destinations. Trois pôles restent sans `href` (`Vie de l'Église`, `Notre communauté`, `Ressources`). Le modèle « palier 1 » de `docs/015` §4.5 est donc **partiellement défait**.

**Divergence D4 — Deux routes mal orthographiées par rapport au doc.** `docs/015` liste `/communaute/parcours-nouveaux` et `/communaute/priere` ; le code sert `/communaute/parcours-nouveau` (singulier) et `/communaute/priere-et-intercession`.

**Divergence D5 — Sept composants déclarés existent uniquement dans les commentaires.** `docs/015` §2.2 et §2.3 cataloguent `HeroEditorial`, `HeroCentered`, `HeroSplit`, `HeroArched`, `ConvictionList`, `Chapter`, `InfoPanel`. **Aucun n'existe.** Ils ne sont mentionnés que dans des docstrings (`ListingPage.tsx:18`, `NarrativePage.tsx:22,26`). Inversement, `HeroCompact` **existe et est utilisé par 2 routes** mais n'est pas dans la liste des 7 héros de `docs/015` §2.2.

**Divergence D6 — Le document de Back-Office et la liste réelle des départements ne se recoupent pas.** `docs/020` §6.1/§6.2 est le seul document à donner une liste nominative : *Serviteurs, Chorale Grand Groupe CCVJ, Chorale de Cano Vocal, Affaire sociale, D'hygiène et Ancien semence, Protocol, Évangélisation, Intercession* (présentation) et *Press, Ecodume* (espace métier). **Aucun de ces dix départements n'apparaît dans le code.** Les trois départements réellement servis sont *Adultes*, *Enfants / Ecodim*, *Chorale* (`data/mock/departments.ts`), absents de la liste de `docs/020`. **Press et Ecodume — les deux seuls départements dotés d'un scope d'autorisation — n'existent nulle part dans le frontend** (ni mock, ni route, ni navigation).

**Divergence D7 — `Ecodume` vs `Ecodim`.** `docs/020` nomme le département à espace métier « Ecodume » ; le code, les données et tout le site écrivent « Ecodim » (`site.ecodimFoundedAt`, `departments.ts`, `images.ecodim`). `Ecodume` apparaît aussi dans la colonne « Ecodume » de la matrice `docs/020` §18. S'agit-il du même département sous deux graphies, ou de deux entités distinctes ? **Ambigu — voir `backoffice_open_questions.md` BLOQUANT-3.**

**Divergence D8 — Le titre du composant « BibleVerse » n'existe pas sous ce nom.** `docs/020` §2.2 emploie `BibleVerse`. Le composant réel est `VerseSection`. Trois mécanismes concurrents coexistent (§5.1).

### 2.3 Cartographie par page — forme demandée

Arborescence complète disponible dans `frontend_content_matrix.md` (une ligne par section). Extrait représentatif de la forme :

```text
PAGE /  (composition libre, 12 sections)
│
├── SECTION 01 « Accueillir »
│   ├── composant : Hero (features/pages/Hero.tsx)
│   ├── variante : aucune (composant unique à l'accueil)
│   ├── données : images.hero (mock) + textes en dur
│   ├── source : MOCK + JSX littéral
│   ├── réutilisable : NON (spécifique accueil)
│   ├── administrable : PARTIEL (titre, accroche, image)
│   └── sans données : N/A (aucune donnée externe)
│
├── SECTION 02 « La Parole du jour »
│   ├── composant : VerseSection  ← le « BibleVerse » de docs/020
│   ├── variante : `left` (défaut, non passé explicitement)
│   ├── données : verses.rassemblement (MOCK) + 4 photos de repli codées
│   ├── source : MOCK
│   ├── réutilisable : OUI (8 usages)
│   ├── administrable : OUI (via entité Scripture déjà en base)
│   └── sans données : texte/reference obligatoires ; photos → repli codé
│
└── SECTION 05 « Ce qui se passe » (EventsSection)
    ├── composant : EventsSection (features/events/)
    ├── variante : tone="tinted"
    ├── données : titre + accroche + CTA (éditorial) + events (API)
    ├── source : API (getEvents) + JSX littéral
    ├── réutilisable : PARTIEL (1 seul usage ; id ARIA codé en dur)
    ├── administrable : OUI sur titre/accroche/CTA
    └── sans données : ⚠ AUCUN état vide — colonne droite vide
```

---

## 3. Catalogue des composants

Le catalogue détaillé (fiches complètes, props actuelles/proposées, risques) est dans `frontend_component_catalog.md`. Synthèse structurelle :

### 3.1 Le design system réel — quatre familles

| Famille | Composants | Rôle | Variantes |
|---|---|---|---|
| **Rythme** | `Band` | Porte le **ton** et la **respiration**, jamais l'ordre | 6 tons × 5 respirations × 3 largeurs × 3 filets |
| | `Section` *(legacy)* | Ancienne primitive de section | `tone` |
| **Héros (5 réels)** | `HeroCompact`, `HeroImmersive`, `HeroManifesto`, `HeroPhoto`, `HeroPractical` | Ouvertures de page | Internes (props de tonalité) |
| | `Hero` (`features/pages/`) | Ouverture d'accueil uniquement | aucune |
| | `PageHeader` *(legacy)* | Ancienne « baie » | 1 usage |
| **Archétypes (8)** | `EditorialPage`*, `NarrativePage`, `ListingPage`, `DetailPage`, `EventPage`, `MediaPage`, `DirectoryPage`, `InformationPage` | Shells de composition à emplacements nommés | `rhythm` |
| **Briques éditoriales** | `Prose`, `FeatureImage`, `PhotoDuo`, `PhotoGallery`, `PullQuote`, `ScriptureBlock`, `KeyFacts`, `StepsList`, `PortraitPanel`, `PeopleGrid`, `CrossLinks`, `MediaFeature`, `ContentPending` | Contenu éditorial | voir §3.2 |
| **Partagés** | `Breadcrumbs`, `BreathingPhoto`, `CommunityFaces`, `CrossMark`, `LegalPage`, `OpenBookMark`, `ParallaxImage`, `Reveal`, `SectionHeading`, `VerseSection`, `WeekRhythm`, `YouTubeThumb` | Structure + marque | divers |
| **UI** | `Button`, `Badge`, `EmptyState` | Primitives | `Button` : 4 variantes |

\* `EditorialPage` figure dans `docs/015` §3 mais **aucun fichier `EditorialPage.tsx` n'existe** : c'est une neuvième absence de composant déclaré.

### 3.2 Variantes réelles — inventaire

**`VerseSection` — le cas d'école.** `VerseSection.tsx:16-22` déclare **6 valeurs** de `variant`, qui se réduisent à **3 mises en page** et **2 alias redondants** :

| Variante déclarée | Mise en page effective | Statut |
|---|---|---|
| `left` | `isLeft` — mosaïque 2–4 photos à gauche, texte à droite | réelle |
| `split` | `isLeft` | **alias de `left`** |
| `center` | `isCenter` — texte centré, aucune image | réelle |
| `centered` | `isCenter` | **alias de `center`** |
| `both` | `isBoth` — image gauche + image droite, texte centré | réelle |
| `flanked` | `isBoth` | **alias de `both`** |

S'y ajoutent **8 tons** (`dark`, `light`, `offwhite`, `cream`, `green`, `white`, `tinted`, `transparent`) — où `light` et `offwhite` produisent **la même classe CSS** — et un modificateur `compact`. La variante « minimale » postulée par `docs/020` §2.2 **n'existe pas** ; `compact` est un modificateur de respiration, pas une variante structurelle.

**`EventsSection` — 6 tons divergents du design system.** `EventsSection.tsx:27` déclare `tone?: "offwhite" | "light" | "cream" | "white" | "tinted" | "dark"` — un jeu **différent** de `BandTone` (`light|cream|tinted|dark|green|bare`) et de `VerseTone` (8 valeurs). **Trois vocabulaires de ton coexistent** pour trois composants. C'est une fragmentation du design system, pas une variante.

**Autres composants à variantes réelles :** `Prose` (`lead`, `dropcap`, `columns`), `FeatureImage` (`full`, `wide`, `inset`, `arch`, `portrait`, `float`), `PhotoDuo` (`equal`, `offset`), `PhotoGallery` (`mosaic`, `strip`, `columns`), `PullQuote` (`left`, `center`, `marginal`), `ScriptureBlock` (`inline`, `framed`, `marginal`, `wide`, `concluding`), `KeyFacts` (`pairs`, `tiles`, `inline`), `StepsList` (`horizontal`, `vertical`), `PortraitPanel` (`hero`, `side`), `PeopleGrid` (`feature`, `compact`), `CrossLinks` (`doors`, `list`, `inline`), `MediaFeature` (`hero`, `inline`), `ContentPending` (`block`, `inline`), `Button` (4 variantes).

### 3.3 Écart entre réutilisation annoncée et réutilisation réelle

`docs/020` §2.2 présente comme réutilisables `Hero`, `Card`, `Section événement`, `Section publication`, `Call-to-action`, `Gallery`. Mesure des consommateurs :

| Composant | Consommateurs | Verdict |
|---|---|---|
| `Band` | 8 (les 8 archétypes) | réellement structurel — **mais aucun page ne l'utilise directement** |
| `Prose` | 8 | réellement réutilisé |
| `CrossLinks` | 7 | réellement réutilisé |
| `FeatureImage` | 5 | réutilisé |
| `PhotoGallery` | 4 | réutilisé |
| `VerseSection` | 8 | réutilisé (mais 3 mécanismes concurrents) |
| `ScriptureBlock` | 2 | peu réutilisé |
| `MediaFeature`, `HeroPractical` | 2 | peu réutilisé |
| `HeroPhoto`, `HeroImmersive`, `HeroManifesto`, `PhotoDuo`, `PullQuote`, `KeyFacts`, `StepsList`, `PageHeader`, `Hero`, `EventsSection`, `EmptyState`(6 fichiers) | 1 | **usage unique** |
| `PortraitPanel` | **0** | **composant orphelin** |
| `PeopleGrid` | **0** | **composant orphelin** |
| `DirectoryPage` | **0 route** | **archétype orphelin** |

**Conclusion :** sur 16 « briques éditoriales », **10 n'ont qu'un seul consommateur et 2 aucun**. L'encapsulation annoncée par `docs/020` §2.2 est, à ce stade, **une intention plutôt qu'un fait mesuré**. Ce n'est pas un défaut de conception — c'est un indicateur que le vocabulaire de composition a été créé *avant* que les pages ne l'adoptent (§5.4).

### 3.4 Vocabulaire de tons — trois référentiels concurrents

| Composant | Valeurs de ton |
|---|---|
| `Band` | `light`, `cream`, `tinted`, `dark`, `green`, `bare` |
| `VerseSection` | `dark`, `light`, `cream`, `green`, `offwhite`, `white`, `tinted`, `transparent` |
| `EventsSection` | `offwhite`, `light`, `cream`, `white`, `tinted`, `dark` |

Aucun des trois n'est un sous-ensemble d'un autre. **À DÉCIDER :** unifier sur `BandTone` comme référentiel unique, ou assumer des jeux contextuels. Voir `backoffice_open_questions.md` IMPORTANT-2.

### 3.5 Composants à factoriser — analyse

**F1 — Les blocs-ressources bibliques « respiration » (`organisation`, sections 02 et 06).** Deux `<section>` de structure identique (`bg-ccjv-green`/`bg-ccjv-black` + `CrossMark size="lg"` + `blockquote` serif clampé + `figcaption` en capitales espacées) avec un verset en dur. Le même motif apparaît sous une forme proche dans `LegalPage`, `IntroCurtain`. **Justification structurelle :** structure JSX identique à ~90 %, mêmes classes, même hiérarchie `blockquote`/`figcaption`. **Abstraction recommandée :** réutiliser `ScriptureBlock` en variante `concluding` (qui existe déjà et n'est pas employée), alimenté par l'entité `Scripture`. **Risque d'excès :** aucun si l'on passe par un composant existant plutôt que d'en créer un nouveau.

**F2 — Les piliers de croyance de `/qui-sommes-nous`.** Quatre blocs JSX **dupliqués à la main** (et non un `.map()` sur un tableau). **Justification :** duplication littérale, différence nulle hors contenu. **Abstraction :** `KeyFacts` variante `tiles` existe déjà → l'utiliser avec un tableau en donnée. **Risque :** la mise en page actuelle étant bespoke, vérifier visuellement avant de substituer.

**F3 — Les étapes 01/02/03 de `/organisation` (section 07).** Trois blocs `border + bg-ccjv-cream + span numéroté + h3 + p`, dupliqués à la main. `StepsList` variante `horizontal` existe et n'est **pas** utilisée. **Abstraction :** `StepsList`. **Même risque :** substitution visuelle à valider.

**F4 — `EmptyState` vs le panneau éditorial de repli d'`organisation`.** `organisation/page.tsx:278` utilise `EmptyState` pour le pasteur, `:336-342` un paragraphe éditorial en dur pour l'équipe, `:430` `EmptyState` pour les départements. **Trois stratégies de repli pour deux entités de même nature sur une seule page.** Ce n'est pas une factorisation à faire mais une **décision de produit à prendre** (voir §10.3).

**F5 — Les galeries photo.** `PhotoGallery`, la mosaïque interne de `VerseSection` (variante `left`), le diptyque mobile de `VerseSection` (variante `both`), les grilles de `DepartmentModal` (`grid-cols-2 sm:grid-cols-3`) et de `organisation` (`grid-cols-2`) implémentent cinq fois une grille d'images sans légende. **Justification :** structure commune (grille de `next/image` en `object-cover` dans des conteneurs à ratio fixe). **Risque d'excès :** les ratios, les décalages et les effets de parallaxe diffèrent réellement → ne factoriser **que** si l'on accepte de perdre certains décalages, ou paramétrer la grille. **Recommandation :** ne pas factoriser maintenant ; la duplicité est cosmétique, pas comportementale. *(Marqué INFÉRÉ : aucun défaut fonctionnel observé.)*

**F6 — Non-factorisations à refuser explicitement.** `HeroPhoto` / `HeroImmersive` / `HeroManifesto` / `HeroPractical` se ressemblent visuellement mais **diffèrent structurellement** (présence d'image, hauteur `88svh`, panneau pratique, citation en grand corps). `docs/015` §2.2 les a justement séparés. **Ne pas fusionner.**

---

## 4. Matrice statique / éditorial / dynamique / hybride

Matrice complète par section dans `frontend_content_matrix.md`. Vue de synthèse par catégorie :

| Élément | Page/Section | Type | Source | Administrable | Scope |
|---|---|---|---|---|---|
| Ordre des sections d'une page | toutes | **STATIC_CODE** | code (archétype ou JSX) | **non** | — |
| `Band` tone/space/width | toutes | **STATIC_CODE** | code | **non** | — |
| Grille, typographie, espacements | toutes | **STATIC_CODE** | code + `globals.css` | **non** | — |
| `Reveal`, `ParallaxImage`, `IntroCurtain` | toutes | **STATIC_CODE** | code | **non** | — |
| Calcul `EventStatus` | événements | **STATIC_CODE** (dérivé) | règle métier | **non** | — |
| Alternance gauche/droite des départements | `/organisation` | **STATIC_CODE** | `idx % 2` | **non** | — |
| Numérotation `01…0n` | `/organisation` | **STATIC_CODE** | `idx+1` | **non** | — |
| Nom de l'église, sigle, ville | global | **EDITORIAL_CONTENT** | `site_settings` (non branché) | **oui** | global |
| Adresse (+ 3 lignes) | global, footer, fiche dépt | **EDITORIAL_CONTENT** | `site_settings` (non branché) | **oui** | global |
| Dates de fondation (2023) | global | **EDITORIAL_CONTENT** | `site_settings` (non branché) | **oui** | global |
| Pasteur visionnaire + rôle | `/`, `/organisation` | **EDITORIAL_CONTENT** | `Leader` (API) | **oui** | global |
| Numéro + lien WhatsApp | 12 sites | **EDITORIAL_CONTENT** | `site_settings` (non branché) | **oui** | global |
| Liens sociaux (2) | `/`, menu, footer | **EDITORIAL_CONTENT** | `social_links` (non branché) | **oui** | global |
| Versets (8 clés) | 11 sites | **EDITORIAL_CONTENT** | `scriptures` (non branché) | **oui** | global |
| Versets en dur (8 occurrences) | 7 pages | **EDITORIAL_CONTENT** | JSX littéral | **oui** *(à rapatrier)* | global |
| Rythme hebdomadaire | `/`, `/ou-nous-trouver` | **EDITORIAL_CONTENT** | `schedule_entries` + 5 variantes en dur | **oui** | global |
| Textes institutionnels de page | ~14 pages | **EDITORIAL_CONTENT** | `static_pages.content` (non branché) | **oui** | global |
| Titre/accroche/CTA de section | `/` (×8) | **EDITORIAL_CONTENT** | JSX littéral | **oui** | global |
| Départements | `/organisation` | **DYNAMIC_ENTITY** | `getDepartments()` → API | **oui** | **département** |
| Événements | `/`, `/evenements`, fiche | **DYNAMIC_ENTITY** | `getEvents()` → API | **oui** | **département** (`department_id`) |
| Publications | 5 pages | **DYNAMIC_ENTITY** | `getPublications()` → API | **oui** | **global — `department_id` ABSENT** |
| Responsables | `/organisation` | **DYNAMIC_ENTITY** | `getLeaders()` → API | **oui** | **département** (`department_id`) |
| Témoignages | `/temoignages` | **DYNAMIC_ENTITY** | `getTestimonies()` → API | **oui** | global |
| Visages communauté | `/` | **DYNAMIC_ENTITY** | `getCommunityFaces()` → API | **oui** | global |
| Visages communauté *(bis)* | `/qui-sommes-nous` | **DYNAMIC_ENTITY mal branchée** | **MOCK** `communityFaces` | oui | global |
| Médiathèque / médias | transverse | **DYNAMIC_ENTITY** | table `media` | **oui** | **global — pas de `department_id`** |
| Groupes de maison | `/groupes-de-maison` | **DYNAMIC_ENTITY sans backend** | MOCK uniquement | **à décider** | à décider |
| Rythme de la semaine (affichage) | `/`, `/ou-nous-trouver` | **HYBRIDE** | structure code + données + repli | oui | global |
| `VerseSection` | 8 sites | **HYBRIDE** | structure code + `Scripture` + photos | oui | global |
| `EventsSection` | `/` | **HYBRIDE** | code + éditorial + événements API | oui | global/département |
| Section « Derniers enseignements » | `/` | **HYBRIDE** | code + éditorial + publications API | oui | global |
| Fiche département (drawer) | `/organisation` | **HYBRIDE** | `Department` + `site.address` + CTA WhatsApp | oui | département |
| `PageHeader` / héros | toutes | **HYBRIDE** | structure code + titre/accroche éditorial + image | partiel | global |
| Rôles, permissions, scopes | — | **CONFIGURATION** | enum + middleware | **non (Super Admin)** | système |
| Statut de publication | publications | **CONFIGURATION** | `DRAFT\|PUBLISHED` | oui | global/département |
| Seuil d'archivage | publications | **CONFIGURATION — valeur inexistante** | aucune | **à décider** | à décider |
| Limites média (5 Mo, MIME) | médiathèque | **CONFIGURATION** | `docs/018` §…, non vérifié en code | non | global |
| Bucket + dossiers média | médiathèque | **CONFIGURATION** | `docs/018` | non | global |
| `page_key` + schéma Zod par page | contenu éditable | **CONFIGURATION** | `static_pages` | non | système |
| Revalidation cache 60 s | transverse | **CONFIGURATION** | `client.ts` | non | système |

---

## 5. Modèle éditorial proposé

### 5.1 L'état réel — trois mécanismes de verset concurrents

C'est l'illustration parfaite de la question de l'audit. Un même besoin (« afficher un verset ») est servi aujourd'hui par **trois mécanismes incompatibles** :

| Mécanisme | Où | Données | Administrable ? |
|---|---|---|---|
| **M1** — `VerseSection` + mock `verses` | `/`, `/temoignages`, `/enseignements`, 4 pages légales | `@/data/mock/verses` (8 clés) | Non (mock figé au build) |
| **M2** — `ScriptureBlock` + mock `verses` | 2 pages | idem | Non |
| **M3** — `<blockquote>` **en dur dans le JSX** | `evenements` (×2), `faire-un-don`, `ou-nous-trouver`, `groupes-de-maison`, `parcours-nouveau`, `priere-et-intercession`, `organisation` (×2) | aucun — texte littéral | Non, et **introuvable** par recherche |
| **M4** — entité `Scripture` en base + `getScripture(key)` | **nulle part** | `scriptures` (key, text, reference, translation, context) | Conçu, non branché |

M3 est le plus grave : **8 versets, dont un étendu au-delà du texte du mock** (`organisation` cite `« …Il y a diversité de dons, mais le même Esprit ; diversité de ministères, mais le même Seigneur. »` référencé `« 1 Corinthiens 12:12, 4–5 »`, tandis que `verses.corps` s'arrête à « ainsi en est-il de Christ »). Une simple recherche dans `verses.ts` **ne trouverait pas** ce contenu.

**Recommandation :** l'entité `Scripture` (M4) devient la source unique ; `VerseSection` et `ScriptureBlock` en sont les deux rendus ; M1 et M2 s'y rebranchent ; **M3 est éliminé**.

### 5.2 Les types de contenus nécessaires

**Type A — Réglages institutionnels scalaires** *(une clé = une valeur)*
Existe : `site_settings(key PK, value text)`. Couvre `site.ts` moins les listes. **Déjà correct, borné à dessein** (« clé/valeur ne convient qu'à des scalaires »). À compléter par les 6 clés de `site.ts` aujourd'hui **jamais lues** (`foundedAt`, `ecodimFoundedAt`, `addressLines`, `scheduleAdults`, `scheduleChildren`, `whatsappNumber`).

**Type B — Contenu éditorial de page** *(un enregistrement par page, champs nommés)*
Existe : `static_pages(page_key PK unique, content jsonb, updated_by)`, avec **validation Zod par `page_key`** et « le back-office édite des champs nommés, jamais du HTML ». **C'est la bonne forme** pour la prose institutionnelle, et elle évite d'emblée le page builder interdit par la consigne §18.

**Écart à combler :** `types/index.ts:75` déclare `PageKey = "ACCUEIL" | "QUI_SOMMES_NOUS" | "COMMUNAUTE" | "CONTACT"`. Or **`/communaute` et `/contact` n'existent pas** comme routes, tandis que `/organisation`, `/vie-de-leglise/evenements`, `/faire-un-don`, `/ou-nous-trouver` et 6 autres pages riches en prose **n'ont aucune clé**. Un recensement par « page contenant de la prose en dur » donne **~14 clés nécessaires** contre 4 déclarées. `docs/006` §… donne encore une troisième liste (`…/ORGANISATION/CONTACT`), `docs/011`/`017` une quatrième. **Quatre listes de `page_key` divergentes — voir `backoffice_open_questions.md` BLOQUANT-1.**

**Type C — Entités dynamiques** — voir §6.

**Type D — Contenus éditoriaux portés par une entité** *(pas une table)*
`Department.tagline`, `description`, `keyPoints[]`, `meetingSchedule`, `responsibleName` ; `Leader.bio`, `scope` ; `Testimony.quote` ; `CommunityFace.caption`. Ce sont des **champs de l'entité**, à éditer dans le formulaire de l'entité, **pas** dans une page éditoriale. Cette distinction est essentielle pour l'UX : un responsable de département édite « la présentation de mon département », pas « la page Organisation ».

**Type E — Listes ordonnées** — `social_links`, `schedule_entries`, `department_media`, `event_media`. Chacune a **sa propre table avec `position`**, conformément au principe énoncé dans `schema/editorial.ts:130-137`. **Décision correcte, à préserver** : c'est précisément ce qui empêche la dérive vers un CMS générique.

### 5.3 Ce qui ne doit PAS devenir un modèle de contenu

| Élément | Raison |
|---|---|
| Une table `sections` générique (page builder) | Interdit par la consigne §18 ; casserait la composition |
| Une table pour la grille, les espacements, les tons | Ce sont des décisions de design ; `Band` les porte déjà |
| Un champ « ordre des sections » | L'ordre est l'intention éditoriale codée dans l'archétype (`docs/015` §3) |
| Une table pour les variantes de composants | Les variantes sont une propriété du code, pas du contenu |
| Un éditeur WYSIWYG/HTML libre | `static_pages` stocke des champs nommés, pas du HTML — **préserver** |
| Une entité pour `HouseGroup` **avant décision** | Voir BLOQUANT-4 : entité présente dans le frontend, absente du backend et de tous les documents |

### 5.4 La tension à trancher : archétypes non adoptés

`docs/015` a spécifié un système de composition ; 11 pages ne l'utilisent pas. Deux lectures :

- **Lecture A (recommandée)** — les archétypes sont le bon modèle, mais **ces 11 pages sont antérieures ou contiguës** à leur mise en place. Il faut les migrer **avant** de rendre leur prose administrable, sinon le Back-Office éditerait des champs dans des pages dont la composition n'est pas stabilisée.
- **Lecture B** — ces pages ont une composition légitimement unique qu'aucun archétype ne capture (c'est vrai pour `/`, `/organisation`, `/faire-un-don`). L'archétype n'est alors qu'un défaut, pas une obligation — `docs/015` §3 l'admet (« Une page peut toujours composer des briques brutes si aucun archétype ne convient »).

**INFÉRÉ :** la vérité est mixte. `/` et `/organisation` sont légitimement hors archétype ; `/qui-sommes-nous` (dont le commentaire interne dit « Page Narrative Majeure » alors qu'elle n'utilise pas `NarrativePage`), `/ou-nous-trouver` (profil `InformationPage`) et `/evenements` (profil `ListingPage`) **devraient** les utiliser. **Conséquence pour le Back-Office :** l'ordre et le nombre de sections varient d'une page à l'autre → le modèle éditorial doit être **un jeu de champs nommés par `page_key`**, et **non** une liste de sections ordonnables. C'est un argument décisif en faveur du modèle `static_pages` existant.

---

## 6. Entités dynamiques

### 6.1 Entités réellement modélisées en base

**16 tables, 6 énumérations, 22 index, 16 clés étrangères, 1 seule migration** — état vérifié dans `backend/src/infrastructure/database/schema/` et confronté à `drizzle/0000_elite_pretty_boy.sql` : **la migration correspond exactement au schéma Drizzle, sans dérive**. Les énumérations : `admin_role`, `publication_type`, `publication_category`, `publication_status`, `prayer_confidentiality`, `prayer_status`.

Les 14 tables métier (hors `admin_profiles` et `media`, transverses) :

| Entité | Table | Colonnes-clés | FK sortantes | Consommée par le frontend |
|---|---|---|---|---|
| **Department** | `departments` | `name`, `slug` (unique), `description`, `responsibleName`⚠, `tagline`, `meetingSchedule`, `keyPoints[]`, `bannerMediaId`, **`position`** | → `media` | ✅ `getDepartments()` |
| — galerie | `department_media` | `position` | → `departments` (cascade), `media` (restrict) | ✅ (aplatissement) |
| **Event** | `events` | `title`, `slug` (unique), `description`, `excerpt`, `eventDate`, `eventTime`, `location`, `practicalInfo[]` | → `media`×2, → **`departments` (SET NULL)** | ✅ `getEvents()` |
| — galerie | `event_media` | `position` | → `events` (cascade), `media` (restrict) | ✅ |
| **Publication** | `publications` | `title`, `slug` (unique), `type`, `category`, `contentUrl`, `description`, `body[]`, `author`, `publishedAt`, **`status`**, `coverMediaId` | → `media` | ✅ `getPublications()` |
| **Media** | `media` | `bucket`, `path` (unique), `publicUrl`, `mimeType`, `sizeBytes`, `width`, `height`, **`alt`**, `uploadedBy` | → `admin_profiles` | ⚠ indirectement (URL aplatie) |
| **Leader** | `leaders` | `name`, `role`, `scope`⚠, `bio`, `photoMediaId`, **`departmentId`**, `position` | → `media`, → `departments` | ✅ `getLeaders()` |
| **Testimony** | `testimonies` | `quote`, `personName`, `personRole`, `photoMediaId`, `position` | → `media` | ✅ `getTestimonies()` |
| **CommunityFace** | `community_faces` | `personName`, `caption`, `photoMediaId`, `position` | → `media` | ✅ `getCommunityFaces()` |
| **Scripture** | `scriptures` | `key` (unique), `text`, `reference`, `translation`, `context` | — | ❌ **non branchée** |
| **ScheduleEntry** | `schedule_entries` | `day`, `title`, `timeLabel`, `isConfirmed`, `position` | — | ❌ **non branchée** |
| **SocialLink** | `social_links` | `label`, `href`, `position` | — | ❌ **non branchée** |
| **SiteSetting** | `site_settings` | `key` (PK), `value` | — | ❌ **non branchée** |
| **StaticPage** | `static_pages` | `page_key` (unique), `content` jsonb | → `admin_profiles` | ❌ **non branchée** |
| **PrayerRequest** | `prayer_requests` | confidentialité, statut `NEW\|PRAYED` | — | ⚠ formulaire **simulé**, aucun appel réseau |
| **AdminProfile** | `admin_profiles` | `username`, `role`, `isActive` | — | — |

⚠ **Deux pièges d'attribut à ne pas confondre :**

- **`Leader.scope`** (`schema/people.ts:33`) est documenté « Domaine couvert, ex. « Chorale » » — c'est un **libellé d'affichage d'appartenance organisationnelle**, de type `varchar(120)`, **non une FK**. Il porte le même nom que le `scope` **d'autorisation** de `docs/020` §5/§20 (`scope = PRESS`). **Ces deux concepts sont différents et partagent un nom.** Risque de confusion majeur dans le modèle de permissions. **Recommandation :** renommer le premier (`domainLabel` / `affiliation`) avant d'introduire le second.
- **`Department.responsibleName`** est un `varchar(120)`, **pas une FK vers `leaders`**. Le responsable d'un département est aujourd'hui une **chaîne libre**, non une personne. Deux sources de vérité coexistent : `departments.responsibleName` et `leaders.departmentId` (qui, lui, pointe vers le département). **Relation mal modélisée — voir `backoffice_open_questions.md` IMPORTANT-1.**

### 6.2 L'asymétrie de possession — le point bloquant

| Entité | Colonne de rattachement départemental | Scope possible aujourd'hui |
|---|---|---|
| `departments` | elle-même | ✅ triviale |
| `events` | **`department_id`** ✅ | ✅ **oui** |
| `leaders` | **`department_id`** ✅ | ✅ **oui** |
| `publications` | **AUCUNE** ❌ | ❌ **non** |
| `media` | **AUCUNE** ❌ | ❌ **non** |
| `testimonies`, `community_faces` | **AUCUNE** | global seulement |
| `scriptures`, `schedule_entries`, `social_links`, `site_settings`, `static_pages` | **AUCUNE** | global seulement (légitime) |

`docs/020` §9 impose « `Publication` → department / owner scope » et §18 attribue aux responsables « Publications : périmètre ». **Le code ne permet pas de rattacher une publication à un département.** C'est la contradiction la plus coûteuse du système : elle rend la matrice de droits de `docs/020` §18 **inapplicable** telle quelle.

`docs/020` §22.4 (« Propriété des médias : global, départemental, ou combinaison ? ») n'est **pas tranchée** — et l'absence de colonne reflète cette indécision.

---

## 7. Matrice de propriété

| Donnée | Propriétaire conceptuel | Propriétaire technique actuel | Écart |
|---|---|---|---|
| Nom, sigle, ville, adresse, dates de fondation | Admin | `site_settings` (non branché) | ⚠ frontend lit `site.ts` |
| Numéro / lien WhatsApp | Admin | `site_settings` (non branché) | ⚠ idem |
| Liens sociaux + ordre | Admin | `social_links` (non branché) | ⚠ idem |
| Versets | Admin | `scriptures` (non branché) | ⚠ idem + 8 doublons en dur |
| Rythme hebdomadaire | Admin | `schedule_entries` (non branché) | ⚠ idem + 5 variantes en dur |
| Prose des pages | Admin | `static_pages` (non branché) | ⚠ **1 500 mots en dur dans le JSX** |
| Départements (nom, texte, image, ordre) | Admin *(ordre : réservé — `docs/020` §11)* | `departments` | ✅ |
| Département « son » contenu | Responsable de département | — | ❌ **aucun mécanisme** |
| Événements | Admin (globaux) / Responsable (les siens) | `events.department_id` | ⚠ colonne présente, autorisation absente |
| Publications | Admin (globales) / Responsable (les siennes) | **aucune colonne** | ❌ **bloquant** |
| Médias | *(à décider — `docs/020` §22.4)* | global, `uploadedBy` | ⚠ indécis |
| Responsables | Admin | `leaders` | ✅ |
| Témoignages | Admin | `testimonies` | ✅ |
| Visages communauté | Admin | `community_faces` | ✅ |
| Groupes de maison | **à décider** | **mock seulement** | ❌ entité fantôme |
| Rôles / permissions / scopes | Super Admin | enum `ROLE_ADMIN` seul | ❌ **non implémenté** |
| Slug, ordre, navigation | Admin (`docs/020` §11) | code (`nav.ts`) + `position` en base | ⚠ navigation **codée en dur** |

**Fait marquant : la navigation est entièrement codée en dur** (`lib/nav.ts`, 219 lignes). Aucun champ `icon`, `badge`, `order`, `visible`, ni condition de rôle. `docs/020` §11 liste pourtant « structure de navigation » parmi les propriétés réservées à l'administration. **À DÉCIDER :** la navigation reste-t-elle dans le code (recommandé — c'est de la structure) ou devient-elle administrable ?

---

## 8. Matrice des permissions

### 8.1 Ce qui existe réellement

```text
adminRoleEnum = pgEnum("admin_role", ["ROLE_ADMIN"])     ← UNE seule valeur
admin_profiles : id, username, displayName, role, isActive
```

Middlewares : `authenticate()` (401 `AUTH_REQUIRED`), `requireAdmin()` (charge le profil, exige `isActive`, 403 `FORBIDDEN`), `requireRole(...roles)` (403 si le rôle n'est pas dans la liste).

**Le commentaire de `requireRole`** (`presentation/middlewares/auth.ts:90-92`) est explicite : « *En V1, `ROLE_ADMIN` est le seul rôle : cette fabrique existe pour que l'ajout d'un rôle de département ne demande pas de réécrire les routes.* »

**Trois absences vérifiées, au-delà du rôle manquant :**

1. **Aucune table ni liste de permissions.** L'autorisation se réduit à : jeton valide + ligne `admin_profiles` active + appartenance à une liste de **un** élément. **Aucun service ni contrôleur ne teste une permission.**
2. **Aucune API de gestion des administrateurs.** Aucune route ni méthode de repository ne permet de **créer, désactiver ou changer le rôle** d'un administrateur. Le chemin 403 « compte désactivé » n'est atteignable que par **écriture directe en base**. → **L'écran « Utilisateurs » de `docs/020` §15 n'a aujourd'hui aucun backend.**
3. **Aucune portée sur la requête.** `req.admin` ne porte **aucun** scope ; `AdminProfile` et `AdminProfileRepository` n'ont **aucun** champ de portée ni requête scopée.

**Deux résidus de code mort dans l'autorisation :** la revendication `role` du JWT (`tokenRole`) est **lue et jamais utilisée** ; le code d'erreur `UNAUTHENTICATED_ADMIN` **n'est jamais levé**.

**Détail d'implémentation à noter :** `router.use(...)` n'apparaît **jamais** dans le backend — **chacune des 14 routes déclare sa propre chaîne** `authenticate() → requireAdmin() → requireRole("ROLE_ADMIN") → validate()` (14/14 routeurs). Cela rend l'ajout d'un contrôle de portée explicite par route, mais interdit tout contrôle transverse par défaut : **une route oubliée est une route non protégée.**

### 8.2 Ce que la documentation demande

| Source | Rôles annoncés |
|---|---|
| `docs/002`, `docs/004`, `docs/005`, `docs/006` | `ROLE_ADMIN` seul (V1) |
| `docs/018` | `ROLE_ADMIN` + futur **`ROLE_DEPARTMENT_EDITOR`** |
| `docs/020` §4 | **Super Administrateur / Administrateur / Responsable de département** |
| `docs/020` §20 | `role = `**`DEPARTMENT_MANAGER`** |

**Trois noms différents pour le même rôle futur** (`ROLE_DEPARTMENT_EDITOR`, `DEPARTMENT_MANAGER`, « Responsable de département ») dans trois documents. Le code, lui, n'en implémente aucun.

Permissions nommées par `docs/020` §20 : `publication.create`, `publication.read`, `publication.update`, `event.create`, `event.update`, `department.update`, `media.manage`. **Aucune table de permissions, aucune liste de permissions, aucun contrôle de permission n'existe en code.** Le contrôle est un simple test d'appartenance à un rôle (`roles.includes(req.admin.role)`).

### 8.3 Matrice cible — état de faisabilité par rapport au code actuel

| Fonction | Super Admin | Admin | Resp. département | Faisable aujourd'hui ? |
|---|---|---|---|---|
| Tableau de bord | ✓ | ✓ | ✓ (périmètre) | À construire |
| Pages / contenu global | ✓ | ✓ | — | ✅ rôles suffisent |
| Structure éditoriale | ✓ | ✓ | — | ✅ |
| Médias | ✓ | ✓ | **périmètre** | ❌ **`media` sans `department_id`** |
| Événements | ✓ | ✓ | **périmètre** | ⚠ colonne ✅, autorisation ❌ |
| Publications | ✓ | ✓ | **périmètre** | ❌ **`publications` sans `department_id`** |
| Département | ✓ | ✓ | **le sien** | ⚠ FK manquante sur `admin_profiles` |
| Ressources globales | ✓ | ✓ | — | ✅ |
| Utilisateurs | ✓ | — | — | ❌ **aucune API de gestion** (T22) |
| Rôles / permissions | ✓ | — | — | ❌ **non implémenté** |
| Configuration système | ✓ | — | — | ❌ |
| Audit / journal | ✓ | selon politique | — | ❌ **aucune table d'audit** |

**Conclusion : sur 12 lignes de la matrice de `docs/020` §18, 6 sont aujourd'hui infaisables sans modification du modèle de données ou l'écriture d'une API.** `docs/020` précise lui-même que cette matrice « est une base de conception et non encore le contrat définitif de permissions » (ligne 731) — la prudence du document est confirmée par le code.

---

## 9. Matrice des scopes

| Portée | Entités concernées | Mécanisme requis | État |
|---|---|---|---|
| **Global** | `site_settings`, `social_links`, `scriptures`, `schedule_entries`, `static_pages`, `testimonies`, `community_faces` | aucun | ✅ |
| **Départemental** | `departments`, `events`, `leaders` | `department_id` | ⚠ présent, **autorisation absente** |
| **Départemental manquant** | `publications`, `media` | `department_id` **à ajouter** | ❌ |
| **Utilisateur** | `admin_profiles` | `department_id` **à ajouter** | ❌ |
| **Système** | rôles, permissions, `page_key`, paramètres techniques | réservé Super Admin | ❌ |

### 9.1 Le scénario `docs/020` §5, testé contre le code

```text
Responsable Press + scope = Press

doit pouvoir :  Event.department   = Press   →  ✅ colonne existe
                Leader.department  = Press   →  ✅ colonne existe
                Department.id      = Press   →  ✅
                Publication.department = Press → ❌ COLONNE INEXISTANTE
                Media.department   = Press   → ❌ COLONNE INEXISTANTE

ne doit pas :   accéder à Ecodume            → ❌ aucun mécanisme de scope
```

**Le scénario central de `docs/020` §5 est aujourd'hui implémentable à 60 %.** Les deux manques (publications, médias) sont exactement les deux dont `docs/020` §22.3 et §22.4 disent que la granularité reste « à préciser ».

### 9.2 Un second problème : le mot « scope » est déjà pris

`leaders.scope` désigne un **libellé d'affiliation** (`« Chorale »`, `« Direction générale »`). Si le modèle d'autorisation introduit `scope = PRESS`, deux colonnes nommées `scope` coexisteront dans le même schéma avec deux sens sans rapport. **Recommandation : trancher avant d'implémenter** (voir `backoffice_open_questions.md` BLOQUANT-2).

---

## 10. États vides et fallbacks — section par section

### 10.1 Couverture mesurée

`EmptyState` est appelé **9 fois dans 6 fichiers**. `ContentPending` **5 fois dans 4 fichiers**. Mais la répartition est très inégale :

| Zone | Garde de données vide | Verdict |
|---|---|---|
| `/` (12 sections) | **2 gardes seulement** : `{leadTeaching &&}` et `{otherTeachings.length > 0 &&}` | ⚠ **insuffisant** |
| `/organisation` | `EmptyState` ×2 + panneau éditorial ×1 | ✅ **le meilleur du site** |
| `/publications/enseignements` | `EmptyState` ×2 + `ContentPending` ×1 | ✅ |
| `/publications/mediatheque` | `EmptyState` ×2 | ✅ |
| `/publications/actualites` | `EmptyState` ×1, **mais `archives` sans garde** | ⚠ bug |
| `/publications/ressources` | `EmptyState` ×1 | ✅ |
| `/communaute/temoignages` | `EmptyState` ×1 + `ContentPending` ×2 | ✅ |
| `/vie-de-leglise/evenements` | 4 sections gardées sur 11 | ⚠ partiel |
| `/qui-sommes-nous`, `/faire-un-don`, `/ou-nous-trouver`, `/parcours-nouveau`, `/priere-et-intercession`, `/groupes-de-maison`, `/recherche`, 4 légales | **aucune donnée externe** → garde sans objet | — |

### 10.2 Analyse section par section — les cas qui comptent

**S1 — « Ce qui se passe » (accueil, `EventsSection`).**
Code : `const displayedEvents = events.slice(0, maxEvents)` puis `.map(...)`, **sans aucun test de vacuité**. Avec `events = []`, la colonne gauche (titre, accroche, CTA « TOUT L'AGENDA ») s'affiche, la colonne droite est **vide**.
→ **Comportement réel : cadre orphelin avec un CTA vers une page vide.** C'est exactement le cas que `docs/020` §13 interdit (« Le comportement ne doit pas être laissé au hasard »).
→ **Recommandation :** trois options à trancher — (a) masquer la section entière, (b) afficher un `EmptyState` éditorial, (c) afficher un CTA alternatif. Pour l'accueil (vitrine), l'option (b) avec un texte éditorial administrable est la plus cohérente avec les sections « Prière » et « Soutenir » qui, elles, ne dépendent d'aucune donnée.

**S2 — « Écouter la Parole » (accueil).**
Code : `{leadTeaching && (<TeachingFeature …/>)}` et `{otherTeachings.length > 0 && (…)}`. Avec `publications = []`, il reste le titre, l'accroche, le filet, le texte « Retrouvez l'ensemble de nos messages sur notre chaîne YouTube » et le CTA « Tous les enseignements → ».
→ **Comportement réel : dégradation acceptable et cohérente.** La section survit comme invitation. **À conserver.**

**S3 — « Les visages de notre communauté » (accueil).**
Code : `<CommunityFaces faces={communityFaces} />` — `communityFaces` vient de `getCommunityFaces()`, qui **écarte silencieusement** les entrées sans portrait (`keepWithPortrait`, journalisé). Si toutes les entrées sont écartées, `faces = []` et le composant ne rend rien sous un `SectionHeading` visible.
→ **Comportement réel : titre + description + zone vide.** ⚠
→ **Note :** l'écartement des entrées sans portrait est une **bonne décision documentée** (`endpoints.ts:82-90` : « inventer une photo à la place d'une personne serait pire que de l'omettre »). Le problème est l'absence de repli au niveau de la section.

**S4 — « Quand nous nous rassemblons » (accueil, `WeekRhythm`).**
Alimenté par `weeklyRhythm` **mock** → jamais vide aujourd'hui. Mais dès que l'on branchera `getSchedule()`, un tableau vide produira un cadre vide. **Garde à prévoir.**

**S5 — « La prière » et « L'envoi » (accueil).**
Aucune donnée externe → toujours rendues. Mais « Demander la prière » pointe vers **WhatsApp** alors qu'une page `/communaute/priere-et-intercession` existe. **Incohérence de parcours, pas d'état vide.**

**S6 — Départements (`/organisation`).**
Code : `departments.length > 0 ? <OrganisationExplorer …/> : <EmptyState title="Les départements sont en cours de mise à jour" …/>`. ✅ **Référence du site.**

**S7 — Pasteur visionnaire (`/organisation`).**
Code : `leadPastor ? (<carte>) : (<EmptyState title="Direction pastorale" description="La présentation pastorale sera affichée dès que les informations seront synchronisées." />)`. ✅

**S8 — Équipe de coordination (`/organisation`).**
Code : `teamLeaders.length > 0 ? (<liste>) : (<div><p>L'ensemble de nos départements est animé par des équipes bénévoles dévouées…</p></div>)`. → **Troisième stratégie** : un paragraphe **en dur**, non administrable, au lieu d'un `EmptyState`.
→ **Recommandation :** aligner S7 et S8 sur la même stratégie. Le texte de S8 est éditorial → il doit vivre dans le contenu de page, pas dans le JSX.

**S9 — « Également publié sur le site » (`/publications/actualites`).**
`archives` est fourni sans test `elsewhere.length > 0` → un `<ul>` **vide sous un titre visible**. ⚠ **Défaut réel à corriger.**

**S10 — « Programme » (fiche événement).**
L'archétype `EventPage` prévoit un emplacement `program` ; **il n'est jamais fourni** par la page. Emplacement structurel jamais utilisé.

**S11 — « Galerie de l'album » (`/publications/[slug]`).**
Pour une publication PHOTO, la galerie affichée = l'image de couverture **+ 10 photos génériques du mock `galleryImages`**, présentées **sans mention** qu'elles n'appartiennent pas à l'album. ⚠ **Le pire cas du site : de la donnée de démonstration présentée comme du contenu réel.** Une entité `Publication` n'a d'ailleurs **aucune relation de galerie** en base (contrairement à `events`/`departments` qui ont `event_media`/`department_media`).

**S12 — Formulaire de prière (`/communaute/priere-et-intercession`).**
`handleSubmit` exécute `setTimeout(…, 600)` puis `setSubmitted(true)`. **Aucun appel réseau.** L'écran de succès affirme « *Votre demande a bien été reçue.* » Les champs `contact` et `confidentiality` sont collectés et **jamais utilisés**.
→ **Comportement réel : la section ne peut pas être vide — elle est fausse en toute circonstance.**
→ **Contradiction documentaire :** `/confidentialite` promet un traitement confidentiel des demandes de prière. `prayer_requests` existe pourtant en base avec `confidentiality` et `status`. **C'est un défaut de nature juridique, pas cosmétique — à traiter en priorité. Voir `backoffice_open_questions.md` BLOQUANT-5.**

### 10.3 Recommandation d'unification

Trois stratégies coexistent sans règle : `EmptyState` (9×), `ContentPending` (5×), panneau éditorial en dur (1×+). **Proposition** (À DÉCIDER) :

| Situation | Traitement |
|---|---|
| Liste d'entités vide sur page vitrine | Texte éditorial administrable (fallback), section conservée |
| Liste d'entités vide sur page d'index | `EmptyState` avec libellé métier |
| Contenu institutionnel non fourni par CCJV | `ContentPending` (existant, à conserver — c'est une décision de rigueur documentaire) |
| Champ optionnel absent sur une entité | Ne rien afficher (comportement actuel de `{event.location &&}`) ✅ |
| Image d'entité absente | ⚠ **à trancher** — voir ci-dessous |

**Le cas le plus dangereux : les images de repli silencieuses.** Le code contient plusieurs chaînes de repli qui **substituent une photo générique** à une image absente :

| Emplacement | Repli |
|---|---|
| `organisation/page.tsx:90,109,125` | `images.service \|\| "/media/ccjv-28.jpeg"`, `images.chorale \|\| …`, `images.ecodim \|\| …` |
| `organisation/page.tsx:242,306` | `leadPastor.photo ?? images.portraitLarge` / `ldr.photo ?? images.portraitB` |
| `OrganisationExplorer.tsx:52` | `dept.bannerImage ?? images.communaute` |
| `VerseSection.tsx:104-115` | `displayPhotos` → 4 photos littérales ; `leftImg`/`rightImg` → `/media/ccjv-30.jpeg`, `/media/ccjv-09.jpeg` |
| `DepartmentModal.tsx:171` | `meetingSchedule ?? "Culte dominical · 09:00"` ⚠ **un horaire de démonstration non validé** |

Le dernier cas est le plus critique : `site.ts:34` déclare explicitement « *Culte dominical — **horaire de démonstration, à valider par CCJV*** ». Or `DepartmentModal` **affiche ce même horaire** à tout département dépourvu de `meetingSchedule`. **Le site affirme donc un horaire non validé comme s'il était propre au département.** À corriger par un état explicite (« horaire à préciser ») plutôt qu'une valeur par défaut.

---

## 11. Médias

### 11.1 Le fonds existant

- **41 fichiers JPEG** dans `frontend/public/media/ccjv-01…41.jpeg` (copies propres) + **40 originaux** dans `public/images/` aux noms WhatsApp non normalisés (`WhatsApp Image 2026-09-23 at 7.43.48 PM.jpeg`).
- **2 logos** (`logo.png` 415 Ko, `logo_2.png` 621 Ko) — volumineux, non optimisés.
- **Aucune vidéo hébergée**, aucun document, aucun PDF dans le dépôt. Les vidéos sont des liens YouTube externes (`contentUrl`).
- **9 fichiers jamais référencés** : `ccjv-07, 10, 14, 20, 22, 26, 29, 39, 41`.
- **4 fichiers référencés uniquement par un module mort** (`leaders.ts`, importé par personne) : `ccjv-04, 19, 24, 38`.

### 11.2 Les usages — quatre modes de référencement concurrents

| Mode | Mécanisme | Administrable aujourd'hui |
|---|---|---|
| **U1 — Clés sémantiques** | `images.hero`, `images.louange`, … (14 clés) dans `data/mock/images.ts`, commentées « **RÔLES DE MISE EN PAGE, pas des légendes** » | ❌ codé |
| **U2 — Chemins littéraux en dur** | `/media/ccjv-28.jpeg` directement dans le JSX (replis, `VerseSection`, `organisation`) | ❌ codé |
| **U3 — Tableaux de réserve** | `photoPool` (15), `galleryImages` (10) — **sans aucune sémantique** | ❌ codé |
| **U4 — URL dans l'entité** | `Department.bannerImage`, `gallery[]`, `Event.imageUrl`, `bannerImage`, `gallery[]` | ✅ par l'entité |

**Le mode U3 est le plus problématique :** `photoPool` et `galleryImages` sont des **réservoirs d'images génériques attribuées arbitrairement** — par tranches (`photoPool.slice(0,3)`, `.slice(0,5)`, `.slice(5,11)`) — à des contenus qui ne les possèdent pas. `mediatheque` affiche 11 photos de `photoPool` sous forme de « galerie » sans légende ni avertissement, à côté d'« Albums publiés » venus de l'API. `publications/[slug]` compose la « Galerie de l'album » avec `galleryImages` pour **n'importe quelle** publication.

**INFÉRÉ :** ces deux tableaux sont des **béquilles de maquette**, pas un modèle éditorial. Ils devront disparaître.

### 11.3 Ce que la base sait déjà faire

La table `media` est **correctement conçue** : `bucket`, `path` (unique), `publicUrl` (dénormalisée), `mimeType` (**déduit du binaire**, pas de l'en-tête client), `sizeBytes`, `width`, `height`, **`alt`** (texte alternatif, exigence WCAG), `uploadedBy` → `admin_profiles`, `createdAt`. Le commentaire de `schema/media.ts:14-23` justifie la table par quatre besoins qu'une chaîne ne couvre pas : détecter un orphelin, porter un `alt`, savoir qui a téléversé quoi, refuser la suppression d'un fichier encore référencé.

**Décision architecturale importante et correcte :** le contrat d'API **reste inchangé** — les entités exposent des **URL** (`imageUrl`, `bannerImage`, `photo`, `contentUrl`), et la résolution `media.id → publicUrl` se fait « à la frontière de sérialisation ». C'est exactement le comportement décrit par `docs/020` §7 (« L'utilisateur ne manipule pas… URL Storage… Le système fournit ensuite le lien technique »).

**Cependant deux manques pour une médiathèque éditoriale :**

1. **Aucun champ `caption`** (légende) ni `credit`. `media.alt` est nullable. Or l'accueil utilise `alt=""` partout, et `docs/015` §5 rappelle qu'« aucune légende photographique affirmative n'est écrite : l'agent n'a pas de capacité d'analyse d'image ». **Le `alt` est précisément le champ où cette règle doit se matérialiser** — et il doit devenir **obligatoire** à la saisie pour les images de contenu (tout en restant vide pour le décoratif).
2. **Aucun `title`/`filename` d'origine.** Seuls `bucket` + `path` (généré serveur) existent. Un responsable cherchant « la photo de la chorale » n'a **rien** sur quoi chercher, sinon `alt`. Or `docs/020` §7 exige « rechercher », « filtrer », « consultation des informations du média ». **Sans `alt` renseigné ni nom d'origine, la médiathèque n'est pas utilisable par un non-technicien.** C'est le manque le plus concret du volet médias.

### 11.4 Volumétrie et contraintes

`docs/018` indique : 5 Mo max, MIME `image/jpeg|png|webp|avif`, bucket `ccjv-media`, dossiers `events/ departments/ publications/ leaders/ testimonies/ community/ pages/`. **Non vérifié en code** dans le périmètre de cet audit (`infrastructure/supabase/storage.ts` non confronté ligne à ligne) → marqué **AMBIGU** quant à l'effectivité.

**Observation :** la structure de dossiers prévue est **par entité propriétaire**, pas par date ni par département. Elle est donc **compatible** avec une médiathèque globale, et **incompatible** avec une médiathèque scopée par département sans ajout de préfixe. À trancher avec §22.4.

### 11.5 Réutilisation — la preuve par les chiffres

Le même fichier est référencé par de multiples entités : **`ccjv-15`** (chorale) apparaît dans `images.chorale`, dans le `bannerImage` du département Chorale, dans sa galerie, dans la galerie d'Ecodim **et** dans `pub-004` (`contentUrl`). **`ccjv-09`** apparaît dans `photoPool`, `galleryImages`, `images.assemblee`, la galerie du département Adultes **et** `pub-002`. **`ccjv-23`** dans la galerie Ecodim et `pub-006`.

**Conclusion :** la réutilisation est réelle et le besoin de déduplication est **démontré**, pas théorique. Les tables `department_media` et `event_media` sont la bonne réponse ; il manque l'équivalent pour `publications` (galerie) et un lien `media` → entité propriétaire pour la corbeille.

---

## 12. Workflow des publications

### 12.1 Documentation vs code

| Aspect | `docs/020` §8 | Code |
|---|---|---|
| États | `BROUILLON → PUBLIÉ → ARCHIVÉ` | `publicationStatusEnum = ["DRAFT", "PUBLISHED"]` — **`ARCHIVED` absent** |
| État initial | brouillon implicite | **`PUBLISHED` par défaut** (`publications.ts:54`) |
| Archivage | règle métier sur un seuil de publications récentes | **aucune règle, aucune colonne, aucun script** |
| Seuil | « **La valeur exacte du seuil reste à définir** » (`docs/020:400`) | — |
| Portée du calcul | « à déterminer : global ou par catégorie/département » (`:397`) | — |
| Déclenchement | « automatique ou par l'administrateur » (`:398`) | — |
| Statut côté frontend | — | **`Publication` n'a aucun champ de statut** |

**Le seuil d'archivage n'a de valeur dans AUCUN document ni dans le code.** La consigne §15 l'interdit explicitement : « Ne décide pas toi-même du seuil métier s'il n'est pas présent dans les documents. » → **Je ne le fixe pas.** Il est consigné comme décision à spécifier (`backoffice_open_questions.md` BLOQUANT-6).

### 12.2 Où les publications sont affichées — état réel

| Page | Appel | Filtre | Tri | Limite |
|---|---|---|---|---|
| `/` (enseignements) | `getPublications({ category: "ENSEIGNEMENT", limit: 3 })` | `ENSEIGNEMENT` | API | **3** |
| `/publications/actualites` | `getPublications({…})` | `ACTUALITE` | API | — |
| `/publications/enseignements` | `getPublications({…})` | `ENSEIGNEMENT` | API | — |
| `/publications/mediatheque` | `getPublications({…})` | `MEDIA` | API | — |
| `/publications/ressources` | `getPublications({…})` | `RESSOURCE` | API | — |
| `/publications/[slug]` | `getPublication(slug)` + `getPublications` | par slug / associés | API | — |
| `/recherche` | **`@/data/mock/publications`** ⚠ | — | mock | — |
| `sitemap.ts` | **`@/data/mock/publications`** ⚠ | — | mock | — |

- **Catégories** (`publication_category`) : `ACTUALITE`, `ENSEIGNEMENT`, `MEDIA`, `RESSOURCE` — 4 valeurs, alignées frontend/backend/`docs/006`.
- **Types** (`publication_type`) : `VIDEO`, `PHOTO`, `TEXTE` — alignés.
- **Dépendance fonctionnelle observée** dans les données : `VIDEO↔ENSEIGNEMENT`, `PHOTO↔MEDIA`, `TEXTE↔{ACTUALITE, RESSOURCE}`. **Ce n'est pas contraint en base.** `INFÉRÉ` : c'est une convention éditoriale, pas une règle — ne pas la coder.
- **Aucun état n'est visible à l'écran** (le statut n'existe pas côté frontend).
- **Le tri par défaut est chronologique décroissant** (`index publications_published_at_idx … .desc()`).
- **Le mock porte 10 publications** datées par `daysFromNow(-2 … -52)`, donc **non déterministes d'un build à l'autre** — `upcoming`/`archived` et toutes les dates affichées changent à chaque compilation. ⚠ **Risque de production :** `sitemap.ts` et `/recherche` publient des slugs et des dates changeantes.

### 12.3 Le hub Ressources — l'abstraction est-elle justifiée ?

`docs/024` (consigne) demande de vérifier si l'abstraction `Resource` est réellement justifiée. **Réponse : OUI, elle l'est — et elle est déjà implémentée.**

Preuves :
1. **Une seule table** `publications` sert les 4 rubriques, filtrée par `category` (`schema/publications.ts:18-24` : « *Le hub Ressources et les rubriques … s'appuient sur **un seul système** filtré par `category`, et non sur quatre modèles dupliqués* »).
2. **Le frontend confirme** : les 4 pages appellent **la même** fonction `getPublications()` avec un `category` différent. Aucune structure parallèle.
3. **Un corps éditorial partagé** (`body text[]`) sert les types TEXTE, et `contentUrl` sert VIDEO (YouTube) et PHOTO (Storage).
4. **Une page de détail unique** `/publications/[slug]` (`DetailPage`) sert les 4 rubriques.

**Nuance importante :** `contentUrl` est **un champ polymorphe** — URL YouTube pour VIDEO, chemin Storage pour PHOTO, absent pour TEXTE. C'est fonctionnel mais **pas typé** : rien n'empêche de saisir une URL YouTube sur un type PHOTO. **Recommandation :** conserver l'abstraction `Publication` (elle est justifiée et éprouvée) et **valider `contentUrl` par `type`** dans le schéma Zod du module. **Ne pas créer quatre entités.**

Le modèle décrit dans la consigne §24 (`Resource → type, metadata, content, media, status, publication data`) correspond donc à l'existant, à une réserve près : **`status` n'est pas exposé au frontend** et **il manque `ARCHIVED`**.

---

## 13. Risques UX

Risques de dégradation de la composition par une saisie éditoriale. Pour chacun : le mécanisme réel observé, et le traitement recommandé.

| Risque | Se produit-il aujourd'hui ? | Traitement |
|---|---|---|
| **Titre trop long** | Aucune troncature nulle part. Les titres utilisent des `clamp()` fluides (`text-[clamp(2rem,1.4rem+2.2vw,3.2rem)]`) → le texte **déborde verticalement**, la mise en page tient mais s'allonge | **Limiter à la saisie** (`varchar` déjà présent : 150 pour `title`, 100 pour `name`, 120 pour `name`/`role`/`responsibleName`, 200 pour `tagline`, 180 pour `slug`) → **la base borne déjà** ✅. Compléter par un `maxLength` sur les champs non bornés (`description`, `excerpt`, `bio`, `caption` sont `text`) |
| **`keyPoints` trop nombreux** | `OrganisationExplorer` plafonne à **4** (`.slice(0, 4)`) ; `DepartmentModal` affiche **tout** | ✅ plafond d'affichage existant ; **incohérence carte/tiroir à corriger** (voir ci-dessous) |
| **Galerie trop longue** | `DepartmentModal` plafonne à **6** (`.slice(0, 6)`) ; `gallery` en base n'est **pas bornée** | ✅ plafond d'affichage ; borner aussi à la saisie |
| **`practicalInfo` / `body` trop longs** | `text[]` non borné, aucun plafond d'affichage | Limiter le nombre de paragraphes à la saisie |
| **Image absente** | **Repli silencieux sur une photo générique** (`?? images.portraitB`, `?? images.communaute`) | ⚠ **Risque réel** : un département sans bannière affiche une photo de communauté comme si c'était la sienne. **Recommandation :** `EmptyState` local ou zone neutre, jamais une photo d'une autre entité |
| **Horaire absent** | **Repli sur « Culte dominical · 09:00 »**, horaire **non validé** par CCJV | ⚠ **Le plus grave.** Remplacer par « Horaire à préciser » |
| **Texte alternatif absent** | `alt=""` sur l'accueil ; `alt={dept.name}` auto-généré ; `alt={\`${name} — photo ${n}\`}` auto-généré | ⚠ Rend `media.alt` inopérant. **Rendre `alt` obligatoire** pour les images de contenu |
| **Trop de publications** | Plafonné à 3 sur l'accueil (prop `limit`), non plafonné sur les pages d'index | ✅ accueil ; pagination API `limit ≤ 100`, défaut 20 → prévoir l'affichage de la pagination |
| **Aucune publication** | Non gardé sur l'accueil (dégradation acceptable), **`archives` non gardé sur `/actualites`** (bug) | Corriger le garde manquant |
| **Aucun événement** | **Non gardé** (`EventsSection` sans état vide) | Corriger (voir §10.2/S1) |
| **Nom de département très long** | `varchar(100)` + `clamp()` → tient | ✅ |
| **Légende photographique affirmative** | `organisation` affiche « Entraide & Service », « Louange », « Ecodim » en surimpression — **alors que `docs/015` §5 interdit les légendes affirmatives** et que `images.ts` avertit que ce sont des « rôles de mise en page, pas des légendes » | ⚠ **Contradiction interne au projet.** À trancher : soit CCJV valide les correspondances photo↔sujet, soit les surimpressions deviennent des libellés de section (non descriptifs) |
| **Espace insécable / ponctuation FR** | Non traité systématiquement (`« … »` avec espaces, mais pas de `&nbsp;`) | Mineur |
| **HTML/mise en page injectés** | **Impossible** : `static_pages.content` est du jsonb validé par Zod, « jamais du HTML » | ✅ **Bonne protection structurelle** |

### 13.1 Deux incohérences d'affichage à corriger

1. **`keyPoints`** : plafonné à 4 dans la carte, intégral dans le tiroir. Un département à 6 piliers affiche 6 dans le tiroir. **Cohérence à trancher.**
2. **`publications/[slug]`** rend le **titre deux fois** (hero `h1` + résumé `h2`) et les **contenus associés deux fois** (aside + emplacement `related`). Défaut de composition réel.

### 13.2 Le risque non visuel le plus élevé

**Le formulaire de prière simulé** (§10.2/S12) et les **deux placeholders de `/mentions-legales`** (« Adresse : information à compléter. Contact : information à compléter. ») sont **visibles en production**. Ce ne sont pas des risques de composition : ce sont des **défauts de confiance** publiés. **À traiter avant toute mise en production, indépendamment du Back-Office.**

---

## 14. Risques techniques

| # | Risque | Preuve | Gravité |
|---|---|---|---|
| T1 | **La couche éditoriale est débranchée** — 6 fonctions API éditoriales à 0 appelant, tandis que 11 pages lisent les mocks | `endpoints.ts` vs `grep getSettings\|getPage\|getScriptures\|getSchedule` = 0 | **Critique** |
| T2 | **`sitemap.ts` et `/recherche` indexent les mocks** pendant que les pages servent l'API → **17 slugs de démonstration** dans le sitemap, contenu du Back-Office invisible à la recherche | `sitemap.ts:5,35,39` ; `recherche/page.tsx:10-12` | **Critique** |
| T3 | **Données non déterministes** — `daysFromNow()` pilote toutes les dates d'événements et de publications → dates et compteurs `UPCOMING`/`ARCHIVED` changent à chaque build | `lib/utils.ts` utilisé par `mock/events.ts`, `mock/publications.ts` | **Élevée** |
| T4 | **Champ `scope` ambigu** — `leaders.scope` (libellé d'affiliation) vs le `scope` d'autorisation de `docs/020` §5 | `schema/people.ts:33` vs `docs/020:204-236` | **Élevée** |
| T5 | **Responsable de département non relationnel** — `departments.responsibleName` est un `varchar`, pas une FK vers `leaders` ; `leaders.departmentId` existe en parallèle → deux sources de vérité | `schema/departments.ts:32`, `schema/people.ts:38` | **Élevée** |
| T6 | **Le « pasteur principal » est positionnel** — `const [leadPastor, ...teamLeaders] = leaders` (page) et `leadPastor = leaders[0]` (mock) → réordonner les responsables dans le Back-Office **change silencieusement** qui est présenté comme pasteur visionnaire | `organisation/page.tsx:27`, `mock/leaders.ts:62` | **Élevée** |
| T7 | **Trois vocabulaires de ton** (`Band` 6, `VerseSection` 8, `EventsSection` 6) sans relation d'inclusion | §3.4 | Moyenne |
| T8 | **Six variantes pour trois mises en page** dans `VerseSection`, dont 3 alias purs ; `light`/`offwhite` produisent la même classe | `VerseSection.tsx:16-33,86-88` | Moyenne |
| T9 | **Heuristique de détection du ton sombre par inspection de chaîne** — `backgroundColor.toLowerCase().includes("black" \| "121212" \| "#000" \| "#1")` | `VerseSection.tsx:95-99` | Moyenne |
| T10 | **`id` ARIA codé en dur** dans `EventsSection` (`aria-labelledby="events-section-title"`) → deux instances sur une même page produiraient des `id` dupliqués | `EventsSection.tsx:88,97` | Moyenne |
| T11 | **Mécanisme de repli non uniforme sur les entités** : une entité peut n'être rendue que partiellement. Les composants supposent des champs présents (`Publication.body`, `Department.description`) sans garde | `OrganisationExplorer.tsx:95` (`{dept.description}` non gardé) | Moyenne |
| T12 | **Le client API est tolérant aux pannes mais silencieux** — `apiFetch` renvoie `null` + `console.warn` ; une API éteinte produit des pages vides **sans erreur visible** | `client.ts`, `endpoints.ts:62-75` | Moyenne |
| T13 | **Aucun délai d'attente effectif garanti** — `AbortSignal.any` manquant ⇒ le `timeout` de 5 s peut être silencieusement perdu | `client.ts` | Moyenne |
| T14 | **`<main>` imbriqué** — `/organisation` rend un `<main>` dans le `<main id="contenu">` du layout : **seule page dans ce cas** (HTML invalide, impact accessibilité) | `organisation/page.tsx:30` vs `app/layout.tsx` | Moyenne |
| T15 | **Deux `mainNav`/`ready` figés à `true` partout** — le mécanisme de disponibilité progressive n'est plus utilisé | `nav.ts:37-138` | Faible |
| T16 | **Boucle dupliquée document↔code** — `docs/015` §4.2 « Livré » décrit 6 routes inexistantes et 7 composants inexistants ; `docs/019` le contredit déjà | §2.2 D2/D5 | **Élevée (process)** |
| T17 | **`primaryNav` est un clone identique** de `mainNav` (tous les `ready` sont `true`) → le filtre ne filtre rien ; `allDestinations` n'est jamais consommé | `nav.ts:141-155` | Faible |
| T18 | **Fichiers jamais importés** : `mock/leaders.ts`, `mock/testimonies.ts`, et 4 résolveurs (`getEventBySlug`, `getDepartmentBySlug`, `getPublicationBySlug`, `getPublicationsByCategory`) | grep | Faible |
| T19 | **Erreur de frappe publiée** : « Données susceptible d'être traitées » (`/confidentialite`) | texte rendu | Faible |
| T20 | **Assets lourds** : `logo.png` 415 Ko, `logo_2.png` 621 Ko, 41 JPEG non optimisés (jusqu'à 250 Ko) servis tels quels | `public/` | Moyenne |
| T21 | **Fuite de donnée sur une route publique** — `updatedBy` (UUID d'administrateur) est renvoyé par `GET /api/v1/pages/:pageKey`, **route publique non authentifiée**, alors que le commentaire du serializer affirme le contraire | `static-page.serializer.ts` vs code | **Élevée (sécurité)** |
| T22 | **Aucune API de gestion des administrateurs** — aucun écran ni route ne permet de créer, désactiver ou changer le rôle d'un administrateur. Le chemin 403 « compte désactivé » n'est atteignable que par écriture directe en base | `modules/admin/admin.routes.ts` | **Élevée** — **l'écran « Utilisateurs » de `docs/020` §15 n'a aucun backend** |
| T23 | **Aucune contrainte d'unicité traduite en erreur métier** — une collision de `slug` ou toute violation de FK renvoie **500 `INTERNAL_ERROR`** au lieu de 409/400. Aucune correspondance des erreurs Postgres n'existe | `presentation/middlewares/error-handler.ts` | **Élevée** — un Back-Office qui enregistre un slug déjà pris affichera « erreur interne » |
| T24 | **Aucune versionnalisation ni concurrence optimiste** — upserts « dernier écrivain gagne », ni ETag ni `If-Match`. Deux éditeurs simultanés s'écrasent **silencieusement** | tous les services | **Élevée** |
| T25 | **Aucune corbeille ni suppression logique** — tout `DELETE` est définitif ; aucune restauration possible | tous les modules | **Élevée** |
| T26 | **`Publication.coverImage` lu par 3 pages mais ABSENT de l'interface `Publication`** — erreur de type masquée, champ non déclaré | `types/index.ts:58-73` | Moyenne |
| T27 | **Jeton CSS `ccjv-green-dark` utilisé 5× mais NON DÉFINI** ⇒ styles de survol silencieusement inopérants (dont le bouton d'envoi du formulaire de prière) | `globals.css` | Moyenne |
| T28 | **5 composants sans aucun consommateur** : `DirectoryPage`, `PeopleGrid`, `PortraitPanel`, `FeaturedEvent`, `ParallaxContainer` | grep de consommation | Moyenne — code non exercé, donc non testé |
| T29 | **Traçabilité inexistante** — seules deux colonnes d'acteur existent (`media.uploaded_by`, `static_pages.updated_by`), et elles ne conservent que le **dernier** écrivain. La suppression d'un média n'enregistre aucun acteur | schémas | Moyenne |
| T30 | **Divergences README ↔ code** — le README annonce `PUT /settings` et `PUT /pages/:pageKey` (le code utilise **PATCH**) ; `GET /leaders/:idOrSlug` (les responsables **n'ont pas de slug**, la route est `/:id`) ; omet 3 des 5 routes de médias ; annonce **Vitest** alors que `npm test` exécute **Jest** | `backend/README.md` | Moyenne (process) |

### 14.0 Points vérifiés et sains — à préserver

Ces éléments ont été **vérifiés et jugés corrects**. Ils constituent le socle sur lequel bâtir.

| Élément | Constat |
|---|---|
| **Migration ↔ schéma** | **16 tables, 6 énumérations, 22 index, 16 clés étrangères** : la migration SQL correspond **exactement** au schéma Drizzle. **Aucune dérive** dans un sens ou dans l'autre. |
| **Invisibilité des brouillons** | Appliquée **deux fois** : le service force `status: "PUBLISHED"` en liste, et la lecture unitaire filtre `and(identité, eq(status, "PUBLISHED"))`. Un `?status=DRAFT` public est rejeté en **400** (requête stricte sans clé `status`). ✅ **Correct.** |
| **Isolation du formulaire de prière** | Seule écriture publique du site, limitée à **5 requêtes/heure/IP**. |
| **Séparation authentification / autorisation** | `authenticate()` ne consulte pas la base ; `requireAdmin()` charge le profil et exige `isActive`. Un utilisateur authentifié auprès de Supabase mais absent de `admin_profiles` n'a **aucun** droit. ✅ **Correct.** |
| **Calcul du statut d'événement** | `eventDate >= today ? "UPCOMING" : "ARCHIVED"` — jamais persisté, pas de constante de seuil. ✅ **Décision correcte à préserver.** |
| **`keepWithPortrait`** | Écarter une personne sans portrait plutôt que lui inventer une photo, avec journalisation. ✅ **Décision éthique à préserver.** |
| **`static_pages.content` en jsonb validé par Zod** | Champs nommés, jamais de HTML ⇒ **le page builder est structurellement impossible**. ✅ |
| **Tolérance aux pannes du client API** | Une API éteinte produit des collections vides, jamais une exception de rendu. ✅ |

### 14.1 Couplages implicites à documenter avant toute modification

1. **Couplage slug ↔ ancre** — `OrganisationExplorer.tsx:41-42` injecte `id="ecodim"` si `dept.slug === "enfants-ecodim"` et `id="adulte"` si `dept.slug === "adultes"`. `DepartmentModal.tsx:43-45` mappe `hash === "ecodim"|"adultes"|"chorale"`. **Le code connaît trois slugs en dur.** Renommer un slug depuis le Back-Office **casserait ces ancres en silence**. Conséquence pour le modèle : **`slug` doit rester réservé à l'Admin** — ce que `docs/020` §11 prévoit déjà, et ce que le code rend impératif.
2. **Ordre ↔ alternance visuelle** — `isReversed = idx % 2 === 1` et numérotation `idx + 1`. **L'ordre d'affichage est structurel**, pas décoratif. Cohérent avec `docs/020` §11 (« ordre d'affichage » réservé à l'administration), mais interdit qu'un responsable réordonne son propre département.
3. **Ordre ↔ identité du pasteur** (`leadPastor = leaders[0]`) — voir T6.
4. **`position` existe en base** pour `departments`, `leaders`, `testimonies`, `community_faces`, `schedule_entries`, `social_links` → **le tri est administrable**, mais aucune interface ne l'expose.

---

## 15. Composants à factoriser

Analyse détaillée en §3.5. Synthèse :

| # | Factorisation | Justification | Risque d'excès | Reco |
|---|---|---|---|---|
| F1 | Blocs-bible de `/organisation` → `ScriptureBlock` variante `concluding` | Structure JSX identique à ~90 % ; variante déjà existante et inutilisée | Nul | **Oui** |
| F2 | 4 piliers de `/qui-sommes-nous` → `KeyFacts` variante `tiles` | Duplication littérale manuelle au lieu d'un `.map()` | Vérif visuelle | **Oui** |
| F3 | 3 étapes de `/organisation` → `StepsList` variante `horizontal` | Duplication littérale ; composant existant inutilisé | Vérif visuelle | **Oui** |
| F4 | Stratégies de repli d'`organisation` (S7/S8) | Trois stratégies pour deux entités de même nature | — | **Décision produit, pas factorisation** |
| F5 | Cinq grilles photo sans légende | Structure commune mais ratios/décalages/parallaxe réels | **Élevé** — perte de composition | **Non, pour l'instant** |
| F6 | Fusionner `HeroPhoto`/`HeroImmersive`/`HeroManifesto`/`HeroPractical` | Ressemblance **visuelle** seulement | **Élevé** — `docs/015` §2.2 les a séparés à dessein | **Non** |
| F7 | Unifier les 3 vocabulaires de ton | Fragmentation réelle (T7) | Moyen — touche beaucoup de fichiers | **Oui, mais après le Back-Office** (voir IMPORTANT-2) |

**Principe directeur appliqué :** ne factoriser **que** sur cohérence structurelle et comportementale démontrée, jamais sur ressemblance visuelle. F1/F2/F3 sont des duplications **littérales** de JSX — donc légitimes. F5/F6 sont des ressemblances **visuelles** — donc refusées.

---

## 16. Éléments à conserver dans le code — liste explicite

**Ne doivent JAMAIS devenir administrables.** « Non administrable » ne signifie pas « inutile » : ces éléments protègent la composition.

1. **L'ordre et le nombre des sections** de chaque page (archétypes et compositions libres).
2. **`Band`** : `tone`, `space`, `width`, `rule`, et ses trois tables de classes.
3. **Les 5 héros et leur composition interne** (`HeroCompact`, `HeroImmersive`, `HeroManifesto`, `HeroPhoto`, `HeroPractical`) + `Hero` d'accueil.
4. **Les 8 archétypes** et la séquence de leurs emplacements, y compris leurs tons et respirations fixes par emplacement.
5. **`rhythm.ts`** et l'échelle `PageRhythm`.
6. **Toutes les variantes de composants** (les variantes sont une propriété du code, jamais une donnée).
7. **Grille, espacements, typographie, `clamp()`, ratios d'aspect, breakpoints.**
8. **Les jetons de design** de `globals.css` (`--ccjv-*`) et l'usage de `font-serif`/`font-sans`.
9. **Animations et comportements** : `Reveal`, `ParallaxImage` (vitesses), `BreathingPhoto`, `IntroCurtain` (~1,6 s), transitions, `scroll-mt`.
10. **La logique de navigation** (`nav.ts` : hiérarchie, `href`, pôles sans page, `getBreadcrumbs`), `sitemap.ts`, `robots.ts`.
11. **Le calcul du statut d'événement** (`UPCOMING`/`ARCHIVED` dérivé de `event_date`, jamais persisté) — **décision correcte à préserver**.
12. **L'alternance `idx % 2`** et la **numérotation `idx + 1`** des départements.
13. **Les plafonds d'affichage** (`maxEvents = 3`, `slice(0,4)`, `slice(0,6)`, `slice(0,2)`).
14. **Le mécanisme `keepWithPortrait`** — écarter une personne sans portrait est une bonne décision.
15. **Le vocabulaire de marque** : `CrossMark`, `OpenBookMark`, l'absence d'arrondis (`rounded-none`), les filets *hairline* plutôt que les ombres.
16. **La logique applicative** : `readCollection`, normalisation des charges, `isRecord`, `unstable_rethrow`, `handleHash`/`Escape`/verrouillage du scroll du tiroir.
17. **La décision `alt=""`** pour les images purement décoratives.
18. **Les règles de validation** (Zod) et les schémas par `page_key`.
19. **`ContentPending`** comme mécanisme de rigueur documentaire (ne jamais inventer un fait).
20. **La séparation authentification / autorisation** dans `auth.ts`.

---

## 17. Éléments à rendre administrables — liste explicite

Classés par **propriétaire** et **portée**, avec la justification demandée par la consigne §9 (« pourquoi administrable ? qui ? »).

### 17.1 Réglages institutionnels globaux *(Admin — portée globale)*

Justification : ce sont des faits institutionnels qui changent sans redéploiement, ne sont pas des entités, et sont aujourd'hui **dupliqués ou incohérents** dans le code (5 formulations divergentes du rythme hebdomadaire, dates de fondation écrites en deux casses). Table cible : `site_settings` (**existe**).

| Champ | Source actuelle | Pourquoi |
|---|---|---|
| `name`, `acronym`, `location` | `mock/site.ts` | Identité — non branchée |
| `foundedAt`, `ecodimFoundedAt` | `mock/site.ts` (**jamais lus**) + dates en dur dans `/qui-sommes-nous` avec une **autre casse** | Divergence avérée |
| `visionary`, `visionaryRole` | `mock/site.ts` | Identité |
| `address`, `addressLines` | `mock/site.ts` | **Incohérence interne** (`address` sans virgule vs `addressLines`) |
| `scheduleAdults`, `scheduleChildren` | `mock/site.ts` (**jamais lus**) | Horaires de démonstration |
| `whatsappNumber`, `whatsappHref` | `mock/site.ts` — **12 sites d'appel**, valeur placeholder `+243 123 456 789` | ⚠ Critique : un faux numéro alimente 12 CTA |

### 17.2 Listes ordonnées globales *(Admin — portée globale)*

| Contenu | Table cible | État |
|---|---|---|
| Liens sociaux (`label`, `href`, `position`) | `social_links` | **existe** — non branchée |
| Rythme hebdomadaire (`day`, `title`, `timeLabel`, `audience`, `isConfirmed`, `position`) | `schedule_entries` | **existe** — non branchée ; **5 formulations divergentes** à unifier |
| Versets (`key`, `text`, `reference`, `translation`, `context`) | `scriptures` | **existe** — non branchée ; **8 versets en dur** à rapatrier |

### 17.3 Contenu éditorial de page *(Admin — portée globale)*

Table cible : `static_pages` (**existe**, `content` jsonb validé par Zod par `page_key`). Champs nommés, jamais de HTML.

**Pages nécessitant des champs administrables** (déterminées par la présence de prose en dur dans le JSX) :

| `page_key` proposé | Page | Volume de prose en dur |
|---|---|---|
| `ACCUEIL` | `/` | 8 sections : « Vous êtes les bienvenus parmi nous. », « Une famille chrétienne au cœur de Lubumbashi », titres/accroches/CTA de 6 sections |
| `QUI_SOMMES_NOUS` | `/qui-sommes-nous` | Très élevé — **30 Ko, zéro API** |
| `ORGANISATION` | `/organisation` | Élevé — hero, 7 sections, 2 versets en dur, 3 étapes |
| `EVENEMENTS` | `/vie-de-leglise/evenements` | Élevé + `weeklyRhythm` **local** |
| `FAIRE_UN_DON` | `/vie-de-leglise/faire-un-don` | **100 % en dur** (4 tableaux littéraux) |
| `OU_NOUS_TROUVER` | `/vie-de-leglise/ou-nous-trouver` | Horaires écrits à la main |
| `GROUPES_DE_MAISON` | `/communaute/groupes-de-maison` | Prose + liste |
| `PARCOURS_NOUVEAU` | `/communaute/parcours-nouveau` | Prose |
| `PRIERE` | `/communaute/priere-et-intercession` | Prose + formulaire |
| `TEMOIGNAGES` | `/communaute/temoignages` | Prose + 2 `ContentPending` |
| `RECHERCHE` | `/recherche` | Prose |
| `RESSOURCES` | `/publications/ressources` | Prose |
| `LEGAL_*` (4) | pages légales | **2 placeholders publiés** à combler |

→ **~16 clés nécessaires** contre **4 déclarées** (`ACCUEIL`, `QUI_SOMMES_NOUS`, `COMMUNAUTE`, `CONTACT` — dont **`COMMUNAUTE` et `CONTACT` ne correspondent à aucune route**).

### 17.4 Entités dynamiques *(Admin / Responsable selon scope)*

| Entité | Champs administrables | Scope |
|---|---|---|
| **Department** | `name`, `tagline`, `description`, `meetingSchedule`, `keyPoints[]`, `responsibleName`, `banner` (média), galerie ordonnée, `position` | **département** (sauf `slug` et `position` → Admin) |
| **Event** | `title`, `slug`, `description`, `excerpt`, `eventDate`, `eventTime`, `location`, `practicalInfo[]`, images, galerie, `departmentId` | **département** |
| **Publication** | `title`, `slug`, `type`, `category`, `contentUrl`, `description`, `body[]`, `author`, `publishedAt`, `status`, couverture, **galerie (relation à créer)**, `departmentId (à créer)` | **département** *(bloqué)* |
| **Leader** | `name`, `role`, `scope` (libellé), `bio`, `photo`, `departmentId`, `position`, **marqueur « pasteur principal » (à créer)** | **département** |
| **Testimony** | `quote`, `personName`, `personRole`, `photo`, `position` | global |
| **CommunityFace** | `personName`, `caption`, `photo`, `position` | global |
| **Media** | fichier, `alt` (**à rendre obligatoire**), légende, nom d'origine | global *(à décider)* |
| **PrayerRequest** | statut `NEW`/`PRAYED`, confidentialité | global |

### 17.5 Ce qui ne doit PAS être administrable même si c'est techniquement possible

- **`slug`** — couplé à des ancres codées (T/§14.1). **Réservé à l'Admin**, jamais au responsable.
- **`position`** — structurel (alternance visuelle, identité du pasteur). **Réservé à l'Admin.**
- **`admin_profiles.role`, `isActive`** — réservés au Super Admin.
- **`page_key`** — clé technique, jamais saisissable par un éditeur.
- **Les variantes de composants, les tons, les respirations** — design.
- **`type` ↔ `category` d'une publication** — convention, non contrainte ; à ne pas transformer en règle cachée.

---

## 18. Éléments dynamiques — liste explicite

| # | Entité | Source | Consommateur | Scope |
|---|---|---|---|---|
| 1 | **Department** | `getDepartments()` | `/organisation`, `/` (noms), `/evenements`, fiches | département |
| 2 | **Event** | `getEvents()`, `getEvent(slug)` | `/`, `/evenements`, fiche événement | département |
| 3 | **Publication** | `getPublications()`, `getPublication(slug)` | `/`, 4 rubriques, `[slug]` | **global (manque le scope)** |
| 4 | **Leader** | `getLeaders()` | `/organisation` | département |
| 5 | **Testimony** | `getTestimonies()` | `/temoignages` | global |
| 6 | **CommunityFace** | `getCommunityFaces()` | `/` **et** `/qui-sommes-nous` (**via mock !**) | global |
| 7 | **Media** | table `media` (URL aplatie en sérialisation) | toutes les images d'entités | **global** |
| 8 | **Scripture** | `getScripture(key)`, `getScriptures()` | **aucun** — doit remplacer les 3 mécanismes de verset | global |
| 9 | **ScheduleEntry** | `getSchedule()` | **aucun** — doit remplacer 5 formulations | global |
| 10 | **SocialLink** | `getSettings().socialLinks` | **aucun** | global |
| 11 | **SiteSetting** | `getSettings().settings` | **aucun** | global |
| 12 | **StaticPage** | `getPage(pageKey)` | **aucun** | global |
| 13 | **PrayerRequest** | `prayer_requests` | formulaire **simulé** | global |
| 14 | **HouseGroup** | **aucune table** — mock seul | `/groupes-de-maison` | **à décider** |

**Entités à créer ou à trancher :** `HouseGroup` (n° 14) ; relation galerie de publication ; marqueur de pasteur principal ; rattachement départemental de `Publication` et `Media` ; `department_id` sur `admin_profiles`.

---

## 19. Questions non résolues

Liste complète, priorisée et argumentée dans **`backoffice_open_questions.md`** (68 questions ouvertes ont été relevées dans la documentation, dont 7 explicitement listées par `docs/020` §22).

**Les 6 questions BLOQUANTES — à trancher avant de concevoir le modèle :**

1. **Quelles sont les `page_key` officielles ?** Quatre listes divergentes existent (`docs/006`, `docs/011`/`017`, `types/index.ts`) et **aucune ne correspond aux 21 routes réellement servies**. Or `static_pages.content` est **validé par un schéma Zod par `page_key`** : la liste est donc **structurellement nécessaire** avant toute écriture.
2. **Que signifie `scope` ?** Le mot désigne déjà un libellé d'affiliation sur `leaders`. Le réutiliser pour l'autorisation crée deux colonnes homonymes de sens opposés.
3. **`Ecodume` et `Ecodim` sont-ils le même département ?** Les deux seuls départements scopés de `docs/020` — Press et Ecodume — **n'existent pas dans le frontend**, tandis que le site affiche Ecodim.
4. **`HouseGroup` est-il une entité métier ?** Présente dans le frontend, absente du backend et de **tous** les documents.
5. **Le formulaire de prière doit-il être branché ou retiré ?** Aujourd'hui il **affirme un succès sans transmettre**, et `/confidentialite` promet une confidentialité qui n'a aucun support technique.
6. **Quel est le seuil d'archivage des publications ?** `docs/020` §8.3 le déclare « à définir » et n'en donne **aucune valeur** ; `ARCHIVED` n'existe même pas dans l'enum.

---

## 20. Recommandations finales

### 20.1 Architecture éditoriale recommandée — les cinq principes

**P1 — Ne pas créer de système de contenu : brancher celui qui existe.**
`static_pages` (champs nommés validés par page), `site_settings` (scalaires), `social_links`, `schedule_entries`, `scriptures`, et 11 tables d'entités **existent déjà et sont correctement conçues**. Le chantier prioritaire est le **recâblage du frontend**, pas la modélisation. Toute nouvelle table doit être justifiée contre l'existant.

**P2 — Trois niveaux, une frontière nette, et rien entre les deux.**

```text
CODE (70 %)              ÉDITORIAL (20 %)            DYNAMIQUE (10 %)
Ordre · grille · tons    Champs nommés par page      Entités en base
variantes · animations   Réglages · versets          Requêtées via API
→ jamais administrable   → Back-Office, champ/ champ → CRUD + scope
```

**Aucun « niveau 4 »** : pas de page builder, pas de table `sections`, pas de HTML libre, pas de JSON exposé, pas de couleur ni de typographie administrables.

**P3 — Un champ administrable doit répondre à « qui décide ? ».**
Si la réponse est « personne » ou « le développeur », le champ **reste dans le code**. Appliqué systématiquement, ce critère élimine la quasi-totalité des tentations de tout exposer.

**P4 — L'ordre est structurel ; le contenu est éditorial.**
`position` et `slug` sont des propriétés **structurelles** couplées à la composition (`idx % 2`, numérotation, ancres codées, identité du pasteur). Elles ne doivent **jamais** être exposées à un responsable de département.

**P5 — Le repli est une décision de conception, pas un défaut.**
Chaque section consommant une donnée dynamique doit avoir un comportement **explicite et administrable** : jamais une photo d'une autre entité, jamais un horaire non validé, jamais un cadre vide.

### 20.2 Séquence recommandée — avant toute conception d'écran

L'audit révèle que **plusieurs blocages sont en amont de la conception UX** et ne peuvent pas être contournés par une bonne interface.

| Ordre | Étape | Justification |
|---|---|---|
| **1** | Trancher les 6 questions bloquantes (§19) | `page_key` conditionne les schémas Zod ; `scope`/`department_id` conditionnent le RBAC ; le seuil d'archivage conditionne le workflow |
| **2** | **Recâbler le frontend sur la couche éditoriale existante** (T1) | 6 fonctions API prêtes à 0 appelant ; sans cela le Back-Office écrirait dans des tables que le site ne lit pas |
| **3** | **Résorber la couche mock** : `sitemap.ts`, `/recherche`, les 11 pages (T2, T3) | Le sitemap annonce 17 slugs de démonstration et la recherche ignore le Back-Office |
| **4** | **Corriger les défauts de confiance publiés** (§13.2) | Formulaire de prière simulé, placeholders légaux, faux numéro WhatsApp ×12, horaire de démonstration présenté comme réel |
| **5** | Ajouter les 3 colonnes manquantes du modèle de données | `publications.department_id`, `media.department_id`, `admin_profiles.department_id` |
| **6** | Éliminer les mécanismes concurrents : versets (4→1), rythme (5→1), visages (2→1) | Chaque notion doit avoir **une** source de vérité |
| **7** | Décider de l'adoption des archétypes sur les 3 pages concernées (§5.4) | La composition doit être stabilisée **avant** d'exposer des champs |
| **8** | Concevoir le modèle éditorial, le modèle de données, UML, RBAC, UX, API | C'est l'étape suivante de la Phase 3 |

### 20.3 Ce que cet audit permet déjà d'affirmer

Un architecte peut désormais répondre avec précision à chacune des neuf questions posées en fin de mission :

| Question | Réponse |
|---|---|
| **Qu'est-ce qui reste dans le code ?** | §16 — 20 catégories : ordre, grille, tons, variantes, animations, navigation, logique, plafonds, calculs dérivés |
| **Qu'est-ce qui devient administrable ?** | §17 — réglages globaux (11 champs), listes ordonnées (3), prose de page (~16 `page_key`), champs d'entités (8 entités) |
| **Qu'est-ce qui devient dynamique ?** | §18 — 14 entités, dont 7 déjà branchées et 6 conçues mais non branchées |
| **Qui peut modifier quoi ?** | §7, §8 — Admin pour le global **et il n'existe que ce rôle** ; le rôle de département est **à créer**, 3 noms concurrents dans les docs |
| **Quelle donnée appartient à quel département ?** | §6.2, §9 — `events` et `leaders` ✅ ; `publications` et `media` ❌ **colonnes absentes** ; `admin_profiles` ❌ |
| **Comment les composants réutilisables sont-ils alimentés ?** | §3 — `Band` structure, archétypes ordonnent, entités alimentent ; 10 briques sur 16 n'ont **qu'un seul consommateur** |
| **Que se passe-t-il lorsqu'une donnée manque ?** | §10 — 3 stratégies incohérentes ; **accueil = 2 gardes pour 12 sections** ; `/organisation` = référence ; replis silencieux sur photos et horaires ⚠ |
| **Comment empêcher le Back-Office de casser le design ?** | §13 — 6 protections existent déjà (`varchar` bornés, `clamp()`, plafonds, jsonb validé, aucune HTML) ; 4 manquent (`alt`, `slug`, repli d'image, repli d'horaire) |
| **Quelles sont les véritables entités métier ?** | §6 — 11 tables confirmées + 1 à trancher (`HouseGroup`) + 3 relations à créer |

---

## Annexe A — Index des livrables

| Fichier | Contenu |
|---|---|
| `audit_architecture_editoriale_frontend.md` | **Le présent document** — audit stratégique complet, 20 sections |
| `frontend_content_matrix.md` | Matrice exploitable : une ligne par section de page (page, composant, variante, type, source, administrable, rôle, scope, donnée dynamique, fallback, réutilisable) |
| `frontend_component_catalog.md` | Catalogue des composants réutilisables : responsabilité, pages, variantes, props actuelles et proposées, structure immuable, risques |
| `backoffice_open_questions.md` | Questions de conception classées BLOQUANT / IMPORTANT / MINEUR |
| `_evidence/01-pages.md` | Preuve brute — inventaire des 21 routes, section par section, avec citations de code |
| `_evidence/02-components.md` | Preuve brute — fiches de composants, props, variantes, consommateurs |
| `_evidence/03-data-api.md` | Preuve brute — entités mockées, types, contrat API, navigation |
| `_evidence/04-backend.md` | Preuve brute — schéma, modules, autorisation, stockage, seed |
| `_evidence/05-docs.md` | Preuve brute — synthèse des 20 documents, contradictions, questions ouvertes |

## Annexe B — Limites de cet audit

**Ce qui n'a pas été déterminé avec certitude :**

1. **`globals.css`** a été lu pour ses jetons, mais la sémantique de certains attributs (`data-hero-dark`) **n'a pas été tracée** jusqu'à ses règles CSS → **INCERTAIN**.
2. **Le contrat exact de `lib/api/types.ts`** (`coverImage`, `gallery`) n'a pas été confronté ligne à ligne aux types du backend → **INCERTAIN** sur les champs non consommés.
3. **Les limites de téléversement** (5 Mo, MIME autorisés) proviennent de `docs/018` et **n'ont pas été vérifiées** dans `infrastructure/supabase/storage.ts` → **AMBIGU**.
4. **Le poids du bundle JavaScript** n'a pas été mesuré ; l'affirmation de `/accessibilite` (« très peu de JavaScript ») n'est donc **pas vérifiée**. 9 composants portent `"use client"`.
5. **Le rendu effectif avec des objets partiels** (entité à champs manquants) n'a pas été exécuté : les constats T11 sont des **déductions par lecture**, non des reproductions.
6. **La correspondance photo → sujet** reste non vérifiable : `mock/images.ts` l'affirme lui-même (« ce sont des rôles de mise en page, pas des légendes »), et l'audit n'a pas de capacité d'analyse d'image.
7. **Les 40 contradictions documentaires** relevées dans `_evidence/05-docs.md` n'ont pas toutes été arbitrées : cet audit signale, il ne tranche pas à la place de CCJV.
8. **Le contenu de `backend/openapi.json`** (190 Ko) n'a été parcouru que par index (chemins et noms de schémas), non confronté exhaustivement aux serializers.
