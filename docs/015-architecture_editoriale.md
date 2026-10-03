# 015 — Architecture éditoriale : archétypes de composition

> **Statut :** spécification d'implémentation (précède le code).
> **Objet :** supprimer l'impression de « template unique reparamétré » sans
> toucher à l'identité visuelle CCJV.
> **Principe fondateur :** *le contenu et l'intention de la page dictent la
> composition ; la composition choisit ensuite les composants.* Jamais l'inverse.

---

## 1. Diagnostic (état avant refonte)

Audit exhaustif des **30 routes** — détail complet dans
`docs/014-audit_pages_refactor.md`.

Le squelette dominant était :

```text
PageHeader          → breadcrumb + croix + pôle + titre + description + VERSET + baie
Section (tone=light) → grille 6/6 : texte à gauche, photo 4:3 à droite
Section (tone=tinted)→ SectionHeading + grille de 3 cartes identiques
VerseSection (dark)  → verset plein écran, systématiquement en fin de page
```

Constats mesurés :

| Constat | Mesure |
| --- | --- |
| Squelettes distincts sur l'ensemble du site | **8** |
| Squelettes couvrant à eux seuls 25 des 30 routes | **3** |
| `PageHeader → Section → VerseSection` | 9 pages |
| `PageHeader → Section → Section(tinted) → VerseSection` | 10 pages |
| `PageHeader → Section(tinted) → Section → VerseSection` | 6 pages |
| Pages closes par `VerseSection` | **29 / 30** |
| Pages utilisant un héros `dark` | 0 |
| Photographies disponibles jamais rendues | **13 / 41** |
| Composants déclarés mais jamais importés | `EventCard`, `DepartmentCard`, `DepartmentFeature` |

Le problème n'est donc pas le style : c'est **l'ordre imposé**. Un verset en fin
de 29 pages sur 30 n'est plus un moment spirituel — c'est un gabarit.

---

## 2. Vocabulaire de composition

Les composants existants deviennent des **briques décorrélées**. Aucun n'impose
sa position. Trois niveaux :

### 2.1 Rythme — `Band`

`Band` remplace l'usage systématique de `Section`. Elle porte le **ton** et la
**respiration**, jamais l'ordre.

```tsx
<Band tone="light|dark|cream|tinted|green|bare"
      space="tight|normal|airy|silence|flush"
      width="container|wide|full"
      rule={false|"top"|"bottom"} />
```

| `space` | Usage |
| --- | --- |
| `tight` | Suite immédiate d'une section précédente (même sujet) |
| `normal` | Défaut |
| `airy` | Contenu court, besoin de présence |
| `silence` | Moment de pause visuelle, presque vide |
| `flush` | Aucun padding vertical (images pleine largeur, bandeaux) |

> `Section` reste exporté pour compatibilité mais ne doit plus être utilisé dans
> les nouvelles compositions.

### 2.2 Héros — 7 archétypes d'ouverture

| Composant | Type | Description | Mots |
| --- | --- | --- | --- |
| `HeroEditorial` | A | Breadcrumb · eyebrow · grand titre · intro · **image dominante à droite** (ratio 4:5) | ~120 |
| `HeroPhoto` | B | **Grande photographie pleine largeur**, surtitre et titre en surimpression basse, intro hors image | ~80 |
| `HeroCentered` | C | Breadcrumb · titre centré · intro courte · **verset encadré** · pas d'image | ~90 |
| `HeroSplit` | D | Texte large à gauche, **image verticale + image secondaire décalée** à droite | ~140 |
| `HeroImmersive` | E | Hauteur `88svh`, image plein cadre, **respiration** avant le titre, texte en bas | ~70 |
| `HeroPractical` | F | **Pas de photographie.** Titre compact + panneau d'informations utiles (horaires, lieu, contact) directement visible | ~60 |
| `HeroManifesto` | G | Grand titre, **déclaration**, citation biblique en très grand corps, filet | ~100 |

`PageHeader` (la « baie ») devient **un héros parmi d'autres** (`HeroArched`,
conservé sous son nom actuel pour ne pas casser les usages existants) et n'est
plus employé par défaut.

### 2.3 Briques éditoriales

| Composant | Rôle | Variantes |
| --- | --- | --- |
| `Prose` | Corps de texte long, mesure maîtrisée | `lead`, `dropcap`, `columns` |
| `FeatureImage` | Photographie mise en scène, avec légende | `full`, `wide`, `inset`, `arch`, `portrait`, `float` |
| `PhotoDuo` | Diptyque racontant une évolution | `equal`, `offset` |
| `PhotoGallery` | Galerie narrative | `mosaic`, `strip`, `columns` |
| `PullQuote` | Citation éditoriale (≠ verset) | `left`, `center`, `marginal` |
| `ScriptureBlock` | Verset **intégré** au flux | `inline`, `framed`, `marginal`, `wide`, `concluding` |
| `KeyFacts` | Informations pratiques en grille | `pairs`, `tiles`, `inline` |
| `ConvictionList` | Liste numérotée développée | `numbered`, `lettered` |
| `Chapter` | Chapitre narratif (n° + titre + texte + photo alternée) | `left`, `right`, `noPhoto` |
| `PortraitPanel` | Grand portrait + rôle + notice | `hero`, `side` |
| `PeopleGrid` | Annuaire de personnes (asymétrique) | `feature`, `compact` |
| `CrossLinks` | Maillage éditorial | `doors`, `list`, `inline` |
| `InfoPanel` | Lieu / horaires / accès / contact | `full`, `compact` |
| `StepsList` | Parcours en étapes | `horizontal`, `vertical` |
| `MediaFeature` | Grande vidéo YouTube mise en avant | `hero`, `inline` |
| `ContentPending` | Emplacement explicitement en attente de contenu CCJV | `block`, `inline` |

> **`VerseSection` et `CrossMark` ne sont plus automatiques.** Un verset se place
> là où il éclaire le propos — introduction, milieu, conclusion — ou pas du tout.
> La croix reste un signe fort mais cesse d'être un en-tête systématique.

---

## 3. Les 8 archétypes de page

Chaque archétype est un **shell de composition** : il fixe une séquence propre à
une intention, avec des emplacements nommés, tous optionnels sauf le héros et le
contenu principal. Une page peut toujours composer des briques brutes si aucun
archétype ne convient (cas de l'accueil).

| Archétype | Intention | Séquence interne |
| --- | --- | --- |
| `EditorialPage` | Développer un sujet | héros → intro `Prose` → rupture visuelle → corps → `PullQuote` → approfondissement → `ScriptureBlock` → `CrossLinks` |
| `NarrativePage` | Raconter | héros immersif/photo → `Prose` → `Chapter` alternés → `FeatureImage` → chronologie → épilogue |
| `ListingPage` | Indexer | en-tête compact → **élément principal** → liste éditoriale → archives → `CrossLinks` |
| `DetailPage` | Présenter un contenu | média en tête → métadonnées → corps `Prose` → galerie → contenus associés |
| `EventPage` | Donner envie et informer | photo → titre + date/lieu → description → `KeyFacts` pratiques → programme → galerie → événements associés |
| `MediaPage` | Regarder et écouter | `MediaFeature` → liste média éditoriale → `PhotoGallery` → albums |
| `DirectoryPage` | Présenter des personnes | intro → `PortraitPanel` → `PeopleGrid` → responsabilités → `CrossLinks` |
| `InformationPage` | Rendre service | `HeroPractical` → `InfoPanel` → `KeyFacts` → `StepsList` → contact |

---

## 4. Matrice route → archétype

### 4.1 Cible

| Route | Sujet | Intention | Archétype | Héros | Photos cible | Verset |
| --- | --- | --- | --- | --- | --- | --- |
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

### 4.2 Livré

> Le tableau ci-dessous reflète le **palier 1** : les pôles ne sont plus des
> pages (voir §4.5). Les sous-pages seules sont servies.

| Route | Archétype | Héros retenu |
| --- | --- | --- |
| `/` | composition libre (12 sections) | `Hero` d'accueil |
| `/qui-sommes-nous/ce-que-nous-croyons` | `EditorialPage` | `HeroManifesto` (dark) |
| `/qui-sommes-nous/d-ou-nous-venons` | `NarrativePage` | `HeroPhoto` (tall) |
| `/qui-sommes-nous/qui-nous-dirige` | `DirectoryPage` | `HeroEditorial` (cream) |
| `/vie-de-leglise/evenements` | `ListingPage` | `HeroPhoto` (normal) |
| `/vie-de-leglise/evenements/[slug]` | `EventPage` | `HeroPhoto` (tall) |
| `/vie-de-leglise/ou-nous-trouver` | `InformationPage` | `HeroPractical` |
| `/vie-de-leglise/faire-un-don` | `EditorialPage` | `HeroCentered` (cream) |
| `/communaute/groupes-de-maison` | `EditorialPage` | `HeroSplit` |
| `/communaute/parcours-nouveaux` | `EditorialPage` | `HeroCentered` (light) |
| `/communaute/priere` | `EditorialPage` | `HeroCentered` (dark) |
| `/communaute/temoignages` | `NarrativePage` | `HeroManifesto` (dark) |
| `/organisation/responsables` | `DirectoryPage` | `HeroPhoto` (tall) |
| `/organisation/departements` | `DirectoryPage` | `HeroCompact` |
| `/organisation/departements/[slug]` | `DetailPage` | `HeroPhoto` (normal) |
| `/publications/actualites` | `ListingPage` | `HeroCompact` |
| `/publications/enseignements` | `MediaPage` | `HeroCompact` (tinted) |
| `/publications/mediatheque` | `MediaPage` | `HeroImmersive` (center) |
| `/publications/ressources` | `ListingPage` | `HeroPractical` |
| `/publications/[slug]` | `DetailPage` | `HeroPhoto` (normal) |
| `/recherche` | `InformationPage` | `HeroPractical` |
| Pages légales (4) | `LegalPage` | — |

### 4.3 Bilan mesuré

| Indicateur | Avant | Après |
| --- | --- | --- |
| Héros distincts employés | 1 (`PageHeader`) | **8** |
| Archétypes employés | 1 (implicite) | **8** |
| Pages closes par un verset plein écran | 29 / 30 | **1** (`/`, où le verset ouvre la page) |
| Pages utilisant `PageHeader` | 24 / 30 | **0** |
| Photographies rendues (somme des pages) | — | **189** |
| Photographies du fonds utilisées | 28 / 41 | **32 / 41** |
| Emplacements `TODO — … À FOURNIR` assumés | 0 | **19** |
| Pages piliers servies | 5 | **0** |

### 4.4 Contrôle §19 — Accueil / D'où nous venons / Groupes de maison / Actualités

| Page | Héros | Archétype et composition | Photos |
| --- | --- | --- | --- |
| Accueil | immersif d'accueil | composition libre, scrollytelling des visages | 15 |
| D'où nous venons | `HeroPhoto` (tall) | narratif : 4 chapitres alternés + chronologie | 6 |
| Groupes de maison | `HeroSplit` + 2 photos décalées | éditorial : liste à filets + diptyque décalé | 5 |
| Actualités | `HeroCompact` (aucune photo) | index : « une » typographique + archives illustrées | 3 |

Aucune de ces quatre pages ne partage à la fois son héros, son archétype, son
nombre de sections **et** la position de ses images : remplacer le titre et le
texte de l'une par ceux d'une autre casserait visiblement la composition.

### 4.5 Palier 1 — un pôle n'est pas une destination

**Décision produit.** Seul l'accueil possède une page propre. « Qui sommes-nous »,
« Vie de l'Église », « Communauté », « Organisation » et « Publications & Médias »
sont des **regroupements** : ils nomment une famille de pages sans en être une.

Conséquences implémentées :

| Endroit | Comportement |
| --- | --- |
| `src/lib/nav.ts` | `NavItem.href` est **optionnel** : absent = pôle de regroupement |
| Mega menu (desktop) | le libellé du pôle est un titre, jamais un lien |
| Mega menu (mobile) | le pôle ouvre son sous-menu ; son en-tête n'est pas cliquable |
| Fil d'Ariane | le pôle reste une étape **non cliquable** (`Crumb.href` absent) |
| Pied de page | plan du site groupé : les pôles sont des intitulés, seules les sous-pages sont liées |
| `sitemap.ts` | seules les sous-pages sont indexées |
| Recherche | les pôles sont exclus de l'index |

**Aucune redirection n'a été posée** : les cinq routes piliers répondent
désormais 404, conformément à la règle « migrer directement, sans couche de
redirection ». Tous les liens internes qui les visaient ont été réécrits vers la
sous-page pertinente.

> **Contenu à replacer.** Les compositions des cinq pôles supprimés
> (chronologie de l'histoire, index visuel des départements, sommaire éditorial
> des rubriques, rythme de la semaine, scrollytelling des visages) n'ont pas été
> redistribuées : elles ont été retirées avec leur page. Une partie de cette
> matière existe déjà dans les sous-pages ; le reste peut être réaffecté sur
> demande.

---

## 5. Politique de contenu

Le contenu institutionnel **ne s'invente pas**.

| Situation | Traitement |
| --- | --- |
| Fait confirmé (fondation 17 mars 2023, Ecodim 2 juillet 2023, Pasteur Manasse Mwamba, Lubumbashi) | Affiché tel quel, mis en valeur |
| Fait fourni depuis : adresse *Quartier Hewa Bora, Avenue Djoloko* ; chorale *lundi 16h30–18h30, mercredi dans la nuit, samedi 16h30–18h30* | Intégré à `src/data/mock/site.ts` (`address`, `addressLines`, `choraleSchedule`, `weeklyRhythm` avec `confirmed: true`) |
| Contenu de démonstration déjà validé (événements, publications, départements) | Conservé, signalé comme démo |
| Contenu requis mais **non fourni** (confession de foi CCJV, témoignages réels, identités des responsables, statistiques) | `ContentPending` → `TODO — … À FOURNIR` |

Aucune légende photographique affirmative n'est écrite : l'agent n'a pas de
capacité d'analyse d'image, la correspondance photo → sujet reste à relire par
CCJV.

---

## 6. Profondeur éditoriale

| Type de page | Sections cibles |
| --- | --- |
| Page majeure (accueil, hubs) | 8–12 |
| Page éditoriale secondaire | 5–8 |
| Page fonctionnelle | 3–6 |
| Fiche de détail | variable |

Repères, **pas quotas**. Aucune section n'est ajoutée sans matière.

---

## 7. Ordre d'implémentation

1. `Band` + 7 héros + briques éditoriales *(fondations)*
2. Les 8 shells d'archétype
3. Données réelles nouvellement fournies
4. Pages pilotes : `/qui-sommes-nous`, `/communaute/groupes-de-maison`, `/publications/actualites`, `/vie-de-leglise/evenements/[slug]`
5. Vérification desktop + mobile, `tsc`, `eslint`
6. Généralisation aux 26 autres routes
