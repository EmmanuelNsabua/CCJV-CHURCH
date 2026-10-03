# 012 — Audit & Architecture de l'information (V3)

**Projet :** Centre Chrétien Jésus ma Vie (CCJV) — Lubumbashi, RDC
**Objet :** Transformation du site vitrine en plateforme publique de taille moyenne
**Étapes couvertes :** ÉTAPE 1 (Audit) · ÉTAPE 2 (Architecture)
**Statut :** Proposition — implémentation à démarrer après validation

---

# ÉTAPE 1 — AUDIT

## 1.1 État réel du dépôt (vérifié)

| Élément | État |
| --- | --- |
| Stack | Next.js 15.5.26 (App Router) · TypeScript strict · Tailwind CSS v4.3.3 |
| Routes publiques | `/`, `/qui-sommes-nous`, `/organisation`, `/evenements`, `/publications`, `/contact` |
| Route ajoutée récemment | `/organisation/chorale` — **ne compile pas** |
| Composants layout | `Header`, `Footer`, `FullscreenMenu` |
| Composants shared | `Section`, `SectionHeading`, `PageHeader`, `Reveal`, `CrossMark`, `OpenBookMark`, `VerseSection`, `BreathingPhoto`, `Timeline`, `WeekRhythm` |
| Composants ui | `Button`, `Badge`, `EmptyState` |
| Features | `events` (Card, Row, Featured), `departments` (Card, Feature), `publications` (Card), `pages` (Hero) |
| Données mock | `site`, `departments`, `events`, `publications`, `verses`, `images` |
| Médias | 41 photos (`public/media`, noms propres) + 41 originaux (`public/images`) + `logo.png` |
| Design System | Tokens Tailwind `@theme` (palette CCJV, Lora/Inter, easings) |

## 1.2 Forces à préserver

- **Design System cohérent** : palette validée, typographie Lora/Inter, tokens centralisés.
- **Motifs chrétiens déjà posés** : `CrossMark` (croix **visible**, variante `watermark` en filigrane) et `OpenBookMark` (livre ouvert, écho au logo) — conformes au §22.
- **Composants narratifs V2** : `VerseSection` (avec `context`), `BreathingPhoto`, `Timeline`, `WeekRhythm`, `FeaturedEvent`, `EventRow`.
- **`PageHeader` enrichi** : accepte désormais un `verse`, un `tone` sombre et un filigrane de croix.
- **Performance & accessibilité** : Server Components, `next/image`, `next/font` auto-hébergés, skip-link, focus visible, `prefers-reduced-motion`.
- **Séparation données / présentation** : mock typé aligné sur le futur contrat `/api/v1/*`.
- **Architecture par fonctionnalités** : `features/` + `components/{ui,layout,shared}`.

## 1.3 Limitations identifiées

| # | Limitation | Impact |
| --- | --- | --- |
| 1 | **Build cassé** — `/organisation/chorale` appelle `getDepartmentBySlug` et les champs `meetingSchedule`, `keyPoints`, `gallery`, `bannerImage` qui n'existent ni dans `departments.ts` ni dans le type `Department` (5 erreurs TS) | **Bloquant** |
| 2 | **IA plate** — 6 pages de même niveau, aucune hiérarchie hub / sous-page | Navigation limitée |
| 3 | **Aucune route dynamique** (`[slug]`) pour événements, départements, publications | Pas de fiches détaillées |
| 4 | **Navigation mono-niveau** — `mainNav` = 6 liens plats, pas de mega menu | Sous-pages inaccessibles |
| 5 | **Aucune page transversale** (légal, accessibilité, recherche) | Conformité / UX |
| 6 | **Aucun système d'introduction ni de transition** (§34–§36) | Rupture entre les pages |
| 7 | **Responsive par réduction** — peu de compositions mobiles réellement distinctes (§37–§42) | Expérience mobile pauvre |
| 8 | `sitemap.ts` ne liste que les 6 routes actuelles | SEO |
| 9 | Contenus partiellement en lorem ; versets réels non encore validés ; horaires de démonstration | Contenu |

## 1.4 Décisions déjà tranchées à conserver

- Palette, typographie, boutons carrés, cartes sans ombre, coins droits.
- Croix **visible** (pas de micro-trait invisible).
- Versets : **jamais inventés** (Louis Segond 1910 utilisé, à valider par CCJV).
- Aucun système de don / de prière **fabriqué** sans périmètre validé : prévoir le **point d'intégration**.

---

# ÉTAPE 2 — ARCHITECTURE DE L'INFORMATION

## 2.1 Sitemap cible

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

**Volume :** 3 routes racines existantes à migrer + 5 hubs + 16 sous-pages + 3 gabarits dynamiques + 5 pages transversales.

## 2.2 Migration des routes existantes

| Ancienne route | Nouvelle route | Traitement |
| --- | --- | --- |
| `/evenements` | `/vie-de-leglise/evenements` | Déplacée + redirection 308 |
| `/contact` | `/vie-de-leglise/ou-nous-trouver` | Déplacée + redirection 308 |
| `/organisation` | `/organisation` (hub) | Enrichie en hub |
| `/organisation/chorale` | `/organisation/departements/chorale` | **Modèle généralisé** en `[slug]` |
| `/publications` | `/publications` (hub) | Enrichie en hub |
| `/qui-sommes-nous` | `/qui-sommes-nous` (hub) | Enrichie en hub |

## 2.3 Navigation

- **Menu principal (6 entrées)** : Accueil · Qui sommes-nous · Vie de l'Église · Communauté · Organisation · Publications & Médias.
- **Mega menu plein écran** : chaque entrée déploie ses sous-pages (avec accroche courte par sous-page).
- **Navigation contextuelle** : sous-navigation en haut de chaque hub (onglets de section).
- **Breadcrumbs** sur les pages de niveau 2 et 3.
- **Liens transversaux** dans le footer (pages légales, accessibilité, recherche).
- **`mainNav` devient une structure à deux niveaux** dans `src/lib/nav.ts` (source unique : header, mega menu, footer, breadcrumbs, sitemap).

## 2.4 Gabarits dynamiques à créer

| Gabarit | Source | Génération |
| --- | --- | --- |
| `/vie-de-leglise/evenements/[slug]` | `events` | `generateStaticParams` + `generateMetadata` |
| `/organisation/departements/[slug]` | `departments` | idem (modèle issu de `/chorale`) |
| `/publications/[slug]` | `publications` | idem |

## 2.5 Extensions du modèle de données nécessaires

Pour que `/organisation/chorale` compile **et** que le gabarit `[slug]` soit générique, le type `Department` doit être étendu (les champs sont déjà utilisés par votre page) :

```ts
bannerImage?: string;          // image d'en-tête
meetingSchedule?: string;      // rythme de rencontre
keyPoints?: string[];          // piliers / valeurs
gallery?: string[];            // galerie photo réelle
```

Plus : `getDepartmentBySlug(slug)` et `getDepartmentBySlug` exportés depuis `src/data/mock/departments.ts`. Le même schéma sera repris par l'API (`/api/v1/departments`).
