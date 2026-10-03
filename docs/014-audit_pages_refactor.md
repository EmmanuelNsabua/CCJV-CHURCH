# 014 — Audit structurel et visuel des pages

> **Objet** : inventaire exhaustif de la composition visuelle de chaque route du site public CCJV, avec trois sections d’analyse (matrice de similarité, inventaire des composants partagés, inventaire des ressources visuelles).
> **Nature** : observation pure. Aucune recommandation de design, aucune modification de code.
> **Mode de lecture** : lecture seule. Le seul fichier créé par cet audit est `docs/014-audit_pages_refactor.md`.
> **Périmètre** : les 30 fichiers `src/app/**/page.tsx` présents dans le dépôt.

## Méthode et conventions de comptage

| Notion | Définition retenue |
| --- | --- |
| **Route** | Chemin d’URL déduit de l’arborescence `src/app`. |
| **Ordre des blocs** | Ordre littéral du JSX de haut en bas, notation `A → B → C`. |
| **Sections** | Nombre de blocs de premier niveau réellement rendus, en-tête de page inclus (`PageHeader` ou `Hero` comptés comme bloc 1). Les sections conditionnelles sont signalées. |
| **Photos** | Nombre d’occurrences `<Image>` effectivement rendues (y compris `YouTubeThumb`, `BreathingPhoto`, galeries et cartes). `CommunityFaces` est compté **deux fois** par visage : la branche desktop (`md:grid`) et la branche mobile (`md:hidden`) sont toutes deux présentes dans le DOM. |
| **Verset (rang)** | Rang du bloc portant le verset ; `absent` si aucun. Le verset passé en prop `verse` de `PageHeader` est noté « 1 (en-tête) » ; un `VerseSection` autonome est noté par son rang de bloc. |
| **Grilles de cartes** | Grilles répétées de cartes/lignes « card-like », avec la taille réelle de la grille et le nombre d’éléments rendus par les données actuelles. |
| **Mots éditoriaux** | Approximation du nombre de mots de prose française écrite en dur dans le fichier de page, y compris les tableaux locaux (`doors`, `steps`, `articles`, `valeurs`, `destinations`, `apports`, `history`, `questions`). **Exclut** les données de `src/data/mock/**`, les `metadata`, les commentaires et les valeurs injectées depuis le mock. Fourni sous forme d’ordre de grandeur (`≈`). |
| **Metadata** | Présence et forme de `export const metadata` ou `export function generateMetadata`. |

Le chrome global — `Header` (logo `/logo.png`), `Footer` (logo `/logo.png`), `IntroCurtain` (verset Matthieu 18:20) — est monté une seule fois dans `src/app/layout.tsx` et **n’est compté dans aucune page**. `IntroCurtain` ajoute donc un verset Matthieu 18:20 sur **toutes** les routes au premier affichage de session, indépendamment du contenu de page.

---

## 1. Audit page par page

### 01 — `/`
`src/app/page.tsx` — 352 lignes

- **Ordre exact des blocs** : `Hero` → `VerseSection` → `Section#mot-du-pasteur` (tinted) → `Section#qui-sommes-nous` → `Section#agenda` (tinted) → `Section#horaires` → `Section#enseignements` (tinted) → `Section#communaute` → `BreathingPhoto` → `Section#priere` (tinted) → `Section#soutenir` → `Section#envoi` (green)
- **Sections** : 12 blocs (1 `Hero`, 9 `Section`, 1 `VerseSection`, 1 `BreathingPhoto`)
- **Composants partagés** : `Hero`, `VerseSection`, `Section`, `SectionHeading`, `Reveal`, `CrossMark`, `OpenBookMark`, `BreathingPhoto`, `WeekRhythm`, `CommunityFaces`, `Button`, `FeaturedEvent`, `EventRow`, `TeachingFeature`, `TeachingCard`
- **Photos** : 19 occurrences — `images.portraitLarge` (`/media/ccjv-05.jpeg`) dans `Hero`, `images.portraitLarge` (`/media/ccjv-05.jpeg`) au mot du pasteur, `images.identite` (`/media/ccjv-27.jpeg`), `mainEvent.imageUrl` (`/media/ccjv-08.jpeg`) via `FeaturedEvent`, 3 `YouTubeThumb` (distants `i.ytimg.com`), `CommunityFaces` ×10 (5 visages × 2 branches : `/media/ccjv-01.jpeg`, `/media/ccjv-03.jpeg`, `/media/ccjv-06.jpeg`, `/media/ccjv-18.jpeg`, `/media/ccjv-34.jpeg`), `BreathingPhoto` (`images.louange` = `/media/ccjv-08.jpeg`), `images.communaute` (`/media/ccjv-30.jpeg`)
- **Verset** : rang 1 (verset inline dans `Hero`, Psaume 122:1) **et** rang 2 (`VerseSection`, Matthieu 18:20, tone `dark`)
- **Grilles de cartes** : 1 grille de 2 `TeachingCard` (`grid-cols-1 sm:grid-cols-2`) ; `CommunityFaces` = 5 visages en scrollytelling (hors carte) ; `EventRow` ×2 en liste bordée
- **Mots éditoriaux** : ≈ 360 mots
- **Metadata** : `export const metadata` (titre absolu `defaultTitle` + description). Pas d’`alternates.canonical`, pas d’`openGraph` propre — contrairement aux autres pages.

### 02 — `/vie-de-leglise`
`src/app/vie-de-leglise/page.tsx` — 134 lignes

- **Ordre exact** : `PageHeader` → `Section` (prochain rendez-vous) → `Section` (tinted, `WeekRhythm`) → `Section` (portes) → `VerseSection`
- **Sections** : 5
- **Composants partagés** : `PageHeader`, `Section`, `SectionHeading`, `Reveal`, `VerseSection`, `WeekRhythm`, `FeaturedEvent`, `EventRow`, `Button` (+ `Link` de `next/link`)
- **Photos** : 1 — `mainEvent.imageUrl` (`/media/ccjv-08.jpeg`) via `FeaturedEvent` ; `PageHeader` reçu sans prop `image` → baie vide
- **Verset** : rang 1 (en-tête, Matthieu 18:20) **et** rang 5 (`VerseSection`, Matthieu 11:28, tone `dark`)
- **Grilles de cartes** : 1 grille de 2 « portes » (`grid-cols-1 md:grid-cols-2`), construite avec `Link` et non un composant carte ; `EventRow` ×3 en liste
- **Mots éditoriaux** : ≈ 100 mots
- **Metadata** : `export const metadata = pageMetadata({...})` (canonical + openGraph + twitter), chemin `/vie-de-leglise`

### 03 — `/vie-de-leglise/ou-nous-trouver`
`src/app/vie-de-leglise/ou-nous-trouver/page.tsx` — 138 lignes

- **Ordre exact** : `PageHeader` → `Section` (informations pratiques) → `Section` (tinted, horaires `WeekRhythm`) → `VerseSection`
- **Sections** : 4
- **Composants partagés** : `PageHeader`, `Section`, `SectionHeading`, `Reveal`, `CrossMark`, `VerseSection`, `WeekRhythm`, `Button`
- **Photos** : 0
- **Verset** : rang 1 (en-tête, Matthieu 11:28) **et** rang 4 (`VerseSection`, Matthieu 18:20, tone `dark`)
- **Grilles de cartes** : 0 grille de cartes. Composition en 12 colonnes (7/5) : 3 blocs `infoBlock` à filet vert + 1 encadré « Première visite » contenant une `<ol>` de 4 étapes en dur
- **Mots éditoriaux** : ≈ 150 mots
- **Metadata** : `pageMetadata`, chemin `/vie-de-leglise/ou-nous-trouver`

### 04 — `/vie-de-leglise/evenements`
`src/app/vie-de-leglise/evenements/page.tsx` — 125 lignes

- **Ordre exact** : `PageHeader` → `Section` (à venir) → `Section` (tinted, archives) → `VerseSection`
- **Sections** : 4
- **Composants partagés** : `PageHeader`, `Section`, `SectionHeading`, `Reveal`, `VerseSection`, `EmptyState`, `FeaturedEvent`, `EventRow`
- **Photos** : 1 — `mainEvent.imageUrl` (`/media/ccjv-08.jpeg`) via `FeaturedEvent`
- **Verset** : rang 1 (en-tête, Psaume 150:6) **et** rang 4 (`VerseSection`, Matthieu 18:20, tone `dark`)
- **Grilles de cartes** : 0 grille. `FeaturedEvent` + `EventRow` ×4 en listes bordées ; `EmptyState` en repli si aucune donnée
- **Mots éditoriaux** : ≈ 80 mots
- **Metadata** : `pageMetadata`, chemin `/vie-de-leglise/evenements`

### 05 — `/vie-de-leglise/evenements/[slug]`
`src/app/vie-de-leglise/evenements/[slug]/page.tsx` — 218 lignes

- **Ordre exact** : `PageHeader` (avec `image={event.bannerImage}`) → `Section` (informations) → `Section` (tinted, galerie — conditionnelle) → `Section` (autres rendez-vous — conditionnelle) → `VerseSection`
- **Sections** : 5 (dont 2 conditionnelles)
- **Composants partagés** : `PageHeader`, `Section`, `SectionHeading`, `Reveal`, `VerseSection`, `Button`, `Badge`, `EventRow`
- **Photos** : variable selon l’événement, **2 à 5** — bannière d’en-tête (0 ou 1) + galerie (0, 2, 3 ou 4). Sources : `event.bannerImage` et `event.gallery` (`/media/ccjv-08`, `11`, `12`, `25`, `13`, `15`, `23`, `31`, `16`, `17`, `09`, `28`, `40`, `27`, `30` selon le slug)
- **Verset** : rang 5 (`VerseSection`, Matthieu 18:20, tone `dark`). Pas de verset dans l’en-tête.
- **Grilles de cartes** : galerie en grille `grid-cols-2 md:grid-cols-4` (3 à 4 images) ; 3 `EventRow` en liste pour les rendez-vous liés ; 0 carte
- **Mots éditoriaux** : ≈ 40 mots (page essentiellement alimentée par le mock)
- **Metadata** : `generateMetadata` (title = `event.title`) + `generateStaticParams` sur `events` ; `pageMetadata` avec chemin dynamique

### 06 — `/vie-de-leglise/faire-un-don`
`src/app/vie-de-leglise/faire-un-don/page.tsx` — 113 lignes

- **Ordre exact** : `PageHeader` → `Section` (destinations) → `Section` (tinted, comment donner) → `VerseSection`
- **Sections** : 4
- **Composants partagés** : `PageHeader`, `Section`, `SectionHeading`, `Reveal`, `CrossMark`, `VerseSection`, `Button`
- **Photos** : 0
- **Verset** : rang 1 (en-tête, **verset écrit en dur** : 2 Corinthiens 9:7, hors `data/mock/verses`) **et** rang 4 (`VerseSection`, Éphésiens 2:10, tone `dark`)
- **Grilles de cartes** : 1 grille de 4 « cartes » (`grid-cols-1 sm:grid-cols-2`) — `article` à filet vert, définies dans le tableau local `destinations`
- **Mots éditoriaux** : ≈ 200 mots
- **Metadata** : `pageMetadata`, chemin `/vie-de-leglise/faire-un-don`

### 07 — `/qui-sommes-nous`
`src/app/qui-sommes-nous/page.tsx` — 105 lignes

- **Ordre exact** : `PageHeader` → `Section` (présentation 6/6) → `Section` (tinted, `HubDoors`) → `VerseSection`
- **Sections** : 4
- **Composants partagés** : `PageHeader`, `Section`, `SectionHeading`, `Reveal`, `HubDoors`, `VerseSection`
- **Photos** : 1 — `images.identite` (`/media/ccjv-27.jpeg`)
- **Verset** : rang 1 (en-tête, Éphésiens 2:10) **et** rang 4 (`VerseSection`, Psaume 119:105, tone `dark`)
- **Grilles de cartes** : 1 grille de 3 « portes » via `HubDoors columns={3}` (`md:grid-cols-3`)
- **Mots éditoriaux** : ≈ 170 mots
- **Metadata** : `pageMetadata`, chemin `/qui-sommes-nous`

### 08 — `/qui-sommes-nous/ce-que-nous-croyons`
`src/app/qui-sommes-nous/ce-que-nous-croyons/page.tsx` — 138 lignes

- **Ordre exact** : `PageHeader` → `Section` (confession de foi) → `Section` (tinted, valeurs) → `VerseSection`
- **Sections** : 4
- **Composants partagés** : `PageHeader`, `Section`, `SectionHeading`, `Reveal`, `CrossMark`, `OpenBookMark`, `VerseSection`
- **Photos** : 0
- **Verset** : rang 1 (en-tête, **verset écrit en dur** : Psaume 119:105) **et** rang 4 (`VerseSection`, Psaume 119:105, tone `dark`)
- **Grilles de cartes** : 2 grilles — 6 articles de foi en `<ol>` `grid-cols-1 md:grid-cols-2`, puis 4 valeurs (`article` + `CrossMark`) en `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
- **Mots éditoriaux** : ≈ 270 mots (le plus dense en contenu doctrinal rédigé en page)
- **Metadata** : `pageMetadata`, chemin `/qui-sommes-nous/ce-que-nous-croyons`

### 09 — `/qui-sommes-nous/qui-nous-dirige`
`src/app/qui-sommes-nous/qui-nous-dirige/page.tsx` — 124 lignes

- **Ordre exact** : `PageHeader` → `Section` (le pasteur — conditionnelle) → `Section` (tinted, les autres responsables) → `VerseSection`
- **Sections** : 4
- **Composants partagés** : `PageHeader`, `Section`, `SectionHeading`, `Reveal`, `CrossMark`, `VerseSection`, `Button`
- **Photos** : 5 — `leadPastor.photo` (`/media/ccjv-05.jpeg`) + 4 responsables (`/media/ccjv-04.jpeg`, `/media/ccjv-19.jpeg`, `/media/ccjv-24.jpeg`, `/media/ccjv-38.jpeg`)
- **Verset** : rang 1 (en-tête, Matthieu 11:28) **et** rang 4 (`VerseSection`, **verset écrit en dur** : Matthieu 18:20, tone `dark`)
- **Grilles de cartes** : 1 grille de 4 cartes-responsables (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`), portraits en arche `rounded-t-full`
- **Mots éditoriaux** : ≈ 90 mots
- **Metadata** : `pageMetadata`, chemin `/qui-sommes-nous/qui-nous-dirige`

### 10 — `/qui-sommes-nous/d-ou-nous-venons`
`src/app/qui-sommes-nous/d-ou-nous-venons/page.tsx` — 108 lignes

- **Ordre exact** : `PageHeader` → `Section` (histoire, `Timeline`) → `BreathingPhoto` → `Section` (tinted, fondateur 5/7) → `VerseSection`
- **Sections** : 5
- **Composants partagés** : `PageHeader`, `Section`, `SectionHeading`, `Reveal`, `Timeline`, `BreathingPhoto`, `VerseSection`
- **Photos** : 2 — `images.louange` (`/media/ccjv-08.jpeg`) via `BreathingPhoto`, `images.portraitLarge` (`/media/ccjv-05.jpeg`)
- **Verset** : rang 1 (en-tête, Matthieu 18:20) **et** rang 5 (`VerseSection`, Psaume 150:6, tone `dark`)
- **Grilles de cartes** : 0 grille — `Timeline` en `<ol>` bordée (3 jalons)
- **Mots éditoriaux** : ≈ 190 mots (dont 3 descriptions de frise)
- **Metadata** : `pageMetadata`, chemin `/qui-sommes-nous/d-ou-nous-venons`

### 11 — `/organisation`
`src/app/organisation/page.tsx` — 116 lignes

- **Ordre exact** : `PageHeader` → `Section` (vue éditoriale 7/5) → `Section` (tinted, `HubDoors`) → `Section` (rythme `WeekRhythm`) → `VerseSection`
- **Sections** : 5
- **Composants partagés** : `PageHeader`, `Section`, `SectionHeading`, `Reveal`, `HubDoors`, `VerseSection`, `WeekRhythm`, `Button`
- **Photos** : 0
- **Verset** : rang 1 (en-tête, 1 Corinthiens 12:12) **et** rang 5 (`VerseSection`, Matthieu 11:28, tone `dark`)
- **Grilles de cartes** : 1 grille de 2 « portes » (`HubDoors` par défaut, `md:grid-cols-2`)
- **Mots éditoriaux** : ≈ 190 mots
- **Metadata** : `pageMetadata`, chemin `/organisation`

### 12 — `/organisation/responsables`
`src/app/organisation/responsables/page.tsx` — 99 lignes

- **Ordre exact** : `PageHeader` → `Section` (équipe) → `VerseSection`
- **Sections** : 3
- **Composants partagés** : `PageHeader`, `Section`, `SectionHeading`, `Reveal`, `CrossMark`, `VerseSection`, `Button`
- **Photos** : 5 — `leader.photo` pour les 5 entrées de `leaders` (`/media/ccjv-05.jpeg`, `04`, `19`, `24`, `38`)
- **Verset** : rang 1 (en-tête, 1 Corinthiens 12:12) **et** rang 3 (`VerseSection`, Éphésiens 2:10, tone `dark`)
- **Grilles de cartes** : 1 grille de 5 cartes-responsables (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`) + 1 bloc de conclusion à filet
- **Mots éditoriaux** : ≈ 80 mots
- **Metadata** : `pageMetadata`, chemin `/organisation/responsables`

### 13 — `/organisation/departements`
`src/app/organisation/departements/page.tsx` — 109 lignes

- **Ordre exact** : `PageHeader` → `Section` (liste des départements) → `VerseSection`
- **Sections** : 3
- **Composants partagés** : `PageHeader`, `Section`, `SectionHeading`, `Reveal`, `VerseSection`, `EmptyState`
- **Photos** : 3 — `department.bannerImage ?? departmentImages[id] ?? images.communaute` (`/media/ccjv-27.jpeg`, `/media/ccjv-13.jpeg`, `/media/ccjv-15.jpeg` pour les 3 départements actuels)
- **Verset** : rang 1 (en-tête, 1 Corinthiens 12:12) **et** rang 3 (`VerseSection`, 1 Corinthiens 12:12, tone `dark`)
- **Grilles de cartes** : 1 grille de 3 cartes-départements (`grid-cols-1 md:grid-cols-3`), portrait en arche + numéro + tagline ; `EmptyState` en repli
- **Mots éditoriaux** : ≈ 60 mots
- **Metadata** : `pageMetadata`, chemin `/organisation/departements`

### 14 — `/organisation/departements/[slug]`
`src/app/organisation/departements/[slug]/page.tsx` — 231 lignes

- **Ordre exact** : `PageHeader` → `Section` (vocation 6/6) → `Section` (tinted, piliers — conditionnelle) → `Section` (galerie — conditionnelle) → `Section` (tinted, autres départements — conditionnelle) → `VerseSection`
- **Sections** : 6 (dont 3 conditionnelles)
- **Composants partagés** : `PageHeader`, `Section`, `SectionHeading`, `Reveal`, `CrossMark`, `OpenBookMark`, `VerseSection`, `Button`
- **Photos** : 7 — bannière (`department.bannerImage ?? "/media/ccjv-15.jpeg"`, **chemin codé en dur ligne 121**) + galerie de 6 (`/media/ccjv-27`, `09`, `11`, `12`, `25`, `28`, `40`, `13`, `15`, `23`, `31`, `33`, `37`, `08`, `16`, `17`, `36` selon le slug)
- **Verset** : rang 1 (en-tête, 1 Corinthiens 12:12) **et** rang 6 (`VerseSection`, Éphésiens 2:10, tone `dark`)
- **Grilles de cartes** : 1 grille de 4 « piliers » (`grid-cols-1 sm:grid-cols-2`) à numérotation `01…` ; 1 grille galerie `grid-cols-2 md:grid-cols-3` (6 images) ; liste `<ul>` des autres départements
- **Mots éditoriaux** : ≈ 40 mots
- **Metadata** : `generateMetadata` (title = `department.name`) + `generateStaticParams` sur `departments` ; `pageMetadata` avec chemin dynamique

### 15 — `/publications`
`src/app/publications/page.tsx` — 120 lignes

- **Ordre exact** : `PageHeader` → `Section` (à la une — conditionnelle) → `Section` (tinted, `HubDoors`) → `Section` (réseaux) → `VerseSection`
- **Sections** : 5
- **Composants partagés** : `PageHeader`, `Section`, `SectionHeading`, `Reveal`, `HubDoors`, `VerseSection`, `TeachingFeature`
- **Photos** : 1 — `YouTubeThumb` distant pour le message à la une (aucune photo locale)
- **Verset** : rang 1 (en-tête, Psaume 107:2) **et** rang 5 (`VerseSection`, Psaume 150:6, tone `dark`)
- **Grilles de cartes** : 1 grille de 4 « portes » (`HubDoors` par défaut, `md:grid-cols-2`) + 1 liste de réseaux sociaux
- **Mots éditoriaux** : ≈ 110 mots
- **Metadata** : `pageMetadata`, chemin `/publications`

### 16 — `/publications/actualites`
`src/app/publications/actualites/page.tsx` — 64 lignes

- **Ordre exact** : `PageHeader` → `Section` (liste) → `VerseSection`
- **Sections** : 3
- **Composants partagés** : `PageHeader`, `Section`, `SectionHeading`, `Reveal`, `VerseSection`, `EmptyState`, `PublicationCard`
- **Photos** : 0 — les 2 actualités actuelles sont de type `TEXTE` : `PublicationCard` rend un pavé typographique `¶`, pas d’image
- **Verset** : rang 1 (en-tête, Psaume 107:2) **et** rang 3 (`VerseSection`, Psaume 107:2, tone `dark`)
- **Grilles de cartes** : 1 grille de 2 `PublicationCard` (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`) ; `EmptyState` en repli
- **Mots éditoriaux** : ≈ 50 mots
- **Metadata** : `pageMetadata`, chemin `/publications/actualites`

### 17 — `/publications/enseignements`
`src/app/publications/enseignements/page.tsx` — 82 lignes

- **Ordre exact** : `PageHeader` → `Section` (le plus récent) → `Section` (tinted, archives — conditionnelle) → `VerseSection`
- **Sections** : 4
- **Composants partagés** : `PageHeader`, `Section`, `SectionHeading`, `Reveal`, `VerseSection`, `EmptyState`, `TeachingFeature`, `TeachingCard`
- **Photos** : 2 — 2 `YouTubeThumb` distants (vedette + 1 archive)
- **Verset** : rang 1 (en-tête, Psaume 119:105) **et** rang 4 (`VerseSection`, Psaume 119:105, tone `dark`)
- **Grilles de cartes** : 1 grille de 1 `TeachingCard` (`grid-cols-1 sm:grid-cols-2`) ; `EmptyState` en repli
- **Mots éditoriaux** : ≈ 60 mots
- **Metadata** : `pageMetadata`, chemin `/publications/enseignements`

### 18 — `/publications/mediatheque`
`src/app/publications/mediatheque/page.tsx` — 98 lignes

- **Ordre exact** : `PageHeader` → `Section` (galerie) → `BreathingPhoto` → `VerseSection`
- **Sections** : 4
- **Composants partagés** : `PageHeader`, `Section`, `SectionHeading`, `Reveal`, `BreathingPhoto`, `VerseSection`, `EmptyState`
- **Photos** : 5 — 4 photos de publications `MEDIA` (`/media/ccjv-09.jpeg`, `/media/ccjv-15.jpeg`, `/media/ccjv-23.jpeg`, `/media/ccjv-30.jpeg`) + `images.communaute` (`/media/ccjv-30.jpeg`) via `BreathingPhoto`
- **Verset** : rang 1 (en-tête, Psaume 150:6) **et** rang 4 (`VerseSection`, Psaume 107:2, tone `dark`)
- **Grilles de cartes** : 1 grille de 4 `figure` (`grid-cols-2 md:grid-cols-3`) avec légende ; `EmptyState` en repli
- **Mots éditoriaux** : ≈ 70 mots
- **Metadata** : `pageMetadata`, chemin `/publications/mediatheque`

### 19 — `/publications/ressources`
`src/app/publications/ressources/page.tsx` — 96 lignes

- **Ordre exact** : `PageHeader` → `Section` (liste de documents) → `VerseSection`
- **Sections** : 3
- **Composants partagés** : `PageHeader`, `Section`, `SectionHeading`, `Reveal`, `OpenBookMark`, `VerseSection`, `EmptyState`
- **Photos** : 0
- **Verset** : rang 1 (en-tête, Psaume 119:105) **et** rang 3 (`VerseSection`, Psaume 119:105, tone `dark`)
- **Grilles de cartes** : 0 grille — liste éditoriale `<ul>` en 12 colonnes (date 3 / titre 6 / action 3), 2 ressources actuellement
- **Mots éditoriaux** : ≈ 70 mots
- **Metadata** : `pageMetadata`, chemin `/publications/ressources`

### 20 — `/publications/[slug]`
`src/app/publications/[slug]/page.tsx` — 212 lignes

- **Ordre exact** : `PageHeader` → `Section` (contenu) → `Section` (tinted, à découvrir aussi — conditionnelle) → `VerseSection`
- **Sections** : 4 (dont 1 conditionnelle)
- **Composants partagés** : `PageHeader`, `Section`, `SectionHeading`, `Reveal`, `VerseSection`, `Button`, `Badge`, `YouTubeThumb`, `PublicationCard`
- **Photos** : 1 pour le contenu (type `VIDEO` → `YouTubeThumb` distant ; type `PHOTO` → `<Image src={publication.contentUrl}>`), **+ 0 à 3** selon le type des cartes liées (`PublicationCard` rend une image uniquement pour les publications `PHOTO`)
- **Verset** : rang 4 (`VerseSection`, Psaume 107:2, tone `dark`). Pas de verset dans l’en-tête (prop `verse` non passée).
- **Grilles de cartes** : 1 grille de 3 `PublicationCard` (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`)
- **Mots éditoriaux** : ≈ 30 mots
- **Metadata** : `generateMetadata` (title = `publication.title`) + `generateStaticParams` sur `publications` ; `pageMetadata` avec chemin dynamique

### 21 — `/communaute`
`src/app/communaute/page.tsx` — 122 lignes

- **Ordre exact** : `PageHeader` → `Section` (ce qui fait une communauté) → `Section` (tinted, `CommunityFaces`) → `Section` (`HubDoors`) → `VerseSection`
- **Sections** : 5
- **Composants partagés** : `PageHeader`, `Section`, `SectionHeading`, `Reveal`, `HubDoors`, `CommunityFaces`, `VerseSection`
- **Photos** : 10 occurrences — `CommunityFaces` (5 visages × 2 branches : `/media/ccjv-01.jpeg`, `/media/ccjv-03.jpeg`, `/media/ccjv-06.jpeg`, `/media/ccjv-18.jpeg`, `/media/ccjv-34.jpeg`)
- **Verset** : rang 1 (en-tête, Matthieu 18:20) **et** rang 5 (`VerseSection`, Matthieu 11:28, tone `dark`)
- **Grilles de cartes** : 2 grilles — 3 articles (`grid-cols-1 sm:grid-cols-3`) définis en tableau inline dans le JSX, puis 4 « portes » `HubDoors` (`md:grid-cols-2`) ; `CommunityFaces` en scrollytelling
- **Mots éditoriaux** : ≈ 200 mots
- **Metadata** : `pageMetadata`, chemin `/communaute`

### 22 — `/communaute/parcours-nouveaux`
`src/app/communaute/parcours-nouveaux/page.tsx` — 154 lignes

- **Ordre exact** : `PageHeader` → `Section` (étapes) → `Section` (tinted, questions fréquentes) → `Section` (invitation) → `VerseSection`
- **Sections** : 5
- **Composants partagés** : `PageHeader`, `Section`, `SectionHeading`, `Reveal`, `CrossMark`, `VerseSection`, `Button`
- **Photos** : 0
- **Verset** : rang 1 (en-tête, Matthieu 11:28) **et** rang 5 (`VerseSection`, Matthieu 18:20, tone `dark`)
- **Grilles de cartes** : 1 grille de 4 questions/réponses (`dl`, `grid-cols-1 md:grid-cols-2`) ; les 5 étapes sont une `<ol>` en 12 colonnes (numéro 2 / titre 4 / texte 6)
- **Mots éditoriaux** : ≈ 290 mots (5 étapes + 4 questions/réponses)
- **Metadata** : `pageMetadata`, chemin `/communaute/parcours-nouveaux`

### 23 — `/communaute/priere`
`src/app/communaute/priere/page.tsx` — 100 lignes

- **Ordre exact** : `PageHeader` → `Section` (demande de prière, centrée) → `Section` (tinted, temps de prière) → `VerseSection`
- **Sections** : 4
- **Composants partagés** : `PageHeader`, `Section`, `Reveal`, `CrossMark`, `VerseSection`, `Button`
- **Photos** : 0
- **Verset** : rang 4 (`VerseSection`, Matthieu 11:28, tone `dark`). Pas de verset dans l’en-tête (prop `verse` non passée) — le `CrossMark size="lg"` tient lieu de motif.
- **Grilles de cartes** : 0 grille — liste `<ul>` des 4 créneaux de `weeklyRhythm` (12 colonnes : jour 3 / titre 6 / heure 3)
- **Mots éditoriaux** : ≈ 120 mots
- **Metadata** : `pageMetadata`, chemin `/communaute/priere`

### 24 — `/communaute/temoignages`
`src/app/communaute/temoignages/page.tsx` — 78 lignes

- **Ordre exact** : `PageHeader` → `Section` (carrousel) → `Section` (tinted, invitation à partager) → `VerseSection`
- **Sections** : 4
- **Composants partagés** : `PageHeader`, `Section`, `SectionHeading`, `Reveal`, `CrossMark`, `TestimonyCarousel`, `VerseSection`, `Button`
- **Photos** : 4 — `testimony.photo` (`/media/ccjv-01.jpeg`, `/media/ccjv-03.jpeg`, `/media/ccjv-18.jpeg`, `/media/ccjv-34.jpeg`)
- **Verset** : rang 1 (en-tête, Psaume 107:2) **et** rang 4 (`VerseSection`, Psaume 150:6, tone `dark`)
- **Grilles de cartes** : 1 carrousel de 4 cartes-témoignages (`TestimonyCarousel`, largeurs 86 % / 62 % / 48 % selon le breakpoint) — pas une grille ; + 1 bloc invitation avec `Button`
- **Mots éditoriaux** : ≈ 90 mots
- **Metadata** : `pageMetadata`, chemin `/communaute/temoignages`

### 25 — `/communaute/groupes-de-maison`
`src/app/communaute/groupes-de-maison/page.tsx` — 131 lignes

- **Ordre exact** : `PageHeader` → `Section` (qu’est-ce que c’est, 6/6) → `Section` (tinted, apports) → `BreathingPhoto` → `VerseSection`
- **Sections** : 5
- **Composants partagés** : `PageHeader`, `Section`, `SectionHeading`, `Reveal`, `CrossMark`, `BreathingPhoto`, `VerseSection`, `Button`
- **Photos** : 2 — `images.communaute` (`/media/ccjv-30.jpeg`) + `images.louange` (`/media/ccjv-08.jpeg`) via `BreathingPhoto`
- **Verset** : rang 1 (en-tête, Matthieu 18:20) **et** rang 5 (`VerseSection`, Matthieu 11:28, tone `dark`)
- **Grilles de cartes** : 1 grille de 3 « apports » (`grid-cols-1 sm:grid-cols-3`) à filet vert
- **Mots éditoriaux** : ≈ 210 mots
- **Metadata** : `pageMetadata`, chemin `/communaute/groupes-de-maison`

### 26 — `/mentions-legales`
`src/app/mentions-legales/page.tsx` — 54 lignes

- **Ordre exact** : `LegalPage` → (`PageHeader` → `Section` (4 sous-sections) → `VerseSection`)
- **Sections** : 3 (dont 4 sous-`<section>` numérotées `sec-0…sec-3` dans la `Section`)
- **Composants partagés** : `LegalPage` uniquement (qui compose `PageHeader`, `Section`, `VerseSection`)
- **Photos** : 0
- **Verset** : rang 3 (`VerseSection` interne à `LegalPage`, Psaume 119:105, tone `dark`) ; contexte « Marcher dans la vérité ». Pas de verset dans l’en-tête.
- **Grilles de cartes** : 0 — colonne unique `max-w-[62rem]`
- **Mots éditoriaux** : ≈ 130 mots
- **Metadata** : `pageMetadata`, chemin `/mentions-legales`

### 27 — `/confidentialite`
`src/app/confidentialite/page.tsx` — 56 lignes

- **Ordre exact** : `LegalPage` → (`PageHeader` → `Section` (5 sous-sections) → `VerseSection`)
- **Sections** : 3
- **Composants partagés** : `LegalPage` uniquement
- **Photos** : 0
- **Verset** : rang 3 (`VerseSection` interne, Psaume 119:105, tone `dark`)
- **Grilles de cartes** : 0
- **Mots éditoriaux** : ≈ 170 mots
- **Metadata** : `pageMetadata`, chemin `/confidentialite`

### 28 — `/conditions`
`src/app/conditions/page.tsx` — 49 lignes

- **Ordre exact** : `LegalPage` → (`PageHeader` → `Section` (4 sous-sections) → `VerseSection`)
- **Sections** : 3
- **Composants partagés** : `LegalPage` uniquement
- **Photos** : 0
- **Verset** : rang 3 (`VerseSection` interne, Psaume 119:105, tone `dark`)
- **Grilles de cartes** : 0
- **Mots éditoriaux** : ≈ 130 mots
- **Metadata** : `pageMetadata`, chemin `/conditions`

### 29 — `/accessibilite`
`src/app/accessibilite/page.tsx` — 50 lignes

- **Ordre exact** : `LegalPage` → (`PageHeader` → `Section` (4 sous-sections) → `VerseSection`)
- **Sections** : 3
- **Composants partagés** : `LegalPage` uniquement
- **Photos** : 0
- **Verset** : rang 3 (`VerseSection` interne, Psaume 119:105, tone `dark`)
- **Grilles de cartes** : 0
- **Mots éditoriaux** : ≈ 160 mots
- **Metadata** : `pageMetadata`, chemin `/accessibilite`

### 30 — `/recherche`
`src/app/recherche/page.tsx` — 103 lignes

- **Ordre exact** : `PageHeader` → `Section` (`SearchClient`) → `VerseSection`
- **Sections** : 3
- **Composants partagés** : `PageHeader`, `Section`, `VerseSection`, `SearchClient`
- **Photos** : 0
- **Verset** : rang 3 (`VerseSection`, Psaume 119:105, tone `dark`) ; pas de verset dans l’en-tête
- **Grilles de cartes** : 0 grille — liste de résultats `<ul>` en 12 colonnes, plafonnée à 30 entrées ; l’index est construit au rendu serveur depuis `primaryNav`, `events`, `departments`, `publications`
- **Mots éditoriaux** : ≈ 60 mots
- **Metadata** : `pageMetadata`, chemin `/recherche`

---

## A. Matrice de similarité

| Route | Archétype actuel observé | Sections | Photos | Verset (rang) | Grilles de cartes |
| --- | --- | --- | --- | --- | --- |
| `/` | Accueil éditorial long | 12 | 19 | 1 (Hero) + 2 | 1 × 2 `TeachingCard` |
| `/vie-de-leglise` | Hub de section (agenda + rythme + portes) | 5 | 1 | 1 + 5 | 1 × 2 portes `Link` |
| `/vie-de-leglise/ou-nous-trouver` | Page pratique (infos + rythme) | 4 | 0 | 1 + 4 | 0 (12 colonnes + `ol` 4 étapes) |
| `/vie-de-leglise/evenements` | Liste (à venir + archives) | 4 | 1 | 1 + 4 | 0 (lignes `EventRow`) |
| `/vie-de-leglise/evenements/[slug]` | Fiche détail (infos + galerie + liés) | 5 (2 cond.) | 2 à 5 | 5 | galerie 2/4 colonnes (3–4 img) |
| `/vie-de-leglise/faire-un-don` | Page thématique (destinations + explication) | 4 | 0 | 1 + 4 | 1 × 4 (`sm:grid-cols-2`) |
| `/qui-sommes-nous` | Hub à portes | 4 | 1 | 1 + 4 | 1 × 3 `HubDoors` |
| `/qui-sommes-nous/ce-que-nous-croyons` | Liste doctrinale (confession + valeurs) | 4 | 0 | 1 + 4 | 2 × (6 en `md:grid-cols-2`, 4 en `lg:grid-cols-4`) |
| `/qui-sommes-nous/qui-nous-dirige` | Trombinoscope (vedette + grille) | 4 | 5 | 1 + 4 | 1 × 4 (`lg:grid-cols-4`) |
| `/qui-sommes-nous/d-ou-nous-venons` | Récit chronologique (frise + photo) | 5 | 2 | 1 + 5 | 0 (`Timeline` 3 jalons) |
| `/organisation` | Hub à portes | 5 | 0 | 1 + 5 | 1 × 2 `HubDoors` |
| `/organisation/responsables` | Trombinoscope (grille 3) | 3 | 5 | 1 + 3 | 1 × 5 (`lg:grid-cols-3`) |
| `/organisation/departements` | Galerie de départements | 3 | 3 | 1 + 3 | 1 × 3 (`md:grid-cols-3`) |
| `/organisation/departements/[slug]` | Fiche détail (vocation + piliers + galerie + liés) | 6 (3 cond.) | 7 | 1 + 6 | 1 × 4 piliers + galerie 2/3 colonnes (6 img) |
| `/publications` | Hub à portes + à la une | 5 | 1 (YouTube) | 1 + 5 | 1 × 4 `HubDoors` |
| `/publications/actualites` | Liste de cartes | 3 | 0 | 1 + 3 | 1 × 2 (`lg:grid-cols-3`) |
| `/publications/enseignements` | Liste (vedette + archives) | 4 | 2 (YouTube) | 1 + 4 | 1 × 1 (`sm:grid-cols-2`) |
| `/publications/mediatheque` | Galerie photo + respiration | 4 | 5 | 1 + 4 | 1 × 4 (`md:grid-cols-3`) |
| `/publications/ressources` | Liste éditoriale | 3 | 0 | 1 + 3 | 0 (liste 12 colonnes) |
| `/publications/[slug]` | Fiche contenu (vidéo/photo/texte + liés) | 4 (1 cond.) | 1 (+0 à 3) | 4 | 1 × 3 (`lg:grid-cols-3`) |
| `/communaute` | Hub à portes + visages | 5 | 10 | 1 + 5 | 2 × (3 en `sm:grid-cols-3`, 4 `HubDoors`) |
| `/communaute/parcours-nouveaux` | Parcours + FAQ + invitation | 5 | 0 | 1 + 5 | 1 × 4 FAQ (`md:grid-cols-2`) |
| `/communaute/priere` | Page centrée (texte + horaires) | 4 | 0 | 4 | 0 (liste 12 colonnes) |
| `/communaute/temoignages` | Carrousel + invitation | 4 | 4 | 1 + 4 | 1 carrousel de 4 cartes |
| `/communaute/groupes-de-maison` | Page thématique (texte + 3 apports + photo) | 5 | 2 | 1 + 5 | 1 × 3 (`sm:grid-cols-3`) |
| `/mentions-legales` | Gabarit légal | 3 | 0 | 3 | 0 |
| `/confidentialite` | Gabarit légal | 3 | 0 | 3 | 0 |
| `/conditions` | Gabarit légal | 3 | 0 | 3 | 0 |
| `/accessibilite` | Gabarit légal | 3 | 0 | 3 | 0 |
| `/recherche` | Outil (formulaire + résultats) | 3 | 0 | 3 | 0 (liste 12 colonnes) |

### Squelettes identiques

**Squelette strictement identique — 9 pages** : `/publications/actualites`, `/organisation/responsables`, `/organisation/departements`, `/publications/ressources`, `/recherche`, `/mentions-legales`, `/confidentialite`, `/conditions`, `/accessibilite`. Toutes rendent exactement `PageHeader` → `Section` → `VerseSection`, avec le même enchaînement de fond (en-tête clair, section claire, verset sombre) ; les 4 pages légales sont en outre mot pour mot le même fichier délégué à `LegalPage`, seuls les tableaux `sections` et `updatedAt` diffèrent.

**Squelette identique en séquence de blocs — 10 pages** : `/vie-de-leglise/ou-nous-trouver`, `/vie-de-leglise/evenements`, `/vie-de-leglise/faire-un-don`, `/qui-sommes-nous`, `/qui-sommes-nous/ce-que-nous-croyons`, `/qui-sommes-nous/qui-nous-dirige`, `/publications/enseignements`, `/publications/[slug]`, `/communaute/priere`, `/communaute/temoignages` rendent toutes `PageHeader` → `Section` (clair) → `Section` (tinted) → `VerseSection` (dark), soit la même alternance clair / teinté / sombre avec les mêmes composants de bloc et seuls les contenus internes qui changent.

**Squelette identique en séquence de blocs — 6 pages** : `/vie-de-leglise`, `/organisation`, `/publications`, `/communaute`, `/communaute/parcours-nouveaux`, `/vie-de-leglise/evenements/[slug]` rendent `PageHeader` → `Section` (clair) → `Section` (tinted) → `Section` (clair) → `VerseSection` (dark) — cinq blocs, même alternance ; deux d’entre eux (`HubDoors` pour les hubs, galerie/liés pour la fiche événement) ne diffèrent que par le contenu de la 3ᵉ et de la 4ᵉ section.

**Squelettes uniques — 5 pages** : `/` (12 blocs, seul consommateur de `Hero`, `CommunityFaces`, `WeekRhythm`, `BreathingPhoto` hors variantes), `/organisation/departements/[slug]` (6 blocs), `/qui-sommes-nous/d-ou-nous-venons` (`BreathingPhoto` en bloc 3), `/publications/mediatheque` (`BreathingPhoto` en bloc 3 sur 4), `/communaute/groupes-de-maison` (`BreathingPhoto` en bloc 4).

En synthèse : **8 squelettes distincts** pour 30 routes, dont **3 squelettes dominants qui couvrent 25 routes sur 30** ; `VerseSection` clôt 29 pages sur 30 (`/` excepté, où il occupe le bloc 2 et non la clôture) et **aucune page n’utilise `PageHeader tone="dark"`**.

---

## B. Inventaire des composants partagés

### `src/components/shared/`

| Fichier | Lignes | Rôle | Contraint-il une structure ? | Props principales |
| --- | --- | --- | --- | --- |
| `PageHeader.tsx` | 175 | En-tête éditorial des pages internes : fil d’Ariane, `CrossMark`, overline, `h1`, description, verset optionnel, « baie » en arche (photo + croix `xl` + marqueur CCJV) | **oui** — impose le bloc d’en-tête, sa grille 12 colonnes (7/5), le `h1` unique et un padding haut compensant le header fixe (68 px) | `overline: string`, `title: string`, `description?: string`, `verse?: { text: string; reference: string }`, `tone?: "light" \| "dark"`, `image?: string`, `className?: string` |
| `Section.tsx` | 40 | Conteneur de section : fond selon `tone`, `py-24` (`max-md:py-16`), wrapper `.container` optionnel | **oui** — fixe le rythme vertical et la teinte de fond de chaque bloc | `id?: string`, `tone?: "light" \| "dark" \| "tinted" \| "green"`, `contained?: boolean`, `className?: string`, `"aria-labelledby"?: string`, `children: ReactNode` |
| `SectionHeading.tsx` | 47 | Bloc titre de section : overline, `h2` (avec `id`), description | **oui** — impose la hiérarchie `h2` et une largeur max de 64ch | `overline?: string`, `title: string`, `description?: string`, `dark?: boolean`, `align?: "left" \| "center"`, `id?: string`, `className?: string` |
| `Reveal.tsx` | 59 | Révélation au scroll (client, `IntersectionObserver`, respecte `prefers-reduced-motion`) | non — `<div>` neutre transparent pour la mise en page | `children: ReactNode`, `className?: string`, `delay?: number` |
| `Timeline.tsx` | 39 | Frise chronologique verticale : dates en très grand serif, filet et pastilles | **oui** — impose une `<ol>` bordée à gauche avec `h3` par jalon | `items: readonly TimelineItem[]` (`{ date; title; description }`), `className?: string` |
| `WeekRhythm.tsx` | 38 | Horaires hebdomadaires présentés comme rythme de vie (jour 3 / titre 6 / heure 3) | **oui** — impose une liste de lignes en 12 colonnes avec `h3` | `items: readonly RhythmItem[]` (`{ day; title; time; audience? }`) |
| `OpenBookMark.tsx` | 42 | Motif « Livre ouvert » (SVG décoratif, écho au logo CCJV) | non | `className?: string`, `size?: "sm" \| "md" \| "lg"` |
| `VerseSection.tsx` | 94 | Respiration spirituelle : verset encadré par deux filets, croix en filigrane, `aria-label` fixe, sans CTA | **oui** — impose une `<section>` plein cadre, centrée, sans bouton, et clôt 29 pages | `text: string`, `reference: string`, `tone?: "dark" \| "light" \| "cream" \| "green"`, `context?: string`, `className?: string` |
| `BreathingPhoto.tsx` | 77 | Photographie-témoignage plein écran (`min-h-[75svh]`), voile dégradé, libellé « Témoignage », phrase et référence | **oui** — impose une section plein écran avec `<Image fill sizes="100vw">` | `image: string`, `phrase: string`, `reference?: string`, `hasArch?: boolean`, `className?: string` |
| `Breadcrumbs.tsx` | 76 | Fil d’Ariane dérivé de `lib/nav` (client, `usePathname`) | **oui** — impose le `<nav aria-label="Fil d’Ariane">` en tête de `PageHeader` | `tone?: "light" \| "dark"`, `className?: string` |
| `YouTubeThumb.tsx` | 37 | Vignette YouTube distante (`i.ytimg.com`), repli automatique `maxresdefault` → `hqdefault`, aucune iframe | non (image) — mais impose un parent positionné (`fill`) | `videoId: string`, `alt?: string`, `sizes?: string`, `className?: string` |
| `TestimonyCarousel.tsx` | 157 | Carrousel de témoignages : `scroll-snap` natif, pastilles, flèches, aucun défilement automatique | **oui** — impose une `<ul>` de cartes larges (86 % / 62 % / 48 %) et un bloc de commandes | `testimonies: Testimony[]` (`{ id; photo; quote; name; role }`) |
| `CommunityFaces.tsx` | 132 | Scrollytelling des visages : légende sticky + portraits qui défilent (desktop) / liste verticale (mobile) | **oui** — impose deux compositions parallèles, toutes deux présentes dans le DOM | `faces: CommunityFace[]` (`{ id; photo; name; caption }`) |
| `HubDoors.tsx` | 52 | « Portes » d’un hub : liens à filet vert supérieur, libellé + accroche + « Découvrir → » | **oui** (partiel) — impose la grille 2 ou 3 colonnes et la structure du lien | `doors: readonly HubDoor[]` (`{ href; label; description }`), `columns?: 2 \| 3`, `className?: string` |
| `LegalPage.tsx` | 75 | Gabarit complet des pages transversales : `PageHeader` → `Section` → `VerseSection` | **oui** — squelette entier de page, avec `verse` absent de l’en-tête et verset final figé | `overline: string`, `title: string`, `description: string`, `sections: LegalSection[]` (`{ title; paragraphs: string[] }`), `updatedAt: string` |
| `CrossMark.tsx` | 93 | Motif chrétien central : croix SVG en 5 tailles, dont `watermark` | non | `className?: string`, `size?: "sm" \| "md" \| "lg" \| "xl" \| "watermark"`, `variant?: "solid" \| "fine" \| "ornate"` (**déclaré mais jamais lu**) |

### `src/components/ui/`

| Fichier | Lignes | Rôle | Contraint-il une structure ? | Props principales |
| --- | --- | --- | --- | --- |
| `Button.tsx` | 107 | Bouton ou lien (4 variantes, 2 tailles, état `loading`, `external` avec `rel` sécurisé) | non | `variant?: "primary" \| "outline" \| "ghost" \| "inverse"`, `size?: "md" \| "lg"`, `href?: string`, `type?: "button" \| "submit"`, `disabled?: boolean`, `loading?: boolean`, `external?: boolean`, `className?: string`, `children: ReactNode`, `onClick?: () => void`, `"aria-label"?: string` |
| `Badge.tsx` | 23 | Étiquette courte (3 variantes) | non | `variant?: "default" \| "dark" \| "outline"`, `className?: string`, `children: ReactNode` |
| `EmptyState.tsx` | 31 | État vide encadré (titre, description, action optionnelle) | **oui** (partiel) — impose un encadré bordé aligné à gauche | `title: string`, `description?: string`, `action?: ReactNode`, `className?: string` |

### `src/components/layout/`

| Fichier | Lignes | Rôle | Contraint-il une structure ? | Props principales |
| --- | --- | --- | --- | --- |
| `Header.tsx` | 116 | Header fixe contextuel : transparent en haut de l’accueil, solide ailleurs ; bascule du nom complet vers « CCJV » ; bouton menu | **oui** (global) — impose une hauteur de 68 px et un `padding-top` compensatoire dans `PageHeader` | aucune prop |
| `FullscreenMenu.tsx` | 185 | Menu plein écran à deux niveaux (hubs + sous-pages), verrouillage du scroll, piège de focus, Échap | **oui** (mais hors flux de page) | `open: boolean`, `onClose: () => void` |
| `IntroCurtain.tsx` | 33 | Rideau d’introduction (une fois par session) portant le verset de rassemblement et le sigle CCJV | **oui** (global, hors page) — n’a aucune prop | aucune prop |
| `Footer.tsx` | 114 | Pied de page : logo, navigation principale, coordonnées, réseaux, liens légaux | **oui** (global) | aucune prop |

### `src/features/**`

| Fichier | Lignes | Rôle | Contraint-il une structure ? | Props principales |
| --- | --- | --- | --- | --- |
| `pages/Hero.tsx` | 90 | Bloc 01 de l’accueil : deux colonnes (noir / photo plein écran), verset Psaume 122:1, 2 CTA, horaire du premier créneau | **oui** — remplace `PageHeader` sur `/` et impose `min-h-svh` | aucune prop (lit `images.portraitLarge`, `site`, `weeklyRhythm`) |
| `events/FeaturedEvent.tsx` | 81 | Événement principal en composition éditoriale : photo 7/12 + date, titre, description, `dl` heure/lieu/département | **oui** — impose une grille 12 et une `<Image fill>` | `event: Event`, `departmentName?: string`, `className?: string` |
| `events/EventRow.tsx` | 36 | Événement secondaire en ligne éditoriale (date 3 / titre 6 / heure-lieu 3) | **oui** — impose la grille 12 et le filet de séparation | `event: Event`, `departmentName?: string` |
| `events/EventCard.tsx` | 86 | Carte événement encadrée (date encadrée, `Badge`, `dl` auto-fit) | **oui** | `event: Event`, `departmentName?: string`, `className?: string` — **composant jamais importé** |
| `publications/TeachingFeature.tsx` | 105 | Enseignement mis en avant : vignette YouTube `aspect-video` 7/12, extrait encadré, CTA externe | **oui** — impose la grille 12 et le format 16/9 | `publication: Publication` |
| `publications/TeachingCard.tsx` | 76 | Enseignement secondaire : vignette 176 px + auteur, titre, extrait, lien YouTube | **oui** (partiel) — impose la vignette latérale `sm:w-44` | `publication: Publication` |
| `publications/PublicationCard.tsx` | 96 | Carte publication encadrée à trois rendus selon `type` : `PHOTO` (image), `VIDEO` (pavé noir + lecteur), `TEXTE` (pavé `¶`) | **oui** — impose le ratio 16/10 et le pied `Badge` + date | `publication: Publication`, `className?: string` |
| `departments/DepartmentCard.tsx` | 33 | Carte département encadrée (nom, description, responsable) | **oui** | `department: Department`, `className?: string` — **composant jamais importé** |
| `departments/DepartmentFeature.tsx` | 42 | Département en composition éditoriale : photo en arche, numéro, nom, description, responsable | **oui** | `department: Department`, `image: string`, `index: number` — **composant jamais importé** |
| `search/SearchClient.tsx` | 97 | Recherche interne : filtrage client sur index statique (`useMemo`), plafond 30 résultats | **oui** — impose un `input` contrôlé et une `<ul>` de résultats en 12 colonnes | `entries: SearchEntry[]` (`{ href; title; description; kind }`) |

**Composants déclarés mais jamais consommés** : `EventCard`, `DepartmentCard`, `DepartmentFeature`, ainsi que l’export `galleryImages` et les clés `images.hero`, `images.portraitA`, `images.portraitB` de `src/data/mock/images.ts`.

---

## C. Inventaire des ressources visuelles

### C.1 — `src/data/mock/images.ts` (contenu intégral, 41 lignes)

```ts
/**
 * Sélection curatoriale des photos réelles (copies propres dans /public/media).
 * Les originaux (noms WhatsApp) restent intacts dans /public/images.
 *
 * NB : les libellés d'usage ci-dessous sont des rôles de mise en page, PAS des
 * légendes affirmant le contenu exact de chaque photo — à valider visuellement
 * avant production (l'agent n'a pas de capacité d'analyse d'image).
 */

export const images = {
  /** Hero accueil — paysage large 2560×1439. */
  hero: "/media/ccjv-02.jpeg",
  /** Identité — paysage 1280×960. */
  identite: "/media/ccjv-27.jpeg",
  /** Louange / culte — paysage 1080×720. */
  louange: "/media/ccjv-08.jpeg",
  /** Vie communautaire — paysage 1008×756. */
  communaute: "/media/ccjv-30.jpeg",
  /** Ecodim / enfants — paysage 994×559 (série). */
  ecodim: "/media/ccjv-13.jpeg",
  /** Portrait grand format 1439×2560. */
  portraitLarge: "/media/ccjv-05.jpeg",
  /** Portrait 810×1080. */
  portraitA: "/media/ccjv-01.jpeg",
  /** Portrait 810×1080. */
  portraitB: "/media/ccjv-03.jpeg",
} as const;

/** Photographies utilisées par les publications de type PHOTO. */
export const galleryImages: string[] = [
  "/media/ccjv-09.jpeg",
  "/media/ccjv-11.jpeg",
  "/media/ccjv-12.jpeg",
  "/media/ccjv-15.jpeg",
  "/media/ccjv-23.jpeg",
  "/media/ccjv-25.jpeg",
  "/media/ccjv-28.jpeg",
  "/media/ccjv-32.jpeg",
  "/media/ccjv-37.jpeg",
  "/media/ccjv-40.jpeg",
];
```

**Identifiants d’images existants** — objet `images` : `hero`, `identite`, `louange`, `communaute`, `ecodim`, `portraitLarge`, `portraitA`, `portraitB` (8 clés, 7 fichiers distincts — `hero` et `portraitLarge` pointent chacune sur un fichier différent). Tableau `galleryImages` : 10 entrées.

*(Le bloc de code ci-dessus est une copie littérale de `src/data/mock/images.ts` ; les apostrophes droites y sont donc conservées telles quelles, conformément au fichier source.)*

**Consommation réelle** : `hero` n’est importée nulle part ; `portraitA` et `portraitB` ne sont importées nulle part ; `galleryImages` n’est importée nulle part. Les clés effectivement lues dans du JSX sont `identite`, `louange`, `communaute`, `ecodim`, `portraitLarge`.

### C.2 — `public/media/` : 41 fichiers confirmés

`ccjv-01.jpeg` … `ccjv-41.jpeg` — **41 fichiers**, numérotation continue de 01 à 41, sans trou ni doublon (vérifié par énumération du dossier ; aucun autre fichier n’y est présent).

### C.3 — Occurrences de `/media/ccjv-XX.jpeg` dans `src/`

**80 lignes** correspondantes, représentant **86 occurrences** (certaines lignes de tableau en contiennent plusieurs).

| Fichier | Ligne | Occurrence(s) | Contexte |
| --- | --- | --- | --- |
| `src/data/mock/testimonies.ts` | 20 | `/media/ccjv-01.jpeg` | `photo` — tem-001 |
| | 28 | `/media/ccjv-03.jpeg` | `photo` — tem-002 |
| | 36 | `/media/ccjv-18.jpeg` | `photo` — tem-003 |
| | 44 | `/media/ccjv-34.jpeg` | `photo` — tem-004 |
| `src/data/mock/images.ts` | 12 | `/media/ccjv-02.jpeg` | `images.hero` |
| | 14 | `/media/ccjv-27.jpeg` | `images.identite` |
| | 16 | `/media/ccjv-08.jpeg` | `images.louange` |
| | 18 | `/media/ccjv-30.jpeg` | `images.communaute` |
| | 20 | `/media/ccjv-13.jpeg` | `images.ecodim` |
| | 22 | `/media/ccjv-05.jpeg` | `images.portraitLarge` |
| | 24 | `/media/ccjv-01.jpeg` | `images.portraitA` |
| | 26 | `/media/ccjv-03.jpeg` | `images.portraitB` |
| | 31 | `/media/ccjv-09.jpeg` | `galleryImages[0]` |
| | 32 | `/media/ccjv-11.jpeg` | `galleryImages[1]` |
| | 33 | `/media/ccjv-12.jpeg` | `galleryImages[2]` |
| | 34 | `/media/ccjv-15.jpeg` | `galleryImages[3]` |
| | 35 | `/media/ccjv-23.jpeg` | `galleryImages[4]` |
| | 36 | `/media/ccjv-25.jpeg` | `galleryImages[5]` |
| | 37 | `/media/ccjv-28.jpeg` | `galleryImages[6]` |
| | 38 | `/media/ccjv-32.jpeg` | `galleryImages[7]` |
| | 39 | `/media/ccjv-37.jpeg` | `galleryImages[8]` |
| | 40 | `/media/ccjv-40.jpeg` | `galleryImages[9]` |
| `src/data/mock/publications.ts` | 28 | `/media/ccjv-09.jpeg` | `contentUrl` — pub-002 (MEDIA, PHOTO) |
| | 51 | `/media/ccjv-15.jpeg` | `contentUrl` — pub-004 (MEDIA, PHOTO) |
| | 77 | `/media/ccjv-23.jpeg` | `contentUrl` — pub-006 (MEDIA, PHOTO) |
| | 130 | `/media/ccjv-30.jpeg` | `contentUrl` — pub-010 (MEDIA, PHOTO) |
| `src/data/mock/leaders.ts` | 24 | `/media/ccjv-05.jpeg` | `photo` — lead-001 (pasteur) |
| | 32 | `/media/ccjv-04.jpeg` | `photo` — lead-002 |
| | 40 | `/media/ccjv-19.jpeg` | `photo` — lead-003 |
| | 48 | `/media/ccjv-24.jpeg` | `photo` — lead-004 |
| | 56 | `/media/ccjv-38.jpeg` | `photo` — lead-005 |
| `src/data/mock/community.ts` | 18 | `/media/ccjv-01.jpeg` | `photo` — face-01 |
| | 24 | `/media/ccjv-03.jpeg` | `photo` — face-02 |
| | 30 | `/media/ccjv-06.jpeg` | `photo` — face-03 |
| | 36 | `/media/ccjv-18.jpeg` | `photo` — face-04 |
| | 42 | `/media/ccjv-34.jpeg` | `photo` — face-05 |
| `src/data/mock/departments.ts` | 18 | `/media/ccjv-27.jpeg` | `bannerImage` — dep-adultes |
| | 26 | `/media/ccjv-09.jpeg` | `gallery` — dep-adultes |
| | 27 | `/media/ccjv-11.jpeg` | `gallery` — dep-adultes |
| | 28 | `/media/ccjv-12.jpeg` | `gallery` — dep-adultes |
| | 29 | `/media/ccjv-25.jpeg` | `gallery` — dep-adultes |
| | 30 | `/media/ccjv-28.jpeg` | `gallery` — dep-adultes |
| | 31 | `/media/ccjv-40.jpeg` | `gallery` — dep-adultes |
| | 43 | `/media/ccjv-13.jpeg` | `bannerImage` — dep-ecodim |
| | 51 | `/media/ccjv-13.jpeg` | `gallery` — dep-ecodim |
| | 52 | `/media/ccjv-15.jpeg` | `gallery` — dep-ecodim |
| | 53 | `/media/ccjv-23.jpeg` | `gallery` — dep-ecodim |
| | 54 | `/media/ccjv-31.jpeg` | `gallery` — dep-ecodim |
| | 55 | `/media/ccjv-33.jpeg` | `gallery` — dep-ecodim |
| | 56 | `/media/ccjv-37.jpeg` | `gallery` — dep-ecodim |
| | 68 | `/media/ccjv-15.jpeg` | `bannerImage` — dep-chorale |
| | 76 | `/media/ccjv-15.jpeg` | `gallery` — dep-chorale |
| | 77 | `/media/ccjv-08.jpeg` | `gallery` — dep-chorale |
| | 78 | `/media/ccjv-12.jpeg` | `gallery` — dep-chorale |
| | 79 | `/media/ccjv-16.jpeg` | `gallery` — dep-chorale |
| | 80 | `/media/ccjv-17.jpeg` | `gallery` — dep-chorale |
| | 81 | `/media/ccjv-36.jpeg` | `gallery` — dep-chorale |
| `src/app/organisation/departements/[slug]/page.tsx` | 121 | `/media/ccjv-15.jpeg` | **chemin codé en dur** dans le JSX : `src={department.bannerImage ?? "/media/ccjv-15.jpeg"}` — seule occurrence directe dans `src/app/` |
| `src/data/mock/events.ts` | 21 | `/media/ccjv-08.jpeg` | `imageUrl` — evt-001 |
| | 22 | `/media/ccjv-08.jpeg` | `bannerImage` — evt-001 |
| | 24 | `/media/ccjv-08.jpeg` | `gallery` — evt-001 |
| | 25 | `/media/ccjv-11.jpeg` | `gallery` — evt-001 |
| | 26 | `/media/ccjv-12.jpeg` | `gallery` — evt-001 |
| | 27 | `/media/ccjv-25.jpeg` | `gallery` — evt-001 |
| | 47 | `/media/ccjv-13.jpeg` | `imageUrl` — evt-002 |
| | 48 | `/media/ccjv-13.jpeg` | `bannerImage` — evt-002 |
| | 50 | `/media/ccjv-13.jpeg` | `gallery` — evt-002 |
| | 51 | `/media/ccjv-15.jpeg` | `gallery` — evt-002 |
| | 52 | `/media/ccjv-23.jpeg` | `gallery` — evt-002 |
| | 53 | `/media/ccjv-31.jpeg` | `gallery` — evt-002 |
| | 73 | `/media/ccjv-15.jpeg` | `imageUrl` — evt-003 |
| | 74 | `/media/ccjv-15.jpeg` | `bannerImage` — evt-003 |
| | 75 | `/media/ccjv-15.jpeg`, `/media/ccjv-16.jpeg`, `/media/ccjv-17.jpeg` | `gallery` — evt-003 (3 occurrences sur la ligne) |
| | 93 | `/media/ccjv-09.jpeg` | `imageUrl` — evt-004 |
| | 94 | `/media/ccjv-09.jpeg` | `bannerImage` — evt-004 |
| | 95 | `/media/ccjv-09.jpeg`, `/media/ccjv-28.jpeg`, `/media/ccjv-40.jpeg` | `gallery` — evt-004 (3 occurrences sur la ligne) |
| | 109 | `/media/ccjv-11.jpeg` | `imageUrl` — evt-005 |
| | 110 | `/media/ccjv-11.jpeg`, `/media/ccjv-12.jpeg` | `gallery` — evt-005 (2 occurrences sur la ligne) |
| | 123 | `/media/ccjv-27.jpeg` | `imageUrl` — evt-006 |
| | 124 | `/media/ccjv-27.jpeg`, `/media/ccjv-30.jpeg` | `gallery` — evt-006 (2 occurrences sur la ligne) |

### C.4 — Images utilisées et images orphelines

**30 fichiers sur 41 sont référencés au moins une fois dans `src/`** :
`ccjv-01`, `02`, `03`, `04`, `05`, `06`, `08`, `09`, `11`, `12`, `13`, `15`, `16`, `17`, `18`, `19`, `23`, `24`, `25`, `27`, `28`, `30`, `31`, `32`, `33`, `34`, `36`, `37`, `38`, `40`.

**11 fichiers ne sont référencés nulle part dans `src/`** (orphelins stricts — présents dans `public/media/`, aucun chemin dans le code) :
`ccjv-07`, `ccjv-10`, `ccjv-14`, `ccjv-20`, `ccjv-21`, `ccjv-22`, `ccjv-26`, `ccjv-29`, `ccjv-35`, `ccjv-39`, `ccjv-41`.

**2 fichiers sont référencés uniquement par du code mort** (donc jamais rendus) :
- `ccjv-02.jpeg` — uniquement via `images.hero` (`images.ts` ligne 12), clé jamais importée ;
- `ccjv-32.jpeg` — uniquement via `galleryImages[7]` (`images.ts` ligne 38), tableau jamais importé.

**Bilan** : 41 fichiers présents, 30 référencés, **28 réellement rendus**, **13 jamais affichés** (11 orphelins stricts + 2 référencés par du code mort).

Répartition exacte des **86 occurrences** par fichier image (la somme des 8 fichiers de données + 1 ligne JSX vaut bien 86) :

| Image | Occurrences | Image | Occurrences | Image | Occurrences |
| --- | --- | --- | --- | --- | --- |
| `ccjv-15.jpeg` | 10 | `ccjv-27.jpeg` | 4 | `ccjv-30.jpeg` | 3 |
| `ccjv-09.jpeg` | 6 | `ccjv-01.jpeg` | 3 | `ccjv-40.jpeg` | 3 |
| `ccjv-13.jpeg` | 6 | `ccjv-03.jpeg` | 3 | `ccjv-05.jpeg` | 2 |
| `ccjv-08.jpeg` | 5 | `ccjv-25.jpeg` | 3 | `ccjv-16.jpeg` | 2 |
| `ccjv-11.jpeg` | 5 | `ccjv-28.jpeg` | 3 | `ccjv-17.jpeg` | 2 |
| `ccjv-12.jpeg` | 5 | `ccjv-18.jpeg` | 2 | `ccjv-31.jpeg` | 2 |
| `ccjv-23.jpeg` | 4 | `ccjv-34.jpeg` | 2 | `ccjv-37.jpeg` | 2 |
| `ccjv-02.jpeg` | 1 | `ccjv-04.jpeg` | 1 | `ccjv-06.jpeg` | 1 |
| `ccjv-19.jpeg` | 1 | `ccjv-24.jpeg` | 1 | `ccjv-32.jpeg` | 1 |
| `ccjv-33.jpeg` | 1 | `ccjv-36.jpeg` | 1 | `ccjv-38.jpeg` | 1 |

Les images les plus sollicitées sont donc `ccjv-15.jpeg` (10 occurrences : galeries chorale, Ecodim et événement chorale, plus un chemin codé en dur), puis `ccjv-09.jpeg` et `ccjv-13.jpeg` (6 chacune) et `ccjv-08.jpeg`, `ccjv-11.jpeg`, `ccjv-12.jpeg` (5 chacune).
