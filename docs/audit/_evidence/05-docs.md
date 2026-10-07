# 05 — EVIDENCE DOCS (extraction read-only)

**Objet** : extraire ce que la documentation **AFFIRME**, sans vérifier contre le code.
**Périmètre** : les 20 fichiers de `docs/001` à `docs/020`, lus intégralement.
**Hors périmètre** : `backend/README.md`, `backend/docs/IMPLEMENTATION_SPEC.md`, `frontend/README.md` (hors liste des 20, cités uniquement en §J).
**Légende** : CLAIM = affirmation de fait · PROPOSAL = proposition non construite · DECISION = décision explicitement prise/figée · ASPIRATIONAL = décrit un état futur comme s'il était courant.

**Note de méthode critique** : plusieurs documents décrivent un état du dépôt qui n'est plus le sien (documents V1/V2/V3 empilés, puis documents backend). Toute lecture de ce dossier doit tenir compte de l'ordre chronologique apparent : `001–007` (MVP initial) → `008–011` (conception publique pré-implémentation) → `012–013` (V3 audit+architecture) → `014–016` (audit et refonte éditoriale) → `017–020` (conception backend / back-office). Les documents les plus récents **contredisent** les plus anciens ; les contradictions sont listées en §H.

---

## DOC: 001-cahier_des_charges.md (3860 o, 76 lignes)
- **Purpose** : cadrage initial du projet (contexte, objectifs, périmètre, contraintes, livrables).
- **Document type** : spec
- **Claims of FACT**
  - L9 : « Le Centre Chrétien Jésus ma Vie (CCJV) est une église basée à Lubumbashi, en République Démocratique du Congo. »
  - L9 : « Elle organise des activités pour ses membres adultes et pour les enfants, ainsi que des départements spécifiques (chorale, etc.). »
  - L26 : « (Optionnel) Éditeur | Responsable d'un département pouvant publier dans sa rubrique »
- **PROPOSALS**
  - L32-37 : site public — Accueil, « Qui sommes-nous », Organisation, Événements, Publications/Médias, Contact.
  - L41-45 : back-office — authentification, gestion contenu pages, événements, publications/médias, départements.
  - L49-51 : back-end — API, base de données, stockage médias.
  - L65 : « Éventuellement, un guide d'utilisation simple pour l'administrateur ».
- **DECISIONS**
  - §7 « Décisions retenues » (aucun ID) :
    - L69 : « **Charte graphique** : basée sur le logo CCJV (vert, blanc/or, noir). »
    - L70 : « **Départements** : la liste précise n'est pas encore connue. Le site prévoira une rubrique « Départements » générique, alimentable plus tard via le back-office, sans liste figée dans le code. »
    - L71 : « **Niveau d'ambition** : version de base (MVP) pour cette première phase — fonctionnalités essentielles uniquement (vitrine, événements, publications simples, back-office basique). Les fonctionnalités avancées (formulaires complexes, multi-éditeurs, etc.) sont reportées à une phase ultérieure. »
- **Concrete enumerations (verbatim)**
  - Utilisateurs cibles (L22-26) : `Visiteur`, `Administrateur`, `(Optionnel) Éditeur`.
  - Périmètre public (L32-37) : « Page d'accueil », « Page « Qui sommes-nous » », « Organisation », « Événements », « Publications / Médias », « Page de contact ».
  - Contraintes (L55-58) : `Connectivité`, `Simplicité d'usage`, `Hébergement`, `Évolutivité`.
- **Thresholds / numbers**
  - Aucun seuil numérique métier.
  - L57 : « **Hébergement** : à définir (solution locale, régionale ou internationale) selon le budget disponible. » → THRESHOLD MENTIONED BUT UNVALUED (en réalité un choix non tranché, pas un seuil).
- **Contradictions with other docs** → voir §H #9, #14, #17.

## DOC: 002-specifications_fonctionnelle.md (3656 o, 119 lignes)
- **Purpose** : spécification fonctionnelle MVP du site public et du back-office.
- **Document type** : spec
- **Claims of FACT** (aucune — c'est une spécification ; les énoncés sont normatifs)
- **PROPOSALS / spécifications**
  - L11-16 : arborescence 6 pages. L108 : « Un événement passé n'apparaît plus dans la liste des événements à venir, mais reste consultable dans un historique (optionnel en V1). »
  - L110 : « Seul l'administrateur peut créer/modifier/supprimer du contenu ; le site public est en lecture seule. »
- **DECISIONS**
  - L5 : « *Version de base (MVP), en cohérence avec le cahier des charges.* »
  - L67 : « Un seul rôle « Administrateur » dans cette première version »
  - L114-119 « Hors périmètre (V1) » : espace membre, paiements en ligne, « Multi-éditeurs avec droits différenciés par département », notifications automatiques.
- **Concrete enumerations (verbatim)**
  - Arborescence (L11-16) : `Accueil`, `Qui sommes-nous`, `Organisation (adultes / enfants / départements)`, `Événements`, `Publications / Médias`, `Contact`.
  - Modèle de données (L96-102) :
    | Entité | Champs principaux |
    | Événement | id, titre, date, heure, lieu, description, image |
    | Département | id, nom, description, responsable |
    | Publication | id, titre, type, contenu, description, date |
    | Utilisateur (admin) | id, identifiant, mot de passe (haché) |
    | Page statique | id, clé (accueil/qui-sommes-nous), contenu |
  - Champs événement (L76) : « titre, date, heure, lieu, description, image ».
  - Champs département (L81) : « nom, description, responsable (optionnel) ».
  - Champs publication (L86) : « titre, type (vidéo / photo / texte), contenu, description, date ».
  - Types de publication (L86) : `vidéo / photo / texte`.
- **Thresholds / numbers**
  - L26 : « Aperçu des **2-3 prochains événements** ».
  - L47 : « Archivage automatique des événements passés (masqués de la liste principale) » → seuil = date passée, **non chiffré**.
  - L67 : « Un seul rôle « Administrateur » » → 1 rôle en V1.
- **Contradictions** → §H #3, #12, #17, #19, #21, #23.

## DOC: 003-architecture_technique.md (3215 o, 76 lignes)
- **Purpose** : architecture technique indicative V1 (3 couches, stack proposée, contraintes, sécurité).
- **Document type** : spec
- **Claims of FACT** : L32 : « Vu le profil full-stack (développement mobile et desktop également maîtrisé) » — affirmation sur le profil du développeur.
- **PROPOSALS**
  - L34-41 table « Choix technologiques proposés » : « Framework JS léger (ex. Next.js ou équivalent) », « API REST (Node.js/Express ou équivalent) », « PostgreSQL ou MySQL », « Stockage objet (local au serveur en V1, ou service cloud si budget le permet) », « Simple (identifiant/mot de passe, session ou token) ».
  - L43 : « Ce choix reste indicatif : à ajuster selon vos préférences techniques et l'environnement d'hébergement retenu. » → **explicitement non décidé**.
  - L50 : « Vidéos : plutôt qu'un hébergement direct de fichiers vidéo lourds, envisager l'intégration de vidéos hébergées sur YouTube/Facebook ».
  - L51 : « Hébergement : à trancher selon le budget ».
- **DECISIONS**
  - L58-61 (sécurité, formulés à l'impératif) : « Mots de passe hachés (jamais stockés en clair) », « HTTPS obligatoire sur le domaine », « Limitation des tentatives de connexion au back-office », « Sauvegardes régulières de la base de données et des médias ».
  - L67-68 : « **Développement** : local, sur la machine du développeur » / « **Production** : un seul environnement pour la V1 (pas de pré-production nécessaire à ce stade) ».
- **Concrete enumerations**
  - 3 couches (L13-15) : « Front-end public », « Back-office », « Back-end / API ».
  - Points à trancher (L74-76) : « Budget et hébergement définitif », « Nom de domaine souhaité », « Qui aura accès à l'administration (une ou plusieurs personnes) ».
- **Thresholds**
  - L60 : « Limitation des tentatives de connexion au back-office » → **THRESHOLD MENTIONED BUT UNVALUED** (aucun nombre de tentatives donné).
- **Contradictions** → §H #1, #9 (hébergement/DB concurrents de `004`).

## DOC: 004-architecture_logicielle_25092026_043710.md (21873 o, 1175 lignes)
- **Purpose** : architecture logicielle définitive du MVP V1 (Phase 3.3), contrat API, patterns, stack figée.
- **Document type** : spec (avec statut officiel de validation)
- **Claims of FACT**
  - L7 : « **Statut :** Validé »
  - L1162 : « La sous-phase **3.3 — Architecture logicielle** est considérée comme **validée**. »
  - L31 : « Cette architecture constitue la référence technique pour la Phase 4 — Implémentation. »
  - L117 : « Cette stack est considérée comme **figée à l'issue de la Phase 3**. »
  - L711 : « `ROLE_ADMIN` » — L713 : « est le seul rôle applicatif nécessaire. »
  - L1180 : « conforme à la règle du GEL » (L1175 : « après la clôture de la Phase 3 devra être considérée comme une modification du périmètre et reportée en **Phase 6 — Itération** »).
- **PROPOSALS** : néant (document « validé »).
- **DECISIONS** — §36 « Décisions finales de 3.3 » (L1135-1156), table verbatim :
  | Décision | Choix |
  | Architecture | Architecture en couches |
  | Frontend | Next.js + TypeScript |
  | Backend | Node.js + Express + TypeScript |
  | ORM | Drizzle ORM |
  | BDD | PostgreSQL |
  | Auth | Supabase Auth |
  | Storage | Supabase Storage |
  | Validation | Zod |
  | API | REST |
  | Documentation | OpenAPI |
  | Version API | `/api/v1` |
  | Pattern persistance | Repository |
  | Pattern métier | Service Layer |
  | Injection | Dependency Injection |
  | Strategy | Non retenu V1 |
  | Factory | Non retenu V1 |
  | Observer | Non retenu V1 |
  | Frontend hosting | Vercel |
  | Backend hosting | Railway |
  | Domaine | Namecheap |
  - Autres décisions : L774-784 codes d'erreur (§26) ; L480 « **OpenAPI est retenu comme contrat officiel de l'API REST.** » ; L446 « **Zod est retenu pour la validation des données.** » ; L416 « **Drizzle ORM est retenu comme couche d'accès à PostgreSQL.** »
- **Concrete enumerations (verbatim)**
  - Infrastructure (L46-51) : « PostgreSQL ; Supabase Auth ; Supabase Storage ; Vercel ; Railway ; Namecheap. »
  - 4 couches backend (L163-186) : `PRESENTATION` / `APPLICATION` / `DOMAIN` / `INFRASTRUCTURE`.
  - Services (L228-232) : `EventService`, `DepartmentService`, `PublicationService`, `StaticPageService`.
  - Entités Domain (L255-258) : `Event` ; `Department` ; `Publication` ; `StaticPage`.
  - Routes site public (L316-321) : `/`, `/qui-sommes-nous`, `/organisation`, `/evenements`, `/publications`, `/contact`.
  - Routes back-office (L327-332) : `/admin` → `/dashboard`, `/evenements`, `/departements`, `/publications`, `/pages`.
  - Arborescence frontend (L346-367) : `src/app/(public)`, `src/app/admin`, `src/components/{ui,layout,shared}`, `src/features/{events,departments,publications,pages}`, `src/lib/{api,auth,utils}`, `src/types`.
  - Modules backend (L379-407) : `modules/{auth,admins,departments,events,publications,static-pages}`, `domain/{entities,types,repositories}`, `infrastructure/{database,repositories,supabase,storage}`, `shared/{errors,validation,http,utils}`, `config`, `app`.
  - Endpoints (L531-535, L562-566, L576-580, L604-605, L619, L646) :
    `GET/POST /api/v1/events`, `GET/PATCH/DELETE /api/v1/events/:id`,
    `GET/POST /api/v1/departments`, `GET/PATCH/DELETE /api/v1/departments/:id`,
    `GET/POST /api/v1/publications`, `GET/PATCH/DELETE /api/v1/publications/:id`,
    `GET/PATCH /api/v1/pages/:pageKey`, `POST /api/v1/media`, `GET /api/v1/health`.
  - Paramètres `GET /events` (L543-546) : `page`, `limit`, `status`, `departmentId`.
  - Paramètres `GET /publications` (L586-588) : `page`, `limit`, `type`.
  - Types de publication (L594-596) : `VIDEO`, `PHOTO`, `TEXTE`.
  - Codes d'erreur (L774-784) : `AUTH_REQUIRED`, `FORBIDDEN`, `VALIDATION_ERROR`, `EVENT_NOT_FOUND`, `DEPARTMENT_NOT_FOUND`, `PUBLICATION_NOT_FOUND`, `PAGE_NOT_FOUND`, `DUPLICATE_SLUG`, `FILE_TOO_LARGE`, `INVALID_FILE_TYPE`, `INTERNAL_ERROR`.
  - Pipeline middleware (L729-752) : `CORS → Rate Limiting → Authentication → Authorization → Validation Zod → Controller → Service`.
  - Variables d'env frontend (L949-951) : `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
  - Variables d'env backend (L957-960) : `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CORS_ORIGIN`.
  - Autorisé (L1017-1020) : `Next.js → Express`, `Express → PostgreSQL`, `Express → Supabase Auth`, `Express → Supabase Storage`.
  - Interdit (L1026-1028) : `Next.js → PostgreSQL`, `Next.js → Service Role Supabase`, `Frontend → secrets backend`.
  - Contrat de collection (L1040-1048) : `{ "data": [], "meta": { "page": 1, "limit": 10, "total": 0, "totalPages": 0 } }`.
- **Thresholds / numbers**
  - L1044 : `"limit": 10` (défaut d'exemple du contrat de collection).
  - L835 : « Les différences entre `VIDEO`, `PHOTO` et `TEXTE` ne justifient pas encore cette complexité. »
  - L926-930 : « rate limiting » ; « limitation de taille des fichiers » → **THRESHOLD MENTIONED BUT UNVALUED** (aucune valeur de limite de fichier ni de débit donnée).
- **Contradictions** → §H #1, #2(hébergement), #5, #7, #10, #12, #13, #18, #24.

## DOC: 005-schema_database.md (5543 o, 178 lignes)
- **Purpose** : schéma SQL relationnel V1 (MERMAID + détail des tables + index).
- **Document type** : spec
- **Claims of FACT**
  - L5 : « *Version de base (MVP), SQL relationnel (PostgreSQL/MySQL)* »
- **PROPOSALS / spec**
  - L162 : « Aucune relation n'est faite entre `admins` et les autres tables au niveau base de données en V1 (traçabilité de l'auteur non requise pour cette version) ; à ajouter plus tard si besoin (`created_by`). »
  - L169 : « `is_archived` peut être calculé à la volée (comparaison `event_date < aujourd'hui`) plutôt que stocké, selon le choix technique final — l'un ou l'autre fonctionne pour une V1. » → **explicitement non tranché**.
  - §5 Évolutions possibles (L176-178) : « Table `media` séparée si une publication doit contenir plusieurs images/vidéos » ; « Table `users` pour des comptes membres (espace connecté) » ; « Champ `created_by` sur les tables pour tracer l'auteur, si plusieurs administrateurs ».
- **DECISIONS**
  - L76 : « Comptes administrateurs (rôle unique en V1). »
  - L118 : « `is_archived` | BOOLEAN | NOT NULL, défaut = false (bascule automatiquement à true une fois la date passée) »
- **Concrete enumerations (verbatim)**
  - 5 tables (L74, L87, L103, L126, L145) : `admins`, `departments`, `events`, `publications`, `static_pages`.
  - `admins` (L80-83) : `id` INTEGER PK auto-incrément ; `username` VARCHAR(50) UNIQUE NOT NULL ; `password_hash` VARCHAR(255) NOT NULL ; `created_at` TIMESTAMP NOT NULL.
  - `departments` (L93-99) : `id`, `name VARCHAR(100)`, `slug VARCHAR(120) UNIQUE NOT NULL (généré depuis name)`, `description TEXT Nullable`, `responsible_name VARCHAR(100) Nullable`, `created_at`, `updated_at`.
  - `events` (L109-120) : `id`, `title VARCHAR(150)`, `slug VARCHAR(180) UNIQUE`, `description TEXT Nullable`, `event_date DATE NOT NULL`, `event_time TIME Nullable`, `location VARCHAR(150) Nullable`, `image_url VARCHAR(255) Nullable`, `department_id INTEGER FK→departments.id Nullable (événement général si vide)`, `is_archived BOOLEAN NOT NULL défaut=false`, `created_at`, `updated_at`.
  - `publications` (L132-139) : `id`, `title VARCHAR(150)`, `type ENUM('video','photo','texte') NOT NULL`, `content_url VARCHAR(255) Nullable`, `description TEXT Nullable`, `published_at DATE NOT NULL`, `created_at`, `updated_at`.
  - `static_pages` (L151-154) : `id`, `page_key VARCHAR(50) UNIQUE NOT NULL (ex. accueil, qui-sommes-nous)`, `content TEXT NOT NULL (texte riche / HTML simple)`, `updated_at`.
  - Index (L122) : « **Index recommandé** : `(event_date, is_archived)` » ; (L141) : « **Index recommandé** : `(published_at DESC)` ».
- **Thresholds / numbers** : aucune valeur chiffrée de type seuil métier. L118 : bascule d'archivage déclenchée par le franchissement de la date.
- **Contradictions** → §H #1, #7, #8, #16, #18, #19.

## DOC: 006-modelisation_dynamique_&_statique_25092026_043815.md (17726 o, 894 lignes)
- **Purpose** : modélisation UML statique et dynamique du MVP V1 (entités, diagrammes de séquence, états, règles métier).
- **Document type** : spec
- **Claims of FACT**
  - L31 : « Le système V1 repose sur cinq principales entités persistantes : » (L33-37 : `Admin`, `Department`, `Event`, `Publication`, `StaticPage`).
  - L39 : « Les services externes tels que Supabase Auth, Supabase Storage, YouTube et Facebook ne sont pas considérés comme des entités métier persistantes du système. »
  - L141 : « La propriété `isArchived` initialement prévue dans le schéma est supprimée. »
  - L139 : « L'état d'un événement n'est pas stocké dans la base de données. »
  - L742 : « Il n'existe pas de transition manuelle « Archiver ». »
  - L219 : « Les vidéos ne sont pas hébergées directement par l'infrastructure CCJV en V1. »
  - L894 : « Aucune implémentation ne doit commencer avant la finalisation de l'architecture, du contrat API et de la roadmap de la Phase 3. »
- **PROPOSALS**
  - L227 : « Le modèle actuel devra être précisé lors de la conception du schéma final : une publication textuelle nécessite un contenu éditorial distinct d'une simple URL. Cette décision sera intégrée au contrat API lors de la sous-phase 3.3. » → **PROPOSAL/ouvert**.
  - L750 : « La V1 ne nécessite pas de workflow complexe de validation. »
  - L765 : « Toutefois, si le back-office V1 ne prévoit pas de sauvegarde en brouillon, l'état `DRAFT` peut être supprimé du modèle et une publication créée est directement considérée comme publiée. » → **PROPOSAL conditionnelle**.
  - L767 : « La décision finale sera alignée avec le comportement défini dans le CSF et le contrat API. » → **ouvert**.
- **DECISIONS**
  - §5 (L137-185) et §23 (L847-855) : `events.is_archived` **supprimé** ; « L'état d'archivage est désormais une propriété calculée. » (L855)
  - Règle métier (L147-153) verbatim :
    ```text
    SI eventDate >= date courante
        ALORS status = UPCOMING
    SINON
        status = ARCHIVED
    ```
  - L688 : « Les départements sont dynamiques : aucune liste fixe ne doit être codée dans le frontend. »
  - L809 : « Seul un utilisateur autorisé avec le rôle Admin peut effectuer les opérations CRUD. »
  - L811 : « L'API vérifie l'autorisation indépendamment du frontend. »
- **Concrete enumerations (verbatim)**
  - Entités (L33-37) : `Admin`, `Department`, `Event`, `Publication`, `StaticPage`.
  - Exemples de départements (L75-79) : « Adultes ; Enfants ; Jeunesse ; Chorale ; autres départements créés ultérieurement. »
  - `Department` attributs (L87-91) : `id` (UUID/Integer), `name` (String, obligatoire), `slug` (String, obligatoire, unique), `description` (Text, optionnel), `responsibleName` (String, optionnel).
  - `Event` attributs (L111-118) : `id`, `title`, `slug`, `eventDate` (Date, obligatoire), `eventTime` (Time, « Selon spécification »), `location` (optionnel), `imageUrl` (optionnel), `departmentId` (UUID/Integer, Nullable). **Pas de champ `description`**.
  - Enumeration `PublicationType` (L205-211) :
    ```text
    <<enumeration>> PublicationType

    VIDEO
    PHOTO
    TEXTE
    ```
  - Enumeration `PageKey` (L247-254) :
    ```text
    <<enumeration>> PageKey

    ACCUEIL
    QUI_SOMMES_NOUS
    ORGANISATION
    CONTACT
    ```
  - Tables confirmées (L839-845) : `admins`, `departments`, `events`, `publications`, `static_pages`.
  - Diagramme d'états Event (L726-740) : `UPCOMING` (« Date future ») → `ARCHIVED` (« Date passée »).
  - Diagramme d'états Publication (L754-763) : `DRAFT` → `PUBLISHED`.
  - Règles consolidées §21 (L773-811) — Département : « Le nom est obligatoire. / Le slug est généré automatiquement. / Le slug est unique. / Les départements sont dynamiques. / Un département peut posséder plusieurs événements. » ; Événement : « Le titre est obligatoire. / La date est obligatoire. / Le slug est généré automatiquement. / Le slug est unique. / Le département est facultatif. / Un événement sans département est un événement général. / L'état est calculé automatiquement à partir de la date. / Aucun champ `is_archived` n'est persisté. » ; Publication : « Le titre est obligatoire. / Le type est obligatoire. / Les types autorisés sont `VIDEO`, `PHOTO` et `TEXTE`. / Les vidéos utilisent une plateforme externe. / Les photos sont stockées dans Supabase Storage. / Les publications sont affichées chronologiquement. » ; Page statique : « `pageKey` est unique. / Le contenu est administrable. / Les pages dynamiques ne sont pas dupliquées dans `static_pages`. »
- **Thresholds / numbers**
  - L148 : « SI eventDate >= date courante ALORS status = UPCOMING » → un seul seuil, binaire, **sans nombre**.
  - L821-831 performance : « pagination des collections ; limitation de la taille des réponses API ; … » → **THRESHOLD MENTIONED BUT UNVALUED** (« limitation de la taille des réponses API » sans valeur).
- **Contradictions** → §H #1, #6, #7, #8, #11, #15, #20, #24.

## DOC: 007-design_graphique.md (2860 o, 77 lignes)
- **Purpose** : charte graphique (logo, palette, typographie, ton).
- **Document type** : design (spec de charte)
- **Claims of FACT**
  - L9-13 : description du logo — « Un bâtiment stylisé (église) surmonté d'un livre ouvert (Bible) », « Le sigle **CCJV** en vert, superposé au bâtiment », « Le nom complet « Centre Chrétien Jésus ma Vie » en lettrage doré/crème sur fond noir ».
- **PROPOSALS**
  - L23 : « Vert (sigle CCJV) | `#1E7A1E` *(à ajuster à partir du fichier logo source)* » → explicitement provisoire.
  - L30 : « > Note : les codes exacts du vert et du doré devront être vérifiés directement depuis le fichier source du logo (format vectoriel si disponible) pour garantir une correspondance parfaite. »
  - L60 : « Version sur fond clair : prévoir une déclinaison simplifiée (à créer si besoin — silhouette noire ou verte du sigle, sans le fond noir) »
  - §6 « À faire avant intégration » (L75-77) : récupérer SVG, extraire les codes exacts, créer version simplifiée.
- **DECISIONS** : aucune marquée « décidée ».
- **Concrete enumerations (verbatim)**
  - Palette (L21-28) :
    | Usage | Couleur | Code indicatif |
    | Couleur principale | Vert (sigle CCJV) | `#1E7A1E` |
    | Couleur secondaire | Doré / crème | `#EDE4C8` |
    | Fond sombre | Noir | `#121212` |
    | Fond clair (pages) | Blanc cassé | `#FAFAF7` |
    | Texte principal | Noir / gris très foncé | `#1A1A1A` |
    | Texte secondaire | Gris | `#5E5D59` |
  - Typographie (L36-39) : Titres **Lora** (serif), alternative « Georgia, Source Serif » ; Texte courant **Inter**, alternative « Arial, system-ui ».
  - Hiérarchie indicative (L46-52) : H1 Lora 36px/600 ; H2 Lora 28px/600 ; H3 Lora 20px/500 ; Texte courant Inter 16px/400 ; secondaire Inter 14px/400.
  - Ton visuel (L66-69) : « Sobre, institutionnel mais chaleureux » ; « Peu d'ornements, priorité à la lisibilité » ; « Images/photos avec une dominante chaude » ; « Boutons et éléments interactifs en vert (couleur principale) sur fond clair ».
- **Thresholds / numbers** : tailles typographiques (36/28/20/16/14 px) et graisses (600/600/500/400) ci-dessus.
- **Contradictions** → §H #2, #22.

## DOC: 008-audit_design.md (7574 o, 151 lignes)
- **Purpose** : audit du dépôt avant conception (docs, assets, état technique, écarts).
- **Document type** : audit
- **Claims of FACT**
  - L5 : « **Statut :** Document de travail — source des constats avant Creative Direction »
  - L19 : « Tous les documents ont été lus intégralement. »
  - L31-34 : « **Synthèse fonctionnelle (source de vérité)** : le périmètre public V1 est constitué de 6 pages […] Le modèle métier repose sur 5 entités : `Admin`, `Department`, `Event`, `Publication`, `StaticPage`. »
  - L68 : « **Greenfield** : le dépôt ne contient que `docs/` et `public/`. »
  - L69 : « Pas de `.git`, pas de `package.json`, pas de scaffold Next.js, aucun fichier de config. »
  - L70 : « Outillage disponible sur la machine : **Node 22.19**, **npm 11.18**, **pnpm 11.7**. »
  - L42-43 : logo `public/logo.png`, « Format : PNG, **1254 × 1254 px**, **405,7 Ko** ».
  - L47-51 : « Dominante : **noir** (`#000000`) et **blanc/crème quasi-blanc** (`#FDFDFD`/`#FFFFFF`) » ; « Bâtiment/livre : **gris** (trait, `#BFBFBF` → `#DADADA`) » ; « Le « vert » du sigle est en réalité un **vert menthe très pâle** (≈ `#BFFFBF`), en **quantité infime** (41 px sur ~1,57 M) ».
  - L55-56 : « **43 photographies JPEG**, issues de partages WhatsApp » ; « Poids unitaire : **38 → 245 Ko** […], total ≈ 3,5 Mo ».
  - L86-93 : écart `events.is_archived` — « `005-schema_database.md` définit encore un champ `is_archived` (booléen). » / « `006-modelisation_...md` (§5 et §23) le **supprime** ».
- **PROPOSALS**
  - L91-93 : « **Décision :** l'implémentation publique suivra la modélisation (propriété calculée, pas de `is_archived`). Le schéma SQL `005` devra être aligné avant la phase backend ».
  - L101-105 : « **Décision proposée (à valider) :** conserver `#1E7A1E` comme **vert d'interface principal** […] le vert menthe du logo comme un **accent dérivé optionnel** ».
  - L111-113 : « **Décision proposée (à valider) :** en V1, la page Événements porte toute l'information dans des cartes riches (titre, date, heure, lieu, description, image, département) ; **pas de page de détail séparée**. Elle pourra être ajoutée en itération. »
  - §7 Recommandations (L145-151) : logo WebP ~30–50 Ko ; photos WebP/AVIF via `next/image` ; self-hosting polices, Server Components, lazy loading, aucun autoplay ; aligner `005`.
- **DECISIONS**
  - L19 / L31 : « 6 pages » et « 5 entités » posés comme « source de vérité ».
  - L128 : liste des départements « Partielle : « Adultes », « Enfants/Ecodim » confirmés ; « chorale » mentionnée (`001`) ; « Jeunesse » citée en exemple (`006`) ».
- **Concrete enumerations (verbatim)**
  - Documents inventoriés (L23-29) : `001-cahier_des_charges.md` … `007-design_graphique.md` (7 fichiers, tous « Lu »).
  - Placeholders requis (L124-130) : « Horaires des cultes (adultes / enfants) », « Adresse / localisation exacte », « Numéro WhatsApp (`wa.me/…`) », « Message de bienvenue / vision / histoire », « Liste précise des départements », « Date/heure/lieu des prochains événements », « Réseaux sociaux ».
  - Informations confirmées (L134-139) : « Nom : Centre Chrétien Jésus ma Vie (CCJV) — Lubumbashi, RDC. / Création de l'église : **17 mars 2023**. / Naissance de l'Ecodim : **2 juillet 2023**. / Visionnaire/créateur : **Pasteur Manasse Mwamba**. / Instagram : `https://www.instagram.com/ecodim_ccjv/`. / TikTok : `https://www.tiktok.com/@ecodim_ccjv`. »
  - Dimensions dominantes photos (L58-59) : `720×1080`, `810×1080`, `559×994`, `994×559` ; grand format `1967×2560`, `1439×2560`, `2560×1439`, `1280×960`, `1080×654`.
- **Thresholds / numbers**
  - L43 : 1254 × 1254 px, 405,7 Ko.
  - L56 : « Poids unitaire : **38 → 245 Ko** », « total ≈ 3,5 Mo ».
  - L50 : « 41 px sur ~1,57 M ».
  - L55 : « **43 photographies JPEG** ».
  - L70 : Node 22.19 / npm 11.18 / pnpm 11.7.
  - L146 : « WebP ~30–50 Ko ».
- **Contradictions** → §H #2, #3, #21 (43 vs 41 photos).

## DOC: 009-direction_artistique.md (5638 o, 127 lignes)
- **Purpose** : direction artistique / creative direction (positionnement, langage visuel, motion, ton).
- **Document type** : design
- **Claims of FACT**
  - L5 : « **Statut :** Proposition — à valider avant implémentation »
  - L85-86 : « **Règle absolue :** privilégier les **43 photos réelles** de `public/images/` »
- **PROPOSALS** (l'intégralité du document, statut « Proposition »)
  - L11-15 : positionnement en 3 facettes.
  - L20 : « **Niveau de modernité : 4/5 — moderne premium** ».
  - L27-30 : « **CCJV est :** sobre, chaleureux, digne, vivant, accueillant, contemporain. » / « **CCJV n'est pas :** luxueux, cérémoniel excessif, technologique, startup, impersonnel, ostentatoire. »
  - L32-37 : progression émotionnelle en 4 étapes (citations).
  - L56 : « **Quatre axes fondamentaux :** Minimaliste · Éditoriale · Photographique · Contemporaine. »
  - L62-74 : 6 principes de composition (espace négatif, typographie structurelle, photographie, asymétrie, hiérarchie, trois régimes de largeur).
  - L80 : « **Importance : 4/5 — forte.** » (photographie)
  - L96 : « **Niveau : 4/5 — dynamique**, mais **aucun effet superflu**. »
  - L104-105 : « **`prefers-reduced-motion` obligatoire** »
  - L106-107 : « Évitements : pas d'autoplay vidéo, pas de WebGL, pas de carrousel lourd, pas de parallax sur mobile (performance). »
  - L113-117 : ton éditorial — « **Français**, registre institutionnel chaleureux » ; « vouvoiement institutionnel recommandé » ; placeholders `TODO — … À FOURNIR`, Lorem pour Hero uniquement.
- **DECISIONS** : aucune (« à valider »).
- **Concrete enumerations (verbatim)**
  - 5 tensions du langage visuel (L48-54) : Institution ↔ Communauté ; Structure éditoriale ↔ Vie humaine ; Minimalisme ↔ Dynamisme ; Tradition spirituelle ↔ Contemporain ; Sobriété ↔ Chaleur.
  - Catégories photographiques (L85-86) : « portraits · cultes · louange · familles · prédication · Ecodim · vie communautaire · architecture. »
  - Trois régimes de largeur (L72-74) : `Container` (≤ 1200 px) ; `Full width` ; `Grille éditoriale` (12 colonnes asymétriques).
  - Garde-fous (L123-127) : « Pas de template WordPress générique · pas de landing SaaS · pas d'esthétique startup · pas de symboles religieux clichés · pas de glassmorphism/neumorphism · pas de cartes arrondies · pas de grosses ombres · pas de gradients omniprésents · pas d'animations gratuites · pas de Hero vidéo lourd · pas d'autoplay · pas d'interfaces surchargées · pas de stock photos impersonnelles · pas d'esthétique luxueuse ni technologique excessive. »
- **Thresholds / numbers**
  - L20 : « 4/5 » ; L80 : « 4/5 » ; L96 : « 4/5 » ; L72 : « Container (≤ 1200 px) » ; L74 : « 12 colonnes asymétriques » ; L82 : « 43 photos réelles ».
- **Contradictions** → §H #21.

## DOC: 010-design_system.md (12337 o, 281 lignes)
- **Purpose** : design system (tokens foundations + inventaire de composants + accessibilité).
- **Document type** : design (spec d'implémentation)
- **Claims of FACT**
  - L5 : « **Statut :** Proposition — à valider avant implémentation »
  - L17-19 : « Couleurs **de base validées** (conservées presque exactement) + quelques **dérivés fonctionnels** […] Aucune couleur de base n'est modifiée. » ← **ASPIRATIONAL / contradiction avec `007` L23 « à ajuster »**
  - L7-9 : « > Implémentation cible : CSS variables (tokens) exposées via un module de thème, consommées par des composants React/TSX. Pas de dépendance UI lourde ; composants maison, sans `radix`/`shadcn` imposés »
- **PROPOSALS** : §2 Components (L137-263) — Button, Link, Header, Footer, Navigation & Fullscreen Menu, Hero, Section, Event Card, Department Card, Publication Card, Badge, Image, CTA « Nous rejoindre », Empty/Loading/Error States. Tous proposés.
  - L256 : « Cible proposée (à valider) : `/contact` »
  - L280-281 : « On n'ajoute un composant ou un token que s'il répond à un besoin réel d'une des six pages. »
- **DECISIONS**
  - L104 : « **Coins droits par défaut.** Radius = 0 partout ; un seul dérivé toléré »
  - L113 : « **Aucune ombre** sur les cartes/images (règle éditoriale). »
  - L180 : « **Menu principal plein écran sur Desktop ET Mobile** (élément identitaire, pas un menu mobile). »
  - L132-133 : « Toutes les animations passent par une media query `@media (prefers-reduced-motion: reduce)` qui les neutralise »
  - L267 : « ## 3. Accessibilité transversale (WCAG 2.2 AA) »
- **Concrete enumerations (verbatim)**
  - Color tokens (L23-32) : `--ccjv-green` `#1E7A1E` ; `--ccjv-green-strong` `#176317` *(dérivé)* ; `--ccjv-green-soft` `#EAF3EA` *(dérivé)* ; `--ccjv-cream` `#EDE4C8` ; `--ccjv-black` `#121212` ; `--ccjv-offwhite` `#FAFAF7` ; `--ccjv-ink` `#1A1A1A` ; `--ccjv-ink-secondary` `#5E5D59` ; `--ccjv-line` `#E5E2D9` *(dérivé)* ; `--ccjv-white` `#FFFFFF`.
  - Typography tokens (L43-44) : `--font-serif` `'Lora', Georgia, 'Source Serif', serif` ; `--font-sans` `'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif`.
  - Échelle fluide (L53-59) verbatim :
    | Display (Hero) | Lora 500–600 | `clamp(2.5rem, 1rem + 5.5vw, 4.5rem)` (40→72 px) |
    | H1 (titre de page) | Lora 600 | `clamp(2rem, 1rem + 2.5vw, 3rem)` (32→48 px) |
    | H2 (titre de section) | Lora 600 | `clamp(1.75rem, 0.75rem + 2vw, 2.5rem)` (28→40 px) |
    | H3 (sous-titre) | Lora 500 | `clamp(1.25rem, 0.9rem + 1vw, 1.5rem)` (20→24 px) |
    | Corps | Inter 400 | `1rem` (16 px) |
    | Corps secondaire | Inter 400 | `0.875rem` (14 px) |
    | Légende / badge | Inter 500 | `0.75rem` (12 px) |
  - Spacing tokens (L66-72) : `--space-1 4px`, `2 8px`, `3 12px`, `4 16px`, `5 20px`, `6 24px`, `8 32px`, `10 40px`, `12 48px`, `16 64px`, `20 80px`, `24 96px`, `32 128px`.
  - Container & grille (L80-83) : `Container` max-width 1200px ; `Grille éditoriale` 12 colonnes (8+4, 7+5, 5+7, offset) ; `Full width` Hero/photos/bandeaux/navigation.
  - Breakpoints (L89-92) : `--bp-sm` 480px ; `--bp-md` 768px ; `--bp-lg` 1024px ; `--bp-xl` 1200px.
  - Bordure (L98-100) : `--border-hairline` `1px solid var(--ccjv-line)` ; `--border-strong` `1px solid var(--ccjv-ink)` ; `--border-accent` `1px solid var(--ccjv-cream)`.
  - Radius (L108-109) : `--radius-none` `0` ; `--radius-pill` `999px`.
  - Shadow (L118-119) : `--shadow-none` `none` ; `--shadow-header` `0 1px 0 var(--ccjv-line)`.
  - Motion (L125-130) : `--ease-out` `cubic-bezier(0.16, 1, 0.3, 1)` ; `--ease-in-out` `cubic-bezier(0.65, 0, 0.35, 1)` ; `--dur-fast` `150ms` ; `--dur-base` `250ms` ; `--dur-slow` `400ms` ; `--dur-page` `550ms`.
  - Button variantes (L142-145) : `primary`, `outline`, `ghost`, `inverse`.
  - Button états (L147-150) : `default` → `hover` → `focus-visible` → `active` → `disabled` → `loading`.
  - Button tailles (L151) : « `md` (44 px de haut, cible tactile ≥ 44 px), `lg` ».
  - Section variantes (L209) : `full-bleed` (photo), `dark` (noir), `tinted` (vert doux).
  - Badge variantes de contexte (L239) : « type de publication, état d'événement, département, catégorie ».
- **Thresholds / numbers**
  - L35-37 : « le vert `#1E7A1E` sur `#FAFAF7`/blanc ≈ **5,4:1** → conforme AA pour texte normal » ; « Le gris secondaire `#5E5D59` sur `#FAFAF7` ≈ 6:1. »
  - L80 : `max-width: 1200px` ; L92 : `--bp-xl 1200px` (plafond container).
  - L132/271 : anneau de focus `2px`, `offset 2px`.
  - L272 : « cibles tactiles ≥ 44 px ».
  - L149 : « `disabled` (opacité 40 %) ».
  - L281 : « une des six pages ».
- **Contradictions** → §H #2, #22, #25 (fixe vs fluide).

## DOC: 011-architecture_visuelle.md (8617 o, 269 lignes)
- **Purpose** : architecture visuelle des 6 pages + modèle de données mocké + arborescence frontend cible.
- **Document type** : design (architecture visuelle) / spec
- **Claims of FACT**
  - L5 : « **Statut :** Proposition — à valider avant implémentation »
  - L104-107 : « **Données dynamiques** : les départements viennent d'un mock `Department[]` » ; « **Confirmés** : Adultes, Enfants/Ecodim. **Mentionnés** (docs) : chorale. **Exemple** (modélisation) : Jeunesse. »
  - L129 : « **Pas de page de détail en V1** (voir audit §5.4) »
  - L173 : « **Pas de formulaire de contact en MVP** (règle validée). »
  - L240 : « `is_archived` est **absent** (supprimé par la modélisation) »
- **PROPOSALS**
  - L26 : « **CTA permanent** : « Nous rejoindre » → `/contact` (décision à valider). »
  - L130 : « **Filtrage** : optionnel par département (à valider ; reportable en itération). »
  - L196 : « Types TypeScript (à créer dans `src/types/`) »
  - L242-243 : « Les mocks (`src/lib/mock/…`) respectent exactement ces contrats pour basculer vers l'API REST (`/api/v1/…`) sans refonte. »
- **DECISIONS**
  - L173 : « Pas de formulaire de contact en MVP » marqué « règle validée ».
- **Concrete enumerations (verbatim)**
  - Routes publiques (L27-28) : `/`, `/qui-sommes-nous`, `/organisation`, `/evenements`, `/publications`, `/contact`.
  - Structure globale (L12-22) : `<Header contextuel>` → `<main>` → `<Footer noir>`.
  - Modèle TypeScript (L199-238) verbatim :
    ```ts
    type PublicationType = 'VIDEO' | 'PHOTO' | 'TEXTE';
    type EventStatus = 'UPCOMING' | 'ARCHIVED'; // calculé, jamais persisté

    interface Department { id; name; slug; description?; responsibleName? }
    interface Event { id; title; slug; description?; eventDate; eventTime?; location?; imageUrl?; departmentId?: string | null; status: EventStatus }
    interface Publication { id; title; type: PublicationType; contentUrl?; description?; publishedAt }
    interface StaticPage { id; pageKey: 'ACCUEIL' | 'QUI_SOMMES_NOUS' | 'ORGANISATION' | 'CONTACT'; content: string }
    ```
  - Arborescence cible (L250-265) : `src/app/(public)/` ; `components/ui/` (Button, Badge, Card, EmptyState, LoadingState, ErrorState, Image) ; `components/layout/` (Header, Footer, FullscreenMenu) ; `components/shared/` (Section, CTA) ; `features/events/` (EventCard, liste) ; `features/departments/` (DepartmentCard, liste) ; `features/publications/` (PublicationCard, grille) ; `features/pages/` (Hero, sections Accueil) ; `lib/api/`, `lib/mock/`, `lib/utils/` ; `types/`.
  - SEO (L183-188) : metadata/`title`+`description`, `openGraph`, `twitter:card`, `canonical`, `lang="fr"`, `sitemap.xml`, `robots.txt`, un seul `h1`, slugs minuscules sans accents.
- **Outlines de pages (verbatim, cf. §F)**
  - Accueil (L38-52) : Hero → Identité/message de bienvenue → Horaires des cultes (adultes / enfants) → Prochains événements (2–3 Event Cards + « Tout voir ») → Départements/Organisation (aperçu Department Cards) → Publications/Médias (1 dernière publication en avant) → Invitation/Communauté (CTA) → Footer.
  - Qui sommes-nous (L69-81) : Titre + chapeau → Identité & histoire (création : 17 mars 2023) → Vision (TODO) → Le Pasteur Manasse Mwamba → L'Ecodim (naissance : 2 juillet 2023) → Informations institutionnelles → Footer.
  - Organisation (L95-101) : Titre + chapeau → Volets principaux : Adultes · Enfants / Ecodim → Départements (liste dynamique : Department Cards) → Footer.
  - Événements (L118-124) : Titre + chapeau → Événements à venir (tri chronologique ascendant) → Événements passés/archivés (tri chronologique descendant) → Footer.
  - Publications/Médias (L140-144) : Titre + chapeau → Grille éditoriale chronologique (Publication Cards) → Footer.
  - Contact (L160-170) : Titre + chapeau → Informations pratiques (TODO) → Horaires (TODO) → WhatsApp (bouton `wa.me` — numéro TODO) → Réseaux sociaux (Instagram, TikTok) → Footer.
- **Thresholds / numbers**
  - L34 : « répondre en **15 secondes** à « qui est CCJV… » » (objectif UX chiffré).
  - L44 : « Prochains événements (**2–3** Event Cards + « Tout voir ») ».
  - L48 : « Publications / Médias (**1** dernière publication en avant) ».
  - L186 : « un seul `h1` ».
- **Contradictions** → §H #3, #4, #7, #12, #23.

## DOC: 012-audit_et_architecture.md (8131 o, 145 lignes)
- **Purpose** : audit de l'état réel du dépôt (Étape 1) + architecture de l'information cible (Étape 2).
- **Document type** : audit + spec
- **Claims of FACT** (sur l'état du dépôt — à l'époque de rédaction)
  - L6 : « **Statut :** Proposition — implémentation à démarrer après validation »
  - §1.1 (L16-26) : « Stack | Next.js 15.5.26 (App Router) · TypeScript strict · Tailwind CSS v4.3.3 » ; « Routes publiques | `/`, `/qui-sommes-nous`, `/organisation`, `/evenements`, `/publications`, `/contact` » ; « Route ajoutée récemment | `/organisation/chorale` — **ne compile pas** ».
  - L19-25 composants : `Header`, `Footer`, `FullscreenMenu` ; `Section`, `SectionHeading`, `PageHeader`, `Reveal`, `CrossMark`, `OpenBookMark`, `VerseSection`, `BreathingPhoto`, `Timeline`, `WeekRhythm` ; `Button`, `Badge`, `EmptyState` ; `events` (Card, Row, Featured), `departments` (Card, Feature), `publications` (Card), `pages` (Hero) ; mocks `site`, `departments`, `events`, `publications`, `verses`, `images`.
  - L24 : « Médias | 41 photos (`public/media`, noms propres) + 41 originaux (`public/images`) + `logo.png` ».
  - L41 : « **Build cassé** — `/organisation/chorale` appelle `getDepartmentBySlug` et les champs `meetingSchedule`, `keyPoints`, `gallery`, `bannerImage` qui n'existent ni dans `departments.ts` ni dans le type `Department` (5 erreurs TS) | **Bloquant** ».
  - L48 : « `sitemap.ts` ne liste que les 6 routes actuelles | SEO ».
  - L49 : « Contenus partiellement en lorem ; versets réels non encore validés ; horaires de démonstration | Contenu ».
- **PROPOSALS**
  - §2.1 Sitemap cible (L64-102) — cf. §F.
  - §2.4 Gabarits dynamiques à créer (L130-132) : `/vie-de-leglise/evenements/[slug]`, `/organisation/departements/[slug]`, `/publications/[slug]`.
  - §2.5 Extensions du modèle (L138-143) : `bannerImage?: string`, `meetingSchedule?: string`, `keyPoints?: string[]`, `gallery?: string[]`.
  - L145 : « Plus : `getDepartmentBySlug(slug)` et `getDepartmentBySlug` exportés depuis `src/data/mock/departments.ts`. » (doublon dans le texte source).
- **DECISIONS** — §1.4 « Décisions déjà tranchées à conserver » (L53-56) verbatim :
  - « Palette, typographie, boutons carrés, cartes sans ombre, coins droits. »
  - « Croix **visible** (pas de micro-trait invisible). »
  - « Versets : **jamais inventés** (Louis Segond 1910 utilisé, à valider par CCJV). »
  - « Aucun système de don / de prière **fabriqué** sans périmètre validé : prévoir le **point d'intégration**. »
- **Concrete enumerations (verbatim)**
  - Sitemap cible (L64-102) :
    ```text
    /                                        Accueil (première rencontre)

    /qui-sommes-nous                         HUB éditorial
    ├── /qui-sommes-nous/ce-que-nous-croyons Confession de foi, valeurs, vision
    ├── /qui-sommes-nous/d-ou-nous-venons    Histoire (17 mars 2023, Ecodim 2 juillet 2023)
    └── /qui-sommes-nous/qui-nous-dirige     Leadership

    /vie-de-leglise                          HUB pratique
    ├── /vie-de-leglise/evenements           Agenda complet
    │   └── /vie-de-leglise/evenements/[slug]  Fiche événement
    ├── /vie-de-leglise/ou-nous-trouver      Adresse, horaires, accès, WhatsApp, réseaux
    └── /vie-de-leglise/faire-un-don         Selon périmètre réel (sinon: point d'intégration)

    /communaute                              HUB communauté
    ├── /communaute/groupes-de-maison
    ├── /communaute/parcours-nouveaux        Parcours d'accueil des nouveaux
    ├── /communaute/priere                   Espace de prière (point d'intégration)
    └── /communaute/temoignages              Témoignages réels uniquement

    /organisation                            HUB organisation
    ├── /organisation/responsables
    └── /organisation/departements           Liste dynamique
        └── /organisation/departements/[slug]  Fiche département (modèle déjà posé par /chorale)

    /publications                            HUB éditorial
    ├── /publications/actualites             Articles et nouvelles
    ├── /publications/enseignements          Sermons et enseignements
    ├── /publications/mediatheque            Photos et vidéos
    ├── /publications/ressources             Guides et documents
    └── /publications/[slug]                 Article / enseignement / ressource

    Pages transversales
    ├── /mentions-legales
    ├── /confidentialite
    ├── /conditions
    ├── /accessibilite
    └── /recherche
    ```
  - Migration des routes (L110-115) : `/evenements` → `/vie-de-leglise/evenements` (« Déplacée + redirection 308 ») ; `/contact` → `/vie-de-leglise/ou-nous-trouver` (« Déplacée + redirection 308 ») ; `/organisation/chorale` → `/organisation/departements/chorale` ; `/publications`, `/qui-sommes-nous`, `/organisation` « Enrichie en hub ».
  - Nav principale (L119) : « **Menu principal (6 entrées)** : Accueil · Qui sommes-nous · Vie de l'Église · Communauté · Organisation · Publications & Médias. »
  - Limitation #5 (L45) : « **Aucune page transversale** (légal, accessibilité, recherche) ».
- **Thresholds / numbers**
  - L104 : « **Volume :** 3 routes racines existantes à migrer + 5 hubs + 16 sous-pages + 3 gabarits dynamiques + 5 pages transversales. »
  - L41 : « (5 erreurs TS) ».
  - L19 : « `/organisation/chorale` — **ne compile pas** ».
  - L24 : « 41 photos […] + 41 originaux ».
  - L48 : « les 6 routes actuelles ».
- **Contradictions** → §H #4, #5, #11, #12, #26 (redirections 308 vs 404).

## DOC: 013-ux_narration_par_page.md (11098 o, 194 lignes)
- **Purpose** : UX et narration page par page (objectif, public, question, émotion, contenu, structure, CTA).
- **Document type** : design (UX)
- **Claims of FACT**
  - L5 : « **Statut :** Proposition — implémentation après validation »
- **PROPOSALS** : l'intégralité (statut Proposition). En particulier :
  - L27 : « **Demander la prière** (point d'intégration) »
  - L28 : « Soutenir l'église | INVITER | Présentation sobre, moyens — uniquement si périmètre validé »
  - L80 : « Sinon : page de présentation + **point d'intégration explicite**, aucun faux système de paiement. »
  - L99 : « formulaire **uniquement si le périmètre le permet**, sinon point d'intégration + WhatsApp. **Aucun faux envoi.** »
  - L191-194 §K : « **Proposition :** appliquer `TODO — CONTENU À FOURNIR` **uniquement** aux informations institutionnelles réellement inconnues […] et conserver le lorem ipsum pour le texte purement décoratif. Décision à confirmer. »
- **DECISIONS** : aucune (le §K est explicitement « Décision à confirmer »).
- **Concrete enumerations (verbatim)**
  - Grille Accueil 10 sections (L18-30) :
    | 01 | **L'invitation (Hero)** | ACCUEILLIR | Identité, phrase d'accueil, photographie, verset d'ouverture, localisation | **Planifier ma visite** · **Voir les horaires** |
    | 02 | **La Parole du jour** | RÉFLÉCHIR | Verset + référence, composition typographique pleine largeur, croix visible | — |
    | 03 | **Un mot du pasteur** | RENCONTRER | Photo ou courte vidéo + quelques lignes signées | Écouter / Lire le message |
    | 04 | **Qui sommes-nous en bref** | RACONTER | Identité, vision, date de fondation, photographie, référence spirituelle | **Découvrir notre histoire →** |
    | 05 | **La vie de l'Église** | INFORMER | **3 événements maximum** (date, titre, lieu, photo, CTA) | Voir tous les événements |
    | 06 | **Derniers enseignements** | TRANSMETTRE | 1 contenu principal (grand) + 2–3 secondaires | Écouter l'enseignement |
    | 07 | **La communauté** | MONTRER | Photographies réelles (familles, enfants, louange, prédication) + témoignage mis en avant | Découvrir la communauté |
    | 08 | **La prière** | FAIRE UNE PAUSE | Moment calme, filets, texte court | **Demander la prière** (point d'intégration) |
    | 09 | **Soutenir l'église** | INVITER | Présentation sobre, moyens — uniquement si périmètre validé | Selon périmètre |
    | 10 | **L'envoi** | INVITER | « La porte est ouverte. » + réseaux + infos pratiques | **Planifier ma visite** |
  - Pages transversales (L142-146) :
    | `/mentions-legales` | Conformité | Éditeur, hébergeur, propriété intellectuelle |
    | `/confidentialite` | Confiance | Données collectées, finalités, droits |
    | `/conditions` | Cadre | Conditions d'utilisation |
    | `/accessibilite` | Inclusion | Engagement WCAG 2.2 AA, moyens de contact |
    | `/recherche` | Retrouver | Recherche transversale (contenus, événements, départements) |
  - Système d'introduction H.1 (L153-156) : « Séquence **courte et non bloquante** (~1,6 s max, sautable) : `fond noir → croix visible → verset → référence → CCJV → fondu vers la Home`. » Contraintes : « **SSR-safe** […] `prefers-reduced-motion` → séquence supprimée · un seul rendu par session (`sessionStorage`) ».
  - H.2 Transitions (L159-160) : « voile + croix + libellé de section, fondu, léger déplacement. **Uniquement `transform` / `opacity`** (GPU-friendly), **CSS d'abord** ».
  - Responsive (L168-175) : Hero (Desktop 2 colonnes / Mobile photo pleine largeur) ; Sections éditoriales (5/7 ou 7/5 / empilement) ; Événements ; Galeries (3 colonnes / défilement horizontal tactile) ; Menu ; Respirations.
  - Garde-fous J (L181-185) : 5 règles verbatim.
- **Thresholds / numbers**
  - L24 : « **3 événements maximum** » (accueil).
  - L25 : « 1 contenu principal (grand) + **2–3 secondes** » (secondaires).
  - L88 : « 4 portes (groupes de maison / parcours nouveaux / prière / témoignages) ».
  - L95 : « **parcours en 4–5 étapes** ».
  - L153 : « ~1,6 s max ».
  - L173 : « Galeries | 3 colonnes ».
- **Contradictions** → §H #11, #14, #23, #27.

## DOC: 014-audit_pages_refactor.md (54176 o, 671 lignes)
- **Purpose** : inventaire exhaustif de la composition visuelle de chaque route du site public (30 pages) + matrice de similarité + composants + ressources visuelles.
- **Document type** : audit
- **Claims of FACT** (observations, mesurées)
  - L4 : « **Nature** : observation pure. Aucune recommandation de design, aucune modification de code. »
  - L6 : « **Périmètre** : les 30 fichiers `src/app/**/page.tsx` présents dans le dépôt. »
  - L21 : « Le chrome global — `Header` (logo `/logo.png`), `Footer` (logo `/logo.png`), `IntroCurtain` (verset Matthieu 18:20) — est monté une seule fois dans `src/app/layout.tsx` »
  - L426 : « **Squelette strictement identique — 9 pages** : `/publications/actualites`, `/organisation/responsables`, `/organisation/departements`, `/publications/ressources`, `/recherche`, `/mentions-legales`, `/confidentialite`, `/conditions`, `/accessibilite`. »
  - L434 : « En synthèse : **8 squelettes distincts** pour 30 routes, dont **3 squelettes dominants qui couvrent 25 routes sur 30** ; `VerseSection` clôt 29 pages sur 30 (`/` excepté) et **aucune page n'utilise `PageHeader tone="dark"`**. »
  - L493 : « **Composants déclarés mais jamais consommés** : `EventCard`, `DepartmentCard`, `DepartmentFeature`, ainsi que l'export `galleryImages` et les clés `images.hero`, `images.portraitA`, `images.portraitB` de `src/data/mock/images.ts`. »
  - L549 : « **Consommation réelle** : `hero` n'est importée nulle part ; `portraitA` et `portraitB` ne sont importées nulle part ; `galleryImages` n'est importée nulle part. Les clés effectivement lues dans du JSX sont `identite`, `louange`, `communaute`, `ecodim`, `portraitLarge`. »
  - L551-553 : « `public/media/` : 41 fichiers confirmés » — « `ccjv-01.jpeg` … `ccjv-41.jpeg` — **41 fichiers**, numérotation continue de 01 à 41, sans trou ni doublon ».
  - L557 : « **80 lignes** correspondantes, représentant **86 occurrences** ».
  - L644 : « **30 fichiers sur 41 sont référencés au moins une fois dans `src/`** »
  - L647 : « **11 fichiers ne sont référencés nulle part dans `src/`** (orphelins stricts […]) : `ccjv-07`, `ccjv-10`, `ccjv-14`, `ccjv-20`, `ccjv-21`, `ccjv-22`, `ccjv-26`, `ccjv-29`, `ccjv-35`, `ccjv-39`, `ccjv-41`. »
  - L654 : « **Bilan** : 41 fichiers présents, 30 référencés, **28 réellement rendus**, **13 jamais affichés** (11 orphelins stricts + 2 référencés par du code mort). »
  - L618 : `src/app/organisation/departements/[slug]/page.tsx` ligne 121 : « **chemin codé en dur** dans le JSX : `src={department.bannerImage ?? "/media/ccjv-15.jpeg"}` — seule occurrence directe dans `src/app/` ».
  - L444 : `PageHeader.tsx` (175 lignes) « impose le bloc d'en-tête, sa grille 12 colonnes (7/5), le `h1` unique et un padding haut compensant le header fixe (68 px) ».
  - L459 : `CrossMark` — `variant?: "solid" | "fine" | "ornate"` « (**déclaré mais jamais lu**) ».
- **PROPOSALS** : aucune (« observation pure »).
- **DECISIONS** : aucune.
- **Concrete enumerations (verbatim)**
  - Inventaire des 30 routes (L27-385) — cf. §F.
  - Matrice de similarité (L391-422) — cf. §F.
  - Composants partagés `src/components/shared/` (L442-459) : `PageHeader.tsx` (175), `Section.tsx` (40), `SectionHeading.tsx` (47), `Reveal.tsx` (59), `Timeline.tsx` (39), `WeekRhythm.tsx` (38), `OpenBookMark.tsx` (42), `VerseSection.tsx` (94), `BreathingPhoto.tsx` (77), `Breadcrumbs.tsx` (76), `YouTubeThumb.tsx` (37), `TestimonyCarousel.tsx` (157), `CommunityFaces.tsx` (132), `HubDoors.tsx` (52), `LegalPage.tsx` (75), `CrossMark.tsx` (93).
  - Composants `src/components/ui/` (L463-467) : `Button.tsx` (107, variantes `"primary" | "outline" | "ghost" | "inverse"`, tailles `"md" | "lg"`), `Badge.tsx` (23, `"default" | "dark" | "outline"`), `EmptyState.tsx` (31).
  - Composants `src/components/layout/` (L471-476) : `Header.tsx` (116), `FullscreenMenu.tsx` (185), `IntroCurtain.tsx` (33), `Footer.tsx` (114).
  - Composants `src/features/**` (L480-491) : `pages/Hero.tsx` (90), `events/FeaturedEvent.tsx` (81), `events/EventRow.tsx` (36), `events/EventCard.tsx` (86, **jamais importé**), `publications/TeachingFeature.tsx` (105), `publications/TeachingCard.tsx` (76), `publications/PublicationCard.tsx` (96), `departments/DepartmentCard.tsx` (33, **jamais importé**), `departments/DepartmentFeature.tsx` (42, **jamais importé**), `search/SearchClient.tsx` (97, « plafond 30 résultats »).
  - `images.ts` clés (L511-528) : `hero` `/media/ccjv-02.jpeg` ; `identite` `/media/ccjv-27.jpeg` ; `louange` `/media/ccjv-08.jpeg` ; `communaute` `/media/ccjv-30.jpeg` ; `ecodim` `/media/ccjv-13.jpeg` ; `portraitLarge` `/media/ccjv-05.jpeg` ; `portraitA` `/media/ccjv-01.jpeg` ; `portraitB` `/media/ccjv-03.jpeg`.
  - `galleryImages` (L531-542) : `ccjv-09`, `11`, `12`, `15`, `23`, `25`, `28`, `32`, `37`, `40` (10 entrées).
  - Répartition des occurrences (L660-669) — tableau complet repris en §E.
- **Thresholds / numbers**
  - L6 / L426 / L434 : « 30 fichiers `src/app/**/page.tsx` » ; « 30 routes ».
  - L434 : « **8 squelettes distincts** », « **3 squelettes dominants qui couvrent 25 routes sur 30** », « `VerseSection` clôt 29 pages sur 30 ».
  - L383 / L491 : « plafonnée à **30 entrées** » / « plafond **30 résultats** ».
  - L444 : header « 68 px ».
  - L448 : `Timeline` = `<ol>` bordée « (3 jalons) » (L143 : `Timeline` en `<ol>` bordée (3 jalons)).
  - L553 : 41 fichiers ; L557 : 86 occurrences ; L654 : 30 référencés / 28 rendus / 13 jamais affichés.
  - L143 : « `Timeline` en `<ol>` bordée (3 jalons) » ; L167 : « 1 grille de 5 cartes-responsables (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`) ».
  - L81 : « **2 à 5** » photos par fiche événement ; L189 : « Photos : 7 » sur fiche département ; L191 : « galerie `grid-cols-2 md:grid-cols-3` (6 images) » ; L299 : « 4 créneaux de `weeklyRhythm` » ; L311 : « 4 cartes-témoignages […] (largeurs 86 % / 62 % / 48 % selon le breakpoint) ».
  - L36 : accueil « ≈ 360 mots » ; L120 : ce-que-nous-croyons « ≈ 270 mots » ; etc. (repris en §F).
- **Contradictions** → §H #3, #4, #11, #12, #20, #21, #28, #29.

## DOC: 015-architecture_editoriale.md (16083 o, 294 lignes)
- **Purpose** : architecture éditoriale — archétypes de composition remplaçant le template unique.
- **Document type** : guide (spécification d'implémentation) — se présente comme déjà « livré » par endroits → **ASPIRATIONAL**
- **Claims of FACT**
  - L3 : « **Statut :** spécification d'implémentation (précède le code). »
  - §1 Diagnostic (L13-40) — mesures sur l'état antérieur ; renvoie à `docs/014`.
    - L29-37 table : « Squelettes distincts sur l'ensemble du site | **8** » ; « Squelettes couvrant à eux seuls 25 des 30 routes | **3** » ; « `PageHeader → Section → VerseSection` | 9 pages » ; « `PageHeader → Section → Section(tinted) → VerseSection` | 10 pages » ; « `PageHeader → Section(tinted) → Section → VerseSection` | 6 pages » ; « Pages closes par `VerseSection` | **29 / 30** » ; « Pages utilisant un héros `dark` | 0 » ; « Photographies disponibles jamais rendues | **13 / 41** » ; « Composants déclarés mais jamais importés | `EventCard`, `DepartmentCard`, `DepartmentFeature` ».
  - **ASPIRATIONAL — §4.2 « Livré »** (L169-197) : titre « ### 4.2 Livré » et §4.3 « Bilan mesuré » avec colonne « Après » — décrit un état présenté comme réalisé :
    - L205 : « Pages closes par un verset plein écran | 29 / 30 | **1** (`/`, où le verset ouvre la page) »
    - L206 : « Pages utilisant `PageHeader` | 24 / 30 | **0** »
    - L207 : « Photographies rendues (somme des pages) | — | **189** »
    - L208 : « Photographies du fonds utilisées | 28 / 41 | **32 / 41** »
    - L209 : « Emplacements `TODO — … À FOURNIR` assumés | 0 | **19** »
    - L210 : « Pages piliers servies | 5 | **0** »
    - ⚠️ Ces « Après » sont contredits par `docs/019` §3 (pages listées comme présentes dans `015` §4.2 déclarées **absentes** par `019`) — voir §H #26.
  - L243-246 : « **Aucune redirection n'a été posée** : les cinq routes piliers répondent désormais 404, conformément à la règle « migrer directement, sans couche de redirection ». »
  - L263-264 : faits confirmés — « Fait confirmé (fondation 17 mars 2023, Ecodim 2 juillet 2023, Pasteur Manasse Mwamba, Lubumbashi) » ; « Fait fourni depuis : adresse *Quartier Hewa Bora, Avenue Djoloko* ; chorale *lundi 16h30–18h30, mercredi dans la nuit, samedi 16h30–18h30* ».
  - L268-270 : « Aucune légende photographique affirmative n'est écrite : l'agent n'a pas de capacité d'analyse d'image »
- **PROPOSALS**
  - L69-70 : « > `Section` reste exporté pour compatibilité mais ne doit plus être utilisé dans les nouvelles compositions. »
  - L84-86 : « `PageHeader` (la « baie ») devient **un héros parmi d'autres** (`HeroArched`) […] et n'est plus employé par défaut. »
  - L109-111 : « > **`VerseSection` et `CrossMark` ne sont plus automatiques.** »
  - L287-294 §7 « Ordre d'implémentation » (6 étapes, dont « 6. Généralisation aux 26 autres route »).
  - L248-253 : « **Contenu à replacer.** Les compositions des cinq pôles supprimés […] n'ont pas été redistribuées : elles ont été retirées avec leur page. »
- **DECISIONS**
  - §4.5 « Palier 1 — un pôle n'est pas une destination » (L225-246) : « **Décision produit.** Seul l'accueil possède une page propre. « Qui sommes-nous », « Vie de l'Église », « Communauté », « Organisation » et « Publications & Médias » sont des **regroupements** »
  - Conséquences implémentées (L233-241) : `src/lib/nav.ts` `NavItem.href` **optionnel** ; mega menu desktop = titre jamais lien ; mega menu mobile ; fil d'Ariane non cliquable ; pied de page groupé ; `sitemap.ts` seules sous-pages indexées ; recherche exclut les pôles.
- **Concrete enumerations (verbatim)**
  - Tons `Band` (L55) : `light|dark|cream|tinted|green|bare`.
  - Spaces `Band` (L61-67) : `tight`, `normal`, `airy`, `silence`, `flush`.
  - 7 archétypes de héros (L74-82) : `HeroEditorial` (A) ~120 mots ; `HeroPhoto` (B) ~80 ; `HeroCentered` (C) ~90 ; `HeroSplit` (D) ~140 ; `HeroImmersive` (E) hauteur `88svh`, ~70 ; `HeroPractical` (F) « Pas de photographie », ~60 ; `HeroManifesto` (G) ~100.
  - 16 briques éditoriales (L92-107) avec variantes verbatim :
    | `Prose` | `lead`, `dropcap`, `columns` |
    | `FeatureImage` | `full`, `wide`, `inset`, `arch`, `portrait`, `float` |
    | `PhotoDuo` | `equal`, `offset` |
    | `PhotoGallery` | `mosaic`, `strip`, `columns` |
    | `PullQuote` | `left`, `center`, `marginal` |
    | `ScriptureBlock` | `inline`, `framed`, `marginal`, `wide`, `concluding` |
    | `KeyFacts` | `pairs`, `tiles`, `inline` |
    | `ConvictionList` | `numbered`, `lettered` |
    | `Chapter` | `left`, `right`, `noPhoto` |
    | `PortraitPanel` | `hero`, `side` |
    | `PeopleGrid` | `feature`, `compact` |
    | `CrossLinks` | `doors`, `list`, `inline` |
    | `InfoPanel` | `full`, `compact` |
    | `StepsList` | `horizontal`, `vertical` |
    | `MediaFeature` | `hero`, `inline` |
    | `ContentPending` | `block`, `inline` |
  - 8 archétypes de page (L124-131) : `EditorialPage`, `NarrativePage`, `ListingPage`, `DetailPage`, `EventPage`, `MediaPage`, `DirectoryPage`, `InformationPage`.
  - Matrice route → archétype cible (L141-167) — cf. §F.
  - Matrice « Livré » (L174-197) — cf. §F.
  - Politique de contenu (L261-266) — cf. §E/§I.
- **Thresholds / numbers**
  - L141 : `/` « Photos cible 6–8 » ; L148 : fiche événement « 3 + galerie » ; L163 : médiathèque « 9+ ».
  - L203 : « Héros distincts employés | 1 (`PageHeader`) | **8** » ; L204 : « Archétypes employés | 1 (implicite) | **8** ».
  - L207 : 189 ; L208 : 32/41 ; L209 : **19** emplacements TODO.
  - §6 Profondeur éditoriale (L278-281) : « Page majeure (accueil, hubs) | 8–12 » ; « Page éditoriale secondaire | 5–8 » ; « Page fonctionnelle | 3–6 » ; « Fiche de détail | variable ».
  - L80 : « Hauteur `88svh` ».
- **Contradictions** → §H #4, #11, #26, #27.

## DOC: 016-guide_composition_pages.md (9633 o, 216 lignes)
- **Purpose** : guide opérationnel d'écriture d'une page après la refonte éditoriale (vocabulaire, politique de contenu, vérification).
- **Document type** : guide
- **Claims of FACT**
  - L1-4 : « # 016 — Guide d'implémentation des pages » ; « > Guide opérationnel pour écrire une page CCJV après la refonte éditoriale. » → présuppose la refonte déjà faite (**ASPIRATIONAL** vis-à-vis de `019`).
  - L168-171 : « **Faits confirmés :** fondation 17 mars 2023 · Ecodim 2 juillet 2023 · Pasteur Manasse Mwamba (visionnaire) · Lubumbashi, RDC · adresse *Quartier Hewa Bora, Avenue Djoloko* · chorale *lundi 16h30–18h30, mercredi dans la nuit, samedi 16h30–18h30*. »
  - L176-178 : « Aucune légende photographique affirmative : l'agent n'a pas d'analyse d'image. Une légende n'est écrite que si elle n'affirme rien sur le contenu de la photo (ex. `Centre Chrétien Jésus ma Vie — Lubumbashi`). »
  - L211-215 : contraintes de code — « **JSX** : ne pas écrire `>` `"` `}` en texte brut (règle ESLint) » ; « Serveur par défaut ; `"use client"` seulement si indispensable. » ; « Ne jamais écrire de fichier via PowerShell (encodage) » ; « Ne pas lancer `next build` si `npm run dev` tourne (conflit sur `.next`). »
- **PROPOSALS** : §2 « Vocabulaire disponible » (composants `@/components/composition/*`, `@/components/editorial/*`, `@/components/archetypes/*`) — proposés.
- **DECISIONS**
  - L31 / §1.1 : « Créer une page pour un pôle | **Un pôle n'est pas une destination** — voir §1.1 » (interdit).
  - L141 : « Ajouter une page à un pôle = ajouter un enfant dans `mainNav`, jamais recréer le pôle. Aucune redirection n'est posée : une route pilier doit répondre 404. »
  - §5 « Politique de contenu — non négociable » (L160-174).
- **Concrete enumerations (verbatim)**
  - Interdits (L21-31) : « Ouvrir toutes les pages par le même héros » ; « Terminer toutes les pages par un verset plein écran » ; « Afficher une croix + le nom du pôle en tête de chaque page » ; « `Breadcrumb → Label → Titre → Description → Verset → Image` » ; « Trois cartes identiques en grille » ; « Une seule photographie par page » ; « `Section` + `SectionHeading` systématiques » ; « Inventer un fait institutionnel » ; « Créer une page pour un pôle ».
  - `Band` props (L40-45) : `tone="light | cream | tinted | dark | green | bare"` ; `space="flush | tight | normal | airy | silence"` ; `width="container | wide | full"` ; `rule="top | bottom | both"`.
  - Héros (L55-62) : `HeroEditorial`, `HeroPhoto`, `HeroCentered`, `HeroSplit`, `HeroImmersive`, `HeroPractical`, `HeroManifesto`, `HeroCompact` — avec leurs props listées verbatim.
  - Briques (L71-86) : `Prose`, `FeatureImage`, `PhotoDuo`, `PhotoGallery`, `PullQuote`, `ScriptureBlock`, `KeyFacts`, `ConvictionList`, `Chapter`, `PortraitPanel`, `PeopleGrid`, `CrossLinks`, `InfoPanel`, `StepsList`, `MediaFeature`, `ContentPending`.
  - Briques conservées (L88-91) : `Timeline`, `WeekRhythm`, `YouTubeThumb`, `Badge`, `Button`, `EmptyState`, `Reveal`, `CrossMark`, `OpenBookMark`, `BreathingPhoto`, `TestimonyCarousel`, `CommunityFaces`, `LegalPage`, « ainsi que les composants de `@/features/**` ».
  - Archétypes et emplacements (L99-106) verbatim :
    | `EditorialPage` | `hero, intro?, feature?, body?, pullQuote?, deepening?, scripture?, related?` |
    | `NarrativePage` | `hero, prologue?, chapters?, feature?, chronology?, epilogue?, related?` |
    | `ListingPage` | `header, lead?, list?, listTitle?, archives?, archivesTitle?, related?` |
    | `DetailPage` | `media, summary?, body?, aside?, gallery?, related?, relatedTitle?` |
    | `EventPage` | `hero, summary?, description?, practical?, program?, gallery?, related?` |
    | `MediaPage` | `hero, featured?, listing?, listingTitle?, gallery?, galleryTitle?, collections?, collectionsTitle?, related?` |
    | `DirectoryPage` | `hero, intro?, lead?, directory?, directoryTitle?, responsibilities?, responsibilitiesTitle?, related?` |
    | `InformationPage` | `header, context?, facts?, factsTitle?, steps?, stepsTitle?, contact?, photo?, related?` |
  - Exemples de référence (L117-120) : `NarrativePage` → `src/app/qui-sommes-nous/d-ou-nous-venons/page.tsx` ; `EditorialPage` → `src/app/communaute/groupes-de-maison/page.tsx` ; `ListingPage` → `src/app/publications/actualites/page.tsx` ; `EventPage` → `src/app/vie-de-leglise/evenements/[slug]/page.tsx`.
  - Vérification (L197-207) : `npx tsc --noEmit` « doit sortir 0 » ; `npx eslint src` « doit sortir 0 » ; 5 contrôles post-rendu.
- **Thresholds / numbers**
  - L184-185 : « **Au moins 3 photographies** sur une page majeure, **au moins 1** sur une page secondaire ; aucune sur les pages fonctionnelles pures. »
  - L149-151 : profondeur — « Page majeure (hub) | 8–12 » ; « Page éditoriale secondaire | 5–8 » ; « Page fonctionnelle | 3–6 ».
  - L206 : « Les photographies s'affichent (chemins `/media/ccjv-XX.jpeg`). »
- **Contradictions** → §H #4, #26, #28, #29, #30.

## DOC: 017-reference_projet_conception_backend.md (27717 o, 375 lignes)
- **Purpose** : rapport de reconnaissance avant conception backend — documentation + inspection du code.
- **Document type** : audit (rapport de reconnaissance, traçabilité `[Source : …]`)
- **Claims of FACT**
  - L3 : « **Nature :** Rapport de reconnaissance — ANALYSE uniquement, aucune implémentation. »
  - L5-8 : règle de traçabilité — « `[Source : docs/...]` = explicitement documenté, `[Source : src/...]` = observé dans le code, `Déduit` = déduit, `À décider` = reste à décider. »
  - L14 : « Le Centre Chrétien Jésus ma Vie (CCJV) est une église basée à Lubumbashi, en République Démocratique du Congo, fondée le 17 mars 2023 »
  - L18 : « Un **site public vitrine** Next.js déjà implémenté (30 routes, données mockées) »
  - L19 : « Un **back-office** prévu mais **non implémenté** »
  - L20 : « Un **backend API** prévu mais **non implémenté** »
  - L125 : « Aucun `fetch`, aucun client API, aucun appel réseau vers un backend »
  - L375 : « Aucun backend conçu, aucune table/route/migration créée. »
- **PROPOSALS** : néant (rapport).
- **DECISIONS** — §18 « Décisions déjà figées » (L333-335) verbatim :
  - « Stack, couches, patterns, version `/api/v1`, formats de réponse, `ROLE_ADMIN` seul en V1, départements dynamiques, vidéos externes, état événement calculé, hébergements Vercel/Railway, DNS Namecheap, design (palette, Lora/Inter, boutons carrés, cartes sans ombre, coins droits, croix visible, menu plein écran, CTA « Nous rejoindre » → `/contact`, WhatsApp contextuel, WCAG 2.2 AA) »
  - « Règle du GEL : toute modification fondamentale (stack, architecture, modèle métier, API, auth, stockage) après Phase 3 = modification de périmètre reportée en Phase 6 »
- **Concrete enumerations (verbatim)**
  - §3.1 liste de routes (L46-68) — 24 lignes de table, dont : `/`, `/qui-sommes-nous`, `/qui-sommes-nous/ce-que-nous-croyons`, `/qui-sommes-nous/d-ou-nous-venons`, `/qui-sommes-nous/qui-nous-dirige`, `/vie-de-leglise/evenements`, `/vie-de-leglise/evenements/[slug]`, `/vie-de-leglise/ou-nous-trouver`, `/vie-de-leglise/faire-un-don`, `/communaute/groupes-de-maison`, `/communaute/parcours-nouveau`, `/communaute/priere-et-intercession`, `/communaute/temoignages`, `/organisation`, `/organisation/departements`, `/organisation/departements/[slug]`, `/publications/actualites`, `/publications/enseignements`, `/publications/mediatheque`, `/publications/ressources`, `/publications/[slug]`, `/mentions-legales`, `/confidentialite`, `/conditions`, `/accessibilite`, `/recherche`.
  - §4.2 organisation `src/` (L100-116) : `components/{ui,layout,shared,composition,editorial,archetypes,forms}` ; `features/{events,publications,pages,search}` ; `data/mock/` = « site, departments, events, publications, leaders, community, testimonies, verses, images » ; `lib/` = « nav.ts, seo.ts, utils.ts » ; `types/index.ts (Department, Event, Publication, StaticPage)`.
  - Types TypeScript (L132-138) verbatim :
    ```ts
    type PublicationType = "VIDEO" | "PHOTO" | "TEXTE";
    type EventStatus = "UPCOMING" | "ARCHIVED"; // calculé, jamais persisté
    interface Department { id; name; slug; description?; responsibleName?; bannerImage?; meetingSchedule?; keyPoints?: string[]; gallery?: string[]; tagline? }
    interface Event { id; title; slug; description?; eventDate: string; eventTime?; location?; imageUrl?; departmentId?: string | null; status: EventStatus; excerpt?; bannerImage?; gallery?: string[]; practicalInfo?: string[] }
    interface Publication { id; title; slug; type; contentUrl?; description?; publishedAt: string; category?: "ACTUALITE"|"ENSEIGNEMENT"|"MEDIA"|"RESSOURCE"; author?; body?: string[] }
    type PageKey = "ACCUEIL" | "QUI_SOMMES_NOUS" | "COMMUNAUTE" | "CONTACT";
    interface StaticPage { id; pageKey: PageKey; content: string }
    ```
  - §5 classification A–F (L147-170) : A « Strictement statique », B « Éditable depuis le futur Back-Office », C « Dynamique (CRUD backend requis) », D « Dépendant d'une relation entre plusieurs entités », E « Susceptible d'être stocké dans Supabase Storage », F « Dépendant d'une authentification ou permission ».
  - §10 Rôles (L241-243) :
    | Visiteur | Consulter le site public | Lecture seule |
    | Administrateur (`ROLE_ADMIN`, seul rôle V1) | Gérer tout le contenu via back-office | CRUD départements/événements/publications, PATCH pages statiques, upload médias, dashboard |
    | Éditeur (optionnel, hors V1) | Responsable de département | Publier dans sa rubrique — reporté |
  - §11 Entités (L251-255) : « **Documentées (5) :** `Admin`, `Department`, `Event`, `Publication`, `StaticPage` » ; « **Observées en plus dans le frontend […] :** `Leader`, `Testimony`, `CommunityFace`, `Verse`, `RhythmEntry`, `SocialLink`, `NavItem`/`NavChild` » ; « **Calculée :** `EventStatus` ».
  - §17 Contradictions (L322-327) — 6 lignes, reprises verbatim dans §H.
  - §20 Questions (L347-371) — 14 questions, cf. §I.
- **Thresholds / numbers**
  - L18 : « (30 routes, données mockées) ».
  - L68 : « Recherche interne (index statique, plafond 30 résultats) ».
  - L190 : « `ContentPending` / `TODO — … À FOURNIR` (19 emplacements) ».
  - L194 : volumes de mots (≈ 360 / 290 / 270 / 210 / 200 / 200 / 190 / 190 ; fiches `[slug]` ≈ 30–40).
  - L202 : « **Events :** 7 mocks (4 UPCOMING, 3 ARCHIVED) ».
  - L203 : « **Departments :** 3 mocks (Adultes, Enfants/Ecodim, Chorale) ».
  - L204 : « **Publications :** 10 mocks ».
  - L205 : « **Leaders :** 5 entrées » ; L206 : « **Testimonies :** 4 entrées » ; L207 : « **CommunityFaces :** 5 visages ».
  - L216 : « `public/media/` : 41 fichiers […] 32/41 utilisés, 86 occurrences ».
  - L217 : « `public/images/` : 41 originaux WhatsApp (38–245 Ko…) ».
  - L218 : « `public/logo.png` (1254×1254, 405 Ko), `logo_2.png` ».
- **Contradictions** → §H #4, #5, #6, #7, #12, #15, #17, #20, #28.

## DOC: 018-decisions_conception_backend.md (21272 o, 396 lignes)
- **Purpose** : spécification d'implémentation du backend — arbitrages des points « À décider » de `017`, schéma final, contrat API, auth, médias, tests.
- **Document type** : decision-record
- **Claims of FACT**
  - L6-7 : « **Règle :** aucune décision n'est prise contre un document validé. Quand deux documents divergent, la contradiction est nommée et l'arbitrage est justifié. »
  - §0 (L18) : « Nombre de routes | 30 | **21** `page.tsx` | Le contrat API ne dépend pas des routes ».
  - L19 : « `/qui-sommes-nous/ce-que-nous-croyons`, `/d-ou-nous-venons`, `/qui-nous-dirige` | présentes | **absentes** »
  - L20 : « `/organisation/departements`, `/departements/[slug]`, `/responsables` | présentes | **absentes** (supprimées) | Les départements ne sont plus des routes »
  - L21 : « `/organisation` | hub supprimé (palier 1) | **présent** (recréé, non commité) »
  - L23 : « `src/components/forms/` | absent | **`PrayerRequestForm.tsx` présent** »
  - L90-93 : « `src/components/forms/PrayerRequestForm.tsx` collecte **intention, prénom optionnel, contact optionnel et niveau de confidentialité**, puis **simule** l'envoi (`setTimeout`) en affichant « Votre demande a bien été reçue ». Aucun document ne mentionne cette fonctionnalité. »
  - §13 (L350-365) : « Un projet Supabase a été provisionné via la CLI, lastack locale étant impossible (Docker installé mais **WSL2 absent** de la machine). » Table : Projet `ccjv-church` ; Référence `fcdyqwconmymcznsaykw` ; Région Central EU (Francfort) ; Organisation `zpiouipvljtebodcpyif` ; Hôte base `aws-1-eu-central-1.pooler.supabase.com:5432` (mode session).
  - L369-377 tableau de vérifications : « Les migrations fonctionnent | **Vérifié** | 16 tables et 6 enums créés en base ; 1 migration enregistrée dans `drizzle.__drizzle_migrations` » ; « L'authentification fonctionne | **Vérifié** | Connexion réelle, jeton `aud=authenticated` / `iss` conforme, vérification JWKS réussie » ; « Le schéma est fonctionnel | **Vérifié** » ; « Les médias fonctionnent | Voir `backend/README.md` » ; « Le backend peut être déployé | Préparé ».
  - L381 : « Créé par `backend/scripts/create-admin.ts` »
  - L367 : « Les secrets vivent dans `backend/.env`, ignoré par Git. »
- **PROPOSALS** : néant (document de décisions).
- **DECISIONS** (toutes explicites, numérotées §1 #1–#6)
  - §1 table d'arbitrages (L39-44) verbatim :
    | 1 | `events.is_archived` : présent (`docs/005` §2.3) vs supprimé (`docs/006` §5) | **Supprimé.** Statut calculé depuis `event_date` |
    | 2 | `Admin` persistant avec `password_hash` vs auth Supabase Auth | **Pas de mot de passe en base.** Table de profil liée à `auth.users.id` |
    | 3 | Entités `Leader`, `Testimony`, `CommunityFace` absentes du schéma 5 tables | **Persistées** |
    | 4 | `PageKey` … | **Liste ouverte** pilotée par les `pageKey` existants en base |
    | 5 | IDs `INTEGER` vs `UUID / Integer` vs `string` | **UUID v4** (sauf mention contraire) |
    | 6 | `DRAFT`/`PUBLISHED` : « supprimable » vs opérations « publier / dé publier » exigées (cahier §8) | **Statut conservé sur `publications`** |
  - §2 (L50) : « **Décision : même dépôt, dossier `server/`.** » ; L52 : « Railway pointera sa *Root Directory* sur `server/`. »
  - §3 (L95) : « **Décision : implémenter `POST /api/v1/prayer-requests` et la table `prayer_requests`.** »
  - §4 (L114) : « 14 tables. Pas de table « au cas où » ».
  - §4.5 (L168) : « **Décision :** en base, ces champs sont des références `media` […] ; en API, ils sont **sérialisés en URL publiques** »
  - §5 (L181) : « **Décision : `jsonb` validé par un registre Zod, un schéma par `page_key`.** »
  - §7 (L269-272) : `requireAuth` → 401 `AUTH_REQUIRED` ; `requireRole(...)` → 403 `FORBIDDEN` ; `requireSelf` → 403 `FORBIDDEN` ; « Un middleware unique `authorize(policy)` consomme une politique déclarative par route. »
  - §8 (L284) : « **Bucket** : `ccjv-media` (public en lecture, écriture serveur uniquement). »
- **Concrete enumerations (verbatim)**
  - 14 tables annoncées, énumérées ainsi :
    - §4.1 (L121) : `admin_profiles` — `id uuid PK` (= `auth.users.id`), `username citext UNIQUE`, `role` enum `ROLE_ADMIN`, `is_active bool`, `created_at`, `updated_at`.
    - §4.2 (L131-136) : `departments`, `events`, `publications`, `leaders`, `testimonies`, `community_faces`.
      - `departments` : `id uuid PK`, `name`, `slug UNIQUE`, `description`, `responsible_name`, `tagline`, `meeting_schedule`, `banner_media_id FK→media`, `key_points text[]`, `position int`, `created_at`, `updated_at`.
      - `events` : `id uuid PK`, `title`, `slug UNIQUE`, `description`, `excerpt`, `event_date date NOT NULL`, `event_time time`, `location`, `image_media_id FK→media`, `banner_media_id FK→media`, `department_id FK→departments NULL`, `practical_info text[]`, `created_at`, `updated_at` — « **Pas de `is_archived`.** Index `(event_date)` ; index `(department_id)` ».
      - `publications` : `id uuid PK`, `title`, `slug UNIQUE`, `type` enum, `category` enum, `content_url`, `description`, `body text[]`, `author`, `published_at date NOT NULL`, `status` enum `DRAFT`\|`PUBLISHED`, `cover_media_id FK→media`, `created_at`, `updated_at` — « Index `(published_at DESC)`, `(category)`, `(status)` ».
      - `leaders` : `id uuid PK`, `name`, `role`, `scope`, `bio`, `photo_media_id FK→media`, `department_id FK→departments NULL`, `position int`, `created_at`, `updated_at`.
      - `testimonies` : `id uuid PK`, `quote`, `person_name`, `person_role`, `photo_media_id FK→media`, `position int`, `created_at`, `updated_at`.
      - `community_faces` : `id uuid PK`, `person_name`, `caption`, `photo_media_id FK→media`, `position int`, `created_at`, `updated_at`.
    - §4.3 (L142-146) : `static_pages` (`content jsonb NOT NULL`, `updated_by FK→admin_profiles NULL`) ; `scriptures` (`key text UNIQUE`, `text`, `reference`, `translation` — défaut `Louis Segond 1910`, `context`) ; `schedule_entries` (`day`, `title`, `time_label`, `audience`, `is_confirmed bool`, `position int`) ; `social_links` (`label`, `href`, `position int`) ; `site_settings` (`key text PK`, `value text`).
    - §4.4 (L158-160) : `media` (`id uuid PK`, `bucket`, `path UNIQUE`, `public_url`, `mime_type`, `size_bytes`, `width`, `height`, `alt`, `uploaded_by FK→admin_profiles NULL`, `created_at`) ; `event_media` (`event_id FK`, `media_id FK`, `position int`, PK composite) ; `department_media` (`department_id FK`, `media_id FK`, `position int`, PK composite).
    - §3 (L100-102) : `prayer_requests` — « `id`, `request_text`, `requester_name?`, `requester_contact?`, `confidentiality` (`private` | `community`), `status` (`NEW`|`PRAYED`), `created_at`, `handled_at?` ».
    - ⚠️ Comptage : §4 annonce **14 tables** mais en énumère **15** (+ `prayer_requests` = 16) — et §13 dit « **16 tables** » (L373). Voir §H #31.
  - Contrat API public (L214-226) : `GET /events` (filtres `page`, `limit`, `status` (`UPCOMING`|`ARCHIVED`), `departmentId`, `sort`) ; `GET /events/:idOrSlug` ; `GET /departments` ; `GET /departments/:idOrSlug` ; `GET /publications` (`type`, `category`, `sort`) ; `GET /publications/:idOrSlug` ; `GET /leaders` · `/testimonies` · `/community-faces` ; `GET /schedule` ; `GET /scriptures` · `/scriptures/:key` ; `GET /settings` ; `GET /pages/:pageKey` ; `POST /prayer-requests` (**public**, rate limité) ; `GET /health`.
  - Contrat API admin (L233-236) : `POST`/`PATCH`/`DELETE` sur `/events`, `/departments`, `/publications`, `/leaders`, `/testimonies`, `/community-faces`, `/schedule`, `/scriptures`, `/social-links`, `/settings`, `PATCH /pages/:pageKey`, `POST /media`, `GET /prayer-requests` ; `GET /admin/me`.
  - Codes d'erreur complétés (L245-248) : ceux de `docs/004` §26 + `RATE_LIMITED` et `UNAUTHENTICATED_ADMIN`.
  - Dossiers Storage (L285-286) : « `events/`, `departments/`, `publications/`, `leaders/`, `testimonies/`, `community/`, `pages/` ».
  - Types MIME autorisés (L287) : « `image/jpeg`, `image/png`, `image/webp`, `image/avif`. »
  - Hiérarchie d'erreurs (L301-303) : `AppError` → `NotFoundError`, `ValidationError`, `ConflictError`, `AuthError`, `ForbiddenError`, `PayloadTooLargeError`, `UnsupportedMediaTypeError`.
  - Niveaux de test (L334-341) : Unitaire (Vitest) / Intégration (Vitest + base de test) / BOUT EN BOUT (`supertest`) — tous Vitest.
  - §14 « Reste à fournir par CCJV » (L391-396) : 5 items verbatim (confession de foi, identités réelles, horaires confirmés, numéro WhatsApp, liens YouTube).
- **Thresholds / numbers**
  - L249 : « **Pagination** : `page` ≥ 1 (défaut 1), `limit` 1–100 (défaut 20). »
  - L288 : « **Taille max : 5 Mo.** »
  - L324-325 : « `Cache-Control: public, max-age=60, stale-while-revalidate=300` sur les lectures publiques ; `no-store` sur les routes d'administration. »
  - L114 : « 14 tables » ; L373 : « 16 tables et 6 enums ».
  - L43 : « **UUID v4** ».
  - L143 : `translation` par défaut `Louis Segond 1910`.
  - L391 : « (19 emplacements `TODO` du frontend) ».
  - L394 : « (actuellement `+243 123 456 789`, démonstration) ».
- **Contradictions** → §H #1, #4, #7, #8, #11, #13, #18, #19, #31.

## DOC: 019-verification_reference_opencode.md (3940 o, 82 lignes)
- **Purpose** : vérification factuelle des allégations de `docs/017` contre l'état réel du dépôt.
- **Document type** : verification
- **Claims of FACT** (vérifiés annoncés comme tels)
  - L3-4 : « **Objet :** confronter le rapport de reconnaissance OpenCode (`docs/017`) à l'état réel du dépôt » ; « **Méthode :** chaque allégation vérifiable a été testée sur le disque, pas reprise sur parole. »
  - L12-16 : « Le rapport `docs/017` est **de bonne qualité sur le fond métier** […] Sa **cartographie du code, en revanche, est périmée** : le frontend a été remanié après sa rédaction. »
  - §2 Allégations exactes (L24-32) : `PrayerRequestForm.tsx` existe ; `EventsSection.tsx`, `ParallaxImage.tsx` existent ; `public/media/` contient 41 fichiers ; `public/images/` contient 41 originaux ; « Aucun appel réseau dans `src/` » ; contradiction `is_archived` réelle — « **4 mentions dans `005`, 3 dans `006` qui le supprime** » ; « Le frontend ne persiste pas `is_archived` […] Les 2 seules occurrences sont des **commentaires** (`types/index.ts`, `lib/utils.ts`) » ; « 5 pôles sans page dédiée, sans redirection ».
  - §3 Allégations inexactes (L38-47) verbatim :
    | « 30 routes observées » | **21** fichiers `page.tsx` |
    | `/qui-sommes-nous/ce-que-nous-croyons` existe | **Absent** |
    | `/qui-sommes-nous/d-ou-nous-venons` existe | **Absent** |
    | `/organisation/departements` existe | **Absent** |
    | `/organisation/responsables` existe | **Absent** |
    | `features/events/EventCard.tsx` « observé mais inutilisé » | **Le fichier n'existe pas** |
    | `features/departments/DepartmentCard.tsx` « observé mais inutilisé » | **Le fichier n'existe pas** |
    | `features/departments/DepartmentFeature.tsx` | **Le dossier `features/departments/` n'existe pas** |
  - L49-50 : « la liste de routes de `docs/017` §3.1 **ne peut pas servir de référence** pour l'intégration frontend. C'est `frontend/src/app/` qui fait foi. »
  - §4 (L58-67) : « **Le frontend a été restructuré** : pôles de retour (`/qui-sommes-nous`, `/organisation`), sous-pages supprimées, routes renommées (`parcours-nouveau`, `priere-et-intercession`). » ; « **`PrayerRequestForm` a été ajouté** — il **simule** l'envoi (`setTimeout`) en affichant « Votre demande a bien été reçue ». C'est un faux système, non documenté » ; « **Des fichiers de travail non commités** existaient (`organisation/page.tsx`, `OrganisationExplorer.tsx`, `DepartmentModal.tsx`) ».
  - L80-82 : « Les sept contradictions listées par `docs/017` §17 ont été arbitrées une par une dans `docs/018` §1, en faveur du document le plus récent et du contrat réellement implémenté dans le frontend. » ⚠️ `017` §17 n'en liste que **6** (voir §H #32).
- **PROPOSALS** : néant.
- **DECISIONS**
  - L73-78 : « Le backend a été conçu sur le **modèle de données** (stable : `docs/005`, `docs/006`, `frontend/src/types/index.ts`) et **non** sur l'arborescence des routes (instable). » — **décision méthodologique**.
- **Concrete enumerations**
  - Implémentations vérifiées comme existantes (L24-25) : `PrayerRequestForm.tsx`, `EventsSection.tsx`, `ParallaxImage.tsx`.
  - Routes listées comme absentes (L41-44) : `/qui-sommes-nous/ce-que-nous-croyons`, `/qui-sommes-nous/d-ou-nous-venons`, `/organisation/departements`, `/organisation/responsables`.
  - Composants listés comme inexistants (L45-47) : `features/events/EventCard.tsx`, `features/departments/DepartmentCard.tsx`, `features/departments/DepartmentFeature.tsx`.
- **Thresholds / numbers**
  - L40 : « **21** fichiers `page.tsx` ».
  - L26 : « ✅ 41 » (×2 : `public/media/` et `public/images/`).
  - L29 : « **4 mentions dans `005`, 3 dans `006`** ».
  - L80 : « Les **sept** contradictions » (vs 6 réellement listées dans `017` §17).
  - L30 : « Les **2** seules occurrences ».
- **Contradictions** → §H #4, #11, #32.

## DOC: 020-conception_backoffice.md (20760 o, 920 lignes)
- **Purpose** : document maître de conception du back-office (rôles, périmètre d'accès, médiathèque, workflow de publication, matrice de droits).
- **Document type** : spec (decision-record partiel) — « Document de conception initial ».
- **Claims of FACT**
  - L6 : « **Statut :** Document de conception initial — avant audit stratégique du frontend »
  - L173-176 : « Deux départements disposent actuellement d'un espace métier spécifique : - **Press** ; - **Ecodume**. »
  - L280-285 : « Actuellement : `Press` / `Ecodume` » (départements disposant d'un espace métier).
  - L918 : « **Ce document constitue le document maître initial de conception du Back-Office.** »
  - ⚠️ **ASPIRATIONAL** : tout le document décrit le back-office au présent/futur alors qu'il n'existe pas (`017` L19 « prévu mais **non implémenté** », `017` L74 « Aucune route `/admin` observée »). L'énoncé L173 « disposent actuellement d'un espace métier spécifique » présente comme existant un espace qui n'est pas implémenté.
- **PROPOSALS** : l'essentiel du document est une conception non construite.
  - §2.2 : « BibleVerse ├── variante image ├── variante éditoriale └── variante minimale » ; « Même principe pour les composants réutilisables tels que : Hero, Card, Section événement, Section publication, Call-to-action, Gallery, etc. »
  - §7 médiathèque (L301-352) — cf. §E.
  - §12 modélisation Page → Section (L520-530) — cf. §F.
  - §13 comportements sans données (L576-582) : « masquer la section ; afficher un état vide ; afficher un message éditorial ; afficher un CTA alternatif ; utiliser un contenu de remplacement. »
  - §15 architecture fonctionnelle (L640-657) — cf. §F.
  - §16 tableau de bord (L670-678) : « ce qui nécessite une action ; les événements à venir ; les contenus en brouillon ; les contenus récemment publiés ; les contenus éventuellement incomplets ; les propositions à valider ; les actions fréquentes. »
  - §17 UX (L692-710) : à privilégier / à éviter — listes verbatim.
- **DECISIONS**
  - L128 : « Trois catégories fonctionnelles sont retenues. » → « ## 4.1. Super Administrateur », « ## 4.2. Administrateur », « ## 4.3. Responsable de département ».
  - §5 (L204) : « L'autorisation ne repose pas uniquement sur le rôle. Elle repose sur : `ROLE + SCOPE` »
  - L238-240 : « Cette restriction doit être appliquée **dans le backend**, et non uniquement dans l'interface. Masquer un bouton dans le frontend ne constitue pas une protection suffisante. »
  - L295 : « Cette distinction doit être native dans le modèle de données. »
  - L516-518 : « Les pages ne doivent pas être modélisées comme des documents libres. Le modèle privilégié est : Page ├── Section … »
  - L758-760 : « Le backend reste responsable de l'application des règles métier et des autorisations. Le frontend ne constitue jamais la source de vérité pour les permissions. »
  - L731 : « **Cette matrice est une base de conception et non encore le contrat définitif de permissions.** » (→ la matrice §18 n'est PAS une décision ferme)
- **Concrete enumerations (verbatim)**
  - Trois niveaux du back-office (L114-119) : `CONTENU` (Pages, Médias, Ressources) / `ACTIVITÉS` (Événements, Publications, Départements) / `ADMINISTRATION` (Utilisateurs, Rôles, Permissions, Audit).
  - Super Administrateur (L136-144) : « gérer les administrateurs ; gérer les responsables de département ; gérer les rôles et permissions ; accéder à tous les contenus ; accéder à tous les départements ; gérer les paramètres globaux ; consulter les journaux d'activité ; gérer les ressources et médias ; effectuer les opérations d'administration avancées. »
  - Administrateur (L154-160) : « gérer les contenus éditoriaux autorisés ; gérer les événements ; gérer les publications ; gérer les ressources ; gérer les médias ; gérer les départements ; gérer les données globales du site. »
  - Administrateur — interdits (L166-169) : « créer un Super Administrateur ; modifier ses propres privilèges pour devenir supérieur ; modifier les mécanismes de sécurité ; accéder aux fonctions réservées à la gouvernance du système. »
  - Responsable de département — peut (L182-186) : « informations propres à son département ; événements associés ; publications associées ; médias associés ; autres contenus dynamiques associés à son activité. »
  - Responsable de département — ne peut pas (L190-198) : « modifier les pages statiques globales ; modifier la structure du site ; modifier les composants ; modifier le design ; accéder au département d'un autre responsable ; modifier les permissions ; gérer les utilisateurs ; accéder aux fonctions du Super Administrateur ; accéder aux fonctions globales réservées à l'Administrateur. »
  - Scope Press — autorisé (L223-226) : `Event.department = Press`, `Publication.department = Press`, `Media.department = Press`, `Department.id = Press`. Interdit (L232-235) : `Event.department = Ecodume`, `Publication.department = Ecodume`, `Media.department = Ecodume`, `Department.id = Ecodume`.
  - **Départements de présentation (§6.1, L254-262)** verbatim :
    - Serviteurs ;
    - Chorale Grand Groupe CCVJ ;
    - Chorale de Cano Vocal ;
    - Affaire sociale ;
    - D'hygiène et Ancien semence ;
    - Protocol ;
    - Évangélisation ;
    - Intercession ;
    - autres départements futurs.
  - Champs éditoriaux des départements de présentation (L267-273) : `Nom`, `Description`, `Responsable`, `Image`, `Présentation`, `Informations complémentaires`, `Visibilité`.
  - **Départements avec espace métier (§6.2, L283-285)** : `Press`, `Ecodume`. Ils disposent (L289-293) : « d'une entité département ; d'un responsable ; d'un compte utilisateur ; d'un périmètre d'autorisation ; de données dynamiques propres. »
  - Champs d'un événement (§10, L448-455) : `Titre`, `Description`, `Date`, `Heure`, `Lieu`, `Image`, `Département`, `Statut`.
  - Champs « présentation de Press » (§11, L489-494) : `Nom`, `Description`, `Image`, `Présentation`, `Responsable`, `Informations complémentaires`.
  - Propriétés structurelles réservées à l'administration (§11, L502-508) : `slug`, `ordre d'affichage`, `structure de navigation`, `identifiants techniques`, `règles de visibilité globales`, `configuration système`.
  - Modèle Page → Section (§12, L520-530) :
    ```text
    Page
       │
       ├── Section
       │      ├── type
       │      ├── variante
       │      └── données
       │
       ├── Section
       └── Section
    ```
  - Sections d'Accueil (§12, L540-549) : `Hero`, `BibleVerse`, `Mot du pasteur`, `Présentation`, `Événements à venir`, `Derniers enseignements`, `Communauté`, `Prière`, `Soutenir l'église`.
  - Catégories Contenu / Données dynamiques / Configuration (§14, L594-629) :
    - Contenu : `titre`, `description`, `texte`, `image`, `verset`, `etc.`
    - Données dynamiques : `événements`, `publications`, `départements`, `médias`, `ressources`
    - Configuration : `permissions`, `rôles`, `règles`, `structure`, `paramètres techniques`
  - Navigation cible du back-office (§15, L640-657) : `Tableau de bord` / `Contenu` (Pages, Ressources, Médias) / `Vie de l'église` (Événements, Départements) / `Administration` (Utilisateurs, Rôles & permissions, Journal d'activité, Configuration).
  - **Permissions granulaires (§20, L785-792)** verbatim :
    ```text
    permissions
          ├── publication.create
          ├── publication.read
          ├── publication.update
          ├── event.create
          ├── event.update
          ├── department.update
          └── media.manage
    ```
    Rôle d'exemple : `role = DEPARTMENT_MANAGER` ; `department_id = PRESS`.
  - Vérifications exigées par requête API (§20, L797-801) : « 1. l'identité de l'utilisateur ; 2. son rôle ; 3. sa permission ; 4. son périmètre ; 5. la propriété de la ressource concernée. »
  - **Matrice des droits (§18, L718-729)** verbatim (colonnes `Super Admin | Admin | Resp. Press | Resp. Ecodume`) :
    | Tableau de bord | ✓ | ✓ | ✓ | ✓ |
    | Pages / contenu global | ✓ | ✓ | — | — |
    | Structure éditoriale | ✓ | ✓ | — | — |
    | Médias | ✓ | ✓ | périmètre | périmètre |
    | Événements | ✓ | ✓ | périmètre | périmètre |
    | Publications | ✓ | ✓ | périmètre | périmètre |
    | Département | ✓ | ✓ | son département | son département |
    | Ressources globales | ✓ | ✓ | — | — |
    | Utilisateurs | ✓ | — | — | — |
    | Rôles / permissions | ✓ | — | — | — |
    | Configuration système | ✓ | — | — | — |
    | Audit | ✓ | selon politique | — | — |
  - Méthodologie (§ Position, L886-916) : PHASE 3 → ① Document de conception → ② Audit stratégique frontend → ③ Consolidation du modèle → ④ UML + architecture détaillée → ⑤ Conception UX du Back-Office → ⑥ Contrat API / OpenAPI → ⑦ Roadmap d'implémentation → GEL → PHASE 4 — CODE.
- **Thresholds / numbers**
  - §8.3 (L391-400) : « L'archivage n'est toutefois **pas simplement une action manuelle arbitraire**. Il dépend d'une règle métier basée sur le nombre de publications récentes. Cette règle devra déterminer notamment : - le seuil de publications récentes ; - le périmètre du calcul ; - le moment où une publication devient éligible à l'archivage ; - si l'archivage est automatique ou déclenché par l'administrateur. **La valeur exacte du seuil reste à définir.** » → **THRESHOLD MENTIONED BUT UNVALUED** (le seuil d'archivage est explicitement sans valeur).
  - §4 : « Trois catégories fonctionnelles » ; §6.1 : 8 départements listés nommément + « autres départements futurs » ; §6.2 : 2 départements ; §18 : 4 colonnes de rôles.
- **Contradictions** → §H #10 (Ecodume/Ecodim), #9 (liste des départements), #12 (3 rôles vs 1 rôle), #14 (workflow), #19 (static_pages), #25 (BibleVerse inexistant), #33, #34.

---

# A) ENTITÉS — liste dédupliquée

| Entité | Nommée par | Attributs donnés quelque part |
|---|---|---|
| `Admin` / administrateur | 001:25, 002:101, 004:713, 005:74, 006:33, 011 (implicite), 017:251, 018:121, 020:148 | 002:101 « id, identifiant, mot de passe (haché) » ; 005:80-83 `id`/`username`/`password_hash`/`created_at` ; 006:51-53 `id`/`username`/`passwordHash` ; 018:121 `admin_profiles` : `id uuid PK` (= `auth.users.id`), `username citext UNIQUE`, `role` enum `ROLE_ADMIN`, `is_active bool`, `created_at`, `updated_at` |
| `Department` / département | 001:34, 002:99, 004:256, 005:87, 006:69, 010:221, 011:203, 012:131, 013:114, 014:489, 017:203, 018:131, 020:244 | 002:99 « id, nom, description, responsable » ; 005:93-99 `id`/`name`/`slug`/`description`/`responsible_name`/`created_at`/`updated_at` ; 006:87-91 `id`/`name`/`slug`/`description`/`responsibleName` ; 011:203-209 `id`/`name`/`slug`/`description?`/`responsibleName?` ; 012:138-143 + `bannerImage?`/`meetingSchedule?`/`keyPoints?`/`gallery?` ; 017:134 + `tagline?` ; 018:131 `id uuid PK`, `name`, `slug UNIQUE`, `description`, `responsible_name`, `tagline`, `meeting_schedule`, `banner_media_id FK→media`, `key_points text[]`, `position int`, `created_at`, `updated_at` |
| `Event` / événement | 001:35, 002:98, 004:255, 005:103, 006:103, 010:213, 011:211, 012:130, 013:65, 014:483, 017:202, 018:132, 020:441 | 002:98 « id, titre, date, heure, lieu, description, image » ; 005:109-120 `id`/`title`/`slug`/`description`/`event_date`/`event_time`/`location`/`image_url`/`department_id`/`is_archived`/`created_at`/`updated_at` ; 006:111-118 `id`/`title`/`slug`/`eventDate`/`eventTime`/`location`/`imageUrl`/`departmentId` (**sans** `description`) ; 011:211-222 `id`/`title`/`slug`/`description?`/`eventDate`/`eventTime?`/`location?`/`imageUrl?`/`departmentId?`/`status` ; 017:135 + `excerpt?`/`bannerImage?`/`gallery?`/`practicalInfo?` ; 018:132 `id uuid PK`, `title`, `slug UNIQUE`, `description`, `excerpt`, `event_date date NOT NULL`, `event_time time`, `location`, `image_media_id FK→media`, `banner_media_id FK→media`, `department_id FK→departments NULL`, `practical_info text[]`, `created_at`, `updated_at` ; 020:448-455 `Titre`/`Description`/`Date`/`Heure`/`Lieu`/`Image`/`Département`/`Statut` |
| `Publication` | 001:36, 002:100, 004:257, 005:126, 006:189, 010:227, 011:224, 012:132, 013:130, 014:488, 017:204, 018:133, 020:356 | 002:100 « id, titre, type, contenu, description, date » ; 005:132-139 `id`/`title`/`type`/`content_url`/`description`/`published_at`/`created_at`/`updated_at` ; 006:197-201 `id`/`title`/`type`/`contentUrl`/`publishedAt` (**sans** `description`) ; 011:224-231 `id`/`title`/`type`/`contentUrl?`/`description?`/`publishedAt` ; 017:136 + `slug`/`category?`/`author?`/`body?` ; 018:133 `id uuid PK`, `title`, `slug UNIQUE`, `type` enum, `category` enum, `content_url`, `description`, `body text[]`, `author`, `published_at date NOT NULL`, `status` enum `DRAFT`\|`PUBLISHED`, `cover_media_id FK→media`, `created_at`, `updated_at` |
| `StaticPage` / page statique | 002:102, 004:258, 005:145, 006:233, 011:233, 017:138, 018:142, 020:514 | 002:102 « id, clé (accueil/qui-sommes-nous), contenu » ; 005:151-154 `id`/`page_key`/`content`/`updated_at` ; 006:241-243 `id`/`pageKey`/`content` ; 011:233-237 `id`/`pageKey`/`content` ; 018:142 `id uuid PK`, `page_key text UNIQUE`, `content jsonb NOT NULL`, `updated_at`, `updated_by FK→admin_profiles NULL` |
| `Leader` / responsable | 011:224? (non), 013:112, 014:587, 017:161, 018:134 | 017:161 « `Leader.departmentId` → Department » ; 018:134 `id uuid PK`, `name`, `role`, `scope`, `bio`, `photo_media_id FK→media`, `department_id FK→departments NULL`, `position int`, `created_at`, `updated_at` |
| `Testimony` / témoignage | 012:82, 013:101, 014:455, 017:206, 018:135 | 014:455 `{ id; photo; quote; name; role }` ; 018:135 `id uuid PK`, `quote`, `person_name`, `person_role`, `photo_media_id FK→media`, `position int`, `created_at`, `updated_at` |
| `CommunityFace` | 012:30, 014:456, 017:207, 018:136 | 014:456 `{ id; photo; name; caption }` ; 018:136 `id uuid PK`, `person_name`, `caption`, `photo_media_id FK→media`, `position int`, `created_at`, `updated_at` |
| `Verse` / verset / `scriptures` | 012:23 (`verses`), 013:20, 014:94, 017:208, 018:143 | 018:143 `id uuid PK`, `key text UNIQUE` (ex. `rassemblement`), `text`, `reference`, `translation`, `context`, `created_at`, `updated_at` |
| `RhythmEntry` / `schedule_entries` / `weeklyRhythm` | 012:23, 013:63, 014:299, 017:208, 018:144 | 014:449 `{ day; title; time; audience? }` ; 018:144 `id uuid PK`, `day`, `title`, `time_label`, `audience`, `is_confirmed bool`, `position int`, `created_at`, `updated_at` |
| `SocialLink` / `social_links` | 017:253, 018:145 | 018:145 `id uuid PK`, `label`, `href`, `position int`, `created_at`, `updated_at` |
| `NavItem`/`NavChild` | 015:235, 016:134, 017:253 | 015:235 « `NavItem.href` est **optionnel** : absent = pôle de regroupement » |
| `site_settings` | 018:146 | `key text PK`, `value text`, `updated_at` |
| `Media` / `media` | 005:176 (évolution), 018:158, 020:299 | 018:158 `id uuid PK`, `bucket`, `path UNIQUE`, `public_url`, `mime_type`, `size_bytes`, `width`, `height`, `alt`, `uploaded_by FK→admin_profiles NULL`, `created_at` |
| `event_media` | 018:159 | `event_id FK`, `media_id FK`, `position int`, PK composite |
| `department_media` | 018:160 | `department_id FK`, `media_id FK`, `position int`, PK composite |
| `prayer_requests` / demande de prière | 013:27, 013:99, 018:95, 018:102 | 018:100-102 `id`, `request_text`, `requester_name?`, `requester_contact?`, `confidentiality` (`private` \| `community`), `status` (`NEW`\|`PRAYED`), `created_at`, `handled_at?` |
| `EventStatus` (calculée) | 006:137-185, 011:201, 017:255 | `UPCOMING` \| `ARCHIVED` |
| `PublicationType` (enum) | 004:594-596, 006:205-211, 010:234, 011:200 | `VIDEO`, `PHOTO`, `TEXTE` |
| `PageKey` (enum) | 006:247-254, 011:235, 017:137 | 006 : `ACCUEIL`, `QUI_SOMMES_NOUS`, `ORGANISATION`, `CONTACT` ; 011/017 : `ACCUEIL`, `QUI_SOMMES_NOUS`, `COMMUNAUTE`, `CONTACT` |
| `publication.category` (enum) | 017:136 | `"ACTUALITE"|"ENSEIGNEMENT"|"MEDIA"|"RESSOURCE"` |
| `publication.status` (enum) | 018:133, 020:361-368 | 018 : `DRAFT`\|`PUBLISHED` ; 020 : `BROUILLON` → `PUBLIÉ` → `ARCHIVÉ` |
| `role` (enum) | 018:121-124, 020:781 | 018 : `ROLE_ADMIN` (+ futur `ROLE_DEPARTMENT_EDITOR`) ; 020 : `Super Administrateur`, `Administrateur`, `Responsable de département`, `DEPARTMENT_MANAGER` |
| `Utilisateur (membre)` | 002:116 (hors V1), 005:177 (évolution) | — |
| Entités externes non persistées | 006:39 | « Supabase Auth, Supabase Storage, YouTube et Facebook » |
| `Images` curatoriales | 011:264, 014:511 | 8 clés `hero`, `identite`, `louange`, `communaute`, `ecodim`, `portraitLarge`, `portraitA`, `portraitB` + `galleryImages` (10) |

**Entités « documentées » vs « observées »** : 006:31-37 (5 entités) / 017:251-253 (5 documentées + 7 observées : `Leader`, `Testimony`, `CommunityFace`, `Verse`, `RhythmEntry`, `SocialLink`, `NavItem`/`NavChild`) / 018:114 (14 tables annoncées, 15 énumérées).

---

# B) RÔLES ET PERMISSIONS

## B.1 Rôle unique V1 (modèle `002`/`004`/`005`/`006`)
- `002:67` : « Un seul rôle « Administrateur » dans cette première version »
- `004:709-713` : « En V1 : ```text ROLE_ADMIN ``` est le seul rôle applicatif nécessaire. »
- `005:76` : « Comptes administrateurs (rôle unique en V1). »
- `006:809` : « Seul un utilisateur autorisé avec le rôle Admin peut effectuer les opérations CRUD. »
- `006:811` : « L'API vérifie l'autorisation indépendamment du frontend. »
- `002:110` : « Seul l'administrateur peut créer/modifier/supprimer du contenu ; le site public est en lecture seule. »
- `004:715-721` : « Les routes d'administration nécessitent : ```text Utilisateur authentifié + Rôle Admin ``` »
- `004:597` (autorisation) — « L'authentification et l'autorisation sont distinctes. » (L697)
- `018:269-272` :
  ```text
  requireAuth       → jeton valide ?                       sinon 401 AUTH_REQUIRED
  requireRole(...)  → rôle suffisant ?                     sinon 403 FORBIDDEN
  requireSelf       → ressource dans le périmètre ?        sinon 403 FORBIDDEN
  ```
- `018:277-278` : « `ROLE_ADMIN` est le seul rôle actif en V1 ; l'enum et le registre de permissions sont conçus pour accueillir des rôles fins sans réécriture »
- `018:123-125` : « `role` est un **enum extensible** (`ROLE_ADMIN` aujourd'hui) pour permettre l'ajout de `ROLE_DEPARTMENT_EDITOR` sans migration destructrice »

## B.2 Rôles hors V1 mentionnés (reportés)
- `001:26` : « (Optionnel) Éditeur | Responsable d'un département pouvant publier dans sa rubrique »
- `002:118` (Hors périmètre V1) : « Multi-éditeurs avec droits différenciés par département »
- `001:71` : « Les fonctionnalités avancées (formulaires complexes, multi-éditeurs, etc.) sont reportées à une phase ultérieure. »
- `017:243` : « Éditeur (optionnel, hors V1) | Responsable de département | Publier dans sa rubrique — reporté »

## B.3 Modèle `020` — trois rôles + scope (le plus détaillé)
- `020:128` : « Trois catégories fonctionnelles sont retenues. »
- Rôles : **Super Administrateur** (`020:130`) · **Administrateur** (`020:148`) · **Responsable de département** (`020:171`).
- `020:204-210` : « L'autorisation ne repose pas uniquement sur le rôle. Elle repose sur : ```text ROLE + SCOPE ``` »
- `020:238-240` : « Cette restriction doit être appliquée **dans le backend**, et non uniquement dans l'interface. Masquer un bouton dans le frontend ne constitue pas une protection suffisante. »
- `020:758-760` : « Le backend reste responsable de l'application des règles métier et des autorisations. Le frontend ne constitue jamais la source de vérité pour les permissions. »
- `020:766-774` : « Le système d'autorisation devra prendre en charge : ```text Role + Permission + Scope ``` »
- Permissions granulaires (`020:785-792`) : `publication.create`, `publication.read`, `publication.update`, `event.create`, `event.update`, `department.update`, `media.manage` ; rôle d'exemple `role = DEPARTMENT_MANAGER`, `department_id = PRESS`.
- Vérifications par requête (`020:797-801`) : identité → rôle → permission → périmètre → propriété de la ressource.
- Matrice des droits (`020:718-729`) : cf. DOC 020 ci-dessus. **Non contractuelle** : `020:731` « **Cette matrice est une base de conception et non encore le contrat définitif de permissions.** »
- Scopes par département (`020:220-235`) : `Press` autorisé / `Ecodume` interdit, sur `Event.department`, `Publication.department`, `Media.department`, `Department.id`.

## B.4 Visiteur
- `001:24` : « Visiteur | Toute personne consultant le site public (membres, sympathisants, nouveaux venus) »
- `017:241` : « Visiteur | Consulter le site public | Lecture seule »
- `002:110` : « le site public est en lecture seule ».
- `018:228-229` : « Les ressources publiques **ne renvoient jamais** de contenu `DRAFT`, ni de donnée administrative, ni `prayer_requests`. »

## B.5 Endpoints protégés
- `004:569` : « Les opérations d'écriture nécessitent le rôle Admin. » (departments)
- `004:610` : « `PATCH` nécessite l'autorisation Admin. » (pages)
- `018:231-236` : liste complète des routes admin (cf. DOC 018).
- `018:104` : « endpoint **public** (aucune authentification requise pour déposer une intention), donc **rate limité** » (`POST /prayer-requests`).

## B.6 Authorization côté frontend
- `004:135-142` : « ### 4.3. Backend comme autorité métier — Le frontend ne constitue jamais une source de vérité concernant : - les permissions ; - les règles métier ; - les contraintes de données ; - les opérations sensibles. »
- `006:411-413` : « Le frontend ne doit pas être considéré comme une source d'autorité pour les règles métier. Toute opération sensible doit être contrôlée côté API. »

---

# C) WORKFLOW ÉDITORIAL

## C.1 Événements — statut calculé, jamais persisté
- `005:118` : « `is_archived` | BOOLEAN | NOT NULL, défaut = false (bascule automatiquement à true une fois la date passée) » → **persisté**.
- `006:139-143` : « L'état d'un événement n'est pas stocké dans la base de données. La propriété `isArchived` initialement prévue dans le schéma est supprimée. L'état est calculé à partir de `eventDate`. »
- `006:147-153` :
  ```text
  SI eventDate >= date courante
      ALORS status = UPCOMING

  SINON
      status = ARCHIVED
  ```
- `006:742-744` : « Il n'existe pas de transition manuelle « Archiver ». L'état dépend exclusivement de la date de l'événement. »
- `006:790` : « Aucun champ `is_archived` n'est persisté. »
- `006:850-855` : « Modification validée par rapport au schéma initial : ```text events.is_archived ``` est **supprimé**. L'état d'archivage est désormais une propriété calculée. »
- `018:39` : « `events.is_archived` : présent (`docs/005` §2.3) vs supprimé (`docs/006` §5) | **Supprimé.** Statut calculé depuis `event_date` »
- `018:132` : « **Pas de `is_archived`.** Index `(event_date)` ; index `(department_id)` »
- `002:47` : « Archivage automatique des événements passés (masqués de la liste principale) »
- `002:108` : « Un événement passé n'apparaît plus dans la liste des événements à venir, mais reste consultable dans un historique (optionnel en V1). »

## C.2 Publications — brouillon / publié (et archivé)
- `006:750` : « La V1 ne nécessite pas de workflow complexe de validation. »
- `006:754-763` :
  ```text
  ┌──────────────┐
  │    DRAFT     │
  └──────┬───────┘
         │ publication
         ▼
  ┌──────────────┐
  │  PUBLISHED   │
  └──────────────┘
  ```
- `006:765` : « Toutefois, si le back-office V1 ne prévoit pas de sauvegarde en brouillon, l'état `DRAFT` peut être supprimé du modèle et une publication créée est directement considérée comme publiée. »
- `006:767` : « La décision finale sera alignée avec le comportement défini dans le CSF et le contrat API. »
- `018:44` : « `DRAFT`/`PUBLISHED` : « supprimable » (`docs/006` §20) vs opérations « publier / dé publier » exigées (cahier §8) | **Statut conservé sur `publications`** »
- `018:133` : `publications` … `status` enum `DRAFT`\|`PUBLISHED` — **seulement deux valeurs**.
- `018:228` : « Les ressources publiques **ne renvoient jamais** de contenu `DRAFT` »
- **`020:358-368`** — workflow à trois états :
  ```text
  BROUILLON
      │
      ▼
  PUBLIÉ
      │
      ▼
  ARCHIVÉ
  ```
- `020:370-373` : « ## 8.1. Brouillon — Le contenu existe mais n'est pas visible publiquement. »
- `020:381-383` : « ## 8.2. Publié — Le contenu est disponible sur le site public. »
- `020:385-389` : « ## 8.3. Archivé — Le contenu n'est plus considéré comme faisant partie des publications récentes. L'archivage n'est toutefois **pas simplement une action manuelle arbitraire**. »

## C.3 **Seuil d'archivage — LA RÈGLE NUMÉRIQUE DEMANDÉE**
- **AUCUN document ne donne de valeur numérique au seuil d'archivage.**
- `020:391-400` verbatim : « Il dépend d'une règle métier basée sur le nombre de publications récentes. Cette règle devra déterminer notamment : - le seuil de publications récentes ; - le périmètre du calcul ; - le moment où une publication devient éligible à l'archivage ; - si l'archivage est automatique ou déclenché par l'administrateur. **La valeur exacte du seuil reste à définir.** »
- → **THRESHOLD MENTIONED BUT UNVALUED** (`020:395`, `020:400`).
- Rappel : `020:857-858` (reprise en §22) : « **Règle exacte d'archivage des publications** — Quel seuil de publications récentes ? Global ou par catégorie/département ? »
- `005:169` — seuil mentionné également sans valeur : « `is_archived` peut être calculé à la volée (comparaison `event_date < aujourd'hui`) plutôt que stocké, selon le choix technique final — l'un ou l'autre fonctionne pour une V1. » → THRESHOLD MENTIONED BUT UNVALUED (choix technique non tranché).

## C.4 Validation / modération
- `002:118` : « Notifications automatiques (e-mail/SMS) pour les événements » — **hors périmètre V1**.
- `004:851` : « Les notifications et événements asynchrones sont hors périmètre. » (Observer Pattern non retenu)
- `020:466-476` : « Le workflow précis : ```text Responsable ↓ Proposition ↓ Validation éventuelle ↓ Publication ``` reste à préciser dans la conception fonctionnelle détaillée. » → **ouvert**.
- `020:854-855` : « 1. **Validation des événements proposés par les responsables** — Publication directe ou validation par un Administrateur ? » → **ouvert**.
- `020:674` : « les contenus en brouillon ; » ; `020:677` : « les propositions à valider ; » (tableau de bord).

## C.5 Scheduling / planification
- **Aucun document ne spécifie de programmation de publication (date de mise en ligne planifiée).**
- `005:137` : `published_at DATE NOT NULL` (annulable ? non) — simple date de publication.
- `013:156` : « un seul rendu par session (`sessionStorage`) » — mécanisme côté visiteur, pas éditorial.
- `018:324` : `Cache-Control: public, max-age=60, stale-while-revalidate=300` — window de cache, pas de publication planifiée.

## C.6 Versioning / historique
- `020:656` : « Journal d'activité » (navigation back-office) ; `020:142` : « consulter les journaux d'activité » (Super Admin) ; `020:729` : « Audit | ✓ | selon politique ».
- `018:310-311` : « Chaque écriture administrative produit une ligne d'audit structurée (`action`, `resource`, `resourceId`, `adminId`, `result`). »
- `017:367` : « 12. WYSIWYG vs blocs, **brouillons, historique**, multilingue ? [À décider] » → **historique/versioning non tranché**.
- Aucun document ne spécifie de versioning de contenu publié (pas de table de révision, pas de `version`).

## C.7 Traçabilité auteur
- `005:162` : « Aucune relation n'est faite entre `admins` et les autres tables au niveau base de données en V1 (traçabilité de l'auteur non requise pour cette version) ; à ajouter plus tard si besoin (`created_by`). »
- `005:178` : « Champ `created_by` sur les tables pour tracer l'auteur, si plusieurs administrateurs » (évolution possible).
- `018:142` : `static_pages.updated_by FK→admin_profiles NULL` (traçabilité sur les pages).
- `018:158` : `media.uploaded_by FK→admin_profiles NULL`.

---

# D) DÉPARTEMENTS

## D.1 Statut de la liste (avant `020`)
- `001:70` : « **Départements** : la liste précise n'est pas encore connue. Le site prévoira une rubrique « Départements » générique, alimentable plus tard via le back-office, sans liste figée dans le code. »
- `006:75-79` (exemples) : « Adultes ; Enfants ; Jeunesse ; Chorale ; autres départements créés ultérieurement. »
- `006:81` : « Les départements sont **dynamiques** et ne doivent pas être codés en dur dans le frontend. »
- `006:688` : « Les départements sont dynamiques : aucune liste fixe ne doit être codée dans le frontend. »
- `011:104-107` : « **Données dynamiques** : les départements viennent d'un mock `Department[]` ; aucun nom codé dans les composants UI. **Confirmés** : Adultes, Enfants/Ecodim. **Mentionnés** (docs) : chorale. **Exemple** (modélisation) : Jeunesse. Tout autre département → placeholder `TODO`. »
- `008:128` : « Liste précise des départements | Organisation | Partielle : « Adultes », « Enfants/Ecodim » confirmés ; « chorale » mentionnée (`001`) ; « Jeunesse » citée en exemple (`006`) »
- `017:203` : « **Departments :** 3 mocks (Adultes, Enfants/Ecodim, Chorale) »
- `014:597-617` : mocks `dep-adultes`, `dep-ecodim`, `dep-chorale`.

## D.2 Liste complète (`020` — la seule liste nominative exhaustive)
- **Départements de présentation uniquement (`020:250-262`)** verbatim :
  - Serviteurs ;
  - Chorale Grand Groupe CCVJ ;
  - Chorale de Cano Vocal ;
  - Affaire sociale ;
  - D'hygiène et Ancien semence ;
  - Protocol ;
  - Évangélisation ;
  - Intercession ;
  - autres départements futurs.
- `020:252-253` : « Les départements suivants sont principalement des entités à présenter sur le site ». `020:276` : « mais ils ne génèrent pas automatiquement un compte utilisateur. »
- **Départements avec espace back-office (`020:278-285`)** verbatim :
  ```text
  Press
  Ecodume
  ```
- `020:287-293` : « Ces départements disposent : - d'une entité département ; - d'un responsable ; - d'un compte utilisateur ; - d'un périmètre d'autorisation ; - de données dynamiques propres. »
- `020:295` : « Cette distinction doit être native dans le modèle de données. »
- `020:173-176` : « Deux départements disposent actuellement d'un espace métier spécifique : - **Press** ; - **Ecodume**. »

## D.3 Slugs
- Aucun slug n'est donné nominativement pour un département dans la documentation, **sauf** :
  - `012:113` : « `/organisation/chorale` | `/organisation/departements/chorale` | **Modèle généralisé** en `[slug]` » → slug `chorale`.
  - `014:597-617` : identifiants de mock `dep-adultes`, `dep-ecodim`, `dep-chorale` (identifiants, pas slugs).
- `005:95` : « `slug` | VARCHAR(120) | UNIQUE, NOT NULL (généré depuis `name`) »
- `005:168` : « Les `slug` sont générés automatiquement à partir du titre/nom, en minuscules et sans accents, pour des URLs propres (ex. `/evenements/culte-de-noel`). »

## D.4 Qui possède / gère les départements
- `002:80-81` : « Créer / modifier / supprimer un département — Champs : nom, description, responsable (optionnel) »
- `006:60` : « créer, modifier et supprimer des départements » (Admin).
- `004:569` : « Les opérations d'écriture nécessitent le rôle Admin. » (departments)
- `020:722-724` : matrice — « Département | ✓ | ✓ | son département | son département ».
- `020:482-497` : « Un responsable peut modifier les informations métier de son propre département. » … « Il ne peut toutefois pas modifier les propriétés structurelles susceptibles d'affecter le fonctionnement général du site. »
- `020:500-510` : propriétés réservées à l'administration — `slug`, `ordre d'affichage`, `structure de navigation`, `identifiants techniques`, `règles de visibilité globales`, `configuration système` ; « La frontière exacte entre ces propriétés sera déterminée après l'audit du frontend et la conception détaillée du modèle de données. » → **ouvert**.

## D.5 Volées / volets (adultes / enfants)
- `002:38-39` : « Présentation du volet « Adultes » / Présentation du volet « Enfants » »
- `011:97` : « Volets principaux : Adultes · Enfants / Ecodim »
- `011:57` : « **Horaires** : `TODO — HORAIRES À FOURNIR` (deux blocs : Adultes / Enfants-Ecodim). »

---

# E) MÉDIATHÈQUE

## E.1 Stockage actuel (faits observés/affirmés)
- `005:51` : « Stockage des fichiers médias (vidéos, images) » (CDC `001:51`).
- `004:110` / `004:1143` : « Stockage médias | Supabase Storage ».
- `003:40` : « Stockage objet (local au serveur en V1, ou service cloud si budget le permet) » → **contredit par `004`** (Supabase Storage figé).
- `006:500` : « Les fichiers ne sont pas enregistrés dans PostgreSQL. »
- `006:537-541` : « L'entité métier conserve uniquement la référence vers le fichier : ```text imageUrl ``` »
- `006:580` : « Aucun fichier vidéo n'est transféré vers le serveur CCJV. »
- `004:911-913` : « Les images sont stockées et servies via Supabase Storage. Les vidéos ne sont pas stockées directement par CCJV. »
- `008:53-62` : inventaire `public/images/` — « **43 photographies JPEG**, issues de partages WhatsApp » ; « non optimisé pour le web (pas de WebP/AVIF, pas de recadrage dédié, plusieurs doublons de cadrage portrait/paysage) ».
- `012:24` : « Médias | 41 photos (`public/media`, noms propres) + 41 originaux (`public/images`) + `logo.png` »
- `014:551-553` : « `public/media/` : 41 fichiers confirmés » — `ccjv-01.jpeg` … `ccjv-41.jpeg`.
- `014:644-654` : 30/41 référencés, 28 réellement rendus, 13 jamais affichés (11 orphelins + 2 code mort).
- `017:216-220` : inventaire complet (41 media / 41 originaux / `logo.png` 1254×1254 405 Ko + `logo_2.png` / vignettes YouTube distantes).
- `019:26-27` : « `public/media/` contient 41 fichiers | ✅ 41 » ; « `public/images/` contient 41 originaux | ✅ 41 ».

## E.2 Bucket / organisation (`018` — la seule spécification)
- `018:284` : « **Bucket** : `ccjv-media` (public en lecture, écriture serveur uniquement). »
- `018:285-286` : « **Dossiers** : `events/`, `departments/`, `publications/`, `leaders/`, `testimonies/`, `community/`, `pages/` — un préfixe par usage. »
- `018:287` : « **Types autorisés** : `image/jpeg`, `image/png`, `image/webp`, `image/avif`. »
- `018:288` : « **Taille max : 5 Mo.** »
- `018:289-290` : « **Vérification par signature binaire** (*magic bytes*), pas seulement par l'extension ou le `Content-Type` déclaré : un client peut mentir »
- `018:291-292` : « **Nom de fichier généré côté serveur** (`<uuid>.<ext>` déduit du type réel) : aucun nom fourni par le client n'atteint le Storage. »
- `018:293-294` : « **Suppression** : refuse par défaut si le média est référencé (intégrité), sauf `?force=true` explicite. »
- `018:295` : « Le `SUPABASE_SERVICE_ROLE_KEY` ne quitte **jamais** le serveur »

## E.3 Métadonnées média (`018`)
- `018:158` : `media` : `id uuid PK`, `bucket`, `path UNIQUE`, `public_url`, `mime_type`, `size_bytes`, `width`, `height`, **`alt`**, `uploaded_by FK→admin_profiles NULL`, `created_at`.
- `018:158` note : « Registre des fichiers réellement téléversés ».

## E.4 Référence vs URL (`018` — décision structurante)
- `018:162-171` : « ### 4.5 Le contrat API expose des URL, la base stocke des références — `src/types/index.ts` déclare `imageUrl?: string`, `bannerImage?: string`, `gallery?: string[]`, `contentUrl?: string`, `photo?: string`. C'est le contrat du frontend et il ne doit pas bouger. **Décision :** en base, ces champs sont des références `media` (intégrité, traçabilité, pas d'orphelin silencieux) ; en API, ils sont **sérialisés en URL publiques** […] Les galeries sont résolues depuis les tables de jointure et renvoyées en `string[]` ordonné. »
- `018:159-160` : `event_media` et `department_media` — « Galerie ordonnée ».

## E.5 Réutilisation des médias (`020`)
- `020:20` : « la réutilisation des médias ; » (objectif du back-office).
- `020:301-303` : « Le système doit comporter une **véritable médiathèque centralisée**. Elle constitue le point d'entrée principal pour la gestion des fichiers. »
- `020:306-315` : capacités — « - l'import d'un média ; - la prévisualisation ; - la recherche ; - le filtrage ; - la sélection d'un média ; - la réutilisation d'un média ; - le remplacement éventuel d'un fichier ; - la suppression selon les règles définies ; - la consultation des informations du média. »
- `020:317` : « Les fichiers sont stockés dans **Supabase Storage**. »
- `020:319-335` : « l'utilisateur ne manipule pas directement : ```text bucket / object path / URL Storage / UUID ``` Il manipule : ```text Image / Photo / Vidéo / Document ``` »
- `020:339-352` : « ### Réutilisation — Un même média doit pouvoir être utilisé dans plusieurs contextes : ```text Média ├── Hero ├── Département ├── Publication ├── Événement └── Ressource ``` Le système doit donc éviter les duplications inutiles. »
- `020:863-864` : « 4. **Propriété des médias** — Média global, média appartenant à un département, ou combinaison des deux ? » → **ouvert**.

## E.6 Alt text
- `010:245-246` : « `alt` descriptif obligatoire (ou `alt=""` si purement décorative) »
- `010:273` : « `alt` sur toutes les images ; labels sur les contrôles ; messages d'erreur accessibles. »
- `011:186` : « **Sémantique** : un seul `h1`, hiérarchie `h1 → h2 → h3`, landmarks, **alt text**. »
- `018:158` : colonne `alt` dans `media`.
- **Aucun autre document ne définit de règle de rédaction d'alt.** `015:268-270` et `016:176-178` interdisent les **légendes** affirmatives (l'agent n'a pas d'analyse d'image) mais ne parlent pas d'alt.

## E.7 Validation / upload (API)
- `004:622-629` : « Le serveur : 1. authentifie l'administrateur ; 2. vérifie l'autorisation ; 3. valide le fichier ; 4. contrôle sa taille ; 5. l'envoie vers Supabase Storage ; 6. retourne une référence exploitable. »
- `004:629-637` : réponse `{ "url": "https://..." }`
- `004:782-783` : codes `FILE_TOO_LARGE`, `INVALID_FILE_TYPE`.
- `006:513-517` : « ├── Validation extension/MIME ├── Validation taille »
- `017:364` : « 11. Taille max, types MIME autorisés, organisation buckets/dossiers, thumbnails, orphelins ? [À décider — cadre docs/004 §21] »
- `017:224` : besoins Storage — « Upload / remplacement / suppression […] métadonnées + association média ↔ contenu, validation extension/MIME + taille, organisation logique des buckets/dossiers, permissions d'accès, URLs publiques exploitables »
- `017:265` : « À décider : association Media ↔ Contenu, User ↔ Rôle [Déduit]. »

## E.8 Images et performance
- `004:894-898` : « images optimisées ; WebP/AVIF lorsque pertinent ; pagination ; absence d'autoplay vidéo ; chargement différé des contenus lourds. »
- `008:147-148` : « **Photos** : convertir en WebP/AVIF via `next/image`, recadrer/dupliquer pour les formats éditoriaux (paysage large, portrait), ne servir que les dimensions utiles. »
- `014:499-549` : copie intégrale de `src/data/mock/images.ts` avec le commentaire : « les libellés d'usage ci-dessous sont des rôles de mise en page, PAS des légendes affirmant le contenu exact de chaque photo — à valider visuellement avant production (l'agent n'a pas de capacité d'analyse d'image). »

---

# F) PAGES ET SECTIONS

## F.1 `001` + `002` — site V1 (6 pages)
- `002:11-16` : `Accueil`, `Qui sommes-nous`, `Organisation`, `Événements`, `Publications / Médias`, `Contact`.
- Accueil (`002:24-28`) : Bandeau logo + message de bienvenue ; Horaires des cultes (adultes et enfants) ; Aperçu des 2-3 prochains événements ; Aperçu des dernières publications ; Liens vers les autres sections.
- Qui sommes-nous (`002:32-34`) : Histoire ; Vision/valeurs ; Localisation.
- Organisation (`002:38-41`) : volet « Adultes » ; volet « Enfants » ; Liste des départements ; nom, courte description, responsable (optionnel).
- Événements (`002:45-47`) : liste triée par date ; fiche (titre, date, heure, lieu, description, image optionnelle) ; archivage automatique.
- Publications/Médias (`002:51-53`) : liste (vidéo, photo ou texte + image) ; titre, type, date, contenu, courte description ; grille ou liste chronologique.
- Contact (`002:57-58`) : coordonnées ; bouton WhatsApp `wa.me`.

## F.2 `004:313-333` — routes
- Public : `/`, `/qui-sommes-nous`, `/organisation`, `/evenements`, `/publications`, `/contact`.
- Admin : `/admin` → `/dashboard`, `/evenements`, `/departements`, `/publications`, `/pages`.

## F.3 `011` — 6 pages (outlines verbatim, cf. DOC 011)
Accueil (8 blocs) · Qui sommes-nous (7 blocs) · Organisation (4 blocs) · Événements (4 blocs) · Publications/Médias (3 blocs) · Contact (7 blocs).

## F.4 `012:64-102` — sitemap cible V3 (5 hubs + 16 sous-pages + 3 gabarits + 5 transversales)
Reproduit verbatim dans DOC 012 ci-dessus.

## F.5 `013` — outlines narration par page (verbatim)
- Accueil : 10 sections (tableau, cf. DOC 013).
- `B.0 /qui-sommes-nous` hub : en-tête (verset) · présentation courte · 3 cartes-portes (ce que nous croyons / d'où nous venons / qui nous dirige) · photographie · respiration (verset) · CTA secondaires.
- `B.1 /qui-sommes-nous/ce-que-nous-croyons` : en-tête (verset) · articles de foi numérotés · valeurs · respiration · CTA vers groupes/parcours nouveaux.
- `B.2 /d-ou-nous-venons` : en-tête · **Timeline** · grande photographie · respiration · CTA vers Vie de l'Église.
- `B.3 /qui-nous-dirige` : en-tête · portrait principal · liste des responsables (nom, fonction, photo) · CTA contact.
- `C.0 /vie-de-leglise` : en-tête · prochains rendez-vous (3) · **rythme hebdomadaire** (`WeekRhythm`) · accès rapide (nous trouver / faire un don) · respiration.
- `C.1 /vie-de-leglise/evenements` : en-tête · événement principal (`FeaturedEvent`) · liste (`EventRow`) · archives · respiration.
- `C.2 /evenements/[slug]` : titre, date, heure, lieu, département, description, photographies, informations pratiques, événements associés.
- `C.3 /ou-nous-trouver` : adresse, horaires, accès, WhatsApp, réseaux sociaux, plan (si adresse fournie).
- `D.0 /communaute` : en-tête · photographies réelles · 4 portes (groupes de maison / parcours nouveaux / prière / témoignages) · respiration.
- `D.2 /communaute/parcours-nouveaux` : en-tête · **parcours en 4–5 étapes** (venir un dimanche → être accueilli → découvrir → s'intégrer) · questions fréquentes · CTA.
- `D.3 /communaute/priere` : en-tête · composition apaisée · formulaire **uniquement si le périmètre le permet**.
- `E.0 /organisation` : en-tête · présentation · 2 portes (responsables / départements) · respiration.
- `E.2 /organisation/departements` : `DepartmentFeature` (photo en arche, numéro, nom, description).
- `E.3 /departements/[slug]` : en-tête (verset) · vocation + photographie + rythme de rencontre + responsable · piliers (`keyPoints`) · galerie (`gallery`) · respiration (verset) · CTA rejoindre.
- `F.0 /publications` : en-tête · 4 portes (actualités / enseignements / médiathèque / ressources) · dernier contenu mis en avant · respiration.

## F.6 `014` — inventaire des 30 routes (ordre des blocs, verbatim)
| # | Route | Ordre exact des blocs |
|---|---|---|
| 01 | `/` | `Hero` → `VerseSection` → `Section#mot-du-pasteur` (tinted) → `Section#qui-sommes-nous` → `Section#agenda` (tinted) → `Section#horaires` → `Section#enseignements` (tinted) → `Section#communaute` → `BreathingPhoto` → `Section#priere` (tinted) → `Section#soutenir` → `Section#envoi` (green) — 12 blocs |
| 02 | `/vie-de-leglise` | `PageHeader` → `Section` (prochain rendez-vous) → `Section` (tinted, `WeekRhythm`) → `Section` (portes) → `VerseSection` — 5 |
| 03 | `/vie-de-leglise/ou-nous-trouver` | `PageHeader` → `Section` (infos pratiques) → `Section` (tinted, horaires `WeekRhythm`) → `VerseSection` — 4 |
| 04 | `/vie-de-leglise/evenements` | `PageHeader` → `Section` (à venir) → `Section` (tinted, archives) → `VerseSection` — 4 |
| 05 | `/vie-de-leglise/evenements/[slug]` | `PageHeader` → `Section` (informations) → `Section` (tinted, galerie — cond.) → `Section` (autres rendez-vous — cond.) → `VerseSection` — 5 (2 cond.) |
| 06 | `/vie-de-leglise/faire-un-don` | `PageHeader` → `Section` (destinations) → `Section` (tinted, comment donner) → `VerseSection` — 4 |
| 07 | `/qui-sommes-nous` | `PageHeader` → `Section` (présentation 6/6) → `Section` (tinted, `HubDoors`) → `VerseSection` — 4 |
| 08 | `/qui-sommes-nous/ce-que-nous-croyons` | `PageHeader` → `Section` (confession de foi) → `Section` (tinted, valeurs) → `VerseSection` — 4 |
| 09 | `/qui-sommes-nous/qui-nous-dirige` | `PageHeader` → `Section` (le pasteur — cond.) → `Section` (tinted, les autres responsables) → `VerseSection` — 4 |
| 10 | `/qui-sommes-nous/d-ou-nous-venons` | `PageHeader` → `Section` (histoire, `Timeline`) → `BreathingPhoto` → `Section` (tinted, fondateur 5/7) → `VerseSection` — 5 |
| 11 | `/organisation` | `PageHeader` → `Section` (vue éditoriale 7/5) → `Section` (tinted, `HubDoors`) → `Section` (rythme `WeekRhythm`) → `VerseSection` — 5 |
| 12 | `/organisation/responsables` | `PageHeader` → `Section` (équipe) → `VerseSection` — 3 |
| 13 | `/organisation/departements` | `PageHeader` → `Section` (liste des départements) → `VerseSection` — 3 |
| 14 | `/organisation/departements/[slug]` | `PageHeader` → `Section` (vocation 6/6) → `Section` (tinted, piliers — cond.) → `Section` (galerie — cond.) → `Section` (tinted, autres départements — cond.) → `VerseSection` — 6 (3 cond.) |
| 15 | `/publications` | `PageHeader` → `Section` (à la une — cond.) → `Section` (tinted, `HubDoors`) → `Section` (réseaux) → `VerseSection` — 5 |
| 16 | `/publications/actualites` | `PageHeader` → `Section` (liste) → `VerseSection` — 3 |
| 17 | `/publications/enseignements` | `PageHeader` → `Section` (le plus récent) → `Section` (tinted, archives — cond.) → `VerseSection` — 4 |
| 18 | `/publications/mediatheque` | `PageHeader` → `Section` (galerie) → `BreathingPhoto` → `VerseSection` — 4 |
| 19 | `/publications/ressources` | `PageHeader` → `Section` (liste de documents) → `VerseSection` — 3 |
| 20 | `/publications/[slug]` | `PageHeader` → `Section` (contenu) → `Section` (tinted, à découvrir aussi — cond.) → `VerseSection` — 4 |
| 21 | `/communaute` | `PageHeader` → `Section` (ce qui fait une communauté) → `Section` (tinted, `CommunityFaces`) → `Section` (`HubDoors`) → `VerseSection` — 5 |
| 22 | `/communaute/parcours-nouveaux` | `PageHeader` → `Section` (étapes) → `Section` (tinted, questions fréquentes) → `Section` (invitation) → `VerseSection` — 5 |
| 23 | `/communaute/priere` | `PageHeader` → `Section` (demande de prière, centrée) → `Section` (tinted, temps de prière) → `VerseSection` — 4 |
| 24 | `/communaute/temoignages` | `PageHeader` → `Section` (carrousel) → `Section` (tinted, invitation à partager) → `VerseSection` — 4 |
| 25 | `/communaute/groupes-de-maison` | `PageHeader` → `Section` (qu'est-ce que c'est, 6/6) → `Section` (tinted, apports) → `BreathingPhoto` → `VerseSection` — 5 |
| 26 | `/mentions-legales` | `LegalPage` → (`PageHeader` → `Section` (4 sous-sections) → `VerseSection`) — 3 |
| 27 | `/confidentialite` | `LegalPage` → (`PageHeader` → `Section` (5 sous-sections) → `VerseSection`) — 3 |
| 28 | `/conditions` | `LegalPage` → (`PageHeader` → `Section` (4 sous-sections) → `VerseSection`) — 3 |
| 29 | `/accessibilite` | `LegalPage` → (`PageHeader` → `Section` (4 sous-sections) → `VerseSection`) — 3 |
| 30 | `/recherche` | `PageHeader` → `Section` (`SearchClient`) → `VerseSection` — 3 |

Squelettes identiques (`014:424-434`) : **9 pages** strictement identiques (`PageHeader → Section → VerseSection`) ; **10 pages** identiques en séquence (`PageHeader → Section → Section(tinted) → VerseSection`) ; **6 pages** identiques (`PageHeader → Section → Section(tinted) → Section → VerseSection`) ; **5 pages** uniques.

## F.7 `015` — matrice route → archétype cible (verbatim, extrait)
| Route | Sujet | Intention | Archétype | Héros | Photos cible | Verset |
| `/` | Accueil | Expérience | *composition libre* | Immersif | 6–8 | 1 (milieu) |
| `/qui-sommes-nous` | Identité | Institutionnel | `NarrativePage` | Éditorial | 4 | 1 (fin) |
| `/qui-sommes-nous/ce-que-nous-croyons` | Foi | Manifeste | `EditorialPage` | Manifesto | 1 | 2 (dont 1 grand) |
| `/qui-sommes-nous/d-ou-nous-venons` | Histoire | Récit | `NarrativePage` | Photo | 5 | 1 |
| `/qui-sommes-nous/qui-nous-dirige` | Direction | Personnes | `DirectoryPage` | Éditorial | 6 | 0 |
| `/vie-de-leglise` | Vie | Hub pratique | `InformationPage` | Practical | 3 | 1 |
| `/vie-de-leglise/evenements` | Agenda | Listing | `ListingPage` | Photo | 4 | 0 |
| `/vie-de-leglise/evenements/[slug]` | Événement | Fiche | `EventPage` | Photo | 3 + galerie | 0–1 |
| `/vie-de-leglise/ou-nous-trouver` | Localisation | Service | `InformationPage` | Practical | 2 | 0 |
| `/vie-de-leglise/faire-un-don` | Don | Service | `EditorialPage` | Centered | 1 | 1 |
| `/communaute` | Communauté | Humain | `NarrativePage` | Immersif | 6 | 1 |
| `/communaute/groupes-de-maison` | Groupes | Humain | `EditorialPage` | Éditorial | 5 | 1 |
| `/communaute/parcours-nouveaux` | Nouveaux | Service | `EditorialPage` | Centered | 3 | 1 |
| `/communaute/priere` | Prière | Spirituel | `EditorialPage` | Centered | 2 | 2 |
| `/communaute/temoignages` | Témoignages | Storytelling | `NarrativePage` | Manifesto | 4 | 1 |
| `/organisation` | Organisation | Institutionnel | `EditorialPage` | Split | 4 | 0 |
| `/organisation/responsables` | Responsables | Personnes | `DirectoryPage` | Photo | 6 | 1 |
| `/organisation/departements` | Départements | Index visuel | `DirectoryPage` | Split | 4 | 0 |
| `/organisation/departements/[slug]` | Département | Fiche | `DetailPage` | Photo | 1 + galerie | 0–1 |
| `/publications` | Médias | Hub | `EditorialPage` | Éditorial | 3 | 0 |
| `/publications/actualites` | Actualités | Magazine | `ListingPage` | Éditorial compact | 4 | 0 |
| `/publications/enseignements` | Sermons | Média | `MediaPage` | Éditorial | 2 | 1 |
| `/publications/mediatheque` | Médiathèque | Visuel | `MediaPage` | Immersif | 9+ | 0 |
| `/publications/ressources` | Ressources | Service | `ListingPage` | Practical | 1 | 0 |
| `/publications/[slug]` | Article | Fiche | `DetailPage` | Photo | 1–3 | selon contenu |
| `/recherche` | Recherche | Outil | `InformationPage` | Practical | 0 | 0 |
| `/mentions-legales` · `/confidentialite` · `/conditions` · `/accessibilite` | Légal | Service | `LegalPage` (inchangé) | — | 0 | 0 |

## F.8 `015:174-197` — matrice « Livré » (palier 1)
`/` composition libre (12 sections) · `Hero` d'accueil ;
`/qui-sommes-nous/ce-que-nous-croyons` `EditorialPage` / `HeroManifesto` (dark) ;
`/qui-sommes-nous/d-ou-nous-venons` `NarrativePage` / `HeroPhoto` (tall) ;
`/qui-sommes-nous/qui-nous-dirige` `DirectoryPage` / `HeroEditorial` (cream) ;
`/vie-de-leglise/evenements` `ListingPage` / `HeroPhoto` (normal) ;
`/vie-de-leglise/evenements/[slug]` `EventPage` / `HeroPhoto` (tall) ;
`/vie-de-leglise/ou-nous-trouver` `InformationPage` / `HeroPractical` ;
`/vie-de-leglise/faire-un-don` `EditorialPage` / `HeroCentered` (cream) ;
`/communaute/groupes-de-maison` `EditorialPage` / `HeroSplit` ;
`/communaute/parcours-nouveaux` `EditorialPage` / `HeroCentered` (light) ;
`/communaute/priere` `EditorialPage` / `HeroCentered` (dark) ;
`/communaute/temoignages` `NarrativePage` / `HeroManifesto` (dark) ;
`/organisation/responsables` `DirectoryPage` / `HeroPhoto` (tall) ;
`/organisation/departements` `DirectoryPage` / `HeroCompact` ;
`/organisation/departements/[slug]` `DetailPage` / `HeroPhoto` (normal) ;
`/publications/actualites` `ListingPage` / `HeroCompact` ;
`/publications/enseignements` `MediaPage` / `HeroCompact` (tinted) ;
`/publications/mediatheque` `MediaPage` / `HeroImmersive` (center) ;
`/publications/ressources` `ListingPage` / `HeroPractical` ;
`/publications/[slug]` `DetailPage` / `HeroPhoto` (normal) ;
`/recherche` `InformationPage` / `HeroPractical` ;
Pages légales (4) `LegalPage` / —.

## F.9 `020:540-549` — sections d'Accueil (modèle Page → Section)
```text
Accueil
│
├── Hero
├── BibleVerse
├── Mot du pasteur
├── Présentation
├── Événements à venir
├── Derniers enseignements
├── Communauté
├── Prière
└── Soutenir l'église
```
`020:552-554` : « Cela ne signifie pas que toutes ces sections deviennent éditables. C'est précisément l'objet de l'**audit stratégique du frontend** qui suivra ce document. »

## F.10 `020:640-657` — navigation back-office cible
```text
BACK-OFFICE
│
├── Tableau de bord
│
├── Contenu
│   ├── Pages
│   ├── Ressources
│   └── Médias
│
├── Vie de l'église
│   ├── Événements
│   └── Départements
│
└── Administration
    ├── Utilisateurs
    ├── Rôles & permissions
    ├── Journal d'activité
    └── Configuration
```

---

# G) COMPOSANTS

| Composant | Doc(s) | Ce qui est dit (variantes notamment) |
|---|---|---|
| `Header` | 010:161, 011:12, 012:19, 014:473, 016 (implicite) | 010:163-168 « **Contextuel** : transparent sur le Hero […] puis **solide** au scroll » ; contenu logo + libellé + bouton menu + CTA ; 014:473 « impose une hauteur de 68 px » |
| `Footer` | 010:170, 011:19, 012:19, 014:476 | 010:172-175 fond noir, logo, localisation (TODO), horaires (TODO), navigation, réseaux, CTA WhatsApp |
| `FullscreenMenu` | 010:178, 012:19, 014:474 | 010:180 « **Menu principal plein écran sur Desktop ET Mobile** » ; 014:474 « à deux niveaux (hubs + sous-pages), verrouillage du scroll, piège de focus, Échap » |
| `IntroCurtain` | 014:475, 012:30 (motif) | 014:475 « Rideau d'introduction (une fois par session) portant le verset de rassemblement et le sigle CCJV » ; 013:152-156 système d'introduction ~1,6 s |
| `Button` | 010:139, 014:465, 016:88 | 010:142-151 variantes `primary`/`outline`/`ghost`/`inverse`, états `default`→`hover`→`focus-visible`→`active`→`disabled`→`loading`, tailles `md`/`lg` ; 014:465 identique + `external` |
| `Badge` | 010:237, 014:466, 016:88 | 010:239-241 « type de publication, état d'événement, département, catégorie » ; 014:466 variantes `default`/`dark`/`outline` |
| `Link` | 010:154 | 010:156-159 « lien dans le texte » vs « lien navigation » ; `target="_blank"` → `rel="noopener noreferrer"` |
| `Hero` | 010:194, 011:38, 014:482, 020:92 | 010:196 « **Composition graphique éditoriale, asymétrique** — jamais « image plein écran + texte centré + deux boutons » » ; 014:482 « deux colonnes (noir / photo plein écran), verset Psaume 122:1, 2 CTA, horaire du premier créneau » |
| `HeroEditorial` | 015:76, 016:55 | « Breadcrumb · eyebrow · grand titre · intro · **image dominante à droite** (ratio 4:5) » ~120 mots |
| `HeroPhoto` | 015:77, 016:56 | « **Grande photographie pleine largeur**, surtitre et titre en surimpression basse, intro hors image » ~80 mots ; props `height?: "normal"\|"tall"` |
| `HeroCentered` | 015:78, 016:57 | « Breadcrumb · titre centré · intro courte · **verset encadré** · pas d'image » ~90 mots ; `verse?: {text,reference}` |
| `HeroSplit` | 015:79, 016:58 | « Texte large à gauche, **image verticale + image secondaire décalée** à droite » ~140 mots |
| `HeroImmersive` | 015:80, 016:59 | « Hauteur `88svh`, image plein cadre, **respiration** avant le titre, texte en bas » ~70 mots |
| `HeroPractical` | 015:81, 016:60 | « **Pas de photographie.** Titre compact + panneau d'informations utiles (horaires, lieu, contact) » ~60 mots ; `facts?: {label,value,hint?,href?}[]` |
| `HeroManifesto` | 015:82, 016:61 | « Grand titre, **déclaration**, citation biblique en très grand corps, filet » ~100 mots ; `scripture: {text,reference}` |
| `HeroCompact` | 015:189, 016:62 | « pages d'index, sans photo » ; props `overline, title, intro?, aside?` |
| `HeroArched` (ex-`PageHeader`) | 015:84-86 | « `PageHeader` (la « baie ») devient **un héros parmi d'autres** (`HeroArched`, conservé sous son nom actuel) » |
| `PageHeader` | 014:444, 015:84, 016:64 | 014:444 props `overline`, `title`, `description?`, `verse?`, `tone?: "light" \| "dark"`, `image?` ; 016:64 « reste disponible comme **héros d'exception**, jamais par défaut » |
| `Section` | 010:205, 014:445, 015:69, 016:29 | 014:445 `tone?: "light" \| "dark" \| "tinted" \| "green"` ; 010:209 variantes `full-bleed`/`dark`/`tinted` ; 015:69 « ne doit plus être utilisé dans les nouvelles compositions » |
| `SectionHeading` | 014:446, 016:29 | props `overline?`, `title`, `description?`, `dark?`, `align?: "left"\|"center"`, `id?` |
| `Band` | 015:49-59, 016:37-49 | `tone="light \| cream \| tinted \| dark \| green \| bare"`, `space="flush \| tight \| normal \| airy \| silence"`, `width="container \| wide \| full"`, `rule="top \| bottom \| both"` ; 015:69 « `Band` remplace l'usage systématique de `Section` » |
| `Prose` | 015:92, 016:71 | variantes `lead`, `dropcap`, `columns` ; props `width?: "narrow"\|"normal"\|"wide"`, `onDark?` |
| `FeatureImage` | 015:93, 016:72 | `full`, `wide`, `inset`, `arch`, `portrait`, `float` |
| `PhotoDuo` | 015:94, 016:73 | `equal`, `offset` |
| `PhotoGallery` | 015:95, 016:74 | `mosaic`, `strip`, `columns` |
| `PullQuote` | 015:96, 016:75 | `left`, `center`, `marginal` ; 016:75 « **parole humaine uniquement** » |
| `ScriptureBlock` | 015:97, 016:76 | `inline`, `framed`, `marginal`, `wide`, `concluding` |
| `KeyFacts` | 015:98, 016:77 | `pairs`, `tiles`, `inline` |
| `ConvictionList` | 015:99, 016:78 | `numbered`, `lettered` ; props `items: {title,text,references?}[]`, `pendingWhat?` |
| `Chapter` | 015:100, 016:79 | `left`, `right`, `noPhoto` ; props `index, title, paragraphs, image?, imageCaption?, side, quote?` |
| `PortraitPanel` | 015:101, 016:80 | `hero`, `side` ; props `image, name, role, scope?, bio?, quote?, side` |
| `PeopleGrid` | 015:102, 016:81 | `feature`, `compact` |
| `CrossLinks` | 015:103, 016:82 | `doors`, `list`, `inline` |
| `InfoPanel` | 015:104, 016:83 | `full`, `compact` ; props `groups: {title,items:{label?,value,hint?}[]}[]`, `note?`, `aside?` |
| `StepsList` | 015:105, 016:84 | `horizontal`, `vertical` |
| `MediaFeature` | 015:106, 016:85 | `hero`, `inline` ; props `href, title, excerpt?, author?, date?, duration?` |
| `ContentPending` | 015:107, 016:86 | `block`, `inline` ; props `what, hint?` ; 015:266 « Contenu requis mais **non fourni** […] → `ContentPending` → `TODO — … À FOURNIR` » |
| `VerseSection` | 010:218, 014:451, 015:109 | 014:451 « impose une `<section>` plein cadre, centrée, sans bouton, et clôt 29 pages » ; `tone?: "dark" \| "light" \| "cream" \| "green"`, `context?` ; 015:109 « ne sont plus automatiques » |
| `CrossMark` | 012:30, 014:459, 015:109, 016:89 | 014:459 « croix SVG en 5 tailles, dont `watermark` » — `size?: "sm" \| "md" \| "lg" \| "xl" \| "watermark"` ; `variant?: "solid" \| "fine" \| "ornate"` « (**déclaré mais jamais lu**) » |
| `OpenBookMark` | 012:30, 014:450 | « Motif « Livre ouvert » (SVG décoratif, écho au logo CCJV) » ; `size?: "sm" \| "md" \| "lg"` |
| `Timeline` | 012:20, 013:50, 014:448, 016:88 | props `items: readonly TimelineItem[]` (`{ date; title; description }`) |
| `WeekRhythm` | 012:20, 013:63, 014:449, 016:88 | props `items: readonly RhythmItem[]` (`{ day; title; time; audience? }`) |
| `BreathingPhoto` | 012:20, 014:452, 016:90 | « Photographie-témoignage plein écran (`min-h-[75svh]`), voile dégradé, libellé « Témoignage » » ; props `image, phrase, reference?, hasArch?` |
| `Breadcrumbs` | 014:453 | props `tone?: "light" \| "dark"` ; « dérivé de `lib/nav` » |
| `YouTubeThumb` | 012:—, 014:454, 016:88 | « Vignette YouTube distante (`i.ytimg.com`), repli automatique `maxresdefault` → `hqdefault`, aucune iframe » |
| `TestimonyCarousel` | 014:455, 016:90 | « `scroll-snap` natif, pastilles, flèches, aucun défilement automatique » ; cartes 86 % / 62 % / 48 % ; props `testimonies: Testimony[]` |
| `CommunityFaces` | 014:456, 016:90 | « Scrollytelling des visages : légende sticky + portraits qui défilent (desktop) / liste verticale (mobile) » ; props `faces: CommunityFace[]` |
| `HubDoors` | 014:457 | « « Portes » d'un hub : liens à filet vert supérieur » ; props `doors: readonly HubDoor[]`, `columns?: 2 \| 3` |
| `LegalPage` | 014:458, 015:167, 016:90 | « Gabarit complet des pages transversales : `PageHeader` → `Section` → `VerseSection` » |
| `EventCard` | 010:213, 011:44, 014:485, 015:37 | 014:485 « Carte événement encadrée (date encadrée, `Badge`, `dl` auto-fit) » — **composant jamais importé** ; 015:37 « Composants déclarés mais jamais importés | `EventCard`, `DepartmentCard`, `DepartmentFeature` » |
| `DepartmentCard` | 010:221, 011:46, 014:489, 015:37, 017:— | 014:489 « Carte département encadrée (nom, description, responsable) » — **jamais importé** |
| `DepartmentFeature` | 012:—, 013:115, 014:490, 015:37 | 014:490 « Département en composition éditoriale : photo en arche, numéro, nom, description, responsable » — **jamais importé** ; 013:115 « `DepartmentFeature` (photo en arche, numéro, nom, description) » |
| `PublicationCard` | 010:227, 011:47, 014:488 | 014:488 « trois rendus selon `type` : `PHOTO` (image), `VIDEO` (pavé noir + lecteur), `TEXTE` (pavé `¶`) » ; 010:229-233 variantes par type |
| `FeaturedEvent` | 012:22, 014:483 | props `event: Event`, `departmentName?` |
| `EventRow` | 012:22, 014:484 | props `event: Event`, `departmentName?` |
| `TeachingFeature` | 014:486 | « vignette YouTube `aspect-video` 7/12, extrait encadré, CTA externe » |
| `TeachingCard` | 014:487 | « vignette 176 px + auteur, titre, extrait, lien YouTube » |
| `SearchClient` | 014:491 | « filtrage client sur index statique (`useMemo`), plafond 30 résultats » |
| `EmptyState` | 010:258, 014:467 | 014:467 « impose un encadré bordé aligné à gauche » |
| `LoadingState` | 010:258, 011:253 | 010:262 « squelettes (`skeleton`) sobres, `aria-busy`, sans layout shift » |
| `ErrorState` | 010:258, 011:253 | 010:263 « message accessible, rôle `alert`/`status`, possibilité de réessayer » |
| `Image` | 010:243, 011:253 | 010:245-248 `next/image`, `sizes`/`fill`, `alt` obligatoire, `loading="lazy"` hors LCP, `priority`, `blur` |
| `Card` | 011:253, 020:93 | 011:253 `components/ui/Card` ; 020:93 « Hero / Card / Section événement / Section publication / Call-to-action / Gallery » |
| `CTA` / `Call-to-action` | 010:250, 011:255, 020:96 | 010:251-256 CTA « Nous rejoindre » « jamais un compte, jamais de formulaire d'inscription » ; « Cible proposée (à valider) : `/contact` » |
| `BibleVerse` | 020:75-87 | **N'existe dans AUCUN inventaire de composants.** 020:75-78 : « ```text BibleVerse ├── variante image ├── variante éditoriale └── variante minimale ``` » — voir §H #25 |
| `Section événement` / `Section publication` / `Gallery` | 020:93-98 | « Même principe pour les composants réutilisables tels que : ```text Hero / Card / Section événement / Section publication / Call-to-action / Gallery / etc. ``` » — noms génériques, non alignés sur l'inventaire `014` |
| `PrayerRequestForm` | 017:107, 018:90, 019:24, 019:62 | 018:90-93 « collecte **intention, prénom optionnel, contact optionnel et niveau de confidentialité**, puis **simule** l'envoi (`setTimeout`) » ; 019:62 « C'est un faux système, non documenté » |
| `EventsSection` | 017:109, 019:25 | nommé dans l'arborescence `features/events/` ; 019:25 « existent ✅ » |
| `ParallaxImage` | 019:25 | « `EventsSection.tsx`, `ParallaxImage.tsx` existent | ✅ Confirmés » |
| `OrganisationExplorer`, `DepartmentModal` | 019:65-67 | « Des fichiers de travail non commités existaient (`organisation/page.tsx`, `OrganisationExplorer.tsx`, `DepartmentModal.tsx`) » |
| `HeroEditorial` (variantes de ton) | 015:177-193 | tons utilisés : `(dark)`, `(cream)`, `(light)`, `(tinted)` |
| `rhythm?: "dense" \| "standard" \| "serene"` | 016:95 | « Tous acceptent `rhythm?: "dense" \| "standard" \| "serene"` » (archétypes) |

---

# H) DIVERGENCES DOC-À-DOC (liste numérotée)

1. **`is_archived` — persisté vs supprimé.**
   - `005:118` : « `is_archived` | BOOLEAN | NOT NULL, défaut = false (bascule automatiquement à true une fois la date passée) » + `005:122` « **Index recommandé** : `(event_date, is_archived)` »
   - `006:141` : « La propriété `isArchived` initialement prévue dans le schéma est supprimée. » + `006:790` « Aucun champ `is_archived` n'est persisté. »
   - Arbitré : `008:91-93` (« Décision : l'implémentation publique suivra la modélisation »), `018:39` (« **Supprimé.** »).
2. **Couleur verte du logo.**
   - `007:23` : « Vert (sigle CCJV) | `#1E7A1E` *(à ajuster à partir du fichier logo source)* »
   - `008:49-51` : « Le « vert » du sigle est en réalité un **vert menthe très pâle** (≈ `#BFFFBF`), en **quantité infime** (41 px sur ~1,57 M) » ; « Le « doré/crème » du lettrage est **quasi blanc** »
   - `010:17-19` affirme pourtant « Couleurs **de base validées** (conservées presque exactement) ». Arbitrage proposé non validé : `008:101-105`.
3. **Fiche événement détaillée — existe, n'existe pas, existe.**
   - `002:46` : « Fiche événement : titre, date, heure, lieu, description, image (optionnelle) »
   - `008:109-110` : « `002` mentionne une « fiche événement », mais la structure publique validée ne liste que 6 routes, **sans** `/evenements/[slug]`. »
   - `011:129` : « **Pas de page de détail en V1** (voir audit §5.4) »
   - `013:69` : « ## C.2 `/vie-de-leglise/evenements/[slug]` — **Objectif :** fiche complète. »
   - `014:76` : « `src/app/vie-de-leglise/evenements/[slug]/page.tsx` — 218 lignes » → la fiche **existe**.
   - `017:324` : « Fiche événement | Specs mentionnent « fiche », structure V1 sans `/evenements/[slug]` — en pratique la fiche `[slug]` existe dans le code »
4. **Nombre de routes / périmètre de pages.**
   - `001:32-37` : 6 pages (« Périmètre fonctionnel — Site public (vitrine) »).
   - `012:104` : « 3 routes racines existantes à migrer + 5 hubs + 16 sous-pages + 3 gabarits dynamiques + 5 pages transversales »
   - `014:6` : « les 30 fichiers `src/app/**/page.tsx` présents dans le dépôt »
   - `017:18` : « (30 routes, données mockées) »
   - `018:18` : « Nombre de routes | 30 | **21** `page.tsx` »
   - `019:40` : « **21** fichiers `page.tsx` »
   - `017:325` : « Périmètre pages | CDC 6 pages vs 30 routes implémentées »
5. **Entités : 5 vs 9+ vs 14/16.**
   - `006:31` : « cinq principales entités persistantes »
   - `017:326` : « Entités | 5 tables documentées vs 9+ entités mockées »
   - `018:114` : « 14 tables. » ; `018:373` : « 16 tables et 6 enums créés en base » (cf. #31)
6. **Type des identifiants.**
   - `005:80` : « `id` | INTEGER | PK, auto-incrément »
   - `006:51` : « id | UUID / Integer | Identifiant unique »
   - `018:43` : « IDs `INTEGER` (`docs/005`) vs `UUID / Integer` (`docs/006`) vs `string` en mock | **UUID v4** »
   - `017:327` : « IDs | Schéma SQL en `INTEGER` auto-incrément vs UML `UUID / Integer` vs mocks `string` (`evt-001`, `dep-adultes`) »
7. **`PageKey` — deux enumerations incompatibles.**
   - `006:250-253` : `ACCUEIL`, `QUI_SOMMES_NOUS`, `ORGANISATION`, `CONTACT`
   - `011:235` : `pageKey: 'ACCUEIL' | 'QUI_SOMMES_NOUS' | 'ORGANISATION' | 'CONTACT'`
   - `017:137` : `type PageKey = "ACCUEIL" | "QUI_SOMMES_NOUS" | "COMMUNAUTE" | "CONTACT"`
   - `018:42` : « `PageKey` = `ACCUEIL`/`QUI_SOMMES_NOUS`/`COMMUNAUTE`/`CONTACT` (`src/types`) vs `ACCUEIL`/`QUI_SOMMES_NOUS`/`ORGANISATION`/`CONTACT` (`docs/006` §7) | **Liste ouverte** »
8. **Mot de passe administrateur.**
   - `005:82` : « `password_hash` | VARCHAR(255) | NOT NULL (mot de passe haché, jamais en clair) »
   - `006:53` : « passwordHash | String | Hash sécurisé »
   - `004:663` : « L'authentification repose sur **Supabase Auth**. »
   - `018:40` : « **Pas de mot de passe en base.** Table de profil liée à `auth.users.id` »
9. **Départements — liste inconnue vs liste nominative.**
   - `001:70` : « la liste précise n'est pas encore connue »
   - `008:128` : « Partielle : « Adultes », « Enfants/Ecodim » confirmés ; « chorale » mentionnée (`001`) ; « Jeunesse » citée en exemple (`006`) »
   - `020:254-262` : 8 départements nommés + « autres départements futurs » — sans aucun renvoi à `001`/`006`/`008`.
10. **`Ecodume` (020) vs `Ecodim` (008, 011, 015, 017).**
    - `020:176` : « - **Ecodume**. » et `020:284` : « `Ecodume` »
    - `008:136` : « Naissance de l'Ecodim : **2 juillet 2023**. » ; `011:97` : « Enfants / Ecodim » ; `015:263` : « Ecodim 2 juillet 2023 » ; `017:182` : « Ecodim | 2 juillet 2023 » ; `014:604` : « `dep-ecodim` »
    - Aucun document n'explique cette divergence orthographique ; impossible de savoir s'il s'agit de deux entités ou d'une coquille.
11. **Départements comme routes.**
    - `012:86-87` : « `/organisation/departements` | Liste dynamique » et « `/organisation/departements/[slug]` | Fiche département (modèle déjà posé par /chorale) »
    - `013:118` : « `E.3 /organisation/departements/[slug]` — **Gabarit généralisé à partir de votre page `/chorale`** (déjà posée) »
    - `014:172` : « ### 13 — `/organisation/departements` · `src/app/organisation/departements/page.tsx` — 109 lignes »
    - `018:20` : « `/organisation/departements`, `/departements/[slug]`, `/responsables` | présentes | **absentes** (supprimées) | Les départements ne sont plus des routes »
    - `019:43-44` : « `/organisation/departements` existe | **Absent** »
12. **Nombre de rôles.**
    - `002:67` : « Un seul rôle « Administrateur » dans cette première version »
    - `004:713` : « `ROLE_ADMIN` … est le seul rôle applicatif nécessaire. »
    - `020:128` : « Trois catégories fonctionnelles sont retenues. » (Super Administrateur / Administrateur / Responsable de département) + matrice `020:718` à 4 colonnes.
    - `001:118` (`002:118`) : « Multi-éditeurs avec droits différenciés par département » — **hors périmètre V1**.
13. **`publications.status` — 2 valeurs vs 3 états.**
    - `018:133` : `status` enum `DRAFT`\|`PUBLISHED`
    - `020:361-367` : `BROUILLON` → `PUBLIÉ` → `ARCHIVÉ`
14. **Workflow de validation.**
    - `006:750` : « La V1 ne nécessite pas de workflow complexe de validation. »
    - `020:466-476` : « Responsable ↓ Proposition ↓ Validation éventuelle ↓ Publication reste à préciser »
15. **Champs `Event` / `Publication` — `description` présente ou absente.**
    - `005:112` : `events.description TEXT Nullable` ; `005:136` : `publications.description TEXT Nullable`
    - `006:111-118` (Event) et `006:197-201` (Publication) : **aucun champ `description`** dans les tables d'attributs, alors que `006:227` évoque « une publication textuelle nécessite un contenu éditorial ».
    - `002:98` : « Événement | id, titre, date, heure, lieu, **description**, image »
16. **`StaticPage.content` — texte riche vs JSON.**
    - `005:153` : « `content` | TEXT | NOT NULL (texte riche / HTML simple) »
    - `017:308` : « `content: string` de `StaticPage` vs contenu réel multi-sections structuré »
    - `018:181` : « **Décision : `jsonb` validé par un registre Zod, un schéma par `page_key`.** »
    - `020:520-530` : « Page ├── Section │ ├── type │ ├── variante │ └── données » — un troisième modèle, incompatible avec `018:202-204` : « **Ce qui n'est PAS dans `static_pages` :** la mise en page, l'ordre des sections, les listes […] » (pas de notion de `type`/`variante` de section dans `018`).
17. **Formulaire de contact.**
    - `001:37` : « Page de contact : localisation, coordonnées, **éventuellement formulaire de contact** »
    - `011:173` : « **Pas de formulaire de contact en MVP** (règle validée). »
    - `002:58` : pas de formulaire, seulement WhatsApp.
18. **Hébergement / base de données.**
    - `003:39` : « Base de données | PostgreSQL ou MySQL »
    - `003:40` : « Stockage médias | Stockage objet (local au serveur en V1, ou service cloud si budget le permet) »
    - `005:5` : « SQL relationnel (PostgreSQL/MySQL) »
    - `004:106-110` : « Base de données | PostgreSQL » ; « Stockage médias | Supabase Storage » → figé et différent.
19. **`static_pages` — clés éditables.**
    - `002:90` : « Modifier le contenu des pages « Accueil » et « Qui sommes-nous » (textes principaux) »
    - `006:250-253` : 4 clés (`ACCUEIL`, `QUI_SOMMES_NOUS`, `ORGANISATION`, `CONTACT`)
    - `018:42` : « **Liste ouverte** pilotée par les `pageKey` existants en base »
20. **Entités `Leader`/`Testimony`/`CommunityFace`.**
    - `005:74-154` : 5 tables, aucune de ces entités.
    - `017:306` : « `Leader`, `Testimony`, `CommunityFace`, `Verse`, `RhythmEntry` existent en mocks mais absents du schéma 5 tables »
    - `018:41` : « **Persistées** »
    - `019:31` : « Ambiguïté sur `Leader`, `Testimony`, `CommunityFace` absents du schéma 5 tables | ✅ Confirmée et traitée »
21. **Nombre de photographies du fonds : 43 vs 41.**
    - `008:55` : « **43 photographies JPEG**, issues de partages WhatsApp » ; `009:85-86` : « les **43 photos réelles** de `public/images/` »
    - `012:24` : « 41 photos (`public/media`…) + 41 originaux (`public/images`) » ; `014:553` : « **41 fichiers** » ; `017:217` : « `public/images/` : 41 originaux WhatsApp » ; `019:27` : « `public/images/` contient 41 originaux | ✅ 41 »
22. **Typographie : tailles fixes vs échelle fluide.**
    - `007:48-52` : « Titre principal (H1) | Lora | 36px | 600 » ; « Titre de section (H2) | Lora | 28px | 600 » ; « Sous-titre (H3) | Lora | 20px | 500 »
    - `010:53-59` : « H1 (titre de page) | Lora 600 | `clamp(2rem, 1rem + 2.5vw, 3rem)` (32→48 px) » ; « H2 … (28→40 px) » ; « H3 … (20→24 px) »
23. **Nombre d'événements affichés sur l'accueil.**
    - `002:26` : « Aperçu des **2-3** prochains événements »
    - `011:44` : « Prochains événements (**2–3** Event Cards + « Tout voir ») »
    - `013:24` : « **3 événements maximum** (date, titre, lieu, photo, CTA) »
24. **Préfixe d'API `/api/v1` vs `/api`.**
    - `004:512` : « Toutes les routes métier utilisent : ```text /api/v1 ``` »
    - `006:326` : « │ GET /api/events » ; `006:372` : « │ POST /api/events » ; `006:426` : « │ PUT/PATCH /api/events/:id » ; `006:467` : « │ DELETE /api/events/:id » ; `006:668` : « │ POST /api/departments » ; `006:701` : « │ PUT/PATCH /api/pages/:pageKey »
25. **`BibleVerse` et composants `020` non alignés sur l'inventaire `014`.**
    - `020:75-78` : « ```text BibleVerse ├── variante image ├── variante éditoriale └── variante minimale ``` »
    - `014:442-491` (inventaire exhaustif) : aucun `BibleVerse`. Le composant équivalent est `VerseSection` (`014:451`) / `ScriptureBlock` (`015:97`).
    - `020:89-98` : « Hero / Card / Section événement / Section publication / Call-to-action / Gallery / etc. » — `Section événement`, `Section publication`, `Call-to-action`, `Gallery` ne figurent pas non plus dans l'inventaire `014`.
26. **Redirections 308 (012) vs 404 sans redirection (015/016).**
    - `012:110-111` : « `/evenements` | `/vie-de-leglise/evenements` | Déplacée + **redirection 308** » ; « `/contact` | `/vie-de-leglise/ou-nous-trouver` | Déplacée + **redirection 308** »
    - `015:243-246` : « **Aucune redirection n'a été posée** : les cinq routes piliers répondent désormais 404, conformément à la règle « migrer directement, sans couche de redirection ». »
    - `016:141` : « Aucune redirection n'est posée : une route pilier doit répondre 404. »
27. **Cible du CTA « Nous rejoindre ».**
    - `010:255-256` : « Cible proposée (à valider) : `/contact` (horaires, localisation, WhatsApp) ou l'ancre « Rejoindre » de l'accueil. »
    - `011:26` : « **CTA permanent** : « Nous rejoindre » → `/contact` (décision à valider). »
    - `017:333` : inscrit « CTA « Nous rejoindre » → `/contact` » parmi les **décisions déjà figées**.
    - `013:77` : « **Note :** remplace l'actuelle `/contact`. » (la route `/contact` n'existe plus)
28. **`photoPool` mentionné mais inexistant dans la copie intégrale de `images.ts`.**
    - `016:189-190` : « Les images viennent de `@/data/mock/images` (`images`, `photoPool`, `galleryImages`). »
    - `014:499-543` : copie « intégrale » de `src/data/mock/images.ts` → seuls `images` et `galleryImages` existent ; `014:545` énumère 8 clés + 10 entrées de `galleryImages`, sans `photoPool`.
29. **Emplacement du frontend : `src/` à la racine (docs) vs `frontend/src/` (dépôt).**
    - `004:346-367`, `011:250-266`, `012:124`, `014:6/28/…`, `015:235/264`, `016:119/134`, `017:100-116` : tous écrivent `src/app/...`, `src/lib/nav.ts`, `src/data/mock/...`
    - `019:50` : « C'est `frontend/src/app/` qui fait foi. » ; `019:74` : « `frontend/src/types/index.ts` »
    - Réalité du dépôt : `/frontend/src/...` (voir §J) → **toutes les références de chemin de `004`, `011`, `012`, `014`, `015`, `016`, `017` sont relatives à un `src/` qui n'est pas à la racine du dépôt.**
30. **Backend : dossier `server/` (018 §2) vs `backend/` (018 §13-14 et dépôt).**
    - `018:50` : « **Décision : même dépôt, dossier `server/`.** » ; `018:54-79` : arborescence `CCJV-CHURCH/server/…`
    - `018:367` : « Les secrets vivent dans `backend/.env` » ; `018:376` : « Voir `backend/README.md` » ; `018:381` : « `backend/scripts/create-admin.ts` »
    - **Contradiction interne à `018`** ; le dépôt contient `backend/`, pas `server/` (voir §J).
31. **`018` : `14 tables` vs 15 tables énumérées vs `16 tables` créées.**
    - `018:114` : « 14 tables. Pas de table « au cas où » »
    - `018:121-160` : énumération de `admin_profiles`, `departments`, `events`, `publications`, `leaders`, `testimonies`, `community_faces`, `static_pages`, `scriptures`, `schedule_entries`, `social_links`, `site_settings`, `media`, `event_media`, `department_media` = **15** ; `018:95-102` ajoute `prayer_requests` = **16**.
    - `018:373` : « 16 tables et 6 enums créés en base »
32. **`019:80` : « Les sept contradictions listées par `docs/017` §17 ».**
    - `017:320-327` : la table §17 du titre « ## 17. Contradictions trouvées dans la documentation » contient **6** lignes (`# 1` à `# 6`), pas 7.
33. **`013` — 3 événements max vs `011` — 2–3** (déjà #23) **et `002` — 2-3** : trois formulations d'un même seuil non chiffré de façon unique.
34. **`020:259` — « Chorale Grand Groupe CCVJ » : sigle `CCVJ`** alors que tous les autres documents écrivent `CCJV` (`001:9`, `007:12`, `008:134`, etc.). Non expliqué.
35. **`020:261` — « D'hygiène et Ancien semence »** : nom de département dont la formulation est ambiguë (« Ancien semence ») et non repris par aucun autre document.
36. **`012:119` (6 entrées de menu dont hubs) vs `015:227-229`/`016:126-128` (les pôles ne sont plus des destinations).**
    - `012:119` : « **Menu principal (6 entrées)** : Accueil · Qui-sommes-nous · Vie de l'Église · Communauté · Organisation · Publications & Médias. »
    - `015:227-229` : « Seul l'accueil possède une page propre. « Qui sommes-nous », « Vie de l'Église », « Communauté », « Organisation » et « Publications & Médias » sont des **regroupements** : ils nomment une famille de pages sans en être une. »
37. **`015:209` « Emplacements `TODO — … À FOURNIR` assumés | 0 | **19** » vs `017:190` / `018:391` « 19 emplacements `TODO` ».** Ces documents concordent sur le nombre mais **`013:192`** rappelle qu'« Une consigne antérieure demandait **l'absence totale de « TODO » à l'écran** (remplacés par du lorem ipsum). » → règle contradictoire, non tranchée (`013:194` : « Décision à confirmer. »).
38. **`014:6` « les 30 fichiers `src/app/**/page.tsx` » vs `019:40` « 21 fichiers `page.tsx` »** (déjà #4) **et `016:292` « Généralisation aux 26 autres routes »** — trois décomptes de routes différents (30 / 21 / 27 implicite).
39. **`004:1109-1116` : le flux `POST /api/v1/events` passe par `EventRepository → Drizzle → PostgreSQL` ; `006:372` : le même flux écrit `POST /api/events` sans `/v1`** (déjà #24).
40. **`020:731` (matrice = « base de conception et non encore le contrat définitif ») vs `020:918` (« document maître initial ») et `020:173` (« disposent actuellement d'un espace métier »)** — le document se présente simultanément comme ouvert et comme maître, et décrit au présent un back-office non implémenté (`017:19`, `017:74`).

---

# I) QUESTIONS POSÉES MAIS NON TRANCHÉES

## I.1 `001-cahier_des_charges.md`
- `001:57` : « **Hébergement** : à définir (solution locale, régionale ou internationale) selon le budget disponible. »
- `001:74-76` : « ## 8. Points encore à préciser — - Budget et solution d'hébergement - Délai souhaité de mise en ligne »
- `001:70` : « la liste précise n'est pas encore connue »

## I.2 `003-architecture_technique.md`
- `003:43` : « Ce choix reste indicatif : à ajuster selon vos préférences techniques et l'environnement d'hébergement retenu. »
- `003:72-76` : « ## 6. Points à trancher avec le client — - Budget et hébergement définitif - Nom de domaine souhaité - Qui aura accès à l'administration (une ou plusieurs personnes) »

## I.3 `005-schema_database.md`
- `005:169` : « `is_archived` peut être calculé à la volée (comparaison `event_date < aujourd'hui`) plutôt que stocké, selon le choix technique final — l'un ou l'autre fonctionne pour une V1. »
- `005:162` : « à ajouter plus tard si besoin (`created_by`) »

## I.4 `006-modelisation_&_statique...md`
- `006:227-229` : « Le modèle actuel devra être précisé lors de la conception du schéma final : une publication textuelle nécessite un contenu éditorial distinct d'une simple URL. Cette décision sera intégrée au contrat API lors de la sous-phase 3.3. »
- `006:765-767` : « Toutefois, si le back-office V1 ne prévoit pas de sauvegarde en brouillon, l'état `DRAFT` peut être supprimé du modèle […] La décision finale sera alignée avec le comportement défini dans le CSF et le contrat API. »
- `006:857` : « Le schéma SQL définitif sera ajusté avant implémentation afin de refléter exactement cette décision ainsi que les éventuelles décisions prises durant la sous-phase 3.3. »
- `006:894` : « Aucune implémentation ne doit commencer avant la finalisation de l'architecture, du contrat API et de la roadmap de la Phase 3. »

## I.5 `007-design_graphique.md`
- `007:23` : « `#1E7A1E` *(à ajuster à partir du fichier logo source)* »
- `007:30` : « les codes exacts du vert et du doré devront être vérifiés directement depuis le fichier source du logo »
- `007:60` : « prévoir une déclinaison simplifiée (à créer si besoin — silhouette noire ou verte du sigle, sans le fond noir) »
- `007:73-77` : « ## 6. À faire avant intégration »

## I.6 `008-audit_design.md`
- `008:101` : « **Décision proposée (à valider) :** conserver `#1E7A1E` comme **vert d'interface principal** »
- `008:111` : « **Décision proposée (à valider) :** en V1, la page Événements porte toute l'information dans des cartes riches […] ; **pas de page de détail séparée**. Elle pourra être ajoutée en itération. »
- `008:91-93` : « Le schéma SQL `005` devra être aligné avant la phase backend (hors périmètre de la mission publique, mais signalé). »
- `008:119-120` : « Aucune de ces données n'est disponible : elles seront représentées par des placeholders explicites `TODO — … À FOURNIR`, jamais par des valeurs inventées. » (tableau des 7 TODO, L124-130)
- `008:143` : « ## 7. Recommandations d'audit (à appliquer à l'implémentation) »

## I.7 `010-design_system.md`
- `010:5` : « **Statut :** Proposition — à valider avant implémentation »
- `010:255-256` : « **Cible proposée (à valider) :** `/contact` (horaires, localisation, WhatsApp) ou l'ancre « Rejoindre » de l'accueil. »
- `010:109` : « `--radius-pill` | `999px` | uniquement si un badge/état « rond » est nécessaire »

## I.8 `011-architecture_visuelle.md`
- `011:5` : « **Statut :** Proposition — à valider avant implémentation »
- `011:26` : « (décision à valider) » (CTA `/contact`)
- `011:130` : « **Filtrage** : optionnel par département (à valider ; reportable en itération). »
- `011:57` : « `TODO — HORAIRES À FOURNIR` »
- `011:73` : « Vision (contenu TODO — À FOURNIR) »
- `011:174` : « numéro `TODO — NUMÉRO WHATSAPP À FOURNIR` »
- `011:176-177` : « adresse `TODO — ADRESSE À FOURNIR` ; carte intégrée uniquement si l'adresse est fournie »
- `011:109` : « **Empty State** si aucun département : message + placeholder `TODO — CONTENU À FOURNIR`. »
- `011:107` : « Tout autre département → placeholder `TODO`. »

## I.9 `012-audit_et_architecture.md`
- `012:6` : « **Statut :** Proposition — implémentation à démarrer après validation »
- `012:136` : « Pour que `/organisation/chorale` compile **et** que le gabarit `[slug]` soit générique, le type `Department` doit être étendu »
- `012:145` : « Le même schéma sera repris par l'API (`/api/v1/departments`). »

## I.10 `013-ux_narration_par_page.md`
- `013:28` : « Présentation sobre, moyens — **uniquement si périmètre validé** | Selon périmètre »
- `013:80` : « **uniquement si le périmètre le permet**. Sinon : page de présentation + **point d'intégration explicite**, aucun faux système de paiement. »
- `013:99` : « formulaire **uniquement si le périmètre le permet**, sinon point d'intégration + WhatsApp. **Aucun faux envoi.** »
- `013:189-194` : « # K. POINT À TRANCHER — PLACEHOLDERS — Le prompt V3 (§28) demande d'utiliser `TODO — CONTENU À FOURNIR` lorsqu'une information manque. Une consigne antérieure demandait **l'absence totale de « TODO » à l'écran** (remplacés par du lorem ipsum). **Proposition :** appliquer `TODO — CONTENU À FOURNIR` **uniquement** aux informations institutionnelles réellement inconnues […] et conserver le lorem ipsum pour le texte purement décoratif. **Décision à confirmer.** »
- `013:191` : référence à « Le prompt V3 (§28) » — document externe non présent dans le dépôt (voir §J).

## I.11 `015-architecture_editoriale.md`
- `015:248-253` : « > **Contenu à replacer.** Les compositions des cinq pôles supprimés […] n'ont pas été redistribuées : elles ont été retirées avec leur page. Une partie de cette matière existe déjà dans les sous-pages ; le reste peut être réaffecté sur demande. »
- `015:266` : « Contenu requis mais **non fourni** (confession de foi CCJV, témoignages réels, identités des responsables, statistiques) | `ContentPending` → `TODO — … À FOURNIR` »
- `015:268-270` : « Aucune légende photographique affirmative n'est écrite : l'agent n'a pas de capacité d'analyse d'image, la correspondance photo → sujet reste à relire par CCJV. »

## I.12 `016-guide_composition_pages.md`
- `016:166` : « Contenu requis mais non fourni | `<ContentPending what="…" />` »
- `016:173-174` : « **Ne jamais inventer :** témoignages, noms, biographies, responsables, horaires, événements, statistiques, doctrine, dates, activités, lieux, résultats. »
- `016:176` : « Aucune légende photographique affirmative : l'agent n'a pas d'analyse d'image. »

## I.13 `017-reference_projet_conception_backend.md` — §16 (10 ambiguïtés) et §19-20 (14 questions)
§16 « Éléments encore ambigus » (`017:305-314`) verbatim :
1. « `PageKey` inclut `COMMUNAUTE`/`CONTACT` alors que ce sont des hubs sans contenu stocké [Source : src/types/index.ts vs docs/006 §7]. »
2. « `Leader`, `Testimony`, `CommunityFace`, `Verse`, `RhythmEntry` existent en mocks mais absents du schéma 5 tables [Source : src/data/mock/ vs docs/005]. »
3. « `category` optionnel mais utilisé pour filtrage/routage rubriques [Source : src/types/index.ts]. »
4. « `content: string` de `StaticPage` vs contenu réel multi-sections structuré [Source : src/types/index.ts vs src/app/page.tsx]. »
5. « Modèle TEXTE : `body: string[]` observé mais « à préciser lors du schéma final » [Source : src/types/index.ts, docs/006 §6]. »
6. « Galeries / `practicalInfo` / `keyPoints` : tableaux de strings, pas d'entités [Source : src/types/index.ts]. »
7. « Navigation `mainNav` codée en dur, index recherche construit au rendu [Source : src/lib/nav.ts, src/app/recherche/page.tsx]. »
8. « État `DRAFT`/`PUBLISHED` évoqué mais « supprimable si pas de brouillon en V1 » [Source : docs/006 §20]. »
9. « Placeholders : `TODO — CONTENU À FOURNIR` vs lorem (proposition : TODO pour faits réels, lorem pour décoratif — à confirmer) [Source : docs/013 §K]. »
10. « Versets jamais inventés (Louis Segond 1910 à valider) ; prière/don = présentation + point d'intégration, jamais de faux système [Source : docs/012 §1.4, docs/013 §J]. »

§19 (`017:341`) verbatim : « Schéma SQL final (alignement `is_archived`, IDs uuid vs integer, persistance ou non de leaders/témoignages/visages/versets/horaires), structuration `StaticPage.content`, statut galeries/`practicalInfo`/`body`, nature de `category`, navigation dynamique ou non, recherche (index, endpoint), brouillon ou non, organisation Storage, routes back-office, RBAC détaillé, contrat `/media`, cache, pagination par défaut [À décider]. »

§20 (14 questions, `017:347-371`) verbatim :
- « ### Données
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
14. Cache HTTP, optimisation images, file d'uploads, migrations Drizzle, env prod, staging, sauvegardes ? [À décider — cadre docs/004 §29-32] »

## I.14 `018-decisions_conception_backend.md` — §14 « Reste à fournir par CCJV »
`018:387-396` verbatim :
« Ces éléments ne peuvent pas être inventés et ne bloquent pas l'implémentation :
1. **Confession de foi CCJV** (19 emplacements `TODO` du frontend).
2. **Identités réelles** des responsables, témoignages, visages communauté.
3. **Horaires confirmés** du culte dominical et de l'Ecodim.
4. **Numéro WhatsApp réel** (actuellement `+243 123 456 789`, démonstration).
5. **Liens YouTube réels** des enseignements (les deux liens actuels sont des valeurs de démonstration). »

## I.15 `020-conception_backoffice.md` — §22 « Points encore à spécifier » (7 items) + §21
`020:850-871` verbatim :
« 1. **Validation des événements proposés par les responsables** — Publication directe ou validation par un Administrateur ?
2. **Règle exacte d'archivage des publications** — Quel seuil de publications récentes ? Global ou par catégorie/département ?
3. **Granularité exacte des permissions des responsables** — Quels « autres contenus associés » peuvent-ils gérer ?
4. **Propriété des médias** — Média global, média appartenant à un département, ou combinaison des deux ?
5. **Comportement de chaque section dynamique sans données** — Masquage, état vide, fallback ou CTA.
6. **Liste définitive des propriétés administrables des départements**.
7. **Liste définitive des fonctions réservées au Super Administrateur**. »

`020:391-400` : « **La valeur exacte du seuil reste à définir.** »

`020:466-476` : « Le workflow précis : [...] reste à préciser dans la conception fonctionnelle détaillée. »

`020:510` : « La frontière exacte entre ces propriétés sera déterminée après l'audit du frontend et la conception détaillée du modèle de données. »

`020:554` : « C'est précisément l'objet de l'**audit stratégique du frontend** qui suivra ce document. »

`020:660-662` : « Cette navigation est **conceptuelle**. Elle devra être adaptée à chaque rôle »

`020:731` : « **Cette matrice est une base de conception et non encore le contrat définitif de permissions.** »

`020:807-809` : « Ce document ne doit **pas inventer la liste finale des champs administrables**. L'étape suivante est donc un audit stratégique du frontend existant. »

`020:846` : « **Le prompt DeepSeek sera donc rédigé à partir de ce document, et non l'inverse.** »

## I.16 Décompte
**Total d'items ouverts relevés : 68** (répartis : 001 → 3 ; 003 → 3 ; 005 → 2 ; 006 → 4 ; 007 → 4 ; 008 → 5+7 TODO institutionnels ; 010 → 3 ; 011 → 8 TODO + 3 à valider ; 012 → 3 ; 013 → 5 (dont 1 explicite « Décision à confirmer ») ; 015 → 3 ; 016 → 3 ; 017 → 10 ambiguïtés + 14 questions ; 018 → 5 items à fournir ; 020 → 7 points à spécifier + 4 ouvertures).
**Items marqués explicitement « Décision à confirmer / à valider » : 9** (`008:101`, `008:111`, `010:255`, `011:26`, `011:130`, `013:194`, `017:313`, `020:731`, `020:854-871`).
**Items marqués « À décider » : 17** (dans `017` §19-20).

---

# J) DOCUMENT MANQUANT / RÉFÉRENCES ROMPUES

## J.1 `CCJV_conception_backoffice.md` — **INEXISTANT**
- Recherche récursive sur la totalité de `C:\Users\HP\desktop\PROJETS 2026\CCJV-CHURCH` (filtre `*backoffice*`, toutes extensions, y compris `.git` et sous-dossiers) : **un seul résultat**, `docs\020-conception_backoffice.md`.
- **Aucun fichier nommé `CCJV_conception_backoffice.md` n'existe nulle part dans le dépôt.**
- Le fichier nommé `docs\020-conception_backoffice.md` ne porte pas ce nom : son titre interne est (L1) « # Document de conception — Back-Office CCJV ».

## J.2 Ce qu'est réellement le document de conception back-office
- **Nom de fichier** : `docs/020-conception_backoffice.md` (20760 octets, 920 lignes).
- **Titre interne** : « Document de conception — Back-Office CCJV » (`020:1`).
- **Emplacement** : `C:\Users\HP\desktop\PROJETS 2026\CCJV-CHURCH\docs\020-conception_backoffice.md`.
- **Auto-désignation** : `020:918` « **Ce document constitue le document maître initial de conception du Back-Office.** »
- **Statut revendiqué** : `020:6` « **Statut :** Document de conception initial — avant audit stratégique du frontend ».
- ⚠️ **Aucun autre document du dossier `docs/` ne référence `020`.** Ni `017`, ni `018`, ni `019` ne le citent — `017` (périmètre « Documentation `/docs` (001 à 016) ») et `019` s'arrêtent avant lui. `020:846` renvoie pourtant à un « prompt DeepSeek » qui n'est pas dans le dépôt.

## J.3 Références rompues (document cité, absent du dépôt)
| Référence | Citée par | Statut |
|---|---|---|
| « Le prompt V3 (§28) » | `013:191` | **ABSENT** — aucun fichier « prompt V3 » dans `docs/` ni ailleurs (recherche `*.md` sur tout le dépôt : seuls `docs/001-020`, `backend/README.md`, `backend/docs/IMPLEMENTATION_SPEC.md`, `frontend/README.md`). |
| « §34–§36 » et « §37–§42 » et « §22 » | `013:150`, `013:164`, `012:30` | **ABSENTS** — ces numéros de section renvoient au « prompt V3 » non présent ; `013` les cite comme des contraintes externes (« H. SYSTÈME D'INTRODUCTION ET DE TRANSITIONS (§34–§36) », « I. RESPONSIVE — COMPOSITIONS INDÉPENDANTES (§37–§42) »). |
| « le cahier §8 », « cahier §9 », « cahier §14 », « cahier §21 », « cahier §26 », « cahier §29 », « cahier d'implémentation §4 » | `018:44`, `018:152`, `018:290`, `018:343`, `018:275`, `018:371`, `018:41` | **ABSENT / non concordant** — `docs/001-cahier_des_charges.md` ne comporte que les sections §1 à §8 (L7, L13, L20, L28, L53, L60, L67, L73) et **aucun §9, §14, §21, §26, §29, ni §4 (au sens invoqué)**. Le « cahier d'implémentation » n'existe pas dans le dépôt. |
| « `docs/004` §17-21 », « §26 », « §31 », « §33 » … | `017`, `018` | **VALIDE** (les sections existent). |
| `docs/014-audit_pages_refactor.md` | `015:14`, `016` (titre), `017:61/68/118/126/194/216` | **VALIDE** (fichier présent). |
| `docs/015-architecture_editoriale.md` | `016:4` | **VALIDE**. |
| `docs/002`, `003` … `006` | `018:4` | **VALIDE**. |
| `backend/README.md` | `018:376` | **VALIDE** (le fichier existe : `backend\README.md`). |
| `backend/scripts/create-admin.ts` | `018:381` | **VALIDE** (le fichier existe : `backend\scripts\create-admin.ts`). |
| `backend/.env` | `018:367` | **VALIDE** (le fichier existe : `backend\.env`). |
| Dossier `server/` (arborescence `018:54-79`) | `018:50-52` | **ABSENT** — le dépôt contient `backend/`, pas `server/`. Contradiction interne à `018` (voir §H #30). |
| `src/components/forms/PrayerRequestForm.tsx` | `018:90` | Chemin **relatif à `frontend/`** — le chemin absolu réel est `frontend/src/components/forms/PrayerRequestForm.tsx`. |
| `src/app/...`, `src/lib/nav.ts`, `src/data/mock/...`, `src/types/index.ts` | `004`, `011`, `012`, `014`, `015`, `016`, `017` | **Chemins écrits comme si `src/` était à la racine** ; la racine réelle est `frontend/src/` (voir §H #29). |
| `docs/018` §1, §3, §4.2 | `019:31`, `019:64`, `019:81` | **VALIDE** (les sections existent). |
| `docs/018` §12 | `018` (implicite) | **SECTION MANQUANTE** — `018` passe de « ## 11. Tests » (`018:330`) à « ## 13. Environnement de vérification — RÉSOLU » (`018:349`) : **il n'y a pas de §12**. |
| `docs/014` §30 | `017:68`, `017:126`, `017:383` | **VALIDE** (route n° 30 = `/recherche`). |
| `docs/008` §5.4 | `011:129` (« voir audit §5.4 ») | **VALIDE** (`008:107` « ### 5.4 Point non tranché — fiche événement détaillée »). |

## J.4 État du dépôt (constat, hors périmètre des 20 documents)
- Racine `CCJV-CHURCH/` : `.git/`, `.gitignore` (1604 o), `backend/`, `docs/`, `frontend/`, `supabase/`.
- `docs/` : **20 fichiers** `001`…`020` — **et aucun sous-dossier `docs/audit/`** avant la création du présent fichier.
- `frontend/` : `src/`, `public/`, `.next/`, `node_modules/`, `README.md`, `package.json`, `next.config.mjs`, `eslint.config.mjs`, `tsconfig.json`, `.env.local`, `.env.example`.
- `frontend/src/app/` contient **21 fichiers `page.tsx`** (concorde avec `018:18` et `019:40` ; contredit `014:6` et `017:18`).
- `backend/` : `src/{config,domain,infrastructure,modules,presentation,shared}`, `app.ts`, `container.ts`, `server.ts`, `drizzle/0000_elite_pretty_boy.sql`, `scripts/create-admin.ts`, `scripts/__tmp_verify_editorial.ts`, `tests/{helpers,integration,setup,unit}`, `openapi.yaml`, `openapi.json`, `Dockerfile`, `railway.json`, `.env`, `.env.example`, `docs/IMPLEMENTATION_SPEC.md`, `README.md`.
  - ⚠️ `backend/src` utilise `modules/` (arborescence de `004:379-407`), alors que `018:58-77` spécifie `config/`, `domain/`, `application/`, `infrastructure/{database,repositories,supabase,logger}`, `presentation/`, `shared/` — **`application/` et `logger/` ne figurent pas dans le listing observé, `modules/` n'est pas dans `018`.** Divergence `018` ↔ dépôt (constat, à confirmer par l'agent code).
- `supabase/` : présent à la racine.
- **Fichiers `.md` hors `docs/`** (non listés dans les 20, non analysés ici) : `backend/README.md`, `backend/docs/IMPLEMENTATION_SPEC.md`, `frontend/README.md`.
  - ⚠️ `backend/docs/IMPLEMENTATION_SPEC.md` n'est référencé par **aucun** des 20 documents, alors que `018:41` invoque « Demande explicite du cahier d'implémentation §4 » — le document nommé « cahier d'implémentation » semble correspondre à `backend/docs/IMPLEMENTATION_SPEC.md` ; **aucun des 20 documents ne le nomme**.

---

*Fin de l'extraction. Aucun fichier modifié hormis `docs/audit/_evidence/05-docs.md`.*
