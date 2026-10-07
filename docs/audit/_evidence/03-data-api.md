# 03 — Data layer contract: mocks, types, API client

Scope: `C:\Users\HP\desktop\PROJETS 2026\CCJV-CHURCH\frontend`
Files read completely: `src/data/mock/{community,departments,events,images,leaders,publications,site,testimonies,verses}.ts`, `src/types/index.ts`, `src/lib/api/{client,endpoints,index,types}.ts`, `src/lib/{utils,seo,nav}.ts`, `.env.example`, `.env.local`, `package.json`, `next.config.mjs`.
Method: literal transcription + `grep` over the whole `frontend/src` tree for every import and symbol usage.
Read-only extraction. No source file was modified; this file is the only artifact written.

Environment facts used below:
- Next 15.5.26, React 19.1.0, TypeScript ^5.7.0, no data-fetching library (no React Query / SWR / axios / zod) in `package.json`.
- `frontend/public/media/` contains **41** files, `ccjv-01.jpeg` … `ccjv-41.jpeg`.

---

# DELIVERABLE A — MOCK ENTITY EXTRACTION

## A.1 `src/data/mock/community.ts` (100 lines)

### ENTITY: `communityFaces` (community.ts:15) — `CommunityFace[]`, 5 records
Local exported interface `CommunityFace` (community.ts:8): `id, photo, name, caption` — **all required**.

| field | present | note |
|---|---|---|
| `id` | 5/5 | string |
| `photo` | 5/5 | local `/media/*.jpeg` path |
| `name` | 5/5 | first name only |
| `caption` | 5/5 | one French sentence |

- **Enum-like fields:** none. No `category`, `type`, `status`, `kind`, `role`, `order`.
- **`id` format examples (literals):** `"face-01"`, `"face-02"`, `"face-03"`, `"face-04"`, `"face-05"` → pattern `face-NN` (2-digit).
- **Image field literals (all 5):** `/media/ccjv-01.jpeg`, `/media/ccjv-03.jpeg`, `/media/ccjv-06.jpeg`, `/media/ccjv-18.jpeg`, `/media/ccjv-34.jpeg`.
- **Nested object/array fields:** none.
- **Cross-references:** none. `communityFaces` is a flat, unreferenced list.
- **`status` / `published` / `draft`:** **NO such field exists.**
- **Full literal record (record 1):**
```ts
{
  id: "face-01",
  photo: "/media/ccjv-01.jpeg",
  name: "Grâce",
  caption: "Elle accueille les nouveaux venus le dimanche matin.",
}
```

### ENTITY: `houseGroups` (community.ts:62) — `HouseGroup[]`, 4 records
Local exported interface `HouseGroup` (community.ts:52): `id, name, quarter, schedule, host, description` required; `image?: string` **optional**.

| field | present | note |
|---|---|---|
| `id` | 4/4 | kebab-case slug id |
| `name` | 4/4 | |
| `quarter` | 4/4 | free-text quarter/commune name |
| `schedule` | 4/4 | human French string, incl. `·` separator |
| `host` | 4/4 | always `"Chez l'habitant (Quartier …)"` |
| `description` | 4/4 | |
| `image` | **4/4** | declared optional, always populated |

- **Enum-like fields:** none. `quarter` is free text, not a controlled vocabulary (values differ structurally: `"Quartier Hewa Bora"`, `"Quartier Bel-Air"`, `"Quartier Golf"`, `"Commune de la Kenya"`).
- **`id` literals (all 4):** `"groupe-hewa-bora"`, `"groupe-bel-air"`, `"groupe-golf"`, `"groupe-kenya"`.
- **Image literals (all 4):** `/media/ccjv-35.jpeg`, `/media/ccjv-30.jpeg`, `/media/ccjv-28.jpeg`, `/media/ccjv-27.jpeg`.
- **Cross-references:** **none by id/slug.** No `departmentId`; the link to a `Department` is implicit only through the free-text `quarter`/`name`. No page resolves a house group from a department.
- **Full literal record (record 1):**
```ts
{
  id: "groupe-hewa-bora",
  name: "Groupe Hewa Bora & Centre",
  quarter: "Quartier Hewa Bora",
  schedule: "Chaque mercredi · 17h30",
  host: "Chez l'habitant (Quartier Hewa Bora)",
  description: "Un espace d'accueil au cœur du quartier de l'église, réunissant familles et jeunes pour prier et méditer la Parole en simplicité.",
  image: "/media/ccjv-35.jpeg",
}
```

---

## A.2 `src/data/mock/departments.ts` (96 lines)

### ENTITY: `departments` (departments.ts:8) — `Department[]` (typed by `@/types`), 3 records

| field | present | note |
|---|---|---|
| `id` | 3/3 | `dep-*` |
| `name` | 3/3 | |
| `slug` | 3/3 | |
| `tagline` | 3/3 | optional in type, always set |
| `description` | 3/3 | optional in type, always set |
| `responsibleName` | 3/3 | optional in type, always set |
| `meetingSchedule` | 3/3 | optional in type, always set |
| `bannerImage` | 3/3 | optional in type, always set |
| `keyPoints` | 3/3 | `string[]`, exactly 4 items each |
| `gallery` | 3/3 | `string[]`, exactly 6 items each |

- **Enum-like fields:** none, and **no `status`, `publishedAt`, `order`, `position`, `createdAt`, `updatedAt`, `isActive` field exists** — neither in the mock nor in the `Department` type. Departments have no lifecycle state at all.
- **`id` literals (all 3):** `"dep-adultes"`, `"dep-ecodim"`, `"dep-chorale"`.
- **`slug` literals (all 3):** `"adultes"`, `"enfants-ecodim"`, `"chorale"` — **`slug` ≠ `id`** (the slug drops the `dep-` prefix and `ecodim` → `enfants-ecodim`).
- **Image literals:** bannerImage `/media/ccjv-27.jpeg`, `/media/ccjv-13.jpeg`, `/media/ccjv-15.jpeg`.
  `gallery` arrays (verbatim):
  - `dep-adultes`: `/media/ccjv-09.jpeg`, `/media/ccjv-11.jpeg`, `/media/ccjv-12.jpeg`, `/media/ccjv-25.jpeg`, `/media/ccjv-28.jpeg`, `/media/ccjv-40.jpeg`
  - `dep-ecodim`: `/media/ccjv-13.jpeg`, `/media/ccjv-15.jpeg`, `/media/ccjv-23.jpeg`, `/media/ccjv-31.jpeg`, `/media/ccjv-33.jpeg`, `/media/ccjv-37.jpeg`
  - `dep-chorale`: `/media/ccjv-15.jpeg`, `/media/ccjv-08.jpeg`, `/media/ccjv-12.jpeg`, `/media/ccjv-16.jpeg`, `/media/ccjv-17.jpeg`, `/media/ccjv-36.jpeg`
- **Cross-references (incoming, by id):** `events.ts` `departmentId` → `"dep-adultes"`, `"dep-ecodim"`, `"dep-chorale"` (see A.3). Outgoing: none.
- **`meetingSchedule` literals:** `"Dimanche · 09:00 — Culte dominical"`, `"Dimanche · 09:00 — Rencontre Ecodim"`, `"Lundi 16h30–18h30 · Mercredi dans la nuit · Samedi 16h30–18h30"`.
- **Note on `responsibleName`:** two of three are placeholders, not names: `"Responsable Ecodim — à confirmer"`, `"Responsable chorale — à confirmer"`. Only `"Pasteur Manasse Mwamba"` is a real name.
- **Full literal record (record 1):**
```ts
{
  id: "dep-adultes",
  name: "Adultes",
  slug: "adultes",
  tagline: "Grandir dans la Parole, servir ensemble.",
  description:
    "Le volet adultes rassemble les hommes et les femmes de l'église autour de la Parole, de la prière et du service. On y apprend à marcher ensemble, à porter les uns les autres et à prendre sa place dans la maison.",
  responsibleName: "Pasteur Manasse Mwamba",
  meetingSchedule: "Dimanche · 09:00 — Culte dominical",
  bannerImage: "/media/ccjv-27.jpeg",
  keyPoints: [
    "Enseignement biblique solide et accessible à tous.",
    "Prière et intercession pour la famille et la ville.",
    "Accueil et intégration des nouvelles personnes.",
    "Service concret : entraide, visite des malades, soutien.",
  ],
  gallery: [
    "/media/ccjv-09.jpeg",
    "/media/ccjv-11.jpeg",
    "/media/ccjv-12.jpeg",
    "/media/ccjv-25.jpeg",
    "/media/ccjv-28.jpeg",
    "/media/ccjv-40.jpeg",
  ],
}
```

### Helper functions (departments.ts)
- `getDepartmentName(id?: string | null): string | undefined` (line 88) — `departments.find(d => d.id === id)?.name`. **Consumed** (1 call site).
- `getDepartmentBySlug(slug: string): Department | undefined` (line 94) — **NEVER IMPORTED, NEVER CALLED.** Dead export. (The `/departements/[slug]` routes its JSDoc mentions do not exist in `src/app`; department detail is a modal on `/organisation` driven by hash, see D/B.)

---

## A.3 `src/data/mock/events.ts` (159 lines)

Unexported intermediate: `const rawEvents: Omit<Event, "status">[]` (line 9) — **7 records**. Exported `events` is `rawEvents.map(e => ({...e, status: getEventStatus(e.eventDate)}))` (line 141), so `status` is **computed at module load from the real clock** via `daysFromNow`.

### ENTITY: `events` (events.ts:141) — `Event[]`, 7 records

| field | present | note |
|---|---|---|
| `id` | 7/7 | `evt-NNN` |
| `title` | 7/7 | |
| `slug` | 7/7 | |
| `excerpt` | 7/7 | optional in type, always set |
| `description` | 7/7 | optional in type, always set |
| `eventDate` | 7/7 | `daysFromNow(n)` → ISO `YYYY-MM-DD`, **non-deterministic across builds** |
| `eventTime` | 7/7 | `"HH:mm"` |
| `location` | 7/7 | |
| `imageUrl` | **6/7** | missing on `evt-007` |
| `bannerImage` | **4/7** | only `evt-001`..`evt-004` |
| `gallery` | **6/7** | missing on `evt-007` |
| `departmentId` | 7/7 (2 `null`) | `evt-004`, `evt-006` are `null` |
| `practicalInfo` | **4/7** | only `evt-001`..`evt-004` |
| `status` | 7/7 | computed, `EventStatus` |

- **Enum-like field `status` — distinct values with counts (as of run date, because dates are relative):**
  - `"UPCOMING"` × **4** (`evt-001` +3d, `evt-002` +7d, `evt-003` +10d, `evt-004` +16d)
  - `"ARCHIVED"` × **3** (`evt-005` −4d, `evt-006` −14d, `evt-007` −18d)
  - Computed by `getEventStatus` (`src/lib/utils.ts:15`): `eventDate >= today(ISO slice 0,10)` → `"UPCOMING"`, else `"ARCHIVED"`. `status` is **never persisted** and **does not exist in `rawEvents`**.
- **`departmentId` distinct values with counts:** `"dep-adultes"` ×2 (`evt-001`, `evt-005`), `"dep-chorale"` ×2 (`evt-003`, `evt-007`), `"dep-ecodim"` ×1 (`evt-002`), `null` ×2 (`evt-004`, `evt-006`).
- **`eventTime` distinct values:** `"09:00"` ×3, `"17:00"` ×2, `"14:00"` ×1, `"10:00"` ×1.
- **`location` distinct values:** `"Temple CCJV — Lubumbashi"` ×4, `"Salle Ecodim — Lubumbashi"` ×1, `"Lubumbashi"` ×1 … plus `evt-001` also `"Temple CCJV — Lubumbashi"` (total 5+1+1 = 7).
- **`id` literals (all 7):** `"evt-001"` … `"evt-007"`.
- **`slug` literals (all 7):** `"culte-dominical"`, `"rencontre-ecodim"`, `"repetition-chorale"`, `"culte-special-action-de-grace"`, `"culte-dominical-passe"`, `"journee-communautaire"`, `"repetition-chorale-passee"`. Note two title pairs are distinguished **only** by the `-passe`/`-passee` slug suffix (`"Culte dominical"` appears twice, `"Répétition de la chorale"` twice).
- **Image literals:** `imageUrl`: `/media/ccjv-08.jpeg`, `/media/ccjv-13.jpeg`, `/media/ccjv-15.jpeg`, `/media/ccjv-09.jpeg`, `/media/ccjv-11.jpeg`, `/media/ccjv-27.jpeg` (6). `bannerImage`: `/media/ccjv-08.jpeg`, `/media/ccjv-13.jpeg`, `/media/ccjv-15.jpeg`, `/media/ccjv-09.jpeg` (4). `gallery` arrays: 4, 4, 3, 3, 2, 2 items respectively.
- **Cross-references:** `departmentId` → `departments.id` literals quoted above. Nothing else.
- **Full literal record (record 1), including computed `status`:**
```ts
{
  id: "evt-001",
  title: "Culte dominical",
  slug: "culte-dominical",
  excerpt:
    "Le rendez-vous de toute la famille CCJV : louange, Parole et communion fraternelle.",
  description:
    "Chaque dimanche, l'assemblée se rassemble pour adorer Dieu, écouter Sa Parole et vivre la communion fraternelle. Un moment ouvert à tous — membres comme visiteurs. Venez comme vous êtes.",
  eventDate: daysFromNow(3),
  eventTime: "09:00",
  location: "Temple CCJV — Lubumbashi",
  imageUrl: "/media/ccjv-08.jpeg",
  bannerImage: "/media/ccjv-08.jpeg",
  gallery: [
    "/media/ccjv-08.jpeg",
    "/media/ccjv-11.jpeg",
    "/media/ccjv-12.jpeg",
    "/media/ccjv-25.jpeg",
  ],
  departmentId: "dep-adultes",
  practicalInfo: [
    "Ouvert à tous, sans inscription.",
    "Accueil dès 08h30.",
    "Un espace est prévu pour les enfants (Ecodim).",
  ],
  status: "UPCOMING", // injected at line 141-144
}
```
- **`evt-007` is the structurally thinnest record** (no `imageUrl`, no `bannerImage`, no `gallery`, no `practicalInfo`) — it is the shape a real API record with absent optional media will look like.

### ENTITY: `upcomingEvents` (events.ts:147) — `Event[]`, derived
`events.filter(e => e.status === "UPCOMING").sort((a,b) => a.eventDate.localeCompare(b.eventDate))` → ascending by ISO date. Count = 4 at load time. No own literals.

### ENTITY: `archivedEvents` (events.ts:152) — `Event[]`, derived
`events.filter(e => e.status === "ARCHIVED").sort((a,b) => b.eventDate.localeCompare(a.eventDate))` → descending. Count = 3. No own literals.

### Helper (events.ts)
- `getEventBySlug(slug: string): Event | undefined` (line 157) — **NEVER IMPORTED, NEVER CALLED.** Dead export. The real `/vie-de-leglise/evenements/[slug]` route uses `getEvent()` from `@/lib/api` instead.

---

## A.4 `src/data/mock/images.ts` (73 lines)

### ENTITY: `images` (images.ts:11) — `as const` object, **14 keys** (no interface, no id, no records)
Literals verbatim:
```ts
hero: "/media/ccjv-02.jpeg"
identite: "/media/ccjv-27.jpeg"
louange: "/media/ccjv-08.jpeg"
communaute: "/media/ccjv-30.jpeg"
ecodim: "/media/ccjv-13.jpeg"
portraitLarge: "/media/ccjv-05.jpeg"
portraitA: "/media/ccjv-01.jpeg"
portraitB: "/media/ccjv-03.jpeg"
assemblee: "/media/ccjv-09.jpeg"
chorale: "/media/ccjv-15.jpeg"
predication: "/media/ccjv-11.jpeg"
exterieur: "/media/ccjv-21.jpeg"
service: "/media/ccjv-28.jpeg"
fraternite: "/media/ccjv-35.jpeg"
```
- **Enum-like fields:** none — keys are layout roles, not statuses.
- **Critical semantic caveat stated in the file itself (lines 4-8):** these values are **layout roles, not captions**; "aucune légende affirmative n'est écrite à partir de ces fichiers". No `alt` text is attached to them anywhere in the data.
- **Cross-references:** none.

### ENTITY: `photoPool` (images.ts:43) — `string[]`, **15 entries**
`/media/ccjv-09.jpeg`, `/media/ccjv-11.jpeg`, `/media/ccjv-12.jpeg`, `/media/ccjv-15.jpeg`, `/media/ccjv-16.jpeg`, `/media/ccjv-17.jpeg`, `/media/ccjv-23.jpeg`, `/media/ccjv-25.jpeg`, `/media/ccjv-28.jpeg`, `/media/ccjv-31.jpeg`, `/media/ccjv-32.jpeg`, `/media/ccjv-33.jpeg`, `/media/ccjv-36.jpeg`, `/media/ccjv-37.jpeg`, `/media/ccjv-40.jpeg`

### ENTITY: `galleryImages` (images.ts:62) — `string[]`, **10 entries**
`/media/ccjv-09.jpeg`, `/media/ccjv-11.jpeg`, `/media/ccjv-12.jpeg`, `/media/ccjv-15.jpeg`, `/media/ccjv-23.jpeg`, `/media/ccjv-25.jpeg`, `/media/ccjv-28.jpeg`, `/media/ccjv-32.jpeg`, `/media/ccjv-37.jpeg`, `/media/ccjv-40.jpeg`

- **Both pools carry no ids, no captions, no alt text, no credit, no ordering metadata** — they are bare path strings. Nothing keys an image back to an entity.
- **Asset coverage:** the three mock modules + `images` reference only these 25 files: `01,02,03,04,05,06,08,09,11,12,13,15,16,17,18,19,21,23,24,25,27,28,30,31,32,33,34,35,36,37,38,40`. `public/media` has 41 files; **`ccjv-07, ccjv-10, ccjv-14, ccjv-20, ccjv-22, ccjv-26, ccjv-29, ccjv-39, ccjv-41` are never referenced by any mock** (`04, 19, 24, 38` are referenced **only** by the unused `leaders.ts`).

---

## A.5 `src/data/mock/leaders.ts` (62 lines) — **MODULE NEVER IMPORTED**

### ENTITY: `leaders` (leaders.ts:18) — local `Leader[]`, 5 records
Local exported interface `Leader` (leaders.ts:8): `id, name, role` required; `photo?: string`, `scope?: string`, `bio?: string`.

| field | present | note |
|---|---|---|
| `id` | 5/5 | `lead-NNN` |
| `name` | 5/5 | 4 of 5 are placeholders (`"Responsable — Adultes"`, `"Responsable — Ecodim"`, `"Responsable — Chorale"`, `"Responsable — Accueil"`) |
| `role` | 5/5 | |
| `scope` | **5/5** | optional in type, always set; **free French label, not a department id** |
| `photo` | **5/5** | optional in type, always set |
| `bio` | **5/5** | optional in type, always set |

- **Enum-like fields:** none. **No `status` / `published` / `draft` field.**
- **`id` literals:** `"lead-001"`, `"lead-002"`, `"lead-003"`, `"lead-004"`, `"lead-005"`.
- **`photo` literals:** `/media/ccjv-05.jpeg`, `/media/ccjv-04.jpeg`, `/media/ccjv-19.jpeg`, `/media/ccjv-24.jpeg`, `/media/ccjv-38.jpeg`.
- **`scope` literals:** `"Direction générale"`, `"Adultes"`, `"Enfants / Ecodim"`, `"Chorale"`, `"Communauté"` — **strings, NOT `dep-*` ids and NOT slugs.** No mechanical link to `departments`.
- **Cross-references:** **none resolvable.** There is no `departmentId` in this mock, so leader→department cannot be joined by code.
- **Full literal record (record 1):**
```ts
{
  id: "lead-001",
  name: "Pasteur Manasse Mwamba",
  role: "Visionnaire / créateur",
  scope: "Direction générale",
  photo: "/media/ccjv-05.jpeg",
  bio: "Il a fondé le Centre Chrétien Jésus ma Vie le 17 mars 2023. Sa charge : affermir l'église dans la Parole, la prière et l'amour fraternel.",
}
```

### ENTITY: `leadPastor` (leaders.ts:62) — `Leader` (alias of `leaders[0]`)
`export const leadPastor = leaders[0];` — an **index alias, not a copy**: it is `"lead-001"` / `"Pasteur Manasse Mwamba"`. **Never imported anywhere.** The live `/organisation` page builds its own `leadPastor` from the API (`const [leadPastor, ...teamLeaders] = leaders`, `organisation/page.tsx:27`) — a name collision with the dead mock.

---

## A.6 `src/data/mock/publications.ts` (147 lines)

### ENTITY: `publications` (publications.ts:9) — `Publication[]` (typed by `@/types`), 10 records

| field | present | note |
|---|---|---|
| `id` | 10/10 | `pub-NNN` |
| `title` | 10/10 | |
| `slug` | 10/10 | |
| `type` | 10/10 | `PublicationType` |
| `category` | 10/10 | optional in type, always set here |
| `contentUrl` | **6/10** | optional in type; missing on all 4 `TEXTE` records (`pub-005`, `pub-007`, `pub-008`, `pub-009`) |
| `author` | **2/10** | optional in type; only `pub-001`, `pub-003` |
| `description` | 10/10 | optional in type, always set |
| `publishedAt` | 10/10 | `daysFromNow(...)` → ISO, **non-deterministic across builds** |
| `body` | **4/10** | optional in type; only the 4 `TEXTE` records (`pub-005` 3 items, `pub-007` 2, `pub-008` 3, `pub-009` 2) |

- **`status` / `published` / `draft`: NO such field on any mock record, and `Publication` in `@/types` has no such field either.** The only place a publication lifecycle exists is `PublicationStatus = "DRAFT" | "PUBLISHED"` in `src/lib/api/types.ts:37`, carried by `PublicationRecord` (API-side only). Mocks can therefore never express a draft.
- **`type` distinct values with counts (`PublicationType`):**
  - `"VIDEO"` × **2** (`pub-001`, `pub-003`)
  - `"PHOTO"` × **4** (`pub-002`, `pub-004`, `pub-006`, `pub-010`)
  - `"TEXTE"` × **4** (`pub-005`, `pub-007`, `pub-008`, `pub-009`)
- **`category` distinct values with counts:**
  - `"ENSEIGNEMENT"` × **2** (`pub-001`, `pub-003`)
  - `"MEDIA"` × **4** (`pub-002`, `pub-004`, `pub-006`, `pub-010`)
  - `"ACTUALITE"` × **2** (`pub-005`, `pub-007`)
  - `"RESSOURCE"` × **2** (`pub-008`, `pub-009`)
- **`type` ↔ `category` is a perfect functional dependency in the mock:** `VIDEO`→`ENSEIGNEMENT` (2/2), `PHOTO`→`MEDIA` (4/4), `TEXTE`→{`ACTUALITE` (2), `RESSOURCE` (2)}. Two taxonomies that carry partly identical information.
- **`id` literals:** `"pub-001"` … `"pub-010"`.
- **`contentUrl` literals (all 6):** `"https://www.youtube.com/watch?v=dQw4w9WgXcQ"`, `"/media/ccjv-09.jpeg"`, `"https://www.youtube.com/watch?v=9bZkp7q19f0"`, `"/media/ccjv-15.jpeg"`, `"/media/ccjv-23.jpeg"`, `"/media/ccjv-30.jpeg"`. So `contentUrl` is a **union of an absolute external video URL and a local image path** in one field — its meaning depends on `type`.
- **`author` literals:** `"Pasteur Manasse Mwamba"` ×2.
- **Cross-references:** none to other entities. `body` is a plain `string[]` paragraph list.
- **Full literal record (record 1):**
```ts
{
  id: "pub-001",
  title: "Culte du dimanche — La maison de Dieu",
  slug: "culte-du-dimanche-la-maison-de-dieu",
  type: "VIDEO",
  category: "ENSEIGNEMENT",
  contentUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  author: "Pasteur Manasse Mwamba",
  description:
    "Message du dimanche sur la joie d'entrer dans la maison de Dieu et d'y être accueilli.",
  publishedAt: daysFromNow(-2),
}
```
- **Full literal record (a `TEXTE` with `body`, record 5):**
```ts
{
  id: "pub-005",
  title: "Annonce — Rentrée de l'Ecodim",
  slug: "annonce-rentree-de-lecodim",
  type: "TEXTE",
  category: "ACTUALITE",
  description:
    "Le ministère des enfants reprend ses rencontres. Parents, voici tout ce qu'il faut savoir pour accompagner vos enfants.",
  publishedAt: daysFromNow(-20),
  body: [
    "L'Ecodim, le ministère des enfants du Centre Chrétien Jésus ma Vie, reprend ses rencontres hebdomadaires.",
    "Chaque dimanche, les enfants sont accueillis par une équipe dédiée pour un temps adapté à leur âge : chants, récits bibliques et activités.",
    "Les parents qui souhaitent inscrire leur enfant pour la première fois sont invités à se présenter un peu avant le culte afin que nous puissions faire connaissance.",
  ],
}
```

### Helpers (publications.ts) — **BOTH DEAD**
- `getPublicationBySlug(slug: string): Publication | undefined` (line 138) — **never imported, never called** (the `/publications/[slug]` route uses `getPublication()` from `@/lib/api`).
- `getPublicationsByCategory(category: NonNullable<Publication["category"]>): Publication[]` (line 143) — **never imported, never called** (routes use `getPublications({ category })`).

---

## A.7 `src/data/mock/site.ts` (108 lines)

### ENTITY: `site` (site.ts:17) — `as const` object, **13 keys** (no interface, no id)
| key | literal value |
|---|---|
| `name` | `"CENTRE CHRÉTIEN JÉSUS MA VIE"` |
| `acronym` | `"CCJV"` |
| `location` | `"Lubumbashi, République démocratique du Congo"` |
| `foundedAt` | `"17 mars 2023"` |
| `ecodimFoundedAt` | `"2 juillet 2023"` |
| `visionary` | `"Pasteur Manasse Mwamba"` |
| `visionaryRole` | `"Visionnaire / créateur"` |
| `address` | `"Quartier Hewa Bora, Avenue Djoloko Lubumbashi"` |
| `addressLines` | `["Quartier Hewa Bora", "Avenue Djoloko", "Lubumbashi, République démocratique du Congo"]` |
| `scheduleAdults` | `"Dimanche · 09h00"` |
| `scheduleChildren` | `"Dimanche · 09h00 (Ecodim, pendant le culte)"` |
| `whatsappNumber` | `"+243 123 456 789"` |
| `whatsappHref` | `"https://wa.me/243123456789"` |

- **Enum-like fields:** none. **No `status`, `publishedAt`, `updatedAt`.**
- **`address` is inconsistent with `addressLines`:** `address` concatenates without a comma between `"Avenue Djoloko"` and `"Lubumbashi"` (`"… Avenue Djoloko Lubumbashi"`), while `addressLines` separates them as two lines.
- **Nested array:** `addressLines` — `string[3]`, full shape shown above.
- **Cross-references:** none by id. `site` has no id and is not addressable.
- **Field-read audit (who actually reads each key) — 7 of 13 keys are read, 6 are dead:**
  - Read: `name`, `location`, `acronym`, `visionary`, `visionaryRole`, `address`, `whatsappHref`.
  - **Never read anywhere in `frontend/src`: `foundedAt`, `ecodimFoundedAt`, `addressLines`, `scheduleAdults`, `scheduleChildren`, `whatsappNumber`.**
- **Health/realism flag:** `whatsappNumber` / `whatsappHref` are clearly placeholder digits (`+243 123 456 789`) yet feed every CTA on the site (12 call sites).

### ENTITY: `socials` (site.ts:43) — `SocialLink[]`, 2 records
Exported (and duplicated) interface `SocialLink` (site.ts:12) — `label: string; href: string`. Both required, both on 2/2.
```ts
{ label: "Instagram", href: "https://www.instagram.com/ecodim_ccjv/" }
{ label: "TikTok",    href: "https://www.tiktok.com/@ecodim_ccjv" }
```
- **Enum-like field:** `label` has exactly 2 values, `"Instagram"` and `"TikTok"` (1 each). No `icon`, no `platform`, no `order` field — **the icon must be inferred from the `label` string**.
- No `id`. No `status`.

### ENTITY: `weeklyRhythm` (site.ts:64) — `RhythmEntry[]`, 6 records
Exported interface `RhythmEntry` (site.ts:48): `day, title, time` required; `audience?: string`; `confirmed?: boolean`.

| field | present | note |
|---|---|---|
| `day` | 6/6 | |
| `title` | 6/6 | |
| `time` | 6/6 | French display string, **not `HH:mm`** — mixes `"09h00"`, `"16h30 – 18h30"`, `"Dans la nuit"` |
| `audience` | **6/6** | optional in type, always set |
| `confirmed` | **3/6** | optional; `true` only on the 3 chorale rows |

- **`day` distinct values with counts:** `"Dimanche"` ×2, `"Mercredi"` ×2, `"Lundi"` ×1, `"Samedi"` ×1. **No `Mardi`, `Jeudi`, `Vendredi` rows** — even though `houseGroups` schedules groups on **mardi and jeudi** (A.1). The weekly rhythm and the house-group calendar disagree/incomplete.
- **`confirmed` distinct values with counts:** `true` ×3, absent ×3 (never `false`). The file's own comment says chorale times are CONFIRMED and everything else is demo.
- **No `id` field** → rows are keyed in the UI by a composite of `day`+`title` (`WeekRhythm.tsx:17`), which is fragile because `"Répétition de la chorale"` appears 3 times and `"Dimanche"` twice.
- **Full literal record (record 1):**
```ts
{ day: "Dimanche", title: "Culte dominical", time: "09h00", audience: "Toute l'assemblée" }
```
- **Full literal record (a `confirmed` one, record 3):**
```ts
{
  day: "Lundi",
  title: "Répétition de la chorale",
  time: "16h30 – 18h30",
  audience: "Chantres et musiciens",
  confirmed: true,
}
```

### ENTITY: `choraleSchedule` (site.ts:107) — plain `string`
`"Lundi 16h30–18h30 · Mercredi dans la nuit · Samedi 16h30–18h30"`
**NEVER IMPORTED, NEVER READ.** It duplicates the same information already carried by the three `confirmed: true` rows of `weeklyRhythm` **and** by `departments[2].meetingSchedule` (`"Lundi 16h30–18h30 · Mercredi dans la nuit · Samedi 16h30–18h30"` — note the separator differs: `16h30–18h30` without spaces here vs `16h30 – 18h30` with spaces in `weeklyRhythm`). **The chorale schedule exists in three places in two different formats.**

---

## A.8 `src/data/mock/testimonies.ts` (50 lines) — **MODULE NEVER IMPORTED**

### ENTITY: `testimonies` (testimonies.ts:17) — local `Testimony[]`, 4 records
Local exported interface `Testimony` (testimonies.ts:9): `id, photo, quote, name, role` — all required, all non-nullable.

| field | present |
|---|---|
| `id` | 4/4 |
| `photo` | 4/4 |
| `quote` | 4/4 |
| `name` | 4/4 |
| `role` | 4/4 |

- **Enum-like fields:** none. **No `status` / `published` / `position` / `order` field.**
- **`id` literals:** `"tem-001"`, `"tem-002"`, `"tem-003"`, `"tem-004"`.
- **`photo` literals:** `/media/ccjv-01.jpeg`, `/media/ccjv-03.jpeg`, `/media/ccjv-18.jpeg`, `/media/ccjv-34.jpeg` — **the first three are the exact same files as `communityFaces` faces 01/02/03 with the same first names** (`Grâce`, `Patrick`, `Esther`). `tem-004` (`Josué`, `/media/ccjv-34.jpeg`) reuses the photo of `face-05` (`Emmanuel`). **No id links the two entities** — the overlap is only discoverable by eyeballing image paths and names.
- **Cross-references:** none declared. (Implicit person-identity overlap with `communityFaces`, see above.)
- **Full literal record (record 1):**
```ts
{
  id: "tem-001",
  photo: "/media/ccjv-01.jpeg",
  quote:
    "Je suis arrivée sans connaître personne. On m'a accueillie simplement, sans me juger. Aujourd'hui, j'ai une famille ici.",
  name: "Grâce",
  role: "Membre de l'assemblée",
}
```
- This mock is **entirely superseded**: `/communaute/temoignages` renders `getTestimonies()` from the API (`temoignages/page.tsx:55`). The mock file is now dead weight carrying fake identities.

---

## A.9 `src/data/mock/verses.ts` (48 lines)

### ENTITY: `verses` (verses.ts:14) — `as const satisfies Record<string, Verse>`, **8 keys**
Exported interface `Verse` (verses.ts:9): `text: string; reference: string`. Every entry has both (8/8).

| key | `text` | `reference` |
|---|---|---|
| `rassemblement` | `"Car là où deux ou trois sont assemblés en mon nom, je suis au milieu d'eux."` | `"Matthieu 18:20"` |
| `louange` | `"Que tout ce qui respire loue l'Éternel !"` | `"Psaume 150:6"` |
| `repos` | `"Venez à moi, vous tous qui êtes fatigués et chargés, et je vous donnerai du repos."` | `"Matthieu 11:28"` |
| `parole` | `"Ta parole est une lampe à mes pieds, et une lumière sur mon sentier."` | `"Psaume 119:105"` |
| `ouvrage` | `"Car nous sommes son ouvrage, ayant été créés en Jésus-Christ pour de bonnes œuvres, que Dieu a préparées d'avance, afin que nous les pratiquions."` | `"Éphésiens 2:10"` |
| `corps` | `"Car, comme le corps est un et a plusieurs membres, et comme tous les membres du corps, malgré leur nombre, ne forment qu'un seul corps, ainsi en est-il de Christ."` | `"1 Corinthiens 12:12"` |
| `memoire` | `"Qu'ainsi disent les rachetés de l'Éternel, ceux qu'il a délivrés de la main de l'ennemi."` | `"Psaume 107:2"` |
| `mission` | `"Allez, faites de toutes les nations des disciples, les baptisant au nom du Père, du Fils et du Saint-Esprit, et enseignez-leur à observer tout ce que je vous ai prescrit."` | `"Matthieu 28:19-20"` |

- **Enum-like field:** the **object key** is the enum (`rassemblement`, `louange`, `repos`, `parole`, `ouvrage`, `corps`, `memoire`, `mission`), and it is the intended join key to the API (`Scripture.key` in `lib/api/types.ts:129`). There is **no `id`, no `translation`, no `context`, no timestamps** in the mock.
- **Key usage audit — only 5 of 8 keys are ever read:**
  - Read: `rassemblement` (2 files), `parole` (3 files), `louange` (1), `memoire` (1), `ouvrage` (1).
  - **Never read anywhere: `repos`, `corps`, `mission`.**
- **Cross-references:** none by id. The French reference string is the only anchor.
- **Full literal record (record 1):**
```ts
rassemblement: {
  text: "Car là où deux ou trois sont assemblés en mon nom, je suis au milieu d'eux.",
  reference: "Matthieu 18:20",
}
```

---

# DELIVERABLE B — CONSUMER MAP

Method: `grep` for `data/mock` imports across all of `frontend/src`, then `grep` for each exported symbol. Consequence of the `@/lib/api` migration: several pages that *import* a mock value are nonetheless **fully API-driven** and the mock is only a fallback or an unrelated constant.

## B.1 `community.ts`
- `communityFaces` → `src/app/qui-sommes-nous/page.tsx:11` — **mapped**: `communityFaces.map((face) => …)` at `:532` renders the faces as static cards. **This is the only consumer; the homepage section uses the API instead.**
- `type CommunityFace` → `src/components/shared/CommunityFaces.tsx:7` — **type-only import**; the component signature is `CommunityFaces({ faces }: { faces: CommunityFace[] })` (`:23`) and it **indexes** (`faces[active]`, `:49`), **maps** twice (`:71`, `:89`, `:112`), and **length-checks** via `nodes.length === 0` / `if (!current)` (`:31`, `:60`). The data it receives in production comes from `getCommunityFaces()` (`app/page.tsx:46` → `:215`), i.e. the component is typed by the **mock** type while fed the **API** type.
- `houseGroups` → `src/app/communaute/groupes-de-maison/page.tsx:9` — **mapped**: `houseGroups.map((group, index) => …)` at `:254`. Only consumer.

## B.2 `departments.ts`
- `departments` → 2 files:
  - `src/app/recherche/page.tsx:11` — **iterated** in `buildIndex()`: `for (const department of departments)` `:55`, producing `{ href: `/organisation#${department.slug}`, title: department.name, description: department.tagline ?? department.description ?? "", kind: "Département" }` `:56-61`. **The mock is the search index for departments.**
  - `src/app/sitemap.ts:5` — **IMPORTED BUT NEVER USED.** The file only maps `events` (`:35`) and `publications` (`:39`). Dead import (and an ESLint unused-vars failure waiting to happen).
- `getDepartmentName` → `src/features/events/EventsSection.tsx:3` — used as a **fallback lookup**: `departmentNames?.[event.departmentId ?? ""] ?? getDepartmentName(event.departmentId)` `:146-148`. Since the API path always wins when `departmentNames` is supplied, and `EventsSection` is rendered from exactly one place (`app/page.tsx:143`) which **always** passes `departmentNames`, **this mock call is effectively unreachable in production.**
- `getDepartmentBySlug` → **NO IMPORTER, NO CALL SITE.** Dead.

## B.3 `events.ts`
- `events` → 2 files:
  - `src/app/recherche/page.tsx:10` — **iterated**: `for (const event of events)` `:46`, indexing `event.slug`, `event.title`, `event.excerpt ?? event.description`.
  - `src/app/sitemap.ts:4` — **mapped** to URL entries: `events.map((event) => ({ path: `/vie-de-leglise/evenements/${event.slug}`, priority: 0.6 }))` `:35-38`.
- `upcomingEvents` → `src/features/events/EventsSection.tsx:4` — **default prop value**: `events = upcomingEvents` `:70`, then **sliced**: `const displayedEvents = events.slice(0, maxEvents)` `:77`. **In practice unreachable:** the sole render site overrides it with API data (`app/page.tsx:148 events={upcoming}`).
- `archivedEvents` → **NO IMPORTER.** The archived list on `/vie-de-leglise/evenements` is built from `getEvents({ status: "ARCHIVED", … })` (`:26`), which merely **shadows the name** with a local `const`.
- `getEventBySlug` → **NO IMPORTER, NO CALL SITE.** Dead.

## B.4 `images.ts` — the most widely consumed mock module (21 distinct files)
- `images` → **20 files** (all uses are property reads, mostly as a hardcoded asset source *or* a `??` fallback):
  - `src/features/pages/Hero.tsx:4` → `:27` `images.portraitLarge`.
  - `src/components/shared/VerseSection.tsx:3` (aliased `defaultImages`) → `:108-111` four `defaultImages.* || "/media/…"` **fallbacks**.
  - `src/components/layout/FullscreenMenu.tsx:9` → `:23,:27,:31,:35,:39,:43` six `images.* || "/media/…"` **fallbacks**.
  - `src/components/layout/Header.tsx` — **not** an `images` consumer (imports `site` at `:8` only).
  - `src/components/layout/IntroCurtain.tsx:2-3` → `verses` + `site` only.
  - `src/app/layout.tsx:7` → `site` only.
  - `src/app/page.tsx:25` → `:79` `portraitLarge`, `:131` `identite`, `:220` `louange`, `:273` `communaute`.
  - `src/app/communaute/temoignages/page.tsx:14` → `:204 service`, `:228 assemblee`, `:229 fraternite`.
  - `src/app/communaute/priere-et-intercession/page.tsx:8` → `:77 louange`, `:130 predication`, `:152 fraternite`, `:344 assemblee` (all with `||` fallbacks).
  - `src/app/communaute/parcours-nouveau/page.tsx:7` → `:26,:36,:46,:56,:66` inside a step array, `:111 hero`, `:177 louange`, `:195 ecodim`, `:212 identite`, `:382 exterieur`.
  - `src/app/communaute/groupes-de-maison/page.tsx:7` → `:84 communaute`, `:137 fraternite`, `:159 identite`, `:349 portraitA`.
  - `src/app/organisation/page.tsx:5` → `:42 assemblee`, `:90 service`, `:109 chorale`, `:125 ecodim`, `:242 portraitLarge` (fallback for `leadPastor.photo ?? …`), `:306 portraitB` (fallback for `ldr.photo ?? …`), `:379 fraternite`, `:388 predication`.
  - `src/app/organisation/OrganisationExplorer.tsx:6` → `:52` `dept.bannerImage ?? images.communaute`.
  - `src/app/publications/actualites/page.tsx:9` → `:96 fraternite`.
  - `src/app/publications/mediatheque/page.tsx:11` → `:62 communaute`.
  - `src/app/publications/ressources/page.tsx:9` → `:202 predication`.
  - `src/app/publications/[slug]/page.tsx:17` → `:37-39` `fallbackImage` map keyed by `Publication["type"]` (`VIDEO→predication`, `PHOTO→assemblee`, `TEXTE→assemblee`).
  - `src/app/qui-sommes-nous/page.tsx:8` → `:36 hero`, `:69 portraitLarge`, `:134 assemblee`, `:191 ecodim`, `:218 chorale`, `:237 communaute`, `:418 louange`, `:424 fraternite`, `:433 service`, `:439 predication`, `:458 identite`, `:459 assemblee`, `:471 identite`.
  - `src/app/vie-de-leglise/ou-nous-trouver/page.tsx:8` → `:73 exterieur`, `:319 communaute`.
  - `src/app/vie-de-leglise/evenements/page.tsx:7` → `:224 leadEvent.imageUrl || images.assemblee`, `:564 images.assemblee`.
  - `src/app/vie-de-leglise/faire-un-don/page.tsx:7` → `:26,:32,:38,:44` inside a giving-section array, `:140 communaute`, `:412 fraternite`, `:418 louange`, `:427 service`, `:433 assemblee`, `:529 assemblee`, `:535 fraternite`.
- `photoPool` → 2 files, both **sliced**:
  - `src/app/publications/mediatheque/page.tsx:11` → `:96 photoPool.slice(0, 5)`, `:100 photoPool.slice(5, 11)` (indices 0-10 → the 11th entry `ccjv-40` is never shown; the pool has 15).
  - `src/app/publications/enseignements/page.tsx:12` → `:178 photoPool.slice(0, 3)`.
- `galleryImages` → `src/app/publications/[slug]/page.tsx:17` — **filtered + spread**: `[imageSource, ...galleryImages.filter((src) => src !== imageSource)]` `:134-135`, else `galleryImages` verbatim. **Used for every publication regardless of its own `gallery`.**

## B.5 `leaders.ts`
- `leaders` → **NO IMPORTER.**
- `leadPastor` → **NO IMPORTER.**
- **MODULE IMPORTED BUT NEVER USED (in fact never even imported).**

## B.6 `publications.ts`
- `publications` → 2 files:
  - `src/app/recherche/page.tsx:12` — **iterated**: `for (const publication of publications)` `:64`, with a `category`→French-label switch `:65-72` and `description: publication.description ?? ""`.
  - `src/app/sitemap.ts:6` — **mapped**: `publications.map((publication) => ({ path: `/publications/${publication.slug}`, priority: 0.6 }))` `:39-42`.
- `getPublicationBySlug` → **NO IMPORTER.** Dead.
- `getPublicationsByCategory` → **NO IMPORTER.** Dead.

## B.7 `site.ts` — second most consumed module (15 files)
- `site` → `src/lib/seo.ts:2` (`:11`, `:27`), `src/app/layout.tsx:7` (`:26`, `:31`), `src/components/layout/Header.tsx:8` (`:98`, `:103`), `src/components/layout/Footer.tsx:3` (`:89`, `:94`, `:105`), `src/components/layout/FullscreenMenu.tsx:8` (`:342`, `:535`, `:543`), `src/components/layout/IntroCurtain.tsx:3` (`:28`), `src/components/forms/PrayerRequestForm.tsx:5` (`:35`), `src/app/page.tsx:26` (`:101`, `:103`, `:117`, `:222`, `:241`, `:265`, `:306`), `src/app/qui-sommes-nous/page.tsx:9` (`:77`, `:142`), `src/app/communaute/temoignages/page.tsx:15` (`:262`), `src/app/communaute/priere-et-intercession/page.tsx:9` (`:113`, `:387`), `src/app/communaute/parcours-nouveau/page.tsx:8` (`:414`), `src/app/communaute/groupes-de-maison/page.tsx:8` (`:120`, `:242`, `:336`, `:392`), `src/app/organisation/page.tsx:6` (`:522`), `src/app/organisation/DepartmentModal.tsx:6` (`:91`, `:189`), `src/app/vie-de-leglise/ou-nous-trouver/page.tsx:7` (`:19`, `:341`), `src/app/vie-de-leglise/faire-un-don/page.tsx:6` (`:124`), `src/app/vie-de-leglise/evenements/[slug]/page.tsx:11` (`:52`, `:188`, `:201`). All uses are scalar property reads / template interpolation; **no mapping, no slicing, no filtering.**
- `socials` → `src/components/layout/FullscreenMenu.tsx:8` (**mapped** `:523`), `src/app/page.tsx:26` (**mapped** `:311`). 2 files.
- `weeklyRhythm` → 2 importers, **only 1 real use**:
  - `src/app/page.tsx:26` → **passed as a prop**: `<WeekRhythm items={weeklyRhythm} />` `:161`.
  - `src/app/vie-de-leglise/ou-nous-trouver/page.tsx:7` — **IMPORTED BUT NEVER USED** (the file references only `site.address` and `site.whatsappHref`). Dead import.
  - *(Not a consumer:* `src/app/vie-de-leglise/evenements/page.tsx:81` declares a **local** `const weeklyRhythm = [...]` literal, unrelated to the mock.)*
- `choraleSchedule` → **NO IMPORTER.**

## B.8 `testimonies.ts`
- `testimonies` → **NO IMPORTER.** **MODULE IMPORTED BUT NEVER USED (never imported).**

## B.9 `verses.ts`
- `verses` → 6 files, all **property reads** into a `scripture={{text, reference}}` prop:
  - `src/app/page.tsx:27` → `:64-65 verses.rassemblement`.
  - `src/components/layout/IntroCurtain.tsx:2` → `:22`, `:25 verses.rassemblement`.
  - `src/app/communaute/temoignages/page.tsx:16` → `:68-69 verses.memoire`, `:239-240 verses.louange`.
  - `src/app/qui-sommes-nous/page.tsx:10` → `:155-156 verses.parole`, `:456-457 verses.ouvrage`.
  - `src/app/publications/enseignements/page.tsx:13` → `:106-107 verses.parole`.
  - `src/components/shared/LegalPage.tsx:4` → `:69-70 verses.parole`.

## B.10 Summary table
| mock module | imported by | used on only one page? | status |
|---|---|---|---|
| `community.ts` | 3 files (`qui-sommes-nous`, `groupes-de-maison`, `CommunityFaces.tsx` type) | `houseGroups` **yes**; `communityFaces` yes (after homepage moved to API) | partly superseded |
| `departments.ts` | 4 import sites, 1 dead import | `departments` on 2 (1 real); `getDepartmentName` 1 | live fallback mostly unreachable |
| `events.ts` | 4 import sites, 1 unused | `upcomingEvents` 1 (unreachable); `events` 2 | superseded for display |
| `images.ts` | 21 files | no — site-wide | **unconditionally live** (asset source + fallbacks) |
| `leaders.ts` | **0** | — | **IMPORTED BUT NEVER USED (never imported)** |
| `publications.ts` | 3 import sites | `publications` on 2 | superseded for display |
| `site.ts` | 15 files | no — site-wide | **unconditionally live** (identity/contact) |
| `testimonies.ts` | **0** | — | **IMPORTED BUT NEVER USED (never imported)** |
| `verses.ts` | 6 files | no | **unconditionally live** |

**Unused imports found (imported, symbol never referenced):** `departments` in `src/app/sitemap.ts:5`; `weeklyRhythm` in `src/app/vie-de-leglise/ou-nous-trouver/page.tsx:7`.
**Dead exports (declared, never imported/called):** `getDepartmentBySlug`, `getEventBySlug`, `getPublicationBySlug`, `getPublicationsByCategory`, `leadPastor`, `choraleSchedule`.

---

# DELIVERABLE C — TYPES

## C.1 `src/types/index.ts` — verbatim (81 lines)

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
(The file's header comment claims alignment with "docs/006 (modélisation) et le futur contrat API REST `/api/v1/*`".)

| type | mock entity it corresponds to | notes / mismatches |
|---|---|---|
| `PublicationType` | `Publication.type` in `publications.ts` | Exact match: `"VIDEO" \| "PHOTO" \| "TEXTE"` = the 3 distinct mock values. |
| `EventStatus` | computed `Event.status` in `events.ts` | Exact match: `"UPCOMING" \| "ARCHIVED"`. **Required (non-optional) on `Event`**, yet the mock builds its records as `Omit<Event, "status">` and injects the value at runtime — i.e. the type forces a computed field to look persisted. |
| `Department` | `departments` (`departments.ts`) | Full match, all 10 fields present in mock 3/3. **MISMATCH (absent on both sides):** no `position`/`order`, no `createdAt`/`updatedAt`, no `status`/`isActive`, no `imageUrl` (only `bannerImage`), no `leaderId`/`responsibleId` (only the free-text `responsibleName`). The API module re-exports this type **unchanged** — so `GET /departments` cannot express ordering or lifecycle. |
| `Event` | `events` (`events.ts`) | Match. **Mock-only extras vs type:** none. **Type fields the mock leaves absent on some records:** `imageUrl` (1/7), `bannerImage` (3/7 missing), `gallery` (1/7), `practicalInfo` (3/7) — all correctly declared optional. **MISMATCH:** `status` is required but the source array is typed `Omit<Event, "status">`; and the type has **no** `createdAt`/`updatedAt`/`position`/`coverImage`. |
| `Publication` | `publications` (`publications.ts`) | Match on declared fields. **MISMATCH / GAP:** the type has **no `status` / `published` / `draft` / `position` / `coverImage` / `updatedAt`** field, so neither the mock nor a consumer typed as `Publication` can represent an unpublished item. `contentUrl` is documented as "video URL **or** image path" — a real union hidden in a single `string`. |
| `PageKey` | **NO MOCK ENTITY** | Only referenced by `StaticPage` (types) and by `EditablePage` (`lib/api/types.ts:178`). No mock page-content entity exists anywhere. |
| `StaticPage` | **NO MOCK ENTITY, AND NO API ENDPOINT** | **Orphan type.** `content: string` contradicts `EditablePage.content: Record<string, unknown>` (`lib/api/types.ts:179`), which the file itself flags: "À ne pas confondre avec `StaticPage` de `src/types` (dont `content` est une simple chaîne)". `getPage()` returns `EditablePage`, never `StaticPage`. |

## C.2 `src/lib/api/types.ts` — verbatim (183 lines), re-exports included

```ts
import type {
  Department,
  Event,
  EventStatus,
  PageKey,
  Publication,
  PublicationType,
} from "@/types";

export type {
  Department,
  Event,
  EventStatus,
  PageKey,
  Publication,
  PublicationType,
};

export type PublicationCategory = NonNullable<Publication["category"]>;

export type PublicationStatus = "DRAFT" | "PUBLISHED";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CollectionResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PublicationRecord extends Publication {
  status: PublicationStatus;
  coverImage?: string;
}

export interface Leader {
  id: string;
  name: string;
  role: string;
  /** Domaine veillé (département, service) — `null` si non renseigné. */
  scope: string | null;
  bio: string | null;
  /** URL publique du portrait — `null` si aucune photo n'est rattachée. */
  photo: string | null;
  /** `null` = responsable transversal, hors département. */
  departmentId: string | null;
  position: number;
}

export interface Testimony {
  id: string;
  photo: string;
  quote: string;
  name: string;
  role: string | null;
  position?: number;
}

export interface CommunityFace {
  id: string;
  photo: string;
  name: string;
  caption: string;
  position?: number;
}

export interface Scripture {
  id: string;
  /** Clé stable consommée par le frontend (`rassemblement`, `parole`…). */
  key: string;
  text: string;
  reference: string;
  translation: string;
  context: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleEntry {
  id: string;
  day: string;
  title: string;
  /** Libellé d'horaire déjà mis en forme (ex. « 16h30 – 18h30 »). */
  timeLabel: string;
  audience: string | null;
  /** Horaire confirmé par CCJV, par opposition à un horaire provisoire. */
  isConfirmed: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface SocialLink {
  label: string;
  href: string;
}

export interface SiteSettings {
  settings: Record<string, string>;
  socialLinks: SocialLink[];
}

export interface EditablePage {
  id: string;
  pageKey: PageKey | string;
  content: Record<string, unknown>;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}
```

| type | mock entity it corresponds to | mismatches vs the mock |
|---|---|---|
| re-exported `Department`, `Event`, `EventStatus`, `PageKey`, `Publication`, `PublicationType` | as in C.1 | identical objects, no new fields — `GET /departments` etc. are typed by the *frontend* types, so any server field absent from `@/types` is invisible to the client. |
| `PublicationCategory` | `publications[].category` | Same 4 values. **Duplicate alias:** `publications.ts:144` independently writes `NonNullable<Publication["category"]>` instead of importing this alias. |
| `PublicationStatus` | **NO MOCK ENTITY** (mock has no status) | Only carried by `PublicationRecord`. |
| `PaginationMeta` / `CollectionResponse<T>` | **no mock** | Transport wrapper; mock data is always a bare array. |
| `ApiErrorBody` | **no mock** | Declared but **never imported anywhere** (`grep`: only its own definition). |
| `PublicationRecord` | `publications` (`publications.ts`) | Adds `status` (required) and `coverImage?`. **MISMATCH:** the mock cannot produce either, so `PublicationRecord` is structurally satisfiable by mock data only if `status` is fabricated. Also no `position`/`updatedAt`. |
| `Leader` | `leaders` (`leaders.ts`, **unused module**) | **HARD MISMATCH — two incompatible `Leader` interfaces with the same name:** mock has `scope?: string`, `bio?: string`, `photo?: string` (optional, non-null); API has `scope: string \| null`, `bio: string \| null`, `photo: string \| null` **plus `departmentId: string \| null` and `position: number` which the mock lacks entirely**. The mock's `scope` is a free French label while the API's `scope` is nullable text *and* a real `departmentId` exists — the mock cannot be migrated without inventing ids. |
| `Testimony` | `testimonies` (`testimonies.ts`, **unused module**) | **MISMATCH:** mock `role: string` required vs API `role: string \| null`; API adds `position?: number` absent from the mock; mock has no nullable `photo`, whereas `endpoints.ts` declares a private `TestimonyPayload = Omit<Testimony,"photo"> & { photo: string \| null }` (line 202) precisely because the wire format differs from this type. |
| `CommunityFace` | `communityFaces` (`community.ts`) | **MISMATCH:** mock/API local interface vs this one — API adds `position?: number`; `endpoints.ts` again needs a private `CommunityFacePayload` with `photo: string \| null` (line 213). **Two exported `CommunityFace` types exist** (`data/mock/community.ts:8` and `lib/api/types.ts:117`); the component `CommunityFaces.tsx` imports the **mock** one. |
| `Scripture` | `verses` (`verses.ts`) | **MISMATCH:** mock is a *keyed object* `{ [key]: { text, reference } }` with no `id`, no `translation`, no `context`, no timestamps; the API type is a flat record whose `key` is the mock's object key. **No shared type exists** — `Verse` (mock) and `Scripture` (API) are unrelated, and no adapter code exists anywhere. |
| `ScheduleEntry` | `weeklyRhythm` (`site.ts`) | **HARD MISMATCH — field names differ:** mock `time: string` + `confirmed?: boolean` (absent = false) vs API `timeLabel: string` + `isConfirmed: boolean` (required) + `id`, `position`, `createdAt`, `updatedAt`. The mock has **no `id`** while the API requires one. Consequently `getSchedule()`'s `ScheduleEntry[]` **cannot be passed to `<WeekRhythm>`**, whose own prop type `RhythmItem` (`WeekRhythm.tsx:1`) requires `time: string`, `day`, `title`, `audience?` — so wiring `/schedule` today would require a mapping layer that does not exist. |
| `SocialLink` | `socials` (`site.ts`) | **DUPLICATE DECLARATION:** identical `{label, href}` interface exported from both `data/mock/site.ts:12` and `lib/api/types.ts:154`. |
| `SiteSettings` | `site` (`site.ts`) | **MISMATCH by construction:** mock `site` is a strongly-typed 13-key `as const` object; the API type models it as an untyped `settings: Record<string, string>`. So `site.visionary`, `site.address`, `site.scheduleAdults` have **no typed key** in `SiteSettings` — consuming `GET /settings` would downgrade every one of those reads to `string \| undefined` with no compile-time check on the key name. `socialLinks` does match `socials` exactly. |
| `EditablePage` | **NO MOCK ENTITY** | Orphan direction: the API has this; the mock side has nothing (and `StaticPage` is the incompatible leftover). |
| `PaginationMeta`, `CollectionResponse`, `ApiErrorBody` | **no mock** | Pure transport. `CollectionResponse.meta` is accepted but **never read by any consumer** — `readCollection()` (`endpoints.ts:69`) discards `meta` entirely, so **pagination metadata never reaches the UI**. |

### Flagged type-level issues (consolidated)
1. **Types with a mock but no mock consumer:** `Leader` (api), `Testimony` (both), `Scripture`, `ScheduleEntry`, `SiteSettings` — all five model data whose mocks are dead or whose API endpoints have zero call sites (see D).
2. **Mocks with no type:** `houseGroups`/`HouseGroup` (local type only, not in `@/types`), `images`/`photoPool`/`galleryImages` (bare `string`s, only `as const`), `site` (`as const`, no interface), `verses` (only the per-entry `Verse`, never the outer keyed map), `weeklyRhythm`/`RhythmEntry` and `socials`/`SocialLink` (local types only). **Four entity families exist only as mock-local interfaces** and would each need a new shared type to reach the API contract: `HouseGroup`, `RhythmEntry`, `Verse` (outer shape), `site`.
3. **Orphan/unused types:** `StaticPage` (no mock, no endpoint, contradicted by `EditablePage`); `ApiErrorBody` (never imported); `PageKey` (only used by the two page types).
4. **Duplicate names across layers:** `Leader` ×2, `Testimony` ×2, `CommunityFace` ×2, `SocialLink` ×2, `PublicationCategory` vs inline `NonNullable<Publication["category"]>`.
5. **No entity carries a `status`/`published`/`draft` field in mocks**; the only lifecycle enum (`PublicationStatus`) is API-only and never read by any page.

---

# DELIVERABLE D — API CLIENT

## D.1 `src/lib/api/client.ts` (333 lines)

**Base URL & env var names**
- `API_PREFIX = "/api/v1"` (line 29) — private const, **not exported**; the version is owned solely by `client.ts`.
- `getApiBaseUrl()` (line 79):
  ```ts
  const raw = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  return raw.trim().replace(/\/+$/, "");
  ```
  - Priority: **`API_URL`** → **`NEXT_PUBLIC_API_URL`** → hardcoded **`"http://localhost:4000"`**.
  - Trailing slashes stripped; trimmed.
  - `API_URL` is server-only (no `NEXT_PUBLIC_` prefix) — the doc states it "peut pointer vers un nom d'hôte interne … donc sans être exposée au navigateur".
- `buildApiUrl(path)` (line 94): normalises a missing leading `/`; if the path already equals `/api/v1` or starts with `/api/v1/`, the prefix is **not** added again; otherwise returns `${base}/api/v1${path}`. So endpoints pass paths relative to `/api/v1`.
- `withQuery(path, params)` (line 104): builds `URLSearchParams`; **skips `undefined`, `null` and `""`**; keeps `false` and `0` (serialised as `"false"`/`"0"`); returns the bare path when the query is empty.

**Fetch wrapper behaviour**
- `DEFAULT_TIMEOUT_MS = 5_000` (line 23); `PUBLIC_REVALIDATE_SECONDS = 60` (line 26).
- Two entry points sharing one private `request<T>()`:
  - `apiFetch<T>(path, options)` → `request(path, options, false)` — **never throws on transport failure**; returns `null`.
  - `apiFetchOrThrow<T>(path, options)` → `request(…, true)` — throws `ApiError`; described as "réservée au futur back-office". **It is never called anywhere** (grep: only its definition and its export).
- Method: `(rest.method ?? "GET").toUpperCase()`; `isRead = method === "GET" || method === "HEAD"`.
- **Body handling:** for a read method (GET/HEAD) the body is **silently discarded** — `if (!isRead) { … init.body = serialized }`. For writes, `serializeBody` passes through `string`, `FormData`, `URLSearchParams`, `Blob`, `ArrayBuffer`/typed arrays and `JSON.stringify`s anything else.
  - ⚠️ **Header bug worth flagging:** `Content-Type: application/json` is added whenever `body` is non-null **regardless of body kind** (lines 245-251) — a `FormData` or `Blob` body would be sent with a JSON content type.
- Headers: `Accept: application/json` always; caller `headers` are spread **last**, so a caller can override both.
- **Cache/revalidate:** Next-specific `init.next = { revalidate: cacheRevalidate }` where
  `cacheRevalidate = revalidate ?? (isRead ? 60 : 0)`.
  - Reads default to **60 s ISR**; writes default to **0 (no cache)**; a caller may pass `revalidate: false` to opt out.
  - `NextCacheConfig` also declares `tags?: string[]`, but **`next.tags` is never populated anywhere** — no `revalidateTag`/tag-based invalidation exists.
  - There is **no `cache: "no-store"`, no `cache: "force-cache"`, no `next: { revalidate }` override on any endpoint call**; every endpoint uses the default.
- **Timeout:** `resolveSignal(timeoutMs, external)` (line 141) uses `AbortSignal.timeout(timeoutMs)` when available, combined with the caller's signal via `AbortSignal.any([timeout, external])` when available. **Fallbacks that silently weaken the guarantee:** if `AbortSignal.timeout` is missing it returns `external ?? new AbortController().signal` (**no timeout at all**); if `AbortSignal.any` is missing it returns **`external` only** — again losing the timeout.
- **Error handling**
  - `ApiError` (line 58): `readonly status: number | null`, `readonly code: string`, `name = "ApiError"`. Documented codes: `HTTP_ERROR`, `NETWORK_ERROR`, `INVALID_JSON`. `status` is `null` when the request never completed.
  - Fetch-throw path: `unstable_rethrow(error)` (from `next/navigation`, imported line 20) is called **first**, so Next control-flow errors (redirect/`notFound`/dynamic-usage) propagate even in tolerant mode; only then `handleFailure(propagate, null, "NETWORK_ERROR", "échec de l'appel à ${path} (${getApiBaseUrl()})", error)`.
  - Non-2xx: `readErrorDetail()` reads the body, tries `{ error: { message } }`, falls back to the first **200 chars** of raw text; message = `HTTP ${status} sur ${path} — ${detail}`; code `HTTP_ERROR`; carries the real `response.status`.
  - Tolerant path: `logApiIssue(message, error)` → `console.warn("[api] …")` and returns `null`. `describeError` maps a `TimeoutError` DOMException to `"délai d'attente dépassé"`.
  - Body read is guarded by `readTextSafely` (never throws). Empty/whitespace body → **`null`** ("Corps vide (204, proxy sans contenu) : aucune donnée, mais pas une erreur"). JSON parse failure → code `INVALID_JSON`, carries `response.status`.
  - ⚠️ **Doc/code mismatch:** the JSDoc for `apiFetchOrThrow` says "Un corps vide (204) se traduit par `undefined`", but the implementation returns `null` in that case (`request` returns `null`, `apiFetchOrThrow` returns `result as T`).
  - **No retry, no backoff, no circuit breaker, no request deduplication, no request-scoped logging beyond `console.warn`, no `Retry-After` handling.**
- **AUTH / TOKEN HANDLING: NONE.** There is **no `Authorization` header, no `credentials:` option, no cookie/`Cookie` forwarding, no API key, no bearer token, no CSRF token, no refresh logic** anywhere in `client.ts` (or in `endpoints.ts`). Every call is an anonymous, cookie-less server-side fetch. The only auth-adjacent concept is the commented "future back-office" note on `apiFetchOrThrow`.
- Exported symbols: `ApiFetchOptions` (interface, extends `Omit<RequestInit, "body" | "signal">` with `body?: BodyInit | Record<string, unknown> | null`, `signal?: AbortSignal`, `revalidate?: number | false`, `timeoutMs?: number`), `QueryValue = string | number | boolean | undefined | null`, `ApiError`, `getApiBaseUrl`, `buildApiUrl`, `withQuery`, `logApiIssue`, `apiFetch`, `apiFetchOrThrow`. (`NextCacheConfig`, `DEFAULT_TIMEOUT_MS`, `PUBLIC_REVALIDATE_SECONDS`, `API_PREFIX`, `resolveSignal`, `serializeBody`, `readTextSafely`, `readErrorDetail`, `handleFailure`, `request`, `describeError` are module-private.)

## D.2 `src/lib/api/endpoints.ts` (320 lines) — every endpoint verbatim

Shared constant: `REFERENCE_LIMIT = 100` ("L'API plafonne `limit` à 100").

Private helpers: `readCollection<T>(payload)` — returns `[]` for `null`, the array itself if already an array (tolerates a proxy that stripped the envelope), else `payload.data` if it is an array, else `[]`; **`meta` is discarded**. `isRecord(value)`. `keepWithPortrait<T extends {id; photo: string|null}>(items, resource)` — drops entries whose `photo` is not a non-empty string and logs `"${resource} ${item.id} ignoré : aucun portrait rattaché côté API"`.

**Départements**
| fn | line | HTTP | path | params | response type |
|---|---|---|---|---|---|
| `getDepartments()` | 115 | GET | `/departments` | `?limit=100` | `CollectionResponse<Department> \| Department[]` → `Department[]` |
| `getDepartment(slug)` | 124 | GET | `/departments/${encodeURIComponent(slug)}` | — | `Department \| null` |

**Événements**
| fn | line | HTTP | path | params | response type |
|---|---|---|---|---|---|
| `getEvents(query = {})` | 138 | GET | `/events` | `status`, `departmentId`, `page`, `limit`, `sort` (all omitted when `undefined`/`null`/`""` via `withQuery`) | `CollectionResponse<Event> \| Event[]` → `Event[]` |
| `getEvent(slug)` | 153 | GET | `/events/${encodeURIComponent(slug)}` | — | `Event \| null` |

`EventsQuery` (verbatim, line 32): `status?: EventStatus`, `departmentId?: string`, `page?: number`, `limit?: number`, `sort?: string` (doc: "Colonne de tri (`event_date`, `-event_date`, `created_at`…)"). The file states `status` is **calculated by the API** from `eventDate` — "le frontend ne recalcule jamais l'état d'un événement reçu de l'API".

**Publications**
| fn | line | HTTP | path | params | response type |
|---|---|---|---|---|---|
| `getPublications(query = {})` | 162 | GET | `/publications` | `type`, `category`, `page`, `limit`, `sort` | `CollectionResponse<PublicationRecord> \| PublicationRecord[]` → `PublicationRecord[]` |
| `getPublication(slug)` | 181 | GET | `/publications/${encodeURIComponent(slug)}` | — | `PublicationRecord \| null` |

`PublicationsQuery` (line 42): `type?: PublicationType`, `category?: PublicationCategory`, `page?: number`, `limit?: number`, `sort?: string`.

**Responsables / Témoignages / Visages**
| fn | line | HTTP | path | params | response | post-processing |
|---|---|---|---|---|---|---|
| `getLeaders()` | 194 | GET | `/leaders` | `?limit=100` | `CollectionResponse<Leader> \| Leader[]` → `Leader[]` | — |
| `getTestimonies()` | 205 | GET | `/testimonies` | `?limit=100` | `CollectionResponse<TestimonyPayload> \| TestimonyPayload[]` | `keepWithPortrait(..., "témoignage")` — **entries with `photo: null` are dropped** |
| `getCommunityFaces()` | 218 | GET | `/community-faces` | `?limit=100` | `CollectionResponse<CommunityFacePayload> \| CommunityFacePayload[]` | `keepWithPortrait(..., "visage de la communauté")` |

Private wire types: `TestimonyPayload = Omit<Testimony,"photo"> & {photo: string|null}` (line 202); `CommunityFacePayload = Omit<CommunityFace,"photo"> & {photo: string|null}` (line 213).

**Rythme hebdomadaire et versets**
| fn | line | HTTP | path | params | response type |
|---|---|---|---|---|---|
| `getSchedule()` | 238 | GET | `/schedule` | **none** — deliberately no `?limit`: the doc states the endpoint's strict query object now rejects `?limit=…` with `400 VALIDATION_ERROR` | `CollectionResponse<ScheduleEntry> \| ScheduleEntry[]` → `ScheduleEntry[]` |
| `getScriptures()` | 252 | GET | `/scriptures` | **none** (same 400 rationale) | `CollectionResponse<Scripture> \| Scripture[]` → `Scripture[]` |
| `getScripture(key)` | 261 | GET | `/scriptures/${encodeURIComponent(key)}` | — | `Scripture \| null` |

**Réglages et pages éditables**
| fn | line | HTTP | path | params | response type |
|---|---|---|---|---|---|
| `getSettings()` | 275 | GET | `/settings` | — | `SiteSettings \| null` |
| `getPage(pageKey)` | 304 | GET | `/pages/${encodeURIComponent(pageKey)}` | — | `EditablePage \| null` |

`getSettings()` re-validates: non-record payload → `null`; `payload.settings` filtered to **string** values only; `payload.socialLinks` rebuilt via `flatMap` keeping only entries with both `label` and `href` as strings. Returns `{ settings, socialLinks }`.
`getPage(pageKey)` re-validates and **normalises**: `content` → `{}` if not a record; `id`/`pageKey` → `pageKey` fallback; `updatedBy` → `null`; `createdAt`/`updatedAt` → `""`. **The other 11 endpoints have no runtime shape validation — they trust the JSON and cast it (`JSON.parse(text) as T`).**

**Complete endpoint inventory:** 13 functions, **13 GETs, zero POST/PUT/PATCH/DELETE**. Write verbs are reachable only through raw `apiFetch`/`apiFetchOrThrow` with an explicit `method`, and **nothing in `src` does that**.

## D.3 `src/lib/api/index.ts` (44 lines) — exports
- From `./client`: `ApiError`, `apiFetch`, `apiFetchOrThrow`, `buildApiUrl`, `getApiBaseUrl`, `logApiIssue`, `withQuery`, `type ApiFetchOptions`, `type QueryValue`.
- From `./endpoints`: `getCommunityFaces`, `getDepartment`, `getDepartments`, `getEvent`, `getEvents`, `getLeaders`, `getPage`, `getPublication`, `getPublications`, `getSchedule`, `getScripture`, `getScriptures`, `getSettings`, `getTestimonies`, `type EventsQuery`, `type PublicationsQuery`.
- `export type * from "./types"` — re-exports **all** of `api/types.ts` (C.2).
- Note: `API_PREFIX` is **not** exported; `NextCacheConfig` is **not** exported.
- The header JSDoc states: "Aucune fonction de ce module ne lève d'exception réseau : les pages publiques peuvent appeler les endpoints sans `try/catch`."

## D.4 CRITICAL — who actually calls the backend API

`grep` for `@/lib/api` over the whole `frontend/src` tree → **11 matches, of which 1 is a doc comment inside `lib/api/index.ts` itself**. **The API client IS wired: 10 application files import it.** There is **no file that imports `@/lib/api/client` or `@/lib/api/endpoints` directly** — every consumer goes through the barrel.

| # | consumer file:line | imported symbols | call sites |
|---|---|---|---|
| 1 | `src/app/page.tsx:19-24` | `getCommunityFaces, getDepartments, getEvents, getPublications` | `:43-48` `Promise.all`: `getEvents({status:"UPCOMING",limit:6})`, `getPublications({category:"ENSEIGNEMENT",limit:3})`, `getCommunityFaces()`, `getDepartments()` |
| 2 | `src/app/organisation/page.tsx:4` | `getDepartments, getLeaders` | `:21-24` `Promise.all([getDepartments(), getLeaders()])`; `:27` `const [leadPastor, ...teamLeaders] = leaders` |
| 3 | `src/app/vie-de-leglise/evenements/page.tsx:6` | `getDepartments, getEvents` | `:24-28` `getEvents({status:"UPCOMING",limit:50})`, `getEvents({status:"ARCHIVED",sort:"-event_date",limit:50})`, `getDepartments()`; `:34-36` builds `departmentNames` |
| 4 | `src/app/vie-de-leglise/evenements/[slug]/page.tsx:10` | `getDepartments, getEvent, getEvents` | `:26` `getEvents({limit:100})` in `generateStaticParams`; `:44` and `:63` `getEvent(slug)`; `:67-68` `getDepartments()`, `getEvents({status:"UPCOMING",limit:4})` |
| 5 | `src/app/publications/[slug]/page.tsx:13-16` | `getPublication, getPublications` | `:71` `getPublications({limit:100})` in `generateStaticParams`; `:89`, `:107` `getPublication(slug)`; `:119` `getPublications({category,limit:8})`, `:120` `getPublications({type,limit:8})` |
| 6 | `src/app/publications/actualites/page.tsx:8` | `getPublications` | `:28-29` `getPublications({category:"ACTUALITE",limit:50})`, `getPublications({limit:50})` |
| 7 | `src/app/publications/enseignements/page.tsx:11` | `getPublications` | `:43` `getPublications({category:"ENSEIGNEMENT",limit:50})` |
| 8 | `src/app/publications/mediatheque/page.tsx:10` | `getPublications` | `:24-25` `getPublications({category:"MEDIA",limit:50})`, `getPublications({category:"ENSEIGNEMENT",limit:1})` |
| 9 | `src/app/publications/ressources/page.tsx:8` | `getPublications` | `:55` `getPublications({category:"RESSOURCE",limit:50})` |
| 10 | `src/app/communaute/temoignages/page.tsx:13` | `getTestimonies` | `:55` `await getTestimonies()`; `:56` `const [lead, ...others] = testimonies` |

**Endpoints exported but with ZERO call sites in `src/app`/`src/components`:**
- `getDepartment(slug)` — **unused** (no department detail route exists).
- `getSchedule()` — **unused**; the homepage still renders the **mock** `weeklyRhythm` (`app/page.tsx:161`).
- `getScriptures()` / `getScripture(key)` — **unused**; every scripture on the site still comes from the **mock** `verses` (6 files).
- `getSettings()` — **unused**; every institutional value still comes from the **mock** `site` (15 files).
- `getPage(pageKey)` — **unused**; there is no page-content consumer anywhere.
- `apiFetchOrThrow`, `apiFetch`, `buildApiUrl`, `getApiBaseUrl`, `withQuery`, `logApiIssue`, `ApiError` — **unused outside `lib/api` itself** (no page imports them).

**Pages still 100% mock-driven with no API call at all** (they import **only** mocks): `src/app/qui-sommes-nous/page.tsx`, `src/app/communaute/groupes-de-maison/page.tsx`, `src/app/communaute/parcours-nouveau/page.tsx`, `src/app/communaute/priere-et-intercession/page.tsx`, `src/app/vie-de-leglise/ou-nous-trouver/page.tsx`, `src/app/vie-de-leglise/faire-un-don/page.tsx`, `src/app/recherche/page.tsx`, `src/app/sitemap.ts`, plus every legal page (`mentions-legales`, `confidentialite`, `conditions`, `accessibilite`).

**Mixed pages (API display data + mock chrome)** — the common pattern is "content from API, identity/imagery from mocks": `app/page.tsx`, `organisation/page.tsx`, both `evenements` routes, all five `publications` routes, `communaute/temoignages/page.tsx`.

**Search & sitemap are still 100% mock** — `recherche/page.tsx` and `sitemap.ts` build their indexes from `events`/`departments`/`publications` mocks, so as soon as the API becomes authoritative, **search results and the sitemap will diverge from the rendered pages** (and `sitemap.ts` will keep advertising the 7 fake slugs). Note also `recherche` only uses `primaryNav` for "Page" entries, so API-added pages do not appear either.

## D.5 `.env.example` and `.env.local` — variable names only (no secret values printed)

| variable | `.env.example` | `.env.local` | notes |
|---|---|---|---|
| `API_URL` | **set** (non-empty) | **set** (non-empty value; the file's comment says it points at the deployed Railway service, with a commented-out `http://localhost:4000` alternative) | server-only; highest priority in `getApiBaseUrl()` |
| `NEXT_PUBLIC_API_URL` | **set** (non-empty) | **set** (non-empty) | browser fallback; "Repli navigateur (non utilisé par les Server Components)" |
| `NEXT_PUBLIC_SITE_URL` | **set** (non-empty) | **set** (non-empty) | consumed only by `src/lib/seo.ts:9` |

- **No secret-bearing variable exists** in either file: there is **no token, key, secret, password, service-role or connection-string variable** — which matches the client's total absence of auth handling.
- `.env.local` **overrides `API_URL` to the remote deployment**, so "local development" hits production API data while the frontend shell stays local.
- Referenced env vars in code, complete set: `process.env.API_URL`, `process.env.NEXT_PUBLIC_API_URL` (`client.ts:81-82`), `process.env.NEXT_PUBLIC_SITE_URL` (`seo.ts:9`). No other `process.env` access exists in `frontend/src`.
- `.env.example` also carries the rule "tout ce qui commence par `NEXT_PUBLIC_` est exposé au navigateur", and both files say never to commit secrets.

## D.6 `next.config.mjs` (16 lines)
```js
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
};
```
- **No `rewrites`, no `redirects`, no `headers`, no `env`, no `i18n`, no `output: "export"`, no `serverActions` config, no CSP.** The browser/server therefore calls the API host directly — there is **no `/api/v1` proxy through the Next app**.
- `**.supabase.co` is whitelisted although **no mock, page or type in `frontend/src` contains a Supabase URL** — evidence that API-side media is expected to be absolute Supabase Storage URLs, i.e. a **second, unmodelled image source** alongside the `/media/*.jpeg` mocks. `images.predication`-style local paths and API absolute URLs must coexist in the same `next/image` consumers (all `images.ts` uses are `??`-fallback chains precisely because of this).

---

# DELIVERABLE E — NAVIGATION MODEL (`src/lib/nav.ts`, 219 lines)

Types verbatim:
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
**Explicitly absent from both interfaces: no `icon` field, no `badge` field, no `visible`/`hidden` field, no `role`, `permission`, `scope` or `auth` field, no `order`/`position`, no `external` flag, no `target`.** There is **no role/permission gating of any kind** in the navigation model — conditional visibility is expressed **only** by the boolean `ready` flag and by the presence/absence of `href`.

## `mainNav: NavItem[]` (line 37) — full tree verbatim
```
1. { href: "/", label: "Accueil", ready: true }
2. { href: "/qui-sommes-nous", label: "Qui sommes-nous",
     description: "Notre histoire, notre foi et notre vision.", ready: true }
3. { label: "Vie de l'Église",                       // ← NO href (regroupement)
     description: "Quand et où nous rassembler.", ready: true,
     children: [
       { href: "/vie-de-leglise/evenements",       label: "Nos événements",
         description: "Cultes, rencontres et temps forts.", ready: true },
       { href: "/vie-de-leglise/ou-nous-trouver",  label: "Où nous trouver",
         description: "Adresse, horaires, accès et contact.", ready: true },
       { href: "/vie-de-leglise/faire-un-don",     label: "Faire un don",
         description: "Soutenir l'œuvre de l'église.", ready: true },
     ] }
4. { label: "Notre communauté",                      // ← NO href (regroupement)
     description: "Des personnes, pas des rubriques.", ready: true,
     children: [
       { href: "/communaute/groupes-de-maison",        label: "Groupes de maison",
         description: "La fraternité de proximité.", ready: true },
       { href: "/communaute/parcours-nouveau",         label: "Parcours nouveau",
         description: "Vos premiers pas parmi nous.", ready: true },
       { href: "/communaute/priere-et-intercession",   label: "Prière & intercession",
         description: "Déposer une demande de prière.", ready: true },
       { href: "/communaute/temoignages",              label: "Témoignages",
         description: "Ce que Dieu a fait parmi nous.", ready: true },
     ] }
5. { href: "/organisation", label: "Organisation",
     description: "Une communauté portée par ceux qui servent.", ready: true }
6. { label: "Ressources",                            // ← NO href (regroupement)
     description: "Actualités, enseignements, médiathèque.", ready: true,
     children: [
       { href: "/publications/actualites",    label: "Actualités",
         description: "Nouvelles et annonces.", ready: true },
       { href: "/publications/enseignements", label: "Enseignements",
         description: "Sermons et prédications.", ready: true },
       { href: "/publications/mediatheque",   label: "Médiathèque",
         description: "Photos et vidéos.", ready: true },
       { href: "/publications/ressources",    label: "Ressources & Guides",
         description: "Guides et documents.", ready: true },
     ] }
```
Structure: **6 top-level items** — 3 with `href` (`/`, `/qui-sommes-nous`, `/organisation`), **3 regrouping pillars without `href`** (`"Vie de l'Église"`, `"Notre communauté"`, `"Ressources"`) — and **11 leaf children** across those 3 pillars. **Every single item and child is `ready: true`; there is no unreleased/hidden entry in the tree.**

## Derived exports
- `primaryNav: NavItem[]` (line 141) — `mainNav.filter(item => item.ready).map(item => ({...item, children: item.children?.filter(child => child.ready)}))`. **Today this is a full copy of `mainNav`** (everything is `ready`), but it is *not* a reference: it is a new object graph. Note it **drops `ready` filtering only at those two levels** and that a pillar whose `children` all become unready will still appear as an empty label.
- `allDestinations: NavChild[]` (line 152) — `mainNav.flatMap(item => [...(item.href ? [{href: item.href, label: item.label}] : []), ...(item.children ?? [])])` → **14 items** (3 top-level hrefs + 11 children), **`description` and `ready` are dropped** on the top-level entries and preserved on children. Pillars without `href` are naturally excluded; not imported anywhere (dead export — navigation consumers use `primaryNav`/`mainNav`/`legalNav`).
- `legalNav: NavChild[]` (line 158) — verbatim:
  ```ts
  { href: "/mentions-legales", label: "Mentions légales" }
  { href: "/confidentialite",  label: "Confidentialité" }
  { href: "/conditions",       label: "Conditions" }
  { href: "/accessibilite",    label: "Accessibilité" }
  { href: "/recherche",        label: "Recherche" }
  ```
  All 5 have `href` and **no `description`, no `ready` flag** (so they are always considered available).

## `getBreadcrumbs(pathname): Crumb[]` (line 179)
`export interface Crumb { label: string; href?: string }` (line 170). Behaviour verbatim:
1. `pathname === "/"` → `[]`.
2. `pathname === "/organisation"` → `[{ href: "/organisation", label: "Organisation" }]` (hardcoded special case, because `/organisation` is a pillar with both an `href` and no children).
3. For each `mainNav` item (skipping `/`): exact-or-prefix `href` match → single crumb. Then for each child: exact-or-prefix match → **two crumbs** (pillar label, `href` only if the pillar has one, plus the child). Then the fallback: `const pillarSegment = item.children?.[0]?.href.split("/")[1]` and if `pathname.startsWith('/' + pillarSegment + '/')` → **one crumb** (pillar only) — this catches detail pages such as `/publications/[slug]`, `/vie-de-leglise/evenements/[slug]`.
4. Otherwise a `legalNav` exact-`href` lookup → single crumb.
5. Otherwise `[]` — **any route not in the nav tree yields no breadcrumbs at all** (e.g. `/recherche` matches only via step 4).

⚠️ **Fragility:** the step-3 fallback derives the section from `children[0].href.split("/")[1]`, i.e. the **first child of the pillar**. For `"Vie de l'Église"` the first child is `/vie-de-leglise/evenements` → segment `vie-de-leglise`; for `"Notre communauté"` → `communaute`; for `"Ressources"` → `publications`. So a bare detail route like `/publications/xxx` is attributed to the **Ressources** pillar. This assumes the first child's URL segment represents the whole pillar, which holds today but is not an explicit invariant of the model.

**No `icon`, `badge`, `role`, `permission`, `order` or `hidden` property exists anywhere in the navigation tree** — there is nothing to report for those.

---

# CROSS-CUTTING FINDINGS (evidence summary)

1. **The API client is fully wired for the core content routes** (10 consumer files, 21 call sites) — events, publications, department/leader lists, community faces and testimonies come from the network. **But 5 endpoints are exported and never called**: `getSchedule`, `getScriptures`, `getScripture`, `getSettings`, `getPage` (+ `getDepartment`). Those five content families therefore **still come from mocks**: weekly rhythm (`site.schedule*`, `weeklyRhythm`), verses (`verses`), institutional identity (`site`), socials (`socials`), page content (nothing).
2. **A "mock fallback chain" pattern is pervasive** — `images.* || "/media/ccjv-XX.jpeg"` appears in `FullscreenMenu` (6×), `VerseSection` (4×), `priere-et-intercession` (4×), `parcours-nouveau` (5×), `faire-un-don` (11×), `ou-nous-trouver` (2×), `organisation` (4×). The literal fallback strings duplicate the `images` map, so the same path is written twice in two places.
3. **Two mock modules are entirely dead** (`leaders.ts`, `testimonies.ts` — never imported) and **six exports are dead** (`leadPastor`, `choraleSchedule`, `getEventBySlug`, `getDepartmentBySlug`, `getPublicationBySlug`, `getPublicationsByCategory`), plus **2 unused imports** (`departments` in `sitemap.ts`, `weeklyRhythm` in `ou-nous-trouver/page.tsx`).
4. **Search and sitemap read mocks exclusively** while the pages they index read the API — guaranteed divergence, including 7 fake event slugs and 10 fake publication slugs in `sitemap.xml`.
5. **No `status`/`draft`/`published` field exists on any mock entity**, and the only lifecycle enum is API-only (`PublicationStatus`), never read by a page.
6. **Type/mock mismatches are concentrated in the "coordination" entities**: `Leader` (mock lacks `departmentId`/`position`; `scope` is a French label, not an id), `ScheduleEntry` (`timeLabel`/`isConfirmed` vs mock `time`/`confirmed`, mock has no `id`), `SiteSettings` (untyped `Record` vs a 13-key typed object), `Scripture` vs the keyed `verses` map, `Testimony`/`CommunityFace` (nullable `photo` on the wire, hence the private `*Payload` types and the silent drop of portrait-less entries).
7. **The backend cannot be the source of truth for images yet**: `/media/ccjv-*.jpeg` local paths are hardcoded in 21 files, while `next.config.mjs` already whitelists `**.supabase.co` for absolute API media — two image universes with no shared model.
8. **Zero authentication surface** in the client: no token, no cookie, no credentials, no key; and no secret-bearing env var in either env file.
9. **Unsafe defaults in `client.ts`**: missing `AbortSignal.any` silently drops the 5 s timeout (returns the external signal only, or no signal at all); `Content-Type: application/json` is forced even for `FormData`/`Blob` bodies; GET/HEAD bodies are silently discarded; the documented 204→`undefined` behaviour is actually 204→`null`; `next.revalidate` defaults to 60 s for all reads with no tag-based invalidation.
10. **Non-deterministic mock data**: `events[].eventDate` and `publications[].publishedAt` are computed from `daysFromNow()` at module evaluation, so `status` counts, `upcomingEvents`, `archivedEvents` and every rendered date change with the clock/build. `status` is `UPCOMING`/`ARCHIVED` **only relative to today**; the mock has no fixed date anywhere.
