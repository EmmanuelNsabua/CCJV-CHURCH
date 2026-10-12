# CCJV-CHURCH — Contrat du design system du back-office

**Version :** 1.1 — Contrat consolidé et prêt pour gel  
**Statut :** Document de référence — Phase 3 (COMMENT / Conception et Architecture)  
**Périmètre :** Frontend du back-office d’administration  
**Référence visuelle :** Identité existante du site public CCJV  
**Stack détectée :** Next.js 15.5 App Router, React 19.1, TypeScript 5.7, Tailwind CSS 4.3

---

## 1. Objet et finalité

Ce document définit les conventions visuelles, les composants d’interface, les règles de composition, les signatures logicielles et les exigences d’accessibilité du futur back-office de CCJV-CHURCH.

Il constitue le contrat de référence opposable et directement implémentable destiné aux agents de développement chargés de construire l’interface d’administration.

### Objectifs directeurs :

1. **Préserver strictement l’identité visuelle de CCJV** (palette, absence d’arrondis, typographie épurée, absence d’ombres parasites).
2. **Fournir une interface administrative cohérente, sobre et efficace**, pensée pour la productivité opérationnelle des équipes pastorales et administratives.
3. **Garantir la non-régression absolue du site public** : toute évolution apportée aux composants partagés existants doit être strictement additive.
4. **Réduire la complexité logicielle** : pas de dépendance UI superflue (pas de TanStack Table, pas de framework de formulaire lourd) ; seules les briques réellement nécessaires sont embarquées.
5. **Distinguer nettement l’interface publique de l’administration** tant au niveau du routage Next.js que des layouts.
6. **Garantir une accessibilité conforme WCAG 2.2 AA** (navigation clavier, focus visible, contrastes certifiés, annonces ARIA cohérentes).
7. **Séparer rigoureusement la présentation des règles métier et de la sécurité backend** : l’interface adapte l’affichage selon les autorisations reçues, mais le backend valide et protège toujours souverainement chaque opération.
8. **Permettre une implémentation autonome et incrémentale**, sans bloquer ni perturber les travaux backend en cours.

---

## 2. Principes directeurs

### 2.1. Identité visuelle stricte
Le back-office conserve les fondations visuelles validées : palette identitaire (vert CCJV, noir profond, blanc cassé, encre), typographie `Inter`, angles droits (`rounded-none`), bordures fines de 1 px et sobriété générale. Il n'introduit aucun thème divergent qui dénaturerait l'image de marque de l'église.

### 2.2. Priorité à l’efficacité opérationnelle
Les écrans d'administration privilégient la clarté des données, la lisibilité des statuts, la rapidité de saisie et la prévention des erreurs. Les actions critiques ou destructives (suppression, archivage) sont explicitement signalées et sécurisées par des dialogues de confirmation.

### 2.3. Densité équilibrée
L'interface adopte une densité dite **« équilibrée »** :
- Plus compacte que le site public (qui recourt à de larges espacements éditoriaux de 96 px) ;
- Plus aérée et lisible qu'un tableur dense, garantissant des cibles tactiles et cliquables confortables (hauteur minimale de 36 px pour les contrôles secondaires, 40 px pour les formulaires).

### 2.4. Cohérence par composition
Tous les écrans d'un même archétype partagent une structure standardisée :
- **Pages de liste / gestion :** Titre + description + barre d'outils (recherche, filtres, bouton CTA principal) + tableau de données / liste + pagination.
- **Pages de saisie / modification :** Fil d'Ariane + titre + panneau de formulaire structuré en sections + barre d'actions fixe ou explicite (Enregistrer / Annuler).

### 2.5. Réutilisation contrôlée et non-régression
Un composant existant est réutilisé lorsqu'il répond aux besoins sans compromis. Lorsqu'une extension est nécessaire (`Button`, `Badge`), elle doit être réalisée par **extension additive** de ses propriétés, sans modifier les variantes ou styles consommés par le site public.

### 2.6. Séparation des responsabilités
Le design system contrôle la présentation, l'ergonomie et l'état interactif local. Il ne prend aucune décision d'autorisation RBAC autonome et ne présume pas de la persistance des données.

---

## 3. Fondations visuelles

### 3.1. Palette existante (Tokens vérifiés dans `globals.css`)

Les tokens suivants sont déclarés dans `frontend/src/app/globals.css` (`@theme`) et constituent le socle immuable :

| Token existant | Valeur hexadécimale | Rôle et usage dans le back-office |
|---|---|---|
| `--color-ccjv-green` | `#1e7a1e` | Couleur identitaire principale, boutons primaires, indicateurs actifs, focus outline |
| `--color-ccjv-green-strong` | `#176317` | États hover et active des éléments vert CCJV |
| `--color-ccjv-green-soft` | `#eaf3ea` | Fond teinté de succès, badges de validation, sélections douces |
| `--color-ccjv-cream` | `#ede4c8` | Accents secondaires, séparateurs sur fond sombre |
| `--color-ccjv-black` | `#121212` | Fond de la Sidebar administrative (navigation sombre) ou éléments de contraste |
| `--color-ccjv-offwhite` | `#fafaf7` | Fond général des pages administratives et de la zone de travail |
| `--color-ccjv-ink` | `#1a1a1a` | Couleur principale des textes, titres de tableaux et libellés de champs |
| `--color-ccjv-ink-secondary` | `#5e5d59` | Textes d'aide, métadonnées, sous-titres, en-têtes de colonnes |
| `--color-ccjv-line` | `#e5e2d9` | Bordures fines (1 px) des tableaux, panneaux, cartes et séparateurs |

**Règle absolue :** Toujours utiliser les classes utilitaires Tailwind reliées aux tokens (`bg-ccjv-green`, `text-ccjv-ink`, `border-ccjv-line`) plutôt que d'injecter des valeurs hexadécimales en dur.

---

### 3.2. Tokens sémantiques administratifs (États et feedback)

Pour les besoins fonctionnels du back-office (alertes, bannières, statuts de publication, erreurs de validation, dialogues de confirmation), les couleurs sémantiques suivantes sont arrêtées :

| État sémantique | Texte | Fond | Bordure | Ratio de contraste (Texte / Fond) |
|---|---|---|---|---|
| **Erreur / Destructif** | `#b91c1c` | `#fef2f2` | `#fecaca` | **5,9:1** (Conforme WCAG AA) |
| **Avertissement** | `#b45309` | `#fffbeb` | `#fde68a` | **5,4:1** (Conforme WCAG AA) |
| **Succès** | `#1e7a1e` (`--color-ccjv-green`) | `#eaf3ea` (`--color-ccjv-green-soft`) | `--color-ccjv-green` (teinte 25% ou `--color-ccjv-line`) | **5,2:1** (Conforme WCAG AA) |
| **Information** | `#1d4ed8` | `#eff6ff` | `#bfdbfe` | **5,6:1** (Conforme WCAG AA) |
| **Neutre / Brouillon** | `#5e5d59` (`--color-ccjv-ink-secondary`) | `#f3f2ee` | `#e5e2d9` (`--color-ccjv-line`) | **5,8:1** (Conforme WCAG AA) |

#### Règles d'application des tokens sémantiques :
1. **Centralisation :** Ces styles doivent être encapsulés dans les composants dédiés (`Badge`, `Toast`, `FormField`, `Alert`, `ConfirmModal`). Aucun composant métier ne doit combiner manuellement des classes de couleur ad hoc.
2. **Non-exclusivité de la couleur (WCAG 1.4.1) :** Une couleur d'état ne doit jamais être le seul vecteur d'information. Elle est systématiquement doublée d'un texte explicite (ex. « Erreur : », « Brouillon ») et/ou d'une icône sémantique Lucide (`AlertTriangle`, `CheckCircle2`, `Info`, `XCircle`).
3. **Bordure de succès :** La bordure de succès s'appuie sur la ligne fine existante ou une déclinaison discrète du vert CCJV, sans introduire de couleur non contrôlée.

---

### 3.3. Typographie

- **Police principale de l'interface administrative :** `Inter` (`--font-sans` / `font-sans`). Utilisée pour 100 % des composants fonctionnels : boutons, formulaires, tableaux, navigation, métadonnées, modales et corps de texte.
- **Police d'accentuation éditoriale :** `Lora` (`--font-serif` / `font-serif`). Réservée optionnellement aux grands titres de rubriques administratives ou aux prévisualisations éditoriales de publications. Elle ne doit pas être utilisée dans les tableaux de données ni dans les contrôles de formulaire.

#### Échelle typographique du back-office :
- **Titre de page (H1) :** `font-sans text-2xl font-semibold text-ccjv-ink tracking-tight` (24 px / 1.3).
- **Titre de section / panneau (H2) :** `font-sans text-lg font-semibold text-ccjv-ink` (18 px / 1.4).
- **Sous-titre / En-tête de carte (H3) :** `font-sans text-sm font-semibold text-ccjv-ink` (14 px).
- **Corps de texte & saisie :** `font-sans text-sm text-ccjv-ink` (14 px / 1.5).
- **Libellés de colonnes & légendes :** `font-sans text-xs font-medium text-ccjv-ink-secondary uppercase tracking-wider` (12 px).
- **Textes d'aide & métadonnées fines :** `font-sans text-xs text-ccjv-ink-secondary` (12 px).

---

### 3.4. Formes, bordures et ombres

1. **Règle absolue des angles droits :**
   - Tous les conteneurs administratifs, panneaux, cartes, champs de saisie, boutons et tables appliquent strictement `rounded-none` (0 px).
   - Seules exceptions autorisées :
     - Les badges d'état (`Badge`) : `rounded-full` (format pilule identitaire) ;
     - Les spinners de chargement et indicateurs circulaires de statut en ligne.
2. **Bordures :**
   - Épaisseur de référence : `1px solid` via `border border-ccjv-line`.
   - Séparateurs internes de tableaux : `divide-y divide-ccjv-line`.
   - Panneaux mis en avant : `border-l-4 border-ccjv-green` ou bordure sémantique correspondante.
3. **Ombres :**
   - Aucune ombre portée sur les tableaux, cartes ou formulaires (`--shadow-none`).
   - Une ombre subtile (`shadow-lg` ou `shadow-md`) est tolérée uniquement sur les éléments flottants nécessitant un détachement visuel du plan de travail : dialogues modaux (`ConfirmModal`), menus déroulants (`Dropdown`) et bannières flottantes de notification (`Toast`).
4. **Indicateur de focus visible :**
   - Appliqué universellement sur tous les éléments interactifs : `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ccjv-green`.

---

## 4. Architecture des composants et arborescence cible

### 4.1. Organisation cible des dossiers

Le back-office est rigoureusement isolé au niveau du routage et des composants :

```text
frontend/src/
├── app/
│   ├── (public)/                      # Pages publiques existantes (layout public avec Header/Footer)
│   └── (admin)/
│       └── admin/                     # Racine de l'administration (URL : /admin/...)
│           ├── layout.tsx             # Shell administratif hermétique (AdminLayout)
│           ├── page.tsx               # Redirection vers tableau-de-bord ou connexion
│           ├── connexion/             # Écran d'authentification
│           ├── tableau-de-bord/       # Vue synthétique d'accueil
│           ├── publications/          # Gestion des publications et enseignements
│           │   ├── page.tsx           # Liste tabulaire
│           │   └── [id]/page.tsx      # Formulaire de création / édition
│           ├── evenements/            # Gestion des événements
│           └── medias/                # Gestion de la médiathèque et téléversements
├── components/
│   ├── ui/                            # Atomes génériques partagés (Button, Badge, EmptyState)
│   ├── shared/                        # Composants transversaux du site public
│   └── admin/                         # Composants exclusifs au back-office
│       ├── layout/                    # AdminSidebar, AdminTopbar, AdminBreadcrumbs, AdminShell
│       ├── forms/                     # FormField, Input, Textarea, Select, Checkbox, FormActions
│       ├── tables/                    # DataTable, Pagination, TableActions, TableFilter
│       ├── feedback/                  # Toast, ToastContainer, ConfirmModal, Alert
│       └── data-display/              # StatCard, DetailPanel, StatusBadge
└── lib/
    ├── api/                           # Client HTTP partagé (client.ts étendu pour l'authentification)
    └── admin/                         # Utilitaires et hooks administratifs (auth-context, use-toast)
```

---

### 4.2. Matrice de réutilisation et d'isolation des composants existants

| Composant existant | Emplacement | Statut pour le back-office | Règle d'usage / évolution |
|---|---|---|---|
| `Button.tsx` | `src/components/ui/Button.tsx` | **Réutilisé et étendu** | Extension non régressive : ajout de `variant="danger"` et `size="sm"` |
| `Badge.tsx` | `src/components/ui/Badge.tsx` | **Réutilisé et étendu** | Extension non régressive : ajout des variantes sémantiques |
| `EmptyState.tsx` | `src/components/ui/EmptyState.tsx` | **Réutilisé tel quel** | Utilisé pour les tableaux vides et résultats de recherche nuls |
| `utils.ts` | `src/lib/utils.ts` | **Réutilisé tel quel** | `cn()`, `formatLongDate()`, `formatTime()` |
| `client.ts` | `src/lib/api/client.ts` | **Réutilisé et étendu** | Utilisation de `apiFetchOrThrow`, ajout de la gestion du token de session |
| `PageHeader.tsx` | `src/components/shared/` | **Strictement public** | Interdit dans l'admin (conçu pour la mise en scène avec baie et croix) |
| `Header.tsx` | `src/components/layout/` | **Strictement public** | Interdit dans l'admin (remplacé par `AdminTopbar`) |
| `FullscreenMenu.tsx`| `src/components/layout/` | **Strictement public** | Interdit dans l'admin (remplacé par `AdminSidebar`) |
| `Footer.tsx` | `src/components/layout/` | **Strictement public** | Interdit dans l'admin |
| `IntroCurtain.tsx` | `src/components/layout/` | **Strictement public** | Interdit dans l'admin |

---

### 4.3. Bibliothèque d’icônes — Lucide React

La bibliothèque retenue pour l’ensemble des icônes du back-office est **`lucide-react`**.

#### Règles d'intégration :
1. **Installation :** Dépendance ajoutée au `package.json` du frontend lors du premier lot d'implémentation.
2. **Taille standardisée :**
   - Boutons et actions courantes : `size={16}` (16x16 px, stroke 2 px).
   - Navigation latérale (Sidebar) : `size={18}` (18x18 px).
   - Indicateurs et statuts : `size={14}` ou `size={16}`.
   - Grands états vides / alertes : `size={32}` ou `size={40}`.
3. **Accessibilité :**
   - Tout bouton contenant uniquement une icône (`IconButton`) **doit obligatoirement** comporter un `aria-label` descriptif (ex. `aria-label="Modifier la publication"`).
   - Les icônes accompagnées d'un libellé texte visible portent `aria-hidden="true"`.
4. **Préservation du site public :** Les icônes SVG sur-mesure du site public (`CrossMark.tsx`, `OpenBookMark.tsx`) ne sont pas altérées.

---

## 5. Contrat des composants d’interface d'administration

### 5.1. Bouton (`Button.tsx`) — Spécification de l'extension non régressive

Le composant existant [`frontend/src/components/ui/Button.tsx`](file:///c:/Users/HP/desktop/PROJETS%202026/CCJV-CHURCH/frontend/src/components/ui/Button.tsx) est étendu de façon strictement additive.

#### Contrat TypeScript cible :

```typescript
export type ButtonVariant =
  | "primary"   // Vert CCJV plein (actions principales) — existant
  | "outline"   // Contour noir / hover vert — existant
  | "ghost"     // Transparent / hover souligné vert — existant
  | "inverse"   // Blanc sur fond sombre — existant
  | "danger";   // [NOUVEAU] Fond rouge #b91c1c, hover #991b1b, texte blanc (suppression/actions destructives)

export type ButtonSize =
  | "sm"        // [NOUVEAU] min-h-[36px] px-3 text-xs gap-1.5 (tableaux, barres d'outils denses)
  | "md"        // min-h-[44px] px-6 text-[0.9375rem] — existant (défaut)
  | "lg";       // min-h-[52px] px-8 text-base — existant

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  loading?: boolean;
  external?: boolean;
  className?: string;
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  "aria-label"?: string;
}
```

#### Règle de non-régression :
- Les classes de base (`base`), la gestion du chargement (`loading`), le comportement de lien (`href` via `next/link`) et les 4 variantes d'origine conservent strictement leur code actuel.
- Les pages publiques existantes continuent d'utiliser les boutons sans aucun changement d'affichage.

---

### 5.2. Badges et statuts (`Badge.tsx`) — Spécification de l'extension

Le composant existant [`frontend/src/components/ui/Badge.tsx`](file:///c:/Users/HP/desktop/PROJETS%202026/CCJV-CHURCH/frontend/src/components/ui/Badge.tsx) est étendu pour intégrer les variantes sémantiques nécessaires au suivi des flux métier.

#### Contrat TypeScript cible :

```typescript
export type BadgeVariant =
  | "default"   // bg-ccjv-green-soft text-ccjv-green — existant
  | "dark"      // bg-ccjv-black text-ccjv-cream — existant
  | "outline"   // border border-ccjv-line text-ccjv-ink-secondary — existant
  | "success"   // [NOUVEAU] bg-[#eaf3ea] text-[#1e7a1e] border border-[#1e7a1e]/20
  | "warning"   // [NOUVEAU] bg-[#fffbeb] text-[#b45309] border border-[#fde68a]
  | "error"     // [NOUVEAU] bg-[#fef2f2] text-[#b91c1c] border border-[#fecaca]
  | "info"      // [NOUVEAU] bg-[#eff6ff] text-[#1d4ed8] border border-[#bfdbfe]
  | "neutral";  // [NOUVEAU] bg-[#f3f2ee] text-[#5e5d59] border border-[#e5e2d9]

export interface BadgeProps {
  variant?: BadgeVariant;
  className?: string;
  children: React.ReactNode;
}
```

#### Matrice de correspondance des statuts métier :

| Entité / Contexte | Statut API (Backend) | Libellé affiché (Français) | Variante de Badge |
|---|---|---|---|
| **Publication** | `DRAFT` | Brouillon | `neutral` |
| **Publication** | `PUBLISHED` | Publié | `success` |
| **Publication** | `ARCHIVED` | Archivé | `dark` |
| **Événement** | `UPCOMING` | À venir | `info` |
| **Événement** | `ARCHIVED` | Passé | `neutral` |
| **Prière / Demande** | `PENDING` | En attente | `warning` |
| **Prière / Demande** | `PROCESSED` | Traitée | `success` |
| **Rôle utilisateur** | `ADMIN` / `PASTOR` | Administrateur / Pasteur | `default` |

---

### 5.3. Formulaires natifs et composant `FormField`

Tous les formulaires du back-office reposent sur des contrôles HTML natifs stylisés avec Tailwind CSS, sans bibliothèque tierce.

#### 1. Contrat TypeScript du composant `FormField` :

```typescript
export interface FormFieldProps {
  /** Libellé visible du champ */
  label: string;
  /** Identifiant HTML du contrôle associé (généré automatiquement si omis) */
  htmlFor?: string;
  /** Message d'erreur de validation (déclenche l'état invalide et les attributs ARIA) */
  error?: string | null;
  /** Texte d'aide ou indication de format sous le champ */
  hint?: string;
  /** Indique si le champ est obligatoire (ajoute l'astérisque visuel et aria-required) */
  required?: boolean;
  /** Classes CSS supplémentaires pour le conteneur englobant */
  className?: string;
  /** Le contrôle interactif (Input, Textarea, Select, etc.) */
  children: React.ReactNode;
}
```

#### 2. Règles d'accessibilité et composition de `FormField` :
- **Liaison explicite :** La prop `htmlFor` lie le `<label>` à l'élément de formulaire. Si elle n'est pas fournie, un identifiant unique est généré via le hook React `useId()`.
- **Texte d'aide :** Lorsque `hint` est renseigné, le contrôle interactif reçoit `aria-describedby="${id}-hint"`.
- **Message d'erreur :** Lorsque `error` est présent :
  - Le contrôle interactif reçoit `aria-invalid="true"` et `aria-errormessage="${id}-error"`.
  - La bordure du champ passe en teinte d'erreur (`border-[#b91c1c] focus:border-[#b91c1c]`).
  - Le message d'erreur est restitué dans un élément `<p id="${id}-error" role="alert" className="text-xs text-[#b91c1c] mt-1 font-sans">`.

#### 3. Primitives de formulaire associées (`src/components/admin/forms/`) :
- **`Input` :** `<input className="w-full h-10 px-3 py-2 bg-white border border-ccjv-line rounded-none font-sans text-sm text-ccjv-ink placeholder:text-ccjv-ink-secondary/60 focus:border-ccjv-green focus:outline-none transition-colors" />`.
- **`Textarea` :** Mêmes styles de bordure et focus, redimensionnement vertical uniquement (`resize-y`), `min-h-[100px]`.
- **`Select` :** Menu déroulant natif stylisé avec flèche chevron Lucide en arrière-plan SVG, `h-10 px-3 bg-white border border-ccjv-line rounded-none`.
- **`Checkbox` & `Radio` :** Contrôles carrés stricts (`rounded-none`), accentuation couleur `--color-ccjv-green`.
- **`FormActions` :** Conteneur en bas de formulaire alignant les boutons (`Button variant="primary"` pour Enregistrer, `Button variant="outline"` pour Annuler).

---

### 5.4. Tableaux de données sur mesure (`DataTable.tsx`)

Le composant `DataTable` est développé sur mesure en React/TypeScript pour couvrir les besoins du MVP sans dépendance à TanStack Table.

#### 1. Contrat TypeScript générique :

```typescript
export interface ColumnDef<T> {
  /** En-tête visible de la colonne */
  header: string;
  /** Clé d'accès direct à la propriété dans l'objet de données */
  accessorKey?: keyof T;
  /** Fonction de rendu personnalisé de la cellule (prend le pas sur accessorKey) */
  cell?: (item: T) => React.ReactNode;
  /** Alignement horizontal du texte */
  align?: "left" | "center" | "right";
  /** Classes CSS complémentaires pour l'en-tête et les cellules de cette colonne */
  className?: string;
}

export interface DataTableProps<T> {
  /** Définition des colonnes du tableau */
  columns: ColumnDef<T>[];
  /** Données à afficher */
  data: T[];
  /** Fonction retournant la clé unique de chaque ligne (clé React) */
  keyExtractor: (item: T) => string | number;
  /** État de chargement (affiche les squelettes de lignes) */
  isLoading?: boolean;
  /** Message d'erreur éventuel lors de la récupération des données */
  error?: string | null;
  /** Composant ou message affiché si la liste est vide (par défaut : EmptyState) */
  emptyState?: React.ReactNode;
  /** Callback optionnel lors du clic sur une ligne */
  onRowClick?: (item: T) => void;
  /** Classes CSS pour le conteneur de la table */
  className?: string;
}
```

#### 2. Spécification des fonctionnalités périphériques du tableau :
- **Pagination (`Pagination.tsx`) :** Composant découplé gérant `currentPage`, `totalPages`, `pageSize` et le callback `onPageChange(page: number)`. La pagination côté serveur est la règle pour les listes volumineuses.
- **Tri & Filtres :** Gérés par des composants externes de barre d'outils (`TableFilter.tsx`, `TableSearch.tsx`). Les colonnes triables ne sont activées que si le contrat API backend correspondant supporte expressément le paramètre `sort` ou `order`.
- **Responsive :** Le conteneur du tableau applique `overflow-x-auto` avec défilement horizontal fluide sur petit écran. Les colonnes secondaires peuvent être masquées via classes `hidden md:table-cell`.

---

### 5.5. Rétroaction, notifications et dialogues

1. **Système de Toast (`Toast.tsx` / `useToast()`) :**
   - Notifications temporaires légères positionnées en haut à droite (`top-4 right-4 z-50`).
   - Types gérés : `success`, `error`, `warning`, `info`.
   - Disparition automatique après 4 000 ms, bouton de fermeture manuelle, rôle ARIA `status` (ou `alert` en cas d'erreur).
2. **Dialogue de confirmation (`ConfirmModal.tsx`) :**
   - Utilisé obligatoirement avant toute action destructive (suppression, révocation d'accès, dépublication).
   - Props : `isOpen: boolean`, `title: string`, `message: string`, `confirmLabel?: string`, `cancelLabel?: string`, `variant?: "danger" | "primary"`, `onConfirm: () => void`, `onClose: () => void`, `isLoading?: boolean`.
   - **Accessibilité modale :** Piège de focus (`focus-trap`), focus initial placé sur le bouton d'annulation, fermeture sur touche `Échap` et overlay sombre avec `aria-modal="true"`.

---

## 6. Contrat du layout administratif (`AdminShell`)

### 6.1. Dimensions de conception validées

Les dimensions suivantes sont des décisions de conception fermes :

| Élément d'interface | Dimension cible | Comportement et contraintes |
|---|---|---|
| **Sidebar Desktop** | **`260 px`** (fixe) | Position fixe à gauche, pleine hauteur (`h-screen`), fond sombre `bg-ccjv-black`, scrollbar interne dédiée |
| **Topbar** | **`60 px`** (fixe) | Position sticky en haut, fond blanc `bg-white`, bordure inférieure `border-b border-ccjv-line` |
| **Zone de travail principale** | `calc(100vw - 260px)` | Fond clair `bg-ccjv-offwhite`, padding standard `p-6 sm:p-8`, largeur maximale de contenu `max-w-7xl` |
| **Sidebar Mobile / Tablette** | **Tiroir escamotable (Drawer)** | Masquée par défaut (< 1024 px), ouverture via bouton hamburger dans la Topbar, overlay sombre, fermeture `Échap` |

---

### 6.2. Structure et navigation latérale (`AdminSidebar`)

La Sidebar regroupe les liens par sections logiques selon les domaines de l'église :

```text
[ Logo CCJV + mention "Administration" ]
─────────────────────────────────────────────
• Tableau de bord              (Icon: LayoutDashboard)
─── GESTION ÉDITORIALE ───
• Publications & Médias        (Icon: BookOpen)
• Événements & Cultes          (Icon: Calendar)
• Départements                 (Icon: Users)
─── COMMUNAUTÉ ───────────
• Demandes de prière           (Icon: HeartHandshake)
─── SYSTÈME ──────────────
• Paramètres                   (Icon: Settings)
─────────────────────────────────────────────
[ Utilisateur connecté + Déconnexion ]
```

- **État actif :** Lien surligné par un fond `bg-white/10`, texte `text-ccjv-cream` et barre latérale gauche `border-l-2 border-ccjv-cream` (`aria-current="page"`).
- **Navigation sécurisée :** Les éléments de menu sont affichés selon les capacités transmises par la session utilisateur.

---

### 6.3. Barre supérieure (`AdminTopbar`)

La Topbar contient :
1. **À gauche :** Bouton déclencheur du menu mobile (masqué sur desktop) + Fil d'Ariane contextuel (`AdminBreadcrumbs`).
2. **À droite :**
   - Raccourci vers le site public (`Lien externe : "Voir le site public"`) ;
   - Badge du rôle de l'utilisateur (`ADMIN`, `PASTOR`, `LEADER`) ;
   - Menu profil / Bouton explicite de déconnexion (`LogOut`).

---

## 7. Authentification et client API

### 7.1. Constat technique et exigence d'adaptation
Le client API actuel ([`frontend/src/lib/api/client.ts`](file:///c:/Users/HP/desktop/PROJETS%202026/CCJV-CHURCH/frontend/src/lib/api/client.ts)) a été initialement conçu pour les requêtes publiques anonymes du site web. Il ne gère pas l'injection automatique des jetons de sécurité JWT (`Authorization: Bearer <token>`).

### 7.2. Contrat d'évolution du client HTTP (`client.ts`) :
1. **Alignement Supabase Auth :** Le client d'administration s'aligne sur le mécanisme de session Supabase Auth en vigueur dans le projet (cookie de session ou token d'accès stocké de façon sécurisée).
2. **Gestion centralisée de l'en-tête d'autorisation :**
   - Extension de la fonction `apiFetchOrThrow` pour intercepter et injecter automatiquement l'en-tête `Authorization` lorsque la session active est présente.
   - Ne pas forcer le passage manuel du token dans chaque appel de composant ou de page.
3. **Gestion des codes d'état HTTP dans le back-office :**
   - `401 Unauthorized` : Redirection automatique vers `/admin/connexion` avec conservation de l'URL cible (`?redirect=...`).
   - `403 Forbidden` : Affichage d'un état d'accès refusé clair (« Vous n'avez pas les droits requis pour cette section »), sans crash de l'application.
   - `422 Unprocessable Entity` / `400 Bad Request` : Extraction des erreurs de validation par champ pour les transmettre au formulaire via `FormField`.
4. **Sécurité :** Aucun secret d'administration privilégié (`SUPABASE_SERVICE_ROLE_KEY`) ne doit être injecté ou exposé côté client.

---

## 8. Lotissement et ordre d'implémentation recommandé

L'implémentation du back-office se déroulera selon les étapes ordonnées ci-dessous :

```text
Lot 1 : Fondations et Shell Administratif
├── 1.1 Installation de lucide-react et déclaration des tokens sémantiques
├── 1.2 Extension non régressive de Button.tsx (variant danger, size sm) et Badge.tsx
├── 1.3 Création du shell administratif hermétique : app/(admin)/admin/layout.tsx (Sidebar + Topbar)
└── 1.4 Intégration du gestionnaire de session et extension de client.ts pour les requêtes authentifiées

Lot 2 : Primitives de Données et Formulaires
├── 2.1 Composant FormField accessible et primitives de saisie (Input, Textarea, Select, Checkbox)
├── 2.2 Composant DataTable générique sur mesure, EmptyState et Pagination
└── 2.3 Composants de rétroaction : Toast (useToast) et ConfirmModal

Lot 3 : Écran Pilote de Validation Complète
├── 3.1 Module Publications (/admin/publications) : Liste tabulaire paginée, filtres par statut
└── 3.2 Formulaire de création / édition de publication avec validation d'erreurs API et confirmations

Lot 4 : Généralisation aux Autres Modules
└── 4.1 Événements, Demandes de prière, Départements et Médias
```

---

## 9. Critères d’acceptation et validation post-implémentation

Toute livraison d'implémentation basée sur ce contrat sera validée selon la grille de critères ci-après :

- [ ] **Préservation du site public :** Aucune régression visuelle, fonctionnelle ou de mise en page sur l'ensemble des pages publiques existantes.
- [ ] **Compilation et types stricts :** `npm run typecheck` (`tsc --noEmit`) et `npm run lint` s'exécutent avec 0 erreur et 0 avertissement bloquant.
- [ ] **Build Next.js :** `npm run build` génère le bundle complet sans erreur de frontière client/serveur.
- [ ] **Angles stricts :** Règle du `rounded-none` respectée sur tous les conteneurs, tableaux, formulaires et boutons administratifs.
- [ ] **Accessibilité WCAG 2.2 AA :**
  - Tous les champs de formulaire sont liés à leur label et à leurs messages d'erreur (`aria-describedby`, `aria-invalid`).
  - Toutes les actions iconographiques disposent d'un `aria-label`.
  - Le focus visible vert CCJV est opérant sur chaque élément interactif au clavier.
  - La navigation clavier et la touche `Échap` fonctionnent sur les modales et la sidebar mobile.
- [ ] **Dépendances maîtrisées :** Aucune dépendance tierce autre que `lucide-react` n'a été introduite.
- [ ] **Sécurité :** Les routes administratives sont protégées côté serveur et client ; aucune clé secrète n'est exposée.

---

## 10. Gouvernance et gel de la Phase 3

Ce document est le **contrat de référence consolidé** pour le design system du back-office de CCJV-CHURCH.

À l'issue de cette étape, ce contrat est **prêt à être formellement gelé** pour clore la Phase 3 (Conception et Architecture). Toute demande d'évolution structurelle ultérieure sera consignée dans le registre de suivi de la Phase 6.

---

**Fin du document — Contrat de référence consolidé, version 1.1.**
