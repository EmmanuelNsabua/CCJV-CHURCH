# Catalogue des composants — Frontend CCJV

**Objet :** documenter, pour chaque composant réutilisable, ce qui est structurellement immuable, ce qui doit être alimenté par le Back-Office, et les risques associés.
**Périmètre :** 55 composants sous `frontend/src/components/**` et `frontend/src/features/**`, plus `lib/nav.ts`, `types/index.ts`, `app/globals.css`.
**Compagnon de :** `audit_architecture_editoriale_frontend.md`, `frontend_content_matrix.md`, `backoffice_open_questions.md`.

---

## 0. Lecture préalable — les 8 conclusions transverses

Ces faits conditionnent la lecture de toutes les fiches.

| # | Constat | Mesure |
|---|---|---|
| **1** | **5 composants n'ont AUCUN consommateur** | `DirectoryPage`, `PeopleGrid`, `PortraitPanel`, `FeaturedEvent`, `ParallaxContainer` |
| **2** | **10 briques sur 16 n'ont qu'UN seul consommateur** | `HeroPhoto`(2), `HeroImmersive`, `HeroManifesto`, `HeroPractical`(2), `PhotoDuo`, `PullQuote`, `KeyFacts`(2), `StepsList`, `EventsSection`, `Hero`, `PageHeader`, `Badge`(2) |
| **3** | **Seuls 2 primitives sont réellement largement réutilisées** | `CrossMark` (**17** consommateurs), `Reveal` (**8** consommateurs / **107** sites de rendu) |
| **4** | **4 tables `ton → classe CSS` dupliquent les mêmes chaînes** | 24 clés pour **9 paires distinctes** |
| **5** | **`Band` et `Section` sont deux implémentations du même conteneur** | chaînes de ton **identiques octet pour octet** ; `Section` encore utilisé par l'accueil |
| **6** | **Jetons de design : 13 propriétés personnalisées seulement** | + 4 classes mortes (`.skip-link`, `.measure`, `.measure-narrow`, `--ease-ccjv-in`) ; **`ccjv-green-dark` utilisé 5× mais NON DÉFINI** |
| **7** | **Le `Footer` est le point chaud du contenu en dur** | **34 `href` littéraux** dans un seul fichier |
| **8** | **`Button` : la moitié de son API est morte** | les **7** consommateurs passent `href` ⇒ tout le chemin `<button>` (`loading`, `disabled`, `type`, `onClick`) n'est jamais exercé |

---

## 1. Archétypes — les shells de composition

**Statut : `STATIC_CODE` — ordre, tons et respirations sont figés par emplacement. Non administrables.**

Les 7 archétypes actifs reçoivent des emplacements nommés (`ReactNode`, tous optionnels sauf le héros et le contenu principal) et appliquent un `tone`/`space` **fixe par position**. C'est ce qui garantit qu'une page ne peut pas « mal » se composer.

### `Band` ★ LE COMPOSANT STRUCTURANT

| Champ | Valeur |
|---|---|
| **Nom** | `Band` — `components/composition/Band.tsx` (99 lignes) |
| **Responsabilité** | Porter le **ton** et la **respiration** verticale. Jamais l'ordre. |
| **Pages utilisées** | Indirectement **toutes** celles qui utilisent un archétype. **Aucune page ne l'importe directement** — seuls les **8 archétypes** le font. |
| **Variantes** | `tone` **6** (`light`, `cream`, `tinted`, `dark`, `green`, `bare`) · `space` **5** (`flush`, `tight`, `normal`, `airy`, `silence`) · `width` **3** (`container`, `wide`, `full`) · `rule` **3** (`top`, `bottom`, `both`) — **toutes purement stylistiques** |
| **Props actuelles** | `tone?`, `space?`, `width?`, `rule?`, `id?`, `className?`, `innerClassName?`, `children`, `aria-labelledby?`, `aria-label?` |
| **Props proposées** | **Aucun changement.** Interface complète et correcte. |
| **Données éditoriales** | **Aucune.** |
| **Données dynamiques** | **Aucune.** |
| **Structure immuable** | Intégralement : les 3 tables de classes, `onDeepTone` (dérivé du ton), `ruleColor`. |
| **Rôle du Back-Office** | **Aucun.** |
| **Risques** | Aucun identifié. C'est le composant le plus sain du système. |
| **Recommandation** | **GELER.** En faire le **référentiel unique de ton** (voir I2) et migrer `Section` vers lui. |

### Les 8 archétypes

| Nom | Fichier | Emplacements | `rhythm` défaut | Consommateurs | Note |
|---|---|---|---|---|---|
| `DetailPage` | archetypes/ | 6 | — | 1 (`publications/[slug]`) | — |
| `DirectoryPage` | archetypes/ | 9 | — | **0 — MORT** | Aucune route ne l'utilise (voir I1) |
| `EventPage` | archetypes/ | 5 | — | 1 (`evenements/[slug]`) | emplacement `program` **jamais fourni** |
| `InformationPage` | archetypes/ | 10 | `dense` | 1 (`/recherche`) | profil non adopté par `/ou-nous-trouver` |
| `ListingPage` | archetypes/ | 5 | `dense` | 2 (`actualites`, `ressources`) | non adopté par `/evenements` |
| `MediaPage` | archetypes/ | 5 | — | 2 (`enseignements`, `mediatheque`) | `listing` **non fourni** par `mediatheque` |
| `NarrativePage` | archetypes/ | 8 | `serene` | 1 (`temoignages`) | **seul lecteur de `wide`** ; non adopté par `/qui-sommes-nous` |
| `EditorialPage` | — | — | — | — | **DÉCLARÉ dans `docs/015` §3, LE FICHIER N'EXISTE PAS** |
| `rhythm.ts` | archetypes/ | — | — | 7 importeurs | exporte `PageRhythm` + `rhythmScale` |

**Fiches (forme condensée — les 7 se ressemblent structurellement) :**

- **Responsabilité :** fixer une **séquence propre à une intention** (indexer, raconter, présenter une fiche, donner envie…).
- **Props :** toutes `ReactNode` nommées par emplacement + `rhythm?`. `InformationPage` et `MediaPage` en ont 10.
- **Données éditoriales :** `listTitle`, `archivesTitle` (`ListingPage` uniquement).
- **Données dynamiques :** **aucune** — les archétypes ne reçoivent que du JSX déjà rendu.
- **Structure immuable :** l'ordre des emplacements, et le `tone`/`space`/`width`/`rule` de chacun.
- **Rôle du Back-Office :** fournir le **contenu des emplacements**, jamais leur existence ni leur ordre.
- **Risques :** ① les emplacements peuvent être **détournés** (`temoignages` met une section photo dans `chronology` ; `ressources` met un how-to dans `archives`) → l'intention du slot n'est pas garantie par le type ; ② `detail`/`ListingPage` rendent un `<h2>` de titre que les pages contournent parfois.
- **Recommandation :** **conserver tels quels**. Trancher I1 (adoption) avant d'exposer la prose. `DirectoryPage` : adopter ou **supprimer**.

---

## 2. Héros — 5 composants + `Hero` d'accueil

**Statut : `STATIC_CODE` pour la structure, `EDITORIAL_CONTENT` pour titre/accroche/image.**

| Nom | Props | Variantes | Consommateurs | Particularité |
|---|---|---|---|---|
| `HeroCompact` | 5 : `overline`, `title`, `intro?`, `aside?`, `tone` | `tone` 2 (`light`\|`tinted`) — stylistique | 2 | Aucune photographie. Pour les pages d'index. |
| `HeroImmersive` | 7 | `align` 2 — stylistique | 1 | Hauteur `88svh`, texte en bas. |
| `HeroManifesto` | 7 | `tone` 2 — stylistique | 1 | ⚠ **`Traduction Louis Segond 1910.` rendu INCONDITIONNELLEMENT** ⇒ duplique `scriptures.translation` |
| `HeroPhoto` | 7 | `height` 2 — stylistique | 2 | — |
| `HeroPractical` | 5 (+`PracticalFact` 4) | **AUCUNE variante** | 2 | ⚠ `aside` et `Fact.href` **jamais utilisés par aucun consommateur** ⇒ chemin de lien mort |
| **`Hero`** *(accueil)* | **0 — AUCUNE PROP** | **aucune** | 1 | ⚠ **Titre, paragraphe, 2 CTA et l'image sont en dur dans le composant.** Les 2 CTA pointent vers **le même** `href` (`/vie-de-leglise/ou-nous-trouver`). 13× le breakpoint `900px`. |

**Fiches :**

- **Responsabilité :** ouvrir une page en posant l'intention (invitation, situation, information pratique, manifeste).
- **Données éditoriales :** `overline`, `title`, `intro`, `aside`, `facts[]` — **tous fournis par la page appelante sous forme de chaînes littérales**.
- **Données dynamiques :** aucune (les héros ne reçoivent pas d'entité).
- **Structure immuable :** disposition, ratios, `clamp()`, hauteurs, position des CTA, `Breadcrumbs` intégré.
- **Rôle du Back-Office :** fournir `overline` / `title` / `intro` / `facts[]`.
- **Risques :** ① **`Hero` d'accueil ne peut pas être administré** : il faut **d'abord lui ajouter une interface de props** (M15) ; ② `HeroManifesto` affirme une traduction qu'il ne reçoit pas ; ③ titres longs → pas de troncature (les `clamp()` font tenir, la page s'allonge).
- **Recommandation :** **5 héros à conserver** — leur séparation est justifiée (structure différente, pas seulement visuelle). **Ajouter des props à `Hero`** avant d'exposer l'accueil. **Corriger** la traduction en dur.

---

## 3. Briques éditoriales — 16 composants

**Statut : `DYNAMIC_ENTITY` ou `EDITORIAL_CONTENT` selon la brique — ce sont elles qui reçoivent le contenu administrable.**

| Nom | Props | Variantes | Consomm. | Rôle du Back-Office |
|---|---|---|---|---|
| `Prose` | 6 : `width` 3 + 3 booléens (`lead`, `dropcap`, `columns`) | **stylistique** | 6 | Fournir le corps de texte |
| `FeatureImage` | 6 | **`variant` 6** — `full` **structurel** (saute le conteneur) ; les 4 autres stylistiques | 3 | Fournir image + légende |
| `PhotoDuo` | 4 | `variant` 2 — stylistique | 1 | Fournir 2 images (+ `captions` jamais transmis) |
| `PhotoGallery` | 4 | `variant` 3 — **structurel** | 4 | Fournir la liste de médias |
| `PullQuote` | 5 | `align` 3 — stylistique | 1 | Fournir la citation |
| `ScriptureBlock` | 12 | **`variant` 11 clés → 3 mises en page** (8 clés s'effondrent sur `center`) | 2 | Fournir le verset (`Scripture`) |
| `KeyFacts` | 4 (+`KeyFact` 3) | **`variant` 3 structurel** | 2 | Fournir des paires libellé/valeur |
| `StepsList` | 4 (+`Step` 2) | **`variant` 2 structurel** | 1 | Fournir les étapes |
| `PortraitPanel` | 9 | `side` 2 — stylistique | **0 — MORT** | — |
| `PeopleGrid` | 4 (+`Person` 6) | **`variant` 2 structurel** | **0 — MORT** | — |
| `CrossLinks` | 4 (+`CrossLink` 4) | `variant` 3 — **partiellement structurel** | 7 | Fournir les liens de maillage |
| `MediaFeature` | 9 | **`variant` 2 structurel** | 2 | Fournir la vidéo mise en avant |
| `ContentPending` | 4 | **`variant` 2 structurel** (`<div>` vs `<p>`) | 4 | **Rien — c'est un marqueur de manque** |

### Fiche détaillée — `ScriptureBlock` et `VerseSection` : le cas d'école des variantes

`docs/020` §2.2 postule un composant `BibleVerse` à trois variantes (image, éditoriale, minimale). **La réalité est plus riche et moins propre : deux composants distincts, tous deux affectés d'un gonflement de variantes.**

**`VerseSection`** (`components/shared/VerseSection.tsx`, 360 lignes, 6 consommateurs)

| Champ | Valeur |
|---|---|
| **Responsabilité** | Afficher un verset en pleine largeur, avec présence photographique optionnelle. |
| **Variantes** | `variant` **6 clés → 3 mises en page** : `left`/`split` → mosaïque 2–4 photos + texte à droite ; `center`/`centered` → texte centré sans image ; `both`/`flanked` → image gauche + image droite + texte centré. **3 alias purs.** |
| | `tone` **8** : `dark`, `light`, `offwhite`, `cream`, `green`, `white`, `tinted`, `transparent` — ⚠ **`light` et `offwhite` produisent la MÊME classe** (`bg-ccjv-offwhite text-ccjv-ink`) |
| | + modificateurs `compact` (respiration) et `onDark` |
| **Props actuelles** | `text`, `reference`, `variant?`, `tone?`, `backgroundColor?`, `onDark?`, `context?`, `photos?`, `leftPhoto?`, `rightPhoto?`, `compact?`, `className?` (12) |
| **Props proposées** | `variant: "image" \| "editorial" \| "flanked"` (**3 valeurs réelles, alias supprimés**) · `tone: BandTone` (**référentiel unifié**) · `scripture: { text, reference, translation?, context? }` (**objet `Scripture` plutôt que 3 props dispersées**) · `photos?: Media[]` · `compact?` — **retirer `backgroundColor` et l'heuristique `onDark`** |
| **Données éditoriales** | `text`, `reference`, `context` (surtitre) |
| **Données dynamiques** | **`Scripture`** (table `scriptures` : `key`, `text`, `reference`, `translation`, `context`) |
| **Structure immuable** | Les 3 dispositions, l'icône de citation, la hiérarchie `blockquote`/`figcaption`, le tiret cadratin, les ratios, les vitesses de parallaxe. |
| **Rôle du Back-Office** | Fournir `text`, `reference`, `translation`, `context` **de l'entité `Scripture`** — **jamais** la disposition. |
| **Risques** | ① **6 variantes pour 3 mises en page** ⇒ le Back-Office ne doit surtout pas exposer `variant` ; ② **repli silencieux sur 4 photos codées** (`displayPhotos`) et sur 2 chemins littéraux (`/media/ccjv-30.jpeg`, `/media/ccjv-09.jpeg`) ; ③ **détection du ton sombre par inspection de chaîne** : `backgroundColor.toLowerCase().includes("black" \| "121212" \| "#000" \| "#1")` — **fragile** ; ④ **6 `alt` français codés en dur** (« Vie d'église CCJV », « Rencontre fraternelle CCJV »…) qui **affirment un sujet** que `mock/images.ts` dit ne pas connaître ; ⑤ contraste inféré depuis la chaîne de l'appelant. |
| **Recommandation** | **Réduire à 3 variantes réelles**, unifier le ton sur `BandTone`, **supprimer `backgroundColor`/`onDark` au profit du ton**, **alimenter par l'entité `Scripture`** (`getScripture(key)` existe et n'est pas appelée), et **rendre les photos obligatoires ou absentes** — jamais de repli littéral. |

**`ScriptureBlock`** — même diagnostic : **11 clés de `variant` pour 3 dispositions** (8 s'effondrent sur `center`), `translation` **déclaré mais jamais lu** (la traduction est pourtant un champ de `scriptures`), `compact` câblé en dur. 2 consommateurs.

> **Conclusion pour le modèle éditorial.** Le Back-Office ne doit exposer **ni `variant`, ni `tone`, ni `compact`** pour ces composants. Il expose **le verset** (`text`, `reference`, `translation`, `context`) et, si nécessaire, **les médias associés**. Le choix de la disposition est une décision de composition de page, prise par le développeur dans l'archétype.

### `ContentPending` — fiche détaillée

| Champ | Valeur |
|---|---|
| **Nom** | `ContentPending` — `components/editorial/ContentPending.tsx` (59 lignes) |
| **Responsabilité** | Marquer **explicitement et visiblement** un contenu institutionnel non fourni, plutôt que d'inventer un texte plausible. Implémente `docs/015` §5. |
| **Pages utilisées** | `/communaute/temoignages` (×2), `/publications/[slug]`, `/publications/enseignements`, `PeopleGrid` (interne) |
| **Variantes** | `block` (encadré pointillé) · `inline` (bordure gauche) — **structurelles** |
| **Props actuelles** | `what`, `hint?`, `variant?`, `className?` |
| **Props proposées** | **Aucun changement d'interface.** Ajouter éventuellement `owner?` (à qui incombe la fourniture) pour l'écran Back-Office. |
| **Données éditoriales** | `what`, `hint` |
| **Données dynamiques** | aucune |
| **Structure immuable** | Le rendu `TODO — … à fournir`, la bordure pointillée, la typographie. |
| **Rôle du Back-Office** | **Aucun** dans le site public. **En revanche** : le Back-Office devrait **détecter** ces emplacements et les présenter comme des tâches à traiter (voir §9 du document principal). |
| **Risques** | **5 occurrences sont visibles en production**, dont littéralement `TODO — Témoignages réels à fournir`. **Un marqueur de manque ne doit pas atteindre la production.** |
| **Recommandation** | **PRÉSERVER le composant** — c'est une décision de rigueur documentaire remarquable, à laquelle `docs/015` §5 attache une règle explicite. **Mais** : ① ne jamais le rendre sans drapeau de développement, ou ② le remplacer en production par un repli éditorial administrable (§10.3 du document principal). |

### Zero-consumer — à trancher

| Composant | Props | Variantes | Verdict |
|---|---|---|---|
| `PortraitPanel` | 9 | `side` 2 (stylistique) | Jamais utilisé — orphelin |
| `PeopleGrid` | 4 (+`Person` 6) | `variant` 2 (structurel) | Jamais utilisé ; contient en interne un `ContentPending` avec des chaînes FR |
| `DirectoryPage` | 9 | `rhythm` | Archétype sans route |

**Recommandation :** soit **adopter** (voir I1 — `/organisation` est un `DirectoryPage` naturel), soit **supprimer**. Un composant non exercé est un composant non testé.

---

## 4. Composants partagés — 14 composants

| Nom | Kind | Props | Variantes | Consomm. | Notes |
|---|---|---|---|---|---|
| **`CrossMark`** | server | 3 | `size` **5** (structurel — `lg` ≡ `xl`) | **17** ★ | ⚠ **`variant` déclaré mais JAMAIS déstructuré** ⇒ prop morte. **Le composant le plus réutilisé du site.** |
| **`Reveal`** | **client** | 3 | **aucune** | **8** (107 sites) ★ | **Zéro contenu en dur.** Ajoute toujours un `<div>` enveloppant. |
| `VerseSection` | server | 12 | 6→3 + 8 tons | 6 | voir §3 |
| `Breadcrumbs` | **client** | 2 | `tone` 2 (stylistique) | 6 | `Accueil` en dur ; dérive de `getBreadcrumbs` (`nav.ts`) |
| `ParallaxImage` | **client** | 8 (+`ParallaxContainer` 3) | **aucune** | 7 | ⚠ **`ParallaxContainer` : 0 consommateur, ~65 lignes d'effet dupliquées mot pour mot** ; `fill`/`priority`/`sizes`/`imageClassName` jamais transmis |
| `LegalPage` | server | 5 (+`LegalSection` 2) | **aucune** | 4 | `Dernière mise à jour :` + `context="Marcher dans la vérité"` en dur |
| `YouTubeThumb` | **client** | 4 | **aucune** | 4 | modèle `https://i.ytimg.com/vi/…{maxresdefault\|hqdefault}.jpg` ; `alt`/`className` **inutilisés par les 4 consommateurs** ; 4 facteurs de zoom différents |
| `CommunityFaces` | **client** | 1 | **aucune** (2 arbres parallèles) | 1 | ✅ **ZÉRO contenu en dur** — exemplaire |
| `BreathingPhoto` | server | 5 | `hasArch` bool → **aucune** | 1 | `Témoignage` + long `aria-label` FR ; `hasArch` jamais activé |
| `SectionHeading` | server | 6 | `align` 2 + `dark` | 1 | ⚠ `overline`, `dark`, `align`, `className` **jamais utilisés** |
| `PageHeader` *(legacy)* | server | 7 | `tone` 2 | 1 | ⚠ **Branches `verse` et `image` MORTES + 12 ternaires `isDark` morts** (son unique consommateur ne les passe pas) ; `CCJV` en dur |
| `OpenBookMark` | server | 2 | `size` 3 (stylistique) | 1 | seul `md` utilisé |
| `WeekRhythm` | server | 1 (+`RhythmItem` 4) | **aucune** | 1 | ✅ **ZÉRO contenu en dur** — mais ⚠ `RhythmItem` (`time`) **incompatible avec `ScheduleEntry`** (`timeLabel`, `isConfirmed`) ⇒ **adaptateur manquant** ; clé React `day+title` (pas d'`id`) |

**Fiches notables :**

- **`CrossMark`** — Responsabilité : motif chrétien de marque. **Rôle du Back-Office : AUCUN.** Recommandation : **geler** et **supprimer la prop `variant` morte**.
- **`Reveal`** — Responsabilité : animation d'apparition au scroll. **Rôle du Back-Office : AUCUN.** Recommandation : **geler**.
- **`PageHeader`** — Responsabilité : ancienne « baie » d'en-tête. **Statut : legacy.** `docs/015` §2.2 dit qu'elle « devient un héros parmi d'autres… et n'est plus employé par défaut ». ✅ **Vérifié : 1 seul consommateur.** Recommandation : **supprimer** après migration de son unique consommateur (une page légale), car ses branches `verse`/`image` sont mortes.

---

## 5. Primitives UI — 3 composants

| Nom | Props | Variantes | Consomm. | Notes |
|---|---|---|---|---|
| **`Button`** | **11** | `variant` **4** + `size` **2** (stylistique) | 7 | ⚠ **Les 7 consommateurs passent `href`** ⇒ **tout le chemin `<button>` est mort** : `loading`, `disabled`, `type`, `onClick`. `ghost` inutilisé. **Le style est recopié à la main hors du composant** (Footer, PrayerRequestForm, 1 page) |
| `EmptyState` | 4 | **aucune** | 6 | ⚠ `action` et `className` **jamais transmis** ⇒ le CTA d'un état vide n'est jamais offert |
| `Badge` | 3 | `variant` 3 (stylistique) | 2 | `dark` inutilisé ; **seul élément `rounded-full` du système** (le reste est à angles vifs) |

**Fiches :**

- **`Button`** — Responsabilité : action ou navigation. **Données éditoriales :** `children` (libellé) et `href` (cible) — **tous deux fournis en littéral par les pages**, donc à administrer par `page_key`. **Données dynamiques :** aucune. **Structure immuable :** les 4 variantes visuelles, les 2 tailles, les transitions. **Rôle du Back-Office :** fournir **le libellé et la cible** d'un CTA éditorial — **jamais** sa variante ni sa taille. **Risques :** ① API à moitié morte (les primitives interactives non exercées dérivent) ; ② 12 CTA pointent vers le **faux numéro WhatsApp** (`+243 123 456 789`) ; ③ styles recopiés hors composant ⇒ divergence garantie. **Recommandation :** conserver l'interface, **router tous les CTA par ce composant**, et inverser la dépendance (les pages ne doivent plus écrire de `<a>` stylé à la main).
- **`EmptyState`** — Responsabilité : afficher un état vide métier. **Rôle du Back-Office :** fournir `title` et `description` — **aujourd'hui en littéral dans les pages**, donc **à administrer** par `page_key` ou par section. **Risques :** aucune règle écrite sur **quand** l'utiliser (3 stratégies concurrentes, voir I4). **Recommandation :** documenter la politique dans le design system et **exposer `action`** (un état vide doit pouvoir offrir un CTA).

---

## 6. Composants de `features/` — 8 composants

| Nom | Kind | Props | Variantes | Consomm. | Notes |
|---|---|---|---|---|---|
| **`EventsSection`** | server | **10** | `tone` **6** (⚠ `light`≡`offwhite`, `dark` bascule 8 ternaires) | **1** | voir fiche ci-dessous |
| `Hero` | server | **0** | **aucune** | 1 | voir §2 |
| `EventRow` | server | 2 | **aucune** | 1 | `"Lubumbashi"` en repli, ` · ` en séparateur |
| `FeaturedEvent` | server | 3 | **aucune** | **0 — MORT** | `Prochain rendez-vous`, `Heure`/`Lieu`/`Département` en dur |
| `TeachingCard` | server | 1 | **aucune** | 1 | `Regarder sur YouTube →` + `aria-label` FR |
| `TeachingFeature` | server | 1 | **aucune** | 1 | `Regarder sur YouTube`, `Regarder la vidéo sur YouTube` |
| `SearchClient` | **client** | 1 (+`SearchEntry` 4) | **aucune** | 1 | 4 chaînes FR, **le littéral `2` trois fois**, `.slice(0, 30)`, `id` d'input en dur |

### Fiche détaillée — `EventsSection` ★ LE COMPOSANT HYBRIDE DE RÉFÉRENCE

C'est **l'archétype du composant `HYBRID`** décrit par la consigne §7 : structure codée + contenu éditorial + données dynamiques.

| Champ | Valeur |
|---|---|
| **Nom** | `EventsSection` — `features/events/EventsSection.tsx` (245 lignes) |
| **Responsabilité** | Présenter les prochains événements en 2 colonnes : en-tête éditorial + CTA à gauche, liste datée à droite. |
| **Pages utilisées** | **1** — l'accueil (`/`), en section 05 |
| **Variantes** | `tone` **6** : `offwhite`, `light`, `cream`, `white`, `tinted`, `dark` — **stylistiques**, sauf `dark` qui **bascule 8 ternaires de contraste**. ⚠ **Ce jeu de tons est DIFFÉRENT de `BandTone` (6) et de `VerseTone` (8)**, sans relation d'inclusion ⇒ **3ᵉ vocabulaire** |
| **Props actuelles** | `title?`, `description?`, `ctaLabel?`, `ctaHref?`, `events?`, `departmentNames?`, `maxEvents?`, `tone?`, `backgroundColor?`, `className?` (**10**) |
| **Props proposées** | Séparer explicitement les trois niveaux : `editorial: { title, description, cta: { label, href }, emptyFallback? }` · `events: Event[]` (obligatoire) · `departmentNames: Record<string,string>` (obligatoire) · `tone?: BandTone` · `maxEvents?: number` — **retirer `backgroundColor`** et **retirer le repli mock** |
| **Données éditoriales** | `title`, `description`, `ctaLabel`, `ctaHref` — **tous dotés d'un défaut FR en dur** : `"Ce qui se passe bientôt"`, `"Rejoignez-nous et grandissons ensemble ! …"`, `"VOIR TOUT L'AGENDA"`, `"/vie-de-leglise/evenements"` |
| **Données dynamiques** | `events: Event[]` (prop) + `departmentNames: Record<string,string>` (résolution `departmentId` → nom) |
| **Structure immuable** | Disposition 2 colonnes 5/7, colonne gauche `sticky`, bloc date empilé (mois/jour), filets `divide-y`, flèche animée, `getEventDateParts` (locale `fr-FR`), ratios et `clamp()`. |
| **Rôle du Back-Office** | Fournir ① le **titre**, l'**accroche**, le **libellé et la cible du CTA** (éditorial, `page_key ACCUEIL`) ; ② les **événements** (entité, scope départemental) ; ③ le **comportement de repli** (à décider). **Jamais** le ton, la disposition ou le nombre de colonnes. |
| **Risques** | ① ⚠⚠ **`events = upcomingEvents` : le paramètre par défaut est de la DONNÉE MOCK.** Si l'appelant oublie la prop, **des événements de démonstration s'affichent en production**, silencieusement. ② ⚠⚠ **AUCUN état vide** : avec `events = []`, la colonne gauche s'affiche (titre + CTA) et **la colonne droite est vide** ⇒ cadre orphelin menant à une page vide. ③ ⚠ `id` ARIA **codé en dur** (`aria-labelledby="events-section-title"`) ⇒ deux instances sur une page produiraient des `id` dupliqués (usage unique aujourd'hui, donc latent). ④ ⚠ `backgroundColor` **n'alimente pas `isDark`** ⇒ fond sombre passé par `backgroundColor` avec ternaires clairs = **contraste cassé**. ⑤ ⚠ `light` et `offwhite` donnent la même classe. ⑥ Repli de département via `getDepartmentName` (**mock**) alors que l'API fournit `departmentNames`. ⑦ Libellés de repli `"ÉVÉNEMENT"`, `"EVT"`, `"•"` en dur. ⑧ `slice(0, maxEvents)` avec `maxEvents = 3` : les événements au-delà du 3ᵉ **ne sont jamais atteignables** depuis l'accueil. |
| **Recommandation** | **Supprimer le défaut mock** (rendre `events` obligatoire) · **ajouter un état vide administrable** · **générer l'`id` ARIA** · **retirer `backgroundColor`** · **unifier `tone` sur `BandTone`** · **corriger la bascule `light`/`offwhite`**. Le composant est **structurellement bon** ; ce sont ses **valeurs par défaut** qui sont dangereuses. |

---

## 7. Composants de `layout/` — 4 composants

| Nom | Kind | Props | Variantes | Consomm. | Notes |
|---|---|---|---|---|---|
| **`Footer`** | server | **0** | **aucune** | 1 | ⚠⚠ **POINT CHAUD DU CONTENU EN DUR : 34 `href` littéraux**, 3 URL sociales codées + 3 SVG de marque en ligne, `/logo_2.png`. ⚠ `Médiathèque` → `/publications/ressources` ; `Se connecter` → `/qui-sommes-nous` ; **les `href` contredisent `legalNav`** |
| **`FullscreenMenu`** | **client** | 2 | **aucune** (2 arbres parallèles desktop/mobile) | 1 | ⚠ **25 244 octets** ; `pillarVisuals` : 6 entrées indexées par **libellé** avec **5 chemins d'image littéraux** et un `tag` **jamais rendu** ; 10 chaînes FR ; ⚠ **`href={item.href ?? "/"}` ×2 viole le contrat de `nav.ts`** (un pôle sans `href` **ne doit jamais** être un lien) |
| **`Header`** | **client** | **0** | **aucune** | 1 | ⚠ `darkHeroRoutes` (**9 routes**) **duplique `nav.ts`** ; le thème du héros est détecté par **comparaison de chaînes de classes DOM** ; `/logo_2.png` |
| **`IntroCurtain`** | server | **0** | **aucune** | 1 | seul `«…»` ; durée ~1,6 s (`docs/013`) |

**Fiches :**

- **`Footer`** — Responsabilité : plan du site groupé + contacts + légaux + mentions. **Données éditoriales :** liens de navigation (**devraient** venir de `nav.ts`), `site.name`, `site.address`, réseaux sociaux (**devraient** venir de `social_links`), liens légaux (**devraient** venir de `legalNav`), logo. **Données dynamiques : aucune.** **Structure immuable :** la grille, le groupement par pôle, la typographie. **Rôle du Back-Office :** fournir **adresse, contacts, réseaux sociaux** — pas la structure. **Risques :** ① **34 `href` en dur** ⇒ toute évolution de l'arborescence casse le pied de page sans erreur de compilation ; ② liens inexistants (`/contact`) ; ③ 3 SVG de marque en ligne ⇒ **un 4ᵉ réseau social exige un déploiement**. **Recommandation :** **dériver la navigation de `nav.ts`** et les réseaux de `getSettings().socialLinks` ; externaliser les icônes.
- **`FullscreenMenu`** — **Rôle du Back-Office :** fournir libellés et descriptions de navigation **si** I3 est tranché en faveur de l'administration. **Risques :** ⚠ **le `?? "/"` viole une décision produit explicite** de `docs/015` §4.5 (« *un `NavItem` sans `href` est un libellé de regroupement — jamais un lien* ») ⇒ **3 pôles sont aujourd'hui cliquables vers l'accueil**. **Recommandation :** corriger l'anomalie ; dériver de `nav.ts`.
- **`Header`** — **Risques :** la détection du thème par **inspection de classes CSS** est un couplage fragile ; `darkHeroRoutes` **duplique** `nav.ts` ⇒ deux sources. **Recommandation :** porter le thème sombre par une donnée de route, non par une liste dupliquée.

---

## 8. Formulaires — 1 composant

### `PrayerRequestForm` ⚠ DÉFAUT CRITIQUE

| Champ | Valeur |
|---|---|
| **Nom** | `PrayerRequestForm` — `components/forms/PrayerRequestForm.tsx` (9 Ko) |
| **Kind** | **client** (`"use client"`) |
| **Responsabilité** | Recueillir une demande de prière (nom, contact, intention, confidentialité). |
| **Pages utilisées** | 1 — `/communaute/priere-et-intercession` |
| **Variantes** | **aucune** |
| **Props actuelles** | **0 — AUCUNE PROP** |
| **Props proposées** | `onSubmit` (injection de la dépendance réseau) · `entity?: "prayer" \| "contact"` (mutualiser avec un futur formulaire de contact) |
| **Données éditoriales** | **Le plus gros bloc de texte FR parmi les composants** : libellés, placeholders, messages d'erreur, écran de succès, + **un verset non attribué codé en dur** |
| **Données dynamiques** | **`PrayerRequest`** — table `prayer_requests` (`confidentiality` : `private`\|`community` ; `status` : `NEW`\|`PRAYED`), module API, repository et schéma Zod **tous existants** |
| **Structure immuable** | Les champs, la validation locale, la mise en page, les états |
| **Rôle du Back-Office** | **Aucun sur le formulaire lui-même.** En revanche : un **écran de traitement des demandes** (le module `prayer-requests` existe côté backend) relève du Back-Office |
| **Risques** | ① ⚠⚠ **LE FORMULAIRE EST SIMULÉ.** `handleSubmit` exécute `setTimeout(…, 600)` puis `setSubmitted(true)` : **aucun appel réseau**, alors que l'écran de succès affirme **« Votre demande a bien été reçue. »** ② ⚠ **Le state `contact` est écrit et JAMAIS LU** ; `confidentiality` est collecté et inutilisé. ③ ⚠ **Contredit `/confidentialite`**, qui promet un traitement confidentiel. ④ ⚠ **`hover:bg-ccjv-green-dark` ⇒ jeton NON DÉFINI** (utilisé 5× dans le projet). ⑤ ⚠ `setTimeout` **non nettoyé** ⇒ `setState` après démontage. ⑥ Verset en dur non attribué. |
| **Recommandation** | **BLOQUANT-5.** Trancher : brancher sur `POST /prayer-requests` (le chemin technique est **complet** — seul le frontend manque) ou retirer au profit de WhatsApp. **Dans les deux cas : retirer l'affirmation de succès tant qu'aucun envoi n'a lieu**, et définir le jeton `ccjv-green-dark` ou corriger la classe. |

---

## 9. Fichiers non-composants

| Fichier | Contenu | Constat |
|---|---|---|
| `lib/nav.ts` | 6 585 o — `mainNav`, `primaryNav`, `allDestinations`, `legalNav`, `getBreadcrumbs` | ⚠ **`allDestinations` ET `legalNav` ont 0 importeur** ; `primaryNav` est un clone identique de `mainNav` ; `ready` figé à `true` partout ⇒ **le mécanisme de disponibilité progressive est mort** |
| `types/index.ts` | 2 469 o — 7 importeurs | ⚠ **`Publication.coverImage` est LU par 3 pages mais ABSENT de l'interface** ⇒ **erreur de type masquée** |
| `app/globals.css` | 8 079 o | **13 propriétés personnalisées seulement** ; 4 classes mortes : `.skip-link`, `.measure`, `.measure-narrow`, `--ease-ccjv-in` ; ⚠ **`ccjv-green-dark` utilisé 5× mais NON DÉFINI** |

---

## 10. Duplications identifiées — 16 groupes

Classées par **justification structurelle**. Rappel du principe appliqué : **ne factoriser que sur cohérence structurelle et comportementale démontrée, jamais sur ressemblance visuelle.**

| # | Groupe | Nature | Justification | Risque d'excès | Reco |
|---|---|---|---|---|---|
| **D1** | `Band` ↔ `Section` | **2 implémentations du même conteneur**, chaînes de ton **identiques octet pour octet** | Structurelle et démontrée | Faible | **Fusionner** (migrer `Section` → `Band`) |
| **D2** | 4 tables `ton → classe` (24 clés / **9 paires distinctes**) | Duplication de données | Structurelle | Faible | **Unifier sur `BandTone`** |
| **D3** | `VerseSection` ↔ `ScriptureBlock` | Deux rendus de verset, **tous deux avec variantes gonflées** (6→3 et 11→3) | Structurelle | Moyen | **Unifier le vocabulaire et l'alimentation** (`Scripture`) |
| **D4** | `ParallaxImage` ↔ `ParallaxContainer` | **~65 lignes d'effet dupliquées mot pour mot** ; `ParallaxContainer` a **0 consommateur** | Structurelle, littérale | Nul | **Supprimer `ParallaxContainer`** |
| **D5** | `Reveal` — 107 sites de rendu sur 8 consommateurs | Usage intensif, pas duplication | — | — | **Geler** |
| **D6** | Blocs-bible de `/organisation` (sections 02 et 06) | **2 `<section>` JSX identiques à ~90 %** | Structurelle, littérale | Nul | Utiliser `ScriptureBlock` variante `concluding` (existe, inutilisée) |
| **D7** | 4 piliers de croyance de `/qui-sommes-nous` | **4 blocs JSX dupliqués à la main** (pas de `.map()`) | Structurelle, littérale | Faible | Utiliser `KeyFacts` variante `tiles` (existe) |
| **D8** | 3 étapes de `/organisation` (section 07) | **3 blocs JSX dupliqués à la main** | Structurelle, littérale | Faible | Utiliser `StepsList` variante `horizontal` (existe) |
| **D9** | 5 grilles photo sans légende (`PhotoGallery`, mosaïque `VerseSection`, diptyque mobile, `DepartmentModal`, `/organisation`) | Structure commune ; ratios/décalages/parallaxe **réels et différents** | **Visuelle seulement** | **Élevé** — perte de composition | **NE PAS FACTORISER** (envisager une grille paramétrable, plus tard) |
| **D10** | `HeroPhoto` / `HeroImmersive` / `HeroManifesto` / `HeroPractical` | Ressemblance **visuelle** ; structures **différentes** (image, `88svh`, panneau pratique, citation grand corps) | **Visuelle seulement** | **Élevé** — `docs/015` §2.2 les a séparés à dessein | **NE PAS FACTORISER** |
| **D11** | `EventsSection` : libellés de date dupliqués avec d'autres pages | — | ? | Moyen | Utiliser les helpers partagés |
| **D12** | Catégorie → libellé : ternaire inline (`/actualites`) ↔ `Record` (`[slug]`) | Structurelle | Structurelle | Faible | **Factoriser** en une table partagée |
| **D13** | `Button` recopié à la main (Footer, PrayerRequestForm, 1 page) | Structurelle | Structurelle | Faible | **Router tous les CTA par `Button`** |
| **D14** | Versets : 4 mécanismes concurrents | **Conceptuel** — 8 versets en dur dans 7 pages | Structurelle | Faible | **Unifier sur `Scripture`** |
| **D15** | Rythme hebdomadaire : 5 formulations | **Conceptuel** | Structurelle | Faible | **Unifier sur `ScheduleEntry`** |
| **D16** | `Header.darkHeroRoutes` ↔ `nav.ts` | **Liste de routes dupliquée** | Structurelle | Faible | Porter le thème par une donnée de route |

---

## 11. Synthèse — où le Back-Office doit-il intervenir ?

| Couche | Composants | Intervention du Back-Office |
|---|---|---|
| **Archétypes** | 8 | **AUCUNE** — fournir le contenu des emplacements, jamais leur ordre |
| **`Band` + jetons** | 1 + `globals.css` | **AUCUNE** — à geler |
| **Héros** | 5 + `Hero` | `overline`, `title`, `intro`, `facts[]`, image /**
| **Briques éditoriales** | 16 | **`text`, `reference`, `context`, `translation`, images, légendes, étapes** — **jamais `variant`, `tone`, `align`, `width`, `compact`** |
| **Partagés** | 14 | `CrossMark`/`Reveal`/`ParallaxImage`/`Breadcrumbs` : **AUCUNE** · `WeekRhythm`/`CommunityFaces` : **données** · `LegalPage` : **prose** |
| **UI** | 3 | `Button` : **libellé + cible d'un CTA éditorial** · `EmptyState` : **titre + description + action** · `Badge` : **libellé** |
| **`features/`** | 8 | `EventsSection` : **titre, accroche, CTA, repli** + **événements** |

**Règle générale, applicable à tous :** le Back-Office fournit des **valeurs** ; il ne fournit **jamais** un nom de variante, un ton, une dimension ou une position. Ces derniers appartiennent à l'archétype, donc au code.

---

## Annexe — Inventaire des contenus en dur dans les composants

Comptage des chaînes françaises et chemins d'image littéraux par composant, du plus dense au moins dense.

| Composant | Points chauds |
|---|---|
| **`Footer`** | **34 `href`** + 3 URL sociales + 3 SVG de marque + `/logo_2.png` |
| **`PrayerRequestForm`** | Plus gros bloc FR parmi les composants + 1 verset non attribué + jeton `ccjv-green-dark` **non défini** |
| **`FullscreenMenu`** | 10 chaînes FR + **5 chemins d'image** + `tag` mort |
| **`VerseSection`** | **6 `alt` FR** + **6 chemins d'image** + `aria-label` + tiret cadratin avant chaque référence |
| **`EventsSection`** | 3 chaînes FR **par défaut** + **repli mock** + locale `fr-FR` + `ÉVÉNEMENT`/`EVT`/`•` + modèle de route |
| **`Hero`** | `h1` + 2 paragraphes FR + 2 CTA (même `href`) |
| **`Header`** | `darkHeroRoutes` (9 routes) + `/logo_2.png` |
| **`HeroManifesto`** | `Traduction Louis Segond 1910.` **inconditionnel** |
| **`SearchClient`** | 4 chaînes FR + littéral `2` ×3 + `.slice(0,30)` |
| **`LegalPage`** | `Dernière mise à jour :` + `context="Marcher dans la vérité"` |
| **`MediaFeature`** | `Dernier enseignement`, `Regarder sur YouTube` + ternaire `aspect-16/9` **mort** |
| **`TeachingCard` / `TeachingFeature`** | `Regarder sur YouTube` + `aria-label` FR |
| **`FeaturedEvent`** | `Prochain rendez-vous`, `Heure`/`Lieu`/`Département`, `"Lubumbashi"` |
| **`Breadcrumbs`** | `Accueil` |
| **`EventRow`** | `"Lubumbashi"` + ` · ` |
| **`PageHeader`** | `CCJV` |
| **`CommunityFaces`, `Reveal`, `WeekRhythm`** | ✅ **AUCUN contenu en dur** — les trois composants les plus propres |
