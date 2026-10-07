# 033 — Plan de migration des données

> **Statut :** plan d'exécution. Livrable n° 5 de `docs/028` §11.5 (« Plan de
> migration des données — renommage `Ecodume` (D-09), rattachement des 7 événements
> et 10 publications (D-08), purge de `requester_contact` (D-17), migration de
> l'enum des rôles (D-05) »).
> **Autorité :** `docs/028-decisions_arbitrees.md` **prévaut**. Ce document
> **n'arbitre rien** : il ordonne, chiffre et protège ce que `028` (décisions),
> `029` (RBAC), `030` (cryptographie des prières), `031` (contrats de contenu) et
> `032` (schéma SQL final) exigent déjà.
> **Périmètre :** l'**ordonnancement** de la migration, sa **réversibilité**, sa
> **vérification** et son **déploiement**. Le DDL lui-même appartient à `docs/032`.
> **Ce que ce document n'est pas :** ce n'est **pas** un script. Il ne contient
> aucun code exécutable, aucune migration Drizzle, aucune commande à lancer telle
> quelle. Les extraits SQL des §2 et §5 sont **des contrôles et des illustrations
> de lecture**, jamais un patch à appliquer.
> **Ce document ne modifie aucune base.** Aucune écriture n'a été effectuée pour
> le produire : la §1 repose sur des **lectures** (comptages, listes de valeurs,
> introspection de schéma) et sur le code du dépôt.
> **Document :** `docs/033-plan_migration_donnees.md`

---

# 0. Méthode, sources et conventions

## 0.1 Sources, par ordre d'autorité

| Rang | Source | Ce qui en est tiré |
| --- | --- | --- |
| 1 | `docs/028-decisions_arbitrees.md` | **Vérité.** D-05, D-08, D-09, D-17, D-18, D-19, D-20, D-26 sont le cœur de la mission. |
| 2 | `docs/032-schema_sql_final.md` | **Le schéma cible existe.** 24 tables, 17 énumérations, §6 (conservation D-08), §7 (écarts avec les 16 tables en place), §8 (12 points non tranchés), §10 (48 index). |
| 3 | `docs/031-schemas_contenu_pages.md` §6 | État de départ des pages, séquence M1→M8, contradictions `pageKey` (§6.5), horaires divergents (§6.7). **Réutilisé, complété, jamais contredit.** |
| 4 | `docs/029-matrice_rbac.md` | 17 ressources × 99 actions ; §7.3 (impact sur les 363 tests) ; Q-01 → Q-31. |
| 5 | `docs/030-specification_cryptographique_prieres.md` | §3.6 (structures de stockage), §4.6 (isolation), §6.2/§6.3 (audit, notifications). |
| 6 | `backend/src/infrastructure/database/seed-data.ts` + `seed.ts` | Ce qui est **réellement semé**, et comment (slug dérivé, idempotence par comptage). |
| 7 | `backend/drizzle/0000_elite_pretty_boy.sql` | La migration en place : 16 tables, 6 énumérations, 28 index. |
| 8 | `backend/src/**` | Code réel : `static-pages`, `domain/content`, `prayer-requests`, schémas Drizzle. |
| 9 | **Base de données cible** (celle de `backend/.env`) | **Comptages et valeurs réellement présents**, lus en lecture seule. Ce que la §1 appelle « vérifié en base ». |

## 0.2 Comment l'état de départ a été établi — et la limite exacte

**Sans `docs/032` il aurait fallu le deviner.** Il existe : le schéma cible est
donc disponible, et ce plan n'a pas eu à extrapoler à partir de `028` + `029` +
`031`.

**Ce qui a été fait :** la base pointée par `backend/.env` a été interrogée en
**lecture seule** (comptages par table, listes de valeurs, introspection
`information_schema`, `pg_enum`, `pg_constraint`, contraintes de clés étrangères,
objets du Storage). Aucun `INSERT`, `UPDATE`, `DELETE`, `ALTER` ni `DROP` n'a été
émis. Les valeurs sensibles des demandes de prière n'ont **pas** été lues : la §1.8
ne contient qu'un comptage.

**La limite, énoncée sans détour :**

> La base interrogée est celle que la configuration locale désigne
> (`aws-1-eu-central-1.pooler.supabase.com`, base `postgres`). **Elle n'est pas
> nécessairement la base de production Railway.** Aucun document du dépôt
> n'identifie formellement l'environnement de production, et `railway.json`
> n'expose pas de référence de base.
>
> Conséquence normative : **chaque chiffre de la §1 doit être recompté sur la base
> de production avant exécution** (§5.1 fournit les requêtes exactes). Les écarts
> éventuels entre cet environnement et la production sont **inconnus** — ils
> doivent être mesurés, pas supposés nuls.

## 0.3 Vocabulaire de statut employé partout

| Statut | Signification |
| --- | --- |
| **tranché (028)** | Une décision D-01 → D-26 le fixe. Non négociable, non révisable ici. |
| **proposé (032)** | `docs/032` propose une valeur, une contrainte ou une séquence. Ce n'est **pas** une décision de `028` : c'est un choix de schéma, révisable et explicitement signalé comme tel par `032` lui-même (§1.2, §8). |
| **non tranché** | Ni `028`, ni une décision du commanditaire ne le fixe. **Aucune supposition n'est faite** : le point est versé en §7 et **bloque** ou est signalé comme bloquant. |

**Règle appliquée :** un point que `028` ne fixe pas est écrit « **non tranché** »,
même lorsque `032` en propose une valeur. La nuance est portée dans la colonne
« Statut » et jamais effacée.

## 0.4 Identifiants d'étapes

Deux familles d'identifiants, utilisées sans exception dans tout le document :

- **`M-xn`** — une **transformation** de l'inventaire (§2). Décrit *quoi* change.
- **`É<n>`** — une **étape d'exécution** ordonnée (§3). Décrit *quand* et *dans quel
  ordre*, avec prérequis, vérification et retour arrière.

Une transformation peut apparaître dans plusieurs étapes (ex. `M-B1` : l'énumération
est préparée en `É14`, convertie en `É26`), et une étape peut porter plusieurs
transformations. La table de correspondance est en §3.1.

---

# 1. État de départ, vérifié

## 1.1 Volumétrie réellement comptée

**Base de `backend/.env`, lue le jour de rédaction de ce document.** Le décompte
« graine » est celui de `seed-data.ts` ; il est reproduit pour que tout écart soit
visible d'un coup d'œil.

| Table | Lignes en base | Attendu par la graine | Écart |
| --- | --- | --- | --- |
| `admin_profiles` | **1** | — (hors graine) | — |
| `departments` | **3** | 3 | **aucun** |
| `department_media` | **18** | 3 galeries × 6 | **aucun** |
| `events` | **7** | 7 | **aucun** |
| `event_media` | **18** | 4+4+3+3+2+2+0 | **aucun** |
| `publications` | **10** | 10 | **aucun** |
| `media` | **28** | 28 fichiers distincts référencés | **aucun** |
| `community_faces` | **5** | 5 | **aucun** |
| `leaders` | **5** | 5 | **aucun** |
| `testimonies` | **4** | 4 | **aucun** |
| `schedule_entries` | **6** | 6 | **aucun** |
| `scriptures` | **7** | 7 | **aucun** |
| `site_settings` | **15** | 15 | **aucun** |
| `social_links` | **2** | 2 | **aucun** |
| `static_pages` | **6** lignes / **12** valeurs | 6 lignes / 12 valeurs | **aucun** |
| `prayer_requests` | **0** | — (absent de la graine) | — |
| `auth.users` (Supabase) | **1** | — | — |
| `storage.objects` | **28** (bucket `ccjv-media`) | 28 | **aucun** |

**Lecture :** la base est **strictement conforme à la graine**. Elle a été créée et
semée en **une seule passe** — `drizzle.__drizzle_migrations` contient
**1 ligne**, et les `created_at` des publications s'étalent sur quelques secondes
d'un même horodatage. Aucun contenu éditorial saisi depuis le back-office n'est
présent : **il n'existe aujourd'hui aucune donnée « réelle » à préserver, seulement
des données de démonstration**. C'est une circonstance atténuante considérable —
mais elle ne dispense pas des décisions de la §7, car **la production peut
différer**.

## 1.2 Départements — les 3 lignes exactes

| `name` | `slug` | `position` | `responsible_name` | `meeting_schedule` | événe. | publi. | chefs | médias |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `Adultes` | **`adultes`** | 0 | `Pasteur Manasse Mwamba` | `Dimanche · 09:00 — Culte dominical` | **2** | **0** | 1 | 6 |
| `Enfants / Ecodim` | **`enfants-ecodim`** | 1 | `Responsable Ecodim — à confirmer` | `Dimanche · 09:00 — Rencontre Ecodim` | **1** | **0** | 1 | 6 |
| `Chorale` | **`chorale`** | 2 | `Responsable chorale — à confirmer` | `Lundi 16h30–18h30 · Mercredi dans la nuit · Samedi 16h30–18h30` | **2** | **0** | 1 | 6 |

Identifiants stables à consigner avant migration (ils sont la seule clé de
rattachement fiable, les `slug` étant appelés à changer) :

```text
Adultes           0ffd4369-c99f-42f9-aa6d-deedf2357356
Enfants / Ecodim  82b294f3-e66b-4d41-a922-8c6f9298c1c5
Chorale           3be87872-798f-496d-9d17-392e65eb3c0e
```

**Le `slug` n'est pas un littéral de la graine : il est dérivé.**
`seed.ts` appelle `uniqueSlug(department.name, …)` → `slugify()`
(`backend/src/shared/utils/slug.ts:10-20`) : NFD, accents retirés, minuscules,
tout caractère non alphanumérique → `-`, tirets doublés réduits, borné à 160.
`"Enfants / Ecodim"` produit donc `enfants-ecodim` — **ce qui est bien la valeur
observée en base**, et non `ecodim`. **Ce point est décisif pour D-09 (§2.2).**

## 1.3 Événements — les 7 lignes et leur rattachement réel

| # | `title` | `slug` | `event_date` | `department_id` | département |
| --- | --- | --- | --- | --- | --- |
| 1 | `Répétition de la chorale` | `repetition-de-la-chorale-2` | 2026-09-18 | `3be87872…` | **Chorale** |
| 2 | `Journée communautaire` | `journee-communautaire` | 2026-09-22 | **`NULL`** | **aucun** |
| 3 | `Culte dominical` | `culte-dominical-2` | 2026-10-02 | `0ffd4369…` | **Adultes** |
| 4 | `Culte dominical` | `culte-dominical` | 2026-10-09 | `0ffd4369…` | **Adultes** |
| 5 | `Rencontre Ecodim` | `rencontre-ecodim` | 2026-10-13 | `82b294f3…` | **Enfants / Ecodim** |
| 6 | `Répétition de la chorale` | `repetition-de-la-chorale` | 2026-10-16 | `3be87872…` | **Chorale** |
| 7 | `Culte spécial — Action de grâce` | `culte-special-action-de-grace` | 2026-10-22 | **`NULL`** | **aucun** |

**Répartition réelle :** Adultes **2** · Chorale **2** · Enfants/Ecodim **1** ·
**`NULL` 2**. Total 7.

> **Écart à signaler.** `docs/032` §6.1 annonce « `Adultes` : **3 événements**
> (`Culte dominical` ×2, `Culte spécial — Action de grâce` …) ». La base dit
> **2** pour Adultes, et `Culte spécial — Action de grâce` est à **`NULL`**, pas
> rattaché à Adultes. Le total « 5 rattachés / 2 `NULL` » de `032` §6.1 est
> exact ; sa **ventilation par département** ne l'est pas. La présente §1.3 fait
> foi pour l'exécution.

**Dates :** elles proviennent de `dateOffsetDays` (`seed.ts:705`) — donc
**relatives au jour du seed**, jamais figées. Un `npm run seed -- --reset`
**décalerait** toutes les dates et déplacerait le tri de D-19 (`published_at ASC`).
**Le seed ne doit pas être relancé entre la sauvegarde et la migration.**

## 1.4 Publications — les 10 lignes, et l'absence de tout rattachement

| # | `title` | `slug` | `type` | `category` | `status` | `published_at` |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `Culte du dimanche — La maison de Dieu` | `culte-du-dimanche-la-maison-de-dieu` | VIDEO | ENSEIGNEMENT | **PUBLISHED** | 2026-10-04 |
| 2 | `Retour en images — Culte dominical` | `retour-en-images-culte-dominical` | PHOTO | MEDIA | **PUBLISHED** | 2026-10-01 |
| 3 | `Enseignement — Une foi qui se vit ensemble` | `enseignement-une-foi-qui-se-vit-ensemble` | VIDEO | ENSEIGNEMENT | **PUBLISHED** | 2026-09-27 |
| 4 | `Album — Louange et adoration` | `album-louange-et-adoration` | PHOTO | MEDIA | **PUBLISHED** | 2026-09-23 |
| 5 | `Annonce — Rentrée de l'Ecodim` | `annonce-rentree-de-l-ecodim` | TEXTE | ACTUALITE | **PUBLISHED** | 2026-09-16 |
| 6 | `Vie de l'Ecodim en images` | `vie-de-l-ecodim-en-images` | PHOTO | MEDIA | **PUBLISHED** | 2026-09-09 |
| 7 | `Nouvelle saison des groupes de maison` | `nouvelle-saison-des-groupes-de-maison` | TEXTE | ACTUALITE | **PUBLISHED** | 2026-09-05 |
| 8 | `Guide d'étude — Les fondements de la foi` | `guide-d-etude-les-fondements-de-la-foi` | TEXTE | RESSOURCE | **PUBLISHED** | 2026-08-29 |
| 9 | `Plan de lecture biblique` | `plan-de-lecture-biblique` | TEXTE | RESSOURCE | **PUBLISHED** | 2026-08-23 |
| 10 | `Journée communautaire en images` | `journee-communautaire-en-images` | PHOTO | MEDIA | **PUBLISHED** | 2026-08-15 |

**Trois faits décisifs, vérifiés :**

1. **Les 10 publications sont toutes `PUBLISHED`.** Aucune n'est `DRAFT`.
2. **`publications` ne possède aucune colonne `department_id`.** Vérifié par
   introspection : les seules colonnes `*department*` de la base sont
   `department_media.department_id`, `events.department_id` et
   `leaders.department_id`. **Aucune publication n'est rattachée à quoi que ce
   soit, parce que le rattachement n'existe pas dans le modèle actuel.**
3. Répartition : par `category` → MEDIA **4**, ACTUALITE 2, ENSEIGNEMENT 2,
   RESSOURCE 2 ; par `type` → PHOTO 4, TEXTE 4, VIDEO 2 ;
   par mois de `published_at` → 2026-08 : **3**, 2026-09 : **5**, 2026-10 : **2**.

**C'est le point dur de tout ce plan (§2.7).** L'affirmation de D-08 — « auxquels
sont rattachés **7 événements et 10 publications** » — décrit un rattachement qui,
pour les publications, **n'existe nulle part** : ni en base, ni dans la graine, ni
dans `docs/022`/`023`/`024`. Ce ne sont pas des rattachements à migrer, ce sont
**10 rattachements à créer** (§7, **Q-S1**).

## 1.5 Responsables, témoignages, visages, versets, horaires, réglages

**`leaders` — 5 lignes.** `scope` est un **libellé français libre**, jamais un
identifiant de département ; `department_id` est le rattachement réel.

| `name` | `scope` (texte libre) | `department_id` |
| --- | --- | --- |
| `Pasteur Manasse Mwamba` | `Direction générale` | **`NULL`** |
| `Responsable — Adultes` | `Adultes` | `0ffd4369…` |
| `Responsable — Ecodim` | `Enfants / Ecodim` | `82b294f3…` |
| `Responsable — Chorale` | `Chorale` | `3be87872…` |
| `Responsable — Accueil` | `Communauté` | **`NULL`** |

> 4 noms sur 5 sont des **placeholders**, y compris celui d'Adultes
> (`Responsable — Adultes`). Aucune de ces lignes n'est un compte utilisateur :
> `admin_profiles` contient **1** ligne, pas 5.

**`testimonies` — 4 lignes** : Grâce, Patrick, Esther, Josué. **Aucune colonne de
statut** aujourd'hui. ⚠️ Ces 4 témoignages sont **réellement affichés** :
`frontend/src/app/communaute/temoignages/page.tsx:55` appelle `getTestimonies()`
et rend `lead` + `others`. La conséquence est traitée en §2.12.

**`community_faces` — 5 lignes** : Grâce, Patrick, Esther, Naomi, Emmanuel.

**`scriptures` — 7 clés** : `rassemblement`, `louange`, `repos`, `parole`,
`ouvrage`, `corps`, `memoire`. Toutes en Louis Segond 1910.

**`schedule_entries` — 6 lignes**, dans l'ordre `position` 0→5 :

| `position` | `day` | `title` | `time_label` | `audience` | `is_confirmed` |
| --- | --- | --- | --- | --- | --- |
| 0 | Dimanche | `Culte dominical` | 09h00 | Toute l'assemblée | **false** |
| 1 | Dimanche | `Ecodim` | 09h00 | Enfants — pendant le culte | **false** |
| 2 | Lundi | `Répétition de la chorale` | 16h30 – 18h30 | Chantres et musiciens | **true** |
| 3 | Mercredi | `Répétition de la chorale` | Dans la nuit | Veillée de préparation | **true** |
| 4 | Mercredi | `Prière et intercession` | 17h00 | Toute l'église | **false** |
| 5 | Samedi | `Répétition de la chorale` | 16h30 – 18h30 | Chantres et musiciens | **true** |

**`site_settings` — 15 clés**, aucune autre :
`site.acronym`, `site.address`, `site.addressLine1`, `site.addressLine2`,
`site.addressLine3`, **`site.ecodimFoundedAt`**, `site.foundedAt`,
`site.location`, `site.name`, `site.scheduleAdults`,
**`site.scheduleChildren`**, `site.visionary`, `site.visionaryRole`,
`site.whatsappHref`, `site.whatsappNumber`.

**`static_pages` — 6 `page_key` × 2 valeurs = 12 valeurs**, toutes obligatoires,
**aucun champ facultatif renseigné** :

| `page_key` | Clés de `content` | Route servie par le frontend |
| --- | --- | --- |
| `accueil` | `heroTitle`, `heroIntro` | **oui** (`/`) |
| `qui-sommes-nous` | `title`, `intro` | **oui** |
| `organisation` | `title`, `intro` | **oui** |
| `communaute` | `title`, `intro` | **aucune** |
| `vie-de-leglise` | `title`, `intro` | **aucune** |
| `publications` | `title`, `intro` | **aucune** |

## 1.6 Médias et intégrité référentielle — vérifiés propres

- **28 lignes `media`**, toutes dans le bucket `ccjv-media` (public), toutes sous
  le préfixe de chemin **`pages/`**, toutes de type `image/jpeg`, de 39 272 à
  250 556 octets, **toutes dimensionnées** (`width`/`height` non nuls), **toutes
  porteuses du marqueur de graine** `alt = "CCJV (démo) — ccjv-XX.jpeg"`.
- **28 objets** dans `storage.objects` — correspondance **1:1** avec les lignes
  `media`. Aucun fichier sans ligne, aucune ligne sans fichier.
- **Médias orphelins : 0.** Vérifié par une requête qui contrôle les 8 chemins de
  référence possibles (`department_media`, `event_media`, `departments.banner`,
  `events.image`, `events.banner`, `publications.cover`, `leaders.photo`,
  `testimonies.photo`, `community_faces.photo`).
- **Références cassées : 0** (`departments.banner_media_id`, `events.image_media_id`,
  `publications.cover_media_id` — toutes résolues).

> **Avertissement opérationnel.** Le marqueur `CCJV (démo) — ` est la clé
> d'idempotence du seed *et* le critère de suppression de son `--reset`
> (`seed.ts:93, 486-510`) : **`npm run seed -- --reset` sur la production
> détruirait les 28 médias, leurs fichiers dans le bucket et 11 des 16 tables de
> contenu**. Ce plan n'utilise jamais `--reset`. Le garde-fou
> `NODE_ENV=production` (`seed.ts:516-534`) existe mais se contourne par
> `ALLOW_SEED_IN_PRODUCTION=true` : cette variable **ne doit pas** être posée.

## 1.7 Comptes — l'état exact du point D-05

| Objet | Valeur observée |
| --- | --- |
| `admin_profiles` | **1** ligne |
| `role` | **`ROLE_ADMIN`** (l'unique valeur de l'énumération `admin_role`) |
| `is_active` | `true` |
| `auth.users` | **1** compte : `admin@ccjv.local` |
| `SUPER_ADMIN` | **0 occurrence** — ni en base, ni dans le code |
| colonnes de profil | `id`, `username`, `display_name`, `role`, `is_active`, `created_at`, `updated_at` — **ni `scope`, ni `department_id`** |

D-05 (« le compte existant devient `ADMIN`, le `SUPER_ADMIN` sera un compte
**distinct** ») s'applique donc à **un seul** compte **ici**. En production, le
nombre de comptes est **inconnu** et doit être compté avant toute opération
(§5.1). L'identité du futur `SUPER_ADMIN` **n'est fixée par aucune décision**
(§7, **Q-NT3**).

## 1.8 Demandes de prière — 0 ligne, et ce que cela change

| Mesure | Valeur |
| --- | --- |
| `select count(*) from public.prayer_requests` | **0** |
| `count(requester_contact)` | **0** |
| `count(requester_contact)` non vide après `btrim` | **0** |
| `count(requester_name)` | **0** |
| Colonne `requester_contact` | **présente** : `character varying(120)`, `NULL` autorisé |
| Énumération `prayer_confidentiality` | `private`, `community` |
| Énumération `prayer_status` | `NEW`, `PRAYED` |

**Conséquence directe et honnête :** dans **cette** base, la purge D-17 n'a
**rien à purger**. La procédure de §2.10 reste **entièrement applicable** — elle
vise la production, où des demandes peuvent exister (le formulaire public
`POST /prayer-requests` est en service). **Aucune conclusion ne peut être tirée de
ce zéro pour la production.**

## 1.9 Écarts entre le seed et la base

| # | Point | Verdict |
| --- | --- | --- |
| S-1 | Volumétrie des 11 tables de contenu | **Conforme** (cf. §1.1). |
| S-2 | `slug` des départements | **Conforme** : dérivé par `slugify`, non littéral — `enfants-ecodim`, pas `ecodim`. |
| S-3 | Ruff du marqueur média `alt` | **Conforme** : les 28 médias portent `CCJV (démo) — …`. |
| S-4 | Champs facultatifs de `static_pages` | **Conforme** : aucun n'est renseigné (12 valeurs, toutes obligatoires). |
| S-5 | `leaders.scope` | **Conforme** : libellés libres, non joignables à `departments`. |
| S-6 | `prayer_requests` | La graine n'en contient pas ; la base non plus. **Cohérent.** |
| S-7 | Dates | **Relatives** (`dateOffsetDays`) : la base a été semée le **2026-10-06**. Un re-seed les décalerait. |

**Aucun écart de contenu entre la graine et cette base.** L'écart existe ailleurs —
entre **les documents** et la base, et il est plus grave (§1.10).

## 1.10 Écarts entre la documentation et la base — les deux points durs

### Écart D-1 — « 7 événements et 10 publications rattachés » (D-08, `docs/027` Q-B2)

**Ce qui est écrit :** D-08 : « `Adultes`, `Enfants/Ecodim` et `Chorale` — auxquels
sont rattachés **7 événements et 10 publications** ».

**Ce que la base dit :**

| Ensemble | Total | Réellement rattaché à un département | Sans rattachement |
| --- | --- | --- | --- |
| Événements | 7 | **5** | **2** (`NULL`) |
| Publications | 10 | **0** — la colonne n'existe pas | **10** |

**Interprétation retenue, et elle est la seule défendable :** « 7 » et « 10 » sont
les **totaux des tables**, non des rattachements. `docs/032` §6.1 a relevé le cas
des publications ; il n'a pas relevé celui des événements (2 à `NULL`). Les deux
sont traités en §2.6, §2.7 et §7 (**Q-S1**, **Q-S2**).

### Écart D-2 — « 97 occurrences d'`Ecodim` dans le code » (`docs/026` L67)

**Mesuré sur ce dépôt**, hors `node_modules`, hors `docs/` :

| Emplacement | Occurrences |
| --- | --- |
| `frontend/src/**` (11 fichiers) | **70** |
| `backend/src/**` (2 fichiers) | **27** |
| `backend/openapi.yaml` + `openapi.json` | **2** |
| `frontend/README.md` | **1** |
| **Total hors documentation** | **100 occurrences sur 97 lignes, dans 23 fichiers** |
| `docs/**` (dont `docs/audit/**` : 138, `docs/extraits` : 13) | **213** |
| **Total dépôt** | **313 occurrences** |

Le chiffre de `docs/026` (« 97 ») correspond au **nombre de lignes**, non
d'occurrences. La liste exhaustive des emplacements est en §2.2.5.

## 1.11 Le schéma en place — ce que la migration doit déplacer

**6 énumérations** (`pg_enum`, schéma `public`) :

| Type | Valeurs actuelles | Devient (`docs/032` §2) |
| --- | --- | --- |
| `admin_role` | `ROLE_ADMIN` | `SUPER_ADMIN`, `ADMIN`, `DEPARTMENT_MANAGER` — **reconstruit** |
| `prayer_confidentiality` | `private`, `community` | **supprimé** (remplacé par `is_anonymous`) |
| `prayer_status` | `NEW`, `PRAYED` | `PENDING`, `ARCHIVED` — **reconstruit** |
| `publication_category` | `ACTUALITE`, `ENSEIGNEMENT`, `MEDIA`, `RESSOURCE` | inchangé |
| `publication_status` | `DRAFT`, `PUBLISHED` | `+ ARCHIVED` — **étendu** |
| `publication_type` | `VIDEO`, `PHOTO`, `TEXTE` | inchangé |

**Contraintes et colonnes à modifier, relevées en base :**

| Objet | État actuel | Cible `docs/032` |
| --- | --- | --- |
| `events.department_id` | `uuid`, **`NULL` autorisé**, FK **`ON DELETE SET NULL`** | `NOT NULL`, FK **`ON DELETE RESTRICT`** |
| `events.visibility_scope` | **absente** | `event_visibility_scope NOT NULL DEFAULT 'DEPARTMENT'` |
| `publications.department_id` | **absente** | `uuid NOT NULL`, FK `RESTRICT` |
| `publications.archived_at` | **absente** | `timestamptz` + `CHECK` de cohérence |
| `admin_profiles.scope` / `.department_id` | **absentes** | `admin_scope NOT NULL` / `uuid` + `CHECK` de cohérence |
| `departments.capabilities` | **aucune table** | `department_capabilities` |
| `media_access` | **aucune table** | `media_access` (3 droits indépendants) |
| `static_pages.template` / `.contract_version` | **absentes** | `varchar(40) NOT NULL` / `integer NOT NULL DEFAULT 1` |
| `schedule_entries.department_id` | **absente** | ajout facultatif (`docs/032` §7.2 ligne 11) |
| `testimonies.status` | **absente** | `testimony_status NOT NULL DEFAULT 'DRAFT'` |
| `site_settings` | aucune contrainte de nommage | `CHECK site_settings_no_prayer_secret` |
| `social_links` | aucune contrainte de schéma d'URL | `CHECK href ~* '^https?://'` |
| Schéma `prayer_private` | **inexistant** | 4 tables + 2 rôles PostgreSQL disjoints |
| `drizzle.__drizzle_migrations` | **1** migration appliquée | + les migrations de ce plan |

**Index :** 28 créés par la migration initiale (dont 2 sur `prayer_requests`), cible
`docs/032` §10 = **48**. Les index de contrainte (`publications_department_slot_uidx`,
`media_access_*_unique`, `data_key_envelope_active_unique`,
`crypto_key_active_slot_uidx`) ne peuvent être posés **qu'après** la conformité des
données : c'est la contrainte structurante de la §3.

## 1.12 Ce que cette §1 ne couvre pas — énoncé explicitement

| Non couvert | Pourquoi | Où c'est traité |
| --- | --- | --- |
| La base **de production Railway** | Identifiants et instance non identifiés dans le dépôt ; l'interroger sortait du périmètre de la mission | §5.1 (requêtes à rejouer), §4.1 (sauvegarde à faire) |
| Les **fichiers du bucket** autres que les 28 objets | Le dépôt n'en déclare pas d'autres ; un téléversement manuel resterait invisible | §4.1 (inventaire du Storage) |
| Les tables `auth.*`, `storage.*`, `realtime.*`, `vault.*`, `extensions.*` | Elles appartiennent à Supabase, `schemaFilter: ["public"]` les exclut de Drizzle, et aucune décision ne les vise | Hors périmètre |
| Les 28 objets `media` et leurs fichiers | Aucune transformation de ce plan ne les touche | §4.3 (protection, non modification) |

---

# 2. Inventaire des migrations requises

## 2.1 Tableau maître des transformations

Colonnes : **volume** = lignes/objets concernés dans la base vérifiée §1 ;
**nature** — *additif* (aucune perte, retour arrière possible), *bloquant* (exige
une décision avant exécution), *destructif* (perte de donnée ou de capacité).

| ID | Transformation | Source → Cible | Volume | Nature | Risque principal |
| --- | --- | --- | --- | --- | --- |
| **M-A1** | Renommage `Ecodim` → `Ecodume` — **identifiant métier** | `departments.name` `Enfants / Ecodim` → `Ecodume` ; `departments.slug` `enfants-ecodim` → **à trancher** | 1 ligne | **destructif** (contrat d'URL et d'ancre) | Ancres codées en dur ; collision avec l'`Ecodume` de D-07 |
| **M-A2** | Renommage `Ecodim` → `Ecodume` — **textes éditoriaux** | 20 occurrences dans 9 lignes de 6 tables | **9 lignes / 20 occurrences** | additif (réécriture de valeur) | Révision éditoriale non validée par CCJV |
| **M-A3** | Renommage `Ecodim` → `Ecodume` — **slugs de contenu** | `events.slug`, `publications.slug` | **3 slugs** | **destructif** (URL publiques) | Contredit D-20 (« URL existante ») |
| **M-A4** | Renommage `Ecodim` → `Ecodume` — **clé de réglage** | `site.ecodimFoundedAt` → `site.ecodumeFoundedAt` | 1 clé | additif | Change le contrat de `PATCH /settings` |
| **M-A5** | Renommage `Ecodim` → `Ecodume` — **code applicatif** | 23 fichiers hors `docs/` | **100 occurrences / 97 lignes** | additif | Ordre code↔données obligatoire (§2.2.6) |
| **M-A6** | Renommage `Ecodim` → `Ecodume` — **documentation** | `docs/**` | **213 occurrences** | additif | Aucun effet d'exécution |
| **M-B1** | Énumération des rôles | `admin_role` : `ROLE_ADMIN` → `SUPER_ADMIN \| ADMIN \| DEPARTMENT_MANAGER` | 1 type / 1 ligne | **destructif** (type reconstruit) | `DEFAULT` hérité ; l'ordre est obligatoire |
| **M-B2** | Compte `SUPER_ADMIN` distinct | aucun → 1 compte | 1 ligne à créer | additif | **Titulaire non tranché** (Q-NT3) |
| **M-B3** | `admin_profiles.scope` + `department_id` + `CHECK` | absentes → `admin_scope NOT NULL` / `uuid` | 1 ligne | additif puis bloquant | `CHECK` refusé si `scope` posé `NOT NULL` trop tôt |
| **M-C1** | Départements historiques — **conservation** | 3 lignes | 3 lignes | **non destructif** | — |
| **M-C2** | Rattachement des 2 événements à `NULL` | `department_id = NULL` → département | **2 lignes** | **bloquant** | **Q-S2 non tranché** |
| **M-C3** | `events.department_id NOT NULL` + FK `RESTRICT` | `NULL` autorisé / `SET NULL` → `NOT NULL` / `RESTRICT` | 7 lignes | **destructif** (capacité) | Échoue tant que 1 ligne est à `NULL` |
| **M-C4** | `events.visibility_scope` | absente → `NOT NULL DEFAULT 'DEPARTMENT'` | 7 lignes | additif | Trigger de capacité ; valeur `GLOBAL` impossible sans capacité |
| **M-D1** | `publication_status` : `+ ARCHIVED` | `DRAFT`,`PUBLISHED` → `+ARCHIVED` | 1 type | additif | **Transaction séparée obligatoire** (§2.8.2) |
| **M-D2** | `publications.archived_at` + `CHECK` | absente → `timestamptz` | 10 lignes | additif | `CHECK` posé après remplissage |
| **M-D3** | `publications.department_id` + FK `RESTRICT` | absente → `uuid NOT NULL` | **10 lignes** | **bloquant** | **Q-S1 non tranché** |
| **M-D4** | Règle des 3 — contrainte déclarative | aucune → index unique partiel `(department_id, published_slot)` | 10 lignes | **bloquant** | Impossible tant qu'un département a > 3 `PUBLISHED` |
| **M-D5** | **Archivage rétroactif** `PUBLISHED → ARCHIVED` | ≥ 1 ligne selon décision | **≥ 1 ligne** | **destructif et IRRÉVERSIBLE** | **Aucune porte de sortie sauf restauration** (§4.3.3) |
| **M-D6** | Trigger d'irréversibilité `ARCHIVED` | aucun → `publications_status_immutable` | 1 trigger | additif | Doit être posé **après** M-D5 |
| **M-E1** | `requester_contact` : suppression | colonne présente → colonne inexistante | 1 colonne / **0 ligne** | **destructif** | **Q-S5 non tranché** (export ou non) |
| **M-E2** | `prayer_requests` → `prayer_private.prayer_request` | table `public` → schéma isolé | **0 ligne** | **destructif** | `prayer_confidentiality` supprimé, `prayer_status` reconstruit |
| **M-F1** | `pageKey` — 3 clés sans route servie | `communaute`, `vie-de-leglise`, `publications` | 3 lignes conservées | non destructif | **Q-PG3 non tranché** |
| **M-F2** | `pageKey` — 3 pages servies sans clé | `evenements`, `ou-nous-trouver`, `faire-un-don` (+ `departement`) | **0 ligne** créée par la migration | additif | `title` obligatoire = **contenu éditorial non inventable** |
| **M-F3** | `static_pages.template` + `contract_version` | absentes → `NOT NULL` / `DEFAULT 1` | 6 lignes | additif | `template` dérivé du serveur, jamais du client |
| **M-F4** | Versets manquants pour `/organisation` | 7 clés → +2 ou +3 | **2 à 3 lignes** | additif | **Nom des clés non tranché** (Q-NT5) |
| **M-G1** | `data_key_envelope` | inexistante → créée | 0 ligne | additif | FK vers `crypto_key` : ordre de création |
| **M-G2** | `crypto_key` (registre public) | inexistante → créée | 0 ligne | additif | `CHECK` d'exclusion `owner_user_id` |
| **M-G3** | `prayer_audit_event` | inexistante → créée | 0 ligne | additif | Liste close d'actions |
| **M-G4** | Isolation `prayer_private` + 2 rôles | inexistante → `REVOKE`/`GRANT` | — | additif | Droits Supabase — **point d'exécution réel** (§7, Q-NT8) |
| **M-H1** | `media_access` | inexistante → créée | 0 ligne | additif | Trigger de destinataire (§2.11) |
| **M-H2** | `department_capabilities` | inexistante → créée | 0 ligne | additif | **Q-S6/Q-S7/Q-S8 non tranchés** |
| **M-H3** | `notifications`, `notification_outbox`, `audit_log` | inexistantes → créées | 0 ligne | additif | `CHECK` « destinataire prière = ADMIN actif » |
| **M-I1** | `testimonies.status` + modération | absente → `NOT NULL DEFAULT 'DRAFT'` | **4 lignes** | additif en base, **à effet public** | **Effet visible sur `/communaute/temoignages`** (§2.12) |
| **M-I2** | `site_settings` / `social_links` `CHECK` | aucune contrainte | 15 + 2 lignes | additif | Bloquant si une valeur diverge — **vérifié non bloquant ici** |
| **M-I3** | `schedule_entries.department_id` | absente → nullable | 6 lignes | additif | **Q-PG5 non tranché** — recommandation : **ne pas l'ajouter** |

**Décompte, établi ligne par ligne sur le tableau ci-dessus :**

| Nature | Nombre | Transformations |
| --- | --- | --- |
| **Additives pures** (aucune perte, retour arrière immédiat) | **22** | `M-A2`, `M-A4`, `M-A5`, `M-A6`, `M-B2`, `M-C4`, `M-D1`, `M-D2`, `M-D6`, `M-F2`, `M-F3`, `M-F4`, `M-G1`, `M-G2`, `M-G3`, `M-G4`, `M-H1`, `M-H2`, `M-H3`, `M-I1`, `M-I2`, `M-I3` |
| **Additive puis bloquante** | **1** | `M-B3` — les colonnes sont additives, le `CHECK` de cohérence qui suit ne l'est pas |
| **Non destructives** (rien n'est perdu, mais un état est figé) | **2** | `M-C1`, `M-F1` |
| **Bloquantes** (exigent une décision avant exécution) | **3** | `M-C2` (**Q-S2**), `M-D3` (**Q-S1**), `M-D4` (**Q-P3**) |
| **Destructives** | **7** | `M-A1`, `M-A3`, `M-B1`, `M-C3`, `M-E1`, `M-E2`, `M-D5` |
| dont **irréversible** | **1** | **`M-D5`** — archivage `PUBLISHED → ARCHIVED`, seule transformation dont l'annulation exige une **restauration complète** (§4.3.3) |
| **Total** | **35** | |

**Trois recoupements à ne pas confondre :** `M-B1` est destructif **sans** être
bloquant (la conversion réussit toujours, mais le type ne revient pas) ; `M-C3` et
`M-D3` sont **bloquants** et l'un d'eux (`M-C3`) est **destructif** ; `M-D5` n'est
ni additif, ni bloquant **du point de vue de la décision** (il l'est du point de vue
de la conformité de `M-D4`) mais il est le **seul irréversible**.

## 2.2 M-A1 → M-A6 — Renommage `Ecodim` → `Ecodume` (D-09)

**Ce que D-09 exige, mot pour mot :** « Renommage **métier réel**, pas un changement
de libellé d'affichage. Doivent converger vers **Ecodume** : données persistées ·
identifiant métier · slug · frontend · back-office · documentation · références
applicatives. Les anciennes occurrences sont **migrées** ; on ne maintient pas deux
terminologies concurrentes. »

**Ce que D-09 ne fixe pas :** la **valeur littérale du slug**. C'est le point
central de cette section (§2.2.3).

### 2.2.1 M-A1 — L'identifiant métier

`departments.name = 'Enfants / Ecodim'` → `'Ecodume'` (la valeur cible est
proposée par `docs/032` §6.2). `departments.slug = 'enfants-ecodim'` → **à
trancher**.

**Contrainte de schéma :** `departments.slug` porte un **index UNIQUE**
(`departments_slug_idx`). Le nouveau slug doit donc être libre. Aujourd'hui aucun
conflit : les seuls slugs en base sont `adultes`, `enfants-ecodim`, `chorale`.

**⚠️ Collision à signaler — elle n'est pas résolue par les documents :**
`docs/032` §6.2 liste **deux** départements nommés `Ecodume` :

```text
├── Ecodume                 ← D-07 (nouveau département à espace back-office)
...
└── Ecodume (ex-Enfants/Ecodim)  ← D-08 + D-09 (département historique renommé)
```

Or D-07 définit `Ecodume` comme un **département du périmètre cible** qui
**n'existe pas encore** en base (les 3 seuls départements sont Adultes,
Enfants/Ecodim, Chorale). Renommer l'historique en `Ecodume` **et** créer celui de
D-07 produirait **deux départements homonymes**. Deux lectures sont possibles —
**aucune n'est tranchée** :

- **lecture 1 — fusion :** le département historique `Enfants / Ecodim` **est** le
  département `Ecodume` de D-07 ; il n'y a qu'une ligne, simplement renommée. C'est
  la lecture qui donne son sens à D-09 (« renommage métier réel ») et à D-01
  (« Responsable Ecodume … deux instances du même rôle »).
- **lecture 2 — coexistence :** `Ecodume` (D-07) est un département nouveau, et
  `Enfants / Ecodim` reste un département historique distinct à conserver (D-08).

Ces deux lectures n'ont **pas** le même effet sur les rattachements, la règle des 3
et les capacités. → §7, **Q-NT1** (**bloquant**).

### 2.2.2 M-A2 — Les textes éditoriaux, et leur volume exact

**Mesure sur les données réelles** : **20 occurrences** d'`ecodim` (insensible à la
casse) réparties sur **9 lignes** de **6 tables** :

| Table | Occurrences | Lignes concernées |
| --- | --- | --- |
| `departments` | **4** | 1 ligne — `name`, `description` (« L'Ecodim accompagne… »), `responsible_name` (« Responsable Ecodim — à confirmer »), `meeting_schedule` (« Rencontre Ecodim ») |
| `events` | **5** | **2 lignes** — `Rencontre Ecodim` (titre, description, `location` « Salle Ecodim — Lubumbashi », `practical_info` « …équipe Ecodim. ») et `Culte dominical` (`practical_info` « Un espace est prévu pour les enfants (Ecodim). ») |
| `publications` | **3** | **2 lignes** — `Annonce — Rentrée de l'Ecodim` (titre + `body[0]`), `Vie de l'Ecodim en images` (titre) |
| `leaders` | **3** | 1 ligne — `name` (« Responsable — Ecodim »), `scope` (« Enfants / Ecodim »), `bio` (« …depuis la naissance de l'Ecodim… ») |
| `testimonies` | **1** | 1 ligne — `quote` de Patrick |
| `community_faces` | **1** | 1 ligne — `caption` de Naomi |
| `schedule_entries` | **1** | 1 ligne — `title` (« Ecodim ») |
| `site_settings` | **2** | 2 clés — la **clé** `site.ecodimFoundedAt` et la **valeur** `site.scheduleChildren` (« Dimanche · 09h00 (Ecodim, pendant le culte) ») |
| `static_pages` | **0** | le `content` des 6 pages ne contient **aucune** occurrence d'`Ecodim` |
| **Total** | **20** | **9 lignes / 6 tables + 2 réglages** |

**Nature :** réécriture de valeurs, donc **additive** au sens de la conservation
(la sauvegarde contient la version antérieure), mais **non neutre** : les textes
touchés sont des **proses éditoriales déjà rédigées** (« L'Ecodim accompagne les
plus jeunes dans la découverte de Dieu… », le `bio` du responsable, la citation de
Patrick). D-09 impose la convergence, donc la réécriture est **mandatée** ; elle ne
l'est pas pour l'orthographe exacte de chaque phrase.

> **Règle de non-invention appliquée :** le remplacement mécanique
> `Ecodim → Ecodume` est le **seul** traitement que D-09 autorise. **Aucune phrase
> n'est réécrite, aucun texte n'est complété, aucune valeur n'est inventée.** Là où
> la substitution produit une phrase maladroite, c'est un point éditorial à
> soumettre, pas un texte à improviser.

**En particulier :** `site.ecodimFoundedAt` vaut `"2 juillet 2023"` — la **valeur**
ne contient aucun `Ecodim`. Seule la **clé** doit converger (M-A4). La date reste.

### 2.2.3 M-A1 (suite) — Le slug : **à trancher**

**Ce que `docs/028` fixe :** que le **slug** doit converger vers `Ecodume` (D-09).
**Ce que `docs/028` ne fixe pas :** la chaîne exacte.

**Ce que `docs/032` §6.2 propose :**

```sql
UPDATE public.departments
SET    name = 'Ecodume', slug = 'ecodume', updated_at = now()
WHERE  slug IN ('ecodim', 'enfants-ecodim', 'ecodume');
```

**Le problème, posé sans détour :** le slug **réel** est `enfants-ecodim` — pas
`ecodim`. La valeur `ecodim` du `WHERE` de `032` ne correspond à **rien** en base.
Deux cibles sont donc possibles, et elles ne sont pas équivalentes :

| Option | Slug cible | Ce qu'elle signifie | Effet |
| --- | --- | --- | --- |
| **S-1 — `ecodume`** (proposé par `032`) | `ecodume` | Le département s'appelle `Ecodume`, point. Le préfixe `enfants-` disparaît. | Aligne le slug sur le nom ; **casse tous les liens `#enfants-ecodim` existants** ; **crée le risque d'homonymie** avec l'`Ecodume` de D-07 (§2.2.1) |
| **S-2 — `enfants-ecodume`** | `enfants-ecodume` | Le département reste « le ministère des enfants », renommé. | Préserve la lisibilité métier et l'absence d'homonymie avec D-07 ; **casse aussi** les ancres actuelles, mais de façon prévisible |

> **Point à trancher — non fixé par `docs/028`.** `docs/032` §6.2 propose
> `ecodume` ; c'est un **choix de schéma**, que `032` lui-même déclare révisable
> (§1.2). `docs/028` D-09 exige la convergence **vers `Ecodume`** sans écrire la
> chaîne. La question est donc : **`ecodume` ou `enfants-ecodume` ?** Et, si
> `ecodume` est retenu, **le département de D-07 et l'historique sont-ils une seule
> ligne ou deux ?** (§7, **Q-NT1** et **Q-NT2**).

### 2.2.4 M-A3 — Les slugs de contenu : 3 slugs, et un conflit avec D-20

Le mot `ecodim` apparaît dans **3 identifiants d'URL publiques** :

```text
events.slug        : rencontre-ecodim
publications.slug  : annonce-rentree-de-l-ecodim
publications.slug  : vie-de-l-ecodim-en-images
```

**Conflit à signaler, non tranché :**

- **D-09** exige que « les anciennes occurrences » convergent et qu'on « ne
  maintienne pas deux terminologies concurrentes » ;
- **D-20** exige que `ARCHIVED` reste consultable « **URL existante** ».

Renommer ces 3 slugs **change des URL publiques** et **brise des liens déjà
diffusés**. Les conserver laisse 3 occurrences d'`Ecodim` dans l'espace d'URL.

**Lecture recommandée, présentée comme telle :** D-09 vise l'**identifiant métier**
du **département** (« identifiant métier · slug ») ; un slug d'événement ou de
publication est un identifiant **de contenu**, dont la stabilité est protégée par
D-20. Mais ce n'est **pas écrit** dans `028` → **non tranché** (§7, **Q-NT2-bis**).

### 2.2.5 M-A5 — Le code applicatif : la liste exhaustive des emplacements

**100 occurrences sur 97 lignes, dans 23 fichiers** (mesuré hors `node_modules`,
hors `docs/`) :

| Fichier | Occ. | Nature |
| --- | --- | --- |
| `backend/src/infrastructure/database/seed-data.ts` | **26** | Données de démonstration : `site.ecodimFoundedAt`, `scheduleEntries[].title`, `departments[].name/description/responsibleName/meetingSchedule`, `events[].title/description/location/practicalInfo`, `publications[].title/body`, `leaders[].name/scope/bio`, `testimonies[].quote`, `communityFaces[].caption`, `socialLinks[].href` |
| `backend/src/modules/settings/setting.schema.ts` | 1 | **`ALLOWED_SETTING_KEYS`** : `"site.ecodimFoundedAt"` |
| `backend/openapi.yaml` | 1 | Description de l'objet de réglages (liste des 15 clés) |
| `backend/openapi.json` | 1 | Idem |
| `frontend/src/data/mock/site.ts` | **7** | `ecodimFoundedAt`, `scheduleChildren`, 2 href de réseaux sociaux, `weeklyRhythm[].title` |
| `frontend/src/data/mock/events.ts` | **7** | `excerpt`, `title`, `slug`, `description`, `location`, `departmentId: "dep-ecodim"`, `practicalInfo` |
| `frontend/src/data/mock/departments.ts` | **6** | `id`, `name`, `slug: "enfants-ecodim"`, `description`, `responsibleName`, `meetingSchedule` |
| `frontend/src/data/mock/publications.ts` | **5** | 2 titres + 2 slugs + 1 corps |
| `frontend/src/data/mock/leaders.ts` | 3 | `name`, `scope`, `bio` |
| `frontend/src/data/mock/images.ts` | 2 | Commentaire + **clé `ecodim`** (`/media/ccjv-13.jpeg`) |
| `frontend/src/data/mock/site.ts` (social) | — | *(compté ci-dessus)* |
| `frontend/src/data/mock/community.ts` | 1 | `caption` |
| `frontend/src/data/mock/testimonies.ts` | 1 | `quote` |
| `frontend/src/README.md` | 1 | Table des routes |
| `frontend/src/app/qui-sommes-nous/page.tsx` | **7** | Jalon « Naissance de l'Ecodim », `images.ecodim`, `alt`, prose, repère horaire |
| `frontend/src/app/vie-de-leglise/faire-un-don/page.tsx` | **5** | `impactDomains[0].title`, `images.ecodim`, prose, `givingMethods` |
| `frontend/src/app/communaute/parcours-nouveau/page.tsx` | 4 | prose, carte, `images.ecodim`, `alt` |
| `frontend/src/app/organisation/DepartmentModal.tsx` | **4** | `hash === "ecodim"` et `d.slug.includes("ecodim")` — **alias d'ancre** |
| `frontend/src/app/organisation/OrganisationExplorer.tsx` | **4** | Commentaire + `dept.slug === "enfants-ecodim" && <div id="ecodim">` — **alias d'ancre** |
| `frontend/src/components/layout/Footer.tsx` | **4** | `href="/organisation#enfants-ecodim"`, libellé « · Ecodim (Enfants) », 2 href de réseaux sociaux |
| `frontend/src/app/organisation/page.tsx` | 3 | `images.ecodim`, `alt`, surimpression « Ecodim » |
| `frontend/src/app/vie-de-leglise/evenements/page.tsx` | 3 | Libellé de rythme, commentaire, `alt` |
| `frontend/src/app/vie-de-leglise/ou-nous-trouver/page.tsx` | 3 | Prose, commentaire, libellé « Enfants · Ecodim » |
| `frontend/src/app/communaute/parcours-nouveau` *(supra)* | — | — |
| **Total** | **100** | **23 fichiers** |

**Les 5 emplacements qui décident de l'ordre d'exécution (§2.2.6) :**

```text
frontend/src/app/organisation/OrganisationExplorer.tsx:41
    {dept.slug === "enfants-ecodim" && <div id="ecodim" className="scroll-mt-28" />}

frontend/src/app/organisation/DepartmentModal.tsx:43
    (hash === "ecodim" && d.slug.includes("ecodim"))

frontend/src/components/layout/Footer.tsx:43
    <Link href="/organisation#enfants-ecodim">· Ecodim (Enfants)</Link>

frontend/src/data/mock/departments.ts:37         slug: "enfants-ecodim"
backend/src/modules/settings/setting.schema.ts:20 "site.ecodimFoundedAt"
```

> `docs/audit/audit_architecture_editoriale_frontend.md:838` l'avait déjà relevé :
> « **Le code connaît trois slugs en dur.** Renommer un slug depuis le Back-Office
> **casserait ces ancres en silence.** Conséquence pour le modèle : `slug` doit
> rester réservé à l'Admin. » C'est **exactement** le risque de M-A1, et c'est
> pourquoi l'ordre de §3 est contraint.

### 2.2.6 L'ordre obligatoire : code d'abord, données ensuite

Le renommage **ne peut pas** se faire en une seule fois. Trois déploiements :

```text
Déploiement N     → le code tolère LES DEUX : ancien slug ET nouveau slug.
                    (alias de résolution d'ancre, lien de pied de page valide
                     dans les deux cas, ALLOWED_SETTING_KEYS acceptant les
                     deux clés de réglage le temps de la transition)
        ↓
Migration données  → departments.slug, departments.name, textes, clé de réglage
        ↓
Déploiement N+1   → le code ne connaît plus QUE le nouveau vocabulaire ;
                    les alias et les clés hérités sont retirés
```

**Pourquoi cet ordre et pas l'inverse :** si les données changent d'abord, alors
entre le `COMMIT` et le déploiement du frontend, l'ancre `#enfants-ecodim` du
`Footer` **ne résout plus** et la modale département **ne s'ouvre plus** pour le
visiteur. **Aucune interruption de service n'est nécessaire**, à condition de
respecter cet ordre.

**Retour arrière :** à tout instant avant le déploiement N+1, un `UPDATE` inverse
sur `departments.slug`/`name` suffit — le code déployé acceptant encore l'ancien
vocabulaire.

## 2.3 M-B1 → M-B3 — Migration de l'énumération des rôles (D-05)

### 2.3.1 Le rappel normatif : un enum PostgreSQL ne se modifie pas par `UPDATE`

**`docs/032` §2.1 l'énonce :** `ALTER TYPE … ADD VALUE` est la seule évolution
**non destructive**. **Retirer**, **renommer** ou **réordonner** une valeur exige la
**reconstruction du type** :

```sql
ALTER TYPE   x RENAME TO x_old;
CREATE TYPE  x AS ENUM (… nouvelles valeurs …);
ALTER TABLE  t ALTER COLUMN c TYPE x USING c::text::x;   -- échoue si une valeur a disparu
DROP TYPE    x_old;
```

**Conséquence :** `ROLE_ADMIN` **disparaît** de `admin_role`. Un
`UPDATE admin_profiles SET role = 'ADMIN'` est **impossible** avant la
reconstruction — la valeur `'ADMIN'` n'existe pas encore dans le type.
**Et un `UPDATE` ne convertit jamais un type : il ne fait que choisir une valeur
existante.** C'est la confusion à éviter.

### 2.3.2 La séquence exacte, en cinq temps

**État de départ vérifié :** 1 ligne, `role = 'ROLE_ADMIN'`, colonne
`DEFAULT 'ROLE_ADMIN'::admin_role NOT NULL`, index `admin_profiles_role_idx`.

**Trois pièges identifiés, chacun vérifié dans le schéma en place :**

1. **Le `DEFAULT` hérité.** La colonne porte `DEFAULT 'ROLE_ADMIN' NOT NULL`
   (`0000_elite_pretty_boy.sql:11`). Après `ALTER TYPE admin_role RENAME TO
   admin_role_old`, ce `DEFAULT` est toujours typé `admin_role_old` :
   `ALTER COLUMN … TYPE admin_role` échouera avec
   *« default for column "role" cannot be cast automatically to type admin_role »*.
   → **Il faut `DROP DEFAULT` avant la conversion.** Le schéma cible
   (`032` §3.3) ne prévoit **aucun** défaut sur `role` : il n'est donc **pas**
   reposé.
2. **L'ordre `UPDATE` / `ALTER COLUMN TYPE`.** L'ordre correct est
   `DROP DEFAULT → ALTER COLUMN TYPE … USING (CASE …)`. Le `CASE` mappe **toutes**
   les valeurs existantes vers une valeur survivante, ce qui évite l'échec de
   conversion.
3. **Le `CHECK` de cohérence (`032` §3.3).** Il exige que
   `role = 'DEPARTMENT_MANAGER'` porte `scope = 'DEPARTMENT'` **et**
   `department_id` non nul, et que tout autre rôle porte `scope = 'GLOBAL'` et
   `department_id` **nul**. Il ne peut donc être posé **qu'après** que `scope` et
   `department_id` sont renseignés — sinon il refuse la ligne existante.

**Séquence :**

```text
Temps 1  CREATE TYPE admin_scope AS ENUM ('GLOBAL','DEPARTMENT');
         ALTER TABLE admin_profiles ADD COLUMN scope admin_scope;          -- NULLABLE
         ALTER TABLE admin_profiles ADD COLUMN department_id uuid;         -- NULLABLE
                          → ADDITIF, aucun effet sur le code en service.

Temps 2  ALTER TABLE admin_profiles
           ALTER COLUMN role DROP DEFAULT;                                  -- PIÈGE 1
         ALTER TYPE admin_role RENAME TO admin_role_old;
         CREATE TYPE admin_role AS ENUM
           ('SUPER_ADMIN','ADMIN','DEPARTMENT_MANAGER');
         ALTER TABLE admin_profiles
           ALTER COLUMN role TYPE admin_role
             USING (CASE role::text
                      WHEN 'ROLE_ADMIN' THEN 'ADMIN'      -- D-05 : le compte existant
                      ELSE role::text                     -- aucune autre valeur possible
                    END)::admin_role;
         DROP TYPE admin_role_old;
                          → DESTRUCTIF (le type) mais AUCUNE ligne perdue : la
                            conversion mappe 100 % des valeurs existantes.

Temps 3  UPDATE admin_profiles SET scope = 'GLOBAL'
          WHERE scope IS NULL;                                              -- D-05
         -- department_id reste NULL : le compte devient ADMIN, non responsable.
         ALTER TABLE admin_profiles
           ALTER COLUMN scope SET NOT NULL,
           ALTER TABLE admin_profiles
           ADD CONSTRAINT admin_profiles_scope_coherence CHECK (…);         -- PIÈGE 3
                          → BLOQUANT : le CHECK échoue si une ligne n'est pas
                            conforme. Vérification en §5.3.

Temps 4  (M-B2) Créer le compte SUPER_ADMIN distinct :
           1 compte Supabase Auth + 1 ligne admin_profiles
             (role='SUPER_ADMIN', scope='GLOBAL', department_id NULL).
                          → ADDITIF. Mais identité du titulaire NON TRANCHÉE
                            (§7, Q-NT3).

Temps 5  Des responsables DEPARTMENT_MANAGER sont créés — chacun avec
         scope='DEPARTMENT' et department_id NON NUL (D-02).
                          → ADDITIF. Nombre et identités NON TRANCHÉS
                            (029 R-03).
```

**Vérification obligatoire avant le temps 2 :**
`select count(*) from admin_profiles where role::text not in ('ROLE_ADMIN')` doit
valoir **0** (sinon la reconstruction échouerait sur une valeur non mappée).

**Porte de sortie :** voir §4.3.1 — elle **disparaît** dès qu'un compte
`SUPER_ADMIN` ou `DEPARTMENT_MANAGER` a été créé.

### 2.3.3 Ce que la production peut contenir de plus

En production, `admin_profiles` peut contenir **plus d'une** ligne (aucun document
ne fixe leur nombre — `029` R-03 le dit explicitement). La séquence est **la même**,
mais :

- le comptage avant/après (§5.1) porte sur **le nombre de comptes** ;
- **chaque** ligne doit être convertie ; D-05 ne désigne comme `ADMIN` que
  **« le compte administrateur déjà créé »** — au singulier. **Si la production en
  contient plusieurs, l'attribution des rôles n'est pas tranchée** (§7, **Q-NT4**).

## 2.4 M-C1 — Départements historiques : conservation, pas suppression (D-08)

**Rappel de D-08 :** « `Adultes`, `Enfants/Ecodim` et `Chorale` — auxquels sont
rattachés 7 événements et 10 publications — **ne doivent pas être supprimés
brutalement**. La migration doit prévoir une **stratégie de conservation et de
rattachement** avant toute suppression éventuelle. Aucun événement ni publication
ne doit disparaître du fait du changement de modèle. »

### 2.4.1 Ce que devient chaque département

| Département | Décision retenue | Justification |
| --- | --- | --- |
| **`Adultes`** | **CONSERVÉ tel quel.** Aucun renommage, aucune fusion. | D-08 le nomme explicitement comme à conserver ; aucune décision de D-01 → D-26 ne le renomme ni ne le fusionne. D-07 dit qu'« aucun autre département n'est figé sans décision métier explicite » — ce qui vaut aussi pour sa **disparition**. |
| **`Enfants / Ecodim`** | **CONSERVÉ, renommé** `Ecodume` (M-A1). Le **rattachement** des 1 événement, 1 responsable et 6 médias est **inchangé**. | D-08 (conservation) + D-09 (renommage). Le renommage ne touche **aucun** rattachement. |
| **`Chorale`** | **CONSERVÉ tel quel.** Aucun renommage. | D-08. Aucune décision ne la renomme. |

**Forme retenue :** les trois lignes restent des **lignes ordinaires** de
`public.departments`. **Aucune table d'archive, aucune colonne `deleted_at`,
aucune colonne `is_active`** — `docs/032` §6.2 et §6.4 l'écrivent avec raison :
`028/Q-B3` (« un département peut-il être désactivé sans être supprimé ? »)
**n'est pas tranchée** ; créer `is_active` serait inventer une décision (§7,
**Q-S3**).

**Les départements de D-07 (`Presse`, `Ecodume`, `Affaires Sociales`) n'existent pas
en base.** Leur création est **hors de cette migration** : ce sont des créations de
contenu, pas des migrations de données. Le seul point d'articulation est le
risque d'homonymie de §2.2.1 (**Q-NT1**).

### 2.4.2 Ce que devient chaque rattachement

| Rattachement | Volume | Devient | Traitement |
| --- | --- | --- | --- |
| `events.department_id` → Adultes | **2** | **inchangé** | Aucune écriture. `events.department_id` est conservé, puis contraint (M-C3). |
| `events.department_id` → Chorale | **2** | **inchangé** | Idem. |
| `events.department_id` → Enfants/Ecodim | **1** | **inchangé** (le département a seulement changé de nom) | Idem. |
| `events.department_id = NULL` | **2** | **rattaché** — décision requise | **M-C2**, §2.6. |
| `leaders.department_id` | 3 rattachés + **2 `NULL`** | **inchangé** | `leaders.department_id` reste `ON DELETE SET NULL` (`032` §1.5) : un responsable peut être institutionnel. `Pasteur Manasse Mwamba` et `Responsable — Accueil` restent à `NULL` — **c'est conforme**. |
| `department_media` | **18** (3 × 6) | **inchangé** | Aucune écriture. FK `ON DELETE RESTRICT` sur `media_id` conservée. |
| `publications.department_id` | **10 à créer** | **à créer** | **M-D3**, §2.7. |
| `media.uploaded_by` | **0** | inchangé | Aucune ligne `media` n'a d'auteur (`uploaded_by` nul sur les 28). |

**Interdiction absolue de ce plan : aucun `DELETE` sur `departments`.** `docs/032`
§6.2 en donne la vérification : `SELECT count(*) FROM departments WHERE slug IN
('adultes','ecodume','chorale')` doit valoir **3**. Et après M-C3/M-D3, la règle
`ON DELETE RESTRICT` rendra toute suppression ultérieure **impossible** tant qu'un
événement ou une publication rattaché subsiste — c'est le comportement **voulu** par
D-08.

### 2.4.3 L'ordre : conservation d'abord, contraintes ensuite

**La contrainte `RESTRICT` ne peut pas être posée avant que les rattachements
soient complets et corrects.** Inversez l'ordre et :
`ALTER TABLE events ADD CONSTRAINT … ON DELETE RESTRICT` réussit (il ne valide pas
les données), mais le **premier** `SET NOT NULL` échoue sur les 2 lignes à `NULL`.
Pire : si `SET NOT NULL` est posé avant `RESTRICT`, une suppression de département
ultérieure **recréerait** des `NULL` et violerait la contrainte.

**Ordre retenu :** `DONNÉES (M-C2, M-D3) → FK RESTRICT (M-C3 partie FK) →
NOT NULL (M-C3 partie NOT NULL) → contrainte des 3 (M-D4) → trigger (M-D6)`.

## 2.5 M-C4 — Ajout de `visibility_scope` (D-26)

**Rappel de D-26 :**

```text
Event
 ├── department_id     = PRESSE      (qui en est responsable)
 └── visibility_scope  = GLOBAL      (qui est concerné)
```

> « La portée est **dérivée de la capacité du département** (D-25) : ce que publie
> la Presse concerne tout le monde ; ce que publie l'Ecodume reste un événement de
> l'Ecodume. »

### 2.5.1 Quelle valeur par défaut pour l'existant — et pourquoi la déduction est impossible aujourd'hui

**Réponse : `DEPARTMENT` pour les 7 lignes.** Et la raison est plus forte qu'un
choix de confort :

| Élément | État vérifié | Conséquence |
| --- | --- | --- |
| `department_capabilities` | **n'existe pas** | Aucun département ne détient `EVENT_SCOPE_GLOBAL`. |
| `Presse` | **n'existe pas** en base | Le cas d'usage de D-26 (« la Presse est responsable, l'événement concerne toute l'église ») **ne s'applique à aucune ligne existante**. |
| Qui édite les capacités | **non tranché** (`029` Q-06, `032` Q-S6) | Nul ne peut légitimement poser une capacité. |
| Trigger `events_visibility_scope_coherence` (`032` §3.5) | à créer | **Refuse** `GLOBAL` si le département ne détient pas la capacité : `RAISE EXCEPTION … check_violation`. |

> **Conclusion : la « déduction depuis le département » n'est pas applicable aux
> données existantes.** La règle de D-26 est *dériver la portée de la capacité du
> département* ; or **aucune capacité n'existe et aucune ne peut être créée sans
> décision**. Poser `GLOBAL` sur une ligne existante serait **inventer** une
> capacité et une portée. Poser `DEPARTMENT` partout est la **seule** valeur qui
> (a) soit le `DEFAULT` du schéma cible, (b) ne requière aucune capacité, (c) ne
> perde aucune information — puisque **l'information de portée n'existe pas
> aujourd'hui** : aucun événement n'a jamais porté de portée.

**La « déduction » est donc à faire *ex post*, et elle est non tranchée :** quand
un département recevra la capacité `EVENT_SCOPE_GLOBAL` (§7 **Q-NT6**), faudra-t-il
basculer rétroactivement ses événements en `GLOBAL` ? **Aucune décision ne le dit.**
Le §7 porte ce point.

### 2.5.2 La séquence

```text
Temps 1  CREATE TYPE event_visibility_scope AS ENUM ('DEPARTMENT','GLOBAL');
Temps 2  CREATE TABLE department_capabilities (…);        -- vide
Temps 3  ALTER TABLE events
           ADD COLUMN visibility_scope event_visibility_scope
             NOT NULL DEFAULT 'DEPARTMENT';
                          → ADDITIF : les 7 lignes existantes deviennent
                            'DEPARTMENT' sans écriture explicite, et le DEFAULT
                            reste sur la colonne (032 §3.5).
Temps 4  Créer le trigger events_visibility_scope_coherence.
                          → ADDITIF. Il ne rejette rien : aucune ligne n'est GLOBAL.
Temps 5  (différé, hors migration) Attribution d'une capacité
           EVENT_SCOPE_GLOBAL à un département — DÉCISION MÉTIER REQUISE.
                          → Tant qu'elle n'a pas lieu, aucun événement ne peut
                            devenir GLOBAL : c'est le comportement voulu par D-25.
```

**Vérification :** `select visibility_scope, count(*) from events group by 1` doit
rendre `DEPARTMENT | 7`.

**Retour arrière :** `DROP COLUMN visibility_scope` + `DROP TRIGGER` +
`DROP TYPE` — **totalement réversible**, la colonne n'ayant porté aucune
information préexistante.

## 2.6 M-C2 + M-C3 — `Event.department_id` NOT NULL (D-26)

**Rappel de D-26 :** « `Event.department_id` reste **obligatoire**. Un événement
global au sens d'un `department_id = NULL` **n'existe pas** : on ne perd jamais
l'information du responsable. »

**État vérifié :** **2 événements sur 7** sont à `NULL` — `Journée communautaire`
(2026-09-22) et `Culte spécial — Action de grâce` (2026-10-22). Et la FK est
aujourd'hui `ON DELETE SET NULL`, c'est-à-dire la règle qui **fabrique** l'état
interdit (`032` §1.5).

### 2.6.1 Le rattachement des 2 événements : **à trancher**

`docs/032` §6.3.1 liste trois options — **aucune n'est appliquée d'office** :

| Option | Contenu | Ce qu'elle fait |
| --- | --- | --- |
| **O-A** | Créer un département institutionnel (`slug: 'vie-de-leglise'`) portant les événements de toute l'église. | Respecte D-26 (un responsable identifié) mais **ajoute un département que D-07 n'autorise pas** (« aucun autre département n'est figé sans décision métier explicite »). |
| **O-B** | Rattachrer les 2 événements à **Presse** avec `visibility_scope = 'GLOBAL'`. | C'est **littéralement** le cas d'usage de D-26 — mais **Presse n'existe pas encore**, la capacité `EVENT_SCOPE_GLOBAL` non plus, et cela suppose que la Presse assume rétroactivement des événements qu'elle n'a pas créés. |
| **O-C** | Rattacher chaque événement au département dont le sujet est le plus proche — le culte dominical relevant d'`Adultes`. | Cohérent avec les 2 cultes dominicaux déjà rattachés à `Adultes` ; laisse toutefois `Journée communautaire` **sans rattachement naturel**. |

> **Point à trancher — non fixé par `docs/028`.** D-26 **interdit** `NULL` et
> **exige** un responsable identifié, mais **ne dit pas lequel**. La migration doit
> donc être **bloquante** ici : elle **ne peut pas** être exécutée sans décision
> (§7, **Q-S2**).

### 2.6.2 La séquence exacte

```text
Prérequis  Q-S2 TRANCHÉ : les 2 identifiants de département cibles sont connus.

Étape 1   Consigner l'état AVANT (traçabilité, §4.2) :
            SELECT id, title, department_id FROM events ORDER BY event_date;
            → 7 lignes, dont 2 à NULL. Copie hors base.

Étape 2   Rattacher les 2 lignes (M-C2) — AUCUNE n'est supprimée :
            UPDATE public.events
            SET    department_id = <cible Q-S2>, updated_at = now()
            WHERE  department_id IS NULL;
            → attendu : UPDATE 2.

Étape 3   VÉRIFICATION BLOQUANTE — sans elle, tout ce qui suit échoue :
            SELECT count(*) FROM public.events WHERE department_id IS NULL;
            → DOIT valoir 0. Toute autre valeur = ARRÊT de la migration.

Étape 4   Remplacer la règle de suppression (partie FK de M-C3) :
            ALTER TABLE public.events
              DROP CONSTRAINT events_department_id_departments_id_fk;
            ALTER TABLE public.events
              ADD CONSTRAINT events_department_id_departments_id_fk
              FOREIGN KEY (department_id) REFERENCES public.departments (id)
              ON DELETE RESTRICT;
            → DESTRUCTIF en capacité : la suppression d'un département portant
              un événement devient impossible. C'est VOULU par D-08 + D-26.

Étape 5   Poser l'obligation (partie NOT NULL de M-C3) :
            ALTER TABLE public.events
              ALTER COLUMN department_id SET NOT NULL;
            → BLOQUANT : échoue si l'étape 3 n'a pas rendu 0.
            → Verrou ACCESS EXCLUSIVE bref ; sur 7 lignes, instantané.

Étape 6   Le code doit désormais fournir un department_id à la création
          (EventPolicy.assertDepartmentRequired, D-26 ; 032 §4.4).
            → DÉPLOIEMENT associé, voir §6.3.
```

**Pourquoi les étapes 4 et 5 dans cet ordre :** poser `NOT NULL` **avant** de
remplacer la FK laisserait subsister `ON DELETE SET NULL` — un
`DELETE FROM departments` ultérieur **violerait** alors `NOT NULL` (erreur), mais
le schéma aurait entre-temps affirmé une règle (`SET NULL`) que D-26 déclare
inexistante. L'ordre **4 puis 5** ne laisse jamais le schéma dans un état
contradictoire.

**Porte de sortie :** §4.3.2 — structurellement réversible, **informationnellement
non** (l'information « était `NULL` » n'existe plus que dans la sauvegarde).

## 2.7 M-D1 → M-D6 — Publications : `ARCHIVED`, `archived_at`, et la règle des 3

**Rappel de D-18 :**

| Mécanisme | Déclencheur |
| --- | --- |
| **Automatique** | Règle des trois publications |
| **Manuel** | Action volontaire de l'`ADMIN` ou du responsable du département |

> « `PUBLISHED → ARCHIVED` est **irréversible** : une publication archivée ne
> redevient pas automatiquement `PUBLISHED`. **Formulation retenue :** *maximum 3
> `PUBLISHED` par département, mais potentiellement moins.* La règle des trois est
> une **garantie maximale**, pas une obligation de maintenir trois publications
> visibles. »

**Rappel de D-19 :** `ORDER BY published_at ASC, id ASC`.
**Rappel de D-20 :** `ARCHIVED` est un **état métier persistant**, pas une
suppression ; les archives **restent publiques**.

### 2.7.1 M-D1 — `ARCHIVED` : un `ALTER TYPE … ADD VALUE` avec **une contrainte de transaction**

**Ajouter une valeur à une énumération est non destructif.** Mais il y a **un piège
d'exécution majeur**, et il est décisif ici :

> **Depuis PostgreSQL 12, `ALTER TYPE … ADD VALUE` peut s'exécuter dans un bloc de
> transaction, mais la valeur ajoutée NE PEUT PAS être utilisée dans la même
> transaction.** Toute tentative produit :
> `ERROR: unsafe use of new value "ARCHIVED" of enum type publication_status`.

**Conséquence opérationnelle, non négociable :**

```text
Migration N    ALTER TYPE publication_status ADD VALUE 'ARCHIVED';
               → SEULE instruction de la migration. COMMIT.
                  La valeur existe, aucune ligne ne l'utilise.

Migration N+1  (M-D5) l'archivage des lignes peut alors écrire 'ARCHIVED'.
```

Une migration qui ferait `ADD VALUE 'ARCHIVED'` **puis** `UPDATE … SET status =
'ARCHIVED'` dans le **même** fichier échouerait. `drizzle-kit` génère un fichier par
`db:generate` : il faut donc **deux** migrations successives, ou un `COMMIT`
explicite entre les deux instructions si le runner ne les enveloppe pas — le
`migrate.ts` du dépôt applique les migrations Drizzle **une par une, chacune dans sa
transaction**. Le découpage en deux migrations est donc la forme correcte.

### 2.7.2 M-D2 / M-D3 — `archived_at` et `department_id`

```text
Étape 1  ALTER TABLE public.publications ADD COLUMN archived_at timestamptz;
                          → ADDITIF : 10 lignes à NULL. Aucune écriture invalide.
                          → Le CHECK de cohérence n'est PAS posé ici.

Étape 2  ALTER TABLE public.publications ADD COLUMN department_id uuid;
         ALTER TABLE public.publications
           ADD CONSTRAINT publications_department_id_fk
           FOREIGN KEY (department_id) REFERENCES public.departments (id)
           ON DELETE RESTRICT;
                          → ADDITIF : 10 lignes à NULL. La colonne est NULLABLE
                            à ce stade, volontairement.

Étape 3  (Q-S1 tranché) Renseigner les 10 lignes — M-D3.
                          → VÉRIFICATION BLOQUANTE :
                            SELECT count(*) FROM publications
                             WHERE department_id IS NULL;   → DOIT valoir 0.

Étape 4  ALTER TABLE public.publications
           ALTER COLUMN department_id SET NOT NULL;
                          → BLOQUANT. Échoue si l'étape 3 n'a pas rendu 0.

Étape 5  ALTER TABLE public.publications
           ADD CONSTRAINT publications_archived_at_coherence
           CHECK ((status = 'ARCHIVED') = (archived_at IS NOT NULL));
                          → ADDITIF à ce stade : 10 lignes en PUBLISHED avec
                            archived_at NULL ⇒ la contrainte est satisfaite.
                          → MAIS elle doit être posée AVANT M-D5, sinon M-D5
                            serait la première à pouvoir la violer.
```

**Pourquoi `department_id` est `NOT NULL` :** sans elle, **la règle des 3 est
inévaluable** — elle s'énonce « par département ». `docs/032` §3.6 et §4.1.4 le
disent. Aucune alternative ne permet de l'éviter.

### 2.7.3 M-D4 + M-D5 — **Le point que la mission demande de traiter : 10 `PUBLISHED`**

#### L'énoncé du problème

**Vérifié (§1.4) :** les **10 publications sont toutes `PUBLISHED`** et **aucune
n'est rattachée** — la colonne n'existe pas. Dès que M-D3 attribue un département à
chacune, la règle de D-18 devient **applicable** — et son application à l'existant
est **une question ouverte**.

#### Première constatation, purement arithmétique

La règle « maximum 3 `PUBLISHED` **par département** » impose, pour loger **10**
publications publiées : ⌈10 / 3⌉ = **4 départements**.

**Or il n'existe que 3 départements** en base (`Adultes`, `Enfants / Ecodim`,
`Chorale`), soit une capacité maximale de **9** `PUBLISHED`.

> **Conséquence directe : avec les 3 seuls départements existants, au moins UNE
> publication doit quitter `PUBLISHED` — et cette sortie est IRRÉVERSIBLE (D-18).**
> Le seul moyen d'éviter cet archivage est de **créer d'abord** au moins un
> quatrième département — ce que D-07 autorise (`Presse`, `Ecodume`,
> `Affaires Sociales`) mais qui n'est pas de la migration de données, c'est de la
> création de contenu.

#### Deuxième constatation : la portée de la règle change tout

`028/Q-P3` — « La règle des 3 s'applique-t-elle par département, ou par département
**+ type** ? » — **n'est pas tranchée** (`docs/032` §4.1.4 et Q-S10 le redonnent
comme tel). Or elle **décide** du volume archivé :

| Lecture de Q-P3 | Contrainte | Capacité minimale pour loger les 10 | Archivage nécessaire ? |
| --- | --- | --- | --- |
| **par `department_id` seul** (forme écrite par `032` §4.1.1) | `(department_id, published_slot)` | **⌈10/3⌉ = 4 départements** | **OUI, ≥ 1 ligne** — puisque seuls 3 départements existent |
| **par `(department_id, type)`** | `(department_id, type, published_slot)` | Répartition réelle : MEDIA **4**, ACTUALITE 2, ENSEIGNEMENT 2, RESSOURCE 2 → répartir les 4 `PHOTO`/MEDIA sur 2 départements suffit ⇒ **2 départements** | **NON** — 3 départements suffisent |

> **La question Q-P3 n'est donc pas théorique : elle détermine si une publication
> doit être archivée définitivement ou non.** C'est le point le plus lourd de tout
> ce plan.

#### Troisième constatation : la contrainte déclarative est incompatible avec l'état actuel

`docs/032` §4.1.1 retient un **index unique partiel** :

```sql
CREATE UNIQUE INDEX publications_max_three_published_per_department
  ON public.publications (department_id, published_slot)
  WHERE status = 'PUBLISHED';
```

avec `published_slot` ∈ {1,2,3} et un `CHECK` de bornage. **Cet index ne peut pas
être créé** tant qu'un département porte plus de 3 `PUBLISHED` :

- sous la lecture « par département », dès que 4 des 10 publications sont
  attribuées au **même** département, la création de l'index **échoue** ;
- sous la lecture « par département + type », la contrainte porte sur
  `(department_id, type, published_slot)`, et l'échec n'a lieu que si un même
  `(département, type)` dépasse 3 — ce que la répartition de MEDIA (`4`) peut
  provoquer si les 4 revues sont dans le même département.

> **C'est la contrainte structurante de l'ordre d'exécution (§3) :** *toutes les
> contraintes de conformité sont posées APRÈS la migration des données, jamais
> avant.* Ici, cela veut dire : `department_id` → rattachement → **puis** (et
> seulement si le compte est conforme) `published_slot` + index unique.

#### Que fait-on des 10 publications ? — Les options, et le choix à faire

**Ce que `docs/028` fixe :** la règle est un **maximum**, pas une obligation ; le
départage est `published_at ASC, id ASC` (D-19) ; l'archivage est **irréversible**
(D-18) ; `ARCHIVED` **reste consultable** (D-20).

**Ce que `docs/028` ne fixe pas :**

1. **La règle s'applique-t-elle rétroactivement** aux publications déjà
   `PUBLISHED` au moment de la migration ? **Non tranché.**
2. **Si oui, lesquelles archiver ?** D-19 donne le **critère** (`published_at ASC`)
   mais D-18 ne dit **pas ce qui arrive** aux autres publications lors d'une
   4ᵉ publication. `docs/032` §4.1.2 le dit explicitement : *« Publier une 4ᵉ
   publication peut : (a) archiver une seule publication, (b) archiver toutes les
   précédentes, ou (c) être refusé. Aucune de ces trois lectures n'est écrite dans
   028. »*
3. **Laquelle des deux publications simultanées** est archivée (`029` R-02,
   `032` Q-S9). Sans objet ici (aucune écriture concurrente pendant la migration),
   mais bloquant pour l'application.

**Options, listées pour que la décision soit prise en connaissance de cause :**

| Option | Contenu | Effet | Réversibilité |
| --- | --- | --- | --- |
| **R-A — archivage rétroactif minimal** | Après rattachement, pour chaque département dépassant la borne : ne conserver que les 3 `PUBLISHED` les plus **récentes** (`ORDER BY published_at ASC, id ASC`, donc archiver les plus **anciennes**), archiver le reste avec `archived_at = now()`. | Respecte D-18 et D-19 à la lettre. **≥ 1 ligne** archivée dans tous les cas si la borne est « par département » et qu'il n'y a que 3 départements. | **AUCUNE** — D-18 rend `PUBLISHED → ARCHIVED` irréversible. Sortie = restauration complète (§4.3.3). |
| **R-B — pas d'archivage rétroactif** | Renseigner `department_id` **et** ne rien archiver. La contrainte déclarative (M-D4) est alors **impossible à poser** ; elle est reportée jusqu'à ce que des archivages manuels aient ramené les comptes sous la borne. | **Aucune donnée perdue.** La borne des 3 n'est pas garantie par la base pendant la période de transition — elle reste garantie par l'application. | **TOTALE** tant que M-D4 n'est pas posé. |
| **R-C — création préalable de départements** | Créer au moins un 4ᵉ département (D-07 : `Presse`) **avant** le rattachement, et répartir les 10 publications de sorte qu'aucun département ne dépasse 3 (3+3+3+1 = 10). | **Aucun archivage rétroactif nécessaire** ; la contrainte est posable immédiatement. | **TOTALE** (création de contenu, non destructive). |
| **R-D — Q-P3 tranché « par département + type »** | La borne devient 3 par `(département, type)`. | Avec 3 départements, la répartition actuelle **tient** : les 4 MEDIA se répartissent 3+1. **Aucun archivage nécessaire.** | **TOTALE**. |

> **Recommandation, présentée comme telle et non comme une décision :** l'ordre
> **R-C puis R-D puis R-A** minimise la perte. **R-A ne doit être choisi qu'après
> épuisement des trois autres**, parce que c'est la **seule** opération de tout ce
> plan dont le retour arrière exige une **restauration complète**.

#### La séquence de M-D4/M-D5

```text
Prérequis   Q-S1 tranché  (rattachement des 10)
            Q-P3  tranché  (portée de la règle)
            Décision sur la rétroactivité (R-A / R-B / R-C / R-D)

Étape 1   Consigner l'état AVANT, ligne par ligne (§4.2) :
            SELECT id, title, slug, status, published_at, department_id
            FROM publications ORDER BY published_at, id;
            → 10 lignes. Copie hors base OBLIGATOIRE : c'est le seul témoin
              de l'état antérieur (§4.3.3).

Étape 2   Renseigner department_id sur les 10 lignes (M-D3). Vérifier 0 NULL.

Étape 3   Si R-A ou R-C-préalable : exécuter l'archivage / la répartition.
          Sinon (R-B) : passer directement à l'étape 6.
            → VÉRIFICATION : aucun département ne dépasse la borne retenue.
              Sous la lecture « par département » : count(PUBLISHED) <= 3
              par department_id. Sous « + type » : <= 3 par (department_id, type).

Étape 4   Poser le créneau généré et la contrainte (M-D4) :
            ADD COLUMN published_slot smallint GENERATED ALWAYS AS
              (CASE WHEN status = 'PUBLISHED' THEN 1 ELSE NULL END) STORED;
            ADD CONSTRAINT publications_published_slot_range
              CHECK (published_slot IS NULL OR published_slot BETWEEN 1 AND 3);
            CREATE UNIQUE INDEX publications_max_three_published_per_department …
              → ÉCHOUE si l'étape 3 n'a pas ramené les comptes sous la borne.
                Ce refus EST la vérification.

Étape 5   Poser le trigger d'irréversibilité (M-D6) :
            publications_forbid_unarchive() + publications_status_immutable
              → APRÈS M-D5. Le poser avant empêcherait l'archivage lui-même
                (le trigger refuse toute modification de archived_at une fois
                renseigné — il ne bloque pas la première transition, mais
                l'ordre reste plus sûr et documenté ainsi).

Étape 6   Ajouter les index de service de D-19 (§10.2 de 032) :
            publications_archived_at_idx  (partiel WHERE status='ARCHIVED')
            publications_published_per_department_idx
              (department_id, published_at ASC, id ASC) (partiel PUBLISHED)
              → Ce second index est EXACTEMENT la requête d'archivage de D-19.
```

### 2.7.4 Le cas où une publication est archivée : ce qui est perdu, ce qui ne l'est pas

| Perdu | Conservé |
| --- | --- |
| L'appartenance au **flux courant** des publications. | La **ligne entière** : titre, slug, catégorie, type, corps, couverture, `published_at`. |
| La possibilité de revenir à `PUBLISHED` (D-18, trigger `032` §3.9). | L'**accès public** : `ARCHIVED` reste consultable « archive / recherche / **URL existante** » (D-20). Le schéma n'ajoute **aucune** colonne de visibilité et ne touche pas au `status` en lecture (`032` §4.2). |
| — | La traçabilité : `archived_at` conserve la date de l'archivage. |

**Vérification de non-perte :** `select count(*) from publications` doit valoir
**10** avant et après. L'archivage **change un état, jamais une ligne**.

## 2.8 M-E1 — `requester_contact` : suppression définitive, **avec purge vérifiée** (D-17)

**Rappel de D-17 :** « Le contact est exclu du modèle. Il ne doit survivre **nulle
part** : schéma · DTO · API · migrations finales · réponses · données métier actives.
Les données éventuellement déjà collectées sont traitées en migration de manière à
**ne pas être réintroduites**, avec **purge explicite et vérifiée** si elles
existent réellement en production. »

**État vérifié :** la table `prayer_requests` contient **0 ligne** dans la base
interrogée. `requester_contact` vaut `NULL` sur 0 ligne, non vide sur 0 ligne. **Il
n'y a donc rien à purger ici** — et **rien ne peut être conclu pour la production**.

### 2.8.1 Où `requester_contact` survit aujourd'hui — les 12 emplacements

`docs/029` E-08 en compte **12** ; ils sont **confirmés** par lecture du dépôt :

| # | Emplacement | Ligne |
| --- | --- | --- |
| 1 | Schéma Drizzle | `backend/src/infrastructure/database/schema/prayer-requests.ts:37` |
| 2 | Migration initiale | `backend/drizzle/0000_elite_pretty_boy.sql:180` |
| 3 | Snapshot Drizzle | `backend/drizzle/meta/0000_snapshot.json:1618-1619` |
| 4 | Entité de domaine | `backend/src/domain/entities/index.ts:234` |
| 5 | Contrat de repository | `backend/src/domain/repositories/index.ts:167` |
| 6 | Repository (insertion) | `backend/src/infrastructure/repositories/prayer-request.repository.ts:73` |
| 7 | Repository (lecture) | `backend/src/infrastructure/repositories/prayer-request.repository.ts:114` |
| 8 | DTO / sérialiseur | `backend/src/modules/prayer-requests/prayer-request.serializer.ts:28, 48` |
| 9 | Schéma Zod de validation | `backend/src/modules/prayer-requests/prayer-request.schema.ts:63` |
| 10 | Liste rouge de journalisation | `backend/src/infrastructure/logger/index.ts:28` |
| 11 | Document OpenAPI (généré) | `backend/src/presentation/openapi/document.ts:1220, 1234` |
| 12 | Contrat OpenAPI publié | `backend/openapi.yaml:541, 559, 3751` · `backend/openapi.json:763, 786, 5548` |

> **Le n° 10 est le plus important et le plus piégeux.** `logger/index.ts:28` liste
> `"requesterContact"` dans les **chemins à masquer**. Retirer la colonne **sans
> retirer cette entrée** laisserait, dans le code, la **seule trace textuelle** du
> champ interdit. D-17 dit « nulle part » : **cette entrée doit disparaître aussi.**

### 2.8.2 La procédure de purge vérifiée — les 7 contrôles

**Principe énoncé sans détour :** `UPDATE prayer_requests SET requester_contact =
NULL` **n'est pas une purge**. La valeur reste dans les *dead tuples* jusqu'au
`VACUUM`, dans le WAL, et dans toute sauvegarde antérieure. **Une purge « vérifiée »
au sens de D-17 exige la disparition de la *colonne* — ou de la *table*.**

`docs/032` §7.2 ligne 16 retient la **suppression de la table entière** :
`public.prayer_requests` est **remplacée** par `prayer_private.prayer_request`. La
colonne disparaît donc **avec** la table — c'est la forme la plus forte de purge.

**Les 7 contrôles, dans l'ordre, chacun avec son critère d'arrêt :**

```text
C1 — INVENTAIRE (sur la base de PRODUCTION, avant toute écriture)
     SELECT count(*)                                                   AS total,
            count(requester_contact)                                   AS contact_not_null,
            count(*) FILTER (WHERE requester_contact IS NOT NULL
                               AND btrim(requester_contact) <> '')     AS contact_non_vide
     FROM public.prayer_requests;
     → Consigner les 3 valeurs. C'est l'état « avant » de la §5.
     → Si total = 0 : C2..C5 sont sans objet, C6/C7 restent obligatoires.

C2 — DÉCISION D'EXPORT (Q-S5, NON TRANCHÉE)
     → Si des lignes existent : le commanditaire doit décider si les données
       doivent être EXPORTÉES hors base avant destruction.
     → D-17 interdit de conserver le CONTACT où que ce soit : un export qui
       contiendrait requester_contact serait une violation de D-17.
       Un export conforme ne peut porter que : id, request_text,
       requester_name, confidentiality, status, handled_at, created_at —
       et sa légitimité reste une décision (Q-S5).

C3 — PURGE EXPLICITE
     Option retenue par 032 : la table est supprimée, donc :
       TRUNCATE public.prayer_requests;
     → TRUNCATE est préféré à DELETE : une seule opération, aucun parcours,
       et la table est vidée ENTIÈREMENT — aucune ligne ne peut être oubliée
       par un prédicat WHERE mal écrit.
     → ATTENTION : TRUNCATE exige un verrou ACCESS EXCLUSIVE. Sur une table
       vide ou minuscule, l'opération est instantanée ; la précaution
       « lock_timeout » de §6.2 s'applique.

C4 — VÉRIFICATION DE PURGE (bloquante)
     SELECT count(*) FROM public.prayer_requests;      → DOIT valoir 0
     → Tant que ce n'est pas 0, la suite est INTERDITE.

C5 — RE-VÉRIFICATION DU CONTACT APRÈS PURGE
     SELECT count(*) FROM public.prayer_requests
      WHERE requester_contact IS NOT NULL;             → DOIT valoir 0
     → Redondant avec C4 sur une table vide, et VOLONTAIREMENT redondant :
       c'est le contrôle que D-17 nomme « purge vérifiée ». Il porte sur le
       champ, pas sur la table.

C6 — SUPPRESSION DE LA COLONNE ET DE LA TABLE
     DROP TABLE public.prayer_requests;
     → Supprime la colonne requester_contact, ses 2 index
       (prayer_requests_created_at_idx, prayer_requests_status_idx), et sa
       ligne dans le snapshot. Aucune FK ne pointait VERS cette table :
       vérifié (aucune contrainte de la base ne la référence).

C7 — VÉRIFICATION D'ABSENCE (globale, non contournable)
     cf. §5.5 : introspection de information_schema sur TOUT le schéma public
     ET le schéma prayer_private, recherche insensible à la casse de
     'contact|phone|telephone|email|mail|whatsapp'.
     → DOIT rendre 0 ligne.
     → Exécuter EN PLUS : pg_dump --schema-only puis recherche de 'contact'.
       C'est le contrôle « nulle part » de D-17 : il couvre le schéma, non
       les seules tables connues.
```

**Résidu assumé, écrit sans détour :** après C6, aucune valeur de contact n'existe
plus **dans la base**. Elle peut subsister dans **(a)** les sauvegardes antérieures
(→ §4.1 : la politique de rétention des sauvegardes doit décider de leur sort),
et **(b)** les journaux du système, s'il en existait — la liste rouge de
`logger/index.ts:28` a précisément pour rôle qu'aucune n'y soit jamais entrée.

## 2.9 M-E2 + M-G1..G4 — Les nouveaux objets de `docs/030` / `docs/032`

### 2.9.1 Ce qui est créé — intégralement additif, 0 ligne de données

| Objet | Schéma | Lignes | Nature |
| --- | --- | --- | --- |
| `prayer_private` (schéma) | — | — | additif |
| `prayer_private.prayer_request` | `prayer_private` | **0** (les 0 lignes de `public.prayer_requests` ne sont **pas** migrées — voir §2.9.2) | additif |
| `prayer_private.data_key_envelope` | `prayer_private` | 0 | additif |
| `prayer_private.crypto_key` | `prayer_private` | 0 | additif |
| `prayer_private.prayer_audit_event` | `prayer_private` | 0 | additif |
| `public.notifications` | `public` | 0 | additif |
| `public.notification_outbox` | `public` | 0 | additif |
| `public.audit_log` | `public` | 0 | additif |
| `public.media_access` | `public` | 0 | additif |
| `public.department_capabilities` | `public` | 0 | additif |

**Ordre de création imposé par les FK (`docs/032` §0.4) :** `crypto_key` **avant**
`data_key_envelope` (l'enveloppe référence `recipient_key_ref`), et
`prayer_request` **avant** `data_key_envelope`.

### 2.9.2 Pourquoi aucune ligne de prière n'est migrée vers le nouveau magasin

**Ce n'est pas un oubli, c'est une impossibilité technique, et elle est écrite dans
`docs/032` §7.2 ligne 16 :**

1. **D-11/D-15 exigent du chiffré.** Le modèle cible stocke
   `message_ciphertext bytea`, `message_nonce bytea`, `message_key_reference text`.
   Un `request_text` en clair **ne peut pas être converti** en chiffré côté serveur :
   le chiffrement est fait **dans le navigateur du visiteur** (`030` §2.3), avec une
   DEK qui n'a jamais existé côté serveur — et les clés publiques des destinataires
   n'existent pas encore.
2. **D-17 interdit de réintroduire le contact.** Une copie de `requester_contact`
   vers le nouveau magasin serait une violation directe.
3. **`030` §3.6.1 interdit toute colonne de contact** dans le nouveau schéma — un
   `CHECK` d'introspection le refuse **structurellement**.

> **Conclusion :** les données de prière existantes ne sont **pas migrées**. Elles
> sont soit **conservées hors base** (décision **Q-S5**, non tranchée), soit
> **détruites** — avec la procédure vérifiée de §2.8.2. **Aucune troisième voie
> n'existe.**

**Ici, la décision est sans objet pratique** : la table est vide (§1.8). En
production, elle ne l'est peut-être pas.

### 2.9.3 M-G4 — L'isolation, et le point d'exécution le plus incertain

`docs/030` §4.6 et `docs/032` §5.4.1 exigent :

```text
REVOKE ALL ON SCHEMA prayer_private FROM PUBLIC;   -- et depuis ccjv_app
GRANT  USAGE ON SCHEMA prayer_private TO prayers_api;
GRANT  SELECT, INSERT, UPDATE ON les 4 tables TO prayers_api;
REVOKE DELETE ON ALL TABLES IN SCHEMA prayer_private FROM prayers_api;
GRANT  INSERT ON public.notification_outbox TO prayers_api;
```

**Le point qui n'est traité par aucun document, et qui doit l'être avant
l'exécution :** ces instructions supposent que les rôles **`ccjv_app`** et
**`prayers_api`** existent. Or :

- **la connexion applicative actuelle n'utilise pas `ccjv_app`** : elle passe par
  la chaîne `DATABASE_URL` du pooler Supabase, dont le rôle est **inconnu** du
  dépôt ;
- `020`/`021`/`028`/`030`/`032` **ne nomment nulle part** le rôle auquel
  `REVOKE` doit s'appliquer en production ;
- `030` §4.6 prévoit **deux pools de connexions** et un secret distinct
  (`PRAYER_DB_URL`), donc **une variable d'environnement nouvelle** sur Railway.

> **Conséquence : `REVOKE ALL … FROM ccjv_app` sur un rôle inexistant est un
> no-op silencieux**, et l'isolation **ne serait pas effective** tout en paraissant
> l'être. Ce point est **non tranché** (§7, **Q-NT8**) et doit être levé par
> l'identification du rôle réel avant l'exécution de M-G4.

## 2.10 M-F1 → M-F3 — `pageKey` : les 3 clés orphelines et les 3 pages sans clé

**Héritage de `docs/031` §6.5** — réutilisé sans modification :

> « **trois des six `pageKey` actuelles** (`communaute`, `vie-de-leglise`,
> `publications`) désignent des pages qui **n'existent pas**, tandis que **trois
> pages servies** (Événements, Où nous trouver, Faire un don) n'ont **aucune
> clé**. C'est la contradiction principale que cette migration doit résoudre — et
> elle ne peut pas l'être sans une décision (`§7` Q-PG3). »

### 2.10.1 Inventaire vérifié

**En base — 6 lignes, 12 valeurs, aucune valeur facultative :**

| `page_key` | Route servie | État |
| --- | --- | --- |
| `accueil` | `/` | conforme |
| `qui-sommes-nous` | `/qui-sommes-nous` | conforme |
| `organisation` | `/organisation` | conforme |
| **`communaute`** | **aucune** (`frontend/src/app/communaute/` n'a pas de `page.tsx`) | **clé orpheline** |
| **`vie-de-leglise`** | **aucune** | **clé orpheline** |
| **`publications`** | **aucune** | **clé orpheline** |
| *(absente)* | `/vie-de-leglise/evenements` | **page servie sans clé** |
| *(absente)* | `/vie-de-leglise/ou-nous-trouver` | **page servie sans clé** |
| *(absente)* | `/vie-de-leglise/faire-un-don` | **page servie sans clé** |
| *(absente)* | `/organisation/departements/[slug]` | **route inexistante** ; `departement` n'est qu'un contrat de template |

**Ce que `docs/032` §3.7 en fait :** la liste cible des `page_key` comprend les 6
existantes **plus** `evenements`, `ou-nous-trouver`, `faire-un-don`, `departement`
= **10 clés**. Les 3 orphelines sont **conservées**.

> **Nuance de statut, et elle compte :** conserver les 3 clés orphelines est
> **l'option 2** de `docs/031` §6.5 (« conserver les lignes comme contenu de pôle
> non rendu, en attente d'un usage — aucune perte, aucun gain immédiat »). C'est un
> **choix de schéma de `032`**, et `028/Q-PG3` **reste formellement ouverte** (§7,
> **Q-NT7**). Le choix est **sûr** : il ne perd rien et n'engage rien.

### 2.10.2 La migration des pages : additive, et **sans aucun contenu inventé**

**Ce que la migration fait :**

```text
Étape 1  ALTER TABLE public.static_pages ADD COLUMN template varchar(40);
         ALTER TABLE public.static_pages
           ADD COLUMN contract_version integer NOT NULL DEFAULT 1;
                          → ADDITIF. contract_version obtient 1 sur les 6 lignes
                            sans écriture (DEFAULT). C'est l'écart E4 de 031 §3.6.

Étape 2  Renseigner template sur les 6 lignes, depuis la table de correspondance
         pageKey → template DU SERVEUR (031 §1.4 L4 : « Le template est dérivé
         côté serveur, jamais reçu »). Aucune valeur ne vient du client.
                          → ADDITIF.
                          → Le nom des 6 valeurs de template est à fixer par le
                            code ; aucune décision ne l'impose (cf. Q-NT9).

Étape 3  ALTER TABLE public.static_pages
           ALTER COLUMN template SET NOT NULL;
                          → BLOQUANT si une seule ligne reste à NULL.

Étape 4  CHECK static_pages_content_is_object + CHECK
         static_pages_no_structure_keys + trigger static_pages_verse_keys_exist
                          → ADDITIF : vérifié, les 12 valeurs en base sont
                            heroTitle, heroIntro, title, intro. AUCUNE n'est une
                            clé de structure interdite. Le trigger de clés de
                            verset est sans effet : aucune page n'a de verseKey.
```

**Ce que la migration NE FAIT PAS — et c'est normatif :**

> **Aucune ligne n'est créée pour `evenements`, `ou-nous-trouver`, `faire-un-don`
> ni `departement`.** Le contrat de `docs/031` §3.2 impose un champ **obligatoire**
> `title` à chacune (`text(160)` pour les trois pages, `text(120)` pour `accueil`…).
> **Renseigner ce titre serait inventer un contenu éditorial** — ce que
> `docs/016` §5 interdit (« Ne jamais inventer ») et ce que `docs/032` §6.2
> applique lui-même (« aucune valeur éditoriale n'est inventée ici »).
>
> **Ces 4 clés sont créées plus tard, par le back-office, quand un titre existe.**
> La migration rend leur création **possible** (schéma strict, `contract_version`,
> `template`) ; elle ne la **fait** pas.

**Répartition entre lecture tolérante et écriture stricte (`docs/031` §3.5) :**

| Règle | Traitement |
| --- | --- |
| **Règle A — évolution additive** | Les 6 lignes ne perdent aucune clé : `heroTitle`, `heroIntro`, `title`, `intro` **conservent leur nom et leur borne** (`031` §6.3). Aucun renommage. |
| **Règle B — changement structurel** | Sans objet aujourd'hui : aucun champ n'est retiré, renommé, ni retypé par cette migration. Si cela devait arriver, `contract_version` est incrémenté et `normalizePageContent` migre à la lecture. |
| **Règle C — tolérance de lecture** | À implémenter (écart E3) : `getByKey` ne revalide pas aujourd'hui (`static-page.service.ts:36-48`). Sans normalisation, une ligne ancienne privée d'un champ obligatoire **empêcherait** la page de se rendre. **Ce n'est pas un problème de données** : c'est un problème de code, traité en §6.1. |
| **Règle D — gel du registre** | Les 10 `page_key` de `032` §3.7 deviennent la liste fermée. |

**Retour arrière :** `DROP COLUMN template` + `DROP COLUMN contract_version` +
retrait des `CHECK`/trigger. **Totalement réversible.**

### 2.10.3 M-F4 — Les versets manquants : 2 ou 3 lignes additives

`docs/031` §6.4 étape **M5** : *« Créer les `Scripture` manquants (1 Co 12:12,4-5 ;
Matthieu 23:11 ; 1 Pierre 4:10) puis convertir les versets littéraux de
`/organisation` en clés »*, vérification : *« les 3 sections affichent le même
texte après migration »*.

**État vérifié :** `scriptures` contient les **7 clés** `corps`, `louange`,
`memoire`, `ouvrage`, `parole`, `rassemblement`, `repos`. La clé **`corps`** porte
déjà **1 Corinthiens 12:12** (mais `031` §2.7 relève que
`frontend/src/data/mock/verses.ts:35-38` n'en contient que la première phrase, et
qu'elle n'est **pas** utilisée).

**Traitement :**

| # | Verset littéral de `/organisation` | Clé existante ? | Action |
| --- | --- | --- | --- |
| 1 | 1 Co 12:12,4-5 — `page.tsx:197-206` | `corps` existe, mais référence `12:12` seulement | **À trancher** : réutiliser `corps` (et vérifier le texte) ou créer une clé propre |
| 2 | Matthieu 23:11 — `page.tsx:269-272` | **aucune** | **Créer 1 ligne** |
| 3 | 1 Pierre 4:10 — `page.tsx:451-458` | **aucune** | **Créer 1 ligne** |

**Nature : additif.** Le **texte** n'est pas inventé : il est **copié depuis le JSX
existant** (`frontend/src/app/organisation/page.tsx`), en Louis Segond 1910 comme
les 7 autres. **Le nom des nouvelles clés n'est fixé par aucune décision** (§7,
**Q-NT5**).

**Vérification :** `select count(*) from scriptures` = **7 + 2 = 9** (ou 10 si une
clé distincte est créée pour 1 Co 12:12,4-5 plutôt que `corps` réutilisée).
**Aucune clé existante n'est supprimée ni renommée.**

## 2.11 M-H1 → M-H3 — Les tables additives encore créées

### 2.11.1 M-H1 — `media_access` : trois droits indépendants (D-21, D-22)

**Création additive, 0 ligne.** Aucune donnée existante n'est lue : les 28 médias
restent dans la **bibliothèque centrale** (X27 / `021` §19 — « pas de
`media.department_id` »), et **aucun partage n'existe aujourd'hui** (D-22 : « aucun
partage par défaut »).

**Le seul point non déclaratif** est signalé par `docs/032` §4.3 et sa réserve
**R-S6** : `grantee_id` est **polymorphe** (département **ou** profil), et **SQL ne
permet pas de clé étrangère conditionnelle**. L'intégrité est portée par un
**trigger**. Conséquence à assumer : le trigger est **contournable** par
désactivation, et **n'empêche pas** la suppression ultérieure de sa cible.
`grantee_id` reste donc sans FK → §7, réserve **R-NT1**.

**Vérification post-création :** la table doit exister et être **vide** ;
le trigger doit exister et être **actif**.

### 2.11.2 M-H2 — `department_capabilities` : **trois points non tranchés sur trois**

`docs/032` Q-S6, Q-S7, Q-S8 sont **tous** ouverts :

| Point | Question | Statut |
| --- | --- | --- |
| **Q-S6** ⚠ | **Qui édite les capacités ?** Un responsable qui écrirait les siennes **s'attribuerait la portée événementielle globale** — donc un pouvoir de publication à l'échelle de l'église. | **non tranché** (`029` Q-06) |
| **Q-S7** | La **table** `department_capabilities` est-elle l'encodage retenu, ou faut-il une colonne `jsonb` ? | **non tranché** (`032` §1.2 C1, révisable) |
| **Q-S8** | Le code `EVENT_SCOPE_GLOBAL` est-il retenu ? D'autres codes sont-ils prévus ? | **non tranché** (D-25 nomme la capacité sans code) |

**Traitement :** la table est **créée vide**. **Aucune capacité n'est attribuée par
la migration** : attribuer `EVENT_SCOPE_GLOBAL` à un département serait prendre la
décision Q-S6 **et** Q-S8 d'un coup, sans base décisionnelle. Aucun événement ne
peut donc devenir `GLOBAL` (§2.5.1) — et c'est **cohérent**.

### 2.11.3 M-H3 — `notifications`, `notification_outbox`, `audit_log`

Créations additives, **0 ligne**. Deux invariants portés par la base et à vérifier
après création :

| Invariant | Mécanisme (`032` §3.8) |
| --- | --- |
| Aucune notification de prière à un non-`ADMIN` actif | `CHECK notifications_prayer_recipient_is_admin` |
| Aucun événement `PRAYER_*` dans le journal général | `audit_action` **sans aucune valeur `PRAYER_*`** — vérifiable par `pg_enum` (§5.6) |

## 2.12 M-I1 → M-I3 — Trois transformations additives à effet non nul

### 2.12.1 M-I1 — `testimonies.status` : **additif en base, à effet public**

**État vérifié :** 4 témoignages, aucune colonne de statut. Et
`frontend/src/app/communaute/temoignages/page.tsx:55` appelle **réellement**
`getTestimonies()` puis rend `lead` (le premier) et `others` : **les 4 témoignages
sont affichés publiquement aujourd'hui.**

**Ce que `docs/032` §3.7 et §7.2 ligne 10 exigent :**
`status testimony_status NOT NULL DEFAULT 'DRAFT'`, avec
`CHECK ((status = 'PUBLISHED') = (moderated_at IS NOT NULL))`, et la justification :
D-24 dit du `Testimony` qu'il est « contenu éditorial persistant — **statut/modération
à définir avant exposition publique** » (`028/Q-PR9`).

**Le problème, posé sans détour :** ajouter la colonne avec `DEFAULT 'DRAFT'` laisse
les 4 lignes à **`DRAFT`**. Dès que l'API filtrera sur `PUBLISHED` — ce qu'exige la
réserve de D-24 — la page **perdra ses 4 témoignages** et retombera sur son
`EmptyState` (« Aucun témoignage publié pour le moment »). **C'est un changement
visible pour le visiteur, causé par une migration déclarée « additive ».**

**Non tranché** — la valeur de rattrapage des 4 lignes existantes :

| Option | `status` des 4 lignes | Effet | Conformité |
| --- | --- | --- | --- |
| **T-A** | `DRAFT` (défaut) | Les 4 disparaissent de la page publique. | **La plus prudente** vis-à-vis de D-24 : « à définir **avant** exposition publique » ⇒ ne rien exposer avant décision. |
| **T-B** | `PUBLISHED` + `moderated_at = now()` | Comportement public **inchangé**. | **Affirme une modération qui n'a pas eu lieu** : `moderated_at` serait une date inventée. |
| **T-C** | Ne pas ajouter la colonne avant que Q-PR9 soit tranchée | Aucun effet. | Reporte la question ; `032` §7.2 ligne 10 argue qu'« il n'y a pas d'alternative » pour exprimer la réserve. |

> Présenté en §7 comme **Q-NT10**, avec sa conséquence visible : **la valeur de
> rattrapage de `testimonies.status` change ce que le public voit.**

**Retour arrière :** `DROP COLUMN status, moderated_by, moderated_at` + `DROP TYPE
testimony_status` — **réversible** *si* aucune ligne n'a été modérée entre-temps
(le statut perdu serait alors une information réelle).

### 2.12.2 M-I2 — Les deux `CHECK` de valeur

| `CHECK` | Volume | Vérification **faite sur la base** | Verdict |
| --- | --- | --- | --- |
| `site_settings_no_prayer_secret` : `key !~* '^(prayer\|crypto\|dek\|recovery\|key\|kek\|master)'` | 15 clés | Les 15 commencent par `site.` — **aucune** ne commence par un préfixe interdit | **non bloquant**, vérifié |
| `social_links_href_scheme` : `href ~* '^https?://'` | 2 liens | `https://www.instagram.com/ecodim_ccjv/`, `https://www.tiktok.com/@ecodim_ccjv` — **tous deux `https://`** | **non bloquant**, vérifié |

> **Nuance de statut sur le second :** `docs/032` §7.2 ligne 14 écrit
> lui-même qu'« **l'alternative recommandée** : ne pas poser ce `CHECK` — il n'est
> exigé par aucune décision ». Aucune décision de `028` ne l'exige en effet. Il est
> donc **proposé (032)**, pas **tranché (028)** — et **facultatif**.

### 2.12.3 M-I3 — `schedule_entries.department_id` : **recommandation de ne pas l'ajouter**

`docs/032` §7.2 ligne 11 : « Aucune [alternative] : 031 §7 Q-PG5 est non tranchée
sur l'usage de cette table ; la colonne est ajoutée vide et n'est remplie que par
décision. **Alternative : ne pas l'ajouter tant que Q-PG5 n'est pas tranchée —
c'est le choix conservateur, recommandé.** »

**Recommandation reprise telle quelle : ne pas ajouter la colonne.** Motif : elle
n'apporte **rien** tant que Q-PG5 n'est pas tranchée, elle est `NULL` sur 6 lignes,
et son ajout ultérieur est **additif** (jamais plus coûteux). **Ajouter une colonne
vide « au cas où » est exactement le type d'anticipation que D-24/`032` §1.3
écartent.**

---

# 3. Séquence ordonnée

## 3.1 Correspondance étape ↔ transformation

| Étape | Phase | Transformations | Étape | Phase | Transformations |
| --- | --- | --- | --- | --- | --- |
| `É1` | P | — (levée des décisions) | `É19` | A | `M-H3`, `M-H1`, `M-H2` |
| `É2` | P | — (sauvegarde SB-0) | `É20` | A | `M-G4` |
| `É3` | P | — (répétition générale) | `É21` | D | `M-B1` *(temps 2 et 3)* |
| `É4` | A | `M-A4` | `É22` | D | `M-A1`, `M-A2` |
| `É5` | A | `M-A5`, `M-A6` *(déploiement N)* | `É23` | D | `M-C2`, `M-D3` *(rattachements)* |
| `É6` | P | — (gel de la fenêtre) | `É24` | D | **`M-D5`** *(archivage — §2.7.3)* |
| `É7` | A | `M-E1` *(code)* | `É25` | D | `M-A3` |
| `É8` | A | `M-C1` | `É26` | D | `M-F4` |
| `É9` | A | `M-B1` *(préparation)*, `M-B3` *(colonnes)* | `É27` | D | `M-B2` |
| `É10` | A | `M-D1` | `É28` | C | `M-C3`, `M-D3` *(NOT NULL)* |
| `É11` | A | `M-D2`, `M-D3` *(colonnes)* | `É29` | C | `M-D4` |
| `É12` | A | `M-D2` *(`CHECK`)* | `É30` | C | `M-D6` |
| `É13` | A | `M-I1` | `É31` | C | `M-F3` *(contraintes)* |
| `É14` | A | `M-I2` | `É32` | C | Index (`032` §10.2) |
| `É15` | A | `M-B3` *(`NOT NULL` + `CHECK`)* | `É33` | C | `M-E1`, `M-E2` *(suppression)* |
| `É16` | A | `M-C4` | `É34` | V | **Vérifications post-migration** (§5) |
| `É17` | A | `M-F3` *(colonnes)* | `É35` | N | Nettoyage du code et des réglages *(déploiement N+1)* |
| `É18` | A | `M-E2` *(schéma)*, `M-G1`, `M-G2`, `M-G3` | | | |

**Lecture :** les phases sont **P** préparation · **A** additif · **D** données ·
**C** contraintes · **V** vérification · **N** nettoyage — la même nomenclature que
les tableaux de §3.3.

**Trois transformations n'ont volontairement AUCUNE étape d'exécution**, parce que
la transformation consiste à **ne rien faire** — et c'est une décision, pas un oubli :

| Transformation | Pourquoi aucune étape | Où c'est justifié |
| --- | --- | --- |
| **`M-F1`** | Les 3 `pageKey` sans route servie sont **conservées telles quelles** : la conservation ne demande **aucune écriture**. | §2.10.1, `É8` |
| **`M-F2`** | Les 4 `page_key` manquantes (`evenements`, `ou-nous-trouver`, `faire-un-don`, `departement`) **ne sont pas créées** : leur `title` obligatoire serait un contenu inventé. | §2.10.2 |
| **`M-I3`** | `schedule_entries.department_id` n'est **pas ajoutée** : `032` §7.2 ligne 11 recommande explicitement le choix conservateur. | §2.12.3 |

## 3.2 Règle d'ordonnancement — énoncée une fois, appliquée partout

> **Aucune contrainte d'intégrité portant sur des données existantes n'est posée
> avant que ces données ne soient conformes.**
>
> Corollaire : **l'ordre est `données → contraintes`**, jamais l'inverse, pour
> chacune des six contraintes suivantes :
>
> | Contrainte | Échoue tant que… |
> | --- | --- |
> | `events.department_id SET NOT NULL` | une ligne est à `NULL` (**2 aujourd'hui**) |
> | `publications.department_id SET NOT NULL` | une ligne est à `NULL` (**10 aujourd'hui**) |
> | `admin_profiles_scope_coherence` | `scope`/`department_id` ne sont pas renseignés conformément |
> | `publications_max_three_published_per_department` | un département dépasse 3 `PUBLISHED` |
> | `static_pages.template SET NOT NULL` | `template` est `NULL` sur une ligne |
> | `publications_archived_at_coherence` | `status` et `archived_at` sont incohérents |

**Et la règle inverse, tout aussi normative :** une **colonne** doit être ajoutée
**nullable**, remplie, **puis** contrainte. Jamais `ADD COLUMN … NOT NULL` sur une
table peuplée sans `DEFAULT` : l'instruction échouerait sur les lignes existantes.

## 3.3 La séquence — 33 étapes, prérequis / action / vérification / retour arrière

**Légende des phases :** **P** préparation · **A** additif sans effet en service ·
**D** données · **C** contraintes · **V** vérification · **N** nettoyage.

### Phase P — Préparation (aucune écriture métier)

| É | Ph. | Prérequis | Action | Vérification | Retour arrière |
| --- | --- | --- | --- | --- | --- |
| **É1** | P | — | **Lever les décisions bloquantes** : Q-S1, Q-S2, Q-NT1, Q-NT2, Q-P3, rétroactivité (§2.7.3), Q-S5, Q-NT4, Q-NT8, M-I1/T-A..T-C. Consigner chaque réponse par écrit avec sa date. | Les 10 décisions de §7.1 sont écrites et signées. **Sans elles, `É24`, `É25`, `É27`, `É28` et `É20` ne peuvent pas s'exécuter.** | Sans objet — aucune écriture. |
| **É2** | P | `É1` | **Sauvegarde complète** (§4.1) : `pg_dump` intégral, inventaire du Storage, export lisible des 5 tables de contenu. | **Restauration à blanc sur une base jetable**, et comparaison des comptages de §5.1. Une sauvegarde non testée n'est pas une sauvegarde. | Sans objet. |
| **É3** | P | `É2` | **Répétition générale** : cloner la base restaurée, exécuter `É4` → `É32` sur le clone, relever chaque écart. | Le clone atteint l'état cible et §5 rend **toutes** les vérifications attendues. | `DROP DATABASE` du clone. |
| **É4** | A | `É3` | `M-A4` — Renommer la clé `site.ecodimFoundedAt` : **ajouter** la nouvelle clé `site.ecodumeFoundedAt` avec la **même valeur** (`2 juillet 2023`) **sans supprimer l'ancienne**. Le code accepte les deux. | `select count(*) from site_settings where key in ('site.ecodimFoundedAt','site.ecodumeFoundedAt')` = **2**. La suppression de l'ancienne attend `É33`. | `DELETE` de la nouvelle clé. **Réversible à 100 %.** |
| **É5** | A | `É4` | **Déploiements N** de `M-A5`/`M-A6` : le code tolère **ancien ET nouveau** vocabulaire — alias d'ancre, lien de pied de page, `ALLOWED_SETTING_KEYS` doublée, deux clés de réglage acceptées. **Aucun renommage en base à ce stade.** | Le site en ligne fonctionne à l'identique : ancres `#enfants-ecodim` **et** nouvelle ancre résolues ; pied de page valide ; `PATCH /settings` accepte les deux clés. | Redéploiement du code précédent. |
| **É6** | P | `É5` | **Figer la fenêtre** : aucun `npm run seed`, aucun `--reset`, aucun téléversement de média, aucune publication pendant `É10` → `É31`. Consigner l'horodatage de départ. | Les comptages de §5.1 sont stables entre deux mesures espacées. | Sans objet. |
| **É7** | A | `É5` | `M-E1` *(code)* — Retirer `requesterContact` des **8 emplacements de code** (§2.8.1 n° 4 à 11), **y compris la liste rouge de journalisation** (`logger/index.ts:28`). Régénérer OpenAPI (`npm run openapi`). | `grep -ri requesterContact backend/src backend/openapi.*` → **0 occurrence**. Les tests d'API qui l'attendaient sont adaptés (§6.1). | Redéploiement du code précédent. **Réversible tant que la colonne existe en base.** |

### Phase A — Additif sans effet en service

| É | Ph. | Prérequis | Action | Vérification | Retour arrière |
| --- | --- | --- | --- | --- | --- |
| **É8** | A | `É6` | `M-C1` — **Consigner l'état des 3 départements** (identifiants, slugs, `name`) et **s'interdire tout `DELETE`**. | `select count(*) from departments` = **3**. Aucune instruction `DELETE` dans la migration. | Sans objet — aucune écriture. |
| **É9** | A | `É6` | `M-B1` **préparation** : `CREATE TYPE admin_scope` ; `ADD COLUMN scope admin_scope` **nullable** ; `ADD COLUMN department_id uuid` **nullable**. | Les 2 colonnes existent, **toutes les valeurs sont `NULL`**, le code en service ignore la modification. | `DROP COLUMN scope, department_id` + `DROP TYPE admin_scope`. **Réversible.** |
| **É10** | A | `É6` | `M-D1` — `ALTER TYPE publication_status ADD VALUE 'ARCHIVED';` **SEULE instruction de cette étape.** | `select enum_range(NULL::publication_status)` contient `ARCHIVED`. **Aucune ligne ne l'utilise.** | Une valeur d'énumération ajoutée ne se retire pas sans reconstruction du type — **retour arrière coûteux, mais sans perte de donnée** (§4.3.4). |
| **É11** | A | `É10` | `M-D2`/`M-D3` *(colonnes)* — `ADD COLUMN archived_at timestamptz` (nullable) ; `ADD COLUMN department_id uuid` (nullable) + FK `RESTRICT`. | Les 10 lignes ont `NULL` sur les deux ; le `COMMIT` est passé. | `DROP CONSTRAINT` FK + `DROP COLUMN` ×2. **Réversible, aucune donnée perdue.** |
| **É12** | A | `É11` | `M-D2` — Poser `CHECK publications_archived_at_coherence` **et** le `CHECK` de bornage du créneau **sans** créer l'index unique. | La contrainte est **acceptée** : 10 lignes `PUBLISHED` avec `archived_at NULL`. | `DROP CONSTRAINT`. **Réversible.** |
| **É13** | A | `É6` | `M-I1` — Poser le type `testimony_status`, les 3 colonnes, le `CHECK` de cohérence, **avec la valeur de rattrapage tranchée en `É1`**. | Les 4 lignes portent la valeur décidée ; si T-B : `moderated_at` non nul sur 4 lignes. | `DROP COLUMN` ×3 + `DROP TYPE`. **Réversible** tant qu'aucune modération réelle n'a eu lieu. |
| **É14** | A | `É6` | `M-I2` — `CHECK site_settings_no_prayer_secret` ; *(facultatif, non exigé par 028)* `CHECK social_links_href_scheme`. | Les deux contraintes sont **acceptées** — vérification préalable faite en §2.12.2. | `DROP CONSTRAINT`. **Réversible.** |
| **É15** | A | `É9` | `M-B3` — Renseigner `scope = 'GLOBAL'` sur les lignes à `NULL` ; poser `SET NOT NULL` puis `CHECK admin_profiles_scope_coherence`. | **Voir `É23`** : cette étape peut être fusionnée avec la conversion d'énumération ou exécutée avant elle. Vérification en §5.3 : 0 ligne non conforme, 0 `NULL` sur `scope`. | `DROP CONSTRAINT` + `DROP NOT NULL`. **Réversible** tant que le `CHECK` n'a pas été violé par des données réelles. |
| **É16** | A | `É8` | `M-C4` — `CREATE TYPE event_visibility_scope` ; `ADD COLUMN visibility_scope event_visibility_scope NOT NULL DEFAULT 'DEPARTMENT'` ; créer le trigger de cohérence (sans capacité attribuée). | `select visibility_scope, count(*) from events group by 1` → **`DEPARTMENT \| 7`**. Le trigger ne rejette rien. | `DROP TRIGGER` + `DROP COLUMN` + `DROP TYPE`. **Réversible, aucune information préexistante perdue.** |
| **É17** | A | `É6` | `M-F3` *(colonnes)* — `ADD COLUMN template varchar(40)` (nullable) ; `ADD COLUMN contract_version integer NOT NULL DEFAULT 1`. | `select page_key, contract_version from static_pages` → 6 lignes à **1**. | `DROP COLUMN` ×2. **Réversible.** |
| **É18** | A | `É6` | `M-E1`/`M-E2` *(schéma)* — Créer le schéma `prayer_private` et ses **4 tables**, dans l'ordre `crypto_key` → `prayer_request` → `data_key_envelope` → `prayer_audit_event`. **Ne rien copier depuis `public.prayer_requests`** (§2.9.2). | Les 4 tables existent et sont **vides**. `prayer_request_no_contact_columns` et `prayer_request_no_secret_columns` sont **acceptées** (elles introspectent le schéma : elles échoueraient si une colonne interdite existait). | `DROP SCHEMA prayer_private CASCADE`. **Réversible, aucune donnée métier concernée.** |
| **É19** | A | `É18` | `M-H3` puis `M-H1` puis `M-H2` — Créer `notifications`, `notification_outbox`, `audit_log` ; `media_access` + son trigger + ses index de contrainte ; `department_capabilities` (**vide**). | Les 5 tables existent. `department_capabilities` est **vide** (§2.11.2). `select enum_range(NULL::audit_action)` **ne contient aucune valeur `PRAYER_*`**. | `DROP TABLE` des 5. **Réversible.** |
| **É20** | A | `É18` + `Q-NT8` tranché | `M-G4` — Isolation : `REVOKE`/`GRANT` sur `prayer_private`, `GRANT INSERT ON public.notification_outbox TO prayers_api`, `REVOKE DELETE`. **Après identification du rôle de la connexion applicative réelle.** | **Test d'effectivité obligatoire** : depuis une connexion `ccjv_app`, `SELECT * FROM prayer_private.prayer_request` **doit échouer** en `insufficient_privilege`. Sans ce test, le `REVOKE` peut être un no-op. | `GRANT` inverse. **Réversible.** |

### Phase D — Données (écritures de masse)

| É | Ph. | Prérequis | Action | Vérification | Retour arrière |
| --- | --- | --- | --- | --- | --- |
| **É21** | D | `É15` | `M-B1` *(temps 2 et 3)* — `DROP DEFAULT` sur `role` ; `ALTER TYPE admin_role RENAME TO admin_role_old` ; `CREATE TYPE admin_role` (3 valeurs) ; `ALTER COLUMN role TYPE admin_role USING CASE…` ; `DROP TYPE admin_role_old`. | **Avant** : `select count(*) from admin_profiles where role::text <> 'ROLE_ADMIN'` = **0**. **Après** : `select role, count(*) from admin_profiles group by 1` → `ADMIN \| n`, **0 ligne à `ROLE_ADMIN`**. | Voir §4.3.1 — **elle disparaît dès qu'un compte `SUPER_ADMIN`/`DEPARTMENT_MANAGER` existe.** |
| **É22** | D | `É5` (code N déployé) | `M-A1` + `M-A2` — Données du renommage : `departments.name` → `Ecodume` ; `departments.slug` → **valeur tranchée en `É1`** ; les 20 occurrences des textes (§2.2.2) ; `leaders.scope`/`leaders.name`. | **Avant/après** : `select count(*) from departments` = **3** (aucune ligne créée ni supprimée). §5.4 : **0 occurrence d'`Ecodim`** hors les 3 slugs de contenu si Q-NT2-bis les conserve. La répartition événements inchangée : Adultes 2 · Chorale 2 · Ecodim 1 · NULL 2. | `UPDATE` inverse sur `name`/`slug`/textes — **possible tant que le code N est déployé** (il accepte les deux vocabulaires). Sauvegarde pour les textes. |
| **É23** | D | `É22` | `M-C2` + `M-D3` — Rattacher les **2 événements à `NULL`** (département décidé en `É1`) et **les 10 publications** (départements décidés en `É1`). | **BLOQUANT, dans cet ordre :** `select count(*) from events where department_id is null` → **0** ; `select count(*) from publications where department_id is null` → **0**. **Toute autre valeur = ARRÊT.** Comptages totaux : events **7**, publications **10**. | `UPDATE … SET department_id = NULL` — **réversible** tant que `NOT NULL` (`É28`) n'est pas posé. Sauvegarde ligne par ligne obligatoire (§4.2). |
| **É24** | D | `É23` + décisions `É1` (Q-P3, rétroactivité) | `M-D5` — **L'archivage rétroactif, si et seulement si l'option R-A a été retenue** (ou la répartition R-C exécutée). Par département, conserver les 3 `PUBLISHED` les plus récentes selon `ORDER BY published_at ASC, id ASC` (D-19) et archiver les autres avec `archived_at = now()`. | `select department_id, count(*) from publications where status='PUBLISHED' group by 1` → **≤ 3 par département** (ou ≤ 3 par `(département, type)` si Q-P3 est tranché ainsi). `select count(*) from publications` = **10** — aucune ligne perdue. **La liste des lignes archivées est consignée avec leur `id`, `title`, `published_at`.** | **AUCUNE — opération IRRÉVERSIBLE par D-18.** Seule sortie : **restauration complète** (§4.3.3). C'est pourquoi cette étape est **isolée**, **séparément committée**, et **précédée d'une copie de l'état antérieur**. |
| **É25** | D | `É22` + décision slugs de contenu (Q-NT2-bis) | `M-A3` — **Si et seulement si décidé** : renommer les 3 slugs de contenu. **Si non décidé : ne rien faire** (option conservatrice recommandée, cohérente avec D-20). | `select slug from events where slug like '%ecodim%'` ; idem publications. Le nombre de slugs renommés est **exactement** celui décidé. | `UPDATE` inverse. **Réversible** — mais toute URL déjà diffusée serait de nouveau cassée. **La décision doit être définitive.** |
| **É26** | D | `É6` | `M-F4` — Créer les **2 (ou 3)** `scriptures` manquants pour `/organisation`, textes **copiés du JSX existant**, clés nommées selon la décision `É1`. | `select count(*) from scriptures` = **7 + 2** (ou + 3). Les **7 clés d'origine sont intactes** : `select key from scriptures` contient toujours les 7. | `DELETE` des lignes ajoutées. **Réversible.** |
| **É27** | D | `É21` + décision Q-NT3 | `M-B2` — Créer le compte `SUPER_ADMIN` **distinct** : 1 utilisateur Supabase Auth + 1 ligne `admin_profiles` (`role='SUPER_ADMIN'`, `scope='GLOBAL'`, `department_id = NULL`). | `select role, count(*) from admin_profiles group by 1` → `ADMIN \| n`, `SUPER_ADMIN \| 1`. Le `CHECK` de cohérence est satisfait. La connexion au back-office avec ce compte **fonctionne** et **ne voit aucune prière** (test N-01/N-02 de `029`). | `DELETE` la ligne + désactiver le compte Auth. **Réversible.** |

### Phase C — Contraintes (toutes **après** les données)

| É | Ph. | Prérequis | Action | Vérification | Retour arrière |
| --- | --- | --- | --- | --- | --- |
| **É28** | C | `É23` (0 `NULL`) | `M-C3` *(FK)* puis *(NOT NULL)* sur `events` ; `M-D3` *(NOT NULL)* sur `publications`. **Dans cet ordre par table : FK `RESTRICT` d'abord, `SET NOT NULL` ensuite.** | Les 4 instructions **réussissent**. `information_schema.columns.is_nullable` = `NO` sur les deux colonnes. **Si l'une échoue : ARRÊT IMMÉDIAT**, les données ne sont pas conformes. | `DROP NOT NULL` + restauration de `SET NULL`. **Réversible en structure ; l'information « était NULL » n'est plus que dans la sauvegarde.** |
| **É29** | C | `É24`, `É28` | `M-D4` — `ADD COLUMN published_slot smallint GENERATED … STORED` ; `CHECK` de bornage ; **`CREATE UNIQUE INDEX publications_max_three_published_per_department`**. | **L'index est créé sans erreur** — c'est la preuve que la borne est respectée. **S'il échoue, un département dépasse la borne : revenir en `É24`.** | `DROP INDEX` + `DROP COLUMN published_slot`. **Réversible** (les archivages de `É24` restent irréversibles). |
| **É30** | C | `É29` | `M-D6` — Créer `publications_forbid_unarchive()` + trigger `publications_status_immutable`. | Un `UPDATE publications SET status='PUBLISHED' WHERE status='ARCHIVED'` **échoue** en `check_violation`. Un `UPDATE … SET archived_at = NULL` **échoue** aussi. | `DROP TRIGGER` + `DROP FUNCTION`. **Réversible. Attention : le retrait du trigger rouvrirait la transition que D-18 déclare irréversible — c'est une décision, pas une simple annulation.** |
| **É31** | C | `É17` | `M-F3` *(contraintes)* — Renseigner `template` sur les 6 lignes depuis la table `pageKey → template` du serveur ; `SET NOT NULL` ; poser les 2 `CHECK` de `content` et le trigger de clés de verset. | `select count(*) from static_pages where template is null` = **0**. Les 3 contraintes/trigger sont **acceptés** : **vérifié**, les 12 valeurs ne contiennent aucune clé de structure et aucune page ne porte de `verseKey`. | `DROP TRIGGER`/`DROP CONSTRAINT` + `DROP NOT NULL`. **Réversible.** |
| **É32** | C | `É29`, `É30`, `É31` | Index de service (`docs/032` §10.2) : `publications_archived_at_idx` (partiel `ARCHIVED`), `publications_published_per_department_idx` (`department_id, published_at ASC, id ASC`, partiel `PUBLISHED`), `events_visibility_scope_idx`, `events_department_date_idx`, `department_capabilities_capability_idx`, `media_access_*`, `notifications_*`, `notification_outbox_pending_idx`, `audit_log_*`, `prayer_*`, `data_key_envelope_*`, `crypto_key_*`. | Les index de **contrainte** sont acceptés. Les index de **service** sont présents. `select count(*) from pg_indexes where schemaname in ('public','prayer_private')` atteint la cible. | `DROP INDEX`. **Réversible, aucune donnée concernée.** |
| **É33** | C | `É28` → `É32` | **`M-E1` / `M-E2` — la suppression, en dernier** : `TRUNCATE public.prayer_requests` → vérification 0 → `DROP TABLE public.prayer_requests` → `DROP TYPE prayer_confidentiality` → reconstruire `prayer_status` (`PENDING`, `ARCHIVED`). **Procédure complète en §2.8.2 (C1 → C7).** | §2.8.2 C4, C5, C7 et §5.5 : **0 table, 0 colonne, 0 contrainte, 0 valeur** évoquant un contact dans les schémas `public` **et** `prayer_private`. `pg_dump --schema-only` ne contient pas `contact`. | **AUCUNE pour la donnée supprimée** — sauf si `É1`/Q-S5 a décidé un export. **Justification explicite de l'absence de porte de sortie en §4.3.5.** |

### Phase V / N — Vérification et nettoyage

| É | Ph. | Prérequis | Action | Vérification | Retour arrière |
| --- | --- | --- | --- | --- | --- |
| **É34** | V | `É33` | **Exécuter l'intégralité de la §5** — les 5 familles de contrôles : comptages avant/après, orphelins, `NULL` sur colonnes obligatoires, `Ecodim` résiduel, `requester_contact` résiduel. | **Tous** les critères de §5 sont satisfaits. **Un seul critère non satisfait = étape non validée.** | Selon le critère en échec : voir la colonne « retour arrière » de l'étape responsable. |
| **É35** | N | `É34` | **Déploiements N+1** : retirer les alias de compatibilité de `É5` ; retirer la clé de réglage héritée `site.ecodimFoundedAt` ; retirer les entrées résiduelles de `requesterContact` ; activer les policies de `029` §4.1. | `grep -ri ecodim frontend/src backend/src` → **0 occurrence hors les 3 slugs de contenu si conservés**. `grep -ri requesterContact backend` → **0**. Le site fonctionne **sans** les alias. | Redéployer le code N (les alias). **Réversible tant que la clé de réglage héritée n'est pas supprimée** — sa suppression est donc la **dernière** opération, et elle est **destructive** (la valeur doit être recopiée avant). |

**Total : 35 étapes** (`É1` → `É35`), dont **3 de préparation**, **16 additives**,
**7 d'écriture de données**, **6 de contrainte**, **1 de vérification** et
**1 de nettoyage**.

**Les 6 étapes bloquantes** dont l'échec interrompt la migration :
`É7` (0 occurrence `requesterContact`), `É20` (test d'effectivité des privilèges),
`É21` (0 ligne `ROLE_ADMIN` avant reconstruction), `É23` (0 `NULL`),
`É29` (création de l'index unique), `É34` (§5 intégrale).

**Les 7 étapes destructives :**

| Étape | Transformation | Ce qui est perdu | Porte de sortie |
| --- | --- | --- | --- |
| `É21` | `M-B1` — type `admin_role` reconstruit | Le type et la valeur `ROLE_ADMIN` | **Conditionnelle** (§4.3.1) — se referme dès `É27` |
| `É22` | `M-A1`, `M-A2` — nom, slug et textes du département | Le contrat d'URL et d'ancre `#enfants-ecodim` | **Oui**, tant que le code N est déployé (§4.3.7) |
| `É24` | **`M-D5`** — archivage `PUBLISHED → ARCHIVED` | L'appartenance au flux courant, **définitivement** | **AUCUNE** — restauration complète seule (§4.3.3) |
| `É25` | `M-A3` — slugs de contenu (si décidé) | Des URL publiques déjà diffusées | **Oui**, mais la décision doit être définitive (§4.3.7) |
| `É28` | `M-C3`, `M-D3` — `NOT NULL` + `RESTRICT` | La capacité « événement sans département » et la capacité « supprimer un département sans perdre ses événements » | **Partielle** — la structure revient, pas l'information « était `NULL` » (§4.3.2) |
| `É33` | `M-E1`, `M-E2` — table, colonne, types | Les données de prière en clair et le contact | **AUCUNE, et c'est justifié** (§4.3.5) |
| `É35` | Clé de réglage héritée | La clé `site.ecodimFoundedAt` | **Oui** — la valeur a été recopiée en `É4` (§4.3.7) |

Chacune est traitée en §4.3.

---

# 4. Sauvegarde et réversibilité

## 4.1 Quand sauvegarder, quoi, et comment

### 4.1.1 Les quatre points de sauvegarde obligatoires

| Quand | Quoi | Pourquoi ce point précis |
| --- | --- | --- |
| **SB-0 — avant `É4`** | **Sauvegarde complète** de la base + inventaire du Storage + export lisible des tables de contenu | Après, plus aucune étape n'est totalement neutre. C'est **la** sauvegarde de référence : c'est elle qui permet de revenir à l'état initial dans tous les cas. |
| **SB-1 — avant `É21`** | Sauvegarde complète **+** export de `admin_profiles` seul (rôles, `is_active`, `username`) | La reconstruction d'énumération est **destructive du type** : le retour arrière dépend de l'état exact des rôles au moment de la conversion. |
| **SB-2 — avant `É24`** | Sauvegarde complète **+** copie **ligne par ligne** des 10 publications (`id`, `title`, `slug`, `status`, `published_at`, `updated_at`) | **Le seul moyen de savoir ce qui a été archivé, et de le restaurer.** L'archivage est irréversible (D-18). **C'est la sauvegarde la plus importante de tout le plan.** |
| **SB-3 — avant `É33`** | Sauvegarde complète **+** export de `prayer_requests` selon la décision Q-S5 | La suppression est définitive. |

### 4.1.2 Les 5 objets sauvegardés, et leur forme

| # | Objet | Commande | Vérification |
| --- | --- | --- | --- |
| 1 | **Base complète** | `pg_dump --format=custom --no-owner --no-privileges --schema=public --schema=prayer_private --schema=drizzle` | Restauration à blanc (§4.1.3) |
| 2 | **Comptes Supabase** | Export du schéma `auth` (`auth.users`, `auth.identities`) — **nécessaire** : `admin_profiles.id` référence par convention `auth.users.id` (aucune FK SQL, `032` §3.3). La perte des comptes rendrait les profils inopérants. | `select count(*) from auth.users` avant/après |
| 3 | **Fichiers du Storage** | Inventaire `storage.objects` (**28** objets, bucket `ccjv-media`) **+** copie des fichiers, ou confirmation que la sauvegarde gérée par Supabase couvre le bucket | `select count(*) from storage.objects where bucket_id='ccjv-media'` = **28** ; chaque `media.path` a son objet |
| 4 | **Contenu éditorial lisible** | `COPY (SELECT page_key, template, contract_version, content FROM static_pages) TO … CSV` ; idem `site_settings`, `departments`, `events`, `publications`, `leaders`, `testimonies`, `community_faces`, `scriptures`, `schedule_entries`, `social_links` | Le CSV est **lisible sans `pg_restore`** : c'est lui qui permet de **vérifier à l'œil** qu'aucune valeur n'a disparu |
| 5 | **Configuration** | Liste des variables d'environnement de Railway (**noms seulement**, jamais les valeurs) + `drizzle.__drizzle_migrations` | Permet de constater une variable manquante (ex. `PRAYER_DB_URL`, §2.9.3) |

### 4.1.3 La sauvegarde n'existe qu'une fois restaurée à blanc

```text
1. Créer une base jetable (jamais la production, jamais la base de développement).
2. pg_restore la sauvegarde SB-0 dans cette base.
3. Exécuter §5.1 sur les deux bases et COMPARER les comptages.
4. Si un seul comptage diverge : la sauvegarde est INCORRECTE, la migration
   ne peut pas commencer.
5. Détruire la base jetable (ou la conserver comme banc d'essai de É3).
```

> **Aucune migration ne commence sans une restauration à blanc réussie.** Une
> sauvegarde non testée est une hypothèse, pas une garantie — et la §4.3.3 montre
> qu'une étape n'a **que** ce filet.

## 4.2 Ce qui doit être consigné hors base, avant chaque étape destructive

Quatre relevés, **copiés hors de la base** (fichier versionné, jamais dans une
table), car ils constituent la seule trace de l'état antérieur :

```text
R-1  AVANT É21 — les comptes
     SELECT id, username, display_name, role::text, is_active FROM admin_profiles;

R-2  AVANT É23 — les rattachements
     SELECT id, title, slug, department_id, department.name AS avant
     FROM events LEFT JOIN departments ON … ORDER BY event_date;
     SELECT id, title, slug, status, published_at FROM publications ORDER BY published_at;

R-3  AVANT É24 — l'état d'archivage  ← LE PLUS IMPORTANT
     SELECT id, title, slug, status, published_at, archived_at
     FROM publications ORDER BY published_at, id;
     → conserver le HASH de ce résultat, et le comparer après É24 : le nombre
       de lignes doit être IDENTIQUE et seules les colonnes status/archived_at
       doivent avoir changé.

R-4  AVANT É33 — les prières  (selon la décision Q-S5)
     SELECT count(*) AS total,
            count(requester_contact) AS contact_not_null
     FROM prayer_requests;
     → AUCUNE valeur de contenu n'est copiée hors base sans décision explicite (Q-S5),
       et requester_contact ne peut JAMAIS être exporté (D-17).
```

## 4.3 Portes de sortie, étape par étape — pour chaque étape destructive

### 4.3.1 `É21` — Reconstruction de `admin_role` — **porte de sortie conditionnelle**

**Retour arrière :** reconstruire le type inverse depuis `admin_role_old` — sauf que
`DROP TYPE admin_role_old` l'a supprimé à la fin de `É21`. La procédure inverse est
donc :

```sql
-- Retour arrière de É21 (à écrire AVANT d'exécuter É21)
ALTER TYPE admin_role RENAME TO admin_role_new;
CREATE TYPE admin_role AS ENUM ('ROLE_ADMIN');
ALTER TABLE admin_profiles
  ALTER COLUMN role TYPE admin_role
    USING (CASE role::text WHEN 'ADMIN' THEN 'ROLE_ADMIN' ELSE role::text END)::admin_role;
DROP TYPE admin_role_new;
```

**⚠️ La porte de sortie se referme** dès qu'un compte porte `SUPER_ADMIN` ou
`DEPARTMENT_MANAGER` : le `CASE` n'a **pas** de branche pour ces valeurs, et
`ALTER COLUMN … USING` **échouerait**. Or `É27` crée précisément un `SUPER_ADMIN`.

> **Conséquence normative : `É21` doit être exécuté et validé AVANT `É27`.**
> L'ordre de §3 respecte cette contrainte. Après `É27`, la seule sortie est la
> restauration complète (SB-1).
>
> **Justification de la porte de sortie partielle :** elle est **suffisante** si
> aucune donnée nouvelle n'a été créée entre `É21` et `É27` — ce que l'ordre impose.
> Elle est **explicitement fermée** au-delà, et ce n'est pas un défaut : convertir
> les rôles est un acte **irréversible par nature** dès lors qu'une valeur neuve
> est en service.

### 4.3.2 `É28` — `NOT NULL` + `RESTRICT` sur `events` et `publications` — **porte de sortie partielle**

**Retour arrière structurel : immédiat et documenté.**

```sql
ALTER TABLE public.events        ALTER COLUMN department_id DROP NOT NULL;
ALTER TABLE public.events        DROP CONSTRAINT events_department_id_departments_id_fk;
ALTER TABLE public.events        ADD  CONSTRAINT events_department_id_departments_id_fk
  FOREIGN KEY (department_id) REFERENCES public.departments (id) ON DELETE SET NULL;
-- idem publications (DROP NOT NULL ; la FK RESTRICT peut rester : elle ne
-- contraint pas la nullabilité, seulement la suppression du parent)
```

**Ce qui n'est PAS récupérable :** l'**information** « ces 2 événements étaient sans
département » et « ces 10 publications n'étaient rattachées à rien ». Le retour
arrière **remet la capacité**, pas les `NULL`. Cette information n'existe que dans
**R-2** (§4.2) et dans la sauvegarde SB-0.

> **Justification : la perte est réelle mais acceptable et documentée** — elle est
> **exactement** ce que D-26 demande de perdre (« un événement global au sens d'un
> `department_id = NULL` **n'existe pas** »). Un plan qui prétendrait la conserver
> contredirait la décision. Elle est **conservée hors base**, dans R-2.

### 4.3.3 `É24` — Archivage rétroactif — **AUCUNE porte de sortie en base**

**C'est la seule étape de tout le plan dans ce cas, et il faut l'écrire sans détour.**

| Ce qui l'empêche d'être réversible | Fondement |
| --- | --- |
| `PUBLISHED → ARCHIVED` est **irréversible** | **D-18**, mot pour mot : « une publication archivée ne redevient pas automatiquement `PUBLISHED` ». |
| La base **refuse** le retour | Trigger `publications_forbid_unarchive` (`032` §3.9) : `RAISE EXCEPTION … check_violation` sur toute transition `ARCHIVED → {DRAFT, PUBLISHED}` **et** sur toute modification de `archived_at`. Vaut pour **tous** les rôles, y compris `SUPER_ADMIN`, et **y compris une écriture SQL directe**. |
| L'application refuse aussi | `PublicationPolicy.canUnarchive` → `false` pour **tout le monde** (`029` §2.4, cellule 3.8). |

**La seule sortie est donc une restauration complète** (SB-2 + toutes les
sauvegardes intermédiaires), qui **annule aussi tout ce qui a été fait depuis** —
donc en pratique, à ce stade, **rien d'autre n'est annulable sans tout annuler**.

**Mesures compensatoires, et elles sont obligatoires :**

1. `É24` est exécuté **après** SB-2 et le relevé **R-3** — donc la liste exacte des
   lignes archivées et leur état antérieur sont connus.
2. La requête d'archivage est **écrite en `SELECT` d'abord**, relue, et le nombre de
   lignes attendu est **confirmé** avant l'`UPDATE`.
3. `É24` est **isolé dans sa propre migration** : aucune autre écriture ne peut
   « profiter » de la transaction et rendre le diagnostic ambigu.
4. **L'ordre R-C → R-D → R-A de §2.7.3 doit être épuisé avant** : `É24` ne doit
   archiver que ce qui est **strictement inévitable**.

> **Justification de l'absence de porte de sortie : elle est imposée par D-18, qui
> est une décision arrêtée du commanditaire et non un choix de ce plan.** D-18
> qualifie lui-même la transition d'irréversible. Prétendre offrir un retour
> arrière contredirait la décision. La protection réelle est donc **en amont** :
> maximiser les options évitant l'archivage (§2.7.3), et **documenter** ce qui est
> archivé.

### 4.3.4 `É10` — Ajout de la valeur `ARCHIVED` — **porte de sortie coûteuse, sans perte**

Retirer une valeur d'une énumération PostgreSQL exige la reconstruction du type
(`032` §2.1). Le retour arrière est donc possible **avant** que des lignes
n'utilisent `ARCHIVED` :

```sql
ALTER TYPE publication_status RENAME TO publication_status_old;
CREATE TYPE publication_status AS ENUM ('DRAFT','PUBLISHED');
ALTER TABLE public.publications
  ALTER COLUMN status TYPE publication_status
    USING (CASE status::text
             WHEN 'ARCHIVED' THEN 'PUBLISHED'   -- ⚠ perd l'information d'archivage
             ELSE status::text END)::publication_status;
DROP TYPE publication_status_old;
```

**⚠️ Le `CASE` doit mapper `ARCHIVED` quelque part** : après `É24`, ce retour
arrière **reclasserait en `PUBLISHED`** les publications archivées — donc
**restaurerait à tort** des publications hors du flux courant, et **violerait D-18
dans l'autre sens**. Donc : **`É10` n'est réversible que tant que 0 ligne porte
`ARCHIVED`**, c'est-à-dire **avant `É24`**. C'est exactement pourquoi `É10` est en
phase **A** et `É24` en phase **D**.

### 4.3.5 `É33` — Suppression de `prayer_requests`, de `requester_contact` et de `prayer_confidentiality` — **AUCUNE porte de sortie, et c'est justifié**

| Objet perdu | Porte de sortie | Justification |
| --- | --- | --- |
| `public.prayer_requests` (table entière) | **Aucune en base.** La sauvegarde SB-3 existe, mais **sa restauration réintroduirait `requester_contact`** — donc **violerait D-17**. | **D-17 est une décision de protection des personnes**, pas une optimisation de schéma : « Le contact est exclu du modèle. Il ne doit survivre **nulle part** ». `docs/032` §7.2 ligne 16 écrit qu'« **aucune alternative ne permet de conserver ces données dans le modèle cible**, et c'est **par décision** ». |
| `requester_contact` (la colonne) | Idem. | Idem. Un retour arrière **inverserait une garantie de confidentialité**. |
| `prayer_confidentiality` (`private`, `community`) | **Structurellement réversible**, sans donnée à perdre. | L'information est **remplacée** par `is_anonymous` (D-15, `030` §9 E4) — mais les deux valeurs ne distinguent pas l'anonymat, elles distinguent un **niveau de diffusion** qui **n'existe plus** (D-10 : l'`ADMIN` seul voit). `032` §9.3 le dit : « aucune donnée métier n'est perdue ». |
| `prayer_status` (`NEW`, `PRAYED`) | **Structurellement réversible.** | `NEW → PENDING` est direct. **`PRAYED` n'a pas d'équivalent** : `ARCHIVED` signifie « validé », **pas** « prié ». La correspondance est **non tranchée** (`032` §9.3) — mais **sans objet ici** : la table est vide, et elle est de toute façon détruite. |
| Les 2 index `prayer_requests_*` | Avec la table. | Aucun autre objet ne les utilise. **Vérifié** : aucune FK, aucune vue, aucune contrainte de la base ne référence `prayer_requests`. |

> **Note de sécurité :** conserver SB-3 « au cas où » **prolonge la vie du contact
> interdit** dans un fichier de sauvegarde. La politique de rétention des
> sauvegardes (§4.4) doit donc **décider explicitement** du sort de SB-3. Ne pas
> décider reviendrait à laisser le contact survivre ailleurs que dans la base —
> exactement ce que D-17 interdit.

### 4.3.6 `É35` — Retrait de la clé de réglage héritée — **porte de sortie simple**

`DELETE FROM site_settings WHERE key = 'site.ecodimFoundedAt'`. Retour :
`INSERT` de la paire `('site.ecodimFoundedAt', '2 juillet 2023')` — la valeur étant
connue et recopiée dans `site.ecodumeFoundedAt` en `É4`, **aucune information n'est
perdue**. **Réversible à 100 %.**

### 4.3.7 Étapes à retour arrière immédiat

> **Précision de vocabulaire, pour lever une ambiguïté :** cette sous-section
> regroupe les étapes dont le retour arrière est **écrit en une instruction**.
> `É22`, `É25` et `É35` y figurent **bien qu'elles soient classées destructives en
> §3.3** : elles sont destructives **d'effet** (elles changent un contrat d'URL, un
> libellé public, une clé de réglage) et **réversibles de forme**. La distinction
> est maintenue volontairement : *destructif* qualifie l'**effet métier**,
> *réversible* qualifie l'**opération technique**. Une étape peut être les deux.

| Étape | Retour arrière |
| --- | --- |
| `É4` | `DELETE` la clé ajoutée. |
| `É9`, `É16`, `É17` | `DROP COLUMN` / `DROP TRIGGER` / `DROP TYPE`. **Aucune information préexistante concernée.** |
| `É11`, `É12`, `É13`, `É14` | `DROP COLUMN` / `DROP CONSTRAINT` / `DROP TYPE`. |
| `É18`, `É19` | `DROP TABLE` / `DROP SCHEMA prayer_private CASCADE`. **0 ligne métier concernée.** |
| `É20` | `GRANT` inverse. |
| `É22` | `UPDATE` inverse, tant que le code N est déployé. |
| `É23` | `UPDATE … SET department_id = NULL` — **tant que `É28` n'est pas posé**. |
| `É26` | `DELETE` des lignes `scriptures` ajoutées. |
| `É27` | `DELETE` la ligne + désactiver le compte Auth. |
| `É29` | `DROP INDEX` + `DROP COLUMN published_slot`. |
| `É30` | `DROP TRIGGER` + `DROP FUNCTION`. **Décision, pas simple annulation** (§3.3). |
| `É31`, `É32` | `DROP CONSTRAINT` / `DROP TRIGGER` / `DROP INDEX`. |

## 4.4 Rétention des sauvegardes — une décision à prendre, et elle n'est pas prise

**Aucune décision de `028` → `032` ne fixe la durée de conservation des
sauvegardes.** Deux exigences se contredisent :

| Exigence | Effet sur SB-3 |
| --- | --- |
| **D-17** — le contact « ne doit survivre nulle part » | Pousse à **détruire** SB-3 dès que `É33` est validé. |
| **Praticabilité opérationnelle** — pouvoir revenir en arrière | Pousse à **conserver** SB-3 le temps de la stabilisation. |

> → §7, **Q-NT11**. **Tant que ce point n'est pas tranché, SB-3 est conservé, et ce
> choix est signalé** — laisser SB-3 exister sans le dire serait la faute.

---

# 5. Vérifications post-migration

**Les requêtes de cette section sont des contrôles.** Elles sont écrites en SQL,
prêtes à exécuter, et **aucune n'écrit**. Elles doivent toutes être exécutées en
`É34`, et **chacune a un critère d'échec explicite**.

## 5.1 Comptages avant / après

**À exécuter avant `É4` et après `É33`.** Les valeurs « référence » sont celles
**mesurées** en §1.1 sur la base interrogée ; **en production, elles doivent être
mesurées et non supposées** (§0.2).

```sql
-- C-1 — INVARIANT DE NON-PERTE : aucune ligne ne doit disparaître.
-- Exécuter AVANT et APRÈS. Comparer les deux résultats ligne à ligne.
-- ÉCHEC si une table perd une ligne, SAUF prayer_requests (supprimée, 0 → 0).
SELECT 'admin_profiles'   AS table_name, count(*) AS lignes FROM public.admin_profiles
UNION ALL SELECT 'departments',        count(*) FROM public.departments
UNION ALL SELECT 'department_media',   count(*) FROM public.department_media
UNION ALL SELECT 'events',             count(*) FROM public.events
UNION ALL SELECT 'event_media',        count(*) FROM public.event_media
UNION ALL SELECT 'publications',       count(*) FROM public.publications
UNION ALL SELECT 'media',              count(*) FROM public.media
UNION ALL SELECT 'community_faces',    count(*) FROM public.community_faces
UNION ALL SELECT 'leaders',            count(*) FROM public.leaders
UNION ALL SELECT 'testimonies',        count(*) FROM public.testimonies
UNION ALL SELECT 'schedule_entries',   count(*) FROM public.schedule_entries
UNION ALL SELECT 'scriptures',         count(*) FROM public.scriptures
UNION ALL SELECT 'site_settings',      count(*) FROM public.site_settings
UNION ALL SELECT 'social_links',       count(*) FROM public.social_links
UNION ALL SELECT 'static_pages',       count(*) FROM public.static_pages
ORDER BY table_name;
-- Référence mesurée (base de backend/.env) :
--   1, 3, 18, 7, 18, 10, 28, 5, 5, 4, 6, 7, 15, 2, 6
-- ÉCHEC : toute différence non expliquée par une décision écrite.
--   Seule évolution légitime : scriptures 7 -> 9 ou 10  (É26, M-F4)
--                              site_settings 15 -> 16 -> 15 (É4 puis É35)
--                              static_pages 6 -> 6 (AUCUNE ligne créée, §2.10.2)
```

```sql
-- C-2 — LES DEUX COMPTAGES QUI DOIVENT ÊTRE IDENTIQUES, à la ligne près.
-- ÉCHEC si l'une des deux valeurs change : la migration a perdu du contenu.
SELECT (SELECT count(*) FROM public.events)       AS evenements,   -- attendu 7
       (SELECT count(*) FROM public.publications) AS publications; -- attendu 10
```

```sql
-- C-3 — Répartition des événements : elle ne doit PAS avoir changé,
--       sauf pour les 2 lignes à NULL qui reçoivent un rattachement (É23).
SELECT d.name AS departement, count(*) AS evenements
FROM public.events e
LEFT JOIN public.departments d ON d.id = e.department_id
GROUP BY d.name
ORDER BY d.name;
-- AVANT (mesuré) : Adultes 2 · Chorale 2 · Enfants / Ecodim 1 · (NULL) 2
-- APRÈS          : Adultes 2 · Chorale 2 · Ecodume 1 · <Q-S2> 2   [total 7]
-- ÉCHEC : total différent de 7, ou une répartition autre que celle décidée.
```

```sql
-- C-4 — Publications : état d'archivage. Seul contrôle qui peut LÉGITIMEMENT
--       montrer un changement — c'est celui de É24.
SELECT status, count(*) AS n FROM public.publications GROUP BY status ORDER BY status;
-- AVANT (mesuré) : PUBLISHED 10
-- APRÈS         : PUBLISHED n · ARCHIVED 10-n   [n + (10-n) = 10]
-- ÉCHEC : total différent de 10.
```

## 5.2 Absence d'orphelin

**ÉCHEC pour toute requête rendant une valeur > 0.**

```sql
-- C-5 — Événements sans département (aurait dû être rendu impossible par É28).
SELECT count(*) AS evenements_orphelins
FROM public.events WHERE department_id IS NULL;
-- Attendu : 0    (ÉCHEC : NOT NULL non posé, ou posé sans conformité)

-- C-6 — Publications sans département.
SELECT count(*) AS publications_orphelines
FROM public.publications WHERE department_id IS NULL;
-- Attendu : 0

-- C-7 — Événements pointant vers un département inexistant.
SELECT count(*) AS events_fk_cassees
FROM public.events e
WHERE NOT EXISTS (SELECT 1 FROM public.departments d WHERE d.id = e.department_id);
-- Attendu : 0

-- C-8 — Le même contrôle pour les 10 chemins de référence de la base.
SELECT 'departments.banner' AS reference, count(*) AS casses
  FROM public.departments x WHERE x.banner_media_id IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM public.media m WHERE m.id = x.banner_media_id)
UNION ALL
SELECT 'events.image', count(*) FROM public.events x WHERE x.image_media_id IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM public.media m WHERE m.id = x.image_media_id)
UNION ALL
SELECT 'events.banner', count(*) FROM public.events x WHERE x.banner_media_id IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM public.media m WHERE m.id = x.banner_media_id)
UNION ALL
SELECT 'events.department', count(*) FROM public.events x WHERE x.department_id IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM public.departments d WHERE d.id = x.department_id)
UNION ALL
SELECT 'publications.cover', count(*) FROM public.publications x WHERE x.cover_media_id IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM public.media m WHERE m.id = x.cover_media_id)
UNION ALL
SELECT 'publications.department', count(*) FROM public.publications x WHERE x.department_id IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM public.departments d WHERE d.id = x.department_id)
UNION ALL
SELECT 'leaders.photo', count(*) FROM public.leaders x WHERE x.photo_media_id IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM public.media m WHERE m.id = x.photo_media_id)
UNION ALL
SELECT 'leaders.department', count(*) FROM public.leaders x WHERE x.department_id IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM public.departments d WHERE d.id = x.department_id)
UNION ALL
SELECT 'testimonies.photo', count(*) FROM public.testimonies x WHERE x.photo_media_id IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM public.media m WHERE m.id = x.photo_media_id)
UNION ALL
SELECT 'community_faces.photo', count(*) FROM public.community_faces x WHERE x.photo_media_id IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM public.media m WHERE m.id = x.photo_media_id)
ORDER BY reference;
-- Attendu : 0 sur les 10 lignes.

-- C-9 — Médias orphelins : aucune ligne media sans aucun usage.
SELECT count(*) AS medias_orphelins
FROM public.media m
WHERE NOT EXISTS (SELECT 1 FROM public.department_media x WHERE x.media_id = m.id)
  AND NOT EXISTS (SELECT 1 FROM public.event_media x      WHERE x.media_id = m.id)
  AND NOT EXISTS (SELECT 1 FROM public.departments   d    WHERE d.banner_media_id = m.id)
  AND NOT EXISTS (SELECT 1 FROM public.events        e    WHERE e.image_media_id = m.id
                                                             OR e.banner_media_id = m.id)
  AND NOT EXISTS (SELECT 1 FROM public.publications  p    WHERE p.cover_media_id = m.id)
  AND NOT EXISTS (SELECT 1 FROM public.leaders       l    WHERE l.photo_media_id = m.id)
  AND NOT EXISTS (SELECT 1 FROM public.testimonies   t    WHERE t.photo_media_id = m.id)
  AND NOT EXISTS (SELECT 1 FROM public.community_faces f  WHERE f.photo_media_id = m.id);
-- Attendu AVANT (mesuré) : 0 — APRÈS : 0. La migration ne touche aucun média.

-- C-10 — Galeries : 18 + 18 lignes attendues, aucune orpheline.
SELECT 'department_media' AS t, count(*) AS n FROM public.department_media
UNION ALL SELECT 'event_media', count(*) FROM public.event_media;
-- Attendu : 18 et 18.
```

## 5.3 Absence de `NULL` sur les colonnes devenues obligatoires

**Contrôle générique — il couvre toute colonne `NOT NULL` ajoutée, sans qu'on ait à
les énumérer.** C'est le contrôle le plus robuste de cette section : il ne peut pas
« oublier » une colonne.

```sql
-- C-11 — TOUTE colonne NOT NULL de public.* doit être sans NULL.
--        Une violation signifie qu'une contrainte a été posée alors que des
--        données ne l'étaient pas — donc que l'ordre données → contraintes
--        n'a pas été respecté.
DO $$
DECLARE r record; n bigint;
BEGIN
  FOR r IN
    SELECT c.table_name, c.column_name, c.data_type
    FROM information_schema.columns c
    JOIN information_schema.tables t
      ON t.table_schema = c.table_schema AND t.table_name = c.table_name
    WHERE c.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
      AND c.is_nullable = 'NO'
      AND c.data_type NOT IN ('ARRAY','USER-DEFINED')
  LOOP
    EXECUTE format('SELECT count(*) FROM public.%I WHERE %I IS NULL',
                   r.table_name, r.column_name) INTO n;
    IF n > 0 THEN
      RAISE WARNING 'NULL interdit : public.%.%  (% ligne(s))',
                    r.table_name, r.column_name, n;
    END IF;
  END LOOP;
END $$;
-- ÉCHEC : toute ligne « WARNING » émise.

-- C-12 — Les 6 colonnes explicitement devenues obligatoires (contrôle nommé).
SELECT
  (SELECT count(*) FROM public.events       WHERE department_id  IS NULL) AS events_dept_null,
  (SELECT count(*) FROM public.publications WHERE department_id  IS NULL) AS publications_dept_null,
  (SELECT count(*) FROM public.static_pages WHERE template       IS NULL) AS pages_template_null,
  (SELECT count(*) FROM public.static_pages WHERE contract_version IS NULL) AS pages_version_null,
  (SELECT count(*) FROM public.admin_profiles WHERE scope        IS NULL) AS profils_scope_null;
-- Attendu : 0, 0, 0, 0, 0

-- C-13 — Cohérence role / scope / department_id (D-02, CHECK de 032 §3.3).
SELECT count(*) AS profils_incoherents
FROM public.admin_profiles
WHERE NOT (
        (role = 'DEPARTMENT_MANAGER' AND scope = 'DEPARTMENT' AND department_id IS NOT NULL)
     OR (role <> 'DEPARTMENT_MANAGER' AND scope = 'GLOBAL'      AND department_id IS NULL)
      );
-- Attendu : 0

-- C-14 — Aucun rôle hérité ne subsiste (D-05, É21).
SELECT count(*) AS role_herite
FROM public.admin_profiles WHERE role::text = 'ROLE_ADMIN';
-- Attendu : 0

-- C-15 — L'énumération ne contient QUE les 3 rôles de D-01.
SELECT string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) AS roles
FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
WHERE t.typname = 'admin_role';
-- Attendu : « SUPER_ADMIN, ADMIN, DEPARTMENT_MANAGER »   (ordre exact)

-- C-16 — Cohérence status / archived_at (D-18, CHECK de 032 §3.6).
SELECT count(*) AS archives_incoherentes
FROM public.publications
WHERE (status = 'ARCHIVED') <> (archived_at IS NOT NULL);
-- Attendu : 0

-- C-17 — Règle des 3 : la borne est-elle respectée ? (par département)
SELECT d.name AS departement, count(*) AS publiees
FROM public.publications p
JOIN public.departments d ON d.id = p.department_id
WHERE p.status = 'PUBLISHED'
GROUP BY d.name HAVING count(*) > 3
ORDER BY publiees DESC;
-- Attendu : AUCUNE ligne (ÉCHEC : É24 ou É29 n'a pas rempli sa fonction)

-- C-18 — Portée des événements (D-26) : aucune valeur inattendue.
SELECT visibility_scope, count(*) AS n FROM public.events GROUP BY visibility_scope;
-- Attendu : DEPARTMENT | 7   (aucun GLOBAL : aucune capacité n'est attribuée, §2.5.1)

-- C-19 — Trigger de capacité : un GLOBAL sans capacité DOIT être refusé.
--        Test négatif, à exécuter dans une transaction ANNULÉE.
-- BEGIN;
--   UPDATE public.events SET visibility_scope = 'GLOBAL' WHERE id = (SELECT id FROM public.events LIMIT 1);
--   -- Attendu : ERROR check_violation « ne détient pas la capacité EVENT_SCOPE_GLOBAL »
-- ROLLBACK;
```

## 5.4 Absence d'`Ecodim` résiduel (D-09)

**Critère : 0 occurrence, hors les slugs de contenu si `Q-NT2-bis` a décidé de les
conserver** — et **0** dans tous les cas si la conservation n'a pas été décidée.

```sql
-- C-20 — Recherche dans TOUTES les colonnes texte du schéma public.
--        Générique : aucune colonne n'est oubliée.
DO $$
DECLARE r record; n bigint;
BEGIN
  FOR r IN
    SELECT c.table_name, c.column_name
    FROM information_schema.columns c
    JOIN information_schema.tables t
      ON t.table_schema = c.table_schema AND t.table_name = c.table_name
    WHERE c.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
      AND c.data_type IN ('character varying','text','character')
  LOOP
    EXECUTE format('SELECT count(*) FROM public.%I WHERE %I ILIKE ''%%ecodim%%''',
                   r.table_name, r.column_name) INTO n;
    IF n > 0 THEN
      RAISE WARNING 'Ecodim résiduel : public.%.%  (% ligne(s))',
                    r.table_name, r.column_name, n;
    END IF;
  END LOOP;
END $$;
-- ÉCHEC : toute ligne « WARNING » émise.
-- Valeurs attendues AVANT migration (mesuré, §2.2.2) :
--   departments 4 · events 5 · publications 3 · leaders 3 · testimonies 1
--   community_faces 1 · schedule_entries 1 · site_settings 2 · static_pages 0
```

```sql
-- C-21 — Les colonnes de TEXTE LIBRE : contrôle nommé, plus lisible.
SELECT 'departments' AS t, count(*) AS residus FROM public.departments
  WHERE concat_ws(' ', name, description, tagline, responsible_name,
                        meeting_schedule, array_to_string(key_points,' ')) ILIKE '%ecodim%'
UNION ALL SELECT 'events',      count(*) FROM public.events
  WHERE concat_ws(' ', title, excerpt, description, location,
                        array_to_string(practical_info,' ')) ILIKE '%ecodim%'
UNION ALL SELECT 'publications', count(*) FROM public.publications
  WHERE concat_ws(' ', title, description, array_to_string(body,' ')) ILIKE '%ecodim%'
UNION ALL SELECT 'leaders',     count(*) FROM public.leaders
  WHERE concat_ws(' ', name, role, scope, bio) ILIKE '%ecodim%'
UNION ALL SELECT 'testimonies', count(*) FROM public.testimonies
  WHERE quote ILIKE '%ecodim%'
UNION ALL SELECT 'community_faces', count(*) FROM public.community_faces
  WHERE caption ILIKE '%ecodim%'
UNION ALL SELECT 'schedule_entries', count(*) FROM public.schedule_entries
  WHERE concat_ws(' ', title, audience) ILIKE '%ecodim%'
UNION ALL SELECT 'site_settings', count(*) FROM public.site_settings
  WHERE key ILIKE '%ecodim%' OR value ILIKE '%ecodim%'
UNION ALL SELECT 'static_pages', count(*) FROM public.static_pages
  WHERE content::text ILIKE '%ecodim%'
ORDER BY t;
-- Attendu APRÈS migration : 0 sur les 9 lignes.
```

```sql
-- C-22 — Les IDENTIFIANTS : nom et slug du département (M-A1).
SELECT name, slug FROM public.departments ORDER BY position;
-- Attendu : Adultes | adultes · Ecodume | <slug tranché> · Chorale | chorale
-- ÉCHEC : 'ecodim' ou 'enfants-ecodim' subsiste dans l'un des deux.

-- C-23 — Les slugs de CONTENU (M-A3, Q-NT2-bis).
SELECT 'events' AS t, slug FROM public.events       WHERE slug ILIKE '%ecodim%'
UNION ALL
SELECT 'publications', slug FROM public.publications WHERE slug ILIKE '%ecodim%'
ORDER BY 1, 2;
-- Attendu : 3 lignes SI la conservation a été décidée (D-20),
--           0 ligne SI le renommage a été décidé (D-09).
--           Aucune autre valeur n'est acceptable : la décision doit être
--           appliquée INTÉGRALEMENT, sans mélange.

-- C-24 — Le code : recherche de « ecodim » hors slugs de contenu conservés.
--   grep -ri "ecodim" frontend/src backend/src backend/openapi.yaml
-- Attendu APRÈS É35 : 0 occurrence — sauf, si décidé, les 3 slugs ci-dessus.
-- ÉCHEC : toute occurrence de « Ecodim » dans une CLÉ technique
--   (ex. images.ecodim, slug littéral dans OrganisationExplorer.tsx).
```

```sql
-- C-25 — Clés de réglage : la clé héritée doit avoir disparu (É35).
SELECT key FROM public.site_settings
WHERE key IN ('site.ecodimFoundedAt','site.ecodumeFoundedAt') ORDER BY key;
-- Attendu : « site.ecodumeFoundedAt » UNIQUEMENT — et sa valeur = '2 juillet 2023'.
-- ÉCHEC : les deux clés subsistent (É35 non exécuté), ou aucune (valeur perdue).
```

## 5.5 Absence de `requester_contact` (D-17)

**Critère : 0 résultat partout, dans `public` ET dans `prayer_private`.** C'est le
contrôle le plus important de cette section : D-17 exige que le champ « ne survive
**nulle part** ».

```sql
-- C-26 — LA requête de D-17 : aucune TABLE ne porte un nom de contact.
SELECT table_schema, table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema IN ('public','prayer_private')
  AND column_name ~* '(contact|phone|telephone|email|mail|whatsapp|adresse|address)'
ORDER BY 1, 2, 3;
-- Attendu : 0 ligne.
-- ⚠ « address » est inclus volontairement : D-17 vise le CONTACT DU DEMANDEUR.
--   site.addressLine1/2/3 concernent l'ADRESSE DE L'ÉGLISE et restent légitimes.
--   Si elles apparaissent, VÉRIFIER qu'il s'agit bien des clés institutionnelles
--   (site_settings.key) et non d'une colonne d'une table de prière.

-- C-27 — La table de prière publique a disparu (M-E2, É33).
SELECT table_schema, table_name FROM information_schema.tables
WHERE table_name LIKE '%prayer%' ORDER BY 1, 2;
-- Attendu : prayer_private.prayer_audit_event · prayer_private.prayer_request
--           prayer_private.data_key_envelope · prayer_private.crypto_key
-- ÉCHEC : public.prayer_requests subsiste.

-- C-28 — Le schéma du magasin ne porte AUCUNE colonne de contact
--        (CHECK prayer_request_no_contact_columns, 032 §3.1.1).
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'prayer_private' AND table_name = 'prayer_request'
  AND column_name ~* '(contact|phone|telephone|email|mail|whatsapp)';
-- Attendu : 0 ligne.

-- C-29 — Le schéma du magasin ne porte AUCUNE colonne de secret
--        (CHECK prayer_request_no_secret_columns, 032 §3.1.1).
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'prayer_private'
  AND column_name ~* '(private|secret|seed|share|passphrase|master_key|dek$)'
  AND column_name NOT IN ('key_reference','message_key_reference','name_key_reference');
-- Attendu : 0 ligne.

-- C-30 — Les contraintes de vérification D-17 et D-11 sont EN PLACE.
SELECT conname FROM pg_constraint
WHERE conrelid = 'prayer_private.prayer_request'::regclass
  AND conname IN ('prayer_request_no_contact_columns',
                  'prayer_request_no_secret_columns',
                  'prayer_request_anonymity_coherence');
-- Attendu : les 3 noms.

-- C-31 — Aucune donnée de prière n'a été migrée ni réintroduite.
SELECT count(*) AS demandes_migrees FROM prayer_private.prayer_request;
-- Attendu : 0 (§2.9.2 : la migration ne copie AUCUNE ligne).

-- C-32 — Le type de confidentialité a disparu.
SELECT count(*) AS type_residuel FROM pg_type WHERE typname = 'prayer_confidentiality';
-- Attendu : 0

-- C-33 — Les états de prière sont ceux de 030 §3.6.1 (É33).
SELECT string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) AS etats
FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'prayer_status';
-- Attendu : « PENDING, ARCHIVED »   (NEW et PRAYED ont disparu)
```

```text
-- C-34 — Contrôle du SCHÉMA complet, hors SQL (complément indispensable)
--   pg_dump --schema-only --schema=public --schema=prayer_private > schema.sql
--   puis :  grep -in "contact"  schema.sql        → attendu : 0 occurrence
--           grep -in "requester_" schema.sql      → attendu : 0 occurrence
--           grep -in "private_key\|secret\|dek"   schema.sql → attendu : 0 occurrence
-- C'est le contrôle « nulle part » de D-17 : il couvre les noms de
-- contraintes, d'index, de types et de commentaires — pas seulement les colonnes.
```

## 5.6 Cohérence du nouveau modèle — les invariants de `docs/030`/`032`

**ÉCHEC pour toute requête rendant une valeur > 0, ou pour toute valeur inattendue.**

```sql
-- C-35 — Aucune valeur PRAYER_* dans le journal d'audit général (030 A11, 032 §5.3).
SELECT unnest(enum_range(NULL::audit_action))::text AS action
WHERE unnest(enum_range(NULL::audit_action))::text ~* 'prayer';
-- Attendu : 0 ligne.
-- ÉCHEC : un événement de prière serait lisible par le SUPER_ADMIN (D-10).

-- C-36 — Aucune notification de prière ne peut viser un non-ADMIN actif
--        (CHECK notifications_prayer_recipient_is_admin, 032 §3.8).
SELECT count(*) AS notifications_illegitimes
FROM public.notifications n
WHERE n.type = 'PRAYER_REQUEST_RECEIVED'
  AND NOT EXISTS (SELECT 1 FROM public.admin_profiles p
                  WHERE p.id = n.recipient_user_id AND p.role = 'ADMIN' AND p.is_active);
-- Attendu : 0

-- C-37 — Aucune table de public ne référence le domaine des prières
--        (couche 5 de l'exclusion du SUPER_ADMIN, 032 §5.3).
SELECT conrelid::regclass::text AS table_source,
       confrelid::regclass::text AS table_cible
FROM pg_constraint
WHERE contype = 'f' AND confrelid::regclass::text LIKE '%prayer%';
-- Attendu : 0 ligne. (Une FK franchirait la frontière de privilèges.)

-- C-38 — Les 4 tables du magasin existent et sont VIDES.
SELECT 'prayer_request'    AS t, count(*) AS n FROM prayer_private.prayer_request
UNION ALL SELECT 'data_key_envelope', count(*) FROM prayer_private.data_key_envelope
UNION ALL SELECT 'crypto_key',        count(*) FROM prayer_private.crypto_key
UNION ALL SELECT 'prayer_audit_event',count(*) FROM prayer_private.prayer_audit_event;
-- Attendu : 0, 0, 0, 0

-- C-39 — Les deux rôles PostgreSQL existent et sont disjoints (030 §4.6, 032 §5.4.1).
SELECT rolname FROM pg_roles WHERE rolname IN ('ccjv_app','prayers_api') ORDER BY 1;
-- Attendu : les 2 noms.  ÉCHEC si l'un manque : voir §2.9.3 et Q-NT8.

-- C-40 — Test d'EFFECTIVITÉ de l'isolation (celui qui compte vraiment).
--   Depuis une connexion ouverte avec le rôle applicatif principal :
--     SELECT count(*) FROM prayer_private.prayer_request;
--   Attendu : ERROR 42501 insufficient_privilege
--   ÉCHEC si la requête RÉUSSIT : le REVOKE de É20 était un no-op (§2.9.3).

-- C-41 — Les capacités de département sont vides (aucune n'est inventée, §2.11.2).
SELECT count(*) AS capacites FROM public.department_capabilities;
-- Attendu : 0   (aucune capacité n'est attribuée sans décision Q-S6/Q-S8)

-- C-42 — Les nouveaux objets de D-21 sont en place.
SELECT count(*) AS droits_media FROM public.media_access;   -- attendu 0 (D-22)
```

```sql
-- C-43 — Les index de CONTRAINTE sont en place : c'est par eux que les règles
--        de D-18 et D-21 deviennent inviolables.
SELECT indexname FROM pg_indexes
WHERE schemaname IN ('public','prayer_private')
  AND indexname IN (
    'publications_max_three_published_per_department',
    'media_access_department_unique',
    'media_access_profile_unique',
    'data_key_envelope_active_unique',
    'crypto_key_active_slot_uidx',
    'static_pages_page_key_idx',
    'departments_slug_idx',
    'scriptures_key_idx')
ORDER BY indexname;
-- Attendu : les 8 noms. ÉCHEC si l'un manque : la règle correspondante n'est
-- pas garantie par la base et repose sur la seule discipline applicative.

-- C-44 — Les CONTRAINTES de vérification critiques sont en place.
SELECT conname, conrelid::regclass::text AS table_cible
FROM pg_constraint
WHERE conname IN (
    'events_department_id_departments_id_fk',
    'publications_archived_at_coherence',
    'publications_published_slot_range',
    'admin_profiles_scope_coherence',
    'static_pages_content_is_object',
    'static_pages_no_structure_keys',
    'site_settings_no_prayer_secret',
    'media_access_department_no_delete')
ORDER BY conname;
-- Attendu : les 8 noms.

-- C-45 — Le trigger d'irréversibilité existe (D-18, 032 §3.9).
SELECT tgname FROM pg_trigger
WHERE tgrelid = 'public.publications'::regclass AND NOT tgisinternal;
-- Attendu : « publications_status_immutable » parmi les résultats.

-- C-46 — L'agent de migration Drizzle a bien enregistré les migrations.
SELECT count(*) AS migrations_appliquees FROM drizzle.__drizzle_migrations;
-- AVANT (mesuré) : 1  —  APRÈS : 1 + le nombre de migrations de ce plan.
```

## 5.7 Récapitulatif : les critères d'acceptation de `É34`

| Famille | Requêtes | Critère unique |
| --- | --- | --- |
| Comptages avant/après | C-1 → C-4 | **Aucune ligne perdue.** Les seules évolutions admises sont `scriptures` (+2/+3) et `site_settings` (retour à 15). |
| Absence d'orphelin | C-5 → C-10 | **0** sur les 10 chemins de référence, 0 média orphelin, 18+18 galeries. |
| Colonnes obligatoires | C-11 → C-19 | **0** `NULL` (contrôle générique + nommé), 0 incohérence rôle/scope, 0 archive incohérente, **0 département à plus de 3 `PUBLISHED`**. |
| `Ecodim` résiduel | C-20 → C-25 | **0** occurrence dans les textes · **0** dans les identifiants du département · les 3 slugs de contenu **intégralement** dans l'état décidé. |
| `requester_contact` | C-26 → C-34 | **0** colonne, **0** table, **0** occurrence dans un `pg_dump --schema-only`, les 3 `CHECK` en place, 0 ligne migrée. |
| Nouveau modèle | C-35 → C-46 | 0 `PRAYER_*` dans l'audit général, 0 FK vers le magasin, 4 tables vides, 2 rôles présents, **test d'effectivité réussi**, capacités vides, 8 index de contrainte, 8 `CHECK`, le trigger en place. |

> **Un seul critère non satisfait = `É34` échoue**, et l'étape responsable
> (colonne « retour arrière » de §3.3) est rejouée en inverse.

---

# 6. Impact sur les tests et le déploiement

## 6.1 Les 363 tests

### 6.1.1 Ce que le chiffre de 363 recouvre — mesuré

| Mesure | Valeur |
| --- | --- |
| Suites déclarées par `docs/026` et `docs/029` E-15 | **13 suites · 363 tests** |
| Fichiers `*.test.ts` présents dans `backend/tests/**` | **13** (12 suites + `tests/helpers/database.ts`) |
| Fichiers d'infrastructure | `tests/setup/env.ts` (pose `NODE_ENV=test`, `LOG_LEVEL=silent`) |
| **`it()` / `test()` littéraux comptés statiquement** | **257** |
| Dont **situés dans une boucle `for`** | **45** |
| Table paramétrée `ROUTES_PROTEGEES` | **40 entrées**, vérifiée par garde anti-vacuité (`expect(ROUTES_PROTEGEES.length).toBeGreaterThan(0)`) et **itérée deux fois** |
| **Tests produits à l'exécution** | **> 257** — la différence vient des boucles, dont les 40 routes × 2 passages ≈ **+78** |

**Répartition statique par fichier :**

| Fichier | `it()` |
| --- | --- |
| `tests/integration/routes.test.ts` | 31 *(dont 31 en boucle)* |
| `tests/unit/publication.service.test.ts` | 30 |
| `tests/unit/file-signature.test.ts` | 24 |
| `tests/unit/page-content.test.ts` | 23 *(dont 6 en boucle)* |
| `tests/unit/pagination.test.ts` | 23 |
| `tests/unit/event.service.test.ts` | 22 |
| `tests/unit/validate-middleware.test.ts` | 21 *(dont 4 en boucle)* |
| `tests/unit/department.service.test.ts` | 20 |
| `tests/unit/auth-middleware.test.ts` | 17 *(dont 2 en boucle)* |
| `tests/unit/slug.test.ts` | 17 |
| `tests/unit/event-status.test.ts` | 13 |
| `tests/unit/app-error.test.ts` | 12 *(dont 1 en boucle)* |
| `tests/integration/health.test.ts` | 4 |
| **Total** | **257** |

> **Méthode, énoncée pour être vérifiable :** ce comptage est **statique**. La
> suite **n'a pas été exécutée** : `tests/integration/routes.test.ts` et
> `tests/helpers/database.ts` touchent la base, et **cette mission interdit toute
> écriture en base**. Le chiffre de 363 est donc repris de `docs/026`/`docs/029` et
> **non re-mesuré à l'exécution** — ce qui reste, à la marge, une **hypothèse
> documentaire**.

### 6.1.2 Tests qui restent valides sans modification

**Sur la base de `docs/029` §7.3.1, avec les ajouts de ce plan :**

| Suite / bloc | Pourquoi elle survit |
| --- | --- |
| `health.test.ts` (4) | Sans autorisation. La route `/api/v1/health` reste le `healthcheckPath` de Railway. |
| `routes.test.ts` §1, §2, §2bis, §2ter, §2quater — contrat `{data, meta}`, validation, pagination, tri | Ne dépendent **pas** du rôle ni du schéma de données. **Le contrat d'enveloppe n'est pas modifié par ce plan** (cf. Q-API1). |
| `routes.test.ts` §3 — **40 routes protégées** | L'assertion est « sans jeton → `401 AUTH_REQUIRED` ». Ajouter un garde d'autorisation **après** `authenticate` ne change pas le résultat. |
| `routes.test.ts` §4 — ordre des middlewares (`401`, jamais `400`) | L'invariant est **renforcé** : l'autorisation s'insère en rang 3, la validation en rang 4. |
| `routes.test.ts` §5 — non-exposition des brouillons | Indépendant du rôle. **Attention** : il deviendra dépendant du **statut** (`ARCHIVED` doit rester exposé, D-20 ; `DRAFT` non) — voir §6.1.3. |
| `routes.test.ts` §6, §7, §8, §9 — prières (validation), rate limiting, route inexistante, query vide | Routes publiques ou transverses. **§6 devra être adapté** si `requesterContact` était validé — voir §6.1.3. |
| `slug`, `pagination`, `file-signature`, `event-status`, `validate-middleware`, `app-error` | Pures, hors autorisation **et** hors schéma. |
| `department.service`, `event.service`, `publication.service` | Services. Impactés seulement si la signature reçoit un contexte d'autorisation — l'ajouter **en paramètre optionnel** préserve ces suites. |

**Estimation reprise de `029` §7.3.1, et confirmée : la grande majorité des 363
tests reste valide.** C'est précisément parce que ces tests **ne testent ni les
rôles ni les contraintes de données** qu'ils survivent.

### 6.1.3 Tests à adapter — ce que **ce** plan ajoute à la liste de `029` §7.3.2

| Fichier / bloc | Adaptation exigée | Transformation responsable |
| --- | --- | --- |
| `tests/unit/auth-middleware.test.ts` **(17)** | **Le plus touché.** Le double `adminProfile()` fixe `role: "ROLE_ADMIN"` → à paramétrer sur les **3** rôles. Le cas « rôle différent » utilise un cast `"ROLE_DEPARTMENT" as AdminRole` → à remplacer par une valeur **réelle** de l'énumération. `requireAnyAdmin` asserte `chain).toHaveLength(3)` → à ajuster si le garde d'autorisation entre dans la chaîne. **Ajouter** `scope` et `department_id`, et le refus `SUPER_ADMIN` sur `PrayerRequest`. | **M-B1**, `M-B3` (`É9`, `É21`) |
| `routes.test.ts` §3 — table `ROUTES_PROTEGEES` **(40)** | Ajouter une colonne `(rôle requis, scope requis)` par route : la table devient le **support anti-régression** du risque « policy oubliée sur une route ». | `M-B1`, `M-B3` |
| **Tests de prière — nouveau** | Après `É33`, `POST /prayer-requests` **doit changer de contrat** : plus de `requesterContact` en entrée, plus de `request_text` en clair en entrée (le chiffré remplace le clair). **Les tests de validation §6 de `routes.test.ts` doivent être réécrits**, pas ajustés. | **M-E1**, `M-E2` (`É7`, `É18`, `É33`) |
| **Tests de publication — `publication.service.test.ts` (30)** | À adapter sur **trois** points : (a) `PublicationStatus` gagne `ARCHIVED` (E-10) ; (b) toute publication doit porter un `department_id` **non nul** ; (c) la transition `ARCHIVED → PUBLISHED` doit **échouer**. | `M-D1`, `M-D2`, `M-D3`, `M-D4`, `M-D6` |
| **`page-content.test.ts` (23)** | À adapter : les schémas passent de `z.object` à **`z.strictObject`** (E1) et l'enveloppe aussi (E2). Les 5 tests de rejet actuels deviennent des tests de rejet **plus nombreux** (toute clé inconnue). | `M-F3` (`É31`) |
| **`department.service.test.ts` (20)** | À adapter sur le **renommage** : toute fixture contenant `Enfants / Ecodim`, `enfants-ecodim` ou `ecodim` doit suivre la décision `É1`. Et `Department` gagne les capacités. | `M-A1`, `M-A2`, `M-H2` |
| **`event.service.test.ts` (22)** | À adapter : `Event.departmentId` n'est **plus nullable** ; `visibility_scope` apparaît. | `M-C3`, `M-C4` |
| **`slug.test.ts` (17)** | **À vérifier, pas nécessairement à modifier** : le slug du département renommé sera produit par `uniqueSlug` sur un **nouveau** `name`. Si le slug est **décidé** (S-1/S-2), il ne doit pas être « dérivé » — c'est une **contrainte de conception** à tester. | `M-A1` |
| **`routes.test.ts` §5 — brouillons** | À **étendre** : `ARCHIVED` **doit rester** exposé publiquement (D-20), `DRAFT` non. Le test actuel ne connaît que `DRAFT`/`PUBLISHED`. | `M-D1`, `M-D4` |
| **Tests d'`app-error` (12) / OpenAPI** | À ajuster si `UNAUTHENTICATED_ADMIN` devient le code émis pour « authentifié sans profil » (Q-22, non tranché). | `M-B1` |

### 6.1.4 Tests **nouveaux** à écrire — triés par ce que ce plan ajoute

| Bloc | Contenu | Priorité |
| --- | --- | --- |
| **Non-perte** | Un test qui **fige** les comptages de §5.1 sur une base de test et échoue à la moindre perte. C'est le garde-fou de tout ce document. | **1** |
| **Contraintes de données** | Pour chacune des 6 contraintes de §3.2 : un test qui tente l'insertion invalide et attend l'**échec**. C'est ce qui prouve que la règle est **inviolable**, non « respectée par le code ». | **1** |
| **`ARCHIVED` irréversible** | `UPDATE status = 'PUBLISHED'` sur une ligne `ARCHIVED` → **échec**. Et `archived_at = NULL` → **échec**. | **1** |
| **Règle des 3** | Publier une 4ᵉ publication dans un département → `409` **ou** archivage automatique selon la décision `É1`. Concurrence : deux publications simultanées (Q-S9). | **1** |
| **`department_id` obligatoire** | `POST /events` et `POST /publications` sans `department_id` → **400**. | **1** |
| **`requester_contact` absent** | Un test qui échoue si le mot apparaît dans le schéma, les DTO, l'OpenAPI **ou** la liste rouge de journalisation. | **1** (coût nul, protège D-17) |
| **`Ecodim` absent** | Un test **statique** (`N-36`/`N-37` de `029`) qui refuse `Ecodim` dans `frontend/src` et `backend/src`, hors slugs de contenu décidés. | **1** |
| Matrice RBAC complète | Une ligne de test par cellule de `029` §2 : rôle × ressource × action → `ALLOW`/`DENY`. | 1 |
| Cas négatifs inter-départements | `029` N-08, N-09, N-10, N-17, N-20. | 1 |
| Prières | `029` N-01 → N-07, P-05, P-11, plus le test cryptographique N-05 (interdiction d'import de `createDecipheriv`/`privateDecrypt`, `030` Annexe A T1). | 1 |
| Schéma sans secret | `030` Annexe A T2 : aucune colonne de `prayer_private` ne correspond à `private\|secret\|seed\|share`. Devient **directement** C-29. | 1 |
| Intégrité de l'énumération | Suite à `É21` : `enum_range(admin_role)` = exactement les 3 valeurs de D-01, dans l'ordre. Devient C-15. | 2 |
| Médias | `029` N-14, N-15, N-16, N-18, N-19, P-10. | 2 |
| Pages | `029` N-21, N-22, N-23 (la structure n'est modifiable par **aucun** rôle). | 2 |

### 6.1.5 Comment les tests doivent être exécutés pendant la migration

| Règle | Motif |
| --- | --- |
| **Ne jamais exécuter la suite contre la production.** | `tests/helpers/database.ts` ouvre une connexion ; les tests d'intégration écrivent. |
| **Exécuter la suite sur le clone de `É3`** avant la migration réelle, puis **après chaque phase**. | C'est le seul moyen de détecter qu'un déploiement de code (N) a cassé un contrat **avant** que les données ne changent. |
| **Exécuter `npm test` après `É5`, `É7`, `É21`, `É28`, `É30`, `É33`, `É35`.** | Chacune de ces étapes touche un contrat d'API ou une contrainte. |
| **Ne pas ajouter de test qui dépende du `published_at` absolu.** | Les dates viennent de `dateOffsetDays` ; un re-seed les décale (§1.9 S-7). |

## 6.2 Backend Railway — migrer **sans interruption de service**

### 6.2.1 L'état réel du déploiement — vérifié dans le dépôt

| Élément | Valeur | Conséquence pour la migration |
| --- | --- | --- |
| `railway.json` | `builder: DOCKERFILE`, `healthcheckPath: /api/v1/health`, `healthcheckTimeout: 120`, `numReplicas: 1`, `restartPolicyType: ON_FAILURE` | **1 réplica** ⇒ un déploiement provoque un **redémarrage**, donc une brève indisponibilité **si** et seulement si le conteneur ne répond pas au healthcheck à temps. |
| `Dockerfile` | CMD `node dist/server.js` — **aucune migration au démarrage** | **Point capital :** le conteneur **n'applique jamais** les migrations. |
| `migrate.ts` | « Volontairement exécuté par un script expliqué plutôt qu'automatiquement au démarrage du serveur : une migration est une opération sensible qui doit être déclenchée volontairement (cahier §28), et non subie par chaque instance Railway qui redémarre. » + **verrou consultatif** `pg_advisory_lock(hashtext('ccjv_migrations'))` | **Le projet est déjà conçu pour une migration contrôlée, hors du cycle de déploiement.** C'est exactement ce que ce plan exploite : la migration n'est **jamais** une conséquence d'un `git push`. |
| `Dockerfile` — `COPY drizzle ./drizzle` | Les migrations sont **dans l'image** | `node dist/infrastructure/database/migrate.js` peut s'exécuter **depuis le conteneur déployé** — donc **dans la même région** que la base Supabase (`eu-central-1`), ce qui évite un aller-retour intercontinental depuis un poste de travail. |
| Connexion | pooler Supabase, `prepare: false`, `connect_timeout: 20`, pool 10 en production | Le pooler **ne supporte pas** les requêtes préparées nommées — contrainte déjà respectée. |
| **Aucun pipeline CI/CD** | Pas de `.github/`, pas de script de déploiement | Chaque étape est **manuelle et traçable** ; il n'existe **aucun** automatisme susceptible de migrer la base sans qu'on le veuille. |

> **Conclusion : l'absence de migration automatique au démarrage est la condition
> qui rend une migration sans interruption possible.** Elle est déjà en place — ce
> plan n'a rien à ajouter au code pour cela.

### 6.2.2 Les quatre principes qui garantissent l'absence d'interruption

**1 — `expand / migrate / contract` : jamais de changement incompatible en un pas.**

```text
EXPAND     le schéma accepte l'ANCIEN et le NOUVEAU       (É4 → É20)
MIGRATE    les données passent à la nouvelle forme         (É21 → É27)
CONTRACT   le schéma n'accepte plus QUE la nouvelle forme  (É28 → É35)
```

**2 — Le code déployé est toujours compatible avec le schéma en place.**
Chaque colonne est ajoutée **nullable** et remplie avant d'être contrainte
(§3.2) ; le code de rang **N** n'utilise jamais une colonne que `Én` n'a pas encore
créée. **L'ordre des déploiements est donc : code N d'abord, données ensuite,
code N+1 en dernier.**

**3 — Les verrous sont courts, et bornés par une configuration explicite.**

| Instruction | Verrou | Durée réelle |
| --- | --- | --- |
| `ADD COLUMN` (nullable, ou avec `DEFAULT` non volatile) | `ACCESS EXCLUSIVE`, **bref** (métadonnée seule depuis PG 11) | Négligeable |
| `ALTER COLUMN … SET NOT NULL` | `ACCESS EXCLUSIVE` + **balayage de table** | 7 et 10 lignes ⇒ **négligeable** |
| `ALTER COLUMN role TYPE admin_role` (`USING`) | `ACCESS EXCLUSIVE` + **réécriture de table** | **1 ligne** ⇒ négligeable |
| `ALTER TYPE … ADD VALUE` (`É10`) | Verrou sur le **catalogue**, pas sur la table | Négligeable |
| `CREATE INDEX` (É29, É32) | `SHARE` — **bloque les écritures**, pas les lectures | 10 lignes ⇒ négligeable. `CONCURRENTLY` n'est **pas nécessaire** à ce volume — mais le sera si `publications` croît. |
| `TRUNCATE public.prayer_requests` (É33) | `ACCESS EXCLUSIVE` | Table **vide** ⇒ instantané |
| `DROP TABLE public.prayer_requests` (É33) | `ACCESS EXCLUSIVE` | Instantané |

**Recommandation opérationnelle — obligatoire, pas facultative :**

```text
En tête de la session de migration :
    SET lock_timeout      = '5s';      -- aucune attente indéfinie derrière un
                                       -- ACCESS EXCLUSIVE tenu par une requête API
    SET statement_timeout = '60s';     -- une instruction qui dépasse 60 s est
                                       -- interrompue : mieux vaut réessayer que
                                       -- bloquer l'API
    SET idle_in_transaction_session_timeout = '60s';
```

> **Pourquoi c'est indispensable :** sans `lock_timeout`, un `ALTER TABLE` qui
> attend un verrou **bloque toutes les requêtes API derrière lui** (file d'attente
> de verrous). Sur 7 à 28 lignes, la migration est instantanée **si** elle obtient
> le verrou ; avec un `lock_timeout`, elle échoue proprement au bout de 5 s et peut
> être relancée, **sans jamais bloquer le service**. C'est la différence entre une
> migration invisible et un incident.

**4 — Le déploiement Railway est lui-même sans coupure, grâce au healthcheck.**
`numReplicas: 1` + `healthcheckPath: /api/v1/health` + `healthcheckTimeout: 120` :
Railway ne bascule le trafic vers la nouvelle version **que** lorsque `/health`
répond. Une nouvelle version qui ne démarre pas **n'est pas mise en service** — le
retour arrière est un redéploiement de l'image précédente.

> **Point d'attention sur `numReplicas: 1`.** Avec un seul réplica, un
> redéploiement **remplace** le conteneur : il y a une fenêtre où **aucune**
> instance ne sert. Elle dure le temps du démarrage (quelques secondes) et elle est
> **indépendante de la migration**. **Si une disponibilité nulle est exigée,
> `numReplicas: 2` est nécessaire** — c'est un changement de configuration Railway,
> pas de code, et il sort du périmètre de ce plan (signalé en §7, **Q-NT12**).

### 6.2.3 L'ordre de déploiement complet, étape par étape

| # | Action | Effet sur le service | Vérification |
| --- | --- | --- | --- |
| **D0** | `É2` — sauvegarde + **restauration à blanc réussie** | Aucun | La restauration à blanc passe. |
| **D1** | `É3` — répétition générale sur clone | Aucun | §5 passe intégralement sur le clone. |
| **D2** | `É4` + **déploiement du code N** (`É5`, `É7`) | **Aucun.** Le code N accepte l'ancien et le nouveau vocabulaire. | Site en ligne identique ; `/api/v1/health` répond ; les 363 tests passent. |
| **D3** | `É6` — gel de la fenêtre | Aucun | Comptages stables. |
| **D4** | `É8` → `É20` — **DDL additif uniquement** | **Aucun.** Aucune colonne n'est contrainte, aucune donnée n'est réécrite. Le code N ignore les nouveaux objets. | §5.1 (C-1) inchangé : **les 15 comptages sont identiques**. |
| **D5** | `É21` → `É27` — **données** | **Aucun pour le visiteur**, à trois exceptions près : (a) `É22` change le libellé `Enfants / Ecodim` → `Ecodume` **visible sur le site** ; (b) `É24` retire des publications du flux courant ; (c) `É13` peut masquer les témoignages selon la décision T-A/T-B/T-C. | C-3, C-4, C-20→C-23. Contrôles visuels sur `/organisation`, `/vie-de-leglise/evenements`, `/publications`, `/communaute/temoignages`. |
| **D6** | `É28` → `É33` — **contraintes** | **Aucun**, si `É23` a rendu 0 `NULL`. Les verrous sont brefs et bornés par `lock_timeout`. | C-5→C-19, C-43, C-44. L'échec d'un `SET NOT NULL` **n'est pas** un incident de service : la transaction est annulée, le schéma reste en l'état précédent. |
| **D7** | `É34` — **vérifications §5** | Aucun | Les 46 contrôles passent. |
| **D8** | `É35` + **déploiement du code N+1** | Aucun | Les 363 tests adaptés passent ; aucune occurrence résiduelle (C-24, C-25). |

**Conclusion : aucune étape de ce plan n'exige d'arrêter l'API**, à quatre
conditions :

1. les décisions de `É1` sont prises **avant** ;
2. le code N est **déployé avant** toute écriture en base ;
3. `lock_timeout` et `statement_timeout` sont posés sur la session de migration ;
4. la migration est lancée **pendant une période creuse** — non par nécessité
   technique, mais parce que `É24` produit un effet **visible et irréversible**
   qu'il vaut mieux annoncer.

### 6.2.4 Le point de vigilance le plus concret : l'instance n'est pas en région

La base interrogée est sur `aws-1-eu-central-1.pooler.supabase.com`. Exécuter la
migration **depuis un poste de travail hors région** ajoute une latence par requête
qui, multipliée par les 46 contrôles et les `ALTER TABLE`, peut allonger la fenêtre
et **augmenter le risque de dépassement de `statement_timeout`**.

**Recommandation : exécuter `node dist/infrastructure/database/migrate.js` depuis
une instance Railway, dans la même région que la base.** Le `Dockerfile` copie déjà
`drizzle/`, et `migrate.ts` existe déjà : **aucun code nouveau n'est requis.**

### 6.2.5 Retour arrière en production

| Scénario | Action | Délai |
| --- | --- | --- |
| **Le code N+1 casse quelque chose** | Redéployer l'image **N** (elle accepte les deux vocabulaires). | Quotients de minutes. **Aucune donnée à restaurer.** |
| **La migration échoue en `É28`** (`SET NOT NULL`) | **Rien à faire** : la transaction est annulée, le schéma reste en l'état de `É27`. Corriger la cause (un `NULL` subsiste), relancer. | Immédiat. |
| **La migration échoue en `É29`** (index unique) | **Rien à faire** : l'index n'est pas créé, la borne n'est pas garantie par la base — mais **aucune donnée n'est perdue**. Décider soit un archivage supplémentaire (`É24`), soit `R-B` (borne garantie par l'application). | Immédiat. |
| **Une étape destructive de la phase D doit être annulée** | **Restaurer SB-2**, puis **rejouer `É21` → `É27`** avec la décision corrigée. La restauration **annule tout ce qui a suivi**, y compris des données créées depuis. | Fenêtre à annoncer. |
| **`É24` doit être annulée** | **Restaurer SB-2.** Aucune autre voie (§4.3.3). | Fenêtre à annoncer. |
| **`É33` doit être annulée** | Restaurer SB-3 — **ce qui réintroduirait `requester_contact`** et violerait D-17. **Ce retour arrière est donc interdit** : la seule voie est d'assumer la suppression. | — |

---

# 7. Points non tranchés

**Règle appliquée, sans exception :** un point que `docs/028` ne fixe **pas** est
écrit « **non tranché** ». La colonne « Statut » distingue ce qui est **proposé**
par `docs/032` (donc révisable) de ce qui est **exigé** par `docs/028`.

## 7.1 Points **bloquants** — la migration ne peut pas être exécutée sans eux

| # | Point non tranché | Ce qui est déjà su | Question à trancher en une phrase | Étape bloquée |
| --- | --- | --- | --- | --- |
| **Q-S1** *(repris de 032)* | **Rattachement départemental des 10 publications** | `publications.department_id` doit être `NOT NULL` (règle des 3, D-18) ; la colonne **n'existe pas** et la graine ne porte **aucune** information de département | À quel département rattacher **chacune** des 10 publications existantes ? | `É23`, puis `É28` et `É29` |
| **Q-S2** *(repris de 032)* | **Rattachement des 2 événements institutionnels** (`Culte spécial — Action de grâce`, `Journée communautaire`) | D-26 interdit `department_id = NULL` ; D-07 n'énumère que Presse, Ecodume, Affaires Sociales — **aucun département « église entière »** | Quel département devient responsable de ces **2** événements ? (O-A / O-B / O-C de §2.6.1) | `É23`, puis `É28` |
| **Q-NT1** | **`Ecodume` (D-07) et `Enfants/Ecodim` (D-08) sont-ils une seule ligne ou deux ?** | `docs/032` §6.2 liste **deux** départements nommés `Ecodume` ; D-07 définit `Ecodume` comme département cible, D-08 conserve l'historique | Le département historique `Enfants / Ecodim` **devient-il** l'`Ecodume` de D-07 (fusion), ou reste-t-il **distinct** d'un `Ecodume` nouvellement créé (coexistence) ? | `É22` — et cela change les rattachements |
| **Q-NT2** | **Le slug cible : `ecodume` ou `enfants-ecodume` ?** | D-09 exige la convergence vers `Ecodume` **sans fixer la chaîne** ; `docs/032` §6.2 propose `ecodume` et cible un slug `ecodim` **qui n'existe pas** en base (le réel est `enfants-ecodim`) | Quelle chaîne exacte pour `departments.slug` ? | `É22` |
| **Q-NT2-bis** | **Les 3 slugs de contenu contenant `ecodim`** (`rencontre-ecodim`, `annonce-rentree-de-l-ecodim`, `vie-de-l-ecodim-en-images`) **doivent-ils être renommés ?** | D-09 exige la convergence ; **D-20 exige que `ARCHIVED` reste consultable « URL existante »** — les deux se contredisent sur ce point | Les slugs d'**événement** et de **publication** relèvent-ils de D-09 (identifiant métier), ou sont-ils des identifiants de contenu protégés par D-20 ? | `É25` |
| **Q-P3** *(reprise de 028)* | **La règle des 3 s'applique-t-elle par département, ou par département + type ?** | `docs/032` §4.1.4 écrit la contrainte sur `department_id` **seul**, « conforme à la lettre de D-18 », et déclare la question **non tranchée** | La borne porte-t-elle sur `department_id` seul, ou sur `(department_id, type)` ? **Elle décide si une publication doit être archivée définitivement** (§2.7.3). | `É24`, `É29` |
| **Q-NT3** | **Identité du compte `SUPER_ADMIN`** | D-05 : « le `SUPER_ADMIN` sera un compte **distinct** » — sans nommer le titulaire, ni dire s'il en existe **plus d'un** | Qui est le titulaire du compte `SUPER_ADMIN` à créer ? | `É27` |
| **Q-NT4** | **Que faire si la production contient PLUSIEURS comptes `ROLE_ADMIN` ?** | D-05 dit « **le compte** administrateur déjà créé devient `ADMIN` » — **au singulier**. La base interrogée en contient **1** ; la production est **inconnue** | Chaque compte existant devient-il `ADMIN` ? Lesquels deviennent `DEPARTMENT_MANAGER`, et rattachés à quel département ? | `É21` |
| **Q-S5** *(repris de 032)* | **Sort des données de prière existantes en production** | D-17 exige une « purge explicite et vérifiée » ; la base interrogée contient **0 ligne** ; **aucune donnée de prière n'est migrable** vers le chiffré (§2.9.2) | Les demandes éventuellement présentes en production doivent-elles être **exportées** hors base avant destruction, ou **détruites** sans export ? *(Et si export : quelle politique de rétention des sauvegardes, Q-NT11 ?)* | `É33` |
| **Q-NT8** | **Quel rôle PostgreSQL joue le rôle `ccjv_app` en production ?** | `030` §4.6 et `docs/032` §5.4.1 prescrivent `REVOKE ALL … FROM ccjv_app`. Or la connexion applicative passe par `DATABASE_URL` (pooler Supabase), **dont le rôle n'est nommé par aucun document** | Quel est le rôle réel de la connexion applicative, sur lequel le `REVOKE` doit porter ? L'isolation de niveau 1 est-elle effectivement obtenue ? | `É20` — **l'isolation silencieusement inopérante est le pire des cas** : elle paraîtrait appliquée |
| **Q-NT10** | **Valeur de rattrapage de `testimonies.status` pour les 4 lignes existantes** | Ces 4 témoignages sont **réellement affichés** (`/communaute/temoignages` appelle `getTestimonies()`). `docs/032` impose `DEFAULT 'DRAFT'` ; D-24 exige que le statut soit défini **avant exposition publique** | `DRAFT` (les 4 disparaissent du site), `PUBLISHED` + `moderated_at` (comportement inchangé, mais modération affirmée à tort), ou reporter l'ajout de la colonne ? | `É13` |

## 7.2 Points **non bloquants**, mais qui figent un choix

| # | Point non tranché | Ce qui est déjà su | Question | Étape |
| --- | --- | --- | --- | --- |
| **Q-NT5** | **Noms des clés `scriptures` à créer pour `/organisation`** | Le **texte** n'est pas inventé : il est copié du JSX. Les **noms** des clés ne sont fixés nulle part | Quelles clés pour Matthieu 23:11 et 1 Pierre 4:10 ? La clé `corps` (1 Co 12:12) est-elle réutilisée ou complétée ? | `É26` |
| **Q-S3** *(repris de 032)* | **Un département peut-il être désactivé sans être supprimé ?** | Aucune colonne `is_active` ; `029` §2.2 cellules 2.5/2.6 sont `?` | Ajouter une colonne de désactivation, ou conserver les départements historiques sans état d'activation ? | Aucune — décision d'ajout, pas de migration |
| **Q-S6** ⚠ | **Qui édite les capacités de département ?** | D-25 ne nomme **aucun** rôle ; un responsable qui écrirait ses propres capacités **s'attribuerait la portée événementielle globale** | Quel rôle peut écrire dans `department_capabilities` ? | Aucune — mais **bloque l'usage** de M-C4 pour tout événement `GLOBAL` |
| **Q-S7** | **Encodage des capacités** | `032` §1.2 C1 retient une **table**, et déclare le choix **révisable** | Table, colonne `jsonb`, ou tableau ? | `É19` |
| **Q-S8** | **Code de la capacité « événementielle globale »** | D-25 la nomme entre guillemets, **sans code technique** ; `032` retient `EVENT_SCOPE_GLOBAL` | Le code `EVENT_SCOPE_GLOBAL` est-il retenu ? D'autres codes sont-ils prévus ? | `É19` |
| **Q-NT6** | **Les événements d'un département devenu `GLOBAL` basculent-ils rétroactivement ?** | D-26 dit que la portée est **dérivée de la capacité du département** ; aucune décision ne dit si l'acquisition d'une capacité **réécrit** les événements passés | Quand un département reçoit `EVENT_SCOPE_GLOBAL`, ses événements existants passent-ils en `GLOBAL` ? | Aucune — décision d'exploitation |
| **Q-NT7** | **Les 3 `pageKey` sans route servie** (`communaute`, `vie-de-leglise`, `publications`) | `docs/031` §6.5 laisse **Q-PG3 ouverte** (rattacher / conserver / redistribuer) ; `docs/032` §3.7 les **conserve** (option 2) — choix de schéma, non arbitrage | Rattacher, conserver sans usage, ou redistribuer ? | Aucune — la conservation ne perd rien |
| **Q-NT9** | **Nom des 6 valeurs de `static_pages.template`** | `031` §1.4 L4 impose que le template soit **dérivé côté serveur** ; `022` §9 le modélise ; **aucun document n'en donne la liste** | Quelles 6 (puis 10) valeurs de `template`, et quelle table de correspondance `pageKey → template` ? | `É31` |
| **Q-NT11** | **Rétention des sauvegardes, et singulièrement de SB-3** | D-17 veut que le contact « ne survive nulle part » ; l'exploitabilité veut pouvoir revenir en arrière | Quelle durée de conservation, et SB-3 doit-elle être détruite après `É33` ? | §4.4 |
| **Q-NT12** | **`numReplicas: 1` : une indisponibilité nulle est-elle exigée ?** | `railway.json` fixe `numReplicas: 1` : un redéploiement remplace le conteneur, avec une fenêtre de quelques secondes **indépendante de la migration** | Faut-il passer à 2 réplicas pour une disponibilité continue ? | Aucune — config Railway |
| **Q-NT13** | **`social_links_href_scheme` : ajouter ou non ce `CHECK` ?** | `032` §7.2 ligne 14 écrit lui-même qu'« il n'est exigé par aucune décision » et que « l'alternative recommandée : ne pas le poser » | Ajouter ce `CHECK`, ou s'en tenir à la validation applicative ? | `É14` |
| **Q-NT14** | **`departments.created_by` (Q-S12) et `schedule_entries.department_id` (Q-PG5)** | Aucune décision n'exige la première ; `032` §7.2 ligne 11 **recommande de ne pas ajouter** la seconde tant que Q-PG5 est ouverte | Ajouter l'une, l'autre, les deux, ou aucune ? | Aucune — **recommandation : aucune** |

## 7.3 Réserves de garantie — à ne pas confondre avec des questions

| # | Réserve | Fondement | Effet sur la migration |
| --- | --- | --- | --- |
| **R-NT1** | **`media_access.grantee_id` est polymorphe et n'a AUCUNE clé étrangère** : l'intégrité est portée par un trigger, **contournable par désactivation**, et qui **n'empêche pas** la suppression ultérieure de sa cible. | `032` §4.3, R-S6 | La création de `media_access` (`É19`) **n'apporte pas** la garantie qu'une FK apporterait. À écrire dans la documentation d'exploitation. |
| **R-NT2** | **Les métadonnées des prières ne sont pas protégées** contre un adversaire détenant le rôle **propriétaire** de la base ou une sauvegarde complète : nombre, dates, existence restent lisibles. | `030` §1.5 P3, `032` R-S2 | **SB-3 contient ces métadonnées.** Sa rétention (Q-NT11) est donc aussi un point de garantie, pas seulement d'exploitabilité. |
| **R-NT3** | **Le test d'effectivité de l'isolation (C-40) est le seul contrôle qui distingue une isolation réelle d'un `REVOKE` no-op.** | §2.9.3, Q-NT8 | **C-40 est obligatoire.** Sans lui, `É20` peut réussir sans rien isoler. |
| **R-NT4** | **`events.visibility_scope` ne peut pas être garanti « cohérent avec la capacité » dans les deux sens** : le trigger refuse `GLOBAL` sans capacité, mais **ne révoque pas** `GLOBAL` si la capacité est retirée ultérieurement. | `032` §4.4 | Une **révocation de capacité** laisserait des événements `GLOBAL` orphelins de capacité. Non couvert par le trigger → à traiter en exploitation. |
| **R-NT5** | **Aucune contrainte déclarative n'exprime la couverture des enveloppes** (« au moins une enveloppe ADMIN active, exactement une RECOVERY active ») : c'est un **contrôle applicatif périodique**. | `030` §3.6.2, `032` R-S1 | Sans objet ici (0 ligne), mais à implémenter **avant** la première demande de prière réelle. |
| **R-NT6** | **Le chiffre de 363 tests est un chiffre documentaire, non re-mesuré à l'exécution** (§6.1.1). | `docs/026`, `docs/029` E-15 | Le comptage statique donne **257** `it()` littéraux ; l'écart vient des boucles. Une exécution réelle sur le banc de `É3` le confirmera. |

## 7.4 Écarts de forme relevés dans les documents sources

**Signalés parce qu'ils gênent l'exécution, sans être des décisions.** Aucun n'a
été corrigé dans ce document : ils appartiennent à leurs documents.

| # | Document | Relevé | Impact |
| --- | --- | --- | --- |
| F-1 | `docs/032` §6.1 | La ventilation des événements par département est inexacte : `Adultes` est annoncé à **3**, la base en compte **2** ; `Culte spécial — Action de grâce` y est rattaché à Adultes alors qu'il est à `NULL`. Le total « 5 / 2 » est exact. | **Direct sur `É23`** — la §1.3 de ce document fait foi. |
| F-2 | `docs/032` §3.3 | Coquille dans le DDL : `updated_at timestamptz NOT NULL DEFAULT now().,` — un point parasite avant la virgule. | Le DDL n'est pas exécutable tel quel à cet endroit. |
| F-3 | `docs/032` §6.2 | Renvoi vers « **§8, Q-S13** » pour l'alignement des alias d'ancre — or §8.1 ne définit que **Q-S1 → Q-S12**. | La question des alias `#ecodim` / `#adulte` est **réellement ouverte** et sans identifiant. Elle est traitée en `É5`/`É35` (alias de compatibilité) et par `M-A5`. |
| F-4 | `docs/032` §3.7 | Le commentaire annonce « 8 pages canoniques + **3** clés de pôle conservées sans route servie » puis énumère **10** clés, dont **8** canoniques et **2** pôles supplémentaires (`vie-de-leglise`, `publications`) — `communaute` étant à la fois canonique et sans route. | La liste des 10 clés est **correcte** ; le décompte du commentaire ne l'est pas. Sans impact sur `É31`. |
| F-5 | `docs/032` §10.1 / §10.2 | Le titre annonce « Index repris (**22**) » et « Index ajoutés (**26**) » — la table §10.2 numérote en réalité de **23** à **51**, soit **29** lignes, pour un total §9.1 de **48**. | Comptage interne incohérent. Sans impact : `É32` pose les index nommés, pas un nombre. |
| F-6 | `docs/032` §3.4 | Le `CHECK media_access_grantee_exclusive` (`grantee_type = 'DEPARTMENT' OR grantee_type = 'ADMIN_PROFILE'`) est une **tautologie** : la colonne est `NOT NULL` sur une énumération à deux valeurs. | Inoffensif, mais le commentaire qui l'accompagne parle d'« exclusivité » là où le `CHECK` n'exclut rien. |
| F-7 | `docs/031` §6.7 | Quatre formulations concurrentes du même horaire, non tranchées (Q-PG5). | **Sans objet pour cette migration** : `É` n'ajoute pas `schedule_entries.department_id` (§2.12.3). Le point restera ouvert après la migration. |
| F-8 | `docs/026` L67 | « 97 occurrences d'`Ecodim` dans le code » — mesuré : **100 occurrences sur 97 lignes**. | Le chiffre désigne les **lignes**. La liste exhaustive est en §2.2.5. |

---

# 8. Synthèse

## 8.1 Les chiffres de ce plan

| Mesure | Valeur |
| --- | --- |
| **Transformations inventoriées** | **35** — **22 additives**, **1 additive puis bloquante**, **2 non destructives**, **3 bloquantes**, **7 destructives** dont **1 seule irréversible** (`M-D5`) |
| **Étapes d'exécution** | **35** (`É1` → `É35`), en 5 phases : préparation, additif, données, contraintes, vérification/nettoyage |
| **Étapes bloquantes** (l'échec interrompt la migration) | **6** — `É7`, `É20`, `É21`, `É23`, `É29`, `É34` |
| **Étapes destructives** | **7** — `É21`, `É22`, `É24`, `É25`, `É28`, `É33`, `É35` ; **une seule sans porte de sortie en base : `É24`** (§4.3.3) |
| **Table de contenu concernée par une écriture** | 6 tables (`departments`, `events`, `publications`, `leaders`, `scriptures`) + 2 réglages |
| **Lignes écrites pendant la phase D** | **~35** — 1 (profil) + 1 (département) + 9 (textes) + 2 (événements) + 10 (publications) + 1 à 4 (archivage) + 2-3 (versets) |
| **Colonnes ajoutées** | ~20 (dont 6 deviennent `NOT NULL`) |
| **Tables créées** | **9** — `media_access`, `department_capabilities`, `notifications`, `notification_outbox`, `audit_log`, `prayer_request`, `data_key_envelope`, `crypto_key`, `prayer_audit_event` |
| **Tables supprimées** | **1** — `public.prayer_requests` (**0 ligne**) |
| **Colonnes supprimées** | **1** — `requester_contact`, avec la table |
| **Types d'énumération reconstruits** | **2** — `admin_role`, `prayer_status` |
| **Types d'énumération étendus** | **1** — `publication_status` (`+ ARCHIVED`) |
| **Types d'énumération supprimés** | **1** — `prayer_confidentiality` |
| **Requêtes de vérification** | **46** (C-1 → C-46) + 1 contrôle `pg_dump` (C-34) |
| **Points non tranchés** | **11 bloquants** + **13 non bloquants** + **6 réserves** = **30** |
| **Écarts de forme relevés** | **8** |
| **Interruption de service nécessaire** | **AUCUNE**, aux 4 conditions de §6.2.3 |

## 8.2 Le sort des 7 événements et des 10 publications — la réponse directe

### Les 7 événements

| # | Événement | `department_id` aujourd'hui | Devient | Par quelle étape |
| --- | --- | --- | --- | --- |
| 1 | `Culte dominical` (2026-10-02) | **Adultes** | **Adultes — inchangé** | — |
| 2 | `Culte dominical` (2026-10-09) | **Adultes** | **Adultes — inchangé** | — |
| 3 | `Répétition de la chorale` (2026-09-18) | **Chorale** | **Chorale — inchangé** | — |
| 4 | `Répétition de la chorale` (2026-10-16) | **Chorale** | **Chorale — inchangé** | — |
| 5 | `Rencontre Ecodim` (2026-10-13) | **Enfants / Ecodim** | **Le département renommé — rattachement inchangé** | `É22` (seul le département change de nom) |
| 6 | `Culte spécial — Action de grâce` (2026-10-22) | **`NULL`** | **Décision Q-S2** (O-A / O-B / O-C de §2.6.1) | `É23` |
| 7 | `Journée communautaire` (2026-09-22) | **`NULL`** | **Décision Q-S2** | `É23` |

**Aucun événement n'est supprimé. Aucun slug n'est modifié (sauf décision
`Q-NT2-bis`, qui ne concerne que `rencontre-ecodim`). Les 5 rattachements existants
sont préservés à l'identique.** Les 7 lignes reçoivent en outre
`visibility_scope = 'DEPARTMENT'` (`É16`) — **aucune** ne peut être `GLOBAL`, faute
de capacité attribuée et faute de décision Q-S6/Q-S8.

### Les 10 publications

| Constat | Traitement |
| --- | --- |
| **Les 10 sont `PUBLISHED`.** | Aucune n'est un brouillon : la question de l'exposition ne se pose pas pour elles. |
| **Aucune n'a de département — la colonne n'existe pas.** | `M-D3` **crée** le rattachement. Ce ne sont pas 10 rattachements à **migrer** mais **10 rattachements à créer** — et **la décision Q-S1 n'existe pas** (`É1`, `É23`). |
| **`department_id` devient `NOT NULL`** (règle des 3, D-18). | `É28` **échoue** tant que les 10 ne sont pas rattachées. C'est le comportement voulu. |
| **La règle des 3 est un maximum, pas une obligation** (D-18). | Elle n'impose pas d'avoir 3 publications visibles par département. Elle interdit d'en avoir **4**. |
| **3 départements existent ⇒ capacité 9 < 10.** | Sous la lecture « par département », **au moins une publication doit quitter `PUBLISHED`** si aucun 4ᵉ département n'est créé. |
| **Si Q-P3 est tranché « département + type »** | La capacité devient suffisante (les 4 MEDIA se répartissent 3+1) ⇒ **aucun archivage nécessaire**. |
| **Ordre recommandé pour minimiser la perte** | **R-C** (créer un 4ᵉ département avant) → **R-D** (Q-P3 par type) → **R-B** (pas d'archivage rétroactif, contrainte reportée) → **R-A en dernier recours** (§2.7.3). |
| **Si R-A est retenu** | Archiver les plus **anciennes** (`ORDER BY published_at ASC, id ASC`, D-19) jusqu'à ramener chaque département à 3. |
| **`ARCHIVED` n'est pas une suppression** (D-20) | La ligne, le slug et l'URL **restent** ; seule l'appartenance au flux courant change. `select count(*) from publications` reste **10**. |
| **L'archivage est irréversible** (D-18 + trigger) | `É24` est **isolé**, **précédé de SB-2 et de R-3**, et **sans porte de sortie en base** (§4.3.3). |
| **Vérification finale** | C-4 : `PUBLISHED n` + `ARCHIVED 10-n` = **10**. C-17 : **aucun** département à plus de 3 `PUBLISHED`. |

### La réponse en une phrase

> **Les 7 événements sont tous conservés** — 5 gardent leur rattachement, 1 suit le
> renommage de son département, 2 reçoivent un département **qui reste à désigner**
> (`Q-S2`). **Les 10 publications sont toutes conservées** — mais elles doivent
> **toutes** recevoir un département **qui reste à désigner** (`Q-S1`), et **selon
> la portée retenue pour la règle des 3** (`Q-P3`), **de 0 à 4 d'entre elles
> devront être archivées définitivement**, la borne « par département seul » avec
> 3 départements rendant **au moins un archivage inévitable** (§2.7.3).

## 8.3 Ce qu'il faut faire avant tout le reste

```text
1.  Trancher §7.1 — les 11 points bloquants. Sans eux, la migration NE PEUT PAS
    s'exécuter : É23, É24, É28 et É29 échoueraient, ou seraient exécutées sur une
    décision inventée. Le paramètre le plus lourd est Q-P3 : il détermine si des
    publications sont définitivement archivées.

2.  Mesurer la PRODUCTION — les 46 contrôles de §5 sur la base de production,
    AVANT toute écriture. Les chiffres de §1 sont ceux d'un environnement dont
    l'identité de production n'est pas établie (§0.2).

3.  Sauvegarder, puis RESTAURER À BLANC — §4.1.3. Une sauvegarde non testée
    n'est pas une sauvegarde, et l'étape É24 n'a AUCUN autre filet.

4.  Déployer le code N (tolérant aux deux vocabulaires) AVANT toute écriture
    en base — §2.2.6, É5.

5.  Poser lock_timeout et statement_timeout sur la session de migration — §6.2.2.

6.  Refuser, écrire et vérifier requester_contact à chaque étape — §2.8.2, et le
    test permanent C-26 / C-34.
```

---

*Fin du document — `docs/033-plan_migration_donnees.md`.*
