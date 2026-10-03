# 011 — Architecture visuelle des 6 pages (Étape 4)

**Projet :** Centre Chrétien Jésus ma Vie (CCJV) — Lubumbashi, RDC
**Sous-phase :** Conception du site public (pré-implémentation)
**Statut :** Proposition — à valider avant implémentation

---

## 1. Structure globale (commune à toutes les pages)

```text
<Header contextuel>            transparent sur Hero → solide au scroll
   └ logo · CCJV · [menu] · [Nous rejoindre]

<main>
   (contenu de la page)
</main>

<Footer noir>
   └ logo · identité · localisation · horaires · navigation
   └ réseaux (Instagram, TikTok) · WhatsApp (wa.me — TODO)
```

- **Menu plein écran** (desktop + mobile) : overlay noir, navigation Lora large, focus
  managé, Échap, scroll lock, fermeture après sélection.
- **CTA permanent** : « Nous rejoindre » → `/contact` (décision à valider).
- Routes publiques : `/`, `/qui-sommes-nous`, `/organisation`, `/evenements`,
  `/publications`, `/contact`.

---

## 2. Page — Accueil (`/`)

**Objectif :** répondre en 15 secondes à « qui est CCJV, où, quand, et comment
participer », puis transformer le visiteur en intéressé.

```text
Hero (composition éditoriale asymétrique)
   ↓
Identité / message de bienvenue (photo + texte)
   ↓
Horaires des cultes (adultes / enfants)
   ↓
Prochains événements (2–3 Event Cards + « Tout voir »)
   ↓
Départements / Organisation (aperçu Department Cards)
   ↓
Publications / Médias (1 dernière publication en avant)
   ↓
Invitation / Communauté (CTA « Nous rejoindre »)
   ↓
Footer
```

- **Hero** : titre Display Lora (Lorem ipsum placeholder), chapeau, photo réelle pleine
  largeur/bloc, accent crème, CTA principal + secondaire. Pas de Hero générique.
- **Horaires** : `TODO — HORAIRES À FOURNIR` (deux blocs : Adultes / Enfants-Ecodim).
- **Interactions** : révélation au scroll des sections, hover sur cartes, lien ancré
  vers « Nous rejoindre ».
- **Responsive** : sections empilées, espace réduit, images recadrées, pas de parallax mobile.

---

## 3. Page — Qui sommes-nous (`/qui-sommes-nous`)

**Objectif :** établir la crédibilité institutionnelle + la chaleur humaine.

```text
Titre de page + chapeau
   ↓
Identité & histoire (création : 17 mars 2023)
   ↓
Vision (contenu TODO — À FOURNIR)
   ↓
Le Pasteur Manasse Mwamba (visionnaire/créateur) — photo + texte
   ↓
L'Ecodim (naissance : 2 juillet 2023) — bloc dédié
   ↓
Informations institutionnelles (nom, localisation)
   ↓
Footer
```

- **Règle :** n'inventer aucun contenu manquant → placeholders `TODO — … À FOURNIR`.
- **Hiérarchie :** H1 (titre), H2 (histoire/vision/pasteur/Ecodim), texte courant Inter.
- Composition éditoriale : texte + photo réelle en grille asymétrique.

---

## 4. Page — Organisation (`/organisation`)

**Objectif :** présenter dynamiquement les volets et départements.

```text
Titre + chapeau
   ↓
Volets principaux : Adultes · Enfants / Ecodim
   ↓
Départements (liste dynamique : Department Cards)
   ↓
Footer
```

- **Données dynamiques** : les départements viennent d'un mock `Department[]` ; aucun nom
  codé dans les composants UI.
- **Confirmés** : Adultes, Enfants/Ecodim. **Mentionnés** (docs) : chorale. **Exemple**
  (modélisation) : Jeunesse. Tout autre département → placeholder `TODO`.
- Chaque carte : nom, courte description, responsable optionnel.
- **Empty State** si aucun département : message + placeholder `TODO — CONTENU À FOURNIR`.

---

## 5. Page — Événements (`/evenements`)

**Objectif :** donner envie de venir — l'ordre chronologique prime.

```text
Titre + chapeau
   ↓
Événements à venir (tri chronologique ascendant) — Event Cards
   ↓
Événements passés / archivés (tri chronologique descendant) — section repliable ou plus bas
   ↓
Footer
```

- **Event Card** : date (bloc éditorial), titre, heure, lieu, département (badge),
  description, image optionnelle, état `UPCOMING`/`ARCHIVED` (propriété **calculée**).
- **Pas de page de détail en V1** (voir audit §5.4) ; l'information est portée par la carte.
- **Filtrage** : optionnel par département (à valider ; reportable en itération).
- **Empty State** si aucun événement à venir.

---

## 6. Page — Publications / Médias (`/publications`)

**Objectif :** montrer la vie réelle — grille éditoriale chronologique.

```text
Titre + chapeau
   ↓
Grille éditoriale chronologique (Publication Cards)
   ↓
Footer
```

- **Types** : `VIDEO` (lien YouTube/Facebook, jamais hébergé ni autoplay), `PHOTO`
  (image réelle optimisée), `TEXTE` (carte typographique).
- **Ordre** : chronologique décroissant (plus récent en premier).
- Badge de type + date sur chaque carte ; coins droits, bordure fine, aucune ombre.
- **Empty State** si aucune publication.

---

## 7. Page — Contact (`/contact`)

**Objectif :** rendre le passage à l'action simple — venir, appeler, écrire.

```text
Titre + chapeau
   ↓
Informations pratiques (adresse, localisation — TODO)
   ↓
Horaires des cultes (TODO — HORAIRES À FOURNIR)
   ↓
WhatsApp (bouton wa.me — numéro TODO)
   ↓
Réseaux sociaux (Instagram, TikTok)
   ↓
Footer
```

- **Pas de formulaire de contact en MVP** (règle validée).
- **WhatsApp** : bouton contextuel `wa.me/…` (numéro `TODO — NUMÉRO WHATSAPP À FOURNIR`),
  discret, pas de flottant permanent.
- **Localisation** : adresse `TODO — ADRESSE À FOURNIR` ; carte intégrée uniquement si
  l'adresse est fournie (et en lazy-load, pour la performance).

---

## 8. SEO (par page)

- **Metadata** : `title` + `description` uniques par page, `openGraph`, `twitter:card`,
  `canonical`, `lang="fr"`.
- **Fichiers** : `sitemap.xml`, `robots.txt`.
- **Sémantique** : un seul `h1`, hiérarchie `h1 → h2 → h3`, landmarks, alt text.
- **URLs propres** : `/qui-sommes-nous`, `/organisation`, `/evenements`,
  `/publications`, `/contact` (slugs futurs en minuscules sans accents).
- **Performance SEO** : Server Components, pré-rendu des pages publiques, images
  optimisées (pas de sacrifice de performance pour le SEO).

---

## 9. Modèle de données mocké (aligné sur le domaine)

Types TypeScript (à créer dans `src/types/`), **cohérents avec le backend futur**
(Phase 3.2/3.3) :

```ts
type PublicationType = 'VIDEO' | 'PHOTO' | 'TEXTE';
type EventStatus = 'UPCOMING' | 'ARCHIVED'; // calculé, jamais persisté

interface Department {
  id: string;
  name: string;
  slug: string;
  description?: string;
  responsibleName?: string;
}

interface Event {
  id: string;
  title: string;
  slug: string;
  description?: string;
  eventDate: string; // ISO date
  eventTime?: string; // ISO time
  location?: string;
  imageUrl?: string;
  departmentId?: string | null; // null = événement général
  status: EventStatus; // dérivé de eventDate
}

interface Publication {
  id: string;
  title: string;
  type: PublicationType;
  contentUrl?: string; // lien YouTube/Facebook, ou image Supabase
  description?: string;
  publishedAt: string;
}

interface StaticPage {
  id: string;
  pageKey: 'ACCUEIL' | 'QUI_SOMMES_NOUS' | 'ORGANISATION' | 'CONTACT';
  content: string;
}
```

- `is_archived` est **absent** (supprimé par la modélisation) ; l'état est calculé
  depuis `eventDate`.
- Les mocks (`src/lib/mock/…`) respectent exactement ces contrats pour basculer vers
  l'API REST (`/api/v1/…`) sans refonte.

---

## 10. Architecture frontend cible (rappel, Phase 3.3)

```text
src/
├── app/(public)/            # routes : /, /qui-sommes-nous, /organisation, /evenements, /publications, /contact
├── components/
│   ├── ui/                  # Button, Badge, Card, EmptyState, LoadingState, ErrorState, Image
│   ├── layout/              # Header, Footer, FullscreenMenu
│   └── shared/              # Section, CTA
├── features/
│   ├── events/              # EventCard, liste événements
│   ├── departments/         # DepartmentCard, liste départements
│   ├── publications/        # PublicationCard, grille
│   └── pages/               # Hero, sections Accueil
├── lib/
│   ├── api/                 # client REST (plus tard)
│   ├── mock/                # données mockées V1
│   └── utils/               # formatage date, slug, classes
└── types/                   # Department, Event, Publication, StaticPage
```

> L'organisation exacte sera finalisée à l'implémentation sans modifier l'architecture
> conceptuelle validée.
