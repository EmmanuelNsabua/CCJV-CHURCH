# 02 — Reusable component catalogue (frontend)

**Scope read (100% of file content, via `read` tool):**

- `frontend/src/components/**` — 48 `.tsx` + 1 `.ts` (`archetypes/rhythm.ts`) = 49 files
- `frontend/src/features/**` — 7 `.tsx`
- `frontend/src/lib/nav.ts`
- `frontend/src/types/index.ts`
- `frontend/src/app/globals.css`
- Consumer call sites: every `app/**/*.tsx` file that imports one of the above (read in full where a component has ≥2 consumers)

**Consumer counts** were produced mechanically: for each component basename, a multi-line-capable regex `import\s*(?:type\s*)?(\{[^}]*\}|[A-Za-z0-9_]+)\s*from\s*['"][^'"]*/<Basename>['"]` was run over the raw text of every `.ts`/`.tsx` file under `frontend/src`, excluding the defining file itself. Only real import statements count (a `data/mock` export named `communityFaces` is not a consumer of `CommunityFaces`).

**`kind` legend used below**

- `client` = file starts with `"use client"` (9 component/feature files do: `SearchClient`, `YouTubeThumb`, `CommunityFaces`, `Breadcrumbs`, `Reveal`, `ParallaxImage`, `Header`, `FullscreenMenu`, `PrayerRequestForm`)
- `server` = no directive, no hooks → React Server Component by default (may still render client children)
- `pure-visual` = no directive, no hooks, no data, no side effects — a pure presentational function. Marked as `server (pure-visual)`.

---

# 1. `src/components/archetypes/`

## COMPONENT: DetailPage
- **file**: `src/components/archetypes/DetailPage.tsx` (2288 bytes, 85 lines)
- **kind**: server (pure-visual, no directive)
- **Responsibility**: Archetype "page de contenu / fiche". Lays out media → summary → two-column body+aside → gallery → related, each wrapped in a `Band` whose vertical rhythm comes from `rhythmScale[rhythm]`.
- **Exact props type (verbatim)**:
```ts
export interface DetailPageProps {
  /** Bandeau média (`HeroPhoto`, `FeatureImage` variante `full`…). */
  media: ReactNode;
  /** Titre et métadonnées de la fiche. */
  summary?: ReactNode;
  /** Corps de lecture. */
  body?: ReactNode;
  /** Complément latéral : informations pratiques, repères. */
  aside?: ReactNode;
  /** Galerie associée au contenu. */
  gallery?: ReactNode;
  /** Contenus associés (même rubrique, même département). */
  related?: ReactNode;
  relatedTitle?: string;
  rhythm?: PageRhythm;
}
```
- **Destructured & rendered**: `media, summary, body, aside, gallery, related, relatedTitle, rhythm = "standard"` — all rendered. `rhythm` is consumed only as `rhythmScale[rhythm]` (never placed on the DOM).
- **Hardcoded internal content**: no literal French string, no image path, no href. Only class strings. The single literal is the default `rhythm = "standard"`.
- **Internal structure (JSX blocks in order)**:
  1. `<>` fragment
  2. `{media}` — raw node, no wrapper
  3. `<Band space={scale.close} tone="light">{summary}</Band>`
  4. `<Band space={scale.open} tone="light" rule="top">` → `<div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">` → `<div className="lg:col-span-7">{body}</div>` + `<div className="lg:col-span-4 lg:col-start-9">{aside}</div>`
  5. `<Band space={scale.open} tone="tinted">{gallery}</Band>`
  6. `<Band space={scale.open} tone="light" rule="top">` → optional `<h2>{relatedTitle}</h2>` + `{related}`
- **Conditional rendering**:
  - `{summary && (...)}` gates the summary Band
  - `{body && (...)}` gates the whole two-column body Band — **`aside` renders only inside it** (`{aside && <div className="lg:col-span-4 lg:col-start-9">{aside}</div>}`)
  - `{gallery && (...)}`, `{related && (...)}` gate their Bands
  - `{relatedTitle && (<h2 ...>{relatedTitle}</h2>)}` gates the related heading
- **Variants**: `rhythm?: PageRhythm` — 3 keys, resolved through `rhythmScale` (structure identical, only `Band space` differs):
  - `"dense"` → `{ close: "tight", open: "normal", wide: "airy" }`
  - `"standard"` (default) → `{ close: "normal", open: "airy", wide: "silence" }`
  - `"serene"` → `{ close: "airy", open: "silence", wide: "silence" }`
  - `wide` is **never read** by DetailPage (no `scale.wide` usage) — the record is shared, not local.
- **Fallbacks**: `rhythm = "standard"` when omitted. `aside` undefined → right column absent. `summary/body/gallery/related` undefined → their `Band` is not rendered at all (no empty placeholder). `relatedTitle` undefined → heading absent, `related` still rendered.
- **Consumers**:
  - `src/app/publications/[slug]/page.tsx:4`
- **Reuse breadth**: **1 consumer**

## COMPONENT: DirectoryPage
- **file**: `src/components/archetypes/DirectoryPage.tsx` (2331 bytes, 92 lines)
- **kind**: server (pure-visual, no directive)
- **Responsibility**: Archetype "page d'annuaire" — hero → intro → lead person → directory → responsibilities → related.
- **Exact props type (verbatim)**:
```ts
export interface DirectoryPageProps {
  hero: ReactNode;
  /** Ce que fait cette équipe, en quelques lignes. */
  intro?: ReactNode;
  /** Personne principale (`PortraitPanel`). */
  lead?: ReactNode;
  /** Annuaire (`PeopleGrid`). */
  directory?: ReactNode;
  directoryTitle?: string;
  /** Comment le service est organisé. */
  responsibilities?: ReactNode;
  responsibilitiesTitle?: string;
  /** Chemins vers les pages voisines. */
  related?: ReactNode;
  rhythm?: PageRhythm;
}
```
- **Destructured & rendered**: `hero, intro, lead, directory, directoryTitle, responsibilities, responsibilitiesTitle, related, rhythm = "standard"` — all rendered.
- **Hardcoded internal content**: no French literal, no image path, no href. Two inline heading class strings:
  - `"mb-12 font-sans text-[0.72rem] font-semibold tracking-[0.2em] text-ccjv-green uppercase"` (directoryTitle)
  - `"mb-10 text-[clamp(1.6rem,1rem+1.6vw,2.35rem)]"` (responsibilitiesTitle)
- **Internal structure**:
  1. `{hero}`
  2. `Band space={scale.close} tone="light"` → `{intro}`
  3. `Band space={scale.open} tone="light" rule="top"` → `{lead}`
  4. `Band space={scale.open} tone="cream"` → optional `<h2>{directoryTitle}</h2>` + `{directory}`
  5. `Band space={scale.open} tone="light"` → optional `<h2>{responsibilitiesTitle}</h2>` + `{responsibilities}`
  6. `Band space={scale.open} tone="tinted" rule="top"` → `{related}`
- **Conditional rendering**: `{intro && …}`, `{lead && …}`, `{directory && (… {directoryTitle && <h2…/>} …)}`, `{responsibilities && (… {responsibilitiesTitle && <h2…/>} …)}`, `{related && …}`
- **Variants**: `rhythm` — same 3-key `PageRhythm` record as DetailPage; only `close`/`open` are read (`wide` unused). Structure identical.
- **Fallbacks**: same pattern as DetailPage — every optional block is fully suppressed when undefined; `rhythm = "standard"`.
- **Consumers**: **NONE** (0 import statements found anywhere under `frontend/src`).
- **Reuse breadth**: **0 — dead code**. It is the only archetype nobody renders, despite naming `PortraitPanel` and `PeopleGrid` (both themselves also 0-consumer).

## COMPONENT: EventPage
- **file**: `src/components/archetypes/EventPage.tsx` (2224 bytes, 90 lines)
- **kind**: server (pure-visual, no directive)
- **Responsibility**: Archetype "page d'événement" — hero → summary → description → practical → program → gallery → related.
- **Exact props type (verbatim)**:
```ts
export interface EventPageProps {
  /** Photographie d'ouverture. */
  hero: ReactNode;
  /** Titre, date, lieu — repris sous l'image pour rester lisible. */
  summary?: ReactNode;
  /** Description de l'événement. */
  description?: ReactNode;
  /** Panneau pratique : heure, lieu, accès, inscription. */
  practical?: ReactNode;
  /** Programme / déroulé, si l'église en a fourni un. */
  program?: ReactNode;
  /** Photographies de l'édition précédente ou du même temps fort. */
  gallery?: ReactNode;
  /** Autres rendez-vous. */
  related?: ReactNode;
  rhythm?: PageRhythm;
}
```
- **Destructured & rendered**: `hero, summary, description, practical, program, gallery, related, rhythm = "standard"` — all rendered. Note `program` is declared and rendered but the sole consumer never passes it.
- **Hardcoded internal content**: no French literal, no image path, no href (pure `Band` composition).
- **Internal structure**:
  1. `{hero}`
  2. `Band space={scale.close} tone="light"` → `{summary}`
  3. `Band space={scale.close} tone="light"` → `{description}` (two consecutive `light` bands, no `rule`)
  4. `Band space={scale.open} tone="cream" rule="top"` → `{practical}`
  5. `Band space={scale.open} tone="light"` → `{program}`
  6. `Band space={scale.open} tone="light" rule="top"` → `{gallery}`
  7. `Band space={scale.open} tone="tinted" rule="top"` → `{related}`
- **Conditional rendering**: `{summary && …}`, `{description && …}`, `{practical && …}`, `{program && …}`, `{gallery && …}`, `{related && …}` — six independent `&&` gates, no ternary, no `.map`, no length check.
- **Variants**: `rhythm` (`dense`/`standard`/`serene`) → only `space` values change; `wide` unused.
- **Fallbacks**: omitted nodes suppress their whole `Band`. `rhythm = "standard"`.
- **Consumers**:
  - `src/app/vie-de-leglise/evenements/[slug]/page.tsx:4`
- **Reuse breadth**: **1 consumer**

## COMPONENT: InformationPage
- **file**: `src/components/archetypes/InformationPage.tsx` (2594 bytes, 102 lines)
- **kind**: server (pure-visual, no directive)
- **Responsibility**: Archetype "page d'information" — practical header → context → facts → optional full-width photo → steps → contact → related.
- **Exact props type (verbatim)**:
```ts
export interface InformationPageProps {
  /** En-tête pratique (`HeroPractical`). */
  header: ReactNode;
  /** Contexte : pourquoi ces informations, à qui elles servent. */
  context?: ReactNode;
  /** Faits structurés (`KeyFacts`, `WeekRhythm`, panneau d'horaires). */
  facts?: ReactNode;
  factsTitle?: string;
  /** Marche à suivre (venir pour la première fois, demander un don…). */
  steps?: ReactNode;
  stepsTitle?: string;
  /** Contact / accès / accompagnement. */
  contact?: ReactNode;
  /** Photographie de contexte, une seule, si elle aide vraiment. */
  photo?: ReactNode;
  /** Ouverture vers le reste du site. */
  related?: ReactNode;
  rhythm?: PageRhythm;
}
```
- **Destructured & rendered**: `header, context, facts, factsTitle, steps, stepsTitle, contact, photo, related, rhythm = "dense"` — all rendered. **Default rhythm is `"dense"`, not `"standard"`** (the only archetype with a non-`standard` default besides `ListingPage` and `NarrativePage`).
- **Hardcoded internal content**: no French literal, no image path, no href. Repeated heading class `"mb-10 text-[clamp(1.6rem,1rem+1.6vw,2.35rem)]"` appears twice (factsTitle, stepsTitle).
- **Internal structure**:
  1. `{header}`
  2. `Band space={scale.open} tone="light"` → `{context}`
  3. `Band space={scale.close} tone="light" rule="top"` → optional `<h2>{factsTitle}</h2>` + `{facts}`
  4. `Band space={scale.close} tone="light" width="full"` → `{photo}` ← the **only** archetype band using `width="full"`
  5. `Band space={scale.open} tone="tinted"` → optional `<h2>{stepsTitle}</h2>` + `{steps}`
  6. `Band space={scale.open} tone="cream" rule="top"` → `{contact}`
  7. `Band space={scale.close} tone="light" rule="top"` → `{related}`
- **Conditional rendering**: `{context && …}`, `{facts && (…{factsTitle && <h2…/>}…)}`, `{photo && …}`, `{steps && (…{stepsTitle && <h2…/>}…)}`, `{contact && …}`, `{related && …}`
- **Variants**: `rhythm` — default `"dense"`. Only `close`/`open` read.
- **Fallbacks**: optional blocks suppressed; `rhythm = "dense"`; `factsTitle`/`stepsTitle` undefined → headings suppressed while the body still renders.
- **Consumers**:
  - `src/app/recherche/page.tsx:2` (passes `rhythm="dense"`, `factsTitle`, `facts={<SearchClient entries={entries} />}`, `related`)
- **Reuse breadth**: **1 consumer**

## COMPONENT: ListingPage
- **file**: `src/components/archetypes/ListingPage.tsx` (2322 bytes, 85 lines)
- **kind**: server (pure-visual, no directive)
- **Responsibility**: Archetype "page d'index" — compact header → lead item → editorial list → archives → related.
- **Exact props type (verbatim)**:
```ts
export interface ListingPageProps {
  /** En-tête compact (`HeroPractical`, `HeroEditorial` allégé…). */
  header: ReactNode;
  /** Élément principal — un seul, présenté en grand. */
  lead?: ReactNode;
  /** Corps de liste (lignes éditoriales, grille éditoriale…). */
  list?: ReactNode;
  /** Intitulé de la liste, affiché au-dessus. */
  listTitle?: string;
  /** Entrées plus anciennes, traitées différemment de la liste courante. */
  archives?: ReactNode;
  archivesTitle?: string;
  /** Ouverture vers les autres rubriques. */
  related?: ReactNode;
  rhythm?: PageRhythm;
}
```
- **Destructured & rendered**: `header, lead, list, listTitle, archives, archivesTitle, related, rhythm = "dense"` — all rendered.
- **Hardcoded internal content**: no French literal, no image path, no href. Two heading classes:
  - listTitle: `"mb-10 border-b border-ccjv-line pb-4 font-sans text-[0.72rem] font-semibold tracking-[0.2em] text-ccjv-green uppercase"`
  - archivesTitle: `"mb-8 font-sans text-[0.72rem] font-semibold tracking-[0.2em] text-ccjv-ink-secondary uppercase"` (same recipe, muted colour, no border)
- **Internal structure**:
  1. `{header}`
  2. `Band space={scale.open} tone="light" width="wide"` → `{lead}`
  3. `Band space={scale.close} tone="light"` → optional `<h2>{listTitle}</h2>` + `{list}`
  4. `Band space={scale.close} tone="tinted" rule="top"` → optional `<h2>{archivesTitle}</h2>` + `{archives}`
  5. `Band space={scale.open} tone="light" rule="top"` → `{related}`
- **Conditional rendering**: `{lead && …}`, `{list && (…{listTitle && <h2…/>}…)}`, `{archives && (…{archivesTitle && <h2…/>}…)}`, `{related && …}`
- **Variants**: `rhythm` (default `"dense"`); only `close`/`open` read.
- **Fallbacks**: omitted blocks suppressed; titles suppressed independently of bodies.
- **Consumers**:
  - `src/app/publications/actualites/page.tsx:4`
  - `src/app/publications/ressources/page.tsx:3`
- **Reuse breadth**: **2-5 consumers (2)**

### Consumer prop-shape divergence — `ListingPage`
Both consumers pass the same 8 prop *names* but very different node shapes:
- `actualites/page.tsx:40-206` passes `lead` wrapping `<FeatureImage className="mt-16" variant="wide" src={images.fraternite} caption="Centre Chrétien Jésus ma Vie — Lubumbashi" />`, `listTitle="Autres actualités"`, `archivesTitle="Également publié sur le site"`, **no `rhythm` prop**, `related={<CrossLinks variant="inline" items={[…]} />}`.
- `ressources/page.tsx:60-226` passes `rhythm="dense"`, `archivesTitle="Comment utiliser ces ressources"` with `archives` = a **two-column grid** containing `<FeatureImage src={images.predication} variant="wide" />` + `<StepsList variant="vertical" steps={steps} />`, and `related` as a **fragment of three nodes** (`<p>`, `<h2>`, `<CrossLinks variant="list" …>`) rather than a single component. `actualites` passes a bare `<CrossLinks>`; `ressources` passes a `<></>` with an overline + heading + `<CrossLinks>`.
- Both pass a fully hand-rolled `lead` article, one wrapping `FeatureImage` inside it (`actualites`) and one not (`ressources`).

## COMPONENT: MediaPage
- **file**: `src/components/archetypes/MediaPage.tsx` (2605 bytes, 98 lines)
- **kind**: server (pure-visual, no directive)
- **Responsibility**: Archetype "page média" — hero → featured media → listing → gallery (on dark) → collections → related.
- **Exact props type (verbatim)**:
```ts
export interface MediaPageProps {
  hero: ReactNode;
  /** Contenu média mis en avant (vidéo du dernier enseignement…). */
  featured?: ReactNode;
  /** Liste média : titre, orateur, date, durée. */
  listing?: ReactNode;
  listingTitle?: string;
  /** Galerie photographique — uniquement si des photos existent. */
  gallery?: ReactNode;
  galleryTitle?: string;
  /** Regroupements thématiques (séries, albums). */
  collections?: ReactNode;
  collectionsTitle?: string;
  /** Ouverture vers les rubriques voisines. */
  related?: ReactNode;
  rhythm?: PageRhythm;
}
```
- **Destructured & rendered**: `hero, featured, listing, listingTitle, gallery, galleryTitle, collections, collectionsTitle, related, rhythm = "standard"` — all rendered.
- **Hardcoded internal content**: no French literal, no image path, no href. Three near-identical heading classes using the `text-[0.72rem] … tracking-[0.2em] uppercase` recipe, differing only in colour token: `text-ccjv-green` (listingTitle, collectionsTitle) vs `text-ccjv-cream` (galleryTitle, because its Band is `tone="dark"`).
- **Internal structure**:
  1. `{hero}`
  2. `Band space={scale.open} tone="light" width="wide"` → `{featured}`
  3. `Band space={scale.close} tone="light" rule="top"` → optional `<h2>{listingTitle}</h2>` + `{listing}`
  4. `Band space={scale.open} tone="dark" width="wide"` → optional `<h2>{galleryTitle}</h2>` + `{gallery}`
  5. `Band space={scale.open} tone="light" rule="top"` → optional `<h2>{collectionsTitle}</h2>` + `{collections}`
  6. `Band space={scale.open} tone="tinted" rule="top"` → `{related}`
- **Conditional rendering**: `{featured && …}`, `{listing && (…{listingTitle && <h2…/>}…)}`, `{gallery && (…{galleryTitle && <h2…/>}…)}`, `{collections && (…{collectionsTitle && <h2…/>}…)}`, `{related && …}`
- **Variants**: `rhythm` (default `"standard"`); only `close`/`open` read.
- **Fallbacks**: same suppression pattern.
- **Consumers**:
  - `src/app/publications/enseignements/page.tsx:3`
  - `src/app/publications/mediatheque/page.tsx:4`
- **Reuse breadth**: **2-5 consumers (2)**

### Consumer prop-shape divergence — `MediaPage`
- `enseignements/page.tsx:51-197` passes `hero={<HeroCompact tone="tinted" … />}` i.e. a **no-photo header**, plus `listingTitle="Toutes les prédications"`, `galleryTitle="En images"`, `gallery={<PhotoGallery variant="strip" images={photoPool.slice(0, 3)} />}`, `collectionsTitle="Séries et thèmes"` with `collections={<ContentPending what="Séries et thèmes des prédications" hint="…" />}`.
- `mediatheque/page.tsx:54-175` passes `hero={<HeroImmersive align="center" … image={images.communaute} caption="Centre Chrétien Jésus ma Vie — Lubumbashi" />}` i.e. a **full-bleed photo hero**, plus `galleryTitle="Galerie"`, `gallery` = a fragment with **two** `PhotoGallery` instances (`variant="mosaic"` + `variant="columns" className="mt-16 lg:mt-20"`), `collectionsTitle="Albums publiés"` with a real `<ul>` of album links, and `featured` = a fragment of `<Prose>` + `<MediaFeature variant="hero" … />` **or** `<EmptyState>` — while `enseignements` passes `featured` as a single `MediaFeature`-or-`EmptyState` ternary.
- `mediatheque` additionally passes `rhythm="standard"` explicitly; `enseignements` also passes `rhythm="standard"` explicitly. Both pass `related` as a `<></>` fragment with an overline `<p>` + `<h2>` + `<CrossLinks variant="inline">`.

## COMPONENT: NarrativePage
- **file**: `src/components/archetypes/NarrativePage.tsx` (2143 bytes, 88 lines)
- **kind**: server (pure-visual, no directive)
- **Responsibility**: Archetype "page narrative" — hero → prologue → alternating chapters → full-bleed break photo → chronology → dark epilogue → related.
- **Exact props type (verbatim)**:
```ts
export interface NarrativePageProps {
  hero: ReactNode;
  /** Prologue : d'où l'on part. */
  prologue?: ReactNode;
  /** Chapitres numérotés (`Chapter`), dans l'ordre du récit. */
  chapters?: ReactNode;
  /** Photographie pleine largeur, comme un temps de respiration. */
  feature?: ReactNode;
  /** Repères datés (`Timeline`). */
  chronology?: ReactNode;
  /** Écriture ou parole qui referme le récit. */
  epilogue?: ReactNode;
  /** Suite naturelle. */
  related?: ReactNode;
  rhythm?: PageRhythm;
}
```
- **Destructured & rendered**: `hero, prologue, chapters, feature, chronology, epilogue, related, rhythm = "serene"` — all rendered.
- **Hardcoded internal content**: no French literal, no image path, no href. One inline class: `"flex flex-col gap-[clamp(3.5rem,8vw,7rem)]"` wrapping `chapters`.
- **Internal structure**:
  1. `{hero}`
  2. `Band space={scale.open} tone="light"` → `{prologue}`
  3. `Band space={scale.wide} tone="light" rule="top"` → `<div className="flex flex-col gap-[clamp(3.5rem,8vw,7rem)]">{chapters}</div>`
  4. `Band space="flush" tone="light" width="full"` → `{feature}` ← **hardcoded `space="flush"`**, and the only archetype using `space="flush"`
  5. `Band space={scale.wide} tone="cream"` → `{chronology}`
  6. `Band space={scale.wide} tone="dark"` → `{epilogue}` ← only archetype with a `tone="dark"` band
  7. `Band space={scale.open} tone="light" rule="top"` → `{related}`
- **Conditional rendering**: `{prologue && …}`, `{chapters && …}`, `{feature && …}`, `{chronology && …}`, `{epilogue && …}`, `{related && …}`
- **Variants**: `rhythm` (default `"serene"`) — **this is the only archetype that reads `scale.wide`** (blocks 3, 5, 6), so `wide` is meaningful only here.
- **Fallbacks**: suppressed blocks; `rhythm = "serene"`.
- **Consumers**:
  - `src/app/communaute/temoignages/page.tsx:3`
- **Reuse breadth**: **1 consumer**

## FILE: `src/components/archetypes/rhythm.ts`
- **file**: `src/components/archetypes/rhythm.ts` (732 bytes, 19 lines) — **not a component**
- **kind**: pure data module (type + record), no JSX, no directive
- **Exports (verbatim)**:
```ts
export type PageRhythm = "dense" | "standard" | "serene";

export const rhythmScale: Record<
  PageRhythm,
  { close: BandSpace; open: BandSpace; wide: BandSpace }
> = {
  dense: { close: "tight", open: "normal", wide: "airy" },
  standard: { close: "normal", open: "airy", wide: "silence" },
  serene: { close: "airy", open: "silence", wide: "silence" },
};
```
- **Consumed by**: all 7 archetypes (`DetailPage:3`, `DirectoryPage:3`, `EventPage:3`, `InformationPage:3`, `ListingPage:3`, `MediaPage:3`, `NarrativePage:3`) — the only module in this folder with 6+ consumers. It imports the type `BandSpace` from `@/components/composition/Band`, coupling `archetypes` → `composition`.
- **Note**: only `NarrativePage` reads `wide`; the other six read `close`/`open` only, so 7 of the 21 record values are dead.

---

# 2. `src/components/composition/`

## COMPONENT: Band
- **file**: `src/components/composition/Band.tsx` (2378 bytes, 99 lines)
- **kind**: server (pure-visual, no directive)
- **Responsibility**: The site's vertical-rhythm primitive. Renders a `<section>` carrying tone, vertical padding, an optional hairline rule, and an inner width wrapper. Nothing else.
- **Exact props type (verbatim)**:
```ts
export type BandTone =
  | "light"
  | "cream"
  | "tinted"
  | "dark"
  | "green"
  | "bare";

export type BandSpace =
  | "flush"
  | "tight"
  | "normal"
  | "airy"
  | "silence";

export type BandWidth = "container" | "wide" | "full";

export interface BandProps {
  tone?: BandTone;
  space?: BandSpace;
  width?: BandWidth;
  /** Filet de séparation — hairline, jamais une ombre. */
  rule?: "top" | "bottom" | "both";
  id?: string;
  className?: string;
  innerClassName?: string;
  children: ReactNode;
  "aria-labelledby"?: string;
  "aria-label"?: string;
}
```
- **Destructured & rendered**: `tone = "light"`, `space = "normal"`, `width = "container"`, `rule`, `id`, `className`, `innerClassName`, `children`, `...rest` (spread onto `<section>`, carrying the two `aria-*` keys).
- **Hardcoded internal content**: no French literal, no image path, no href. Sub-`id` is passed in.
- **Internal structure**:
  1. `<section id={id} className={cn("relative", toneClass[tone], spaceClass[space], rule === "top" && cn("border-t", ruleColor), rule === "bottom" && cn("border-b", ruleColor), rule === "both" && cn("border-y", ruleColor), className)} {...rest}>`
  2. `<div className={cn(widthClass[width], innerClassName)}>{children}</div>`
- **Conditional rendering**:
  - `rule === "top" && cn("border-t", ruleColor)`
  - `rule === "bottom" && cn("border-b", ruleColor)`
  - `rule === "both" && cn("border-y", ruleColor)`
  - derived boolean: `const onDeepTone = tone === "dark" || tone === "green";` → `const ruleColor = onDeepTone ? "border-white/12" : "border-ccjv-line";`
  - No `.map`, no ternary in JSX, no length check.
- **Variants — 3 independent axes, structure never changes (styling only)**:
  - `toneClass` (`Record<BandTone, string>`, 6 keys literal):
    - `light`: `"bg-ccjv-offwhite text-ccjv-ink"`
    - `cream`: `"bg-ccjv-cream text-ccjv-ink"`
    - `tinted`: `"bg-ccjv-green-soft text-ccjv-ink"`
    - `dark`: `"bg-ccjv-black text-white"`
    - `green`: `"bg-ccjv-green text-white"`
    - `bare`: `""` (no background, no text colour → inherits)
  - `spaceClass` (`Record<BandSpace, string>`, 5 keys literal):
    - `flush`: `""`
    - `tight`: `"py-12 max-md:py-9"`
    - `normal`: `"py-20 max-md:py-14"`
    - `airy`: `"py-28 max-md:py-18"`
    - `silence`: `"py-36 max-md:py-24"`
  - `widthClass` (`Record<BandWidth, string>`, 3 keys literal):
    - `container`: `"mx-auto w-full max-w-[1200px] px-[clamp(16px,4vw,48px)]"`
    - `wide`: `"mx-auto w-full max-w-[1480px] px-[clamp(16px,3vw,40px)]"`
    - `full`: `"w-full"`
  - `rule`: `"top" | "bottom" | "both"` (plus `undefined` → no border). `ruleColor` flips on the `dark`/`green` tones only.
- **Fallbacks**: `tone ?? "light"`, `space ?? "normal"`, `width ?? "container"`. `rule` undefined → no border class at all (falsy `&&` yields `false`, which `cn` drops). `id`/`className`/`innerClassName` undefined → no attribute / `undefined` class. `children` is **required** (no fallback).
- **Consumers** (8 import statements, 7 actually render it):
  - `src/components/archetypes/DetailPage.tsx:2`
  - `src/components/archetypes/DirectoryPage.tsx:2`
  - `src/components/archetypes/EventPage.tsx:2`
  - `src/components/archetypes/InformationPage.tsx:2`
  - `src/components/archetypes/ListingPage.tsx:2`
  - `src/components/archetypes/MediaPage.tsx:2`
  - `src/components/archetypes/NarrativePage.tsx:2`
  - `src/components/archetypes/rhythm.ts:1` (type-only: `import type { BandSpace }`)
- **Reuse breadth**: **6+ consumers (8 imports / 7 renderers)** — the most reused composition primitive, but reachable **only** through archetypes; no `app/**` page imports it directly.

## COMPONENT: HeroCompact
- **file**: `src/components/composition/HeroCompact.tsx` (2202 bytes, 67 lines)
- **kind**: server (renders the client `Breadcrumbs` as a child)
- **Responsibility**: Compact page header for index pages — two columns, no photograph, overline + title on the left, intro/aside on the right, separated by a bottom hairline.
- **Exact props type (verbatim)**:
```ts
export interface HeroCompactProps {
  overline: string;
  title: string;
  intro?: string;
  /** Repères alignés à droite du titre (nombre d'entrées, dernière mise à jour…). */
  aside?: ReactNode;
  tone?: "light" | "tinted";
}
```
- **Destructured & rendered**: `overline, title, intro, aside, tone = "light"` — all rendered.
- **Hardcoded internal content**: no French literal, no image path, no href. Includes `<Breadcrumbs className="mb-4" />` with a hardcoded class.
- **Internal structure**:
  1. `<div className={cn("border-b border-ccjv-line", tone === "tinted" ? "bg-ccjv-green-soft" : "bg-ccjv-offwhite")}>`
  2. `<div className="container">`
  3. `<div className="pt-[calc(72px+clamp(1.75rem,3.5vw,2.75rem))] pb-[clamp(1.75rem,3vw,2.5rem)]">` ← **hardcoded 72px header offset**
  4. `<Breadcrumbs className="mb-4" />`
  5. `<div className="grid grid-cols-1 items-end gap-8 lg:grid-cols-12 lg:gap-14">`
  6. left `lg:col-span-6` → overline row (`<span className="h-px w-8 bg-ccjv-green" aria-hidden="true" />` + `<p>`), then `<h1 className="mt-4 text-[clamp(1.9rem,1rem+2.2vw,3rem)] leading-[1.08] font-semibold">{title}</h1>`
  7. right `lg:col-span-6 lg:col-start-7` → `{intro}` `<p className="max-w-[52ch] text-[1.0625rem] leading-[1.65] text-ccjv-ink-secondary">`, then `<div className="mt-5">{aside}</div>`
- **Conditional rendering**:
  - `{(intro || aside) && (<div className="lg:col-span-6 lg:col-start-7">…)}` — gates the entire right column
  - `{intro && (<p …>{intro}</p>)}`
  - `{aside && <div className="mt-5">{aside}</div>}`
  - `tone === "tinted" ? "bg-ccjv-green-soft" : "bg-ccjv-offwhite"` — ternary
- **Variants**: `tone?: "light" | "tinted"` — 2 keys, **styling only**:
  - `"light"` (default) → `"bg-ccjv-offwhite"`
  - `"tinted"` → `"bg-ccjv-green-soft"`
  - No `size`/`align`. Structure identical for both.
- **Fallbacks**: `tone = "light"`; `intro` and `aside` both undefined → the whole right column is omitted (no empty grid cell). No array props, so no empty-array behaviour.
- **Consumers**:
  - `src/app/publications/actualites/page.tsx:3`
  - `src/app/publications/enseignements/page.tsx:2`
- **Reuse breadth**: **2-5 consumers (2)**

### Consumer prop-shape divergence — `HeroCompact`
- `actualites/page.tsx:42-53` — **no `tone` prop**, `aside` is a `<p className="font-sans text-[0.8rem] text-ccjv-ink-secondary">` counting items with a `formatLongDate(lead.publishedAt)` suffix.
- `enseignements/page.tsx:54-68` — passes **`tone="tinted"`**, same `aside` recipe but with `le plus récent le ${formatLongDate(featured.publishedAt)}`.
  So one page renders the offwhite header and the other the green-soft header on structurally identical index pages.

## COMPONENT: HeroImmersive
- **file**: `src/components/composition/HeroImmersive.tsx` (2503 bytes, 91 lines)
- **kind**: server
- **Responsibility**: 88svh full-bleed photo hero; the photograph is shown before the title is named. Overline → title → text → children, then a bottom caption.
- **Exact props type (verbatim)**:
```ts
export interface HeroImmersiveProps {
  overline: string;
  title: string;
  text?: string;
  image: string;
  /** Légende discrète en bas de cadre. */
  caption?: string;
  align?: "bottom" | "center";
  children?: ReactNode;
}
```
- **Destructured & rendered**: `overline, title, text, image, caption, align = "bottom", children` — all rendered.
- **Hardcoded internal content**: no French literal, no image path, no href. `<Image src={image} alt="" fill priority sizes="100vw" className="object-cover" />` — `alt` is hardcoded to `""`.
- **Internal structure**:
  1. `<div className="relative h-[88svh] min-h-[32rem] w-full overflow-hidden bg-ccjv-black">`
  2. `<Image … fill priority sizes="100vw" className="object-cover" />`
  3. overlay `<div>` with `aria-hidden="true"`
  4. `<div className={cn("relative flex h-full", align === "center" ? "items-center" : "items-end")}>`
  5. `<div className="container pb-[clamp(3rem,7vw,6rem)]">`
  6. `<Breadcrumbs tone="dark" />` ← **tone hardcoded dark**
  7. `<div className="mt-[clamp(2rem,6vw,5rem)]">` → overline `<p>`, `<h1>`, `{text && <p>}`, `{children && <div className="mt-9">{children}</div>}`
  8. `{caption && <p className="mt-12 font-sans text-[0.72rem] tracking-[0.06em] text-white/45">{caption}</p>}`
- **Conditional rendering**:
  - `align === "center" ? "bg-ccjv-black/62" : "bg-gradient-to-t from-ccjv-black/92 via-ccjv-black/40 to-ccjv-black/55"` (overlay ternary)
  - `align === "center" ? "items-center" : "items-end"` (flex alignment ternary)
  - `{text && (<p …>{text}</p>)}`
  - `{children && <div className="mt-9">{children}</div>}`
  - `{caption && (<p …>{caption}</p>)}`
- **Variants**: `align?: "bottom" | "center"` — 2 keys, **styling only** (vertical alignment + overlay opacity/gradient). Both keys render the identical JSX tree (image, breadcrumbs, overline, h1, text, children, caption).
  - `"bottom"` (default) → `items-end` + linear gradient overlay
  - `"center"` → `items-center` + flat `bg-ccjv-black/62` overlay
- **Fallbacks**: `align = "bottom"`; `text`/`caption`/`children` undefined → those nodes are absent (no placeholder). `overline`, `title`, `image` are required.
- **Consumers**:
  - `src/app/publications/mediatheque/page.tsx:3`
- **Reuse breadth**: **1 consumer**

## COMPONENT: HeroManifesto
- **file**: `src/components/composition/HeroManifesto.tsx` (4080 bytes, 125 lines)
- **kind**: server
- **Responsibility**: Type-G "manifesto" hero — no image. Left column: cross mark + overline + title + declaration + children. Right column: a large scripture blockquote with reference, plus a hardcoded translation credit.
- **Exact props type (verbatim)**:
```ts
export interface HeroManifestoProps {
  overline: string;
  title: string;
  /** Déclaration d'ouverture, en une ou deux phrases. */
  declaration?: string;
  scripture: { text: string; reference: string };
  /** Précision éditoriale sous la référence (contexte du verset). */
  scriptureContext?: string;
  tone?: "dark" | "cream";
  children?: ReactNode;
}
```
- **Destructured & rendered**: `overline, title, declaration, scripture, scriptureContext, tone = "dark", children` — all rendered.
- **Hardcoded internal content**:
  - **French literal (always rendered, not conditional)**: `Traduction Louis Segond 1910.` (`HeroManifesto.tsx:117`)
  - French quotes hardcoded around the verse: `«&nbsp;{scripture.text}&nbsp;»` (line 105)
  - No image path, no href.
- **Internal structure**:
  1. `<div className={cn("relative overflow-hidden", isDark ? "bg-ccjv-black text-white" : "bg-ccjv-cream text-ccjv-ink")}>`
  2. `<div className="container">` → padding `pt-[calc(72px+clamp(2.5rem,5vw,4rem))] pb-[clamp(3rem,7vw,6rem)]` ← **hardcoded 72px offset**
  3. `<Breadcrumbs tone={isDark ? "dark" : "light"} />`
  4. grid `lg:grid-cols-12`:
     - left `lg:col-span-5`: overline row (`<CrossMark size="md" className={accent} />` + `<p>`), `<h1>`, `{declaration && <p className="lead mt-7 max-w-[46ch]">}`, `{children && <div className="mt-9">}`
     - right `lg:col-span-6 lg:col-start-7`: `<figure>` → `<div className={cn("border-l-2 pl-7", isDark ? "border-ccjv-cream/50" : "border-ccjv-green/50")}>` → `{scriptureContext && <p>}`, `<blockquote>«&nbsp;{text}&nbsp;»</blockquote>`, `<figcaption>{scripture.reference}</figcaption>`, then always `<p className="mt-6 max-w-[40ch] text-[0.82rem] leading-relaxed">Traduction Louis Segond 1910.</p>`
- **Conditional rendering**:
  - `tone === "dark"` drives `const isDark` → `accent`/`muted` ternaries, background ternary, `Breadcrumbs tone` ternary, `border-*` ternary, `text-white` on h1, `text-white/72` on declaration, blockquote colour ternary
  - `{declaration && (<p …>{declaration}</p>)}`
  - `{children && <div className="mt-9">{children}</div>}`
  - `{scriptureContext && (<p …>{scriptureContext}</p>)}`
- **Variants**: `tone?: "dark" | "cream"` — 2 keys, **styling only**. Structure (breadcrumbs / overline row / h1 / declaration / children / figure with blockquote + figcaption) is byte-for-byte the same for both:
  - `"dark"` (default) → `bg-ccjv-black text-white`, `accent = "text-ccjv-cream"`, `muted = "text-white/70"`, `border-ccjv-cream/50`, `Breadcrumbs tone="dark"`
  - `"cream"` → `bg-ccjv-cream text-ccjv-ink`, `accent = "text-ccjv-green"`, `muted = "text-ccjv-ink-secondary"`, `border-ccjv-green/50`, `Breadcrumbs tone="light"`
  - No `size`/`align`.
- **Fallbacks**: `tone = "dark"`; `declaration`, `children`, `scriptureContext` undefined → nodes absent. `scripture` is **required** (an object with `text` + `reference`); if a consumer omits it, TypeScript fails — there is no runtime guard, and the blockquote/figcaption would render `« ` + `undefined` + ` »`. The `Traduction Louis Segond 1910.` paragraph renders unconditionally.
- **Consumers**:
  - `src/app/communaute/temoignages/page.tsx:2`
- **Reuse breadth**: **1 consumer**

## COMPONENT: HeroPhoto
- **file**: `src/components/composition/HeroPhoto.tsx` (2985 bytes, 96 lines)
- **kind**: server
- **Responsibility**: Type-B photographic hero — full-bleed photograph with the title *inside* the image, and the intro rejected below the image in an offset column.
- **Exact props type (verbatim)**:
```ts
export interface HeroPhotoProps {
  overline: string;
  title: string;
  /** Rejeté sous la photographie, dans une colonne décalée. */
  intro?: string;
  image: string;
  /** Légende posée sur l'image (crédit, lieu, date). */
  caption?: string;
  /** Hauteur du cadre. `tall` pour un moment immersif. */
  height?: "normal" | "tall";
  /** Actions alignées avec l'introduction. */
  children?: ReactNode;
}
```
- **Destructured & rendered**: `overline, title, intro, image, caption, height = "normal", children` — all rendered.
- **Hardcoded internal content**: no French literal, no image path, no href. `<Image src={image} alt="" fill priority sizes="100vw" className="object-cover" />` (`alt=""` hardcoded).
- **Internal structure**:
  1. `<div className="bg-ccjv-offwhite">`
  2. image frame `<div className={cn("relative w-full overflow-hidden bg-ccjv-black", height === "tall" ? "h-[82svh] min-h-[30rem]" : "h-[62svh] min-h-[24rem]")}>`
  3. `<Image … />`
  4. gradient overlay `<div className="absolute inset-0 bg-gradient-to-t from-ccjv-black/88 via-ccjv-black/35 to-ccjv-black/45" aria-hidden="true" />`
  5. `<div className="relative flex h-full items-end">` → `<div className="container pb-12 max-md:pb-9">` → `<Breadcrumbs tone="dark" />`
  6. overline row: `<span className="h-px w-10 bg-ccjv-cream" aria-hidden="true" />` + `<p>` (over the photo)
  7. `<h1 className="mt-5 max-w-[20ch] text-[clamp(2.5rem,1.2rem+3.6vw,4.5rem)] leading-[1.02] font-semibold text-white">{title}</h1>`
  8. `{caption && <p className="mt-6 font-sans text-[0.78rem] tracking-[0.04em] text-white/60">{caption}</p>}`
  9. below the frame: `{(intro || children) && (<div className="container"><div className="grid grid-cols-1 gap-8 py-[clamp(2.5rem,4.5vw,4rem)] lg:grid-cols-12"><div className="lg:col-span-3 lg:col-start-5">{intro && <p className="lead">{intro}</p>}{children && <div className="mt-7">{children}</div>}</div></div></div>)}`
- **Conditional rendering**:
  - `height === "tall" ? "h-[82svh] min-h-[30rem]" : "h-[62svh] min-h-[24rem]"` — ternary
  - `{caption && (<p …>{caption}</p>)}`
  - `{(intro || children) && (…)}` — gates the whole below-image block
  - `{intro && <p className="lead">{intro}</p>}`
  - `{children && <div className="mt-7">{children}</div>}`
- **Variants**: `height?: "normal" | "tall"` — 2 keys, **styling only**, single class-string ternary; the JSX tree is identical.
  - `"normal"` (default) → `"h-[62svh] min-h-[24rem]"`
  - `"tall"` → `"h-[82svh] min-h-[30rem]"`
- **Fallbacks**: `height = "normal"`; `caption` undefined → no caption; `intro` and `children` both undefined → the entire below-image block is omitted (the page becomes image-only). `Breadcrumbs` renders itself as `null` when `getBreadcrumbs(pathname)` returns `[]`, so on some routes the hero shows no breadcrumb.
- **Consumers**:
  - `src/app/publications/[slug]/page.tsx:3`
  - `src/app/vie-de-leglise/evenements/[slug]/page.tsx:3`
- **Reuse breadth**: **2-5 consumers (2)**

### Consumer prop-shape divergence — `HeroPhoto`
- `publications/[slug]/page.tsx:149-158` — `height="normal"`, `caption={[publication.category ? categoryLabel[publication.category] : typeLabel[publication.type], formatLongDate(publication.publishedAt)].join(" · ")}`, `image={heroImage}` where `heroImage` falls back to a local `fallbackImage[publication.type]` map. **No `intro`, no `children`.**
- `evenements/[slug]/page.tsx:89-100` — **`height="tall"`**, `image={event.bannerImage ?? event.imageUrl ?? "/media/ccjv-08.jpeg"}` (the only page-level literal image fallback in the app), `caption={[formatLongDate(event.eventDate), event.location].filter(Boolean).join(" · ")}`, `overline={departmentName ?? "Vie de l'Église"}`. Also no `intro`/`children`.
  So the same component is `tall` on event pages and `normal` on publication pages, and the `caption` is built from two different field pairs (category+date vs date+location).

## COMPONENT: HeroPractical
- **file**: `src/components/composition/HeroPractical.tsx` (3206 bytes, 91 lines)
- **kind**: server
- **Responsibility**: Type-F functional hero — no photograph, no staging: overline + title + intro on the left, a `<dl>` of practical facts on the right.
- **Exact props type (verbatim)**:
```ts
export interface PracticalFact {
  label: string;
  value: string;
  hint?: string;
  /** Lien d'action associé au fait (ex. itinéraire). */
  href?: string;
}

export interface HeroPracticalProps {
  overline: string;
  title: string;
  intro?: string;
  facts?: readonly PracticalFact[];
  /** Complément à droite des faits (contact, note). */
  aside?: ReactNode;
}
```
- **Destructured & rendered**: `overline, title, intro, facts, aside` — all rendered. `aside` is destructured and rendered as `{aside && <div className="mt-7">{aside}</div>}` but **no consumer ever passes it** (see below).
- **Hardcoded internal content**: no French literal, no image path, no href. No default strings.
- **Internal structure**:
  1. `<div className="border-b border-ccjv-line bg-ccjv-offwhite">`
  2. `<div className="container">` → `pt-[calc(72px+clamp(2rem,4vw,3.25rem))] pb-[clamp(2.25rem,4vw,3.5rem)]` ← **hardcoded 72px offset**
  3. `<Breadcrumbs />` (no `tone` → defaults to `"light"`)
  4. grid `lg:grid-cols-12 lg:gap-14`:
     - left `lg:col-span-5`: `<p className="font-sans text-xs font-semibold tracking-[0.18em] text-ccjv-green uppercase">{overline}</p>`, `<h1>`, `{intro && <p className="mt-5 max-w-[46ch] text-[1.0625rem] leading-[1.6] text-ccjv-ink-secondary">}`, `{aside && <div className="mt-7">}`
     - right `lg:col-span-6 lg:col-start-7`: `{facts && facts.length > 0 && (<dl className="grid grid-cols-1 gap-x-10 gap-y-7 self-start border-t border-ccjv-line pt-8 sm:grid-cols-2 lg:col-span-6 lg:col-start-7">` → `facts.map((fact) => (<div key={fact.label} className="flex flex-col gap-1.5"><dt>{fact.label}</dt><dd>{fact.href ? <Link …>{fact.value}</Link> : fact.value}</dd>{fact.hint && <p>{fact.hint}</p>}</div>))}</dl>)}`
- **Conditional rendering**:
  - `{intro && (<p …>{intro}</p>)}`
  - `{aside && <div className="mt-7">{aside}</div>}`
  - `{facts && facts.length > 0 && (…)}` — **`&&` combined with an explicit length check**
  - `facts.map((fact) => …)` with `key={fact.label}`
  - `{fact.href ? (<Link href={fact.href} …>{fact.value}</Link>) : (fact.value)}` — ternary: link vs plain text
  - `{fact.hint && (<p …>{fact.hint}</p>)}`
- **Variants**: **aucune variante** — no `variant`/`size`/`tone`/`align` prop, no internal record of styles, no switch. `facts[].href` changes the `dd` *element* (Link vs text) but that is per-item data, not a component variant.
- **Fallbacks**: `facts` undefined **or** `facts.length === 0` → the whole right column (including its `border-t`) is not rendered; the grid collapses to the left column only. `intro`/`aside` undefined → their nodes vanish. No placeholder for an empty fact list.
- **Consumers**:
  - `src/app/recherche/page.tsx:1`
  - `src/app/publications/ressources/page.tsx:2`
- **Reuse breadth**: **2-5 consumers (2)**

### Consumer prop-shape divergence — `HeroPractical`
- `recherche/page.tsx:92-110` — `facts` has **3 items, none with `hint` and none with `href`**: `{ label: "Contenus indexés", value: `${entries.length} entrées` }`, `{ label: "Types de contenu", value: "Pages, événements, départements, publications" }`, `{ label: "Recherche", value: "Immédiate, sans rechargement" }`.
- `ressources/page.tsx:63-89` — `facts` has **4 items, all with `hint`**: e.g. `{ label: "Ressources disponibles", value: `${items.length}`, hint: "Publiées sur le site à ce jour." }`, `{ label: "Format", value: "Textes à lire en ligne", hint: "Aucun document à télécharger n'est proposé pour ces ressources." }`, `{ label: "Public", value: "Seul ou en groupe", hint: "…" }`, `{ label: "Dernière parution", value: lead ? formatLongDate(lead.publishedAt) : "À venir", hint: "…" }`.
  So one call site exercises the 3-line `dt/dd/hint` shape and the other exercises only the 2-line `dt/dd` shape; **neither passes `aside`**, and **no call site anywhere in the app passes `PracticalFact.href`** — the `Link` branch of the `dd` ternary is unreachable in production.

---

# 3. `src/components/editorial/`

## COMPONENT: ContentPending
- **file**: `src/components/editorial/ContentPending.tsx` (1673 bytes, 59 lines)
- **kind**: server (pure-visual, no directive)
- **Responsibility**: An explicit, visible "content not supplied yet" placeholder (dashed frame or dashed left rule), instead of inventing institutional copy.
- **Exact props type (verbatim)**:
```ts
export interface ContentPendingProps {
  /** Ce qui manque, en clair : « Confession de foi », « Témoignages réels ». */
  what: string;
  /** Ce qu'il faut fournir pour remplir l'emplacement. */
  hint?: string;
  variant?: "block" | "inline";
  className?: string;
}
```
- **Destructured & rendered**: `what, hint, variant = "block", className` — all rendered.
- **Hardcoded internal content**:
  - `TODO` (uppercase marker, rendered in both branches)
  - `— {what} à fournir` / `{what} à fournir.` → the literal fragment **`à fournir`**
  - inline branch: `— {what} à fournir.`
  - block branch: `TODO — {what} à fournir`
  - No image path, no href.
- **Internal structure**:
  - **early return** `if (variant === "inline")`: `<p className={cn("border-l-2 border-dashed border-ccjv-green/50 py-1 pl-4 font-sans text-[0.85rem] leading-relaxed text-ccjv-ink-secondary", className)}>` → `<span className="font-semibold tracking-[0.08em] text-ccjv-green uppercase">TODO</span>` + `{" "}` + `— {what} à fournir.` + `{hint && <span className="mt-1 block">{hint}</span>}`
  - **block (default)**: `<div className={cn("flex flex-col gap-2 border border-dashed border-ccjv-green/40 px-7 py-8", className)}>` → `<p className="font-sans text-[0.68rem] font-semibold tracking-[0.2em] text-ccjv-green uppercase">TODO — {what} à fournir</p>` + `{hint && <p className="max-w-[52ch] font-sans text-[0.88rem] leading-relaxed text-ccjv-ink-secondary">{hint}</p>}`
- **Conditional rendering**:
  - `if (variant === "inline") { return … }` — early return splits the component into two branches
  - `{hint && <span className="mt-1 block">{hint}</span>}` (inline)
  - `{hint && (<p …>{hint}</p>)}` (block)
- **Variants**: `variant?: "block" | "inline"` — 2 keys, **structural difference** (this is the only 2-branch component in `editorial` whose branches differ in element type):
  - `"block"` (default) → a `<div>` with a full dashed `border` all around, `px-7 py-8`, a **separate `<p>` for the TODO label** and a **separate `<p>`** for the hint
  - `"inline"` → a `<p>` with `border-l-2 border-dashed … border-ccjv-green/50 pl-4 py-1`, the TODO marker as an inline `<span>`, and the hint as a `block` `<span>` **inside the same `<p>`**
- **Fallbacks**: `variant = "block"`; `hint` undefined → the hint node is absent in both branches (the TODO line still renders); `className` undefined → no extra class.
- **Consumers**:
  - `src/components/editorial/PeopleGrid.tsx:3` (internal, when `people.length === 0`)
  - `src/app/communaute/temoignages/page.tsx:9` (two usages: block `what="Témoignages réels"` at line 100 with `className="mt-12"`; inline `variant="inline"` at line 186 with `className="mt-10"`)
  - `src/app/publications/enseignements/page.tsx:8` (`what="Séries et thèmes des prédications"`, `hint="…"`)
  - `src/app/publications/[slug]/page.tsx:8` (`what="Corps de cette publication"`, `hint="…"`)
- **Reuse breadth**: **2-5 consumers (4 import sites; 5 render sites)**

## COMPONENT: CrossLinks
- **file**: `src/components/editorial/CrossLinks.tsx` (4320 bytes, 134 lines)
- **kind**: server (renders `next/link` + `next/image`)
- **Responsibility**: Editorial cross-linking — "the natural way onward" in three shapes: illustrated doors, ruled editorial list, or a simple line of links.
- **Exact props type (verbatim)**:
```ts
export type CrossLinksVariant = "doors" | "list" | "inline";

export interface CrossLink {
  href: string;
  label: string;
  description?: string;
  image?: string;
}

export interface CrossLinksProps {
  items: readonly CrossLink[];
  variant?: CrossLinksVariant;
  onDark?: boolean;
  className?: string;
}
```
- **Destructured & rendered**: `items, variant = "list", onDark = false, className` — all rendered.
- **Hardcoded internal content**:
  - **French literals**: `Découvrir →` (doors branch, line 95); `→` (list branch, line 127, `aria-hidden`); `{item.label} →` (inline branch, line 54 — the arrow is appended inside the label string).
  - No image path (images come from `item.image`), no href (hrefs come from `item.href`).
- **Internal structure** — three early-return branches:
  1. **guard**: `if (items.length === 0) return null;`
  2. **derived class vars**: `line`, `muted`, `accent` from `onDark`
  3. **`inline` branch**: `<ul className={cn("flex flex-wrap gap-x-8 gap-y-3", className)}>` → `items.map` → `<li key={item.href}><Link href={item.href} className={cn("font-sans text-[0.95rem] font-medium underline decoration-1 underline-offset-4 transition-colors duration-[150ms]", onDark ? "decoration-white/30 hover:text-ccjv-cream" : "decoration-ccjv-green/40 hover:text-ccjv-green")}>{item.label} →</Link></li>`
  4. **`doors` branch**: `<ul className={cn("grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3", className)}>` → `items.map` → `<li key={item.href}><Link href={item.href} className="group flex h-full flex-col">` → optional `<span className="relative aspect-4/3 w-full overflow-hidden bg-ccjv-line"><Image src={item.image} alt="" fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover transition-transform duration-[550ms] ease-ccjv group-hover:scale-[1.03]" /></span>` → label row `<span className={cn("mt-5 flex items-center gap-3 border-t pt-5", line)}>` → optional description `<span className={cn("mt-3 font-sans text-[0.92rem] leading-relaxed", muted)}>` → `<span className={cn("mt-5 font-sans text-[0.85rem] font-medium", accent)}>Découvrir →</span>`
  5. **`list` branch (default)**: `<ul className={cn("border-t", line, className)}>` → `items.map` → `<li key={item.href} className={cn("border-b", line)}><Link href={item.href} className="group flex flex-col gap-1 py-6 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8">` → label `<span className={cn("font-serif text-[1.25rem] transition-colors duration-[250ms] group-hover:text-ccjv-green", onDark && "text-white")}>` → optional description `<span className={cn("max-w-[52ch] font-sans text-[0.9rem]", muted)}>` → `<span className={cn("font-sans text-[0.85rem] font-medium", accent)} aria-hidden="true">→</span></Link></li>`
- **Conditional rendering**:
  - `if (items.length === 0) return null;` — length check
  - `if (variant === "inline") { return … }`, `if (variant === "doors") { return … }` — two early returns
  - `items.map((item) => …)` in all three branches
  - `{item.image && (<span className="relative aspect-4/3 …">)}` (doors)
  - `{item.description && (<span …>)}` (doors and list)
  - `onDark ? "decoration-white/30 hover:text-ccjv-cream" : "decoration-ccjv-green/40 hover:text-ccjv-green"` (inline ternary)
  - `onDark && "text-white"` (label colour, doors + list)
- **Variants**: `variant?: CrossLinksVariant` — 3 keys, **partly structural**:
  - `"list"` (default) → `<ul>` of `<li>` rows, `border-t` on the list + `border-b` per row, flex-col on mobile / flex-row with `justify-between` on `sm`, a **serif** label, a trailing `→` in a **separate** `aria-hidden` span
  - `"doors"` → `<ul>` CSS grid (1 / 2 / 3 columns), each item is a `<Link>` wrapping an **optional `aspect-4/3` image**, a bordered label row, an optional description, and a **hardcoded `Découvrir →`** call-to-action span — no arrow-only affordance
  - `"inline"` → a single `<ul className="flex flex-wrap">` of underlined **sans-serif** links; **no `border`, no description, no image**; the arrow is concatenated into the label text
  - `onDark` is an orthogonal boolean restyling `line`/`muted`/`accent` and two hover/label classes; structure unchanged.
- **Fallbacks**: `items.length === 0` → **`null`** (nothing rendered, not even a wrapper). `variant = "list"`, `onDark = false`. `item.image` undefined → the image `<span>` is absent in `doors` (the card renders label + `Découvrir →` only). `item.description` undefined → no description node. `className` undefined → no extra class.
- **Consumers**:
  - `src/app/recherche/page.tsx:4`
  - `src/app/communaute/temoignages/page.tsx:10`
  - `src/app/publications/actualites/page.tsx:5`
  - `src/app/publications/enseignements/page.tsx:9`
  - `src/app/publications/mediatheque/page.tsx:8`
  - `src/app/publications/ressources/page.tsx:6`
  - `src/app/publications/[slug]/page.tsx:9`
- **Reuse breadth**: **6+ consumers (7)**

### Consumer prop-shape divergence — `CrossLinks`
Three different variant usages, and **`doors` is never used**:
- **`variant="inline"`** — `actualites/page.tsx:196-204` (`items` inline with `{ href, label }` only, 4 items), `mediatheque/page.tsx:164-172` (same 4-field shape), `publications/[slug]/page.tsx:362-370` (same shape, "Toutes les rubriques").
- **`variant="list"`** — `recherche/page.tsx:145-164` (items with `description`), `ressources/page.tsx:223` (`items={related}` typed `CrossLink[]` declared at module scope, with `description`), `enseignements/page.tsx:194` (`items={related}` same), `temoignages/page.tsx:274` (`items={related}` same).
- **`variant="doors"`** — **zero call sites**. The image branch, the `Découvrir →` literal and `aspect-4/3` frame are unreachable.
- Also `onDark` is **never passed** by any consumer, so `line = "border-white/15"`, `muted = "text-white/65"`, `accent = "text-ccjv-cream"` and the `decoration-white/30` hover are dead in production — even though `temoignages` places `CrossLinks` inside a fragment that is passed as `related` (a `tone="light"` band) and `actualites`/`mediatheque` place theirs in `tone="tinted"`/`tone="light"` bands.

## COMPONENT: FeatureImage
- **file**: `src/components/editorial/FeatureImage.tsx` (2858 bytes, 106 lines)
- **kind**: server
- **Responsibility**: A staged photograph with an honest caption, in six composition variants.
- **Exact props type (verbatim)**:
```ts
export type FeatureImageVariant =
  | "full"
  | "wide"
  | "inset"
  | "arch"
  | "portrait"
  | "float";

export interface FeatureImageProps {
  src: string;
  /** Légende factuelle. À omettre si le contenu de la photo n'est pas vérifié. */
  caption?: string;
  variant?: FeatureImageVariant;
  /** Surcharge du ratio (classes Tailwind `aspect-*`). */
  aspect?: string;
  priority?: boolean;
  className?: string;
}
```
- **Destructured & rendered**: `src, caption, variant = "wide", aspect, priority = false, className` — all rendered.
- **Hardcoded internal content**: no French literal, no image path (src is a prop), no href. `<Image src={src} alt="" fill priority={priority} … className="object-cover" />` — `alt` hardcoded `""`.
- **Internal structure**:
  1. `const isFull = variant === "full";`
  2. `const figure = (<figure className={cn(variant === "float" && "lg:mb-6", className)}><div className={cn("relative overflow-hidden bg-ccjv-line", aspect ?? variantFrame[variant])}><Image src={src} alt="" fill priority={priority} sizes={isFull ? "100vw" : variant === "float" ? "(max-width: 1024px) 100vw, 34vw" : "(max-width: 1024px) 100vw, 70vw"} className="object-cover" /></div>{caption && (<figcaption className={cn("mt-4 flex gap-3 border-t border-ccjv-line pt-3 font-sans text-[0.78rem] leading-relaxed text-ccjv-ink-secondary", isFull && "mx-auto max-w-[1200px] px-[clamp(16px,4vw,48px)]")}><span className="mt-2 h-px w-5 shrink-0 bg-ccjv-green" aria-hidden="true" /><span>{caption}</span></figcaption>)}</figure>);`
  3. `if (isFull) return figure;` — early return, **no width wrapper**
  4. `return <div className={variantWrap[variant]}>{figure}</div>;`
- **Conditional rendering**:
  - `variant === "float" && "lg:mb-6"` (on `<figure>`)
  - `aspect ?? variantFrame[variant]` — nullish coalescing
  - `isFull ? "100vw" : variant === "float" ? "(max-width: 1024px) 100vw, 34vw" : "(max-width: 1024px) 100vw, 70vw"` — nested ternary for `sizes`
  - `{caption && (<figcaption …>)}`
  - `isFull && "mx-auto max-w-[1200px] px-[clamp(16px,4vw,48px)]"` (caption alignment)
  - `if (isFull) return figure;` — early return changes the **DOM root**
- **Variants**: `variant?: FeatureImageVariant` — 6 keys. `variantFrame` (2 keys collide) and `variantWrap` (styling + a **structural** wrapper difference):
  - `full`: frame `"h-[62svh] min-h-[20rem] w-full"`; wrap **`""` and the wrapper `<div>` is skipped entirely** (`if (isFull) return figure`); `sizes="100vw"`; caption gets its own `max-w-[1200px]` container. → **structural**
  - `wide` (**default**): frame `"aspect-16/9 w-full"`; wrap `"mx-auto w-full max-w-[1200px] px-[clamp(16px,4vw,48px)]"` (re-implements `.container`); `sizes="(max-width: 1024px) 100vw, 70vw"` → styling only
  - `inset`: frame `"aspect-4/3 w-full"`; wrap `"mx-auto w-full max-w-[42rem]"` → styling only
  - `arch`: frame `"aspect-3/4 w-full rounded-t-full"`; wrap `"mx-auto w-full max-w-[20rem]"` → styling only (note: the **only** `rounded-*` in the editorial folder — the design system is otherwise `rounded-none`)
  - `portrait`: frame `"aspect-3/4 w-full"`; wrap `"mx-auto w-full max-w-[26rem]"` → styling only
  - `float`: frame `"aspect-4/5 w-full"`; wrap `"mx-auto w-full max-w-[26rem] lg:float-right lg:mx-0 lg:ml-12 lg:w-[40%] lg:max-w-none"`; adds `lg:mb-6` on the figure and a distinct `sizes="… 34vw"` → styling only (float changes layout but not the tree)
  - `aspect` prop overrides `variantFrame[variant]` for any variant.
- **Fallbacks**: `variant = "wide"`, `priority = false`. `caption` undefined → no `<figcaption>`. `aspect` undefined → `variantFrame[variant]`. `className` undefined → `cn` drops it.
- **Consumers**:
  - `src/app/communaute/temoignages/page.tsx:5`
  - `src/app/publications/actualites/page.tsx:6`
  - `src/app/publications/ressources/page.tsx:4`
- **Reuse breadth**: **2-5 consumers (3)**

### Consumer prop-shape divergence — `FeatureImage`
- `temoignages/page.tsx:203-207` — `variant="full"` **and** an `aspect` override simultaneously: `<FeatureImage src={images.service} variant="full" aspect="h-[64svh] min-h-[22rem] w-full" />`. Because `variant="full"` short-circuits, this is the only call site that renders the unwrapped figure; its `aspect` **replaces** the `variantFrame.full` string. No caption.
- `actualites/page.tsx:93-98` — `<FeatureImage className="mt-16" variant="wide" src={images.fraternite} caption="Centre Chrétien Jésus ma Vie — Lubumbashi" />` → the only call site with a **caption** and a `className`.
- `ressources/page.tsx:202` — `<FeatureImage src={images.predication} variant="wide" />` → bare, no caption, no className, no aspect.
  So `inset`, `arch`, `portrait`, `float` are **never used by any consumer**, and `aspect` is used exactly once.

## COMPONENT: KeyFacts
- **file**: `src/components/editorial/KeyFacts.tsx` (3517 bytes, 137 lines)
- **kind**: server (pure-visual, no directive)
- **Responsibility**: Factual label/value information in three shapes: ruled pairs, large-value tiles, or a single inline line.
- **Exact props type (verbatim)**:
```ts
export type KeyFactsVariant = "pairs" | "tiles" | "inline";

export interface KeyFact {
  label: string;
  value: string;
  hint?: string;
}

export interface KeyFactsProps {
  items: readonly KeyFact[];
  variant?: KeyFactsVariant;
  onDark?: boolean;
  className?: string;
}
```
- **Destructured & rendered**: `items, variant = "pairs", onDark = false, className` — all rendered.
- **Hardcoded internal content**: no French literal (no "TODO", no arrow here), no image path, no href. Only class strings.
- **Internal structure** — three early-return branches:
  1. `if (items.length === 0) return null;`
  2. `const line = onDark ? "border-white/15" : "border-ccjv-line"; const muted = onDark ? "text-white/60" : "text-ccjv-ink-secondary";`
  3. **`inline`**: `<dl className={cn("flex flex-wrap items-center gap-x-8 gap-y-3 font-sans text-[0.92rem]", className)}>` → `items.map` → `<div key={item.label} className="flex items-baseline gap-2"><dt className={cn("text-[0.68rem] font-semibold tracking-[0.16em] uppercase", muted)}>{item.label}</dt><dd className="font-medium">{item.value}</dd></div>`
  4. **`tiles`**: `<dl className={cn("grid grid-cols-1 gap-px border sm:grid-cols-2 lg:grid-cols-3", line, onDark ? "bg-white/15" : "bg-ccjv-line", className)}>` → `items.map` → `<div key={item.label} className={cn("flex flex-col gap-2 p-7", onDark ? "bg-ccjv-black" : "bg-ccjv-offwhite")}><dt>{item.label}</dt><dd className="font-serif text-[clamp(1.2rem,0.7rem+1vw,1.6rem)] leading-snug">{item.value}</dd>{item.hint && <p className={cn("font-sans text-[0.8rem] leading-relaxed", muted)}>{item.hint}</p>}</div>`
  5. **`pairs` (default)**: `<dl className={cn("border-t", line, className)}>` → `items.map` → `<div key={item.label} className={cn("grid grid-cols-1 gap-1.5 border-b py-6 sm:grid-cols-12 sm:items-baseline sm:gap-6", line)}><dt className={cn("font-sans text-[0.7rem] font-semibold tracking-[0.18em] uppercase sm:col-span-4", muted)}>{item.label}</dt><dd className="font-serif text-[1.15rem] leading-snug sm:col-span-8">{item.value}{item.hint && <span className={cn("mt-1 block font-sans text-[0.82rem] leading-relaxed", muted)}>{item.hint}</span>}</dd></div>`
- **Conditional rendering**:
  - `if (items.length === 0) return null;`
  - `if (variant === "inline") { return … }`, `if (variant === "tiles") { return … }`
  - `items.map(...)` in the three branches, `key={item.label}`
  - `{item.hint && <p …>}` (tiles) / `{item.hint && <span …>}` (pairs); **`inline` never reads `item.hint`**
  - `onDark ? "bg-white/15" : "bg-ccjv-line"` (tiles gap colour), `onDark ? "bg-ccjv-black" : "bg-ccjv-offwhite"` (tile fill)
- **Variants**: `variant?: KeyFactsVariant` — 3 keys, **structural**:
  - `pairs` (**default**) → one item per **row**, `border-t` on the `<dl>` + `border-b` per row, 12-column sub-grid, `dt` = sans uppercase overline in `sm:col-span-4`, `dd` = **serif** `text-[1.15rem]` in `sm:col-span-8`, `hint` nested **inside the `<dd>` as a `block` span**
  - `tiles` → a CSS grid with `gap-px` over a coloured background to fake hairlines, `2`/`3` columns at `sm`/`lg`, each item a `flex flex-col gap-2 p-7` block with **`bg-ccjv-offwhite` / `bg-ccjv-black` per tile**, `dd` = serif `clamp(1.2rem,…)`, `hint` = **separate `<p>`**
  - `inline` → a single `flex flex-wrap` `<dl>`, each item `flex items-baseline gap-2`, `dt` = tiny uppercase (no border), `dd` = default font (not serif, not enlarged), **`hint` is silently ignored**
  - `onDark` is orthogonal and only restyles colours (`line`, `muted`, tile backgrounds); structure unchanged.
- **Fallbacks**: `items.length === 0` → **`null`**. `variant = "pairs"`, `onDark = false`. `item.hint` undefined → no hint node (and in `inline`, it is ignored even when supplied). No missing-value placeholder for `item.value`.
- **Consumers**:
  - `src/app/publications/[slug]/page.tsx:6`
  - `src/app/vie-de-leglise/evenements/[slug]/page.tsx:6`
- **Reuse breadth**: **2-5 consumers (2)**

### Consumer prop-shape divergence — `KeyFacts`
- `publications/[slug]/page.tsx:205-224` — `variant="pairs"` + `className="mt-6"`; 3 or 4 items built as `{ label: "Type", value: typeLabel[publication.type] }`, `{ label: "Rubrique", value: … }`, `{ label: "Publié le", value: formatLongDate(publication.publishedAt) }` plus a spread `...(publication.author ? [{ label: "Auteur", value: publication.author }] : [])`. **No item carries a `hint`.**
- `evenements/[slug]/page.tsx:172-192` — `variant="pairs"`, **no `className`**; **5 items, two of which carry a `hint`**: `{ label: "Entrée", value: "Libre et ouverte à tous", hint: "Aucune inscription n'est requise pour participer." }` and `{ label: "Accès", value: `${site.address}`, hint: "Écrivez-nous si vous avez besoin d'être guidé jusqu'à l'église." }`.
  `variant="tiles"` and `variant="inline"` and `onDark` are **never used by any consumer**.

## COMPONENT: MediaFeature
- **file**: `src/components/editorial/MediaFeature.tsx` (4607 bytes, 144 lines)
- **kind**: server (renders the client `YouTubeThumb`)
- **Responsibility**: A featured video in two shapes — `hero` (video opens the page, title/excerpt beside the thumbnail) and `inline` (editorial-width row in the flow). No iframe is ever loaded.
- **Exact props type (verbatim)**:
```ts
export interface MediaFeatureProps {
  href: string;
  title: string;
  excerpt?: string;
  author?: string;
  date?: string;
  duration?: string;
  /** Image de repli si le lien n'est pas une vidéo YouTube. */
  fallbackImage?: string;
  variant?: "hero" | "inline";
  className?: string;
}
```
- **Destructured & rendered**: `href, title, excerpt, author, date, duration, fallbackImage, variant = "hero", className` — all rendered. Note **`duration` is only rendered as part of the joined `meta` string**, never on its own.
- **Hardcoded internal content**:
  - **French literal**: `Dernier enseignement` (`MediaFeature.tsx:117`) — rendered **unconditionally in the `hero` branch**, even when the video is not the latest teaching.
  - **French literal**: `Regarder sur YouTube` (`MediaFeature.tsx:136`) — the hero CTA label.
  - Hardcoded `→` inside that CTA (`<span aria-hidden="true" …>→</span>`).
  - Inline play-glyph SVG, hardcoded path: `<svg viewBox="0 0 24 24" className="ml-1 h-6 w-6 fill-ccjv-cream"><path d="M8 5v14l11-7z" /></svg>` (lines 73-75).
  - Separator literal: `const meta = [author, date, duration].filter(Boolean).join(" · ");`
  - No image path (uses `YouTubeThumb` or `fallbackImage`), no href literal.
- **Internal structure**:
  1. `const videoId = getYouTubeId(href); const isHero = variant === "hero";`
  2. `const meta = [author, date, duration].filter(Boolean).join(" · ");`
  3. `const thumb = (<div className={cn("relative w-full overflow-hidden bg-ccjv-black", isHero ? "aspect-16/9" : "aspect-16/9")}>` → `{videoId ? <YouTubeThumb …/> : fallbackImage ? <Image src={fallbackImage} alt="" fill sizes="(max-width: 1024px) 100vw, 58vw" className="object-cover" /> : null}` → play affordance `<span className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true"><span className="flex h-16 w-16 items-center justify-center border border-white/60 bg-ccjv-black/45 backdrop-blur-[2px] transition-colors duration-[250ms] group-hover:border-ccjv-cream group-hover:bg-ccjv-black/65"><svg …/></span></span></div>);`
  4. **`inline` branch** (`if (!isHero) return …`): `<Link href={href} target="_blank" rel="noopener noreferrer" className={cn("group block", className)}>` → `{thumb}` → `<div className="mt-5 border-t border-ccjv-line pt-5">{meta && <p>{meta}</p>}<h3 className="mt-3 font-serif text-[1.35rem] leading-snug …">{title}</h3>{excerpt && <p className="mt-3 max-w-[54ch] …">{excerpt}</p>}</div></Link>`
  5. **`hero` branch (default)**: `<article className={cn("grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14", className)}>` → `<Link href={href} target="_blank" rel="noopener noreferrer" className="group block lg:col-span-7">{thumb}</Link>` → `<div className="lg:col-span-5">` → `<p …>Dernier enseignement</p>` → `<h3 className="mt-4 font-serif text-[clamp(1.7rem,1rem+1.9vw,2.6rem)] leading-[1.12]">{title}</h3>` → `{meta && <p className="mt-4 font-sans text-[0.88rem] text-ccjv-ink-secondary">{meta}</p>}` → `{excerpt && <p className="mt-6 max-w-[50ch] …">{excerpt}</p>}` → CTA `<Link href={href} … className="group mt-8 inline-flex items-center gap-3 border border-ccjv-ink px-6 py-3 …">Regarder sur YouTube<span aria-hidden="true" …>→</span></Link>`
- **Conditional rendering**:
  - `{videoId ? (<YouTubeThumb …/>) : fallbackImage ? (<Image …/>) : null}` — nested ternary; a non-YouTube `href` **without** `fallbackImage` renders an **empty black frame with only the play affordance**
  - `{meta && (<p …>)}` (both branches)
  - `{excerpt && (<p …>)}` (both branches)
  - `if (!isHero) { return … }` — early return
  - `isHero ? "aspect-16/9" : "aspect-16/9"` — a **ternary whose two branches are identical strings**
  - `isHero ? "(max-width: 1024px) 100vw, 58vw" : "(max-width: 1024px) 100vw, 50vw"` — `sizes` ternary
- **Variants**: `variant?: "hero" | "inline"` — 2 keys, **structural**:
  - `hero` (**default**) → `<article>` CSS grid 12 columns; thumbnail is a `lg:col-span-7` `<Link>` **without** a title inside it; the text column adds a hardcoded `Dernier enseignement` overline, a larger serif `<h3>` (`clamp(1.7rem,…)`), a bordered secondary CTA "Regarder sur YouTube →"; thumbnail `sizes` = `… 58vw`
  - `inline` → a single `<Link className="group block">` wrapping thumbnail + a `border-t` text block; **no overline**, smaller `<h3>` (`text-[1.35rem]`), excerpt capped at `max-w-[54ch]` (hero: `max-w-[50ch]`), **no CTA**; thumbnail `sizes` = `… 50vw`
  - The `aspect-16/9` class on the thumbnail frame is the **same for both** variants (dead ternary).
- **Fallbacks**: `variant = "hero"`. `excerpt` undefined → no excerpt paragraph. `author`/`date`/`duration` all undefined → `meta === ""` → the `{meta && …}` paragraphs are omitted. `videoId` falsy and `fallbackImage` undefined → `null` inside the frame (black rectangle + play glyph remain). `fallbackImage` is **never passed by any consumer** (0 call sites), so the `<Image>` branch is dead in production.
- **Consumers**:
  - `src/app/publications/enseignements/page.tsx:5`
  - `src/app/publications/mediatheque/page.tsx:6`
- **Reuse breadth**: **2-5 consumers (2)**

### Consumer prop-shape divergence — `MediaFeature`
- `enseignements/page.tsx:72-79` — `variant="hero"`, `href={featuredVideo}`, `title`, `excerpt={featured.description}`, `author={featured.author}`, `date={formatLongDate(featured.publishedAt)}`. **No `duration`, no `fallbackImage`, no `className`.**
- `mediatheque/page.tsx:77-84` — `variant="hero"`, `href={videoUrl}`, `title={latestVideo.title}`, `excerpt={latestVideo.description}`, `author={latestVideo.author}`, `date={formatLongDate(latestVideo.publishedAt)}`. **No `duration`, no `fallbackImage`, no `className`.**
  Both call sites are the same shape and both are inside `featured={…}` of a `MediaPage`; `variant="inline"` and the `duration` prop are **never used anywhere**.

## COMPONENT: PeopleGrid
- **file**: `src/components/editorial/PeopleGrid.tsx` (5231 bytes, 176 lines)
- **kind**: server
- **Responsibility**: A people directory: `feature` puts the first person large with the rest as notices; `compact` is notices only with no dominant portrait.
- **Exact props type (verbatim)**:
```ts
export interface Person {
  id: string;
  name: string;
  role: string;
  scope?: string;
  photo?: string;
  bio?: string;
}

export interface PeopleGridProps {
  people: readonly Person[];
  variant?: "feature" | "compact";
  onDark?: boolean;
  className?: string;
}
```
- **Destructured & rendered**: `people, variant = "feature", onDark = false, className` — all rendered. `Person.scope` and `Person.bio` are only read in the `feature` branch; **`Person.scope` is never read in `compact`**.
- **Hardcoded internal content**:
  - **French literals** (in the empty-state fallback):
    - `what="Liste des responsables"`
    - `hint="Les noms, fonctions et portraits des responsables doivent être fournis par l'église, avec l'accord des personnes concernées."`
  - No image path (photos come from `person.photo`), no href (members are **not links** — no `next/link` import at all).
- **Internal structure**:
  1. `if (people.length === 0) { return <ContentPending what="Liste des responsables" hint="…" className={className} />; }`
  2. `const line = onDark ? "border-white/15" : "border-ccjv-line"; const muted = onDark ? "text-white/65" : "text-ccjv-ink-secondary";`
  3. **`compact` branch**: `<ul className={cn("grid grid-cols-1 gap-x-12 sm:grid-cols-2", className)}>` → `people.map` → `<li key={person.id} className={cn("flex items-start gap-5 border-t py-7", line)}>` → `{person.photo && <span className="relative h-20 w-16 shrink-0 overflow-hidden bg-ccjv-line"><Image src={person.photo} alt="" fill sizes="64px" className="object-cover" /></span>}` → `<span className="flex flex-col gap-1"><span serif name/><span className={cn("font-sans text-[0.85rem]", muted)}>{person.role}</span></span>`
  4. **`feature` branch (default)**: `const [lead, ...rest] = people;` → `<div className={className}>` → lead block `<div className="grid grid-cols-1 items-center gap-10 border-b border-ccjv-line pb-14 lg:grid-cols-12 lg:gap-14">` → `<figure className="lg:col-span-4"><div className="relative aspect-3/4 overflow-hidden bg-ccjv-line">{lead.photo ? <Image src={lead.photo} alt="" fill sizes="(max-width: 1024px) 100vw, 30vw" className="object-cover" /> : null}</div></figure>` → `<div className="lg:col-span-8">{lead.scope && <p/>}<h3 className="mt-4 font-serif text-[clamp(1.8rem,1rem+2vw,2.75rem)] leading-[1.1]">{lead.name}</h3><p className={cn("mt-3 font-sans text-[1.02rem]", muted)}>{lead.role}</p>{lead.bio && <p className={cn("mt-6 max-w-[58ch] text-[1.02rem] leading-[1.72]", muted)}>{lead.bio}</p>}</div>` → notices `{rest.length > 0 && (<ul className="mt-14 grid grid-cols-1 gap-x-12 sm:grid-cols-2">{rest.map((person) => (<li key={person.id} className={cn("flex items-start gap-5 border-t py-7", line)}>… same notice markup as compact but with `{person.bio && …}` added …</li>))}</ul>)}`
- **Conditional rendering**:
  - `if (people.length === 0) { return <ContentPending … /> }` — length check → **placeholder component**, not `null`
  - `if (variant === "compact") { return … }` — early return
  - `{person.photo && (<span className="relative h-20 w-16 …">)}` — compact, twice (compact list, and `rest` list)
  - `{lead.photo ? (<Image … />) : null}` — ternary; **the `aspect-3/4` frame is always rendered** even when the lead has no photo (empty `bg-ccjv-line` box)
  - `{lead.scope && (<p …>)}`, `{lead.bio && (<p …>)}`
  - `const [lead, ...rest] = people;` and `{rest.length > 0 && (<ul …>)}` — rest-spread + length check
  - `{person.bio && (<span …>)}` — only in the `feature` branch's `rest` list, **not** in `compact`
  - `onDark && "text-white"` on the name spans; `onDark ? "text-ccjv-cream" : "text-ccjv-green"` on `lead.scope`
- **Variants**: `variant?: "feature" | "compact"` — 2 keys, **structural**:
  - `feature` (**default**) → destructures `[lead, ...rest]`; renders a **dominant lead block** with a `aspect-3/4` photo, optional uppercase `scope`, a large serif `<h3>` (`clamp(1.8rem,…)`), role and optional `bio`; then a **separate `<ul className="mt-14 …">`** for `rest` where each notice also renders `person.bio`
  - `compact` → **no lead block, no `scope`, no `bio`**; a single `<ul>` of notices with a fixed `h-20 w-16` thumbnail, `text-[1.15rem]` serif name and role only
  - `onDark` is orthogonal (colour only).
- **Fallbacks**: `people.length === 0` → `<ContentPending>` with the hardcoded `what`/`hint` strings (never `null`, never an empty grid). `variant = "feature"`, `onDark = false`. `person.photo` undefined → no thumbnail (the notice becomes text-only; the lead keeps an empty framed box). `person.bio` undefined → no bio node. `rest.length === 0` (i.e. `people.length === 1`) → the notices `<ul>` is not rendered at all.
- **Consumers**: **NONE** (0 import statements anywhere under `frontend/src`).
- **Reuse breadth**: **0 — dead code.** Note `ContentPending`'s only *component-level* consumer is this unreachable file, so `ContentPending`'s block variant is only exercised from three pages.

## COMPONENT: PhotoDuo
- **file**: `src/components/editorial/PhotoDuo.tsx` (2146 bytes, 77 lines)
- **kind**: server
- **Responsibility**: A diptych: two photographs answering each other (before/after, inside/outside), not two decorative images.
- **Exact props type (verbatim)**:
```ts
export interface PhotoDuoProps {
  left: { src: string; caption?: string };
  right: { src: string; caption?: string };
  /** `offset` décale la seconde image vers le bas pour casser l'alignement. */
  variant?: "equal" | "offset";
  className?: string;
}
```
- **Destructured & rendered**: `left, right, variant = "equal", className` — all rendered.
- **Hardcoded internal content**: no French literal, no image path, no href. Both `<Image … alt="" fill sizes="(max-width: 640px) 100vw, 45vw" className="object-cover" />` use a **hardcoded `alt=""`** and an identical `sizes`.
- **Internal structure**:
  1. `<div className={cn("grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8", variant === "offset" && "sm:items-start", className)}>`
  2. `<figure>` → `<div className={cn("relative overflow-hidden bg-ccjv-line", variant === "offset" ? "aspect-3/4" : "aspect-4/5")}>` → `<Image src={left.src} …/>` → `{left.caption && <figcaption className="mt-3 border-t border-ccjv-line pt-3 font-sans text-[0.76rem] leading-relaxed text-ccjv-ink-secondary">{left.caption}</figcaption>}`
  3. `<figure className={cn(variant === "offset" && "sm:mt-16")}>` → `<div className={cn("relative overflow-hidden bg-ccjv-line", variant === "offset" ? "aspect-square" : "aspect-4/5")}>` → `<Image src={right.src} …/>` → `{right.caption && <figcaption …>{right.caption}</figcaption>}`
- **Conditional rendering**:
  - `variant === "offset" && "sm:items-start"` (grid)
  - `variant === "offset" ? "aspect-3/4" : "aspect-4/5"` (left frame)
  - `{left.caption && (<figcaption …>)}`
  - `variant === "offset" && "sm:mt-16"` (right figure)
  - `variant === "offset" ? "aspect-square" : "aspect-4/5"` (right frame)
  - `{right.caption && (<figcaption …>)}`
- **Variants**: `variant?: "equal" | "offset"` — 2 keys, **styling only** (the JSX tree is identical; only the two frame ratios and the right figure's top margin change):
  - `"equal"` (**default**) → left `aspect-4/5`, right `aspect-4/5`, no offset, no `sm:items-start`
  - `"offset"` → left `aspect-3/4`, right `aspect-square`, right figure `sm:mt-16`, grid `sm:items-start`
- **Fallbacks**: `variant = "equal"`. `left.caption`/`right.caption` undefined → no `<figcaption>` (frames still render). `left`/`right` are **required objects**; there is no guard for a missing `src`.
- **Consumers**:
  - `src/app/communaute/temoignages/page.tsx:6` — `<PhotoDuo variant="offset" left={{ src: images.assemblee }} right={{ src: images.fraternite }} />` (no captions passed, so the `figcaption` code path never executes in production)
- **Reuse breadth**: **1 consumer**

## COMPONENT: PhotoGallery
- **file**: `src/components/editorial/PhotoGallery.tsx` (4318 bytes, 149 lines)
- **kind**: server
- **Responsibility**: A narrative gallery in three shapes: asymmetric mosaic (first image dominates), horizontal snap strip, or unequal-height columns.
- **Exact props type (verbatim)**:
```ts
export type PhotoGalleryVariant = "mosaic" | "strip" | "columns";

export interface PhotoGalleryProps {
  images: readonly string[];
  captions?: readonly string[];
  variant?: PhotoGalleryVariant;
  className?: string;
}
```
- **Destructured & rendered**: `images, captions, variant = "mosaic", className` — all rendered.
- **Hardcoded internal content**: no French literal, no image path (images are props), no href. Every `<Image>` uses `alt=""`.
- **Internal structure** — three branches, plus a guard:
  1. `if (images.length === 0) return null;`
  2. **`strip`**: `<ul className={cn("-mx-[clamp(16px,4vw,48px)] flex snap-x snap-mandatory gap-4 overflow-x-auto px-[clamp(16px,4vw,48px)] pb-4", className)}>` → `images.map((src, index) => <li key={src} className="w-[76vw] shrink-0 snap-start sm:w-[46vw] lg:w-[30vw]"><div className="relative aspect-4/5 overflow-hidden bg-ccjv-line"><Image src={src} alt="" fill sizes="(max-width: 640px) 76vw, 30vw" className="object-cover" /></div>{captions?.[index] && <p className="mt-3 border-t border-ccjv-line pt-3 font-sans text-[0.76rem] text-ccjv-ink-secondary">{captions[index]}</p>}</li>)`
  3. **`columns`**: `<div className={cn("grid grid-cols-2 gap-5 lg:grid-cols-3", className)}>` → `images.map((src, index) => <figure key={src} className={cn(index % 3 === 1 && "lg:mt-12", index % 2 === 1 && "mt-6")}><div className={cn("relative overflow-hidden bg-ccjv-line", index % 3 === 0 ? "aspect-3/4" : "aspect-square")}><Image src={src} alt="" fill sizes="(max-width: 1024px) 45vw, 30vw" className="object-cover" /></div>{captions?.[index] && <figcaption className="mt-3 font-sans text-[0.74rem] leading-relaxed text-ccjv-ink-secondary">{captions[index]}</figcaption>}</figure>)`
  4. **`mosaic` (default)**: `const [lead, ...rest] = images; const supporting = rest.slice(0, 4);` → `<div className={cn("grid grid-cols-2 gap-5 lg:grid-cols-12 lg:gap-6", className)}>` → lead `<figure className="col-span-2 lg:col-span-7 lg:row-span-2"><div className="relative aspect-4/3 h-full overflow-hidden bg-ccjv-line lg:aspect-auto lg:min-h-[30rem]"><Image src={lead} alt="" fill sizes="(max-width: 1024px) 100vw, 55vw" className="object-cover" /></div>{captions?.[0] && <figcaption …>{captions[0]}</figcaption>}</figure>` → `supporting.map((src, index) => <figure key={src} className="lg:col-span-5"><div className={cn("relative overflow-hidden bg-ccjv-line", index === 0 ? "aspect-16/10" : "aspect-4/3")}><Image src={src} alt="" fill sizes="(max-width: 1024px) 50vw, 35vw" className="object-cover" /></div>{captions?.[index + 1] && <figcaption …>{captions[index + 1]}</figcaption>}</figure>)`
- **Conditional rendering**:
  - `if (images.length === 0) return null;` — length check
  - `if (variant === "strip") { return … }`, `if (variant === "columns") { return … }` — early returns
  - `images.map(...)` (strip, columns), `supporting.map(...)` (mosaic)
  - `{captions?.[index] && (…)}` — optional chaining + `&&`, in all three branches
  - `{captions?.[0] && (…)}` and `{captions?.[index + 1] && (…)}` — mosaic (note: mosaic's caption indices are offset by 1 for the supporting images, so `captions[0]` belongs to the lead and `captions[1..4]` to the supporting four)
  - `index % 3 === 1 && "lg:mt-12"`, `index % 2 === 1 && "mt-6"` (columns)
  - `index % 3 === 0 ? "aspect-3/4" : "aspect-square"` (columns ratio ternary)
  - `index === 0 ? "aspect-16/10" : "aspect-4/3"` (mosaic supporting ratio ternary)
  - `.slice(0, 4)` — **mosaic silently caps the supporting images at 4**, so at most **5 of `images` are ever rendered** in the default variant
- **Variants**: `variant?: PhotoGalleryVariant` — 3 keys, **structural**:
  - `mosaic` (**default**) → 12-column grid; 1 lead figure spanning `col-span-2 lg:col-span-7 lg:row-span-2` with `aspect-4/3` (mobile) / `lg:aspect-auto lg:min-h-[30rem]`, plus up to **4** supporting figures at `lg:col-span-5`; captions offset by `+1`; **images beyond index 4 are dropped**
  - `strip` → a single `<ul>` with negative horizontal margins and `overflow-x-auto` + `snap-x snap-mandatory`; fixed slide widths `76vw`/`46vw`/`30vw`; captions get `border-t`; **renders all images**
  - `columns` → `grid-cols-2 lg:grid-cols-3`; per-index ratio alternation (`index % 3 === 0` → `aspect-3/4`, else `aspect-square`) and per-index margin stagger; captions have **no** `border-t`; **renders all images**
- **Fallbacks**: `images.length === 0` → **`null`**. `variant = "mosaic"`. `captions` undefined → **no caption node in any branch** (all caption reads use `captions?.[i]`). A `captions` array shorter than `images` → missing entries simply do not render (no placeholder). `className` undefined → no extra class.
- **Consumers**:
  - `src/app/publications/enseignements/page.tsx:6`
  - `src/app/publications/mediatheque/page.tsx:7`
  - `src/app/publications/[slug]/page.tsx:7`
  - `src/app/vie-de-leglise/evenements/[slug]/page.tsx:7`
- **Reuse breadth**: **2-5 consumers (4)**

### Consumer prop-shape divergence — `PhotoGallery`
All four call sites pass **only `images` + `variant`**; **`captions` is never passed by any consumer**, so every `figcaption` / caption `<p>` in this component is dead in production:
- `enseignements/page.tsx:178` — `variant="strip" images={photoPool.slice(0, 3)}`
- `mediatheque/page.tsx:96-101` — two calls: `variant="mosaic" images={photoPool.slice(0, 5)}` and `variant="columns" className="mt-16 lg:mt-20" images={photoPool.slice(5, 11)}` (the only call site with a `className`; passes 6 images to `columns`, which renders all 6)
- `publications/[slug]/page.tsx:262` — `variant="mosaic" images={gallery}` where `gallery` is `.slice(0, 5)`
- `evenements/[slug]/page.tsx:218` — `variant="mosaic" images={event.gallery}`
  Because `mosaic` itself slices to 5, passing a 5-element array (`mediatheque`, `[slug]`) means the 5th image **is** rendered and only the `slice(0,4)` cap is binding for longer arrays (`evenements/[slug]` passes an unbounded `event.gallery`).

## COMPONENT: PortraitPanel
- **file**: `src/components/editorial/PortraitPanel.tsx` (2702 bytes, 111 lines)
- **kind**: server
- **Responsibility**: A single large portrait — person, function, what they do — with an optional attributed quote.
- **Exact props type (verbatim)**:
```ts
export interface PortraitPanelProps {
  image: string;
  name: string;
  role: string;
  scope?: string;
  bio?: string;
  /** Mots de la personne elle-même (jamais attribués sans source). */
  quote?: string;
  side?: "left" | "right";
  onDark?: boolean;
  className?: string;
}
```
- **Destructured & rendered**: `image, name, role, scope, bio, quote, side = "left", onDark = false, className` — all rendered.
- **Hardcoded internal content**: no French literal, no image path, no href. `<Image src={image} alt="" fill sizes="(max-width: 1024px) 100vw, 38vw" className="object-cover" />` — `alt=""` hardcoded (so the portrait has **no accessible name**).
- **Internal structure**:
  1. `const imageFirst = side === "left";`
  2. `<div className={cn("grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14", className)}>`
  3. `<figure className={cn("lg:col-span-5", !imageFirst && "lg:order-2")}>` → `<div className="relative aspect-4/5 overflow-hidden bg-ccjv-line"><Image … /></div>`
  4. `<div className={cn("lg:col-span-7", !imageFirst && "lg:order-1")}>` → `{scope && <p …>}` → `<h3 className="mt-4 font-serif text-[clamp(1.9rem,1.1rem+2.2vw,3rem)] leading-[1.1]">{name}</h3>` → `<p className={cn("mt-3 font-sans text-[1.02rem]", onDark ? "text-white/70" : "text-ccjv-ink-secondary")}>{role}</p>` → `{bio && <p …>}` → `{quote && <blockquote className={cn("mt-8 max-w-[52ch] border-l-2 pl-5 font-serif text-[1.1rem] leading-[1.55] italic", onDark ? "border-ccjv-cream/45 text-white/90" : "border-ccjv-green/45 text-ccjv-ink")}>{quote}</blockquote>}`
- **Conditional rendering**:
  - `side === "left"` → `imageFirst` drives `!imageFirst && "lg:order-2"` / `"lg:order-1"` (CSS order swap, **not** DOM reorder)
  - `{scope && (<p …>)}`
  - `{bio && (<p …>)}`
  - `{quote && (<blockquote …>)}`
  - `onDark && "text-white"` (name), `onDark ? "text-white/70" : "text-ccjv-ink-secondary"` (role + bio), `onDark ? "border-ccjv-cream/45 text-white/90" : "border-ccjv-green/45 text-ccjv-ink"` (quote)
- **Variants**: `side?: "left" | "right"` — 2 keys, **styling only** (flex `order` classes; the DOM order stays figure-then-text in both):
  - `"left"` (**default**) → figure `lg:col-span-5` first, text `lg:col-span-7` second
  - `"right"` → same DOM, but figure gets `lg:order-2` and text `lg:order-1`
  - `onDark` is orthogonal (colour only). No `size`/`align`.
- **Fallbacks**: `side = "left"`, `onDark = false`. `scope`, `bio`, `quote` undefined → their nodes are absent. `image`, `name`, `role` required.
- **Consumers**: **NONE** (0 import statements anywhere under `frontend/src`).
- **Reuse breadth**: **0 — dead code.** It is the only component carrying the `side` variant, and it is never rendered.

## COMPONENT: Prose
- **file**: `src/components/editorial/Prose.tsx` (1322 bytes, 53 lines)
- **kind**: server (pure-visual, no directive)
- **Responsibility**: Long-form body text at a controlled measure, styled through the global `.prose-body` component class.
- **Exact props type (verbatim)**:
```ts
export interface ProseProps {
  children: ReactNode;
  /** Paragraphes en corps de lecture (18px) plutôt qu'en texte courant. */
  large?: boolean;
  /** Lettrine sur le premier paragraphe. */
  dropcap?: boolean;
  width?: "narrow" | "normal" | "wide";
  /** Texte clair sur fond sombre. */
  onDark?: boolean;
  className?: string;
}
```
- **Destructured & rendered**: `children, large = false, dropcap = false, width = "normal", onDark = false, className` — all rendered.
- **Hardcoded internal content**: no French literal, no image path, no href. Class-only.
- **Internal structure**:
  1. `const widthClass = { narrow: "max-w-[56ch]", normal: "max-w-[68ch]", wide: "max-w-[80ch]" } as const;`
  2. Single `<div className={cn("prose-body", widthClass[width], large ? "text-[1.0625rem] leading-[1.75]" : "text-[0.9875rem] leading-[1.72]", onDark ? "text-white/72" : "text-ccjv-ink-secondary", dropcap && "prose-dropcap", className)}>{children}</div>`
- **Conditional rendering**:
  - `large ? "text-[1.0625rem] leading-[1.75]" : "text-[0.9875rem] leading-[1.72]"` — ternary
  - `onDark ? "text-white/72" : "text-ccjv-ink-secondary"` — ternary
  - `dropcap && "prose-dropcap"` — `&&`
  - No `.map`, no length check.
- **Variants**: `width?: "narrow" | "normal" | "wide"` — 3 keys, **styling only**, an internal record (line 23-27), changing only `max-w-*`:
  - `"narrow"` → `max-w-[56ch]`
  - `"normal"` (**default**) → `max-w-[68ch]`
  - `"wide"` → `max-w-[80ch]`
  - `large`, `dropcap`, `onDark` are three orthogonal booleans (styling only). No `variant`/`size`/`tone` prop.
- **Fallbacks**: `large = false`, `dropcap = false`, `width = "normal"`, `onDark = false`. `className` undefined → dropped. `children` is **required**; an empty `children` renders an empty `<div className="prose-body …">` (no guard).
- **Consumers**:
  - `src/app/communaute/temoignages/page.tsx:4`
  - `src/app/publications/enseignements/page.tsx:4`
  - `src/app/publications/mediatheque/page.tsx:5`
  - `src/app/publications/[slug]/page.tsx:5`
  - `src/app/recherche/page.tsx:3`
  - `src/app/vie-de-leglise/evenements/[slug]/page.tsx:5`
- **Reuse breadth**: **6+ consumers (6)**

### Consumer prop-shape divergence — `Prose`
Five distinct prop combinations across the six call sites:
- `recherche/page.tsx:118` and `:131` — `<Prose className="mt-6|mt-5" width="narrow">` (narrow + className, small text)
- `temoignages/page.tsx:82` — `<Prose dropcap large className="mt-7">` (the **only** `dropcap` call site) ; `:217` `<Prose className="mt-6" width="narrow">` ; `:252` `<Prose className="mt-6">` (bare)
- `enseignements/page.tsx:93` — `<Prose width="narrow">` (no className)
- `mediatheque/page.tsx:68` — `<Prose className="mb-14 max-w-[62ch]" large>` (**`large` + an ad-hoc `max-w` that overrides the width system**, no `width` prop → `normal` `max-w-[68ch]` is also emitted, so two competing max-widths land on the same element)
- `publications/[slug]/page.tsx:187` — `<Prose large width="narrow">` (no className; wraps `.map`-generated `<p key={paragraph}>`)
- `evenements/[slug]/page.tsx:136` — `<Prose large className="mt-6">` (no `width`)
  `onDark` is **never passed by any consumer** even though `temoignages`' `epilogue` band is `tone="dark"` — inside that band the component used is `ScriptureBlock`, not `Prose`.

## COMPONENT: PullQuote
- **file**: `src/components/editorial/PullQuote.tsx` (1646 bytes, 64 lines)
- **kind**: server (pure-visual, no directive)
- **Responsibility**: An editorial quote — **a human voice, never Scripture** (the doc-comment explicitly splits this responsibility from `ScriptureBlock`).
- **Exact props type (verbatim)**:
```ts
export interface PullQuoteProps {
  text: string;
  /** Auteur ou fonction. Omettre si la citation n'est pas attribuée. */
  attribution?: string;
  align?: "left" | "center" | "marginal";
  onDark?: boolean;
  className?: string;
}
```
- **Destructured & rendered**: `text, attribution, align = "left", onDark = false, className` — all rendered.
- **Hardcoded internal content**: no French literal, no image path, no href. Class-only. (The « » guillemets are **not** added by this component — the consumer must inline them; see `temoignages` passing `text={`« ${lead.quote} »`}`.)
- **Internal structure**:
  1. `const centered = align === "center"; const marginal = align === "marginal";`
  2. `<figure className={cn(marginal ? "border-l-2 border-ccjv-green pl-5" : "border-y border-ccjv-line py-9", centered && "text-center", className)}>`
  3. `<blockquote className={cn("font-serif", marginal ? "text-[1.05rem] leading-[1.55] italic" : "text-[clamp(1.35rem,0.8rem+1.8vw,2.15rem)] leading-[1.34]", centered && "mx-auto max-w-[30ch]", !marginal && !centered && "max-w-[34ch]", onDark ? "text-white/92" : "text-ccjv-ink")}>{text}</blockquote>`
  4. `{attribution && (<figcaption className={cn("mt-5 font-sans text-[0.7rem] font-semibold tracking-[0.18em] uppercase", onDark ? "text-ccjv-cream" : "text-ccjv-green")}>{attribution}</figcaption>)}`
- **Conditional rendering**:
  - `marginal ? "border-l-2 border-ccjv-green pl-5" : "border-y border-ccjv-line py-9"` — figure ternary
  - `centered && "text-center"`
  - `marginal ? "text-[1.05rem] leading-[1.55] italic" : "text-[clamp(1.35rem,0.8rem+1.8vw,2.15rem)] leading-[1.34]"` — blockquote ternary
  - `centered && "mx-auto max-w-[30ch]"`
  - `!marginal && !centered && "max-w-[34ch]"` — double negation, applies **only** to the default `left` case
  - `onDark ? "text-white/92" : "text-ccjv-ink"`
  - `{attribution && (<figcaption …>)}`
- **Variants**: `align?: "left" | "center" | "marginal"` — 3 keys, **styling only** (the `<figure>` → `<blockquote>` → `<figcaption>` tree never changes):
  - `"left"` (**default**) → frame `border-y border-ccjv-line py-9`; quote `clamp(1.35rem,…)` non-italic, `max-w-[34ch]`, not centred
  - `"center"` → same `border-y py-9` frame **plus** `text-center`; quote `max-w-[30ch]` and `mx-auto`; `max-w-[34ch]` is suppressed by the `!centered` guard
  - `"marginal"` → frame becomes `border-l-2 border-ccjv-green pl-5` (**no `border-y`, no `py-9`**, a green left rule instead of two hairlines); quote drops to `text-[1.05rem] leading-[1.55] italic` and **neither** max-width class applies
  - `onDark` is orthogonal (colour only).
- **Fallbacks**: `align = "left"`, `onDark = false`. `attribution` undefined → no `<figcaption>` (the intended "unattributed quote" case). `text` is required.
- **Consumers**:
  - `src/app/communaute/temoignages/page.tsx:7` — `<PullQuote className="mt-10" align="left" text={`« ${lead.quote} »`} />` (no `attribution`, no `onDark`)
- **Reuse breadth**: **1 consumer** — and both `align="center"` and `align="marginal"` are never used, and neither is `attribution`.

## COMPONENT: ScriptureBlock
- **file**: `src/components/editorial/ScriptureBlock.tsx` (1967 bytes, 83 lines)
- **kind**: server (a thin adapter over `VerseSection`)
- **Responsibility**: Scripture inside the editorial flow. Maps an 11-key legacy `variant` union down to `VerseSection`'s 3 layout variants and forwards everything else.
- **Exact props type (verbatim)**:
```ts
export type ScriptureVariant =
  | "inline"
  | "framed"
  | "marginal"
  | "wide"
  | "concluding"
  | "split"
  | "left"
  | "center"
  | "centered"
  | "both"
  | "flanked";

export interface ScriptureBlockProps {
  text: string;
  reference: string;
  variant?: ScriptureVariant;
  /** Précision éditoriale / surtitre */
  context?: string;
  /** Traduction */
  translation?: string;
  onDark?: boolean;
  tone?: VerseTone;
  backgroundColor?: string;
  photos?: string[];
  leftPhoto?: string;
  rightPhoto?: string;
  className?: string;
}
```
- **Destructured & rendered**: `text, reference, variant = "center", context, onDark = false, tone, backgroundColor, photos, leftPhoto, rightPhoto, className`. **`translation` is declared in the props interface but NEVER destructured and NEVER rendered** — passing it has no effect whatsoever.
- **Hardcoded internal content**: no French literal, no image path, no href. `compact` is passed to `VerseSection` as a bare boolean attribute (`compact` === `compact={true}`), so **ScriptureBlock is always compact** and its consumers cannot opt out.
- **Internal structure**:
  1. `let targetVariant: VerseVariant = "center";`
  2. `if (variant === "left" || variant === "split" || variant === "marginal" || variant === "inline") { targetVariant = variant === "inline" || variant === "marginal" ? "center" : "left"; } else if (variant === "both" || variant === "flanked") { targetVariant = "both"; } else if (variant === "wide") { targetVariant = "both"; } else { targetVariant = "center"; }`
  3. `const effectiveTone: VerseTone = tone || (onDark ? "dark" : "transparent");`
  4. `<VerseSection text={text} reference={reference} variant={targetVariant} tone={effectiveTone} onDark={onDark} backgroundColor={backgroundColor} context={context} photos={photos} leftPhoto={leftPhoto} rightPhoto={rightPhoto} compact className={className} />`
- **Conditional rendering**: none in JSX. All branching happens in the `if/else if/else` chain and in the `tone || (onDark ? "dark" : "transparent")` fallback expression.
- **Variants**: `variant?: ScriptureVariant` — **11 keys, but only 3 distinct outcomes**; the mapping is structural (it selects a `VerseSection` layout) yet lossy:
  | `variant` | → `targetVariant` |
  |---|---|
  | `"left"` | `"left"` |
  | `"split"` | `"left"` |
  | `"marginal"` | `"center"` |
  | `"inline"` | `"center"` |
  | `"both"` | `"both"` |
  | `"flanked"` | `"both"` |
  | `"wide"` | `"both"` |
  | `"framed"` | `"center"` (falls into `else`) |
  | `"concluding"` | `"center"` (falls into `else`) |
  | `"center"` (**default**) | `"center"` |
  | `"centered"` | `"center"` |
  So **8 of the 11 keys produce `"center"`**, 2 produce `"left"`, 3 produce `"both"` (11 inputs → 3 outputs); `"framed"` and `"concluding"` have no distinct treatment at all.
  `tone`/`onDark`/`backgroundColor` are forwarded styling axes handled by `VerseSection`.
- **Fallbacks**: `variant = "center"`, `onDark = false`. `tone` undefined → `onDark ? "dark" : "transparent"` (so **`tone="transparent"` is the default**, meaning no background and inherited text colour, unlike `VerseSection`'s own default of `tone="offwhite"`). `context`, `backgroundColor`, `photos`, `leftPhoto`, `rightPhoto`, `className` undefined → forwarded as `undefined` and handled by `VerseSection`. **`translation` has no fallback because it is never read.**
- **Consumers**:
  - `src/app/communaute/temoignages/page.tsx:8` — `<ScriptureBlock variant="wide" onDark context="Rendre grâce" text={verses.louange.text} reference={verses.louange.reference} />` (no `translation`)
  - `src/app/publications/enseignements/page.tsx:7` — `<ScriptureBlock variant="inline" context="Pourquoi nous revenons à la Parole" text={verses.parole.text} reference={verses.parole.reference} />` (no `onDark`, no `translation`)
- **Reuse breadth**: **2-5 consumers (2)**

### Consumer prop-shape divergence — `ScriptureBlock`
- `temoignages/page.tsx:235-241` — `variant="wide"` (**→ `targetVariant = "both"`, and because `wide` maps to `both`, `leftPhoto`/`rightPhoto`/`photos` are all `undefined` so `VerseSection` falls back to `defaultImages`**), `onDark` (→ `effectiveTone = "dark"`), `context`, `text`, `reference`.
- `enseignements/page.tsx:103-108` — `variant="inline"` (**→ `targetVariant = "center"`**, i.e. a two-column sub-column renders a centred quote), **no `onDark`** (→ `effectiveTone = "transparent"`, so the block inherits its surroundings), `context`, `text`, `reference`.
  So the same component renders a dark flanked-photo layout on one page and a transparent centred quote on another, from a single 11-value prop whose names (`wide`, `inline`) do not match what is rendered (`both`, `center`).

## COMPONENT: StepsList
- **file**: `src/components/editorial/StepsList.tsx` (2397 bytes, 76 lines)
- **kind**: server (pure-visual, no directive)
- **Responsibility**: An ordered walkthrough in two shapes: a vertical numbered rail, or a 4-column horizontal row.
- **Exact props type (verbatim)**:
```ts
export interface Step {
  title: string;
  text: string;
}

export interface StepsListProps {
  steps: readonly Step[];
  variant?: "vertical" | "horizontal";
  onDark?: boolean;
  className?: string;
}
```
- **Destructured & rendered**: `steps, variant = "vertical", onDark = false, className` — all rendered.
- **Hardcoded internal content**: no French literal, no image path, no href. Numbers are derived (`String(index + 1).padStart(2, "0")` for horizontal; `{index + 1}` bare for vertical).
- **Internal structure**:
  1. `const line = onDark ? "border-white/15" : "border-ccjv-line"; const muted = onDark ? "text-white/65" : "text-ccjv-ink-secondary"; const accent = onDark ? "text-ccjv-cream" : "text-ccjv-green";`
  2. **`horizontal` branch**: `<ol className={cn("grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4", className)}>` → `steps.map((step, index) => <li key={step.title} className={cn("border-t pt-6", line)}><p className={cn("font-serif text-[1.4rem] leading-none", accent)} aria-hidden="true">{String(index + 1).padStart(2, "0")}</p><h3 className={cn("mt-4 font-serif text-[1.15rem]", onDark && "text-white")}>{step.title}</h3><p className={cn("mt-3 font-sans text-[0.9rem] leading-relaxed", muted)}>{step.text}</p></li>)`
  3. **`vertical` (default, no early return — it is the trailing `return`)**: `<ol className={cn("relative border-l pl-10 max-md:pl-8", line, className)}>` → `steps.map((step, index) => <li key={step.title} className="relative pb-14 last:pb-0"><span className={cn("absolute top-1 -left-[41px] flex h-6 w-6 items-center justify-center border font-sans text-[0.68rem] font-semibold max-md:-left-[33px]", onDark ? "border-white/25 bg-ccjv-black text-ccjv-cream" : "border-ccjv-line bg-ccjv-offwhite text-ccjv-green")} aria-hidden="true">{index + 1}</span><h3 className={cn("font-serif text-[1.3rem]", onDark && "text-white")}>{step.title}</h3><p className={cn("mt-3 max-w-[58ch] leading-[1.7]", muted)}>{step.text}</p></li>)`
- **Conditional rendering**:
  - `if (variant === "horizontal") { return … }` — early return
  - `steps.map((step, index) => …)` in both branches, `key={step.title}`
  - `onDark && "text-white"` (h3, both branches)
  - `onDark ? "border-white/25 bg-ccjv-black text-ccjv-cream" : "border-ccjv-line bg-ccjv-offwhite text-ccjv-green"` (vertical number badge ternary)
  - No `.slice`, no length check
- **Variants**: `variant?: "vertical" | "horizontal"` — 2 keys, **structural and content-formatting**:
  - `vertical` (**default**) → `<ol className="relative border-l pl-10 max-md:pl-8">`; the number is an **absolutely-positioned bordered square badge** (`h-6 w-6`, `-left-[41px]`/`-left-[33px]`) rendering a **bare integer** `{index + 1}`, marked `aria-hidden`; `h3` = `text-[1.3rem]`; body `max-w-[58ch] leading-[1.7]`; items separated by `pb-14 last:pb-0`
  - `horizontal` → `<ol>` CSS grid `1 / 2 / 4` columns; the number is a **serif paragraph above the title** (`font-serif text-[1.4rem] leading-none`, coloured `accent`), rendered as **zero-padded `01`/`02`…** (`String(index+1).padStart(2, "0")`), also `aria-hidden`; `h3` = `text-[1.15rem]`; body `font-sans text-[0.9rem] leading-relaxed` (no max-width); items separated by `border-t pt-6` instead of a shared left rail
  - `onDark` is orthogonal (colour only, including the vertical badge).
- **Fallbacks**: `variant = "vertical"`, `onDark = false`. `steps` is **required**; an empty `steps` array renders an **empty `<ol>`** (in `vertical` that is still a visible `border-l` rail with no items — there is no length guard and no placeholder). `key={step.title}` means **duplicate titles would collide**.
- **Consumers**:
  - `src/app/publications/ressources/page.tsx:5` — `<StepsList variant="vertical" steps={steps} />` where `steps` is a module-scope `Step[]` of 3 items typed via `import { StepsList, type Step }`
- **Reuse breadth**: **1 consumer** — and `variant="horizontal"` is never used, so the zero-padded `01` badge styling is dead.

---

# 4. `src/components/forms/`

## COMPONENT: PrayerRequestForm
- **file**: `src/components/forms/PrayerRequestForm.tsx` (8913 bytes, 208 lines)
- **kind**: **client** (`"use client"` at line 1)
- **Responsibility**: A prayer-intention form with confidentiality radio choice; on submit it simulates a 600 ms async send and swaps to a confirmation panel with a prefilled WhatsApp deep link.
- **Exact props type (verbatim)**: **none.** The signature is `export function PrayerRequestForm() {` — the component takes **zero props**.
- **Destructured & rendered**: nothing is destructured (no props). Internal state, all rendered or read:
  - `name` (rendered only inside the WhatsApp message), `contact` (**set and reset but NEVER read anywhere — dead state**), `request` (rendered from the textarea + the WhatsApp message + the submit `disabled` check), `confidentiality` (`"private" | "community"`, drives both radios' `checked`), `submitted` (drives the whole-panel swap), `submitting` (label + `disabled`).
- **Hardcoded internal content** (all rendered):
  - `import { site } from "@/data/mock/site"` → the WhatsApp href is built from `site.whatsappHref` (data, not a literal).
  - **French literals — confirmation panel**: `Votre demande a bien été reçue.` / `Merci de nous accorder votre confiance. Notre équipe d&apos;intercession la portera fidèlement dans la prière dès aujourd&apos;hui.` / `« Que la paix de Dieu, qui surpasse toute intelligence, garde votre cœur et vos pensées. »` (**an unattributed scripture quote hardcoded in the component**) / `Déposer une autre demande` / `Confirmer sur WhatsApp →`
  - **French literals — WhatsApp prefill template** (lines 36-38): `Bonjour Centre Chrétien Jésus ma Vie,\nJe souhaite vous confier une intention de prière :\n\n` + `De la part de : ${name}\n` + `Demande : ${request}` and, when `request` is empty, `Je préfère vous écrire directement ici.`
  - **French literals — form**: `Votre intention de prière *` / `Quelques mots suffisent. Écrivez simplement ce que vous vivez ou ce pour quoi vous souhaitez que nous priions.` / placeholder `Écrivez votre demande ici...` / `Votre prénom ou nom (facultatif)` / placeholder `Laissez vide pour rester anonyme` / `WhatsApp ou téléphone (facultatif)` / placeholder `Pour un message d'encouragement` / `Confidentialité de votre demande` / `Confidentiel :` + `Partagé strictement avec l&apos;équipe pastorale d&apos;intercession.` / `Porter en assemblée :` + `Mentionnée lors des temps de prière communautaires (sans nom de famille).` / `Engagement CCJV :` + `Votre demande ne sera jamais publiée sur Internet ni sur les réseaux sociaux. Le respect de votre vie privée et de votre dignité est absolu.` / `Transmission en cours...` / `Transmettre ma demande de prière`
  - **No literal image path** (uses `<CrossMark size="md" />` twice, once in the success panel and once… only in the success panel — line 45; the form body has no cross).
  - **Hrefs**: the only href is the computed `whatsappPrefilledHref` (no literal URL).
  - **Undefined design token**: the submit button uses `hover:bg-ccjv-green-dark` and the success WhatsApp link also uses `hover:bg-ccjv-green-dark` — **`ccjv-green-dark` is not defined in `globals.css`** (the defined token is `--color-ccjv-green-strong`), so both hover states are dead classes.
- **Internal structure**:
  1. 6 × `useState`
  2. `handleSubmit` — `e.preventDefault(); if (!request.trim()) return; setSubmitting(true); setTimeout(() => { setSubmitting(false); setSubmitted(true); }, 600);`
  3. `handleReset` — resets all 5 string/enum states (**not** `submitting`)
  4. `const whatsappPrefilledHref = \`${site.whatsappHref}?text=${encodeURIComponent(\`…\`)}\``
  5. **early return** `if (submitted)`: `<div className="border border-ccjv-line bg-white p-8 md:p-12 text-center">` → icon `<div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center border border-ccjv-green/30 bg-ccjv-green/10 text-ccjv-green"><CrossMark size="md" /></div>` → `<h3>` → `<p>` (thanks) → `<p className="mt-4 font-serif text-base italic text-ccjv-green">` (**the hardcoded verse**) → action row `<div className="mt-8 flex flex-wrap justify-center gap-4">` with `<button type="button" onClick={handleReset} …>Déposer une autre demande</button>` and `<a href={whatsappPrefilledHref} target="_blank" rel="noopener noreferrer" …>Confirmer sur WhatsApp →</a>`
  6. **form**: `<form onSubmit={handleSubmit} className="border border-ccjv-line bg-white p-6 sm:p-10 md:p-12">` → `<div className="space-y-6">` →
     - (a) textarea block: `<label htmlFor="prayer-request">` + help `<p>` + `<textarea id="prayer-request" required rows={5} value={request} onChange={…} placeholder="Écrivez votre demande ici..." className="… rounded-none …" />`
     - (b) two-column grid `grid-cols-1 gap-6 sm:grid-cols-2` with `<input id="prayer-name">` and `<input id="prayer-contact">`
     - (c) confidentiality block `<div className="border-t border-ccjv-line pt-6">` → `<label>` + `<div className="mt-3 space-y-3">` with **two radio `<label>`s** (`value="private"` / `value="community"`), each `checked={confidentiality === …}` + `onChange={() => setConfidentiality(…)}`
     - (d) commitment note `<div className="bg-ccjv-offwhite p-4 text-xs font-sans text-ccjv-ink-secondary leading-relaxed border-l-2 border-ccjv-green">`
     - (e) submit `<div className="pt-2"><button type="submit" disabled={submitting || !request.trim()} …>{submitting ? "Transmission en cours..." : "Transmettre ma demande de prière"}</button></div>`
- **Conditional rendering**:
  - `if (!request.trim()) return;` (submit guard)
  - `if (submitted) { return (…confirmation panel…) }` — early return, **whole-panel swap**
  - `name ? \`De la part de : ${name}\n\` : ""` (message ternary)
  - `request ? \`Demande : ${request}\` : "Je préfère vous écrire directement ici."` (message ternary)
  - `disabled={submitting || !request.trim()}` — disables the submit button
  - `{submitting ? "Transmission en cours..." : "Transmettre ma demande de prière"}` — label ternary
  - `checked={confidentiality === "private"}` / `checked={confidentiality === "community"}` — two equality checks
  - **No `.map`, no `.slice`, no `length` check** — the two radios are written out twice by hand rather than mapped from an array
- **Variants**: **aucune variante** — no `variant`/`size`/`tone`/`align` prop, no internal record of styles, no switch. The only state-driven shape change is the submitted/unsubmitted panel swap, which is a state machine and not a variant.
- **Fallbacks**: no props → no prop fallbacks. `name` empty → the `De la part de :` line is omitted from the WhatsApp text. `request` empty → the submit button is `disabled` **and** `handleSubmit` early-returns; the WhatsApp link substitutes `Je préfère vous écrire directement ici.`. `contact` is never used, so there is no fallback for it. `submitted` starts `false`. The 600 ms `setTimeout` is never cleared on unmount (no `useEffect` cleanup, no `AbortController`).
- **Consumers**:
  - `src/app/communaute/priere-et-intercession/page.tsx:7` — `<PrayerRequestForm />` with **no props** (confirmed by the zero-prop signature)
- **Reuse breadth**: **1 consumer**

---

# 5. `src/components/layout/`

## COMPONENT: Footer
- **file**: `src/components/layout/Footer.tsx` (13795 bytes, 287 lines)
- **kind**: server (no directive, no hooks)
- **Responsibility**: The site footer: 5 columns of hardcoded navigation, a large logo, address, 3 social icons with inline SVGs, 2 action links, and a 3-zone legal bar.
- **Exact props type (verbatim)**: **none.** Signature: `export function Footer() {` — **zero props**.
- **Destructured & rendered**: nothing (no props). One local: `const year = new Date().getFullYear();` → rendered in the copyright line.
- **Hardcoded internal content** — **the single largest concentration of hardcoded content in the codebase**:
  - **French literals (column headings)**: `L&apos;Église`, `Vivre ensemble`, `Nourrir sa foi`, `Rester en lien`
  - **French literals + hrefs (column 1)**: `Accueil` → `/`; `Qui sommes-nous` → `/qui-sommes-nous`; `Organisation` → `/organisation`; `· Adultes` → `/organisation#adultes`; `· Ecodim (Enfants)` → `/organisation#enfants-ecodim`; `· Chorale` → `/organisation#chorale`; `Les visages du service` → `/organisation#responsables`
  - **French literals + hrefs (column 2)**: `Nos événements` → `/vie-de-leglise/evenements`; `Groupe de maison` → `/communaute/groupes-de-maison`; `Faire un don` → `/vie-de-leglise/faire-un-don`
  - **French literals + hrefs (column 4)**: `Enseignements` → `/publications/enseignements`; `Médiathèque` → `/publications/ressources` (**label/href mismatch**); `Actualités & blog` → `/publications/actualites`; `Guides d&apos;étude & Ressources` → `/publications/ressources` (a **duplicate href** of `Médiathèque`); `Prière & Intercession` → `/communaute/priere-et-intercession`; `Témoignages` → `/communaute/temoignages`; `FAQ` → `/vie-de-leglise/faq`
  - **French literals + hrefs (column 5)**: `Planifier une visite` → `/communaute/parcours-nouveau`; `Nous localiser` → `/vie-de-leglise/ou-nous-trouver`; `Demander une prière` → `/communaute/priere-et-intercession`; `Signaler un problème` → `/vie-de-leglise/ou-nous-trouver`; `Se connecter` → `/qui-sommes-nous`; `Recherche` → `/publications/ressources`
  - **Action links**: `NEWSLETTER` → `/publications/actualites`; `NOUS ÉCRIRE` → `/vie-de-leglise/ou-nous-trouver`
  - **Legal bar**: `Mentions légales` → `/mentions-legales`; `Confidentialité` → `/politique-de-confidentialite`; `Conditions` → `/conditions-generales`; `Accessibilité` → `/accessibilite`; and the copyright `© {year} CCJV Tous Droits Réservés.`
  - **Literal image path**: `src="/logo_2.png"` (line 93)
  - **Literal external hrefs / socials**: `https://www.tiktok.com/@ecodim_ccjv` (`aria-label="TikTok CCJV"`); `https://youtube.com` (`aria-label="YouTube CCJV"`); `https://www.instagram.com/ecodim_ccjv/` (`aria-label="Instagram CCJV"`) — **inlined as 3 literal strings here, while `FullscreenMenu` renders the same three links from `socials` in `@/data/mock/site`**
  - **Inlined SVG paths**: 3 brand-icon `<svg>` bodies (TikTok, YouTube, Instagram) written as raw `d="…"` attributes, ~1.5 KB of path data each in source
  - **Hrefs that do not match the nav model**: `legalNav` in `lib/nav.ts` declares `/confidentialite`, `/conditions`, `/recherche` — the Footer links instead to `/politique-de-confidentialite`, `/conditions-generales`, `/vie-de-leglise/faq`; and `Se connecter` points at `/qui-sommes-nous`
- **Internal structure**:
  1. `<footer className="bg-ccjv-black text-white selection:bg-white selection:text-black">`
  2. `<div className="container max-w-[1380px] py-16 lg:py-24">` ← **an ad-hoc `max-w` overriding the global `.container` max-width of 1200px**
  3. main grid `<div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8 xl:gap-10 items-start">`:
     - col 1 `lg:col-span-2` → `<h3>` `L&apos;Église` + `<ul className="mt-6 flex flex-col gap-3.5 font-sans text-[0.88rem] text-white/75">` with 7 hand-written `<li><Link>`
     - col 2 `lg:col-span-2` → `<h3>` `Vivre ensemble` + 3 `<li>`
     - col 3 `sm:col-span-2 lg:col-span-4 order-first lg:order-none mb-6 lg:mb-0 px-2 lg:px-4 lg:-ml-8` → `<Link href="/" aria-label={\`${site.name} — Accueil\`}><div className="relative h-36 w-36 sm:h-44 sm:w-44 md:h-48 md:w-48 lg:h-52 lg:w-52"><Image src="/logo_2.png" … /></div></Link>` → address `<p className="mt-4 max-w-[32ch] font-sans text-xs leading-relaxed text-white/70">{site.address}</p>` → social row `<div className="mt-4 flex items-center justify-center gap-5 text-white/80">` with 3 `<a>` + inline `<svg>` → action row `<div className="mt-6 flex flex-wrap items-center justify-center gap-3">` with 2 `<Link>`
     - col 4 `lg:col-span-2` → `<h3>` `Nourrir sa foi` + 7 `<li>`
     - col 5 `lg:col-span-2` → `<h3>` `Rester en lien` + 6 `<li>`
  4. bottom bar `<div className="border-t border-white/20">` → `<div className="container max-w-[1380px] flex flex-col gap-4 py-6 font-sans text-[0.78rem] text-white/65 md:flex-row md:items-center md:justify-between">` → left `<div className="flex items-center gap-6">` (2 legal links) + centre `<p className="text-center text-white/50">© {year} CCJV Tous Droits Réservés.</p>` + right `<div className="flex items-center gap-6 md:justify-end">` (2 more legal links)
- **Conditional rendering**: **none.** No `&&`, no ternary, no `.map`, no `.slice`, no `length` check anywhere in the file. Every link, heading, icon and legal entry is written literally. The only dynamic value is `{year}` and the two data reads `site.address` / `site.name`.
- **Variants**: **aucune variante** — no props at all, therefore no `variant`/`size`/`tone`/`align`, no record, no switch. The 5 columns differ in `lg:col-span` only, hardcoded per column.
- **Fallbacks**: no props → no prop fallbacks. `site.address` / `site.name` come from `@/data/mock/site` with no local guard. `new Date().getFullYear()` always returns a number.
- **Consumers**:
  - `src/app/layout.tsx:4`
- **Reuse breadth**: **1 consumer** (but the sole consumer is the root layout, so it renders on every route)

## COMPONENT: FullscreenMenu
- **file**: `src/components/layout/FullscreenMenu.tsx` (25244 bytes, 564 lines — the largest file in scope)
- **kind**: **client** (`"use client"` at line 1)
- **Responsibility**: The full-screen navigation overlay. Desktop = pillars list on the left + an animated submenu panel on the right; mobile = a 2-panel horizontal slide (list → submenu with a back button). Owns scroll lock, initial focus, Escape handling and a Tab focus trap.
- **Exact props type (verbatim)**:
```ts
export interface FullscreenMenuProps {
  open: boolean;
  onClose: () => void;
}
```
- **Destructured & rendered**: `open, onClose` — both used. Plus three `useState` (`activeDesktopPillar`, `activeMobilePillar`, `displayedMobilePillar`), two `useRef` (`overlayRef`, `closeRef`), a module-scope `FOCUSABLE` string and a module-scope `pillarVisuals` record.
- **Hardcoded internal content**:
  - **`pillarVisuals` record (`Record<string, { image: string; tag: string }>`, 6 literal keys, lines 21-46)** — keyed on *nav labels*:
    - `"Vie de l'Église"` → `image: images.communaute || "/media/ccjv-30.jpeg"`, `tag: "Rassemblements & Vie communautaire"`
    - `"Notre communauté"` → `image: images.fraternite || "/media/ccjv-35.jpeg"`, `tag: "Fraternité & Groupes de proximité"`
    - `"Communauté"` → `image: images.fraternite || "/media/ccjv-35.jpeg"`, `tag: "Fraternité & Groupes de proximité"` ← **duplicate label never used by `lib/nav.ts`**
    - `"Organisation"` → `image: images.identite || "/media/ccjv-27.jpeg"`, `tag: "Responsables & Départements actifs"`
    - `"Ressources"` → `image: images.predication || "/media/ccjv-11.jpeg"`, `tag: "Enseignements, Photos & Actualités"`
    - `"Publications & Médias"` → `image: images.predication || "/media/ccjv-11.jpeg"`, `tag: "Enseignements, Photos & Actualités"` ← **duplicate label never used by `lib/nav.ts`**
    Note: `pillarVisuals`'s `tag` field is **never rendered** — the record stores `tag` but the JSX only reads `.image`. Dead data.
  - **French literals (rendered)**: `Menu` (desktop, line 159); `Menu` (mobile, line 371); `Découvrir la vie de cette section à Lubumbashi` (line 317); `Centre Chrétien Jésus ma Vie — Quartier Hewa Bora` (line 320); `Centre Chrétien Jésus ma Vie` (welcome-panel `<h3>`, line 334); `Une communauté vivante réunie à Lubumbashi pour adorer Dieu, transmettre la foi et servir dans l&apos;amour fraternel.` (line 337); `←` + `Retour au menu` (mobile back button, lines 443-445); `✕` + `Fermer` (close button, lines 556, 559); `WhatsApp` (line 540); `→` in 4 places (lines 220, 287, 397, 499)
  - **Accessibility literals**: `aria-label="Navigation principale"` (overlay), `aria-label="Piliers du menu principal"` (desktop nav), `aria-label="Menu mobile principal"` (mobile nav), `aria-label={\`Sous-menu ${displayedMobilePillar.label}\`}`, `aria-label="Fermer le menu"` (close button)
  - **Literal image paths**: `/media/ccjv-30.jpeg`, `/media/ccjv-35.jpeg` (×2), `/media/ccjv-27.jpeg`, `/media/ccjv-11.jpeg` (×2) — all as `||` fallbacks after `@/data/mock/images` reads
  - **Hrefs**: the only literal is `href={item.href ?? "/"}` (lines 225, 402) — a **hardcoded `"/"` fallback** that silently sends a `NavItem` without `href` to the home page, which is exactly what `lib/nav.ts` says must never happen ("un `NavItem` sans `href` … jamais un lien")
  - **Undefined design style dependency**: the animation classes `menu-submenu-in` (lines 253, 330) come from `globals.css`
- **Internal structure**:
  1. module scope: `FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'`
  2. module scope: `pillarVisuals`
  3. state + handlers `handleOpenMobileSubmenu` / `handleCloseMobileSubmenu`
  4. `useEffect([open])` — when `!open`: reset all three pillar states and return early; when `open`: save `document.body.style.overflow`, set `"hidden"`, restore on cleanup
  5. `useEffect([open, onClose, activeMobilePillar])` — `closeRef.current?.focus()`; a `keydown` listener implementing Escape (closes the mobile submenu first, else `onClose()`) and a Tab/Shift+Tab focus trap over `overlay.querySelectorAll(FOCUSABLE)` filtered by `aria-disabled !== "true"`
  6. root `<div ref={overlayRef} id="site-menu" role="dialog" aria-modal="true" aria-label="Navigation principale" inert={!open} className={cn("fixed inset-0 z-[100] overflow-y-auto bg-ccjv-black text-white transition-opacity duration-[500ms] ease-ccjv", open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0")}>`
  7. shell `<div className="flex min-h-full flex-col justify-between px-[clamp(24px,5vw,72px)] pt-20 pb-12">`
  8. **desktop view** `<div className="mx-auto hidden w-full max-w-[1320px] flex-1 items-center md:flex my-auto">` → `<div className="grid w-full grid-cols-12 items-start gap-12 lg:gap-16">`:
     - `<nav className="col-span-5 lg:col-span-5 border-r border-white/12 pr-8 lg:pr-12" aria-label="Piliers du menu principal">` → `<p>Menu</p>` → `<ul className="flex flex-col divide-y divide-white/10">` → `primaryNav.map((item, index) => { const hasChildren = Boolean(item.children && item.children.length > 0); const isSelected = activeDesktopPillar?.label === item.label; return (<li key={item.href ?? item.label} className={…stagger…} style={open ? { transitionDelay: \`${30 + index * 40}ms\` } : undefined}> {hasChildren ? <button …> : <Link href={item.href ?? "/"} …>} </li>) })` — each pillar row is a numbered `01`… serif label + a `→` that fades in on hover/selection
     - `<div className="col-span-7 lg:col-span-7 pl-2 lg:pl-6">` → `activeDesktopPillar && activeDesktopPillar.children && activeDesktopPillar.children.length > 0 ? (<div key={activeDesktopPillar.label} className="menu-submenu-in flex flex-col justify-between">` header `<div className="border-b border-white/15 pb-6">` (label + optional description) + `<div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">` of `activeDesktopPillar.children.map((child, cIdx) => <Link key={child.href} … style={{ animationDelay: \`${cIdx * 50}ms\` }}>` with a `01`/`02` counter, a `→`, `<h4>{child.label}</h4>`, optional `<p className="mt-2 font-sans text-xs leading-relaxed text-white/50">{child.description}</p>` + `{pillarVisuals[activeDesktopPillar.label] && (<div className="mt-8 flex items-center gap-5 border-t border-white/10 pt-6">` thumbnail `<div className="relative h-16 w-24 shrink-0 overflow-hidden bg-white/10 border border-white/15"><Image src={pillarVisuals[activeDesktopPillar.label].image} alt={activeDesktopPillar.label} fill sizes="120px" className="object-cover" /></div>` + the two hardcoded French captions `</div>)}`) **: (** welcome panel `<div key="welcome-panel" className="menu-submenu-in flex flex-col justify-center border border-white/12 bg-white/[0.02] p-8 lg:p-12">` → `<CrossMark size="md" className="text-ccjv-cream mb-6" />` → `<h3>Centre Chrétien Jésus ma Vie</h3>` → `<p>Une communauté vivante…</p>` → `<div className="mt-8 border-t border-white/12 pt-6"><p className="font-sans text-xs text-ccjv-cream">{site.location}</p></div>` **)**
  9. **mobile view** `<div className="mx-auto w-full max-w-[480px] overflow-hidden md:hidden my-auto py-6">` → sliding track `<div className={cn("flex w-[200%] transition-transform duration-[380ms] ease-ccjv", activeMobilePillar ? "-translate-x-1/2" : "translate-x-0")}>`:
     - panel 1 (list) `<div className={cn("w-1/2 pr-4 transition-opacity duration-300", …)} aria-hidden={Boolean(activeMobilePillar)}>` → `<nav aria-label="Menu mobile principal">` → `<p>Menu</p>` → `<ul className="flex flex-col divide-y divide-white/12 border-y border-white/12">` → `primaryNav.map((item, index) => <li key={item.href ?? item.label} className="py-4">{item.children && item.children.length > 0 ? <button … onClick={() => handleOpenMobileSubmenu(item)}> : <Link href={item.href ?? "/"} …>}</li>)`
     - panel 2 (submenu) `<div className={cn("w-1/2 pl-4 transition-opacity duration-300", …)} aria-hidden={!activeMobilePillar}>` → `{displayedMobilePillar && (<nav aria-label={…}><button … onClick={handleCloseMobileSubmenu}>← Retour au menu</button>` + title block (padded index via `primaryNav.findIndex((p) => p.label === displayedMobilePillar.label) + 1` + optional description) + `{displayedMobilePillar.children && displayedMobilePillar.children.length > 0 && (<ul className="mt-5 flex flex-col divide-y divide-white/10">…children.map…</ul>)}` + `</nav>)}`
  10. **bottom bar** `<div className="mx-auto mt-8 flex w-full max-w-[1320px] flex-wrap items-center justify-between gap-6 border-t border-white/12 pt-6">` → `<div className="flex flex-wrap items-center gap-6">` `{socials.map((social) => (<a key={social.label} href={social.href} …>{social.label}</a>))}` + a hardcoded `WhatsApp` `<a href={site.whatsappHref}>` → `<p className="font-sans text-xs text-white/50">{site.location}</p>`
  11. **close button** `<button ref={closeRef} type="button" className="absolute top-5 right-[clamp(16px,4vw,48px)] inline-flex min-h-[44px] items-center gap-2 px-3 text-white transition-colors hover:text-ccjv-cream" onClick={onClose} aria-label="Fermer le menu">✕ Fermer</button>`
- **Conditional rendering** (an unusually long list — this file has the densest conditional logic in scope):
  - `open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"` (overlay visibility)
  - `inert={!open}` (boolean attribute)
  - `open ? "translate-x-0 opacity-100" : "-translate-x-4 opacity-0"` (per-pillar stagger)
  - `style={open ? { transitionDelay: \`${30 + index * 40}ms\` } : undefined}`
  - `const hasChildren = Boolean(item.children && item.children.length > 0);` → `hasChildren ? (<button …>) : (<Link …>)` — **ternary, desktop and mobile**
  - `const isSelected = activeDesktopPillar?.label === item.label;` (optional chaining) → drives 4 class ternaries (`isSelected ? "bg-white/5 text-ccjv-cream" : "text-white/70 hover:text-white hover:bg-white/[0.02]"`, `isSelected ? "text-ccjv-cream" : "text-white/40 group-hover:text-ccjv-cream"`, `isSelected ? "text-ccjv-cream font-medium" : "text-white/85 group-hover:text-white"`, `isSelected ? "translate-x-0 text-ccjv-cream opacity-100" : "-translate-x-1 text-white/30 opacity-0 group-hover:opacity-100 group-hover:translate-x-0"`)
  - `activeDesktopPillar && activeDesktopPillar.children && activeDesktopPillar.children.length > 0 ? (<div …submenu…>) : (<div …welcome panel…>)` — **the big ternary**; note the redundant double guard `activeDesktopPillar && activeDesktopPillar.children && activeDesktopPillar.children.length > 0`
  - `{activeDesktopPillar.description && (<p className="mt-2 font-sans text-sm text-white/60 max-w-[48ch]">{activeDesktopPillar.description}</p>)}`
  - `{child.description && (<p className="mt-2 font-sans text-xs leading-relaxed text-white/50">{child.description}</p>)}`
  - `{pillarVisuals[activeDesktopPillar.label] && (<div className="mt-8 …">)}` — record lookup guard
  - `activeMobilePillar ? "-translate-x-1/2" : "translate-x-0"` (slide)
  - `activeMobilePillar ? "pointer-events-none opacity-0" : "opacity-100"` and `aria-hidden={Boolean(activeMobilePillar)}` (panel 1)
  - `activeMobilePillar ? "opacity-100" : "pointer-events-none opacity-0"` and `aria-hidden={!activeMobilePillar}` (panel 2)
  - `{displayedMobilePillar && (<nav …>)}`
  - `{displayedMobilePillar.description && (<p …>)}`
  - `{displayedMobilePillar.children && displayedMobilePillar.children.length > 0 && (<ul …>)}`
  - `{child.description && (<p className="mt-1 pl-6 font-sans text-xs text-white/50">{child.description}</p>)}`
  - `.map()` calls: `primaryNav.map` (desktop), `primaryNav.map` (mobile), `activeDesktopPillar.children.map`, `displayedMobilePillar.children.map`, `socials.map`
  - `findIndex` on `primaryNav` for the mobile pillar number
  - `if (!open) { …; return; }` and `if (!open) return;` in the two effects; `if (nodes.length === 0) return;`-style guard `if (focusables.length === 0) return;`
- **Variants**: **aucune variante** — no props besides `open`/`onClose`, no `variant`/`size`/`tone`/`align`, no style record, no switch. The two "modes" are **breakpoint-driven CSS** (`md:flex` vs `md:hidden`) rendering **two complete, parallel copies of the nav tree** from the same `primaryNav` data — the desktop pillar list and the mobile pillar list are separate JSX trees, not variants.
- **Fallbacks**: `open` and `onClose` are required. `item.children` absent/empty → the pillar renders as a `<Link href={item.href ?? "/"}>` (**the `"/"` fallback is the only guard; a pillar with no `href` AND no children silently links to the home page**). `activeDesktopPillar.description` / `child.description` / `displayedMobilePillar.description` undefined → their `<p>`s are omitted. `pillarVisuals[label]` undefined (e.g. the nav label `"Vie de l'Église"` **does** match, but a renamed pillar would not) → the whole visual preview block is omitted. `socials` empty → no social links in the bottom bar. `activeDesktopPillar === null` (the initial state) → the welcome panel renders, so the right column is never empty.
- **Consumers**:
  - `src/components/layout/Header.tsx:9`
- **Reuse breadth**: **1 consumer**

## COMPONENT: Header
- **file**: `src/components/layout/Header.tsx` (4573 bytes, 140 lines)
- **kind**: **client** (`"use client"` at line 1)
- **Responsibility**: Contextual header — transparent at the top of the page (light or dark depending on the hero), solid `bg-ccjv-offwhite/95` + hairline once scrolled past 24 px. Owns the logo link and the menu trigger that opens `FullscreenMenu`.
- **Exact props type (verbatim)**: **none.** Signature: `export function Header() {` — **zero props**.
- **Destructured & rendered**: nothing (no props). Internal: `usePathname()` → `pathname`; `useState` × 3 (`scrolled`, `isDarkHero`, `menuOpen`); `useRef<HTMLButtonElement>` `menuButtonRef`; module-scope `darkHeroRoutes` array.
- **Hardcoded internal content**:
  - **`darkHeroRoutes` module-scope array of 9 literal route strings** (lines 12-22): `"/"`, `"/qui-sommes-nous"`, `"/communaute/groupes-de-maison"`, `"/communaute/parcours-nouveau"`, `"/communaute/priere-et-intercession"`, `"/communaute/temoignages"`, `"/vie-de-leglise/evenements"`, `"/publications/mediatheque"`, `"/organisation"` — **a hardcoded duplicate of the route list that `lib/nav.ts` already models**
  - **Literal DOM-class substrings used for hero detection** (line 64-66): `cls.includes("bg-ccjv-black")`, `cls.includes("bg-black")`, `cls.includes("text-white")` — the header infers the hero's theme by **string-matching class names read off the DOM**
  - **Literal CSS selector string** (line 58): `"main > section:first-of-type, section:first-of-type, [data-hero-dark]"`
  - **French literal**: `Menu` (line 124, hidden below `md` because of `max-md:hidden`)
  - **Literal image path**: `src="/logo_2.png"` (line 102)
  - **Literal href**: `href="/"` (line 96, the logo link)
  - **Literal aria-label template**: `` `${site.name} — retour à l'accueil` ``
- **Internal structure**:
  1. module scope: `darkHeroRoutes`
  2. `const pathname = usePathname();`
  3. `useEffect([])` — `onScroll = () => setScrolled(window.scrollY > 24); onScroll(); window.addEventListener("scroll", onScroll, { passive: true }); return () => window.removeEventListener("scroll", onScroll);`
  4. `useEffect([pathname])` — computes `isKnownDarkRoute` via `darkHeroRoutes.some((route) => pathname === route || (route !== "/" && pathname.startsWith(\`${route}/\`)))`; if true `setIsDarkHero(true)` and return; otherwise `document.querySelector("main > section:first-of-type, section:first-of-type, [data-hero-dark]")` → class-name string test → `setIsDarkHero(hasDarkClasses)`; if no `topSection` → `setIsDarkHero(false)`
  5. `openMenu` / `closeMenu` (closeMenu also restores focus to `menuButtonRef`)
  6. `const isSolid = scrolled; const isWhiteText = !isSolid && isDarkHero;`
  7. `<header className={cn("fixed inset-x-0 top-0 z-60 transition-[background-color,color,border-color,box-shadow] duration-300 ease-out", isSolid ? "border-b border-ccjv-line bg-ccjv-offwhite/95 backdrop-blur-md text-ccjv-ink shadow-xs" : isWhiteText ? "bg-transparent text-white border-b border-transparent" : "bg-transparent text-ccjv-ink border-b border-transparent")}>`
  8. `<div className="container flex px-4 sm:px-12 lg:px-18 py-2 items-center justify-between">` → logo `<Link href="/" className="flex min-h-11 items-center" aria-label={…}><div className="relative h-14 w-14 sm:h-16 sm:w-16"><Image src="/logo_2.png" alt={site.name} fill priority className={cn("object-contain transition-[filter] duration-300 ease-out", isSolid || !isDarkHero ? "invert" : "invert-0")} sizes="40px" /></div></Link>` → menu button `<button ref={menuButtonRef} type="button" className="inline-flex min-h-11 items-center gap-3 rounded-none px-3 transition-opacity hover:opacity-80" aria-expanded={menuOpen} aria-controls="site-menu" onClick={openMenu}>` with `<span className="font-sans text-[0.9rem] font-medium max-md:hidden">Menu</span>` and a 2-bar burger `<span className="inline-flex w-6 flex-col gap-1.5" aria-hidden="true"><span className="block h-0.5 w-full bg-current" /><span className="block h-0.5 w-full bg-current" /></span>`
  9. `<FullscreenMenu open={menuOpen} onClose={closeMenu} />` — rendered as a **sibling of `<header>` inside a fragment**, outside the fixed header element
- **Conditional rendering**:
  - `isSolid ? "border-b border-ccjv-line bg-ccjv-offwhite/95 backdrop-blur-md text-ccjv-ink shadow-xs" : isWhiteText ? "bg-transparent text-white border-b border-transparent" : "bg-transparent text-ccjv-ink border-b border-transparent"` — **nested ternary, 3 visual states**
  - `isSolid || !isDarkHero ? "invert" : "invert-0"` — logo filter ternary
  - `pathname === route || (route !== "/" && pathname.startsWith(\`${route}/\`))` — route match, with a special case excluding `"/"` from prefix matching
  - `if (isKnownDarkRoute) { setIsDarkHero(true); return; }`
  - `if (topSection) { … } else { setIsDarkHero(false); }`
  - `{menuOpen}` → `aria-expanded` and the `FullscreenMenu open` prop
  - No `.map`, no `.slice` on render (the `.some` call is data logic), no `length` check in JSX
- **Variants**: **aucune variante** — no props, no `variant`/`size`/`tone`/`align`, no record, no switch. The three header states are derived from scroll position and route, not from a variant prop.
- **Fallbacks**: no props → no prop fallbacks. If the DOM query finds no top section, `isDarkHero` becomes `false` (→ dark text on a transparent bar). `pathname` is always provided by `usePathname()`.
- **Consumers**:
  - `src/app/layout.tsx:3`
- **Reuse breadth**: **1 consumer** (root layout → every route)

## COMPONENT: IntroCurtain
- **file**: `src/components/layout/IntroCurtain.tsx` (1438 bytes, 33 lines)
- **kind**: server (no directive, no hooks — SSR-safe by design, with no blocking)
- **Responsibility**: First-visit intro curtain: a cross, one verse and the acronym, faded out by a pure-CSS animation; a `.intro-seen` class added by an inline script in `layout.tsx` hides it on later visits.
- **Exact props type (verbatim)**: **none.** Signature: `export function IntroCurtain() {` — **zero props**.
- **Destructured & rendered**: nothing (no props). Data read: `verses.rassemblement` and `site.acronym`.
- **Hardcoded internal content**:
  - **French quote marks hardcoded around the verse**: `«&nbsp;{verses.rassemblement.text}&nbsp;»` (line 22)
  - `aria-hidden="true"` on the root (the whole curtain is decorative for assistive tech)
  - Class `intro-curtain` (from `globals.css`)
  - No French prose literal, no image path, no href.
- **Internal structure**:
  1. `<div className="intro-curtain" aria-hidden="true">`
  2. `<div className="mx-auto flex max-w-[44rem] flex-col items-center px-6 text-center">`
  3. `<CrossMark size="lg" className="text-ccjv-cream" />`
  4. `<p className="mt-9 font-serif text-[clamp(1.35rem,0.8rem+2vw,2.25rem)] leading-[1.35] font-normal text-white">«&nbsp;{verses.rassemblement.text}&nbsp;»</p>`
  5. `<p className="mt-7 font-sans text-xs font-semibold tracking-[0.2em] text-ccjv-cream uppercase">{verses.rassemblement.reference}</p>`
  6. `<p className="mt-14 font-serif text-sm font-semibold tracking-[0.34em] text-white/45 uppercase">{site.acronym}</p>`
- **Conditional rendering**: **none** — no `&&`, no ternary, no `.map`, no `.slice`, no `length` check. The once-per-session behaviour lives entirely in CSS (`.intro-seen .intro-curtain { display: none; }`) plus the inline script in `app/layout.tsx`.
- **Variants**: **aucune variante** — zero props, no variant axis of any kind.
- **Fallbacks**: no props → no prop fallbacks. If `verses.rassemblement` were missing, the component would render `«  »` — there is no guard.
- **Consumers**:
  - `src/app/layout.tsx:5`
- **Reuse breadth**: **1 consumer** (root layout)

---

# 6. `src/components/shared/`

## COMPONENT: Breadcrumbs
- **file**: `src/components/shared/Breadcrumbs.tsx` (2654 bytes, 90 lines)
- **kind**: **client** (`"use client"` at line 1, because of `usePathname`)
- **Responsibility**: Breadcrumb derived from `lib/nav.ts` (`getBreadcrumbs(pathname)`) so it can never drift from the real routes; renders nothing on routes that belong to no section.
- **Exact props type (verbatim)** — an **inline object type** in the parameter list, there is **no named `BreadcrumbsProps` interface**:
```ts
export function Breadcrumbs({
  tone = "light",
  className,
}: {
  tone?: "light" | "dark";
  className?: string;
}) {
```
- **Destructured & rendered**: `tone = "light"`, `className` — both used.
- **Hardcoded internal content**:
  - **French literal**: `Accueil` (line 42, the always-first crumb)
  - `aria-label="Fil d'Ariane"` (line 27) and the `aria-current={isLast ? "page" : undefined}` attribute
  - **Literal href**: `href="/"` (line 36, the Accueil crumb)
  - **Separator literal**: `<span aria-hidden="true" className="opacity-40">/</span>` (line 56)
  - No image path.
- **Internal structure**:
  1. `const pathname = usePathname(); const crumbs = getBreadcrumbs(pathname);`
  2. `if (crumbs.length === 0) return null;`
  3. `const isDark = tone === "dark";`
  4. `<nav aria-label="Fil d'Ariane" className={cn("mb-6", className)}>`
  5. `<ol className={cn("flex flex-wrap items-center gap-2 font-sans text-xs", isDark ? "text-white/60" : "text-ccjv-ink-secondary")}>`
  6. hardcoded first `<li>` → `<Link href="/" …>Accueil</Link>`
  7. `{crumbs.map((crumb, index) => { const isLast = index === crumbs.length - 1; const isLink = Boolean(crumb.href) && !isLast; return (<li key={crumb.href ?? crumb.label} className="flex items-center gap-2"><span aria-hidden="true" className="opacity-40">/</span>{isLink ? (<Link href={crumb.href as string} …>{crumb.label}</Link>) : (<span aria-current={isLast ? "page" : undefined} …>{crumb.label}</span>)}</li>); })}`
- **Conditional rendering**:
  - `if (crumbs.length === 0) return null;` — length check → the header/hero shows **no breadcrumb at all** on routes with no section
  - `isDark ? "text-white/60" : "text-ccjv-ink-secondary"` (list colour)
  - `const isLast = index === crumbs.length - 1;`
  - `const isLink = Boolean(crumb.href) && !isLast;` — **the last crumb is never a link, and a crumb without `href` is never a link**
  - `isLink ? (<Link …>) : (<span …>)` — ternary
  - `isLast ? isDark ? "text-white/85" : "text-ccjv-ink" : isDark ? "text-white/70" : "text-ccjv-ink-secondary"` — **nested ternary, 4 outcomes**
  - `aria-current={isLast ? "page" : undefined}`
  - `key={crumb.href ?? crumb.label}`
  - `isDark ? "hover:text-ccjv-cream" : "hover:text-ccjv-green"` (twice: Accueil + mapped links)
- **Variants**: `tone?: "light" | "dark"` — 2 keys, **styling only** (the `<nav><ol><li>` tree is identical):
  - `"light"` (**default**) → `text-ccjv-ink-secondary`, hover `text-ccjv-green`, last crumb `text-ccjv-ink`
  - `"dark"` → `text-white/60`, hover `text-ccjv-cream`, last crumb `text-white/85`, other crumbs `text-white/70`
  - No `size`/`align`.
- **Fallbacks**: `crumbs.length === 0` (route `/` and any unmatched route) → **`null`**, so no breadcrumb. `tone = "light"`, `className` undefined → dropped. A `Crumb` without `href` renders as a plain `<span>` (never a link) — that is the documented grouping-step behaviour and it is implemented by the `isLink` guard, not by a fallback.
- **Consumers**:
  - `src/components/composition/HeroCompact.tsx:3`
  - `src/components/composition/HeroImmersive.tsx:4`
  - `src/components/composition/HeroManifesto.tsx:3`
  - `src/components/composition/HeroPhoto.tsx:4`
  - `src/components/composition/HeroPractical.tsx:3`
  - `src/components/shared/PageHeader.tsx:4`
- **Reuse breadth**: **6+ consumers (6)**

### Consumer prop-shape divergence — `Breadcrumbs`
Four distinct call shapes:
- `<Breadcrumbs className="mb-4" />` — `HeroCompact.tsx:37`: **only a `className`, no `tone`** → light styling; used on an `offwhite`/`green-soft` header, which is correct.
- `<Breadcrumbs tone="dark" />` — `HeroImmersive.tsx:61` and `HeroPhoto.tsx:61`: **tone hardcoded dark** because both render over a photograph.
- `<Breadcrumbs tone={isDark ? "dark" : "light"} />` — `HeroManifesto.tsx:47` and `PageHeader.tsx:50`: tone **follows the component's own `tone` prop**, so the same component is dark or light depending on the page.
- `<Breadcrumbs />` — `HeroPractical.tsx:40`: **no props at all** → light default, no extra class (note it therefore has no bottom margin, unlike `HeroCompact`'s `mb-4`).

## COMPONENT: BreathingPhoto
- **file**: `src/components/shared/BreathingPhoto.tsx` (2320 bytes, 77 lines)
- **kind**: server (no directive, no hooks)
- **Responsibility**: A full-bleed photograph used as testimony and visual breathing space, with a short meditative phrase, an optional reference and an optional arch frame.
- **Exact props type (verbatim)**:
```ts
export interface BreathingPhotoProps {
  image: string;
  phrase: string;
  reference?: string;
  hasArch?: boolean;
  className?: string;
}
```
- **Destructured & rendered**: `image, phrase, reference, hasArch = false, className` — all rendered.
- **Hardcoded internal content**:
  - **French literal**: `Témoignage` (line 60, rendered unconditionally as the section's kicker)
  - `aria-label="Témoignage photographique de la communauté"` (line 31) — **a second, longer hardcoded French string**
  - No image path (comes from the `image` prop), no href.
  - `<Image src={image} alt="" fill sizes="100vw" className="object-cover object-center brightness-95" />` — `alt=""` hardcoded.
- **Internal structure**:
  1. `<section className={cn("relative min-h-[75svh] w-full overflow-hidden bg-ccjv-black", className)} aria-label="Témoignage photographique de la communauté">`
  2. `<Image … />`
  3. `<div className="absolute inset-0 bg-gradient-to-t from-ccjv-black/90 via-ccjv-black/45 to-ccjv-black/25" aria-hidden="true" />`
  4. `{hasArch && (<span className="pointer-events-none absolute inset-x-8 top-10 bottom-10 rounded-t-full border border-ccjv-cream/25 max-md:inset-4" aria-hidden="true" />)}` ← a `rounded-t-full` arch, the same device as `PageHeader`'s "baie" and `FeatureImage variant="arch"`
  5. `<div className="relative flex min-h-[75svh] items-end">` → `<div className="container pb-20 max-md:pb-14">` → kicker row `<div className="flex items-center gap-3"><CrossMark size="sm" className="text-ccjv-cream" /><span className="font-sans text-xs font-semibold tracking-[0.2em] text-ccjv-cream uppercase">Témoignage</span></div>` → `<p className="mt-4 max-w-[22ch] font-serif text-[clamp(1.85rem,1.1rem+3.2vw,3.6rem)] leading-[1.14] font-medium text-white">{phrase}</p>` → `{reference && (<p className="mt-6 font-sans text-xs font-semibold tracking-[0.18em] text-white/70 uppercase">{reference}</p>)}`
- **Conditional rendering**:
  - `{hasArch && (<span … rounded-t-full … />)}` — gates the arch overlay
  - `{reference && (<p …>{reference}</p>)}`
  - No `.map`, no `.slice`, no `length` check, no ternary
- **Variants**: `hasArch?: boolean` — **a boolean, not a named variant**. It only adds/removes the `rounded-t-full` arch `<span>`; there is no `variant`/`size`/`tone`/`align` prop and no style record. **aucune variante** in the requested sense (no variant key list to enumerate).
- **Fallbacks**: `hasArch = false`. `reference` undefined → the reference `<p>` is absent. `className` undefined → dropped. `image` and `phrase` required. Note `min-h-[75svh]` is duplicated on both the `<section>` and the inner flex wrapper.
- **Consumers**:
  - `src/app/page.tsx:11` — `<BreathingPhoto image={images.louange} phrase="La parole nous rassemble" reference={\`${site.acronym} — Lubumbashi\`} />` (**no `hasArch`**)
- **Reuse breadth**: **1 consumer** — `hasArch` is never enabled, so the `rounded-t-full` arch overlay is dead.

## COMPONENT: CommunityFaces
- **file**: `src/components/shared/CommunityFaces.tsx` (4498 bytes, 132 lines)
- **kind**: **client** (`"use client"` at line 1)
- **Responsibility**: Community scrollytelling. Desktop: right column of scrolling portraits + a sticky left caption that swaps on the active image with a fade/slide (`.face-caption`). Mobile: an independent vertical list where each face carries its own caption. Active image detected by `IntersectionObserver`, not by a scroll listener.
- **Exact props type (verbatim)** — an **inline object type**; there is **no named `CommunityFacesProps` interface**:
```ts
export function CommunityFaces({ faces }: { faces: CommunityFace[] }) {
```
  The item type is imported: `import type { CommunityFace } from "@/data/mock/community";` (not declared here).
- **Destructured & rendered**: `faces` — rendered three times (sticky caption, portrait column, mobile list).
- **Hardcoded internal content**:
  - **No French literal, no image path, no href.** All copy comes from `face.name` / `face.caption`; all images from `face.photo`.
  - Aria: none on the section (there is no landmark label and no heading inside the component — the caller supplies them via `Section` + `SectionHeading`).
  - The observer's root margin is a hardcoded literal: `{ rootMargin: "-45% 0px -45% 0px", threshold: 0 }`.
  - Class `face-caption` comes from `globals.css`.
- **Internal structure**:
  1. `const [active, setActive] = useState(0);` + `const itemRefs = useRef<Array<HTMLDivElement | null>>([]);`
  2. `useEffect([])` — filters non-null refs, `if (nodes.length === 0) return;`, creates an `IntersectionObserver` with the narrow centre band, sets `active` from `Number(entry.target.getAttribute("data-index"))` guarded by `!Number.isNaN(index)`, observes every node, disconnects on cleanup
  3. `const current = faces[active];`
  4. `<div className="hidden md:grid md:grid-cols-2 md:gap-12 lg:gap-16">` → left `<div>` → `<div className="sticky top-[calc(68px+7vh)] flex min-h-[72vh] flex-col justify-center">` → `<CrossMark size="md" className="text-ccjv-green" />` → `{current && (<div key={current.id} className="face-caption mt-8"><p className="font-serif text-[clamp(2rem,1rem+2.6vw,3.25rem)] leading-[1.1]">{current.name}</p><p className="lead mt-5 max-w-[34ch]">{current.caption}</p></div>)}` → progress `<ol className="mt-12 flex items-center gap-2">` → `{faces.map((face, index) => (<li key={face.id}><span className={cn("block h-[3px] transition-all duration-[400ms] ease-ccjv", index === active ? "w-10 bg-ccjv-green" : "w-4 bg-ccjv-line")} /></li>))}`
  5. right `<div className="flex flex-col gap-10">` → `{faces.map((face, index) => (<div key={face.id} ref={(node) => { itemRefs.current[index] = node; }} data-index={index} className="relative h-[72vh] w-full overflow-hidden bg-ccjv-line"><Image src={face.photo} alt="" fill sizes="(max-width: 1024px) 100vw, 45vw" className="object-cover" /></div>))}`
  6. `<ul className="flex flex-col gap-12 md:hidden">` → `{faces.map((face) => (<li key={face.id}><div className="relative aspect-[4/5] w-full overflow-hidden bg-ccjv-line"><Image src={face.photo} alt="" fill sizes="100vw" className="object-cover" /></div><p className="mt-5 font-serif text-[1.6rem] leading-tight">{face.name}</p><p className="mt-2 text-ccjv-ink-secondary">{face.caption}</p></li>))}`
- **Conditional rendering**:
  - `if (nodes.length === 0) return;` (effect guard)
  - `if (!entry.isIntersecting) continue;` (observer loop)
  - `if (!Number.isNaN(index)) setActive(index);`
  - `{current && (<div key={current.id} className="face-caption mt-8">…)}` — guards the sticky caption
  - `faces.map(...)` **three times** (progress bar, portrait column, mobile list)
  - `index === active ? "w-10 bg-ccjv-green" : "w-4 bg-ccjv-line"` — progress-dot ternary
  - `key={current.id}` deliberately **remounts the caption block** so the CSS animation replays
- **Variants**: **aucune variante** — no props other than `faces`; no `variant`/`size`/`tone`/`align`; no style record; no switch. The desktop/mobile difference is **breakpoint-driven CSS (`md:grid` vs `md:hidden`) rendering two complete parallel trees**, not a variant.
- **Fallbacks**: `faces.length === 0` → the observer effect returns early, `current === undefined` so the sticky caption is omitted, the progress `<ol>` and both lists render as **empty containers** (no placeholder, no `null` return). A face with an empty `photo` would render a broken `Image`. `face.caption` is assumed present (typed required in `CommunityFace`).
- **Consumers**:
  - `src/app/page.tsx:13` — `<CommunityFaces faces={communityFaces} />` where `communityFaces` comes from `await getCommunityFaces()`
  - (The `src/app/qui-sommes-nous/page.tsx:11` hit in a naive case-insensitive grep is `import { communityFaces } from "@/data/mock/community"` — a **data** import, not a consumer of this component.)
- **Reuse breadth**: **1 consumer**

## COMPONENT: CrossMark
- **file**: `src/components/shared/CrossMark.tsx` (2458 bytes, 93 lines)
- **kind**: server (pure-visual, no directive, no hooks)
- **Responsibility**: The CCJV Christian motif — a cross as the central faith symbol and visual anchor, in five sizes. Every size is a **distinct hand-authored SVG** (different viewBox and rect geometry), not a scaled copy.
- **Exact props type (verbatim)**:
```ts
export interface CrossMarkProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "watermark";
  variant?: "solid" | "fine" | "ornate";
}
```
- **Destructured & rendered**: `{ className, size = "md" }` — **`variant` is declared in the props interface but is NEVER destructured and NEVER read.** Passing `variant="ornate"` or `variant="fine"` has no effect whatsoever; all three values render the identical `solid` cross.
- **Hardcoded internal content**:
  - **No French literal, no image path, no href.** The component renders only SVG geometry:
    - `watermark`: `viewBox="0 0 100 160"`, `<rect x="46" y="0" width="8" height="160" rx="1" />` + `<rect x="15" y="44" width="70" height="8" rx="1" />`
    - `xl`: `viewBox="0 0 32 48"`, `<rect x="14" y="0" width="4" height="48" rx="1" />` + `<rect x="4" y="14" width="24" height="4" rx="1" />`
    - `lg`: `viewBox="0 0 32 48"`, `<rect x="14" y="0" width="4" height="48" rx="1" />` + `<rect x="4" y="14" width="24" height="4" rx="1" />` (**identical geometry to `xl`, different rendered size**)
    - `sm`: `viewBox="0 0 18 26"`, `<rect x="8" y="0" width="2" height="26" rx="0.5" />` + `<rect x="2" y="7" width="14" height="2" rx="0.5" />`
    - `md`: `viewBox="0 0 24 36"`, `<rect x="10.5" y="0" width="3" height="36" rx="0.75" />` + `<rect x="3" y="10.5" width="18" height="3" rx="0.75" />`
  - `aria-hidden="true"` on every branch — the mark is always decorative.
- **Internal structure** — five early returns, in this order:
  1. `if (size === "watermark")` → `<svg viewBox="0 0 100 160" fill="currentColor" className={cn("pointer-events-none absolute select-none opacity-5", className)}>`
  2. `if (size === "xl")` → `<svg viewBox="0 0 32 48" className={cn("h-24 w-auto shrink-0 text-current md:h-32", className)}>`
  3. `if (size === "lg")` → `<svg viewBox="0 0 32 48" className={cn("h-12 w-8 shrink-0 text-current", className)}>`
  4. `if (size === "sm")` → `<svg viewBox="0 0 18 26" className={cn("h-5 w-3.5 shrink-0 text-current", className)}>`
  5. default (`size === "md"`) → `<svg viewBox="0 0 24 36" className={cn("h-8 w-5 shrink-0 text-current", className)}>`
- **Conditional rendering**: five `if (size === …) { return … }` early returns; **no `&&`, no ternary, no `.map`, no `.length` check.**
- **Variants**: `size?: "sm" | "md" | "lg" | "xl" | "watermark"` — **5 keys, structural** (a different `<svg>` element per key, not a class swap):
  - `"md"` (**default**) → `viewBox "0 0 24 36"`, 2 rects, `h-8 w-5`
  - `"sm"` → `viewBox "0 0 18 26"`, 2 rects, `h-5 w-3.5`
  - `"lg"` → `viewBox "0 0 32 48"`, 2 rects, `h-12 w-8`
  - `"xl"` → same `viewBox "0 0 32 48"` and same rects as `lg`, but `h-24 w-auto md:h-32` (**the `lg`/`xl` duplication is a real duplication: identical geometry, two size classes**)
  - `"watermark"` → `viewBox "0 0 100 160"`, **a wholly distinct geometry** (thin `8`-unit beams on a 100-wide canvas, crossbar at 33 % of height, `rx="1"`), plus `pointer-events-none absolute select-none opacity-5` — the only absolutely positioned key, and therefore the only one that requires a positioned ancestor. All four non-watermark keys are separately authored too (`sm`/`md` have their own viewBoxes), so the sole genuine geometric duplication in the file is `lg` ≡ `xl`.
  - `variant?: "solid" | "fine" | "ornate"` is declared but **unimplemented** (see above).
- **Fallbacks**: `size = "md"` (the trailing default return). `className` undefined → dropped. `variant` has **no fallback because it is never read**. There are no array props.
- **Consumers** (17 import sites — the most-imported component in the codebase):
  - `src/app/page.tsx:8` (`size="sm" className="mb-4 text-ccjv-green"` :88; `size="lg" className="text-ccjv-green"` :228; `size="lg" className="text-ccjv-cream"` :287)
  - `src/app/organisation/page.tsx:10` (`size="sm" className="mb-4 text-ccjv-green"` :360; `size="lg"` :194, :448)
  - `src/app/qui-sommes-nous/page.tsx:4` (`size="md" className="mx-auto text-ccjv-green"` :260; `size="sm" className="text-ccjv-green"` :292; `size="xl" className="mx-auto text-ccjv-green"` :573; multi-line usage :589)
  - `src/app/communaute/groupes-de-maison/page.tsx:4` (`size="xl"` :95; `size="watermark"` :197; `size="sm"` :203, :371)
  - `src/app/communaute/parcours-nouveau/page.tsx:4` (`size="watermark"` :298; `size="lg"` :304; `size="sm"` :393)
  - `src/app/communaute/priere-et-intercession/page.tsx:4` (`size="xl"` :88; `size="watermark"` :191; `size="sm"` :197, :366)
  - `src/app/vie-de-leglise/evenements/page.tsx:3` (`size="md" className="mx-auto text-ccjv-cream mb-6"` :574)
  - `src/app/vie-de-leglise/faire-un-don/page.tsx:3` (`size="sm"` :194; `size="md"` :364)
  - `src/app/vie-de-leglise/ou-nous-trouver/page.tsx:3` (`size="md" className="mx-auto text-ccjv-cream mb-6"` :329)
  - `src/components/composition/HeroManifesto.tsx:4` (`size="md" className={accent}`)
  - `src/components/forms/PrayerRequestForm.tsx:4` (`size="md"`)
  - `src/components/layout/FullscreenMenu.tsx:10` (`size="md" className="text-ccjv-cream mb-6"`)
  - `src/components/layout/IntroCurtain.tsx:1` (`size="lg" className="text-ccjv-cream"`)
  - `src/components/shared/BreathingPhoto.tsx:3` (`size="sm" className="text-ccjv-cream"`)
  - `src/components/shared/CommunityFaces.tsx:6` (`size="md" className="text-ccjv-green"`)
  - `src/components/shared/PageHeader.tsx:3` (`size="md" className={isDark ? "text-ccjv-cream" : "text-ccjv-green"}` :53; `size="xl" className="text-ccjv-cream"` :150)
  - `src/features/pages/Hero.tsx:3` (multi-line usage :51, `size="md" className="mr-3 inline-block align-middle text-ccjv-cream"`)
- **Reuse breadth**: **6+ consumers (17)**

### Consumer prop-shape divergence — `CrossMark`
All 5 `size` keys are exercised, and colour arrives **three different ways**:
- **`className` colour**: `className="text-ccjv-green"`, `className="text-ccjv-cream"`, `className="mx-auto text-ccjv-cream mb-6"`, `className="mb-4 text-ccjv-green"` — the dominant pattern, ~22 of 30 render sites.
- **computed `className` from a local boolean**: `PageHeader.tsx:53-56` `<CrossMark size="md" className={isDark ? "text-ccjv-cream" : "text-ccjv-green"} />` and `HeroManifesto.tsx:52` `<CrossMark size="md" className={accent} />` where `const accent = isDark ? "text-ccjv-cream" : "text-ccjv-green";`.
- **no `className` at all** (inherits `currentColor`): `communaute/groupes-de-maison/page.tsx:95, 197, 203, 371`, `communaute/parcours-nouveau/page.tsx:298, 304, 393`, `communaute/priere-et-intercession/page.tsx:88, 191, 197, 366`, `vie-de-leglise/faire-un-don/page.tsx:194, 364`, `organisation/page.tsx:194, 448`, `PrayerRequestForm.tsx:45`.
  **`size="watermark"` is used exclusively in 3 `communaute/*` pages and never anywhere else**; `size="xl"` appears in 5 places and always with a `className`.

## COMPONENT: LegalPage
- **file**: `src/components/shared/LegalPage.tsx` (2032 bytes, 75 lines)
- **kind**: server
- **Responsibility**: The shared template for transversal pages (mentions, privacy, terms, accessibility): a `PageHeader`, a long-form reading block with a "last updated" line and numbered sections, and a dark closing verse.
- **Exact props type (verbatim)** — `LegalSection` is a named export interface, but the component's own props are an **inline object type**:
```ts
export interface LegalSection {
  title: string;
  paragraphs: string[];
}

export function LegalPage({
  overline,
  title,
  description,
  sections,
  updatedAt,
}: {
  overline: string;
  title: string;
  description: string;
  sections: LegalSection[];
  updatedAt: string;
}) {
```
- **Destructured & rendered**: `overline, title, description, sections, updatedAt` — all rendered.
- **Hardcoded internal content**:
  - **French literal**: `Dernière mise à jour : {updatedAt}` (line 39) — the label around the date
  - **French literal (verse context)**: `context="Marcher dans la vérité"` (line 68)
  - **`context` is passed to `VerseSection` but `PageHeader` receives no verse** (the `verse` prop of `PageHeader` is not used here)
  - Data reads: `verses.parole.text`, `verses.parole.reference`
  - **`id`/`aria-labelledby` template**: `aria-labelledby={\`sec-${index}\`}` and `id={\`sec-${index}\`}` — section anchors are **positional**, so they change if sections are reordered
  - No image path, no href.
- **Internal structure**:
  1. `<PageHeader overline={overline} title={title} description={description} />` (**no `tone`, no `verse`, no `image`**)
  2. `<Section>` (no props → `tone="light"`, `contained=true`)
  3. `<div className="mx-auto max-w-[62rem]">`
  4. `<p className="font-sans text-xs font-semibold tracking-[0.14em] text-ccjv-ink-secondary uppercase">Dernière mise à jour : {updatedAt}</p>`
  5. `<div className="mt-12 flex flex-col gap-12">` → `{sections.map((section, index) => (<section key={section.title} aria-labelledby={\`sec-${index}\`}><h2 id={\`sec-${index}\`} className="font-serif text-[1.35rem] leading-snug">{section.title}</h2><div className="mt-4 flex flex-col gap-3">{section.paragraphs.map((paragraph) => (<p key={paragraph} className="max-w-[70ch] text-[1rem] leading-[1.75] text-ccjv-ink-secondary">{paragraph}</p>))}</div></section>))}`
  6. `<VerseSection context="Marcher dans la vérité" text={verses.parole.text} reference={verses.parole.reference} tone="dark" />` — **the only `tone="dark"` `VerseSection` call in the codebase**, and it passes **no `variant`** → `VerseSection` defaults to `variant="left"`, so every legal page renders a 4-photo parallax mosaic
- **Conditional rendering**:
  - `sections.map((section, index) => …)` — outer map, `key={section.title}`
  - `section.paragraphs.map((paragraph) => …)` — inner map, `key={paragraph}` (so **duplicate paragraph text would collide**)
  - No `&&`, no ternary, no `.length` check — an empty `sections` array renders an empty `<div className="mt-12 flex flex-col gap-12">`; an empty `paragraphs` array renders an empty `<div className="mt-4 flex flex-col gap-3">`
- **Variants**: **aucune variante** — no `variant`/`size`/`tone`/`align` prop, no style record, no switch. The 4 legal pages differ only in the data they pass.
- **Fallbacks**: all five props are required. No guard for `sections.length === 0` (empty container, not `null`). `VerseSection` is always rendered with `tone="dark"`.
- **Consumers**:
  - `src/app/accessibilite/page.tsx:1`
  - `src/app/conditions/page.tsx:1`
  - `src/app/confidentialite/page.tsx:1`
  - `src/app/mentions-legales/page.tsx:1`
- **Reuse breadth**: **2-5 consumers (4)**

### Consumer prop-shape divergence — `LegalPage`
The four call sites are the most uniform in the codebase — **all four pass only `overline`, `title`, `description`, `sections`, `updatedAt`**, in that order, with `sections` as a literal `LegalSection[]` of `{ title, paragraphs: [...] }`. No divergence in prop *shape*; only the number of sections differs (and, per the Footer analysis above, the routes the Footer links to for these pages do **not** match the `legalNav` hrefs in `lib/nav.ts`).

## COMPONENT: OpenBookMark
- **file**: `src/components/shared/OpenBookMark.tsx` (1324 bytes, 42 lines)
- **kind**: server (pure-visual, no directive, no hooks)
- **Responsibility**: The open-book (Bible) motif, echoing the CCJV logo: the revealed Word, teaching, and the source of faith.
- **Exact props type (verbatim)**:
```ts
export interface OpenBookMarkProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}
```
- **Destructured & rendered**: `className, size = "md"` — both used.
- **Hardcoded internal content**:
  - **No French literal, no image path, no href.** A single `<svg viewBox="0 0 40 28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">` with 6 hardcoded `<path>` elements:
    - `<path d="M20 23C15 20.5 8 20 2 22V6C8 4 15 4.5 20 7C25 4.5 32 4 38 6V22C32 20 25 20.5 20 23Z" />` (the two open pages)
    - `<path d="M20 7V23" />` (the centre binding)
    - `<path d="M7 10C11 9 15 9.5 17 11" strokeWidth="1.5" opacity="0.6" />`
    - `<path d="M7 14C11 13 15 13.5 17 15" strokeWidth="1.5" opacity="0.6" />`
    - `<path d="M23 11C25 9.5 29 9 33 10" strokeWidth="1.5" opacity="0.6" />`
    - `<path d="M23 15C25 13.5 29 13 33 14" strokeWidth="1.5" opacity="0.6" />`
  - `aria-hidden="true"` — always decorative.
- **Internal structure**:
  1. `const sizeClasses = { sm: "h-5 w-7", md: "h-7 w-10", lg: "h-10 w-14" };`
  2. One single `<svg>` with a fixed `viewBox="0 0 40 28"` and `className={cn("shrink-0 text-current", sizeClasses[size], className)}`
- **Conditional rendering**: **none** — no `&&`, no ternary in JSX, no early return, no `.map`, no `length` check. Size is resolved purely via a record lookup (unlike `CrossMark`, which uses five `if` returns).
- **Variants**: `size?: "sm" | "md" | "lg"` — 3 keys, **styling only**, resolved through an internal record (lines 14-18); the geometry, viewBox and paths are identical for all 3:
  - `"sm"` → `h-5 w-7`
  - `"md"` (**default**) → `h-7 w-10`
  - `"lg"` → `h-10 w-14`
  - No `variant`/`tone`/`align`.
- **Fallbacks**: `size = "md"`. `className` undefined → dropped. No array props. (Contrast with `CrossMark`: this component has no default-return branch because there is only one JSX tree.)
- **Consumers**:
  - `src/app/page.tsx:9` — `<OpenBookMark size="md" className="text-ccjv-green" />` (inside the "Écouter la Parole" section footer row)
- **Reuse breadth**: **1 consumer** — and `size="sm"` / `size="lg"` are never used.

## COMPONENT: PageHeader
- **file**: `src/components/shared/PageHeader.tsx` (5750 bytes, 175 lines)
- **kind**: server (renders the client `Breadcrumbs`)
- **Responsibility**: The editorial header of internal pages. Text on the left; on the right a "baie" — an architectural religious arch (outer rule + dark inner panel) carrying a **fully visible cross**, optionally holding a photograph, with a `CCJV` identity marker underneath.
- **Exact props type (verbatim)**:
```ts
export interface PageHeaderProps {
  overline: string;
  title: string;
  description?: string;
  verse?: { text: string; reference: string };
  tone?: "light" | "dark";
  /** Photographie optionnelle, mise en scène dans la baie. */
  image?: string;
  className?: string;
}
```
- **Destructured & rendered**: `overline, title, description, verse, tone = "light", image, className` — all rendered.
- **Hardcoded internal content**:
  - **French quote marks** hardcoded around the verse: `«&nbsp;{verse.text}&nbsp;»` (line 100)
  - **Literal identity marker**: `CCJV` (line 158, uppercase, `aria-hidden`, rendered unconditionally inside the baie)
  - No image path (from the `image` prop), no href.
  - `<Image src={image} alt="" fill sizes="(max-width: 1024px) 18rem, 21rem" className="object-cover opacity-75" />` — `alt=""` hardcoded.
  - Hardcoded 68px header offset: `pt-[calc(68px+clamp(2.5rem,5vw,4rem))]` (note: `HeroCompact`/`HeroPhoto`-family use **72px**, this one uses **68px** — an inconsistency in the same design system).
- **Internal structure**:
  1. `const isDark = tone === "dark";`
  2. `<div className={cn("relative overflow-hidden border-b", isDark ? "border-white/10 bg-ccjv-black text-white" : "border-ccjv-line bg-ccjv-offwhite text-ccjv-ink", className)}>`
  3. `<div className="container">` → `<div className="grid grid-cols-1 items-center gap-12 pt-[calc(68px+clamp(2.5rem,5vw,4rem))] pb-[clamp(3rem,6vw,4.5rem)] lg:grid-cols-12 lg:gap-16">`
  4. left `lg:col-span-7`: `<Breadcrumbs tone={isDark ? "dark" : "light"} />` → overline row `<div className="flex items-center gap-4"><CrossMark size="md" className={isDark ? "text-ccjv-cream" : "text-ccjv-green"} /><p …>{overline}</p></div>` → `<h1 className={cn("mt-6 max-w-[22ch] text-[clamp(2.25rem,1.2rem+3vw,3.75rem)] leading-[1.08] font-semibold", isDark ? "text-white" : "text-ccjv-ink")}>{title}</h1>` → `{description && (<p …>{description}</p>)}` → `{verse && (<blockquote …><p>«&nbsp;{verse.text}&nbsp;»</p><p>{verse.reference}</p></blockquote>)}`
  5. right `lg:col-span-5` — **the baie**: `<div className="relative mx-auto aspect-[3/4] w-full max-w-[15rem] sm:max-w-[18rem] lg:max-w-[21rem]">` → outer rule `<span className={cn("absolute inset-0 rounded-t-full border", isDark ? "border-white/20" : "border-ccjv-line")} aria-hidden="true" />` → inner panel `<span className="absolute inset-[7%] overflow-hidden rounded-t-full bg-ccjv-black" aria-hidden="true">` containing `{image && <Image … />}` and `{image && <span className="absolute inset-0 bg-gradient-to-t from-ccjv-black/85 via-ccjv-black/30 to-transparent" />}` → the cross `<span className="absolute top-[46%] left-1/2 -translate-x-1/2 -translate-y-1/2" aria-hidden="true"><CrossMark size="xl" className="text-ccjv-cream" /></span>` → the marker `<p className="absolute inset-x-0 bottom-[8%] text-center font-sans text-[0.6rem] font-semibold tracking-[0.34em] text-ccjv-cream/85 uppercase" aria-hidden="true">CCJV</p>`
  6. under the baie: `<span className={cn("mx-auto mt-8 block h-px w-full max-w-[15rem] sm:max-w-[18rem] lg:max-w-[21rem]", isDark ? "bg-white/15" : "bg-ccjv-line")} aria-hidden="true" />`
- **Conditional rendering**:
  - `isDark ? "border-white/10 bg-ccjv-black text-white" : "border-ccjv-line bg-ccjv-offwhite text-ccjv-ink"` (root)
  - `tone = "light"` → `isDark` drives `Breadcrumbs tone={isDark ? "dark" : "light"}`, `CrossMark className={isDark ? … }`, overline colour ternary, `h1` colour ternary, description colour ternary, verse border ternary, verse text ternary, verse reference ternary, baie border ternary, underline ternary
  - `{description && (<p …>{description}</p>)}`
  - `{verse && (<blockquote …>…</blockquote>)}`
  - `{image && (<Image … />)}` — **twice**: once for the image, once for the gradient overlay
  - `isDark && "text-white"` on the `h1`
  - No `.map`, no `.slice`, no `.length` check
- **Variants**: `tone?: "light" | "dark"` — 2 keys, **styling only** (the grid, left column, baie, cross, `CCJV` marker and underline are all present in both):
  - `"light"` (**default**) → `bg-ccjv-offwhite text-ccjv-ink`, `border-ccjv-line`, baie rule `border-ccjv-line`, underline `bg-ccjv-line`, accent green
  - `"dark"` → `bg-ccjv-black text-white`, `border-white/10`, baie rule `border-white/20`, underline `bg-white/15`, accent cream
  - No `size`/`align`/`variant`.
- **Fallbacks**: `tone = "light"`. `description` undefined → paragraph absent. `verse` undefined → the blockquote is absent. `image` undefined → **the baie still renders** as an empty dark arch with the cross and `CCJV` marker (this is the design intent, and it is what every current consumer triggers — see below). `className` undefined → dropped.
- **Consumers**:
  - `src/components/shared/LegalPage.tsx:1` — `<PageHeader overline={overline} title={title} description={description} />` — **no `tone`, no `verse`, no `image`**
- **Reuse breadth**: **1 consumer** (4 pages reach it transitively through `LegalPage`)
  This is the single largest unused-prop surface in scope: because the only consumer passes neither `verse` nor `image`, the hardcoded verse quote, the image rendering, the image gradient overlay, the `tone="dark"` styling branch and all 12 `isDark` ternaries are **all dead in production**.

## COMPONENT: ParallaxImage
- **file**: `src/components/shared/ParallaxImage.tsx` (6015 bytes, 224 lines)
- **kind**: **client** (`"use client"` at line 1)
- **Responsibility**: A photograph with a physical scroll-parallax effect — GPU transforms, active only while in the viewport, respecting `prefers-reduced-motion`, with no hover zoom. **This file exports two components.**
- **Exact props types (verbatim)**:
```ts
export interface ParallaxImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  priority?: boolean;
  sizes?: string;
  /**
   * Facteur de vitesse de défilement :
   * 0.1 à 0.18 = effet fluide, naturel et subtil.
   * L'image se déplace plus lentement que son conteneur, créant une profondeur optique.
   */
  speed?: number;
  className?: string;
  imageClassName?: string;
}
```
```ts
export function ParallaxContainer({
  children,
  speed = 0.12,
  className,
}: {
  children: ReactNode;
  speed?: number;
  className?: string;
}) {
```
- **Destructured & rendered**:
  - `ParallaxImage`: `src, alt, fill = true, priority = false, sizes = "(max-width: 1024px) 100vw, 50vw", speed = 0.12, className, imageClassName` — all rendered.
  - `ParallaxContainer`: `children, speed = 0.12, className` — all rendered.
- **Hardcoded internal content**:
  - **No French literal, no image path, no href.** Note that this is the one shared media component that **requires a real `alt`** (`alt: string`, no default) — unlike `HeroPhoto`, `FeatureImage`, `PhotoDuo`, `PageHeader`, `BreathingPhoto`, `CommunityFaces` and `MediaFeature`, all of which hardcode `alt=""`.
  - Hardcoded observer config: `{ rootMargin: "50px 0px 50px 0px" }` (identical in both components).
  - `window.matchMedia("(prefers-reduced-motion: reduce)")` (identical in both).
  - Inner wrapper class, identical in both: `"absolute -top-[10%] -bottom-[10%] left-0 right-0 w-full h-[120%] will-change-transform"` (plus `pointer-events-none` on the `ParallaxImage` variant only).
- **Internal structure**: **`ParallaxImage` and `ParallaxContainer` contain the same `useEffect` body, duplicated verbatim** (lines 43-107 vs 147-209):
  1. refs: `containerRef`, `innerRef`
  2. effect: `if (!container || !inner) return;` → `const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;` → `if (reduceMotion) { inner.style.transform = "none"; return; }`
  3. `let isVisible = false; let rafId: number | null = null;`
  4. `updatePosition` — `if (!isVisible || !container || !inner) return;` → `const rect = container.getBoundingClientRect(); const windowHeight = window.innerHeight; const elemCenter = rect.top + rect.height / 2; const viewportCenter = windowHeight / 2; const offset = (elemCenter - viewportCenter) * speed; inner.style.transform = \`translate3d(0, ${offset.toFixed(1)}px, 0)\`; rafId = null;`
  5. `onScroll` — coalesces with `requestAnimationFrame`
  6. `new IntersectionObserver(…, { rootMargin: "50px 0px 50px 0px" })`
  7. `observer.observe(container); window.addEventListener("scroll", onScroll, { passive: true }); window.addEventListener("resize", onScroll, { passive: true }); updatePosition();`
  8. cleanup: disconnect, remove both listeners, `cancelAnimationFrame`
  9. `useEffect(…, [speed])`
  Only the returned JSX differs:
  - `ParallaxImage` return: `<div ref={containerRef} className={cn("relative overflow-hidden bg-ccjv-line", className)}><div ref={innerRef} className="absolute -top-[10%] … will-change-transform pointer-events-none"><Image src={src} alt={alt} fill={fill} priority={priority} sizes={sizes} className={cn("object-cover select-none", imageClassName)} /></div></div>`
  - `ParallaxContainer` return: `<div ref={containerRef} className={cn("relative overflow-hidden", className)}><div ref={innerRef} className="absolute -top-[10%] … will-change-transform">{children}</div></div>`
- **Conditional rendering**: **no JSX conditionals at all** in either component — no `&&`, no ternary, no `.map`, no `.length` check. All branching is imperative inside the effect (`if (!container || !inner) return;`, `if (reduceMotion) { … return; }`, `if (!isVisible || …) return;`, `if (isVisible && rafId === null)`, `if (rafId !== null)`).
- **Variants**: **aucune variante** for both components — no `variant`/`size`/`tone`/`align`; `speed` is a numeric tuning prop, and `fill`/`priority` are booleans passed through to `next/image`. No style record, no switch.
- **Fallbacks**: `fill = true`, `priority = false`, `sizes = "(max-width: 1024px) 100vw, 50vw"`, `speed = 0.12`; `children` is required for `ParallaxContainer`. `imageClassName`/`className` undefined → dropped. **`alt` is required with no fallback** — this is the only component in the shared folder that does not default `alt` to `""`. With `prefers-reduced-motion: reduce`, the effect sets `transform: "none"` and returns, so the image is static but visible. Under `typeof IntersectionObserver === "undefined"` there is **no guard in this component** (unlike `Reveal`, which checks it explicitly) → the constructor would throw inside the effect.
- **Consumers**:
  - `src/components/shared/VerseSection.tsx:4` (6 render sites: lines 163, 170, 181, 189, 280, 324)
  - `src/app/qui-sommes-nous/page.tsx:7` (4 render sites: 417, 423, 432, 438)
  - `src/app/communaute/groupes-de-maison/page.tsx:6` (1 site: 158)
  - `src/app/communaute/parcours-nouveau/page.tsx:6` (1 site: 278)
  - `src/app/communaute/priere-et-intercession/page.tsx:6` (1 site: 151)
  - `src/app/vie-de-leglise/faire-un-don/page.tsx:5` (6 sites: 139, 411, 417, 426, 432, 528, 534)
  - `src/app/vie-de-leglise/ou-nous-trouver/page.tsx:6` (1 site: 72)
- **Reuse breadth**: **6+ consumers (7)**
- **`ParallaxContainer` consumers**: **NONE** — no file imports `ParallaxContainer` (every import is `import { ParallaxImage } from "@/components/shared/ParallaxImage"`). It is dead code **inside a live file**, carrying a full duplicate of the parallax effect.

### Consumer prop-shape divergence — `ParallaxImage`
Two distinct shapes, plus a **structural** divergence in how the element is sized:
- **`aspect-*` prop on `className`** (the dominant shape, 8 sites in `VerseSection` + `qui-sommes-nous`): e.g. `VerseSection.tsx:163-168` and `qui-sommes-nous/page.tsx:417-421` both use the **exact same four tuples**:
  ```
  speed={0.10} className="aspect-[3/4] w-full"
  speed={0.14} className="aspect-[4/3] w-full"
  speed={0.08} className="aspect-[4/3] w-full"
  speed={0.15} className="aspect-[3/4] w-full"
  ```
  with `alt` strings that differ (`"Vie d'église CCJV"` vs `"Louange et adoration à CCJV"`, `"Rencontre fraternelle CCJV"` vs `"Rencontre fraternelle après le culte"`, `"Célébration et louange CCJV"` vs `"Service et engagement communautaire"`, `"Moment de culte CCJV"` vs `"Enseignement de la Parole"`). **The speed values and aspect classes are duplicated character-for-character between the two files.**
- **`VerseSection` `both` variant** (`:280`, `:324`): `className="aspect-[3/4] w-full shadow-sm"` with `speed={0.10}` / `speed={0.12}` — the **only** sites adding `shadow-sm`, and the only ones where the parallax sits in a `hidden lg:block` column while a separate non-parallax `next/image` diptych renders below on mobile.
  `fill`, `priority`, `sizes` and `imageClassName` are **never passed by any consumer** — every call site relies on the defaults.

## COMPONENT: Reveal
- **file**: `src/components/shared/Reveal.tsx` (1448 bytes, 59 lines)
- **kind**: **client** (`"use client"` at line 1)
- **Responsibility**: Scroll reveal with progressive enhancement — without JS, or with `prefers-reduced-motion`, the content stays visible; otherwise it fades in when it enters the viewport.
- **Exact props type (verbatim)**:
```ts
export interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Délai (ms) pour un effet de cascade. */
  delay?: number;
}
```
- **Destructured & rendered**: `children, className, delay = 0` — all rendered.
- **Hardcoded internal content**: **no French literal, no image path, no href.** Hardcoded literals are technical:
  - `data-reveal="pending"` / `data-reveal="visible"` attribute values (matched by `globals.css`)
  - `"(prefers-reduced-motion: reduce)"` media query
  - observer config `{ threshold: 0.12, rootMargin: "0px 0px -48px 0px" }`
- **Internal structure**:
  1. `const ref = useRef<HTMLDivElement>(null);`
  2. effect: `const el = ref.current; if (!el) return;` → `const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;` → `if (reduce || typeof IntersectionObserver === "undefined") { return; }` → `el.setAttribute("data-reveal", "pending");` → `new IntersectionObserver((entries) => { for (const entry of entries) { if (entry.isIntersecting) { el.setAttribute("data-reveal", "visible"); observer.disconnect(); } } }, { threshold: 0.12, rootMargin: "0px 0px -48px 0px" })` → `observer.observe(el)` → cleanup `observer.disconnect()`
  3. return `<div ref={ref} data-reveal className={className} style={delay ? { transitionDelay: \`${delay}ms\` } : undefined}>{children}</div>`
- **Conditional rendering**:
  - `if (!el) return;` (effect)
  - `if (reduce || typeof IntersectionObserver === "undefined") { return; }` — **the progressive-enhancement guard** (note: this is exactly the guard `ParallaxImage` lacks)
  - `if (entry.isIntersecting) { … }` (observer)
  - `delay ? { transitionDelay: \`${delay}ms\` } : undefined` — style ternary
  - **No JSX-level `&&`/ternary; no `.map`; no `.length` check.**
- **Variants**: **aucune variante** — no `variant`/`size`/`tone`/`align`, no style record, no switch. `delay` is a numeric tuning prop.
- **Fallbacks**: `delay = 0` → `style` is `undefined` (no `transitionDelay` attribute). `className` undefined → dropped. `children` is **required**. The `data-reveal` attribute is emitted **without a value** (`data-reveal`), and `globals.css` styles `[data-reveal]`, `[data-reveal="pending"]` and `[data-reveal="visible"]` — so on the reduced-motion / no-JS path the element keeps bare `data-reveal` and stays fully visible via the `[data-reveal]` transition rule plus the reduced-motion override.
- **Consumers**:
  - `src/app/page.tsx:7` (10 render sites: 76, 87, 112, 128, 181, 188, 227, 251, 270, 286)
  - `src/app/qui-sommes-nous/page.tsx:5` (20 sites)
  - `src/app/communaute/groupes-de-maison/page.tsx:5` (13 sites)
  - `src/app/communaute/parcours-nouveau/page.tsx:5` (11 sites)
  - `src/app/communaute/priere-et-intercession/page.tsx:5` (13 sites)
  - `src/app/vie-de-leglise/evenements/page.tsx:5` (16 sites)
  - `src/app/vie-de-leglise/faire-un-don/page.tsx:4` (18 sites)
  - `src/app/vie-de-leglise/ou-nous-trouver/page.tsx:5` (6 sites)
- **Reuse breadth**: **6+ consumers (8 import sites, 107 render sites)** — the single most-rendered component in the codebase by call-site count.

### Consumer prop-shape divergence — `Reveal`
Three distinct call shapes, all present across the same pages:
- **bare** `<Reveal>` (no props): e.g. `page.tsx:181`, `faire-un-don/page.tsx:138`, `ou-nous-trouver/page.tsx:71`
- **`className` only** (usually a grid-column or a layout container): e.g. `page.tsx:76` `<Reveal className="md:col-span-5">`, `page.tsx:227` `<Reveal className="mx-auto flex max-w-[46rem] flex-col items-center text-center">`, `qui-sommes-nous/page.tsx:287` `<Reveal className="border border-ccjv-line bg-white p-8 lg:p-10 shadow-xs">` (the wrapper carries the **card chrome**), `parcours-nouveau/page.tsx:345` `<Reveal key={place.label} delay={idx * 80} className="h-full">`
- **`delay` + `className`** in cascades, with four different delay formulas: fixed values (`delay={100}`, `delay={120}`, `delay={140}`, `delay={150}`, `delay={160}`, `delay={200}`) and **index-derived** ones (`delay={idx * 80}`, `delay={index * 100}`, `delay={index * 120}`, `delay={index * 60}`, `delay={idx * 50}`, `delay={i * 80}`).
  Same rendered output in all cases: `<div ref data-reveal style={transitionDelay}>` — so `Reveal` **always adds a wrapper `<div>`**, and consumers compensate by moving grid-column classes (`md:col-span-5`, `lg:col-span-6`, `h-full`) onto it.

## COMPONENT: Section
- **file**: `src/components/shared/Section.tsx` (932 bytes, 40 lines)
- **kind**: server (pure-visual, no directive)
- **Responsibility**: A section wrapper carrying tone, fixed vertical padding and an optional `.container`. `Band` explicitly replaces it inside archetypes ("`Band` remplace l'usage systématique de `Section`").
- **Exact props type (verbatim)**:
```ts
export type SectionTone = "light" | "dark" | "tinted" | "green";

export interface SectionProps {
  id?: string;
  tone?: SectionTone;
  /** `false` → pleine largeur (sans container). */
  contained?: boolean;
  className?: string;
  "aria-labelledby"?: string;
  children: ReactNode;
}
```
- **Destructured & rendered**: `id, tone = "light", contained = true, className, children, ...rest` (`...rest` carries `aria-labelledby`).
- **Hardcoded internal content**: no French literal, no image path, no href. Class-only.
- **Internal structure**:
  1. `const toneClass: Record<SectionTone, string> = { light: "bg-ccjv-offwhite text-ccjv-ink", dark: "bg-ccjv-black text-white", tinted: "bg-ccjv-green-soft text-ccjv-ink", green: "bg-ccjv-green text-white" };`
  2. `<section id={id} className={cn("py-24 max-md:py-16", toneClass[tone], className)} {...rest}>`
  3. `{contained ? <div className="container">{children}</div> : children}` — **ternary that changes the DOM depth**
- **Conditional rendering**:
  - `{contained ? <div className="container">{children}</div> : children}` — the only conditional; a **structural** ternary (one extra wrapper vs none)
  - No `&&`, no `.map`, no `.length` check
- **Variants**: `tone?: SectionTone` — 4 keys, **styling only** (internal `toneClass` record on lines 6-11); `contained` is an orthogonal boolean that **is** structural:
  - `"light"` (**default**) → `"bg-ccjv-offwhite text-ccjv-ink"`
  - `"dark"` → `"bg-ccjv-black text-white"`
  - `"tinted"` → `"bg-ccjv-green-soft text-ccjv-ink"`
  - `"green"` → `"bg-ccjv-green text-white"`
  - No `size`/`align`/`variant`; padding is fixed at `"py-24 max-md:py-16"` (past-`md` 6rem / below-`md` 4rem) with **no prop to change it**.
- **Fallbacks**: `tone = "light"`, `contained = true`. `id`/`className` undefined → dropped. `aria-labelledby` optional via `...rest`. `children` required.
- **Consumers**:
  - `src/app/page.tsx:5` (6 render sites: 70, 110, 155, 170, 209, 226, 249, 285 — i.e. 8 sections)
  - `src/components/shared/LegalPage.tsx:2` (1 site: 36)
- **Reuse breadth**: **2-5 consumers (2)**

### Consumer prop-shape divergence — `Section`
- `app/page.tsx` — 8 sections with **4 distinct prop combinations**: `<Section id="mot-du-pasteur" tone="tinted" aria-labelledby="mot-pasteur-titre">` (:70), `<Section id="qui-sommes-nous" aria-labelledby="qui-sommes-nous-titre">` (no `tone` → light, :110), `<Section id="horaires" aria-labelledby="horaires-titre">` (:155), `<Section id="enseignements" tone="tinted" aria-labelledby="enseignements-titre">` (:170), `<Section id="communaute" aria-labelledby="communaute-titre">` (:209), `<Section id="priere" tone="tinted" aria-labelledby="priere-titre">` (:226), `<Section id="soutenir" aria-labelledby="soutenir-titre">` (:249), `<Section id="envoi" tone="green" aria-labelledby="envoi-titre">` (:285). **`contained` is never passed**, so the `contained={false}` full-width path is dead.
- `LegalPage.tsx:36` — `<Section>` with **no props at all**.
  `Section` is also the **only** tone carrier used on the home page, while the archetype pages use `Band` — so the same project has two tone systems (`SectionTone` with 4 keys, `BandTone` with 6) whose `light`/`dark`/`tinted`/`green` class strings are **byte-identical** (see DUPLICATION CANDIDATES §1).

## COMPONENT: SectionHeading
- **file**: `src/components/shared/SectionHeading.tsx` (1031 bytes, 47 lines)
- **kind**: server (pure-visual, no directive)
- **Responsibility**: An optional overline, an `<h2>`, and an optional description, capped at a 64ch measure, left- or centre-aligned.
- **Exact props type (verbatim)**:
```ts
export interface SectionHeadingProps {
  overline?: string;
  title: string;
  description?: string;
  /** `true` pour une section sombre (texte clair). */
  dark?: boolean;
  align?: "left" | "center";
  id?: string;
  className?: string;
}
```
- **Destructured & rendered**: `overline, title, description, dark = false, align = "left", id, className` — all rendered.
- **Hardcoded internal content**: no French literal, no image path, no href. Uses the global `.overline` class for the overline.
- **Internal structure**:
  1. `<div className={cn("mb-12 flex max-w-[64ch] flex-col gap-3", align === "center" && "mx-auto items-center text-center", className)}>`
  2. `{overline && <p className="overline">{overline}</p>}`
  3. `<h2 id={id} className={cn("text-ccjv-ink", dark && "text-white")}>{title}</h2>`
  4. `{description && (<p className={cn("text-[1.0625rem] leading-[1.6] text-ccjv-ink-secondary", dark && "text-white/70")}>{description}</p>)}`
- **Conditional rendering**:
  - `align === "center" && "mx-auto items-center text-center"`
  - `{overline && <p className="overline">{overline}</p>}`
  - `dark && "text-white"` on the `<h2>`
  - `{description && (<p …>)}` with `dark && "text-white/70"`
  - No `.map`, no `.slice`, no `.length` check
- **Variants**: `align?: "left" | "center"` — 2 keys, **styling only** (the `<div><p?><h2><p?>` tree never changes):
  - `"left"` (**default**) → no alignment classes
  - `"center"` → `mx-auto items-center text-center`
  - `dark?: boolean` — orthogonal boolean, colour only (`text-white` on `h2`, `text-white/70` on the description). Note `dark` **adds** `text-white` on top of the always-present `text-ccjv-ink`, so both classes are emitted simultaneously (Tailwind's cascade decides).
  - No `size`/`variant`/`tone`.
- **Fallbacks**: `dark = false`, `align = "left"`. `overline` undefined → no overline `<p>`. `description` undefined → no description `<p>`. `id` undefined → the `<h2>` has **no id**, which silently breaks a consumer's `aria-labelledby` — `app/page.tsx` always passes `id`, but the component cannot warn.
- **Consumers**:
  - `src/app/page.tsx:6` (3 render sites: 156, 175, 210)
- **Reuse breadth**: **1 consumer**

### Consumer prop-shape divergence — `SectionHeading`
All three call sites on the home page pass `title` + `id` + `description` and nothing else: `<SectionHeading title="Quand nous nous rassemblons" id="horaires-titre" description="Retrouvez les horaires…" />` (:156-160), `… title="Écouter la Parole" id="enseignements-titre" …` (:175-179), `… title="Les visages de notre communauté" id="communaute-titre" …` (:210-214). So `overline`, `dark`, `align` and `className` are **never used anywhere**.

## COMPONENT: VerseSection
- **file**: `src/components/shared/VerseSection.tsx` (12721 bytes, 360 lines)
- **kind**: server (renders the client `ParallaxImage`)
- **Responsibility**: The unified scripture component: 3 layout variants (photo mosaic left / centred without image / flanked images), sharp corners, serif for the verse and sans for the reference, fully parameterisable background. This is the most complex reusable component in scope.
- **Exact props type (verbatim)**:
```ts
export type VerseTone =
  | "dark"
  | "light"
  | "cream"
  | "green"
  | "offwhite"
  | "white"
  | "tinted"
  | "transparent";

export type VerseVariant =
  | "left"
  | "split"
  | "center"
  | "centered"
  | "both"
  | "flanked";

export interface VerseSectionProps {
  text: string;
  reference: string;
  /**
   * 3 Variantes de mise en page :
   * 1. 'left' | 'split' : Image/mosaïque à gauche, texte à droite
   * 2. 'center' | 'centered' : Sans image, texte au centre
   * 3. 'both' | 'flanked' : Images à gauche et à droite, texte au centre
   */
  variant?: VerseVariant;
  /** Ton prédéfini CCJV */
  tone?: VerseTone;
  /** Couleur de fond explicite (code hexadécimal, variable CSS ou valeur CSS) */
  backgroundColor?: string;
  /** Forcer le mode sombre */
  onDark?: boolean;
  /** Surtitre / contexte éditorial */
  context?: string;
  /** Photos pour la variante 'left' (mosaïque de 2 à 4 photos) */
  photos?: string[];
  /** Photo spécifique pour la colonne gauche (variante 'both') */
  leftPhoto?: string;
  /** Photo spécifique pour la colonne droite (variante 'both') */
  rightPhoto?: string;
  /** Mode compact pour intégration en sous-colonne */
  compact?: boolean;
  className?: string;
}
```
- **Destructured & rendered**: `text, reference, variant = "left", tone = "offwhite", backgroundColor, onDark, context, photos, leftPhoto, rightPhoto, compact = false, className` — all rendered.
- **Hardcoded internal content**:
  - **French `alt` literals — 6 hardcoded strings, 8 render sites**:
    - `alt="Vie d'église CCJV"` (left mosaic, `:165`; flanked-left, `:283`)
    - `alt="Rencontre fraternelle CCJV"` (`:172`)
    - `alt="Célébration et louange CCJV"` (`:182`)
    - `alt="Moment de culte CCJV"` (`:190`)
    - `alt="Vie de l'église CCJV"` (flanked-left mobile diptych, `:337`)
    - `alt="Célébration CCJV"` (flanked-right, `:284`, and mobile diptych `:345`)
  - **French quote marks / dashes**: the reference is rendered as `— {reference}` (lines 229, 268, 318) — an em-dash is hardcoded before every reference. (Compare `HeroManifesto` and `PageHeader`, which hardcode `«…»` instead — the two conventions coexist.)
  - **`aria-label="Parole biblique et méditation"`** (`:152`) — a hardcoded French landmark label.
  - **Literal image paths — 6 occurrences** (see the HARDCODED CONTENT INVENTORY): `/media/ccjv-30.jpeg` (`:108`, `:114`), `/media/ccjv-35.jpeg` (`:109`), `/media/ccjv-09.jpeg` (`:110`, `:115`), `/media/ccjv-08.jpeg` (`:111`)
  - **Hardcoded inline SVG** quote glyph, ~600 chars of `d="…"` (`:130-138`)
  - **Hardcoded darkness-detection substrings** (`:95-99`): `backgroundColor.toLowerCase().includes("black")`, `…includes("121212")`, `…includes("#000")`, `…includes("#1")` — the component infers contrast by **string-matching hex literals inside the caller's CSS value**
- **Internal structure**:
  1. `toneClass: Record<VerseTone, string>` (8 keys, lines 24-33): `dark: "bg-ccjv-black text-white"`, `light: "bg-ccjv-offwhite text-ccjv-ink"`, `offwhite: "bg-ccjv-offwhite text-ccjv-ink"`, `cream: "bg-ccjv-cream text-ccjv-ink"`, `green: "bg-ccjv-green text-white"`, `white: "bg-white text-ccjv-ink"`, `tinted: "bg-ccjv-green-soft text-ccjv-ink"`, `transparent: "bg-transparent text-inherit"` (note `light` and `offwhite` are **identical strings**)
  2. variant normalisation: `const isLeft = variant === "left" || variant === "split"; const isCenter = variant === "center" || variant === "centered"; const isBoth = variant === "both" || variant === "flanked";` — the returned `variant` string is **never passed to the DOM**
  3. dark detection: `const isDarkTone = onDark ?? (tone === "dark" || tone === "green" || (backgroundColor && (backgroundColor.toLowerCase().includes("black") || …includes("121212") || …includes("#000") || …includes("#1"))));` → `const onDeepTone = Boolean(isDarkTone);`
  4. default photos: `const displayPhotos = photos && photos.length >= 2 ? photos : [defaultImages.communaute || "/media/ccjv-30.jpeg", defaultImages.fraternite || "/media/ccjv-35.jpeg", defaultImages.assemblee || "/media/ccjv-09.jpeg", defaultImages.louange || "/media/ccjv-08.jpeg"];`
  5. `const leftImg = leftPhoto || displayPhotos[0] || "/media/ccjv-30.jpeg"; const rightImg = rightPhoto || displayPhotos[2] || "/media/ccjv-09.jpeg";`
  6. `const inlineStyle = backgroundColor ? { backgroundColor } : undefined;`
  7. `renderQuoteIcon()` — a bordered box with an inline quote-glyph `<svg>`, toned by `onDeepTone`
  8. root `<section style={inlineStyle} className={cn("relative overflow-hidden", compact ? "py-10 md:py-14" : "py-16 md:py-24", !backgroundColor && toneClass[tone], onDeepTone ? "text-white" : "text-ccjv-ink", className)} aria-label="Parole biblique et méditation">`
  9. `<div className="container relative z-10">` containing **three sibling conditional blocks**:
     - `{isLeft && (<div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-16">` image mosaic `grid-cols-2` with 4 `ParallaxImage` (`displayPhotos[0..3]`, each behind its own existence check for indices 1-3) `</div><div className="flex flex-col justify-center lg:col-span-6 lg:pl-6">` `{renderQuoteIcon()}` + context + blockquote + figcaption `</div>)`
     - `{isCenter && (<div className="mx-auto flex max-w-3xl flex-col items-center text-center">` `{renderQuoteIcon()}` + context + blockquote + figcaption `</div>)}`
     - `{isBoth && (<div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-10">` left `hidden lg:block lg:col-span-3` `ParallaxImage src={leftImg}` + centre `lg:col-span-6` icon/context/blockquote/figcaption + right `hidden lg:block lg:col-span-3` `ParallaxImage src={rightImg}` + a mobile-only diptych `grid grid-cols-2 gap-3 lg:hidden mt-4` with two plain `next/image` `</div>)}`
- **Conditional rendering**:
  - `{isLeft && (…)}`, `{isCenter && (…)}`, `{isBoth && (…)}` — **three sibling `&&` gates; exactly one produces output** because the three flags are mutually exclusive
  - `{displayPhotos[1] && (<ParallaxImage … />)}`, `{displayPhotos[2] && …}`, `{displayPhotos[3] && …}` — array-index truthiness guards (index 0 is **unguarded**)
  - `{context && (<p …>{context}</p>)}` — **repeated 3 times**, once per variant
  - `onDeepTone ? "…" : "…"` ternaries on: the quote-icon box, the context colour (×3), the blockquote colour (×3), the figcaption colour (×3), the root text colour
  - `compact ? "py-10 md:py-14" : "py-16 md:py-24"`
  - `!backgroundColor && toneClass[tone]` — the tone class is suppressed when an explicit background is given
  - `backgroundColor ? { backgroundColor } : undefined`
  - `photos && photos.length >= 2 ? photos : [4 defaults]` — **a `>= 2` length threshold**: a 1-element `photos` array is silently discarded and replaced by the 4 hardcoded defaults
  - `leftPhoto || displayPhotos[0] || "/media/ccjv-30.jpeg"` and `rightPhoto || displayPhotos[2] || "/media/ccjv-09.jpeg"` — double `||` fallback chains
  - `onDark ?? (…)` — nullish coalescing: **`onDark={false}` explicitly overrides the tone-derived detection**, which is how a consumer can force the light styling on a dark surface
  - No `.map`, no `.slice`
- **Variants**: `variant?: VerseVariant` — **6 keys mapped to 3 layouts** (the two aliases in each group are exact synonyms):
  - `"left"` and `"split"` (**`"left"` is the default**) → mosaic of up to 4 `ParallaxImage`s in a 2-column grid on the left (`lg:col-span-6`), text in the right `lg:col-span-6`; structure includes the 4 waypoint-1 photos with per-index existence guards
  - `"center"` and `"centered"` → **no image at all**; `<div className="mx-auto flex max-w-3xl flex-col items-center text-center">`; the blockquote uses a **larger** type ramp (`clamp(1.35rem,1rem+1.8vw,2.35rem)` vs the left variant's `clamp(1.25rem,0.9rem+1.6vw,2.15rem)`) and the figcaption is `justify-center`
  - `"both"` and `"flanked"` → **two** `ParallaxImage`s (`leftImg`/`rightImg` in `hidden lg:block lg:col-span-3` columns, both with `shadow-sm`) around a centred `lg:col-span-6` text block (`clamp(1.25rem,0.9rem+1.5vw,2.05rem)`), **plus a mobile-only diptych** of two plain `next/image` at `aspect-[4/3]` that replaces the hidden parallax columns below `lg`
  - `tone?: VerseTone` — **8 keys, styling only** (internal `toneClass` record): `dark`, `light`, `offwhite` (**default**), `cream`, `green`, `white`, `tinted`, `transparent`; `light` and `offwhite` are string-identical so the record has an effective **7** distinct outputs for 8 keys
  - `compact?: boolean` — orthogonal boolean, padding only (`py-10 md:py-14` vs `py-16 md:py-24`)
  - `onDark?: boolean` — orthogonal tri-state (`undefined` → infer; `true` → force dark; `false` → force light), driving ~10 colour ternaries
  - `backgroundColor?: string` — inline style; when present it **replaces** the tone class entirely and can additionally flip `onDeepTone` via substring matching
- **Fallbacks**: `variant = "left"` (note: **not** the `"center"` that `ScriptureBlock` defaults to), `tone = "offwhite"`, `compact = false`, `onDark` undefined → inferred. `photos` undefined **or** `photos.length < 2` → the 4 hardcoded `/media/ccjv-0X.jpeg` defaults. `leftPhoto` undefined → `displayPhotos[0]`, then the literal fallback. `rightPhoto` undefined → `displayPhotos[2]`, then the literal fallback. `context` undefined → no context `<p>`. `backgroundColor` undefined → `style={undefined}` and the tone class applies. `displayPhotos[1..3]` falsy → those individual images are skipped, **but `displayPhotos[0]` renders unguarded** (a falsy first element would pass `undefined` as `src`). `className` undefined → dropped.
- **Consumers**:
  - `src/app/page.tsx:10` — `<VerseSection text={verses.rassemblement.text} reference={verses.rassemblement.reference} tone="dark" />` (**no `variant`** → defaults to `"left"`)
  - `src/app/qui-sommes-nous/page.tsx:6`
  - `src/app/vie-de-leglise/evenements/page.tsx:4`
  - `src/app/vie-de-leglise/ou-nous-trouver/page.tsx:4`
  - `src/components/editorial/ScriptureBlock.tsx:1` (adapter — the only importer of the `VerseTone`/`VerseVariant` types)
  - `src/components/shared/LegalPage.tsx:3` — `<VerseSection context="Marcher dans la vérité" text={…} reference={…} tone="dark" />` (**no `variant`**)
- **Reuse breadth**: **6+ consumers (6)**

### Consumer prop-shape divergence — `VerseSection`
Three shapes reachable in production, and the component's own aliasing makes the intent hard to read:
- **via `ScriptureBlock`** (`temoignages`, `enseignements`) — `variant` is a remapped `ScriptureVariant`, `compact` is **always true**, `tone` is `tone || (onDark ? "dark" : "transparent")`, and `photos`/`leftPhoto`/`rightPhoto` are forwarded from a consumer that never passes them.
- **direct with `tone="dark"` and no `variant`** — `app/page.tsx:63-67` and `LegalPage.tsx:67-72` both resolve to `variant="left"` and therefore render the **4-photo parallax mosaic with the hardcoded `/media/ccjv-*.jpeg` defaults** on the home page and on all four legal pages. Neither passes `compact`, so both use the roomy `py-16 md:py-24`.
- **direct from `qui-sommes-nous`, `evenements`, `ou-nous-trouver`** — those pages pass explicit `variant`/`tone`/`backgroundColor` combinations.
  `photos`, `leftPhoto`, `rightPhoto`, `backgroundColor`, `compact` and `onDark` reach `VerseSection` **only** through `ScriptureBlock` (which forwards `undefined` for all of them) or are never set at all — so **`onDark` is effectively always `undefined` at the `VerseSection` level, `compact` is `false` for all direct consumers and `true` for both `ScriptureBlock` consumers, and `backgroundColor` is never supplied by any code path**.

## COMPONENT: WeekRhythm
- **file**: `src/components/shared/WeekRhythm.tsx` (1294 bytes, 38 lines)
- **kind**: server (pure-visual, no directive)
- **Responsibility**: The church's week as a rhythm of life rather than administrative data: editorial rows with a day overline, a large title, an optional audience and the time right-aligned.
- **Exact props type (verbatim)** — the item type is a named export, but the component's own props are an **inline object type**:
```ts
export interface RhythmItem {
  day: string;
  title: string;
  time: string;
  audience?: string;
}

export function WeekRhythm({ items }: { items: readonly RhythmItem[] }) {
```
- **Destructured & rendered**: `items` — rendered via `items.map`.
- **Hardcoded internal content**: **none** — no French literal (all copy comes from `item.*`), no image path, no href. Only class strings. This is one of only three components in scope with **zero hardcoded content** (with `Reveal` and `Prose`).
- **Internal structure**:
  1. `<ul className="border-t border-ccjv-line">`
  2. `{items.map((item) => (<li key={\`${item.day}-${item.title}\`} className="grid grid-cols-1 gap-2 border-b border-ccjv-line py-8 md:grid-cols-12 md:items-baseline md:gap-6">`
  3. `<p className="font-sans text-xs font-semibold tracking-[0.16em] text-ccjv-green uppercase md:col-span-3">{item.day}</p>`
  4. `<h3 className="font-serif text-[clamp(1.5rem,1rem+1.6vw,2.25rem)] leading-tight md:col-span-6">{item.title}{item.audience && (<span className="mt-1 block font-sans text-sm font-normal text-ccjv-ink-secondary">{item.audience}</span>)}</h3>`
  5. `<p className="font-sans text-[1.05rem] text-ccjv-ink-secondary md:col-span-3 md:text-right">{item.time}</p>`
  6. `</li>))}`
- **Conditional rendering**:
  - `items.map((item) => …)` — the only iteration
  - `{item.audience && (<span className="mt-1 block …">{item.audience}</span>)}` — gates the audience line
  - **No `.length` check** — an empty `items` array renders `<ul className="border-t border-ccjv-line">` with a stray top border and no rows (no `null` return, no placeholder)
  - No `.slice`, no ternary
- **Variants**: **aucune variante** — no `variant`/`size`/`tone`/`align` prop, no style record, no switch. All rows share one hardcoded 12-column layout.
- **Fallbacks**: `items` is required; `items.length === 0` → an empty bordered `<ul>` (not `null`). `item.audience` undefined → no audience `<span>`. `item.time` and `item.day` are required by the type. The `key` is a template of `day`+`title`, so a repeated day+title pair would collide.
- **Consumers**:
  - `src/app/page.tsx:12` — `<WeekRhythm items={weeklyRhythm} />` where `weeklyRhythm` comes from `@/data/mock/site`
- **Reuse breadth**: **1 consumer**

## COMPONENT: YouTubeThumb
- **file**: `src/components/shared/YouTubeThumb.tsx` (915 bytes, 37 lines — the smallest component in scope)
- **kind**: **client** (`"use client"` at line 1, for the `useState` quality fallback)
- **Responsibility**: A YouTube video thumbnail image with automatic quality fallback: `maxresdefault` does not exist for every video, so on error it switches to `hqdefault`. No iframe, no video payload — only the image is fetched.
- **Exact props type (verbatim)** — an **inline object type**; there is **no named `YouTubeThumbProps` interface**:
```ts
export function YouTubeThumb({
  videoId,
  alt = "",
  sizes = "(max-width: 768px) 100vw, 58vw",
  className,
}: {
  videoId: string;
  alt?: string;
  sizes?: string;
  className?: string;
}) {
```
- **Destructured & rendered**: `videoId, alt = "", sizes = "(max-width: 768px) 100vw, 58vw", className` — all rendered.
- **Hardcoded internal content**:
  - **Literal URL template**: `` `https://i.ytimg.com/vi/${videoId}/${quality === "max" ? "maxresdefault" : "hqdefault"}.jpg` `` (line 29) — the only hardcoded external image host in the component tree
  - **Literal quality keys**: `"max"` / `"hq"` (state union and the ternary)
  - `alt` **defaults to `""`** (line 16) — decorative by default
  - No French literal, no href.
- **Internal structure**:
  1. `const [quality, setQuality] = useState<"max" | "hq">("max");`
  2. `return (<Image src={…} alt={alt} fill sizes={sizes} className={cn("object-cover", className)} onError={() => setQuality("hq")} />);` — **a single JSX node**, no wrapper, no fragment
- **Conditional rendering**:
  - `quality === "max" ? "maxresdefault" : "hqdefault"` — ternary inside the template literal
  - `onError={() => setQuality("hq")}` — the fallback trigger (state change, not JSX)
  - No `&&`, no `.map`, no `.length` check
- **Variants**: **aucune variante** — no `variant`/`size`/`tone`/`align`, no style record, no switch. The `quality` state is a 2-state fallback machine, not a variant. `fill` is hardcoded `true`, so the component **requires a positioned, sized ancestor**.
- **Fallbacks**: `alt = ""`, `sizes = "(max-width: 768px) 100vw, 58vw"`. On the first load error, `quality` becomes `"hq"` and the `src` switches to `hqdefault.jpg`; if that also fails, the `onError` fires again but `quality` is already `"hq"`, so nothing changes and the `<Image>` renders a broken/empty frame (**no further fallback, no placeholder, no `null`**). `className` undefined → dropped. `videoId` is required with no validation.
- **Consumers**:
  - `src/components/editorial/MediaFeature.tsx:4`
  - `src/features/publications/TeachingCard.tsx:1`
  - `src/features/publications/TeachingFeature.tsx:2`
  - `src/app/publications/[slug]/page.tsx:12`
- **Reuse breadth**: **2-5 consumers (4)**

### Consumer prop-shape divergence — `YouTubeThumb`
All four call sites pass `videoId` + `sizes` + `className` and **none passes `alt`** — so every YouTube thumbnail on the site is decorative (`alt=""`):
- `MediaFeature.tsx:52-56` — `sizes={isHero ? "(max-width: 1024px) 100vw, 58vw" : "(max-width: 1024px) 100vw, 50vw"}`, `className="transition-transform duration-[550ms] ease-ccjv group-hover:scale-[1.02]"`
- `TeachingCard.tsx:16-20` — `sizes="176px"` (a fixed pixel size), `className="transition-transform duration-[550ms] ease-ccjv group-hover:scale-[1.06]"`
- `TeachingFeature.tsx:33-37` — `sizes="(max-width: 768px) 100vw, 58vw"`, `className="transition-transform duration-[550ms] ease-ccjv group-hover:scale-[1.04]"`
- `publications/[slug]/page.tsx:285-289` — `sizes="(max-width: 1024px) 100vw, 800px"`, `className="transition-transform duration-[550ms] ease-ccjv group-hover:scale-[1.03]"`
  The zoom-on-hover class string is duplicated 4 times with **four different scale factors** (`1.02`, `1.06`, `1.04`, `1.03`) and an otherwise identical string.

---

# 7. `src/components/ui/`

## COMPONENT: Badge
- **file**: `src/components/ui/Badge.tsx` (795 bytes, 23 lines)
- **kind**: server (pure-visual, no directive)
- **Responsibility**: A small uppercase pill/label.
- **Exact props type (verbatim)**:
```ts
export interface BadgeProps {
  variant?: "default" | "dark" | "outline";
  className?: string;
  children: ReactNode;
}
```
- **Destructured & rendered**: `variant = "default", className, children` — all rendered.
- **Hardcoded internal content**: no French literal, no image path, no href. Class-only.
- **Internal structure**:
  1. `const base = "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-[3px] font-sans text-[0.7rem] font-semibold uppercase leading-[1.4] tracking-[0.06em]";`
  2. `const variants: Record<NonNullable<BadgeProps["variant"]>, string> = { default: "bg-ccjv-green-soft text-ccjv-green", dark: "bg-ccjv-black text-ccjv-cream", outline: "border border-ccjv-line bg-transparent text-ccjv-ink-secondary" };`
  3. `<span className={cn(base, variants[variant], className)}>{children}</span>`
- **Conditional rendering**: **none** — no `&&`, no ternary, no `.map`, no `.length` check. Variant selection is a record lookup.
- **Variants**: `variant?: "default" | "dark" | "outline"` — 3 keys, **styling only**, internal record (line 13-17); the `<span>` and `base` string are identical for all three:
  - `"default"` (**default**) → `"bg-ccjv-green-soft text-ccjv-green"`
  - `"dark"` → `"bg-ccjv-black text-ccjv-cream"`
  - `"outline"` → `"border border-ccjv-line bg-transparent text-ccjv-ink-secondary"`
  - No `size`/`tone`. Note `rounded-full` — this component is **the one place in the design system that uses a full pill radius**, while `Button` and the rest of the editorial components use `rounded-none`.
- **Fallbacks**: `variant = "default"`. `className` undefined → dropped. `children` is **required**; no empty-state handling.
- **Consumers**:
  - `src/app/publications/[slug]/page.tsx:10` — `<Badge variant="outline">{typeLabel[publication.type]}</Badge>` and `<Badge variant="outline">{categoryLabel[publication.category]}</Badge>`
  - `src/app/vie-de-leglise/evenements/[slug]/page.tsx:8` — `<Badge variant={isUpcoming ? "default" : "outline"}>{isUpcoming ? "À venir" : "Passé"}</Badge>` and `<Badge variant="outline">{departmentName}</Badge>`
- **Reuse breadth**: **2-5 consumers (2)**

### Consumer prop-shape divergence — `Badge`
- `publications/[slug]` uses **only `variant="outline"`** (twice).
- `evenements/[slug]` is the **only** consumer of `variant="default"`, and it does so through a computed ternary `variant={isUpcoming ? "default" : "outline"}`; it also renders the two **French state literals** `À venir` / `Passé` as children.
  `variant="dark"` is **never used anywhere**.

## COMPONENT: Button
- **file**: `src/components/ui/Button.tsx` (2830 bytes, 107 lines)
- **kind**: server (pure-visual, no directive)
- **Responsibility**: The single button/link control: 4 visual variants × 2 sizes, polymorphic between `next/link` (when `href` is set) and `<button>`, with `loading` and `disabled` states.
- **Exact props type (verbatim)**:
```ts
export type ButtonVariant = "primary" | "outline" | "ghost" | "inverse";
export type ButtonSize = "md" | "lg";

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Si renseigné, le bouton devient un lien interne. */
  href?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  loading?: boolean;
  /** Ouvre le lien dans un nouvel onglet (rel sécurisé). */
  external?: boolean;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
  "aria-label"?: string;
}
```
- **Destructured & rendered**: `variant = "primary", size = "md", href, type = "button", disabled = false, loading = false, external = false, className, children, onClick, ...rest` (`...rest` carries `aria-label`).
- **Hardcoded internal content**: no French literal, no image path, no href literal. Class-only, plus a hardcoded spinner:
  - `const base = "inline-flex select-none items-center justify-center gap-2 rounded-none border text-center font-sans text-[0.9375rem] font-medium tracking-[0.01em] transition-[background-color,border-color,color,transform] duration-[250ms] ease-ccjv";`
  - spinner `<span className="h-[1em] w-[1em] shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden="true" />`
- **Internal structure**:
  1. `const classes = cn(base, variants[variant], sizes[size], "active:translate-y-[1px]", disabled && "pointer-events-none cursor-not-allowed opacity-40", className);`
  2. `const inner = (<>{loading && (<span … spinner … />)}<span className="inline-flex items-center gap-2">{children}</span></>);`
  3. `if (href) { const linkProps = external ? { target: "_blank", rel: "noopener noreferrer" } : {}; return (<Link href={href} className={classes} aria-disabled={disabled || undefined} tabIndex={disabled ? -1 : undefined} {...linkProps} {...rest}>{inner}</Link>); }`
  4. `return (<button type={type} className={classes} disabled={disabled} aria-busy={loading || undefined} onClick={onClick} {...rest}>{inner}</button>);`
  5. **Nothing else** — no wrapper, no fragment.
- **Conditional rendering**:
  - `disabled && "pointer-events-none cursor-not-allowed opacity-40"`
  - `{loading && (<span … spinner … />)}`
  - `if (href) { … }` — **early return switching the element type between `Link` and `button`** (structural)
  - `external ? { target: "_blank", rel: "noopener noreferrer" } : {}` — spread ternary
  - `aria-disabled={disabled || undefined}` and `tabIndex={disabled ? -1 : undefined}`
  - `aria-busy={loading || undefined}`
  - No `.map`, no `.length` check
- **Variants**: two independent axes, both **styling only** (the `inner` fragment and the element type logic are variant-agnostic):
  - `variant?: ButtonVariant` — **4 keys**, internal record (lines 27-36):
    - `"primary"` (**default**) → `"border-ccjv-green bg-ccjv-green text-white hover:border-ccjv-green-strong hover:bg-ccjv-green-strong"`
    - `"outline"` → `"border-ccjv-ink bg-transparent text-ccjv-ink hover:border-ccjv-green hover:text-ccjv-green"`
    - `"ghost"` → `"border-transparent bg-transparent px-2 text-ccjv-green underline-offset-4 hover:text-ccjv-green-strong hover:underline"` (**the only variant that sets its own `px-2`**, competing with the size `px-*`)
    - `"inverse"` → `"border-white bg-transparent text-white hover:border-ccjv-cream hover:bg-white/5 hover:text-ccjv-cream"`
  - `size?: ButtonSize` — **2 keys**, internal record (lines 38-41):
    - `"md"` (**default**) → `"min-h-[44px] px-6"`
    - `"lg"` → `"min-h-[52px] px-8 text-base"`
  - Structural behaviour (not a variant prop, but a prop-driven element swap): `href` present → renders `next/link`; `href` absent → renders `<button>`. `external` additionally adds `target`/`rel`.
- **Fallbacks**: `variant = "primary"`, `size = "md"`, `type = "button"`, `disabled = false`, `loading = false`, `external = false`. `href` undefined → a real `<button>` with `onClick`. `onClick` undefined → no handler (on a `Link`, `onClick` is never attached at all — it is destructured but **not** passed to `Link`). `className` undefined → dropped. `children` required.
  **`disabled` on the `Link` path is visual only**: `pointer-events-none` + `aria-disabled` + `tabIndex={-1}`, but the `href` is still present in the markup.
- **Consumers**:
  - `src/app/page.tsx:4` (8 render sites: 123 `<Button variant="outline" href="/qui-sommes-nous">`, 163 `<Button variant="outline" href="/vie-de-leglise/ou-nous-trouver">`, 202 `<Button variant="outline" href="/publications/enseignements">`, 241 `<Button variant="primary" href={site.whatsappHref} external>`, 265 `<Button variant="outline" href={site.whatsappHref} external>`, 299 `<Button variant="inverse" size="lg" href="/vie-de-leglise/ou-nous-trouver">`, 306 `<Button variant="inverse" size="lg" href={site.whatsappHref} external>`)
  - `src/app/organisation/DepartmentModal.tsx:7` — `<Button variant="primary" href={whatsappUrl} external>Écrire au sujet de ce département</Button>`
  - `src/app/organisation/page.tsx:8`
  - `src/app/communaute/temoignages/page.tsx:11` — `<Button variant="primary" href={site.whatsappHref} external>Proposer mon témoignage</Button>`
  - `src/app/publications/[slug]/page.tsx:11` — `<Button variant="primary" href={contentUrl} external>Regarder la vidéo sur YouTube</Button>`
  - `src/features/pages/Hero.tsx:2` — `<Button variant="primary" size="lg" href="/vie-de-leglise/ou-nous-trouver">Planifier ma visite</Button>` and `<Button variant="inverse" size="lg" href="/vie-de-leglise/ou-nous-trouver">Voir les horaires</Button>`
  - `src/features/publications/TeachingFeature.tsx:1` — `<Button variant="primary" href={href} external>Regarder la vidéo sur YouTube</Button>`
- **Reuse breadth**: **6+ consumers (7)**

### Consumer prop-shape divergence — `Button`
Only **4 of 12** prop-shape combinations are exercised, and **no consumer ever renders a `<button>`**:
- **`href` + `external`** → renders `<Link target="_blank">`: `page.tsx:241, 265, 306`; `DepartmentModal.tsx:253`; `temoignages/page.tsx:262`; `publications/[slug]/page.tsx:314`; `TeachingFeature.tsx:91`.
- **`href` internal** → renders `<Link>`: `page.tsx:123, 163, 202, 299`; `Hero.tsx:61, 68`.
- **`variant="inverse"`** is used **only with `size="lg"`** (3 sites, all `hero`/`envoi` sections).
- **`variant="ghost"`, `size="md"` with an explicit variant, `type="submit"`, `disabled`, `loading`, `onClick`, `aria-label` are NEVER passed by any consumer.** Because `href` is always supplied, the `<button>` return branch, the entire `loading` spinner, `aria-busy`, `disabled`, `type` handling and `onClick` are **dead in production** — every consumer of `Button` is a link.
- `Button` is also bypassed by hand-rolled buttons elsewhere: `app/vie-de-leglise/evenements/[slug]/page.tsx:196` writes `"inline-flex min-h-11 items-center border border-ccjv-ink px-6 font-sans text-[0.9375rem] font-medium transition-colors duration-[250ms] hover:border-ccjv-green hover:text-ccjv-green"` — **Button's `outline` variant plus its `md` size, re-typed by hand** — and `app/organisation/DepartmentModal.tsx:272` hand-rolls a border-button too.

## COMPONENT: EmptyState
- **file**: `src/components/ui/EmptyState.tsx` (724 bytes, 31 lines)
- **kind**: server (pure-visual, no directive)
- **Responsibility**: A left-aligned empty-state block: title, optional description, optional action.
- **Exact props type (verbatim)**:
```ts
export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}
```
- **Destructured & rendered**: `title, description, action, className` — all rendered.
- **Hardcoded internal content**: **none** — no French literal (all copy comes from props), no image path, no href. Only class strings. Note it imports **no icon and no illustration** — the empty state is text-only.
- **Internal structure**:
  1. `<div className={cn("flex flex-col items-start gap-3 rounded-none border border-ccjv-line bg-ccjv-offwhite px-6 py-12 text-left", className)}>`
  2. `<h3 className="text-[1.125rem]">{title}</h3>`
  3. `{description && (<p className="max-w-[52ch] text-ccjv-ink-secondary">{description}</p>)}`
  4. `{action && <div className="mt-2">{action}</div>}`
- **Conditional rendering**:
  - `{description && (<p …>{description}</p>)}`
  - `{action && <div className="mt-2">{action}</div>}`
  - No ternary, no `.map`, no `.length` check
- **Variants**: **aucune variante** — no `variant`/`size`/`tone`/`align` prop, no style record, no switch. `rounded-none` is explicit.
- **Fallbacks**: `description` undefined → no `<p>`. `action` undefined → no action `<div>`. `className` undefined → dropped. `title` required. There is no icon/CTA default.
- **Consumers**:
  - `src/app/organisation/page.tsx:9`
  - `src/app/communaute/temoignages/page.tsx:12`
  - `src/app/publications/actualites/page.tsx:7`
  - `src/app/publications/enseignements/page.tsx:10`
  - `src/app/publications/mediatheque/page.tsx:9`
  - `src/app/publications/ressources/page.tsx:7`
- **Reuse breadth**: **6+ consumers (6)**

### Consumer prop-shape divergence — `EmptyState`
- **`title` + `description`, no `action`** — the shape used **by all six consumers**; `action` is **never passed anywhere**. Examples: `actualites/page.tsx:101-104` `title="Aucune actualité pour le moment" description="Les nouvelles publiées depuis le back-office apparaîtront ici."`; `enseignements/page.tsx:81-84`; `mediatheque/page.tsx:86-89` and `:150-153` (two distinct instances on the same page); `ressources/page.tsx:150-153`; `temoignages/page.tsx:196-199`; `organisation/page.tsx`.
- **No consumer passes `className`** either, so `EmptyState` always renders inside its own `bg-ccjv-offwhite` bordered box — meaning an empty state on a `tone="dark"` or `tone="tinted"` band would render a light box regardless of context.

---

# 8. `src/features/`

## COMPONENT: EventRow
- **file**: `src/features/events/EventRow.tsx` (1177 bytes, 36 lines)
- **kind**: server (no directive, no hooks)
- **Responsibility**: A secondary event as a compact editorial line (not a card), to create hierarchy against the featured event.
- **Exact props type (verbatim)** — an **inline object type**; there is **no named `EventRowProps` interface**:
```ts
export function EventRow({
  event,
  departmentName,
}: {
  event: Event;
  departmentName?: string;
}) {
```
  `Event` is imported from `@/types`.
- **Destructured & rendered**: `event, departmentName` — both rendered. `event.eventDate`, `event.title`, `event.eventTime`, `event.location`, `event.departmentId` are read (the last only by the consumer).
- **Hardcoded internal content**:
  - **French/geographic literal**: `"Lubumbashi"` — used as the **hardcoded location fallback** (`{event.location ?? "Lubumbashi"}`, line 32)
  - **Hardcoded separator**: `{formatTime(event.eventTime)} · {event.location ?? "Lubumbashi"}` — a literal `·` between time and place
  - No image path, no href.
- **Internal structure**:
  1. `<article className="grid grid-cols-1 gap-2 border-b border-ccjv-line py-7 md:grid-cols-12 md:items-baseline md:gap-6">`
  2. `<time className="font-sans text-sm text-ccjv-ink-secondary md:col-span-3" dateTime={event.eventDate}>{formatLongDate(event.eventDate)}</time>`
  3. `<h3 className="font-serif text-[1.25rem] leading-snug md:col-span-6">{event.title}{departmentName && (<span className="mt-1 block font-sans text-xs font-semibold tracking-[0.08em] text-ccjv-green uppercase">{departmentName}</span>)}</h3>`
  4. `<p className="font-sans text-sm text-ccjv-ink-secondary md:col-span-3 md:text-right">{formatTime(event.eventTime)} · {event.location ?? "Lubumbashi"}</p>`
- **Conditional rendering**:
  - `{departmentName && (<span className="mt-1 block …">{departmentName}</span>)}`
  - `event.location ?? "Lubumbashi"` — nullish coalescing
  - No `.map`, no `.slice`, no `.length` check, no ternary
- **Variants**: **aucune variante** — no `variant`/`size`/`tone`/`align` prop, no style record, no switch. The only conditional is the optional department overline.
- **Fallbacks**: `departmentName` undefined → no overline span. `event.location` nullish → the literal `"Lubumbashi"`. `event.description`/`event.excerpt`/`event.imageUrl` are **ignored entirely** by this component. `event.eventTime` has no fallback — `formatTime(undefined)` is called and whatever `@/lib/utils` returns is printed.
- **Consumers**:
  - `src/app/vie-de-leglise/evenements/[slug]/page.tsx:9` — used inside a `.map` over `related`, wrapped in a `<Link>`:
    ```tsx
    <EventRow
      event={item}
      departmentName={item.departmentId ? departmentNames[item.departmentId] : undefined}
    />
    ```
- **Reuse breadth**: **1 consumer**

## COMPONENT: EventsSection
- **file**: `src/features/events/EventsSection.tsx` (9294 bytes, 245 lines)
- **kind**: server (no directive, no hooks)
- **Responsibility**: A two-column events section — left: strong title, description and a CTA button (sticky on `lg`); right: a divided list of events with a stacked month/day date block, a department overline, a title, a time·place line and an arrow.
- **Exact props type (verbatim)**:
```ts
export interface EventsSectionProps {
  /** Titre principal (colonne gauche) */
  title?: string;
  /** Description / sous-titre (colonne gauche) */
  description?: string;
  /** Texte du bouton d'action */
  ctaLabel?: string;
  /** Lien du bouton d'action */
  ctaHref?: string;
  /** Liste des événements à afficher */
  events?: Event[];
  /**
   * Noms de départements indexés par identifiant, pour les événements venus de
   * l'API (qui référence les départements par UUID). Absent, on retombe sur le
   * référentiel de démonstration.
   */
  departmentNames?: Record<string, string>;
  /** Nombre maximum d'événements affichés */
  maxEvents?: number;
  /** Ton de fond */
  tone?: "offwhite" | "light" | "cream" | "white" | "tinted" | "dark";
  /** Couleur de fond personnalisée */
  backgroundColor?: string;
  className?: string;
}
```
- **Destructured & rendered**: `title, description, ctaLabel, ctaHref, events, departmentNames, maxEvents, tone, backgroundColor, className` — all rendered/used. Note `title`, `description`, `ctaLabel`, `ctaHref`, `events` and `maxEvents` all have **defaults**, so none of them is truly optional in behaviour.
- **Hardcoded internal content**:
  - **Default French copy baked into the signature** (rendered if the consumer omits them):
    - `title = "Ce qui se passe bientôt"`
    - `description = "Rejoignez-nous et grandissons ensemble ! Découvrez nos prochains rassemblements, cultes, retraites et temps forts."`
    - `ctaLabel = "VOIR TOUT L'AGENDA"`
  - **Default href**: `ctaHref = "/vie-de-leglise/evenements"`
  - **Default data import**: `events = upcomingEvents` — imported from `@/data/mock/events`, i.e. **the component defaults to mock data**
  - **French fallback literal**: `{department || "ÉVÉNEMENT"}` (line 189) — the uppercase fallback category
  - **French locale literal**: `date.toLocaleDateString("fr-FR", { month: "short" })` and `toLocaleDateString("fr-FR", { day: "numeric" })` (lines 49, 52)
  - **Fallback date parts**: `return { month: "EVT", day: "•" };` (line 55) — the `catch` branch
  - **Path template literal**: `` href={`/vie-de-leglise/evenements/${event.slug}`} `` (line 153) — a **hardcoded route** rather than one derived from `lib/nav.ts`
  - No literal image path (this section renders **no photographs at all** — the events list is text-only), no `next/image` import.
  - **`localeCompare`:** none — no re-sorting is done here; `events` is taken in the order given.
- **Internal structure**:
  1. module scope: `const toneStyles = { offwhite: "bg-ccjv-offwhite text-ccjv-ink", light: "bg-ccjv-offwhite text-ccjv-ink", cream: "bg-ccjv-cream text-ccjv-ink", white: "bg-white text-ccjv-ink", tinted: "bg-ccjv-green-soft text-ccjv-ink", dark: "bg-ccjv-black text-white" };`
  2. module scope: `function getEventDateParts(isoDate: string)` — `try { const date = new Date(isoDate); const month = date.toLocaleDateString("fr-FR", { month: "short" }).replace(".", "").toUpperCase(); const day = date.toLocaleDateString("fr-FR", { day: "numeric" }); return { month, day }; } catch { return { month: "EVT", day: "•" }; }`
  3. `const displayedEvents = events.slice(0, maxEvents);` and `const isDark = tone === "dark";`
  4. `<section style={backgroundColor ? { backgroundColor } : undefined} className={cn("relative py-16 md:py-24", !backgroundColor && toneStyles[tone], className)} aria-labelledby="events-section-title">`
  5. `<div className="container">` → `<div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-16">`
  6. left `lg:col-span-5 lg:sticky lg:top-28`: `<h2 id="events-section-title">` (the `id` is **hardcoded**, so two instances on one page would collide) → `{description && (<p …>)}` → `{ctaLabel && (<div className="mt-8 md:mt-10"><Link href={ctaHref} …>{ctaLabel}</Link></div>)}`
  7. right `lg:col-span-7` → `<div className={cn("divide-y", isDark ? "divide-white/15" : "divide-ccjv-line")}>` → `{displayedEvents.map((event) => { const { month, day } = getEventDateParts(event.eventDate); const department = departmentNames?.[event.departmentId ?? ""] ?? getDepartmentName(event.departmentId); return (<Link key={event.id} href={`/vie-de-leglise/evenements/${event.slug}`} className={cn("group flex items-center justify-between gap-6 py-7 md:py-8 transition-colors duration-200", isDark ? "hover:bg-white/[0.03]" : "hover:bg-black/[0.02]")}>`
        - date block `<div className="flex w-14 flex-shrink-0 flex-col items-center text-center">` → month `<span className={cn("w-full border-b pb-1 font-sans text-[0.78rem] font-semibold tracking-[0.14em] uppercase", …)}>{month}</span>` + day `<span className={cn("pt-1 font-serif text-2xl md:text-3xl font-bold leading-tight", …)}>{day}</span>`
        - info block `<div className="flex-1 pl-2 md:pl-4">` → `<p …>{department || "ÉVÉNEMENT"}</p>` → `<h3 …>{event.title}</h3>` → `{event.location && (<p …>{event.eventTime && `${event.eventTime} · `}{event.location}</p>)}`
        - arrow `<div className={cn("flex h-10 w-10 flex-shrink-0 items-center justify-center transition-transform duration-300 group-hover:translate-x-1.5", …)} aria-hidden="true">` with an inline `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter"><path d="M5 12h14" /><path d="M12 5l7 7-7 7" /></svg>`
        `</Link>); })}`
- **Conditional rendering**:
  - `const displayedEvents = events.slice(0, maxEvents);` — **`.slice`**, silently truncating the list
  - `{description && (<p …>{description}</p>)}`
  - `{ctaLabel && (<div …>)}`
  - `displayedEvents.map((event) => …)` — the main iteration
  - `departmentNames?.[event.departmentId ?? ""] ?? getDepartmentName(event.departmentId)` — **optional chaining + nullish coalescing twice**, a three-step department resolution (prop map → mock referential → `undefined`)
  - `{department || "ÉVÉNEMENT"}` — `||` fallback
  - `{event.location && (<p …>)}` — **the time·place line renders only when `location` exists**, so an event with a time but no location shows neither
  - `{event.eventTime && \`${event.eventTime} · \`}` — suppresses the time if absent
  - `isDark ? "divide-white/15" : "divide-ccjv-line"`, `isDark ? "hover:bg-white/[0.03]" : "hover:bg-black/[0.02]"`, and 5 further `isDark` colour ternaries inside the row (month border/text, day text, department colour, title colour, arrow colour, location colour)
  - `backgroundColor ? { backgroundColor } : undefined` and `!backgroundColor && toneStyles[tone]`
  - `return { month: "EVT", day: "•" };` — the `try/catch` fallback
  - No `.length` check on `displayedEvents` — an empty `events` array renders an **empty `<div className="divide-y …">`** with no empty state
- **Variants**: `tone?: "offwhite" | "light" | "cream" | "white" | "tinted" | "dark"` — **6 keys**, internal `toneStyles` record (lines 33-40), **mostly styling but `dark` also flips every inner colour** via `isDark`:
  - `"offwhite"` (**default**) → `bg-ccjv-offwhite text-ccjv-ink`
  - `"light"` → `"bg-ccjv-offwhite text-ccjv-ink"` — **string-identical to `offwhite`** (a redundant key)
  - `"cream"` → `bg-ccjv-cream text-ccjv-ink`
  - `"white"` → `bg-white text-ccjv-ink`
  - `"tinted"` → `bg-ccjv-green-soft text-ccjv-ink`
  - `"dark"` → `bg-ccjv-black text-white` **and** `isDark === true`, which switches 8 additional class ternaries (divide colour, hover fill, month label colour, month border, day colour, department colour, title colour + hover, arrow colour, location colour)
  - `backgroundColor?: string` is an **escape hatch that disables the tone class entirely** (`!backgroundColor && toneStyles[tone]`) while leaving `isDark` derived from `tone` — so `backgroundColor="#121212"` with the default `tone="offwhite"` would render a dark background with all-light-on-light text, because `isDark` is `tone === "dark"` and **does not inspect `backgroundColor`** (unlike `VerseSection`, which does substring-match the background colour)
  - No `size`/`align`/`variant`.
- **Fallbacks**: `title`, `description`, `ctaLabel`, `ctaHref`, `events` (**`upcomingEvents` mock data**) and `maxEvents = 3` all have defaults, so omitting `events` renders 3 mock events rather than nothing. `departmentNames` undefined → falls back to `getDepartmentName(event.departmentId)` from `@/data/mock/departments`. `department` still falsy → the literal `"ÉVÉNEMENT"`. `event.location` falsy → the whole time·place line is suppressed. `event.eventTime` falsy → the time prefix is suppressed. `event.departmentId` null → `?? ""` produces an empty key lookup, then the mock fallback. `backgroundColor` undefined → `style` is `undefined`. `className` undefined → dropped. An **empty resulting list has no fallback**: `displayedEvents` empty → an empty divided `<div>`, no `EmptyState`.
- **Consumers**:
  - `src/app/page.tsx:15` — the home page passes **all six** overriding props:
    ```tsx
    <EventsSection
      title="Ce qui se passe"
      description="Rejoignez-nous et marchons ensemble avec Jésus ! Découvrez nos prochains cultes, temps de prière et rencontres fraternelles."
      ctaLabel="TOUT L'AGENDA"
      ctaHref="/vie-de-leglise/evenements"
      events={upcoming}
      departmentNames={departmentNames}
      tone="tinted"
    />
    ```
    It overrides `title`, `description` and `ctaLabel` with **near-identical strings to the component's own defaults** (`"Ce qui se passe"` vs the default `"Ce qui se passe bientôt"`; the description differs by one clause; `"TOUT L'AGENDA"` vs the default `"VOIR TOUT L'AGENDA"`), and it leaves `maxEvents` at 3 despite fetching `getEvents({ status: "UPCOMING", limit: 6 })`.
- **Reuse breadth**: **1 consumer**

## COMPONENT: FeaturedEvent
- **file**: `src/features/events/FeaturedEvent.tsx` (2621 bytes, 81 lines)
- **kind**: server (no directive, no hooks)
- **Responsibility**: The main event as a dominant editorial composition (photo + date + title + description + time/place/dl), instead of one of three identical cards.
- **Exact props type (verbatim)** — an **inline object type**; there is **no named `FeaturedEventProps` interface**:
```ts
export function FeaturedEvent({
  event,
  departmentName,
  className,
}: {
  event: Event;
  departmentName?: string;
  className?: string;
}) {
```
- **Destructured & rendered**: `event, departmentName, className` — all rendered.
- **Hardcoded internal content**:
  - **French literal**: `Prochain rendez-vous` (line 39, rendered unconditionally as the overline)
  - **French `<dt>` labels**: `Heure` (line 59), `Lieu` (line 65), `Département` (line 72)
  - **Geographic fallback literal**: `{event.location ?? "Lubumbashi"}` (line 67)
  - No image path (from `event.imageUrl`), no href (the article is **not a link** — no `next/link` import at all)
- **Internal structure**:
  1. `<article className={cn("grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-10", className)}>`
  2. media `<div className="relative aspect-[16/11] overflow-hidden bg-ccjv-line md:col-span-7 md:aspect-auto md:min-h-[28rem]">{event.imageUrl && (<Image src={event.imageUrl} alt="" fill sizes="(max-width: 768px) 100vw, 58vw" className="object-cover" />)}</div>`
  3. text `<div className="flex flex-col justify-center md:col-span-5">` → `<p className="font-sans text-xs font-semibold tracking-[0.16em] text-ccjv-green uppercase">Prochain rendez-vous</p>` → `<time className="mt-6 block font-serif text-[clamp(2rem,1rem+2.6vw,3.25rem)] leading-none" dateTime={event.eventDate}>{formatLongDate(event.eventDate)}</time>` → `<h3 className="mt-5 font-serif text-[clamp(1.5rem,1rem+1.6vw,2.25rem)] leading-tight">{event.title}</h3>` → `{event.description && (<p className="mt-4 max-w-[46ch] text-ccjv-ink-secondary">{event.description}</p>)}` → `<dl className="mt-8 grid grid-cols-2 gap-5 border-t border-ccjv-line pt-6">` with the Heure `Heure`/`Lie`u divs and `{departmentName && (<div className="col-span-2"><dt>Département</dt><dd>{departmentName}</dd></div>)}`
- **Conditional rendering**:
  - `{event.imageUrl && (<Image … />)}` — **the `aspect-[16/11]` / `md:min-h-[28rem]` frame is always rendered** even without an image (an empty tinted box)
  - `{event.description && (<p …>{event.description}</p>)}`
  - `{departmentName && (<div className="col-span-2">…)}` — the department row spans both columns
  - No `.map`, no `.slice`, no `.length` check, no ternary anywhere
- **Variants**: **aucune variante** — no `variant`/`size`/`tone`/`align` prop, no style record, no switch. `className` is a pass-through, not a variant.
- **Fallbacks**: `departmentName` undefined → the `Département` `<dt>`/`<dd>` pair is omitted. `event.location` nullish → the literal `"Lubumbashi"`. `event.description` undefined → no description. `event.imageUrl` undefined → an **empty framed media box** (not `null`). `event.eventTime` has no fallback (`formatTime(event.eventTime)` is always called). `className` undefined → dropped.
- **Consumers**: **NONE** (0 import statements anywhere under `frontend/src`).
- **Reuse breadth**: **0 — dead code.** The page that needed a featured event (`app/vie-de-leglise/evenements/page.tsx`) hand-rolls its own dominant event markup instead of importing this file; `app/page.tsx` uses `EventsSection` (a text-only list). So the project has **three separate event renderings** (`EventsSection`'s row, `EventRow`, `FeaturedEvent`) and only two are reachable.

## COMPONENT: Hero
- **file**: `src/features/pages/Hero.tsx` (3247 bytes, 76 lines)
- **kind**: server (renders the pure-visual `Button` and `CrossMark`)
- **Responsibility**: "01 — L'INVITATION (Hero V3)". The first identity moment of the home page: photograph, editorial typography, identity, location, a visible Christian motif, practical information and two CTAs opening the "venir" journey.
- **Exact props type (verbatim)**: **none.** Signature: `export function Hero() {` — **zero props**.
- **Destructured & rendered**: nothing (no props). Data read: `images.portraitLarge` from `@/data/mock/images`.
- **Hardcoded internal content** (all rendered, none parameterised):
  - `aria-label="Bienvenue au Centre Chrétien Jésus ma Vie"` (line 16)
  - **`<h1 className="display text-white">Bienvenue dans la maison.</h1>`** (line 49)
  - **`Le Centre Chrétien Jésus ma Vie est une famille spirituelle à Lubumbashi. On y vient comme on est : pour écouter la Parole, louer Dieu et marcher ensemble.`** (lines 55-57)
  - **`Planifier ma visite`** (line 66, CTA 1)
  - **`Voir les horaires`** (line 69, CTA 2)
  - **Literal hrefs**: `href="/vie-de-leglise/ou-nous-trouver"` — used **twice**, on **both** CTAs, so "Planifier ma visite" and "Voir les horaires" lead to the same page
  - No literal image path (uses `images.portraitLarge`), and `<Image … alt="" … />` hardcodes an empty `alt` on the single most important photograph on the site.
- **Internal structure**:
  1. `<section className="relative grid min-h-svh grid-cols-1 overflow-hidden min-[900px]:grid-cols-2" aria-label="Bienvenue au Centre Chrétien Jésus ma Vie">`
  2. header-legibility veil `<div className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-24 bg-gradient-to-b from-black/60 to-transparent" aria-hidden="true" />`
  3. image container `<div className="absolute inset-0 z-0 bg-ccjv-line min-[900px]:relative min-[900px]:inset-auto min-[900px]:order-2 min-[900px]:z-auto min-[900px]:min-h-svh">` → `<Image src={images.portraitLarge} alt="" fill priority sizes="(max-width: 900px) 100vw, 50vw" className="object-cover" />` → mobile overlay `<div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/65 to-black/40 min-[900px]:hidden" aria-hidden="true" />` → arch motif `<span className="pointer-events-none absolute inset-x-8 top-8 bottom-8 rounded-t-full border border-ccjv-cream/35 max-[900px]:hidden" aria-hidden="true" />`
  4. text container `<div className="relative z-10 flex min-h-svh items-end bg-transparent px-[clamp(24px,5vw,72px)] pt-[120px] pb-16 text-white min-[900px]:order-1 min-[900px]:bg-ccjv-black min-[900px]:pb-20 max-[900px]:pb-20">` → `<div className="max-w-[36rem]">` → `<h1 className="display text-white">` → `<p className="lead mt-6 text-white/85 min-[900px]:text-white/75">` containing `<CrossMark size="md" className="mr-3 inline-block align-middle text-ccjv-cream" />` + the paragraph text → `<div className="mt-10 flex flex-wrap gap-3">` with the two `<Button>`s
- **Conditional rendering**: **none in JSX** — no `&&`, no ternary, no `.map`, no `.length` check. All responsive behaviour is **arbitrary-breakpoint CSS** (`min-[900px]:` / `max-[900px]:`), which is why this file contains the `900px` magic number 13 times and no `md:`/`lg:` tokens at all.
- **Variants**: **aucune variante** — zero props, no variant axis of any kind.
- **Fallbacks**: no props → no prop fallbacks. `images.portraitLarge` has no guard; if it were undefined the `next/image` `src` would be broken.
- **Consumers**:
  - `src/app/page.tsx:14` — `<Hero />` with no props
- **Reuse breadth**: **1 consumer** (home page only) — and it is the **only full-screen hero on the site that does not use one of the five `composition/Hero*` components**.

## COMPONENT: TeachingCard
- **file**: `src/features/publications/TeachingCard.tsx` (2623 bytes, 76 lines)
- **kind**: server (renders the client `YouTubeThumb`)
- **Responsibility**: A secondary teaching as a compact YouTube thumbnail plus title and excerpt.
- **Exact props type (verbatim)** — an **inline object type**; there is **no named `TeachingCardProps` interface**:
```ts
export function TeachingCard({ publication }: { publication: Publication }) {
```
- **Destructured & rendered**: `publication` — rendered.
- **Hardcoded internal content**:
  - **French literal**: `Regarder sur YouTube →` (line 53) — the card's permanent CTA text
  - **French `aria-label` template**: `` aria-label={`Regarder « ${publication.title} » sur YouTube`} `` (line 67, on the outer `<a>`)
  - **Hardcoded play-glyph SVG**: `<svg viewBox="0 0 24 24" className="h-4 w-4 translate-x-[1px]" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>` (lines 27-33)
  - No image path, no literal href (`href = publication.contentUrl`).
- **Internal structure**:
  1. `const youtubeId = getYouTubeId(publication.contentUrl); const href = publication.contentUrl;`
  2. `const content = (<>`
     - thumbnail `<span className="relative block aspect-video w-full shrink-0 overflow-hidden bg-ccjv-black sm:w-44">` → `{youtubeId && (<YouTubeThumb videoId={youtubeId} sizes="176px" className="transition-transform duration-[550ms] ease-ccjv group-hover:scale-[1.06]" />)}` → play affordance `<span className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true"><span className="flex h-11 w-11 items-center justify-center rounded-full border border-ccjv-cream bg-black/45 text-ccjv-cream transition-colors duration-[250ms] group-hover:bg-ccjv-cream group-hover:text-ccjv-black"><svg … /></span></span>`
     - text `<span className="mt-4 flex min-w-0 flex-col sm:mt-0">` → `{publication.author && (<span className="font-sans text-xs font-semibold tracking-[0.14em] text-ccjv-ink-secondary uppercase">{publication.author}</span>)}` → `<span className="mt-2 font-serif text-[1.15rem] leading-snug">{publication.title}</span>` → `{publication.description && (<span className="mt-2 font-sans text-[0.9rem] text-ccjv-ink-secondary">{publication.description}</span>)}` → `<span className="mt-3 font-sans text-sm font-medium text-ccjv-green">Regarder sur YouTube →</span>`
     `</>);`
  3. `<article className="border-t border-ccjv-line pt-6">` → `{href ? (<a href={href} target="_blank" rel="noopener noreferrer" className="group flex flex-col gap-4 sm:flex-row sm:gap-5" aria-label={…}>{content}</a>) : (<div className="flex flex-col gap-4 sm:flex-row sm:gap-5">{content}</div>)}</article>`
- **Conditional rendering**:
  - `{youtubeId && (<YouTubeThumb … />)}` — if the URL is not a YouTube link the thumbnail frame stays empty (the `aspect-video bg-ccjv-black` box plus the play glyph remain)
  - `{publication.author && (<span …>)}`
  - `{publication.description && (<span …>)}`
  - `{href ? (<a …>{content}</a>) : (<div …>{content}</div>)}` — **ternary: link vs non-link, both wrapping the same `content` fragment**
  - No `.map`, no `.length` check
- **Variants**: **aucune variante** — no `variant`/`size`/`tone`/`align` prop, no style record, no switch. The `href` ternary changes the wrapper element but is a data condition, not a variant.
- **Fallbacks**: `publication.contentUrl` undefined → `youtubeId` falsy, `href` falsy → **no thumbnail and no link**; the card renders as a bare bordered text block with a `Regarder sur YouTube →` label that leads nowhere. `publication.author` undefined → no author overline. `publication.description` undefined → no excerpt. `publication.type` is **never read** by this component (so a TEXT publication renders with the same YouTube affordance).
- **Consumers**:
  - `src/app/page.tsx:18` — used inside a `.map` over `otherTeachings.slice(0, 2)`, wrapped in `<Reveal key={teaching.id} delay={80}>`
- **Reuse breadth**: **1 consumer**

## COMPONENT: TeachingFeature
- **file**: `src/features/publications/TeachingFeature.tsx` (3531 bytes, 99 lines)
- **kind**: server (renders the client `YouTubeThumb` and the pure-visual `Button`)
- **Responsibility**: The featured teaching as a visual YouTube card (thumbnail + play button + a bottom label), the message excerpt, and an explicit invitation to watch on YouTube. No iframe and no embedded player.
- **Exact props type (verbatim)** — an **inline object type**; there is **no named `TeachingFeatureProps` interface**:
```ts
export function TeachingFeature({
  publication,
}: {
  publication: Publication;
}) {
```
- **Destructured & rendered**: `publication` — rendered.
- **Hardcoded internal content**:
  - **French literal**: `Regarder sur YouTube` (line 66) — the label pinned to the bottom of the thumbnail
  - **French literal**: `Regarder la vidéo sur YouTube` (line 92) — the `Button` child
  - **French `aria-label` template**: `` aria-label={`Regarder « ${publication.title} » sur YouTube`} `` (line 30)
  - **Hardcoded play-glyph SVG**: `<svg viewBox="0 0 24 24" className="h-7 w-7 translate-x-[2px]" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>` (lines 52-58) — same `d` as `TeachingCard`, larger and differently translated
  - No image path, no literal href (`href = publication.contentUrl`).
- **Internal structure**:
  1. `const youtubeId = getYouTubeId(publication.contentUrl); const href = publication.contentUrl;`
  2. `<article className="grid grid-cols-1 gap-10 border-t border-ccjv-line pt-10 md:grid-cols-12 md:gap-12">`
  3. `{href && (<a href={href} target="_blank" rel="noopener noreferrer" className="group relative block aspect-video overflow-hidden bg-ccjv-black md:col-span-7" aria-label={…}>` → `{youtubeId && (<YouTubeThumb videoId={youtubeId} sizes="(max-width: 768px) 100vw, 58vw" className="transition-transform duration-[550ms] ease-ccjv group-hover:scale-[1.04]" />)}` → bottom veil `<span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" aria-hidden="true" />` → play button `<span className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true"><span className="flex h-16 w-16 items-center justify-center rounded-full border border-ccjv-cream bg-black/45 text-ccjv-cream transition-colors duration-[250ms] group-hover:bg-ccjv-cream group-hover:text-ccjv-black md:h-20 md:w-20"><svg … /></span></span>` → bottom label `<span className="pointer-events-none absolute inset-x-5 bottom-5 font-sans text-xs font-semibold tracking-[0.16em] text-white uppercase" aria-hidden="true">Regarder sur YouTube</span>` `</a>)}`
  4. text `<div className="flex flex-col justify-center md:col-span-5">` → `<h3 className="font-serif text-[clamp(1.5rem,1rem+1.6vw,2.25rem)] leading-tight">{publication.title}</h3>` → `{publication.author && (<p className="mt-3 font-sans text-sm text-ccjv-ink-secondary">{publication.author}</p>)}` → `{publication.description && (<div className="mt-6 border-l-2 border-ccjv-green/40 pl-5"><p className="font-serif text-[1.05rem] leading-[1.6] text-ccjv-ink">{publication.description}</p></div>)}` → `{href && (<div className="mt-7"><Button variant="primary" href={href} external>Regarder la vidéo sur YouTube</Button></div>)}`
- **Conditional rendering**:
  - `{href && (<a …>)}` — **gates the entire media column**; without a `contentUrl` the article renders only the text column in a 12-column grid
  - `{youtubeId && (<YouTubeThumb … />)}`
  - `{publication.author && (<p …>)}`
  - `{publication.description && (<div className="mt-6 border-l-2 border-ccjv-green/40 pl-5">…)}`
  - `{href && (<div className="mt-7"><Button …/></div>)}`
  - No `.map`, no `.length` check, no ternary
- **Variants**: **aucune variante** — no `variant`/`size`/`tone`/`align` prop, no style record, no switch.
- **Fallbacks**: `publication.contentUrl` undefined → `href` falsy → **both** `<a>` and `<Button>` are gated off, so the thumbnail column disappears entirely and only the title/author/description text renders (no placeholder). `publication.author` undefined → no author line. `publication.description` undefined → no excerpt block. `youtubeId` falsy but `href` truthy (e.g. a Facebook link) → an **empty black `aspect-video` box** with a veil, a play button and the `Regarder sur YouTube` label. `publication.type` is never read.
- **Consumers**:
  - `src/app/page.tsx:17` — wrapped in `<Reveal>` inside `{leadTeaching && (<Reveal><TeachingFeature publication={leadTeaching} /></Reveal>)}`
- **Reuse breadth**: **1 consumer**

## COMPONENT: SearchClient
- **file**: `src/features/search/SearchClient.tsx` (3404 bytes, 97 lines)
- **kind**: **client** (`"use client"` at line 1)
- **Responsibility**: On-site search — client-side filtering over a static index built at server render. No backend, no network request, `useMemo` instead of debounce.
- **Exact props type (verbatim)** — `SearchEntry` is a named export, but the component's own props are an **inline object type**:
```ts
export interface SearchEntry {
  href: string;
  title: string;
  description: string;
  kind: string;
}

export function SearchClient({ entries }: { entries: SearchEntry[] }) {
```
- **Destructured & rendered**: `entries` — rendered in the results and in the count line.
- **Hardcoded internal content**:
  - **French literals**: `Que cherchez-vous ?` (label, line 45); placeholder `Événements, départements, enseignements…` (line 52); `Saisissez au moins deux caractères. {entries.length} contenus sont référencés sur le site.` (lines 57-60); `Aucun résultat pour «&nbsp;{query.trim()}&nbsp;». Essayez un autre mot, ou parcourez nos rubriques depuis le menu.` (lines 91-92)
  - **Hardcoded magic numbers**: the two-character minimum appears **three times as a literal `2`** — `if (q.length < 2) return [];` (line 26), `const hasQuery = query.trim().length >= 2;` (line 37), and the text `au moins deux caractères` (line 58) — plus the `.slice(0, 30)` result cap
  - **Hardcoded input `id`**: `htmlFor="recherche-site"` / `id="recherche-site"` (so a second instance on one page would duplicate the id)
  - **Hardcoded French guillemets** `«&nbsp;…&nbsp;»` around the echoed query
  - No image path, no href (hrefs come from `entry.href`).
- **Internal structure**:
  1. `const [query, setQuery] = useState("");`
  2. `const results = useMemo(() => { const q = query.trim().toLowerCase(); if (q.length < 2) return []; return entries.filter((entry) => \`${entry.title} ${entry.description} ${entry.kind}\`.toLowerCase().includes(q)).slice(0, 30); }, [entries, query]);`
  3. `const hasQuery = query.trim().length >= 2;`
  4. `<div>` → `<label htmlFor="recherche-site" className="font-sans text-xs font-semibold tracking-[0.14em] text-ccjv-ink-secondary uppercase">Que cherchez-vous ?</label>` → `<input id="recherche-site" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Événements, départements, enseignements…" autoComplete="off" className="mt-4 w-full border border-ccjv-line bg-white px-5 py-4 font-sans text-[1.05rem] text-ccjv-ink transition-colors duration-[250ms] outline-none placeholder:text-ccjv-ink-secondary/60 focus:border-ccjv-green" />` → `<p className="mt-3 font-sans text-xs text-ccjv-ink-secondary">Saisissez au moins deux caractères. {entries.length} contenus sont référencés sur le site.</p>` → the results block
  5. results: `{hasQuery && (results.length > 0 ? (<ul className="mt-10 border-t border-ccjv-line">{results.map((entry) => (<li key={entry.href} className="border-b border-ccjv-line"><Link href={entry.href} className="group grid grid-cols-1 gap-1 py-6 md:grid-cols-12 md:items-baseline md:gap-6"><span className="font-sans text-xs font-semibold tracking-[0.14em] text-ccjv-green uppercase md:col-span-3">{entry.kind}</span><span className="font-serif text-[1.25rem] leading-snug transition-colors duration-[250ms] group-hover:text-ccjv-green md:col-span-9">{entry.title}</span>{entry.description && (<span className="text-[0.92rem] text-ccjv-ink-secondary md:col-span-9 md:col-start-4">{entry.description}</span>)}</Link></li>))}</ul>) : (<p role="status" className="mt-10 border-t border-ccjv-line pt-8 text-ccjv-ink-secondary">Aucun résultat pour «&nbsp;{query.trim()}&nbsp;». Essayez un autre mot, ou parcourez nos rubriques depuis le menu.</p>))}`
- **Conditional rendering**:
  - `if (q.length < 2) return [];` — the minimum-length guard inside `useMemo`
  - `.filter((entry) => \`${entry.title} ${entry.description} ${entry.kind}\`.toLowerCase().includes(q))` — the actual matching
  - `.slice(0, 30)` — **result cap**
  - `const hasQuery = query.trim().length >= 2;`
  - `{hasQuery && (results.length > 0 ? (<ul …>) : (<p role="status" …>))}` — **`&&` wrapping a nested ternary of list vs no-result message**, three states total (idle / results / no results)
  - `results.map((entry) => …)` with `key={entry.href}`
  - `{entry.description && (<span …>)}`
- **Variants**: **aucune variante** — no `variant`/`size`/`tone`/`align` prop, no style record, no switch. The three UI states derive from `query`/`results`, not from a variant prop.
- **Fallbacks**: `entries.length === 0` → the count line reads `0 contenus sont référencés sur le site.` and any query returns the `Aucun résultat` `<p role="status">`. `query` shorter than 2 chars → **nothing renders at all below the count line** (not even a hint), because `hasQuery` is false. `entry.description === ""` → `{entry.description && …}` is falsy, so no description span. `entry.kind` is always rendered (no fallback if empty). No `null` return for empty `entries`.
- **Consumers**:
  - `src/app/recherche/page.tsx:5` — passed as a **child node** rather than as a page-level component: `facts={<SearchClient entries={entries} />}` inside an `InformationPage`, where `entries` is built by the locally-defined `buildIndex()` from `primaryNav`, `events`, `departments`, and `publications`
- **Reuse breadth**: **1 consumer**

---

# 9. `src/lib/nav.ts`

- **file**: `src/lib/nav.ts` (6585 bytes, 219 lines) — **not a component**; it is the navigation single source of truth
- **kind**: pure data/logic module, no JSX, no directive
- **Exported types (verbatim)**:
```ts
export interface NavChild {
  href: string;
  label: string;
  /** Accroche courte affichée dans le mega menu. */
  description?: string;
  ready?: boolean;
}

export interface NavItem {
  /**
   * `undefined` = pôle de regroupement. Le libellé situe le visiteur mais ne
   * mène nulle part : il ne doit jamais être rendu comme un lien.
   */
  href?: string;
  label: string;
  description?: string;
  ready?: boolean;
  children?: NavChild[];
}
```
```ts
export interface Crumb {
  label: string;
  href?: string;
}
```
- **Exported values**:
  - `mainNav: NavItem[]` — 6 top-level entries. Literal French labels/hrefs/descriptions:
    - `{ href: "/", label: "Accueil", ready: true }`
    - `{ href: "/qui-sommes-nous", label: "Qui sommes-nous", description: "Notre histoire, notre foi et notre vision.", ready: true }`
    - `{ label: "Vie de l'Église", description: "Quand et où nous rassembler.", ready: true, children: [ { href: "/vie-de-leglise/evenements", label: "Nos événements", description: "Cultes, rencontres et temps forts.", ready: true }, { href: "/vie-de-leglise/ou-nous-trouver", label: "Où nous trouver", description: "Adresse, horaires, accès et contact.", ready: true }, { href: "/vie-de-leglise/faire-un-don", label: "Faire un don", description: "Soutenir l'œuvre de l'église.", ready: true } ] }` — **no `href` (grouping pillar)**
    - `{ label: "Notre communauté", description: "Des personnes, pas des rubriques.", ready: true, children: [ { href: "/communaute/groupes-de-maison", label: "Groupes de maison", description: "La fraternité de proximité.", ready: true }, { href: "/communaute/parcours-nouveau", label: "Parcours nouveau", description: "Vos premiers pas parmi nous.", ready: true }, { href: "/communaute/priere-et-intercession", label: "Prière & intercession", description: "Déposer une demande de prière.", ready: true }, { href: "/communaute/temoignages", label: "Témoignages", description: "Ce que Dieu a fait parmi nous.", ready: true } ] }` — **no `href`**
    - `{ href: "/organisation", label: "Organisation", description: "Une communauté portée par ceux qui servent.", ready: true }` — **has `href`, no children**
    - `{ label: "Ressources", description: "Actualités, enseignements, médiathèque.", ready: true, children: [ { href: "/publications/actualites", label: "Actualités", description: "Nouvelles et annonces.", ready: true }, { href: "/publications/enseignements", label: "Enseignements", description: "Sermons et prédications.", ready: true }, { href: "/publications/mediatheque", label: "Médiathèque", description: "Photos et vidéos.", ready: true }, { href: "/publications/ressources", label: "Ressources & Guides", description: "Guides et documents.", ready: true } ] }` — **no `href`**
  - `primaryNav: NavItem[]` — derived: `mainNav.filter((item) => item.ready).map((item) => ({ ...item, children: item.children?.filter((child) => child.ready) }))`
  - `allDestinations: NavChild[]` — derived: `mainNav.flatMap((item) => [ ...(item.href ? [{ href: item.href, label: item.label }] : []), ...(item.children ?? []) ])`
  - `legalNav: NavChild[]` — 5 literal French entries: `{ href: "/mentions-legales", label: "Mentions légales" }`, `{ href: "/confidentialite", label: "Confidentialité" }`, `{ href: "/conditions", label: "Conditions" }`, `{ href: "/accessibilite", label: "Accessibilité" }`, `{ href: "/recherche", label: "Recherche" }`
  - `getBreadcrumbs(pathname: string): Crumb[]` — `if (pathname === "/") return [];` → special-cases `"/organisation"` → exact `href` match → exact/prefix `child.href` match → **pillar-segment fallback** `const pillarSegment = item.children?.[0]?.href.split("/")[1];` → `legalNav` exact match → `return [];`
- **Consumers**: `src/components/layout/FullscreenMenu.tsx:7` (`primaryNav`, `NavItem`), `src/components/shared/Breadcrumbs.tsx:6` (`getBreadcrumbs`), `src/app/recherche/page.tsx:9` (`primaryNav`). (`mainNav`, `allDestinations`, `legalNav`, `NavChild`, `Crumb` are exported but the sitemap/cross-page consumers that the doc-comment names — "footer, recherche et sitemap" — **do not import them**: the Footer hardcodes its own links, and there is no `sitemap.ts` importing `allDestinations` or `legalNav`.)
- **Notable divergences between this file and its nominal consumers**:
  - `FullscreenMenu` renders `href={item.href ?? "/"}` for a `NavItem` with neither `href` nor children — contradicting the file's own stated contract that a pillar without `href` "ne doit jamais être rendu comme un lien".
  - The Footer links to `/politique-de-confidentialite`, `/conditions-generales` and `/vie-de-leglise/faq` while `legalNav` declares `/confidentialite` and `/conditions` — the two lists disagree.
  - `Header`'s `darkHeroRoutes` array duplicates route knowledge that lives here.

# 10. `src/types/index.ts`

- **file**: `src/types/index.ts` (2469 bytes, 81 lines) — **not a component**; the public-domain data model, aligned with the future `/api/v1/*` REST contract
- **Exports (verbatim)**:
```ts
export type PublicationType = "VIDEO" | "PHOTO" | "TEXTE";

export type EventStatus = "UPCOMING" | "ARCHIVED";

export interface Department {
  id: string;
  name: string;
  slug: string;
  description?: string;
  responsibleName?: string;
  /** Image d'en-tête de la fiche département. */
  bannerImage?: string;
  /** Rythme de rencontre (ex. « Vendredi · 17:00 — Répétition générale »). */
  meetingSchedule?: string;
  /** Piliers / valeurs mis en avant sur la fiche. */
  keyPoints?: string[];
  /** Galerie photographique réelle. */
  gallery?: string[];
  /** Accroche courte affichée dans les listes. */
  tagline?: string;
}

export interface Event {
  id: string;
  title: string;
  slug: string;
  description?: string;
  eventDate: string; // date ISO "YYYY-MM-DD"
  eventTime?: string; // heure "HH:mm" ou placeholder
  location?: string;
  imageUrl?: string;
  /** `null` = événement général de l'église. */
  departmentId?: string | null;
  status: EventStatus;
  /** Accroche éditoriale (liste / fiche). */
  excerpt?: string;
  /** Bandeau de la fiche événement. */
  bannerImage?: string;
  /** Galerie de la fiche événement. */
  gallery?: string[];
  /** Informations pratiques complémentaires. */
  practicalInfo?: string[];
}

export interface Publication {
  id: string;
  title: string;
  slug: string;
  type: PublicationType;
  /** Lien vidéo externe (YouTube/Facebook) ou chemin image. */
  contentUrl?: string;
  description?: string;
  publishedAt: string; // date ISO "YYYY-MM-DD"
  /** Rubrique éditoriale : actualité, enseignement, média, ressource. */
  category?: "ACTUALITE" | "ENSEIGNEMENT" | "MEDIA" | "RESSOURCE";
  /** Auteur / orateur. */
  author?: string;
  /** Corps éditorial (publications de type TEXTE). */
  body?: string[];
}

export type PageKey = "ACCUEIL" | "QUI_SOMMES_NOUS" | "COMMUNAUTE" | "CONTACT";

export interface StaticPage {
  id: string;
  pageKey: PageKey;
  content: string;
}
```
- **Consumers**: `src/features/events/EventRow.tsx:2`, `src/features/events/FeaturedEvent.tsx:3`, `src/features/events/EventsSection.tsx:5`, `src/features/publications/TeachingCard.tsx:3`, `src/features/publications/TeachingFeature.tsx:3`, `src/app/publications/[slug]/page.tsx:19`, `src/app/organisation/DepartmentModal.tsx:5` — 7 import sites.
- **Type/consumer mismatch worth recording**: `Publication.coverImage` is **read by `app/publications/actualites/page.tsx:148`, `app/publications/mediatheque/page.tsx:31` and `app/publications/[slug]/page.tsx:113`** (with a comment "L'API peut renvoyer la photo en `coverImage` plutôt qu'en `contentUrl`") but `coverImage` **does not exist on the `Publication` interface** — the field is typed only where the API layer widens it, so the components consume an undocumented field.
- `PageKey`/`StaticPage` are exported but have **no importer** in `frontend/src`.

# 11. `src/app/globals.css`

- **file**: `src/app/globals.css` (8079 bytes, 364 lines)
- **kind**: Tailwind CSS v4 entry (`@import "tailwindcss"`) + `@theme` blocks + `@layer base` + `@layer components` + global keyframes

## CSS custom properties actually defined

**`@theme` (real design tokens, become Tailwind utilities):**
| Custom property | Value | Generated utility family |
|---|---|---|
| `--color-ccjv-green` | `#1e7a1e` | `*-ccjv-green` |
| `--color-ccjv-green-strong` | `#176317` | `*-ccjv-green-strong` |
| `--color-ccjv-green-soft` | `#eaf3ea` | `*-ccjv-green-soft` |
| `--color-ccjv-cream` | `#ede4c8` | `*-ccjv-cream` |
| `--color-ccjv-black` | `#121212` | `*-ccjv-black` |
| `--color-ccjv-offwhite` | `#fafaf7` | `*-ccjv-offwhite` |
| `--color-ccjv-ink` | `#1a1a1a` | `*-ccjv-ink` |
| `--color-ccjv-ink-secondary` | `#5e5d59` | `*-ccjv-ink-secondary` |
| `--color-ccjv-line` | `#e5e2d9` | `*-ccjv-line` |
| `--ease-ccjv` | `cubic-bezier(0.16, 1, 0.3, 1)` | `ease-ccjv` |
| `--ease-ccjv-in` | `cubic-bezier(0.65, 0, 0.35, 1)` | `ease-ccjv-in` |

**`@theme inline` (font stacks wired to `next/font` runtime variables):**
| Custom property | Value |
|---|---|
| `--font-serif` | `var(--font-lora), Georgia, "Times New Roman", serif` |
| `--font-sans` | `var(--font-inter), system-ui, -apple-system, "Segoe UI", sans-serif` |

**Total: 11 non-font tokens + 2 font tokens = 13 custom properties.** There is **no spacing scale, no radius scale and no shadow token** — any `px-*`, `py-*`, `rounded-*` and `shadow-*` in components comes from Tailwind defaults, and `rounded-none` is written out explicitly 8 times in components.

**Tokens referenced by components but NOT defined:** `ccjv-green-dark` (used in `PrayerRequestForm.tsx` twice plus 3 `app/**` pages) — undefined; the closest defined token is `--color-ccjv-green-strong`. Also `--ease-ccjv-in` is **never used by any component** (only `--ease-ccjv` is, 7 times).

## Section-specific / non-token classes defined in `globals.css`

| Class / selector | Purpose | Used by |
|---|---|---|
| `.container` | `margin-inline: auto; width: 100%; max-width: 1200px; padding-inline: clamp(16px, 4vw, 48px)` | **34 occurrences across components** (all `Hero*`, all archetype bands indirectly, `Breadcrumbs` ancestors, `Footer` with a `max-w-[1380px]` override, `Header`, `BreathingPhoto`, `CommunityFaces`, `VerseSection`, `LegalPage`, `EventsSection`) |
| `.overline` | `font-sans text-xs font-semibold uppercase tracking-[0.14em] text-ccjv-green` | `SectionHeading` only (`className="overline"`) — **while ~20 components re-type the same recipe inline with `tracking-[0.18em]`/`[0.2em]` instead** |
| `.display` | `font-size: clamp(2.2rem, 1rem + 4vw, 4.5rem); line-height: 1.1` | `features/pages/Hero.tsx` (`<h1 className="display">`) |
| `.lead` | `color: var(--color-ccjv-ink-secondary); font-size: clamp(1.05rem, 0.3rem + 1vw, 1.25rem); line-height: 1.6` | `HeroPhoto.tsx` (`<p className="lead">`), `HeroManifesto.tsx`, `CommunityFaces.tsx`, plus `app/page.tsx` |
| `.skip-link` / `.skip-link:focus` | off-screen-then-visible skip link | **no component uses it** (defined, unused) |
| `.prose-body` (+ `> p + p`, `> ul + p`, `> p + ul`, `> h3`, `ul`, `li`, `li + li`, `li::before`) | editorial body rhythm and the hairline list bullet | `editorial/Prose.tsx` only |
| `.prose-dropcap > p:first-of-type::first-letter` | drop cap | `Prose` when `dropcap` is set (1 call site) |
| `.measure` / `.measure-narrow` | `max-width: 68ch` / `56ch` | **no component uses them** (defined, unused — `Prose` uses its own `widthClass` record instead) |
| `[data-reveal]`, `[data-reveal="pending"]`, `[data-reveal="visible"]` | reveal transition states | `shared/Reveal.tsx` |
| `.intro-curtain`, `.intro-seen .intro-curtain`, `@keyframes ccjv-intro-out` | first-visit curtain (1900 ms) | `layout/IntroCurtain.tsx` + the inline `introScript` in `app/layout.tsx` (sessionStorage key `ccjv-intro`) |
| `.page-enter`, `@keyframes ccjv-page-in` | per-navigation page transition (420 ms) | `app/template.tsx` (not a component in scope) |
| `.face-caption`, `@keyframes ccjv-face-in` | caption replay on image change (480 ms) | `shared/CommunityFaces.tsx` (`className="face-caption"`) |
| `.menu-submenu-in`, `@keyframes ccjv-submenu-in` | fullscreen submenu entrance (420 ms) | `layout/FullscreenMenu.tsx` (2 sites) |
| `@media (prefers-reduced-motion: reduce)` | forces `animation-duration`/`transition-duration` to `0.01ms` and neutralises `[data-reveal="pending"]` | global |
| scrollbar rules (`*`, `::-webkit-scrollbar*`, `.bg-ccjv-black`, `[id="site-menu"]`) | thin green scrollbar, cream variant on dark surfaces | global (the `[id="site-menu"]` selector couples `globals.css` to `FullscreenMenu`'s DOM id) |
| `::selection`, `:focus-visible` | green selection, 2px green focus ring | global |

## Repeated Tailwind-ish token classes across components (counts over the 48 `.tsx` files in `components/`)

| Class / token | Occurrences | Notes |
|---|---|---|
| `font-sans` | 122 | used in 33 of 48 files |
| `text-white` (bare) | 81 | the single most repeated colour literal |
| `text-white/<n>` (opacity variants) | 58 | `text-white/94`, `/92`, `/90`, `/85`, `/80`, `/78`, `/75`, `/72`, `/70`, `/65`, `/60`, `/55`, `/50`, `/45`, `/40`, `/30` |
| `text-ccjv-cream` | 55 | |
| `text-ccjv-ink-secondary` | 46 | |
| `text-ccjv-ink` | 38 | |
| `text-ccjv-green` | 43 | |
| `font-serif` | 40 | used in 18 of 48 files |
| `container` | 34 | |
| `border-ccjv-line` | 33 | |
| `border-white/<n>` | 21 | `/10`, `/12`, `/15`, `/20`, `/25`, `/30`, `/60` |
| `bg-ccjv-line` | 20 | the standard empty-media placeholder fill |
| `bg-ccjv-offwhite` | 18 | |
| `leading-relaxed` | 18 | |
| `bg-ccjv-black` | 16 | |
| `tracking-[0.2em]` | 20 | |
| `hover:text-ccjv-green` | 11 | |
| `tracking-[0.18em]` | 10 | |
| `text-[0.72rem]` | 9 | the standard overline size |
| `leading-snug` | 9 | |
| `tracking-[0.14em]` | 9 | |
| `bg-ccjv-green` | 9 | |
| `rounded-none` | 8 | |
| `tracking-[0.16em]` | 7 | |
| `duration-[250ms]` | 7 | |
| `ease-ccjv` | 7 | |
| `clamp(16px,4vw,48px)` | 6 | duplicated from `.container` into 6 inline class strings |
| `aspect-4/5` | 5 | |
| `aspect-3/4` | 5 | |
| `bg-ccjv-green-soft` | 5 | |
| `bg-ccjv-cream` | 5 | |
| `max-w-[52ch]` | 5 | |
| `aspect-4/3` | 4 | |
| `duration-[150ms]` | 4 | |
| `aspect-16/9` | 3 | |
| `duration-[550ms]` | 2, `duration-[400ms]` 2 | |
| `ccjv-green-strong` | 3 (all in `ui/Button.tsx`) | the token is essentially unused outside `Button` |
| `fill-ccjv-cream` | 1 | |

**Recurring micro-recipes worth flagging** (identical class strings repeated across files):
1. The overline recipe `font-sans text-xs font-semibold tracking-[0.18em] text-ccjv-green uppercase` — appears in `HeroPractical`, `HeroPhoto`, `HeroCompact` (0.18em), `PageHeader`, `MediaFeature`, `CrossMark` call sites, etc., while `.overline` exists with `tracking-[0.14em]`.
2. The section-heading recipe `mb-10 font-sans text-[0.72rem] font-semibold tracking-[0.2em] text-ccjv-green uppercase` — **verbatim in `DetailPage`, `DirectoryPage`, `ListingPage`, `MediaPage`** (and its `text-ccjv-cream` twin in `MediaPage`'s dark band, its `text-ccjv-ink-secondary` twin in `ListingPage`'s archives).
3. The type-scale recipe `text-[clamp(1.6rem,1rem+1.6vw,2.35rem)]` — repeated in `DirectoryPage`, `InformationPage` ×2, `ListingPage`, `WeekRhythm`'s `h3` sibling.
4. The media-frame recipe `relative overflow-hidden bg-ccjv-line` — repeated in `FeatureImage`, `PhotoDuo` ×2, `PhotoGallery` ×6, `PeopleGrid` ×3, `PortraitPanel`, `BreathingPhoto`'s siblings.
5. The hairline-caption recipe `mt-3 border-t border-ccjv-line pt-3 font-sans text-[0.76rem] leading-relaxed text-ccjv-ink-secondary` — `PhotoDuo` ×2 verbatim, near-identical in `PhotoGallery`'s `strip`, and `MediaFeature`'s `mt-5 border-t border-ccjv-line pt-5`.
6. The header offset `pt-[calc(72px+…)]` — `HeroCompact` (72), `HeroManifesto` (72), `HeroPractical` (72), `HeroPhoto`'s `pb-12`, **`PageHeader` uses 68px** — an inconsistency inside the same family.

---

# DUPLICATION CANDIDATES

## D1 — Four copies of the same tone → Tailwind-class map (STRUCTURAL)
The same `Record<tone, "bg-… text-…">` is declared four times, and the four shared keys have **byte-identical values**:

- `src/components/composition/Band.tsx:31-38` (6 keys)
  ```ts
  light: "bg-ccjv-offwhite text-ccjv-ink",
  cream: "bg-ccjv-cream text-ccjv-ink",
  tinted: "bg-ccjv-green-soft text-ccjv-ink",
  dark: "bg-ccjv-black text-white",
  green: "bg-ccjv-green text-white",
  bare: "",
  ```
- `src/components/shared/Section.tsx:6-11` (4 keys) — **`light`, `dark`, `tinted`, `green` are character-for-character identical to `Band`'s**
  ```ts
  light: "bg-ccjv-offwhite text-ccjv-ink",
  dark: "bg-ccjv-black text-white",
  tinted: "bg-ccjv-green-soft text-ccjv-ink",
  green: "bg-ccjv-green text-white",
  ```
- `src/components/shared/VerseSection.tsx:24-33` (8 keys) — `dark`, `light`, `offwhite`, `cream`, `green`, `white`, `tinted` again reuse the same strings, and **`light` and `offwhite` are identical to each other**
  ```ts
  dark: "bg-ccjv-black text-white",
  light: "bg-ccjv-offwhite text-ccjv-ink",
  offwhite: "bg-ccjv-offwhite text-ccjv-ink",
  cream: "bg-ccjv-cream text-ccjv-ink",
  green: "bg-ccjv-green text-white",
  white: "bg-white text-ccjv-ink",
  tinted: "bg-ccjv-green-soft text-ccjv-ink",
  transparent: "bg-transparent text-inherit",
  ```
- `src/features/events/EventsSection.tsx:33-40` (6 keys) — **`offwhite` and `light` are identical to each other**, and both equal `Band.light`
  ```ts
  offwhite: "bg-ccjv-offwhite text-ccjv-ink",
  light: "bg-ccjv-offwhite text-ccjv-ink",
  cream: "bg-ccjv-cream text-ccjv-ink",
  white: "bg-white text-ccjv-ink",
  tinted: "bg-ccjv-green-soft text-ccjv-ink",
  dark: "bg-ccjv-black text-white",
  ```

**Overlap: structural.** Four independent tone vocabularies (`BandTone` 6, `SectionTone` 4, `VerseTone` 8, `EventsSection` inline union 6 = **24 declared keys, 9 distinct class pairs**), three of which also carry a redundant duplicate key (`light`/`offwhite`, `offwhite`/`light`). A page can therefore be built from `Band` (archetypes) or `Section` (home page) with the same tone name producing the same colour but a **different padding scale** (`Band` 5 space levels vs `Section`'s single fixed `py-24 max-md:py-16`).

## D2 — Five headers share the identical overline row (STRUCTURAL with cosmetic deltas)
The same "rule + overline" row appears in five components:

- `HeroCompact.tsx:41-46`
  ```tsx
  <div className="flex items-center gap-4">
    <span className="h-px w-8 bg-ccjv-green" aria-hidden="true" />
    <p className="font-sans text-xs font-semibold tracking-[0.18em] text-ccjv-green uppercase">
      {overline}
    </p>
  </div>
  ```
- `HeroPhoto.tsx:63-68` — the same `<div className="flex items-center gap-4">` with `<span className="h-px w-10 bg-ccjv-cream" aria-hidden="true" />` and `… text-ccjv-cream uppercase`. **Identical structure; only the hairline width (8→10) and the colour token differ.**
- `HeroPractical.tsx:44-46` — **the same `<p>` class string verbatim**, but with the hairline `<span>` removed.
- `PageHeader.tsx:52-65` — the same `<div className="flex items-center gap-4">`, with `CrossMark size="md"` in place of the hairline.
- `HeroManifesto.tsx:51-61` — the same `<div className="flex items-center gap-4">` with `CrossMark size="md"`, but `tracking-[0.2em]` instead of `[0.18em]`.

**Overlap: structural** (the row is `<div className="flex items-center gap-4">` + a decorative marker + an uppercase micro-label), with purely cosmetic deltas. Quoted proof that the class string is copied verbatim:
```
HeroCompact.tsx:43  <p className="font-sans text-xs font-semibold tracking-[0.18em] text-ccjv-green uppercase">
HeroPractical.tsx:44 <p className="font-sans text-xs font-semibold tracking-[0.18em] text-ccjv-green uppercase">
```

## D3 — `Band` vs `Section`: two components doing the same job (STRUCTURAL)
```tsx
// Band.tsx:83-97
<section id={id} className={cn("relative", toneClass[tone], spaceClass[space], …)} {...rest}>
  <div className={cn(widthClass[width], innerClassName)}>{children}</div>
</section>

// Section.tsx:32-38
<section id={id} className={cn("py-24 max-md:py-16", toneClass[tone], className)} {...rest}>
  {contained ? <div className="container">{children}</div> : children}
</section>
```
Both are `<section>` + tone map + container wrapper + padding. **Overlap: structural** (identical element shape and identical class strings for the four shared tones); they diverge only in the width vocabulary (`Band` has `container|wide|full` with three different `max-w`, `Section` has a boolean `contained` that toggles between `.container` and none, and prints `max-w-[1200px]` verbatim inside `Band.widthClass.container`).

## D4 — Two full-bleed photographic heroes, identical image contract (STRUCTURAL)
```tsx
// HeroImmersive.tsx:34-52
<div className="relative h-[88svh] min-h-[32rem] w-full overflow-hidden bg-ccjv-black">
  <Image src={image} alt="" fill priority sizes="100vw" className="object-cover" />
  <div className={cn("absolute inset-0", align === "center" ? "bg-ccjv-black/62" : "bg-gradient-to-t from-ccjv-black/92 via-ccjv-black/40 to-ccjv-black/55")} aria-hidden="true" />
  <div className={cn("relative flex h-full", align === "center" ? "items-center" : "items-end")}>

// HeroPhoto.tsx:41-59
<div className={cn("relative w-full overflow-hidden bg-ccjv-black", height === "tall" ? "h-[82svh] min-h-[30rem]" : "h-[62svh] min-h-[24rem]")}>
  <Image src={image} alt="" fill priority sizes="100vw" className="object-cover" />
  <div className="absolute inset-0 bg-gradient-to-t from-ccjv-black/88 via-ccjv-black/35 to-ccjv-black/45" aria-hidden="true" />
  <div className="relative flex h-full items-end">
```
Both then render `<Breadcrumbs tone="dark" />`, a `container`, an overline and an `<h1>` over the image. **Overlap: structural** (full-bleed `<Image … alt="" fill priority sizes="100vw" className="object-cover">` + gradient veil + `items-end` container + dark breadcrumbs). They diverge at the **height prop name and axis** (`align: "bottom"|"center"` vs `height: "normal"|"tall"`, both defaulting to the bottom-aligned/normal case) and in whether the intro sits inside the frame (`HeroImmersive.text`) or below it in an offset column (`HeroPhoto.intro`).

## D5 — Three renderings of one event; two are reachable (SEMANTIC overlap, VISUAL divergence)
- `features/events/EventsSection.tsx:160-235` — month/day block + department overline + title + `{event.eventTime} · {event.location}` + arrow, inside a `<Link>` to `/vie-de-leglise/evenements/{slug}`.
- `features/events/EventRow.tsx:15-34` — `<time>` + title + department overline + `formatTime(event.eventTime) · {event.location ?? "Lubumbashi"}`.
- `features/events/FeaturedEvent.tsx:18-79` — image + `Prochain rendez-vous` + `<time>` + title + description + a `<dl>` of `Heure`/`Lieu`/`Département`.

Shared literals prove the overlap:
```
EventRow.tsx:32            {formatTime(event.eventTime)} · {event.location ?? "Lubumbashi"}
FeaturedEvent.tsx:67       <dd className="mt-1">{event.location ?? "Lubumbashi"}</dd>
EventsSection.tsx:208-209  {event.eventTime && `${event.eventTime} · `}
                           {event.location}
```
**Overlap is semantic (same data → editorial line) but not structural** — the three trees differ (rows vs 12-col grid vs media+text article), the date formatting differs (`formatLongDate` vs the local `getEventParts` using `toLocaleDateString("fr-FR")`), and only `EventsSection` links. `FeaturedEvent` has **0 consumers**, and the reachable pages that need a featured event (`app/vie-de-leglise/evenements/page.tsx`) re-implement it inline.

## D6 — The play-button affordance, duplicated 4× with 3 different sizes (STRUCTURAL)
```tsx
// MediaFeature.tsx:72-75 (h-16 w-16, border, no radius)
<span className="flex h-16 w-16 items-center justify-center border border-white/60 bg-ccjv-black/45 backdrop-blur-[2px] …">
  <svg viewBox="0 0 24 24" className="ml-1 h-6 w-6 fill-ccjv-cream"><path d="M8 5v14l11-7z" /></svg>
</span>

// TeachingFeature.tsx:51-58 (h-16 w-16 → md:h-20 md:w-20, rounded-full)
<span className="flex h-16 w-16 items-center justify-center rounded-full border border-ccjv-cream bg-black/45 text-ccjv-cream … md:h-20 md:w-20">
  <svg viewBox="0 0 24 24" className="h-7 w-7 translate-x-[2px]" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
</span>

// TeachingCard.tsx:26-33 (h-11 w-11, rounded-full)
<span className="flex h-11 w-11 items-center justify-center rounded-full border border-ccjv-cream bg-black/45 text-ccjv-cream group-hover:bg-ccjv-cream group-hover:text-ccjv-black">
  <svg viewBox="0 0 24 24" className="h-4 w-4 translate-x-[1px]" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
</span>

// app/publications/[slug]/page.tsx:299-302 (a 4th copy, outside components, matching MediaFeature)
<span className="flex h-16 w-16 items-center justify-center border border-white/60 bg-ccjv-black/45 transition-colors duration-[250ms] group-hover:border-ccjv-cream group-hover:bg-ccjv-black/65">
  <svg viewBox="0 0 24 24" className="ml-1 h-6 w-6 fill-ccjv-cream"><path d="M8 5v14l11-7z" /></svg>
</span>
```
**Overlap: structural** — the same `viewBox`, the same `<path d="M8 5v14l11-7z" />`, the same "absolutely-centred glyph inside a bordered translucent box" pattern, and the same `group-hover` colour swap; the divergences are the box radius (`border` vs `rounded-full`), the box size (`h-11`/`h-16`/`h-20`), the glyph size and the nudge (`ml-1`, `translate-x-[1px]`, `translate-x-[2px]`).

## D7 — The `VerseSection` variant bodies: the context + blockquote + figcaption block repeated 3× (STRUCTURAL, VERBATIM-ish)
The same three-node block, with only the type ramp and alignment differing:
```tsx
// VARIANTE 1 (isLeft) — VerseSection.tsx:203-230
{context && (<p className={cn("mb-4 font-sans text-xs font-semibold tracking-[0.2em] uppercase", onDeepTone ? "text-ccjv-cream" : "text-ccjv-green")}>{context}</p>)}
<blockquote className={cn("font-serif text-[clamp(1.25rem,0.9rem+1.6vw,2.15rem)] font-normal leading-[1.42] tracking-[-0.01em]", onDeepTone ? "text-white/95" : "text-ccjv-ink")}>{text}</blockquote>
<figcaption className={cn("mt-6 flex items-center font-sans text-sm md:text-base font-medium tracking-wide", onDeepTone ? "text-white/75" : "text-ccjv-ink-secondary")}><span>— {reference}</span></figcaption>

// VARIANTE 2 (isCenter) — VerseSection.tsx:242-269  → identical, except text-[clamp(1.35rem,1rem+1.8vw,2.35rem)] and figcaption "justify-center"
// VARIANTE 3 (isBoth)   — VerseSection.tsx:292-319  → identical, except text-[clamp(1.25rem,0.9rem+1.5vw,2.05rem)] and figcaption "justify-center"
```
Also duplicated inside the same file: the `<div className="mb-6">{renderQuoteIcon()}</div>` line appears **3 times** (lines 201, 240, 290), and the `onDeepTone ? "text-ccjv-cream" : "text-ccjv-green"` context ternary appears **3 times**.
**Overlap: structural.** The context/quote/reference trio is written out three times with ~90 % identical class strings; the *only* intended difference is the `clamp()` ramp (2 values for 3 variants — `isLeft` and `isBoth` use the same `0.9rem` middle term).

## D8 — `ParallaxImage` and `ParallaxContainer` duplicate the entire effect body (STRUCTURAL)
`ParallaxImage.tsx:43-107` and `ParallaxImage.tsx:147-209` contain the **same ~65-line `useEffect`**, character-for-character: same refs, same `prefers-reduced-motion` early return with `inner.style.transform = "none"`, same `isVisible`/`rafId` bookkeeping, same `getBoundingClientRect()` centre-offset math, same `translate3d(0, ${offset.toFixed(1)}px, 0)`, same `IntersectionObserver` with `{ rootMargin: "50px 0px 50px 0px" }`, same scroll/resize listeners, same cleanup, same `[speed]` dependency. Only the returned JSX differs, and both share:
```tsx
className="absolute -top-[10%] -bottom-[10%] left-0 right-0 w-full h-[120%] will-change-transform"
```
**Overlap: structural**, and `ParallaxContainer` has **0 consumers** — a dead half of a live file.

## D9 — Captioned photo frame duplicated 5× (STRUCTURAL)
```tsx
// PhotoDuo.tsx:47-51 and :69-73 — twice inside one file
<figcaption className="mt-3 border-t border-ccjv-line pt-3 font-sans text-[0.76rem] leading-relaxed text-ccjv-ink-secondary">
  {left.caption}   /   {right.caption}
</figcaption>

// PhotoGallery.tsx:52-55 (strip) — no leading-relaxed, text-[0.76rem], with border-t
<p className="mt-3 border-t border-ccjv-line pt-3 font-sans text-[0.76rem] text-ccjv-ink-secondary">{captions[index]}</p>

// PhotoGallery.tsx:85-88 (columns) — no border-t, text-[0.74rem], leading-relaxed
<figcaption className="mt-3 font-sans text-[0.74rem] leading-relaxed text-ccjv-ink-secondary">{captions[index]}</figcaption>

// FeatureImage.tsx:86-98 — border-t + a green hairline dash, text-[0.78rem]
<figcaption className={cn("mt-4 flex gap-3 border-t border-ccjv-line pt-3 font-sans text-[0.78rem] leading-relaxed text-ccjv-ink-secondary", …)}>
  <span className="mt-2 h-px w-5 shrink-0 bg-ccjv-green" aria-hidden="true" />
  <span>{caption}</span>
</figcaption>
```
And the frame itself:
```tsx
// PhotoDuo.tsx:33-37, :55-59 / PhotoGallery.tsx:43, :71-75, :108, :127-129 / FeatureImage.tsx:65-68
"relative overflow-hidden bg-ccjv-line"
```
**Overlap: structural** (identical frame class string, and caption = hairline rule + `mt-3/4` + `pt-3` + micro sans text), **visual divergence in three type sizes (`0.74`/`0.76`/`0.78rem`) and whether `leading-relaxed` and `border-t` are present.**

## D10 — `Prose`'s width system vs `max-w-*ch` literals everywhere (STRUCTURAL)
`Prose` owns a 3-key measure system (`widthClass`: `56ch`/`68ch`/`80ch`), while the same measures are re-typed inline in at least six components and one page:
```
Prose.tsx:24-26        narrow: "max-w-[56ch]", normal: "max-w-[68ch]", wide: "max-w-[80ch]"
HeroCompact.tsx:55     max-w-[52ch]
HeroPractical.tsx:51   max-w-[46ch]
KeyFacts.tsx:122       max-w-[52ch]      (list branch description)
CrossLinks.tsx:122     max-w-[52ch]      (list branch description)
PeopleGrid.tsx:126     max-w-[58ch]      (lead.bio)
PortraitPanel.tsx:88   max-w-[58ch]      (bio)
HeroPhoto.tsx:70        max-w-[20ch]      (h1)
HeroImmersive.tsx:69    max-w-[18ch]      (h1)
SectionHeading.tsx:27   max-w-[64ch]
globals.css:222-228     .measure (68ch), .measure-narrow (56ch)  ← defined, never used
```
**Overlap: structural** — the same `max-w-[Nch]` measure pattern, with **10 distinct values across 10 files** and one unused global utility class that duplicates two of `Prose`'s keys.

## D11 — `scripture` rendering duplicated between `HeroManifesto`, `PageHeader` and `VerseSection` (STRUCTURAL)
```tsx
// HeroManifesto.tsx:99-114
<blockquote className={cn("font-serif text-[clamp(1.4rem,0.7rem+2vw,2.35rem)] leading-[1.32] italic", isDark ? "text-white/94" : "text-ccjv-ink")}>
  «&nbsp;{scripture.text}&nbsp;»
</blockquote>
<figcaption className={cn("mt-6 font-sans text-[0.7rem] font-semibold tracking-[0.2em] uppercase", accent)}>{scripture.reference}</figcaption>

// PageHeader.tsx:88-110
<blockquote className={cn("mt-9 max-w-[54ch] border-l-2 pl-5", isDark ? "border-ccjv-cream/45" : "border-ccjv-green/45")}>
  <p className={cn("font-serif text-[1.05rem] leading-[1.6] italic", isDark ? "text-white/85" : "text-ccjv-ink")}>«&nbsp;{verse.text}&nbsp;»</p>
  <p className={cn("mt-2 font-sans text-xs font-semibold tracking-[0.18em] uppercase", isDark ? "text-ccjv-cream" : "text-ccjv-green")}>{verse.reference}</p>
</blockquote>

// VerseSection.tsx:214-230 (and the two sibling variants) — `— {reference}` with no guillemets
<blockquote className={cn("font-serif text-[clamp(1.25rem,0.9rem+1.6vw,2.15rem)] font-normal leading-[1.42] tracking-[-0.01em]", onDeepTone ? "text-white/95" : "text-ccjv-ink")}>{text}</blockquote>
<figcaption className={cn("mt-6 flex items-center font-sans text-sm md:text-base font-medium tracking-wide", …)}><span>— {reference}</span></figcaption>
```
**Overlap: structural** (serif italic/roman verse + sans uppercase tracking-wide reference, with an `isDark`/`onDeepTone` colour ternary in all three), but the **three components hardcode three different reference conventions**: `«…»` + uppercase sans (`HeroManifesto`), `«…»` + uppercase sans in a bordered `<blockquote>` (`PageHeader`), and `— reference` with no quotes (`VerseSection`). `PageHeader`'s blockquote can never render, because its only consumer (`LegalPage`) never passes `verse`.

## D12 — `PageHeader` and `Hero*` re-implement the same "arch/baie" device (STRUCTURAL)
```tsx
// PageHeader.tsx:118-124 — the "baie"
<span className={cn("absolute inset-0 rounded-t-full border", isDark ? "border-white/20" : "border-ccjv-line")} aria-hidden="true" />
<span className="absolute inset-[7%] overflow-hidden rounded-t-full bg-ccjv-black" aria-hidden="true">

// BreathingPhoto.tsx:48-53 — the optional arch
{hasArch && (<span className="pointer-events-none absolute inset-x-8 top-10 bottom-10 rounded-t-full border border-ccjv-cream/25 max-md:inset-4" aria-hidden="true" />)}

// FeaturedEvent-era home Hero — features/pages/Hero.tsx:40-43
<span className="pointer-events-none absolute inset-x-8 top-8 bottom-8 rounded-t-full border border-ccjv-cream/35 max-[900px]:hidden" aria-hidden="true" />

// FeatureImage.tsx:33 — the same arch as a photo ratio
arch: "aspect-3/4 w-full rounded-t-full",
```
**Overlap: structural** (`rounded-t-full` + `border` + absolute inset overlay, "an architectural arch evoking church bays"), implemented four times with four different insets (`inset-0`/`inset-[7%]`, `inset-x-8 top-10 bottom-10`, `inset-x-8 top-8 bottom-8`) and two different border tokens. `BreathingPhoto`'s copy is dead (`hasArch` is never enabled).

## D13 — `Button`'s variant styles re-typed by hand outside `Button` (STRUCTURAL)
```tsx
// ui/Button.tsx:30-31 — the outline variant
outline: "border-ccjv-ink bg-transparent text-ccjv-ink hover:border-ccjv-green hover:text-ccjv-green",
// ui/Button.tsx:39 — the md size
md: "min-h-[44px] px-6",

// app/vie-de-leglise/evenements/[slug]/page.tsx:196 — the same recipe, hand-written
className="inline-flex min-h-11 items-center border border-ccjv-ink px-6 font-sans text-[0.9375rem] font-medium transition-colors duration-[250ms] hover:border-ccjv-green hover:text-ccjv-green"
```
```tsx
// components/layout/Footer.tsx:154 — a hand-rolled primary-ish button
className="inline-flex items-center justify-center bg-white px-5 py-2.5 font-sans text-xs font-bold tracking-[0.14em] text-black uppercase transition-all duration-200 hover:bg-ccjv-cream"
// components/layout/Footer.tsx:160 — a hand-rolled inverse button
className="inline-flex items-center justify-center border border-white bg-black px-5 py-2.5 font-sans text-xs font-bold tracking-[0.14em] text-white uppercase transition-all duration-200 hover:bg-white/10"
```
```tsx
// components/forms/PrayerRequestForm.tsx:200 — a 4th hand-rolled button, with an UNDEFINED token
className="inline-flex w-full h-12 items-center justify-center border border-ccjv-green bg-ccjv-green px-8 font-sans text-xs font-semibold tracking-[0.16em] text-white uppercase transition-colors hover:bg-ccjv-green-dark disabled:opacity-50 disabled:cursor-not-allowed"
```
**Overlap: structural** — `min-h-*`/`h-12` + `px-*` + `inline-flex items-center justify-center` + a `font-sans font-medium|semibold` + a `hover:` colour swap, plus `rounded-none` semantics, reproduced four times outside the component whose whole purpose is to own it. `Footer` and `PrayerRequestForm` also use **completely different type scales** (`text-xs`, `tracking-[0.14em]`/`[0.16em]`, `font-bold`) from `Button`'s `text-[0.9375rem] font-medium tracking-[0.01em]`.

## D14 — Two parallel nav trees inside `FullscreenMenu` (STRUCTURAL)
`FullscreenMenu.tsx:162-245` (desktop pillars) and `FullscreenMenu.tsx:373-419` (mobile pillars) are two hand-written trees over the **same `primaryNav`**, with the same `item.children && item.children.length > 0` test, the same `hasChildren ? <button> : <Link href={item.href ?? "/"}>` ternary, the same `String(index + 1).padStart(2, "0")` numbering and the same `key={item.href ?? item.label}`:
```tsx
// desktop, :176-241
{hasChildren ? (
  <button type="button" onClick={() => setActiveDesktopPillar((prev) => prev?.label === item.label ? null : item)} className={cn("group flex w-full items-center justify-between text-left transition-all duration-200 py-1.5 px-3 -mx-3", …)}>
    <div className="flex items-baseline gap-4">
      <span className={cn("font-sans text-[0.75rem] font-semibold tracking-[0.14em] transition-colors", …)} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
      <span className={cn("font-serif text-[clamp(1.45rem,1.1rem+1.2vw,2.1rem)] leading-tight transition-colors", …)}>{item.label}</span>
    </div>
    <span … aria-hidden="true">→</span>
  </button>
) : (
  <Link href={item.href ?? "/"} onClick={onClose} className="group flex w-full items-center justify-between text-left py-1.5 px-3 -mx-3 …">
    … same number span (tracking-[0.14em]) + same serif label span (same clamp) …
  </Link>
)}

// mobile, :376-416 — the same ternary with tracking-[0.12em] and clamp(1.35rem,4.8vw,1.8rem)
{item.children && item.children.length > 0 ? (
  <button type="button" onClick={() => handleOpenMobileSubmenu(item)} className="group flex w-full items-center justify-between text-left"> …
) : (
  <Link href={item.href ?? "/"} onClick={onClose} className="group flex items-baseline gap-3 text-left"> …
)}
```
Likewise the submenu child list is written twice (`activeDesktopPillar.children.map` at :270 as cards, `displayedMobilePillar.children.map` at :476 as rows), both with `String(cIdx + 1).padStart(2, "0")`, `key={child.href}`, `{child.description && <p …>}` and `<h4>`/`<span>` labels.
**Overlap: structural**, and the duplication is byte-heavy: it is the main reason this single file is **25 244 bytes — 20 % of the entire component tree** — and the two trees are not variants (`md:flex` / `md:hidden`) but parallel implementations that must be kept in sync by hand.

## D15 — `Band`'s `widthClass.container` duplicates `.container` (STRUCTURAL)
```ts
// Band.tsx:49
container: "mx-auto w-full max-w-[1200px] px-[clamp(16px,4vw,48px)]",
```
```css
/* globals.css:141-146 */
.container { margin-inline: auto; width: 100%; max-width: 1200px; padding-inline: clamp(16px, 4vw, 48px); }
```
Identical declaration, expressed twice (once as Tailwind utilities, once as CSS). `Band.widthClass.wide` (`max-w-[1480px] px-[clamp(16px,3vw,40px)]`) has no `.container` counterpart. Also, `clamp(16px,4vw,48px)` is re-typed inline **6 times** in components.
**Overlap: structural.**

## D16 — `ContentPending` as the only empty-state vocabulary in components, vs `EmptyState` in pages (SEMANTIC)
```
ContentPending.tsx:50   TODO — {what} à fournir
ContentPending.tsx:36   — {what} à fournir.
EmptyState (6 pages)    title + description, no TODO marker
```
`PeopleGrid` returns `ContentPending` when `people.length === 0`; `EmptyState` is used by 6 pages for the same "nothing here yet" moment. **Overlap: semantic only** — different tone (a visible editorial TODO vs a neutral empty box), different structure, and neither is used by the other. Worth noting because `PeopleGrid`'s only component-level dependency is that fallback, and `PeopleGrid` itself has 0 consumers.

---

# HARDCODED CONTENT INVENTORY

## A. Literal image paths found inside `frontend/src/components/**` and `frontend/src/features/**`

| Literal path | Component | Line(s) | Context | # distinct components referencing it |
|---|---|---|---|---|
| `/media/ccjv-30.jpeg` | `components/layout/FullscreenMenu.tsx` | 23 | `pillarVisuals["Vie de l'Église"].image` fallback after `images.communaute` | **2** |
| `/media/ccjv-30.jpeg` | `components/shared/VerseSection.tsx` | 108, 114 | `displayPhotos[0]` default and the `leftImg` fallback chain | |
| `/media/ccjv-35.jpeg` | `components/layout/FullscreenMenu.tsx` | 27, 31 | `pillarVisuals["Notre communauté"]` and `pillarVisuals["Communauté"]` fallbacks | **2** |
| `/media/ccjv-35.jpeg` | `components/shared/VerseSection.tsx` | 109 | `displayPhotos[1]` default | |
| `/media/ccjv-27.jpeg` | `components/layout/FullscreenMenu.tsx` | 35 | `pillarVisuals["Organisation"]` fallback | **1** |
| `/media/ccjv-11.jpeg` | `components/layout/FullscreenMenu.tsx` | 39, 43 | `pillarVisuals["Ressources"]` and `pillarVisuals["Publications & Médias"]` fallbacks | **1** |
| `/media/ccjv-09.jpeg` | `components/shared/VerseSection.tsx` | 110, 115 | `displayPhotos[2]` default and the `rightImg` fallback chain | **1** |
| `/media/ccjv-08.jpeg` | `components/shared/VerseSection.tsx` | 111 | `displayPhotos[3]` default | **1** |
| `/logo_2.png` | `components/layout/Header.tsx` | 102 | the header logo `<Image src>` | **2** |
| `/logo_2.png` | `components/layout/Footer.tsx` | 93 | the footer logo `<Image src>` | |
| (template) `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg` and `…/hqdefault.jpg` | `components/shared/YouTubeThumb.tsx` | 29 | the only external image host in the component tree | **1** |

**Totals**: **7 distinct literal local media paths** — 6 distinct `/media/ccjv-*.jpeg` files (`ccjv-30`, `ccjv-35`, `ccjv-27`, `ccjv-11`, `ccjv-09`, `ccjv-08`) plus `/logo_2.png` (14 literal occurrences) — spread over **4 components** (`FullscreenMenu`, `VerseSection`, `Header`, `Footer`), plus **1 external host template** in `YouTubeThumb`. Every `/media/ccjv-*.jpeg` literal sits behind a `||` fallback or a `? :` in an array literal, so **none of them renders while `@/data/mock/images` exports a truthy value** — they are all hidden defaults.

**Adjacent (outside the stated scope, recorded because it is the same pattern)**: `app/vie-de-leglise/evenements/[slug]/page.tsx:92` — `image={event.bannerImage ?? event.imageUrl ?? "/media/ccjv-08.jpeg"}` — the only literal image fallback in `app/**`.

**Other hardcoded media/data content (not images), for completeness:**

| Item | Component | Line(s) | # components |
|---|---|---|---|
| `pillarVisuals` record (6 keys keyed on **French nav labels**, each with `image` + `tag`) | `FullscreenMenu` | 21-46 | 1 |
| `darkHeroRoutes` array (9 literal routes) | `Header` | 12-22 | 1 |
| Hero-detection class substrings `bg-ccjv-black` / `bg-black` / `text-white` | `Header` | 64-66 | 1 |
| Hero-detection selector `"main > section:first-of-type, section:first-of-type, [data-hero-dark]"` | `Header` | 58 | 1 |
| `FOCUSABLE` selector string | `FullscreenMenu` | 12-13 | 1 |
| 3 inline brand SVGs (TikTok / YouTube / Instagram) with full `d="…"` path data | `Footer` | 118-147 | 1 (same 3 links also come from `socials` in `FullscreenMenu:523-533`) |
| Quote-glyph SVG (`viewBox="0 0 24 24"`, 1 path of ~560 chars) | `VerseSection` | 130-138 | 1 |
| Play-glyph SVG (`M8 5v14l11-7z`) | `MediaFeature` 73-75, `TeachingCard` 27-33, `TeachingFeature` 52-58, and `app/publications/[slug]:300-302` | — | 3 components + 1 page |
| Arrow SVG (`M5 12h14` + `M12 5l7 7-7 7`) | `EventsSection` | 222-234 | 1 (compare the `→` character used in `FullscreenMenu`, `CrossLinks`, `MediaFeature`, `TeachingCard`, `TeachingFeature`) |
| Cross SVGs (5 hand-authored geometries) | `CrossMark` | 20-92 | 1 |
| Open-book SVG (6 paths) | `OpenBookMark` | 21-40 | 1 |
| Camera-less play affordance border/backdrop strings | `MediaFeature`, `TeachingCard`, `TeachingFeature` | — | 3 |

## B. Literal French strings inside components (grouped by component)

Because the requested fiche already quotes them per component above, this is the consolidated index of the ones that are **rendered unconditionally** (i.e. not behind a prop) — the true hardcoding risk set:

| French literal | Component:line | Gated by a prop? |
|---|---|---|
| `Menu` | `FullscreenMenu:159, 371` | no |
| `Fermer` / `✕` | `FullscreenMenu:556, 559` | no (label hidden on mobile via `max-sm:hidden`) |
| `← Retour au menu` | `FullscreenMenu:443-445` | no (inside the mobile submenu panel) |
| `Découvrir la vie de cette section à Lubumbashi` | `FullscreenMenu:317` | only by `pillarVisuals[label]` |
| `Centre Chrétien Jésus ma Vie — Quartier Hewa Bora` | `FullscreenMenu:320` | only by `pillarVisuals[label]` |
| `Centre Chrétien Jésus ma Vie` (welcome panel h3) | `FullscreenMenu:334` | no (the initial desktop state) |
| `Une communauté vivante réunie à Lubumbashi pour adorer Dieu, transmettre la foi et servir dans l'amour fraternel.` | `FullscreenMenu:337` | no |
| `WhatsApp` | `FullscreenMenu:540` | no |
| `Menu` | `Header:124` | no |
| `Accueil` (breadcrumb crumb) | `Breadcrumbs:42` | no |
| `Témoignage` (kicker) | `BreathingPhoto:60` | no |
| `aria-label="Témoignage photographique de la communauté"` | `BreathingPhoto:31` | no |
| `CCJV` (baie marker) | `PageHeader:158` | no (always inside the baie) |
| `— {reference}` (em-dash before every scripture reference) | `VerseSection:229, 268, 318` | no |
| `aria-label="Parole biblique et méditation"` | `VerseSection:152` | no |
| `Traduction Louis Segond 1910.` | `HeroManifesto:117` | no |
| `Dernier enseignement` | `MediaFeature:117` | no (inside the `hero` branch only) |
| `Regarder sur YouTube` | `MediaFeature:136` | no (the hero CTA) |
| `Découvrir →` | `CrossLinks:95` | only by `variant="doors"` (0 consumers → dead) |
| `TODO` / `à fournir` | `ContentPending:34, 36, 50` | only by `variant` (both branches render one) |
| `Liste des responsables` / `Les noms, fonctions et portraits des responsables doivent être fournis par l'église, avec l'accord des personnes concernées.` | `PeopleGrid:37-38` | only by `people.length === 0` |
| `Votre demande a bien été reçue.` | `PrayerRequestForm:49` | only by `submitted` |
| `Merci de nous accorder votre confiance. Notre équipe d'intercession la portera fidèlement dans la prière dès aujourd'hui.` | `PrayerRequestForm:53-54` | only by `submitted` |
| `« Que la paix de Dieu, qui surpasse toute intelligence, garde votre cœur et vos pensées. »` | `PrayerRequestForm:58-59` | only by `submitted` |
| `Déposer une autre demande` / `Confirmer sur WhatsApp →` | `PrayerRequestForm:68, 76` | only by `submitted` |
| `Bonjour Centre Chrétien Jésus ma Vie,` + `Je souhaite vous confier une intention de prière :` + `De la part de : ` + `Demande : ` + `Je préfère vous écrire directement ici.` | `PrayerRequestForm:36-38` | no (message template) |
| `Votre intention de prière *`, `Quelques mots suffisent. …`, `Écrivez votre demande ici...`, `Votre prénom ou nom (facultatif)`, `Laissez vide pour rester anonyme`, `WhatsApp ou téléphone (facultatif)`, `Pour un message d'encouragement`, `Confidentialité de votre demande`, `Confidentiel :`, `Partagé strictement avec l'équipe pastorale d'intercession.`, `Porter en assemblée :`, `Mentionnée lors des temps de prière communautaires (sans nom de famille).`, `Engagement CCJV :`, `Votre demande ne sera jamais publiée sur Internet ni sur les réseaux sociaux. Le respect de votre vie privée et de votre dignité est absolu.`, `Transmission en cours...`, `Transmettre ma demande de prière` | `PrayerRequestForm:95-202` | no |
| `Ce qui se passe bientôt` (default title) | `EventsSection:66` | yes (`title` prop) |
| `Rejoignez-nous et grandissons ensemble ! Découvrez nos prochains rassemblements, cultes, retraites et temps forts.` (default description) | `EventsSection:67` | yes (`description`) |
| `VOIR TOUT L'AGENDA` (default CTA) | `EventsSection:68` | yes (`ctaLabel`) |
| `ÉVÉNEMENT` (category fallback) | `EventsSection:189` | no (when `department` is falsy) |
| `EVT` / `•` (date fallback) | `EventsSection:55` | no (the `catch` branch) |
| `fr-FR` locale | `EventsSection:49, 52` | no |
| `Lubumbashi` (location fallback) | `EventRow:32`, `FeaturedEvent:67` | no |
| `Prochain rendez-vous` | `FeaturedEvent:39` | no (dead component) |
| `Heure` / `Lieu` / `Département` | `FeaturedEvent:59, 65, 72` | no (dead component) |
| `Bienvenue dans la maison.` | `features/pages/Hero:49` | no |
| `Le Centre Chrétien Jésus ma Vie est une famille spirituelle à Lubumbashi. On y vient comme on est : pour écouter la Parole, louer Dieu et marcher ensemble.` | `features/pages/Hero:55-57` | no |
| `Planifier ma visite` / `Voir les horaires` | `features/pages/Hero:66, 69` | no |
| `Bienvenue au Centre Chrétien Jésus ma Vie` (aria-label) | `features/pages/Hero:16` | no |
| `Regarder sur YouTube →` | `TeachingCard:53` | no |
| `Regarder sur YouTube` | `TeachingFeature:66` | no |
| `Regarder la vidéo sur YouTube` | `TeachingFeature:92` | no |
| `Que cherchez-vous ?` | `SearchClient:45` | no |
| `Événements, départements, enseignements…` (placeholder) | `SearchClient:52` | no |
| `Saisissez au moins deux caractères.` + `contenus sont référencés sur le site.` | `SearchClient:58-59` | no |
| `Aucun résultat pour «&nbsp;{query}&nbsp;». Essayez un autre mot, ou parcourez nos rubriques depuis le menu.` | `SearchClient:91-92` | no |
| `L'Église` / `Vivre ensemble` / `Nourrir sa foi` / `Rester en lien` (footer headings) | `Footer:18, 62, 169, 213` | no |
| `Accueil`, `Qui sommes-nous`, `Organisation`, `· Adultes`, `· Ecodim (Enfants)`, `· Chorale`, `Les visages du service` | `Footer:24-55` | no |
| `Nos événements`, `Groupe de maison`, `Faire un don` | `Footer:68-79` | no |
| `Enseignements`, `Médiathèque`, `Actualités & blog`, `Guides d'étude & Ressources`, `Prière & Intercession`, `Témoignages`, `FAQ` | `Footer:175-206` | no |
| `Planifier une visite`, `Nous localiser`, `Demander une prière`, `Signaler un problème`, `Se connecter`, `Recherche` | `Footer:219-245` | no |
| `NEWSLETTER` / `NOUS ÉCRIRE` | `Footer:156, 162` | no |
| `© {year} CCJV Tous Droits Réservés.` | `Footer:269` | no |
| `Mentions légales`, `Confidentialité`, `Conditions`, `Accessibilité` | `Footer:260, 263, 275, 278` | no |
| `aria-label="TikTok CCJV"` / `"YouTube CCJV"` / `"Instagram CCJV"` | `Footer:115, 128, 141` | no |

## C. Literal hrefs inside components

| href | Component(s) | Lines |
|---|---|---|
| `/` | `Breadcrumbs:36`, `Header:96`, `Footer:23, 87`, `FullscreenMenu:225, 402` (`item.href ?? "/"` ×2) | 7 sites |
| `/qui-sommes-nous` | `Footer:28, 238` | 2 |
| `/organisation`, `/organisation#adultes`, `/organisation#enfants-ecodim`, `/organisation#chorale`, `/organisation#responsables` | `Footer:33, 38, 43, 48, 53` | 5 |
| `/vie-de-leglise/evenements` | `Footer:67`, `EventsSection:69` (`ctaHref` default) | 2 |
| `/vie-de-leglise/evenements/{slug}` (template) | `EventsSection:153` | 1 |
| `/communaute/groupes-de-maison` | `Footer:72` | 1 |
| `/vie-de-leglise/faire-un-don` | `Footer:77` | 1 |
| `/publications/actualites` | `Footer:153, 184` | 2 |
| `/vie-de-leglise/ou-nous-trouver` | `Footer:159, 223, 233`, `features/pages/Hero:64, 68` | 5 |
| `/publications/enseignements` | `Footer:174` | 1 |
| `/publications/ressources` | `Footer:179, 189, 243` | 3 |
| `/communaute/priere-et-intercession` | `Footer:194, 228` | 2 |
| `/communaute/temoignages` | `Footer:199` | 1 |
| `/vie-de-leglise/faq` | `Footer:204` | 1 |
| `/communaute/parcours-nouveau` | `Footer:218` | 1 |
| `/mentions-legales` | `Footer:259` | 1 |
| `/politique-de-confidentialite` | `Footer:262` | 1 |
| `/conditions-generales` | `Footer:274` | 1 |
| `/accessibilite` | `Footer:277` | 1 |
| `https://www.tiktok.com/@ecodim_ccjv` | `Footer:112` | 1 |
| `https://youtube.com` | `Footer:125` | 1 |
| `https://www.instagram.com/ecodim_ccjv/` | `Footer:138` | 1 |
| `https://i.ytimg.com/vi/{id}/{maxresdefault\|hqdefault}.jpg` | `YouTubeThumb:29` | 1 |

**Total: 41 literal href sites across 8 components**, of which **34 are in `Footer.tsx` alone**. Note `FullscreenMenu:225` and `:402` both hardcode a `"/"` fallback for a `NavItem` with no `href` — which `lib/nav.ts` explicitly forbids.

---

# DESIGN TOKEN INVENTORY

## 1. CSS custom properties actually defined (`src/app/globals.css`)

**Colour tokens (9)** — `@theme` block, lines 10-18:
```
--color-ccjv-green          #1e7a1e
--color-ccjv-green-strong   #176317
--color-ccjv-green-soft     #eaf3ea
--color-ccjv-cream          #ede4c8
--color-ccjv-black          #121212
--color-ccjv-offwhite       #fafaf7
--color-ccjv-ink            #1a1a1a
--color-ccjv-ink-secondary  #5e5d59
--color-ccjv-line           #e5e2d9
```
**Motion tokens (2)** — `@theme`, lines 21-22: `--ease-ccjv: cubic-bezier(0.16, 1, 0.3, 1)`, `--ease-ccjv-in: cubic-bezier(0.65, 0, 0.35, 1)`
**Font tokens (2)** — `@theme inline`, lines 29-30: `--font-serif`, `--font-sans`
**Total 13.** No spacing, radius, shadow or z-index tokens exist.

**Referenced but UNDEFINED**: `ccjv-green-dark` — used as `hover:bg-ccjv-green-dark` in `components/forms/PrayerRequestForm.tsx` (2 sites) and in `app/communaute/groupes-de-maison`, `app/communaute/parcours-nouveau`, `app/communaute/priere-et-intercession`. Those hover states resolve to nothing.
**Defined but UNUSED**: `--ease-ccjv-in` (0 references in components; only `--ease-ccjv` is used, 7 times).

## 2. Breakpoint/magic-number tokens repeated as arbitrary values

| Literal | Where | Count in components |
|---|---|---|
| `72px` (header offset) | `HeroCompact:36`, `HeroManifesto:46`, `HeroPractical:39` | 3 |
| `68px` (header offset — the odd one out) | `PageHeader:47` | 1 |
| `900px` | `features/pages/Hero.tsx` (`min-[900px]:`/`max-[900px]:`) | 13 |
| `1200px` | `Band:49` (`widthClass.container`), `FeatureImage:40, 90` | 3 |
| `1480px` | `Band:50` (`widthClass.wide`) | 1 |
| `1380px` | `Footer:10, 256` | 2 |
| `1320px` | `FullscreenMenu:151, 521` | 2 |
| `clamp(16px,4vw,48px)` | `.container` in CSS **and** re-typed inline 6× | 6 |
| `52ch` / `46ch` / `56ch` / `58ch` / `50ch` / `54ch` / `62ch` / `68ch` / `70ch` / `80ch` / `64ch` / `44rem` | across 10 components | 20+ |
| `44px` (`min-h-[44px]`, the a11y target) | `ui/Button.tsx:39`, `FullscreenMenu:551` | 2 |
| `min-h-11` (44px via the default scale) | `Header:97, 118`, `app/vie-de-leglise/evenements/[slug]:196, 201` | 4 |
| `24px` (`h-24 w-24 svh` hero `88svh`/`82svh`/`76svh`/`75svh`/`72svh`/`64svh`/`62svh`) | `HeroImmersive`, `HeroPhoto`, `BreathingPhoto`, `CommunityFaces`, `PhotoGallery`, `FeatureImage` | 7 distinct svh values |

## 3. Repeated Tailwind-ish token classes (counts over the 48 `.tsx` files in `components/`)

**Fonts**
| Token | Count | Notes |
|---|---|---|
| `font-sans` | 122 | 33 of 48 files |
| `font-serif` | 40 | 18 of 48 files |

**Colours**
| Token | Count |
|---|---|
| `text-white` (bare) | 81 |
| `text-white/<opacity>` | 58 |
| `text-ccjv-cream` | 55 |
| `text-ccjv-ink-secondary` | 46 |
| `text-ccjv-green` | 43 |
| `text-ccjv-ink` | 38 |
| `border-ccjv-line` | 33 |
| `border-white/<opacity>` | 21 |
| `bg-ccjv-line` | 20 |
| `bg-ccjv-offwhite` | 18 |
| `bg-ccjv-black` | 16 |
| `hover:text-ccjv-green` | 11 |
| `bg-ccjv-green` | 9 |
| `bg-ccjv-green-soft` | 5 |
| `bg-ccjv-cream` | 5 |
| `group-hover:text-ccjv-green` | 3 |
| `ccjv-green-strong` | 3 (all in `ui/Button.tsx`) |
| `fill-ccjv-cream` | 1 |

**Typography scale (arbitrary values standing in for a type scale)**
| Token | Count |
|---|---|
| `tracking-[0.2em]` | 20 |
| `tracking-[0.18em]` | 10 |
| `tracking-[0.14em]` | 9 |
| `text-[0.72rem]` | 9 |
| `tracking-[0.16em]` | 7 |
| `leading-snug` | 9 |
| `leading-relaxed` | 18 |
| `text-[0.7rem]`, `text-[0.68rem]`, `text-[0.74rem]`, `text-[0.76rem]`, `text-[0.78rem]`, `text-[0.8rem]`, `text-[0.82rem]`, `text-[0.85rem]`, `text-[0.88rem]`, `text-[0.9rem]`, `text-[0.92rem]`, `text-[0.9375rem]`, `text-[0.95rem]`, `text-[0.98rem]`, `text-[1.02rem]`, `text-[1.05rem]`, `text-[1.0625rem]`, `text-[0.9875rem]`, `text-[1.15rem]`, `text-[1.2rem]`, `text-[1.25rem]`, `text-[1.3rem]`, `text-[1.35rem]`, `text-[1.4rem]`, `text-[1.8rem]`, `text-[1.85rem]`, `text-[1.9rem]`, `text-[2.25rem]` | ~30 distinct arbitrary `rem` sizes across the components — **there is no type scale token; every heading size is a bespoke `text-[…]` or a bespoke `clamp()`** |
| `text-[clamp(…)]` | 2 distinct recipes: `clamp(1.6rem,1rem+1.6vw,2.35rem)` (5 files) and `clamp(1.5rem,1rem+1.6vw,2.25rem)` (2 files) + ~14 further one-off clamps |

**Spacing / radius / motion**
| Token | Count |
|---|---|
| `container` | 34 |
| `rounded-none` | 8 |
| `duration-[250ms]` | 7 |
| `ease-ccjv` | 7 |
| `duration-[150ms]` | 4 |
| `duration-[550ms]` | 2 |
| `duration-[400ms]` | 2 |
| `duration-200` / `duration-300` (Tailwind scale, mixed with the arbitrary ms above) | `FullscreenMenu`, `Footer`, `EventsSection`, `Header` |
| `rounded-full` | 4 (`ui/Badge` base, `TeachingCard` and `TeachingFeature` play buttons, `CrossMark`'s spinner-less siblings) — **the only places the codebase departs from `rounded-none`** |
| `rounded-t-full` | 4 (`PageHeader` ×2, `BreathingPhoto`, `features/pages/Hero`, `FeatureImage variant="arch"`) — the "arch/baie" device |
| `shadow-sm` / `shadow-xs` / `shadow-2xl` | `VerseSection:284, 328` (`shadow-sm`), `Header:88` and `app/**` (`shadow-xs`), `DepartmentModal:103` (`shadow-2xl`) — the design system declares "hairline, jamais une ombre" while four shadows are in use |

**Aspect ratios**
`aspect-4/5` (5), `aspect-3/4` (5), `aspect-4/3` (4), `aspect-16/9` (3), `aspect-square` (2), `aspect-video` (3), `aspect-[16/11]` (1, `FeaturedEvent`), `aspect-[3/4]` (2, bracket form alongside the slash form), `aspect-16/10` (1, `PhotoGallery` mosaic).

**Opacity conventions**
Colour opacity is expressed as Tailwind's slash syntax almost everywhere (`text-white/75`, `border-white/12`, `bg-black/45`), **except** for the four inline hex literals in `globals.css`'s scrollbar rules (`rgba(30, 122, 30, 0.45)`, `rgba(26, 26, 26, 0.22)`, `rgba(237, 228, 200, 0.35)`, `rgba(237, 228, 200, 0.3)`) and the SVG `opacity` attributes in `OpenBookMark` (`opacity="0.6"` ×4) and `CrossMark` (`opacity-5` via class).

