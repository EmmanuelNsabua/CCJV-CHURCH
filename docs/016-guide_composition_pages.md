# 016 — Guide d'implémentation des pages

> Guide opérationnel pour écrire une page CCJV après la refonte éditoriale.
> **À lire avec** `docs/015-architecture_editoriale.md`.

---

## 0. La règle qui commande toutes les autres

> **Le contenu et l'intention de la page dictent la composition. La composition
> choisit ensuite les composants.**

Jamais : « j'ai un composant, où le placer ? »
Toujours : « que dit cette page, et dans quel ordre le lecteur doit-il le
recevoir ? »

---

## 1. Ce qu'on ne fait plus

| Interdit | Pourquoi |
| --- | --- |
| Ouvrir toutes les pages par le même héros | C'est ce qui produisait l'effet « template » |
| Terminer toutes les pages par un verset plein écran | Le verset devient un motif algorithmique |
| Afficher une croix + le nom du pôle en tête de chaque page | La croix reste forte si elle n'est pas partout |
| `Breadcrumb → Label → Titre → Description → Verset → Image` | Ordre imposé = template |
| Trois cartes identiques en grille | Grille uniforme = générateur |
| Une seule photographie par page | Le site doit devenir photographique |
| `Section` + `SectionHeading` systématiques | Utiliser `Band` et composer |
| Inventer un fait institutionnel | Voir §5 |
| Créer une page pour un pôle | **Un pôle n'est pas une destination** — voir §1.1 |

---

## 2. Vocabulaire disponible

### Rythme — `@/components/composition/Band`

```tsx
<Band
  tone="light | cream | tinted | dark | green | bare"
  space="flush | tight | normal | airy | silence"
  width="container | wide | full"
  rule="top | bottom | both"
/>
```

`space` : `tight` (suite immédiate) · `normal` · `airy` (contenu court) ·
`silence` (pause visuelle) · `flush` (aucun padding — images pleine largeur).

### Héros — `@/components/composition/*`

| Fichier | Props |
| --- | --- |
| `HeroEditorial` | `overline, title, intro?, image, imageCaption?, meta?: {label,value}[], tone?, children?` |
| `HeroPhoto` | `overline, title, intro?, image, caption?, height?: "normal"\|"tall", children?` |
| `HeroCentered` | `overline, title, intro?, verse?: {text,reference}, tone?, children?` |
| `HeroSplit` | `overline, title, intro?, image, secondaryImage?, secondaryCaption?, paragraphs?: string[], children?` |
| `HeroImmersive` | `overline, title, text?, image, caption?, align?` |
| `HeroPractical` | `overline, title, intro?, facts?: {label,value,hint?,href?}[], aside?` |
| `HeroManifesto` | `overline, title, declaration?, scripture: {text,reference}, scriptureContext?, tone?, children?` |
| `HeroCompact` | `overline, title, intro?, aside?` — pages d'index, sans photo |

`PageHeader` (la « baie ») reste disponible comme **héros d'exception**, jamais
par défaut.

### Briques — `@/components/editorial/*`

| Composant | Props essentielles |
| --- | --- |
| `Prose` | `large?, dropcap?, width?: "narrow"\|"normal"\|"wide", onDark?` |
| `FeatureImage` | `src, caption?, variant: "full"\|"wide"\|"inset"\|"arch"\|"portrait"\|"float", aspect?` |
| `PhotoDuo` | `left: {src,caption?}, right: {src,caption?}, variant: "equal"\|"offset"` |
| `PhotoGallery` | `images: string[], captions?, variant: "mosaic"\|"strip"\|"columns"` |
| `PullQuote` | `text, attribution?, align: "left"\|"center"\|"marginal", onDark?` — **parole humaine uniquement** |
| `ScriptureBlock` | `text, reference, variant: "inline"\|"framed"\|"marginal"\|"wide"\|"concluding", context?, onDark?` |
| `KeyFacts` | `items: {label,value,hint?}[], variant: "pairs"\|"tiles"\|"inline", onDark?` |
| `ConvictionList` | `items: {title,text,references?}[], pendingWhat?` |
| `Chapter` | `index, title, paragraphs: string[], image?, imageCaption?, side: "left"\|"right", quote?` |
| `PortraitPanel` | `image, name, role, scope?, bio?, quote?, side` |
| `PeopleGrid` | `people: Person[], variant: "feature"\|"compact"` |
| `CrossLinks` | `items: {href,label,description?,image?}[], variant: "doors"\|"list"\|"inline"` |
| `InfoPanel` | `groups: {title,items:{label?,value,hint?}[]}[], note?, aside?` |
| `StepsList` | `steps: {title,text}[], variant: "vertical"\|"horizontal"` |
| `MediaFeature` | `href, title, excerpt?, author?, date?, duration?, variant: "hero"\|"inline"` |
| `ContentPending` | `what, hint?, variant: "block"\|"inline"` |

Briques conservées : `Timeline`, `WeekRhythm`, `YouTubeThumb`, `Badge`, `Button`,
`EmptyState`, `Reveal`, `CrossMark`, `OpenBookMark`, `BreathingPhoto`,
`TestimonyCarousel`, `CommunityFaces`, `LegalPage`, ainsi que les composants de
`@/features/**`.

### Archétypes — `@/components/archetypes/*`

Tous acceptent `rhythm?: "dense" | "standard" | "serene"`.

| Archétype | Emplacements |
| --- | --- |
| `EditorialPage` | `hero, intro?, feature?, body?, pullQuote?, deepening?, scripture?, related?` |
| `NarrativePage` | `hero, prologue?, chapters?, feature?, chronology?, epilogue?, related?` |
| `ListingPage` | `header, lead?, list?, listTitle?, archives?, archivesTitle?, related?` |
| `DetailPage` | `media, summary?, body?, aside?, gallery?, related?, relatedTitle?` |
| `EventPage` | `hero, summary?, description?, practical?, program?, gallery?, related?` |
| `MediaPage` | `hero, featured?, listing?, listingTitle?, gallery?, galleryTitle?, collections?, collectionsTitle?, related?` |
| `DirectoryPage` | `hero, intro?, lead?, directory?, directoryTitle?, responsibilities?, responsibilitiesTitle?, related?` |
| `InformationPage` | `header, context?, facts?, factsTitle?, steps?, stepsTitle?, contact?, photo?, related?` |

**Les emplacements non pertinents pour le sujet doivent être omis.** Un
archétype n'est pas un formulaire à remplir : c'est une intention.

---

## 3. Exemples de référence (à lire avant d'écrire)

| Archétype | Page à lire |
| --- | --- |
| `NarrativePage` | `src/app/qui-sommes-nous/d-ou-nous-venons/page.tsx` |
| `EditorialPage` | `src/app/communaute/groupes-de-maison/page.tsx` |
| `ListingPage` | `src/app/publications/actualites/page.tsx` |
| `EventPage` | `src/app/vie-de-leglise/evenements/[slug]/page.tsx` |

---

## 3.1 Un pôle n'est pas une destination (palier 1)

Seul **l'accueil** possède une page propre. « Qui sommes-nous », « Vie de
l'Église », « Communauté », « Organisation » et « Publications & Médias » sont
des **regroupements** : ils nomment une famille de pages sans en être une.

Règle à ne jamais enfreindre :

| Endroit | Comportement exigé |
| --- | --- |
| `src/lib/nav.ts` | un pôle n'a **pas de `href`** (`NavItem.href` optionnel) |
| Mega menu | le libellé du pôle est un titre, jamais un `<Link>` |
| Fil d'Ariane | le pôle est une étape **non cliquable** (`Crumb.href` absent) |
| Pied de page | intitulé de groupe + liens vers les seules sous-pages |
| `sitemap.ts` · recherche | les pôles sont exclus |

Ajouter une page à un pôle = ajouter un enfant dans `mainNav`, jamais recréer
le pôle. Aucune redirection n'est posée : une route pilier doit répondre 404.

---

## 4. Rythme et profondeur

| Type de page | Sections cibles |
| --- | --- |
| Page majeure (hub) | 8–12 |
| Page éditoriale secondaire | 5–8 |
| Page fonctionnelle | 3–6 |

Repères, **pas quotas**. Jamais de section ajoutée sans matière.

La profondeur vient de : photographies, contexte, chronologie, informations
pratiques, maillage éditorial — **jamais** de paragraphes de remplissage.

---

## 5. Politique de contenu — non négociable

| Situation | Traitement |
| --- | --- |
| Fait confirmé | Affiché tel quel |
| Contenu de démonstration déjà en place | Conservé, commenté comme démo |
| Contenu requis mais non fourni | `<ContentPending what="…" />` |

**Faits confirmés :** fondation 17 mars 2023 · Ecodim 2 juillet 2023 ·
Pasteur Manasse Mwamba (visionnaire) · Lubumbashi, RDC ·
adresse *Quartier Hewa Bora, Avenue Djoloko* ·
chorale *lundi 16h30–18h30, mercredi dans la nuit, samedi 16h30–18h30*.

**Ne jamais inventer :** témoignages, noms, biographies, responsables, horaires,
événements, statistiques, doctrine, dates, activités, lieux, résultats.

Aucune légende photographique affirmative : l'agent n'a pas d'analyse d'image.
Une légende n'est écrite que si elle n'affirme rien sur le contenu de la photo
(ex. `Centre Chrétien Jésus ma Vie — Lubumbashi`).

---

## 6. Photographie

- **Au moins 3 photographies** sur une page majeure, **au moins 1** sur une page
  secondaire ; aucune sur les pages fonctionnelles pures.
- Varier la mise en scène : pleine largeur, verticale, diptyque, galerie,
  éditoriale encadrée — **jamais toujours « l'image à droite du texte »**.
- Pas de galerie sur chaque page.
- Les images viennent de `@/data/mock/images` (`images`, `photoPool`,
  `galleryImages`).

---

## 7. Vérification avant de rendre une page

```powershell
npx tsc --noEmit        # doit sortir 0
npx eslint src          # doit sortir 0
```

Puis, sur le serveur de développement (`http://localhost:3000`) :

1. La page répond **200**.
2. Le héros n'est pas celui de la page pilote de même famille.
3. Aucun verset en fin de page s'il n'éclaire rien.
4. Les photographies s'affichent (chemins `/media/ccjv-XX.jpeg`).
5. Mobile : la composition tient sans débordement horizontal.

### Contraintes de code

- **JSX** : ne pas écrire `>` `"` `}` en texte brut (règle ESLint). Utiliser
  `→`, `«` `»`. Les apostrophes françaises `'` sont autorisées.
- Serveur par défaut ; `"use client"` seulement si indispensable.
- Ne jamais écrire de fichier via PowerShell (encodage) — utiliser l'outil
  d'écriture.
- Ne pas lancer `next build` si `npm run dev` tourne (conflit sur `.next`).
