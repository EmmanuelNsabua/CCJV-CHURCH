# 010 — Design System (Étape 3)

**Projet :** Centre Chrétien Jésus ma Vie (CCJV) — Lubumbashi, RDC
**Sous-phase :** Conception du site public (pré-implémentation)
**Statut :** Proposition — à valider avant implémentation

> Implémentation cible : CSS variables (tokens) exposées via un module de thème,
> consommées par des composants React/TSX. Pas de dépendance UI lourde ; composants
> maison, sans `radix`/`shadcn` imposés (le besoin ne le justifie pas en V1).

---

## 1. Foundations

### 1.1 Color tokens

Couleurs **de base validées** (conservées presque exactement) + quelques **dérivés
fonctionnels** (marqués « dérivé »), introduits uniquement pour les états et les
bordures. Aucune couleur de base n'est modifiée.

| Token | Valeur | Usage |
| --- | --- | --- |
| `--ccjv-green` | `#1E7A1E` | Primaire (boutons, accents, liens) |
| `--ccjv-green-strong` | `#176317` *(dérivé)* | Hover/active du vert |
| `--ccjv-green-soft` | `#EAF3EA` *(dérivé)* | Fond teinté discret (badge, focus léger) |
| `--ccjv-cream` | `#EDE4C8` | Accent (détails, séparateurs, accents typo) |
| `--ccjv-black` | `#121212` | Sections fortes, footer, menu plein écran |
| `--ccjv-offwhite` | `#FAFAF7` | Fond clair des pages |
| `--ccjv-ink` | `#1A1A1A` | Texte principal |
| `--ccjv-ink-secondary` | `#5E5D59` | Texte secondaire, légendes |
| `--ccjv-line` | `#E5E2D9` *(dérivé)* | Bordures fines (hairline chaud) |
| `--ccjv-white` | `#FFFFFF` | Texte sur fond sombre |

**Dominantes :** vert + blanc cassé. **Accents :** doré/crème (jamais dominant),
noir (sections/footer/menu). **Contraste :** le vert `#1E7A1E` sur `#FAFAF7`/blanc
≈ **5,4:1** → conforme AA pour texte normal ; blanc sur vert idem. Le gris secondaire
`#5E5D59` sur `#FAFAF7` ≈ 6:1.

### 1.2 Typography tokens

| Token | Valeur |
| --- | --- |
| `--font-serif` | `'Lora', Georgia, 'Source Serif', serif` |
| `--font-sans` | `'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif` |

Chargement via **`next/font`** (self-hosted, pas de requête CDN Google Fonts à l'exécution).
Sous-ensembles latins uniquement. `font-display: swap`.

Échelle fluide (`clamp`) :

| Rôle | Police / graisse | Taille |
| --- | --- | --- |
| Display (Hero) | Lora 500–600 | `clamp(2.5rem, 1rem + 5.5vw, 4.5rem)` (40→72 px) |
| H1 (titre de page) | Lora 600 | `clamp(2rem, 1rem + 2.5vw, 3rem)` (32→48 px) |
| H2 (titre de section) | Lora 600 | `clamp(1.75rem, 0.75rem + 2vw, 2.5rem)` (28→40 px) |
| H3 (sous-titre) | Lora 500 | `clamp(1.25rem, 0.9rem + 1vw, 1.5rem)` (20→24 px) |
| Corps | Inter 400 | `1rem` (16 px) |
| Corps secondaire | Inter 400 | `0.875rem` (14 px) |
| Légende / badge | Inter 500 | `0.75rem` (12 px) |

**Contraste typographique : 3/5 — équilibré.** Lora réservé aux titres ; Inter pour tout
le reste (interface, corps, boutons, navigation).

### 1.3 Spacing tokens (base 4 px)

```
--space-1  :   4px    --space-6  :  24px    --space-16 :  64px
--space-2  :   8px    --space-8  :  32px    --space-20 :  80px
--space-3  :  12px    --space-10 :  40px    --space-24 :  96px
--space-4  :  16px    --space-12 :  48px    --space-32 : 128px
--space-5  :  20px
```

- Rythme vertical des sections (desktop) : `--space-24` (96 px) ; réduit sur mobile
  (`--space-16`) pour éviter des pages inutilement longues.
- Marges horizontales fluides : `clamp(16px, 4vw, 48px)`.

### 1.4 Container & grille

- `Container` : `max-width: 1200px`, marges fluides.
- `Grille éditoriale` : 12 colonnes, gouttières `--space-4/--space-8`, permettant des
  compositions asymétriques (8+4, 7+5, 5+7, offset).
- `Full width` : Hero, photographies, bandeaux, navigation plein écran.

### 1.5 Breakpoints (mobile-first, minimum nécessaire)

| Token | Valeur | Usage |
| --- | --- | --- |
| `--bp-sm` | `480px` | petit mobile / ajustements fins |
| `--bp-md` | `768px` | tablette |
| `--bp-lg` | `1024px` | desktop |
| `--bp-xl` | `1200px` | large desktop (plafond du container) |

### 1.6 Border system

| Token | Valeur |
| --- | --- |
| `--border-hairline` | `1px solid var(--ccjv-line)` |
| `--border-strong` | `1px solid var(--ccjv-ink)` |
| `--border-accent` | `1px solid var(--ccjv-cream)` |

### 1.7 Radius system

**Coins droits par défaut.** Radius = 0 partout ; un seul dérivé toléré :

| Token | Valeur | Usage |
| --- | --- | --- |
| `--radius-none` | `0` | Cartes, boutons, images (défaut éditorial) |
| `--radius-pill` | `999px` | uniquement si un badge/état « rond » est nécessaire |

### 1.8 Shadow system

**Aucune ombre** sur les cartes/images (règle éditoriale). Une seule élévation
fonctionnelle, quasi invisible :

| Token | Valeur | Usage |
| --- | --- | --- |
| `--shadow-none` | `none` | Défaut partout |
| `--shadow-header` | `0 1px 0 var(--ccjv-line)` | Header au scroll (séparation, pas d'ombre portée) |

### 1.9 Motion tokens

| Token | Valeur |
| --- | --- |
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` (expo-out éditorial) |
| `--ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` |
| `--dur-fast` | `150ms` (micro-interactions) |
| `--dur-base` | `250ms` (hover, états) |
| `--dur-slow` | `400ms` (révélation au scroll) |
| `--dur-page` | `550ms` (menu plein écran, transitions de page) |

Toutes les animations passent par une media query `@media (prefers-reduced-motion: reduce)`
qui les neutralise (les éléments deviennent visibles sans transition).

---

## 2. Components

### 2.1 Button

- **Forme carrée**, outline fin, sobre. Variantes :
  - `primary` : fond `--ccjv-green`, texte blanc ;
  - `outline` : fond transparent, bordure `--border-strong`, texte `--ccjv-ink` ;
  - `ghost` : sans bordure, texte `--ccjv-green` (lien contextuel) ;
  - `inverse` : sur fond noir, bordure crème/texte blanc.
- **États** (tous requis) :
  - `default` → `hover` (vert fort / léger fond) → `focus-visible` (anneau `2px`
    `--ccjv-green` + `offset 2px`, très visible) → `active` (légère réduction) →
    `disabled` (opacité 40 %, pas de pointer) → `loading` (spinner + `aria-busy`,
    texte masqué de façon accessible).
- Tailles : `md` (44 px de haut, cible tactile ≥ 44 px), `lg`.
- Accessibilité : `<button>` natif, `aria-disabled` sur `disabled`, focus visible.

### 2.2 Link

- Deux contextes : lien **dans le texte** (souligné, vert, `focus-visible` visible) et
  lien **navigation** (pas souligné, hover souligne).
- Distinction claire lien/bouton (le lien n'imite pas un bouton plein).
- `target="_blank"` → `rel="noopener noreferrer"` + mention accessible si externe.

### 2.3 Header

- **Contextuel** : transparent sur le Hero (texte clair), puis **solide** au scroll
  (`--ccjv-offwhite`, bordure `--shadow-header`, texte `--ccjv-ink`).
- Contenu : logo (déclinaison claire), libellé CCJV, bouton menu (hamburger identitaire),
  CTA « Nous rejoindre » (desktop).
- Transition fluide et légère (`--dur-base`), sans effet de transformation excessif.
- `position: sticky` avec `backdrop` uniquement à l'état solide ; `aria-label` « Menu ».

### 2.4 Footer

- Fond **noir** `--ccjv-black`, texte clair, accent crème pour les séparateurs.
- Contenu : logo, nom, localisation (TODO), horaires (TODO), navigation secondaire,
  réseaux sociaux (Instagram, TikTok), **CTA WhatsApp** (bouton `wa.me/…` — numéro TODO).
- Pas de bouton flottant WhatsApp ; le CTA reste contextuel et discret.
- `<footer>` landmark, contraste texte clair sur noir conforme.

### 2.5 Navigation & Fullscreen Menu

- **Menu principal plein écran sur Desktop ET Mobile** (élément identitaire, pas un menu
  mobile).
- Déclencheurs : bouton menu (desktop) / hamburger (mobile), `aria-expanded`,
  `aria-controls`.
- Overlay : fond `--ccjv-black`, pleine hauteur, fermeture en croix.
- Navigation : libellés **Lora large** (Display), hiérarchie forte, numérotation
  éditoriale facultative, état actif `aria-current="page"`.
- **Comportement :** animation d'ouverture/fermeture (`--dur-page`, `--ease-out`) ;
  **focus management** (trap, focus initial, retour au déclencheur à la fermeture) ;
  **navigation clavier** (Tab/Shift+Tab, Flèches) ; **fermeture avec Échap** ;
  **verrouillage du scroll** ; **fermeture après sélection** ; `role="dialog"` +
  `aria-modal="true"` ; ouverture rapide.
- Liens complémentaires : CTA « Nous rejoindre », réseaux sociaux.

### 2.6 Hero

- **Composition graphique éditoriale, asymétrique** — jamais « image plein écran + texte
  centré + deux boutons ».
- Combinaison : titre Display Lora (Lorem ipsum, placeholder), chapeau court, une photo
  réelle en pleine largeur ou en bloc éditorial, espace négatif, un accent crème ou une
  forme issue du logo (bâtiment/livre simplifié, discret), CTA principal + secondaire.
- Parfaitement responsive : la composition se réorganise (bloc texte + image empilés ou
  en grille asymétrique), pas de simple réduction.
- Contenu injecté via props (facile à remplacer), jamais codé en dur dans le composant.

### 2.7 Section

- En-tête de section : surtitre (Inter, vert, majuscules espacées) + titre H2 (Lora) +
  chapeau optionnel ; lien « Tout voir » si pertinent.
- Rythme vertical `--space-24` ; variantes `full-bleed` (photo), `dark` (noir),
  `tinted` (vert doux).
- `id` de section pour ancres ; landmark `<section>` + `aria-labelledby`.

### 2.8 Event Card

- **Coins droits, bordure fine `--border-hairline`, aucune ombre.**
- Contenu : date (bloc éditorial : jour en Lora + mois), titre, heure, lieu, département
  (badge), description, image optionnelle (photo réelle).
- État `UPCOMING`/`ARCHIVED` affiché via un Badge (propriété calculée, jamais persistée).
- Hover subtil : bordure passe en `--ccjv-green`, léger déplacement de l'image.

### 2.9 Department Card

- Coins droits, bordure fine, aucune ombre. Nom (Lora H3), courte description,
  responsable optionnel.
- **Données dynamiques** : le composant reçoit un `Department` ; aucune liste codée en dur.

### 2.10 Publication Card

- Grille éditoriale chronologique. Par type :
  - `VIDEO` : vignette + icône lecture, ouverture vers la plateforme externe (YouTube/
    Facebook) — jamais d'hébergement ni d'autoplay ;
  - `PHOTO` : image réelle optimisée ;
  - `TEXTE` : carte typographique (titre + extrait + date).
- Badge de type (`VIDEO`/`PHOTO`/`TEXTE`), date, titre, description courte.
- Coins droits, bordure fine, aucune ombre.

### 2.11 Badge

- Étiquettes discrètes : type de publication, état d'événement, département, catégorie.
- Fond `--ccjv-green-soft` + texte `--ccjv-green` (ou crème/noir sur fond sombre),
  `--radius-pill` ou droit, Inter 500 12 px.

### 2.12 Image

- `next/image` partout, `sizes`/`fill` adaptés, `alt` descriptif obligatoire
  (ou `alt=""` si purement décorative).
- Formats modernes (WebP/AVIF), `loading="lazy"` hors images LCP, `priority` sur l'image
  Hero, placeholders `blur`.

### 2.13 CTA « Nous rejoindre »

- CTA permanent (header + accueil + contextes pertinents).
- **Sémantique :** découvrir/venir/participer — **jamais** un compte, jamais de
  formulaire d'inscription.
- Cible proposée (à valider) : `/contact` (horaires, localisation, WhatsApp) ou l'ancre
  « Rejoindre » de l'accueil.

### 2.14 Empty / Loading / Error States

- **Empty State** : titre + message + CTA (ex. « Aucun événement à venir pour le moment —
  TODO — CONTENU À FOURNIR »), jamais une page vide.
- **Loading State** : squelettes (`skeleton`) sobres, `aria-busy`, sans layout shift.
- **Error State** : message accessible, rôle `alert`/`status`, possibilité de réessayer.

---

## 3. Accessibilité transversale (WCAG 2.2 AA)

- HTML sémantique + landmarks (`header`, `nav`, `main`, `section`, `footer`).
- Hiérarchie de headings correcte (un seul H1 par page).
- Navigation clavier complète, focus visible (anneau 2 px contrasté), ordre de tab logique.
- Contraste conforme (voir 1.1) ; cibles tactiles ≥ 44 px.
- `alt` sur toutes les images ; labels sur les contrôles ; messages d'erreur accessibles.
- `prefers-reduced-motion` respecté partout.

---

## 4. Règle de non-prolifération

On n'ajoute un composant ou un token que s'il répond à un besoin réel d'une des six
pages. Pas de bibliothèque générique volumineuse : le système ci-dessus couvre le MVP.
