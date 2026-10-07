# 04 — BACKEND: ground-truth evidence extraction

**Scope:** `C:\Users\HP\desktop\PROJETS 2026\CCJV-CHURCH\backend` — Express 5 + TypeScript + Drizzle ORM + Supabase.
**Method:** read-only. Every claim below is derived from source that was read, not from documentation. Where `docs/` and code conflict, **the code is reported and the conflict is flagged**.
**Rule applied:** all identifiers, enum values, route paths, setting keys and slugs are copied VERBATIM. Absences are stated explicitly as **MISSING**.

**Files read in full:** all 10 Drizzle schema files; `drizzle/0000_elite_pretty_boy.sql`; `drizzle/meta/_journal.json`; `domain/{entities,repositories,rules/event-status,content/page-content}`; all 14 modules' `.routes.ts/.schema.ts/.service.ts/.serializer.ts/.controller.ts`; `presentation/middlewares/{auth,validate,error-handler}`; `presentation/types/express.d.ts`; `presentation/openapi/{document,generate}`; `infrastructure/supabase/{auth,storage}`; all 14 Drizzle repositories; `shared/{errors/app-error,http/pagination,http/respond,utils/slug,utils/file-signature}`; `infrastructure/database/{seed,seed-data}`; `app.ts`; `container.ts`; `server.ts`; `config/env.ts`; `scripts/create-admin.ts`; `backend/README.md`; `backend/docs/IMPLEMENTATION_SPEC.md`; all 16 test files; `package.json`; `openapi.json` (structure only, via JSON parsing — not read as raw text).

---

## 0. HEADLINE FINDINGS

1. **Exactly ONE role exists in the entire system: `ROLE_ADMIN`.** `admin_role` is a single-value PostgreSQL enum. There is **no second role**, no `ROLE_DEPARTMENT_EDITOR`, no permission table, no permission list, no claims-based authorization, and **no scope mechanism of any kind**.
2. **Department-scoped managers are IMPOSSIBLE to express in code.** `admin_profiles` has **no `department_id` column**, no scope column, and no join table. `AdminRole = "ROLE_ADMIN"` is the sole role type. The word `scope` exists on the `leaders` table only, as a free-text *display* field (e.g. `"Chorale"`), never as an authorization input.
3. **There is NO publications archive rule and NO recency threshold anywhere in the backend.** No cutoff, no N-month window, no `expiresAt`/`archivedAt`, no `ARCHIVED` publication status, no date-window filter. Recency is an **ordering convention only** (`ORDER BY published_at DESC, id ASC`). The only "recency/archive" logic in the whole backend belongs to **events** and is purely derived from `event_date`.
4. **The draft→published→archived workflow exists only partially in code.** `DRAFT` and `PUBLISHED` both exist and are enforced (drafts are invisible publicly, doubly enforced). **`ARCHIVED` does not exist for publications** in code, in the enum, or in the DB. `ARCHIVED` exists only as the *computed* status of a past **event**.
5. **Public unauthenticated `GET /api/v1/pages/:pageKey` leaks the admin UUID** in the `updatedBy` field, while the serializer's own comment says it is "jamais une donnée d'affichage public".
6. **No Postgres constraint-violation mapping exists anywhere.** A slug-uniqueness race or any FK violation reaches the client as **500 `INTERNAL_ERROR`** instead of 409/4xx, even though `DuplicateSlugError`/`ConflictError` exist for the pre-check path.
7. **No audit log**, **no versioning/optimistic concurrency**, **no soft delete** anywhere. The only actor columns in the whole schema are `media.uploaded_by` and `static_pages.updated_by`.

---

## 1. DATABASE SCHEMA (Drizzle)

Source: `backend/src/infrastructure/database/schema/{enums,admin,media,departments,events,publications,people,editorial,prayer-requests,index}.ts`.
`index.ts` re-exports, verbatim: `./enums, ./admin, ./media, ./departments, ./events, ./publications, ./people, ./editorial, ./prayer-requests`.

**16 tables. 6 PostgreSQL enums.**

### 1.1 Enum definitions (all literals verbatim) — `enums.ts`

| Enum (PG type name) | Literals, verbatim | Used by |
|---|---|---|
| `admin_role` | `"ROLE_ADMIN"` | `admin_profiles.role` |
| `publication_type` | `"VIDEO"`, `"PHOTO"`, `"TEXTE"` | `publications.type` |
| `publication_category` | `"ACTUALITE"`, `"ENSEIGNEMENT"`, `"MEDIA"`, `"RESSOURCE"` | `publications.category` |
| `publication_status` | `"DRAFT"`, `"PUBLISHED"` | `publications.status` |
| `prayer_confidentiality` | `"private"`, `"community"` | `prayer_requests.confidentiality` |
| `prayer_status` | `"NEW"`, `"PRAYED"` | `prayer_requests.status` |

Source comment, verbatim (relevant to the role question): *"`admin_role` est un enum à valeur unique en V1, mais un enum PostgreSQL : ajouter `ROLE_DEPARTMENT_EDITOR` se fera par `ALTER TYPE ... ADD VALUE`, sans migration destructrice (docs/004 §24)."* — i.e. **a second role is documented as future work only; it does not exist**.

**MISSING enums:** no `event_status` PG enum (event status is computed in TypeScript, never persisted); no `setting_type`; no `page_status`.

---

### 1.2 `admin_profiles` — 7 columns

| Column | Type | Null | Default |
|---|---|---|---|
| `id` | `uuid` | NOT NULL | — (**PK**) |
| `username` | `varchar(50)` | NOT NULL | — |
| `display_name` | `varchar(120)` | NULL | — |
| `role` | `admin_role` | NOT NULL | `'ROLE_ADMIN'` |
| `is_active` | `boolean` | NOT NULL | `true` |
| `created_at` | `timestamp with time zone` | NOT NULL | `now()` |
| `updated_at` | `timestamp with time zone` | NOT NULL | `now()` + `$onUpdate(() => new Date())` |

PK: `id`. FK: **none inside Drizzle** — comment verbatim: *"Égale à `auth.users.id` : la FK est gérée hors Drizzle (schéma `auth`)."*
Indexes: `uniqueIndex("admin_profiles_username_lower_idx").on(sql\`lower(${table.username})\`)`; `index("admin_profiles_role_idx").on(table.role)`.
**MISSING: `department_id` / any scope column. MISSING: password_hash (deliberate — auth delegated to Supabase Auth). MISSING: email, last_login, created_by.**

### 1.3 `media` — 11 columns

| Column | Type | Null | Default |
|---|---|---|---|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` (**PK**) |
| `bucket` | `varchar(100)` | NOT NULL | — |
| `path` | `text` | NOT NULL | — (**UNIQUE**) |
| `public_url` | `text` | NOT NULL | — |
| `mime_type` | `varchar(100)` | NOT NULL | — |
| `size_bytes` | `integer` | NOT NULL | — |
| `width` | `integer` | NULL | — |
| `height` | `integer` | NULL | — |
| `alt` | `text` | NULL | — |
| `uploaded_by` | `uuid` | NULL | — |
| `created_at` | `timestamp with time zone` | NOT NULL | `now()` |

PK: `id`. Unique: `media_path_unique` on `(path)`.
FK: `uploaded_by` → `admin_profiles(id)` **ON DELETE set null**.
Indexes: `media_uploaded_by_idx`, `media_created_at_idx`.
Note: **no `caption`, no `credit`, no `folder` column** (the folder is parsed from `path` at serialization time).

### 1.4 `departments` — 12 columns

| Column | Type | Null | Default |
|---|---|---|---|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` (**PK**) |
| `name` | `varchar(100)` | NOT NULL | — |
| `slug` | `varchar(160)` | NOT NULL | — (**UNIQUE**) |
| `description` | `text` | NULL | — |
| `responsible_name` | `varchar(120)` | NULL | — |
| `tagline` | `varchar(200)` | NULL | — |
| `meeting_schedule` | `varchar(255)` | NULL | — |
| `key_points` | `text[]` | NULL | — |
| `banner_media_id` | `uuid` | NULL | — |
| `position` | `integer` | NOT NULL | `0` |
| `created_at` | `timestamp with time zone` | NOT NULL | `now()` |
| `updated_at` | `timestamp with time zone` | NOT NULL | `now()` + `$onUpdate` |

PK: `id`. Unique: `departments_slug_idx` on `(slug)`.
FK: `banner_media_id` → `media(id)` **ON DELETE set null**.
Indexes: `departments_slug_idx` (unique), `departments_position_idx`.

### 1.5 `department_media` — 3 columns (join table)

| Column | Type | Null | Default |
|---|---|---|---|
| `department_id` | `uuid` | NOT NULL | — |
| `media_id` | `uuid` | NOT NULL | — |
| `position` | `integer` | NOT NULL | `0` |

PK: composite `(department_id, media_id)` → `department_media_department_id_media_id_pk`.
FKs: `department_id` → `departments(id)` **ON DELETE cascade**; `media_id` → `media(id)` **ON DELETE restrict**.
Index: `department_media_position_idx` on `(department_id, position)`.

### 1.6 `events` — 14 columns

| Column | Type | Null | Default |
|---|---|---|---|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` (**PK**) |
| `title` | `varchar(150)` | NOT NULL | — |
| `slug` | `varchar(180)` | NOT NULL | — (**UNIQUE**) |
| `description` | `text` | NULL | — |
| `excerpt` | `text` | NULL | — |
| `event_date` | `date` | NOT NULL | — |
| `event_time` | `time` | NULL | — |
| `location` | `varchar(150)` | NULL | — |
| `image_media_id` | `uuid` | NULL | — |
| `banner_media_id` | `uuid` | NULL | — |
| `department_id` | `uuid` | NULL | — |
| `practical_info` | `text[]` | NULL | — |
| `created_at` | `timestamp with time zone` | NOT NULL | `now()` |
| `updated_at` | `timestamp with time zone` | NOT NULL | `now()` + `$onUpdate` |

PK: `id`. Unique: `events_slug_idx` on `(slug)`.
FKs: `image_media_id` → `media(id)` **set null**; `banner_media_id` → `media(id)` **set null**; `department_id` → `departments(id)` **set null** (comment verbatim: *"supprimer un département ne doit jamais supprimer les événements de l'église"*).
Indexes: `events_slug_idx` (unique), `events_event_date_idx`, `events_department_id_idx`.
**MISSING (explicit, in-file comment): `is_archived` does not exist.** *"**`is_archived` n'existe pas.** La contradiction entre `docs/005` §2.3 et `docs/006` §5 est tranchée en faveur du second : l'état est calculé depuis `event_date`… Aucune transition manuelle « archiver » n'existe."* Also **MISSING: `is_published` / any visibility flag**.

### 1.7 `event_media` — 3 columns (join table)

| Column | Type | Null | Default |
|---|---|---|---|
| `event_id` | `uuid` | NOT NULL | — |
| `media_id` | `uuid` | NOT NULL | — |
| `position` | `integer` | NOT NULL | `0` |

PK: composite `(event_id, media_id)` → `event_media_event_id_media_id_pk`.
FKs: `event_id` → `events(id)` **ON DELETE cascade**; `media_id` → `media(id)` **ON DELETE restrict**.
Index: `event_media_position_idx` on `(event_id, position)`.

### 1.8 `publications` — 14 columns

| Column | Type | Null | Default |
|---|---|---|---|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` (**PK**) |
| `title` | `varchar(150)` | NOT NULL | — |
| `slug` | `varchar(180)` | NOT NULL | — (**UNIQUE**) |
| `type` | `publication_type` | NOT NULL | — |
| `category` | `publication_category` | NOT NULL | — |
| `content_url` | `text` | NULL | — |
| `description` | `text` | NULL | — |
| `body` | `text[]` | NULL | — |
| `author` | `varchar(120)` | NULL | — |
| `published_at` | `date` | NOT NULL | — |
| `status` | `publication_status` | NOT NULL | `'PUBLISHED'` |
| `cover_media_id` | `uuid` | NULL | — |
| `created_at` | `timestamp with time zone` | NOT NULL | `now()` |
| `updated_at` | `timestamp with time zone` | NOT NULL | `now()` + `$onUpdate` |

PK: `id`. Unique: `publications_slug_idx` on `(slug)`.
FK: `cover_media_id` → `media(id)` **ON DELETE set null**.
Indexes: `publications_slug_idx` (unique), `publications_published_at_idx` on `(published_at DESC NULLS LAST)`, `publications_category_idx`, `publications_type_idx`, `publications_status_idx`.
**MISSING: no `archived_at`, no `expires_at`, no `archived` status value, no `published_by`, no `view_count`, no `version`.**

### 1.9 `leaders` — 10 columns

| Column | Type | Null | Default |
|---|---|---|---|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` (**PK**) |
| `name` | `varchar(120)` | NOT NULL | — |
| `role` | `varchar(120)` | NOT NULL | — |
| `scope` | `varchar(120)` | NULL | — |
| `bio` | `text` | NULL | — |
| `photo_media_id` | `uuid` | NULL | — |
| `department_id` | `uuid` | NULL | — |
| `position` | `integer` | NOT NULL | `0` |
| `created_at` | `timestamp with time zone` | NOT NULL | `now()` |
| `updated_at` | `timestamp with time zone` | NOT NULL | `now()` + `$onUpdate` |

PK: `id`. Unique: none besides PK.
FKs: `photo_media_id` → `media(id)` **set null**; `department_id` → `departments(id)` **set null**.
Indexes: `leaders_position_idx`, `leaders_department_id_idx`.
Note: `scope` here is a **display** field per the schema comment *"Domaine couvert, ex. « Chorale »"* — it is **not** an authorization scope and is unrelated to admin scoping.

### 1.10 `testimonies` — 8 columns

| Column | Type | Null | Default |
|---|---|---|---|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` (**PK**) |
| `quote` | `text` | NOT NULL | — |
| `person_name` | `varchar(120)` | NOT NULL | — |
| `person_role` | `varchar(120)` | NULL | — |
| `photo_media_id` | `uuid` | NULL | — |
| `position` | `integer` | NOT NULL | `0` |
| `created_at` | `timestamp with time zone` | NOT NULL | `now()` |
| `updated_at` | `timestamp with time zone` | NOT NULL | `now()` + `$onUpdate` |

PK: `id`. Unique: none besides PK. FK: `photo_media_id` → `media(id)` **set null**. Index: `testimonies_position_idx`.

### 1.11 `community_faces` — 8 columns

| Column | Type | Null | Default |
|---|---|---|---|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` (**PK**) |
| `person_name` | `varchar(120)` | NOT NULL | — |
| `caption` | `text` | NOT NULL | — |
| `photo_media_id` | `uuid` | NULL | — |
| `position` | `integer` | NOT NULL | `0` |
| `created_at` | `timestamp with time zone` | NOT NULL | `now()` |
| `updated_at` | `timestamp with time zone` | NOT NULL | `now()` + `$onUpdate` |

PK: `id`. Unique: none besides PK. FK: `photo_media_id` → `media(id)` **set null**. Index: `community_faces_position_idx`.

### 1.12 `schedule_entries` — 9 columns

| Column | Type | Null | Default |
|---|---|---|---|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` (**PK**) |
| `day` | `varchar(20)` | NOT NULL | — |
| `title` | `varchar(120)` | NOT NULL | — |
| `time_label` | `varchar(60)` | NOT NULL | — |
| `audience` | `varchar(120)` | NULL | — |
| `is_confirmed` | `boolean` | NOT NULL | `false` |
| `position` | `integer` | NOT NULL | `0` |
| `created_at` | `timestamp with time zone` | NOT NULL | `now()` |
| `updated_at` | `timestamp with time zone` | NOT NULL | `now()` + `$onUpdate` |

PK: `id`. Unique: none besides PK. FK: none. Index: `schedule_entries_position_idx`.
`is_confirmed` is **publicly exposed** — comment verbatim: *"C'est une information de confiance, pas un détail d'affichage."*

### 1.13 `scriptures` — 8 columns

| Column | Type | Null | Default |
|---|---|---|---|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` (**PK**) |
| `key` | `varchar(60)` | NOT NULL | — (**UNIQUE**) |
| `text` | `text` | NOT NULL | — |
| `reference` | `varchar(80)` | NOT NULL | — |
| `translation` | `varchar(80)` | NOT NULL | `'Louis Segond 1910'` |
| `context` | `varchar(200)` | NULL | — |
| `created_at` | `timestamp with time zone` | NOT NULL | `now()` |
| `updated_at` | `timestamp with time zone` | NOT NULL | `now()` + `$onUpdate` |

PK: `id`. Unique: `scriptures_key_idx` on `(key)`. FK: none.

### 1.14 `site_settings` — 3 columns

| Column | Type | Null | Default |
|---|---|---|---|
| `key` | `varchar(80)` | NOT NULL | — (**PK**) |
| `value` | `text` | NOT NULL | — |
| `updated_at` | `timestamp with time zone` | NOT NULL | `now()` + `$onUpdate` |

PK: `key`. Unique: PK only. FK: none. Index: PK only.
Key/value **text only** — no per-key type, no enum, no JSON. Comment verbatim: *"Choix délibéré et borné : clé/valeur ne convient qu'à des scalaires…"*

### 1.15 `social_links` — 6 columns

| Column | Type | Null | Default |
|---|---|---|---|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` (**PK**) |
| `label` | `varchar(60)` | NOT NULL | — |
| `href` | `text` | NOT NULL | — |
| `position` | `integer` | NOT NULL | `0` |
| `created_at` | `timestamp with time zone` | NOT NULL | `now()` |
| `updated_at` | `timestamp with time zone` | NOT NULL | `now()` + `$onUpdate` |

PK: `id`. Unique: none besides PK (duplicate `label`/`href` allowed). FK: none. Index: `social_links_position_idx`.

### 1.16 `static_pages` — 6 columns

| Column | Type | Null | Default |
|---|---|---|---|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` (**PK**) |
| `page_key` | `varchar(60)` | NOT NULL | — (**UNIQUE**) |
| `content` | `jsonb` | NOT NULL | — |
| `updated_by` | `uuid` | NULL | — |
| `created_at` | `timestamp with time zone` | NOT NULL | `now()` |
| `updated_at` | `timestamp with time zone` | NOT NULL | `now()` + `$onUpdate` |

PK: `id`. Unique: `static_pages_page_key_idx` on `(page_key)`.
FK: `updated_by` → `admin_profiles(id)` **ON DELETE set null**.
**This is the ONLY traceability column of "who last changed what" in the entire schema** (plus `media.uploaded_by`).
**MISSING: no status/draft column, no revision table, no version column.**

### 1.17 `prayer_requests` — 9 columns

| Column | Type | Null | Default |
|---|---|---|---|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` (**PK**) |
| `request_text` | `text` | NOT NULL | — |
| `requester_name` | `varchar(120)` | NULL | — |
| `requester_contact` | `varchar(120)` | NULL | — |
| `confidentiality` | `prayer_confidentiality` | NOT NULL | `'private'` |
| `status` | `prayer_status` | NOT NULL | `'NEW'` |
| `handled_at` | `timestamp with time zone` | NULL | — |
| `created_at` | `timestamp with time zone` | NOT NULL | `now()` |
| `updated_at` | `timestamp with time zone` | NOT NULL | `now()` + `$onUpdate` |

PK: `id`. Unique: none besides PK. FK: none.
Indexes: `prayer_requests_created_at_idx` on `(created_at DESC NULLS LAST)`, `prayer_requests_status_idx`.
**MISSING: no `deleted_at`/retention/`source_ip`/`assigned_to` column.**

---

### 1.18 RELATIONSHIP MAP (shorthand)

`media` is the hub. `A → B` = "A has an FK to B"; the label after the colon is the ON DELETE behaviour.

```
                  media
                    ↑ set null ── departments.banner_media_id
                    ↑ set null ── events.image_media_id
                    ↑ set null ── events.banner_media_id
                    ↑ set null ── publications.cover_media_id
                    ↑ set null ── leaders.photo_media_id
                    ↑ set null ── testimonies.photo_media_id
                    ↑ set null ── community_faces.photo_media_id
                    ↑ restrict  ── department_media.media_id
                    ↑ restrict  ── event_media.media_id
                    ↑ set null ── media.uploaded_by → admin_profiles

   departments
        ↑ set null ── events.department_id          (nullable ⇒ 0..N events per dept; event may have NO dept)
        ↑ set null ── leaders.department_id         (nullable ⇒ 0..N leaders per dept; leader may be dept-less)
        ↓ cascade  ── department_media.department_id (1 dept : 0..N gallery rows)

   events
        ↓ cascade  ── event_media.event_id          (1 event : 0..N gallery rows)

   admin_profiles
        ← set null ── media.uploaded_by             (nullable ⇒ 0..N media per admin)
        ← set null ── static_pages.updated_by       (nullable ⇒ 0..N pages per admin, last writer only)

   publications  ── no outgoing FK except media.cover_media_id
   testimonies   ── no outgoing FK except media.photo_media_id
   community_faces ─ no outgoing FK except media.photo_media_id
   scriptures    ── NO FK AT ALL
   schedule_entries ─ NO FK AT ALL
   social_links  ── NO FK AT ALL
   site_settings ── NO FK AT ALL
   prayer_requests ─ NO FK AT ALL
```

**Cardinality implied by nullability/uniqueness — explicit statements:**

| Relationship | Nullable? | Unique? | Implied cardinality |
|---|---|---|---|
| `departments.banner_media_id → media` | yes | no | department 0..1 banner; media reused across departments |
| `department_media (department_id, media_id)` | both NOT NULL | composite PK | **N:M** department↔media, deduplicated, with `position` |
| `events.department_id → departments` | yes | no | event belongs to 0 or 1 department (NULL = "événement général de l'église"); department has 0..N events |
| `events.image_media_id / banner_media_id → media` | yes | no | event 0..1 each; media reusable |
| `event_media (event_id, media_id)` | both NOT NULL | composite PK | **N:M** event↔media, deduplicated, with `position` |
| `leaders.department_id → departments` | yes | no | leader 0..1 department; department 0..N leaders |
| `leaders.photo_media_id → media` | yes | no | leader 0..1 photo |
| `publications.cover_media_id → media` | yes | no | publication 0..1 cover |
| `testimonies.photo_media_id → media` | yes | no | testimony 0..1 photo |
| `community_faces.photo_media_id → media` | yes | no | face 0..1 photo |
| `media.uploaded_by → admin_profiles` | yes | no | media 0..1 uploader; admin 0..N uploads |
| `static_pages.updated_by → admin_profiles` | yes | no | page 0..1 last editor |

**Referential-integrity asymmetry worth noting:** `department_media.media_id` and `event_media.media_id` are `restrict`, while every other media reference is `set null`. Consequence: deleting a media row is blocked if it is only in a gallery, and forced deletion must *delete the gallery row* rather than null it (see §6.5).

---

## 2. MIGRATION vs SCHEMA

`backend/drizzle/meta/_journal.json`, verbatim:
```json
{ "version": "7", "dialect": "postgresql",
  "entries": [ { "idx": 0, "version": "7", "when": 1791257882424,
                 "tag": "0000_elite_pretty_boy", "breakpoints": true } ] }
```
**Exactly ONE migration exists.** No second migration, no ALTER, no data migration.

### 2.1 Conformance: the SQL matches the Drizzle schema EXACTLY

Verified column-by-column, table-by-table for all 16 tables, all 6 enums, all 22 indexes, all 16 foreign keys. **No discrepancy found.** Specifically:
- 6 `CREATE TYPE` statements match the 6 `pgEnum` declarations literal-for-literal.
- 16 `CREATE TABLE` statements match the 16 `pgTable` declarations, including nullability and defaults (`DEFAULT 'ROLE_ADMIN'`, `DEFAULT true`, `DEFAULT 'PUBLISHED'`, `DEFAULT 'private'`, `DEFAULT 'NEW'`, `DEFAULT 0`, `DEFAULT false`, `DEFAULT now()`, `DEFAULT gen_random_uuid()`, `DEFAULT 'Louis Segond 1910'`).
- 16 `ADD CONSTRAINT … FOREIGN KEY` statements match every `references()` call with the same `ON DELETE` (`set null` / `cascade` / `restrict`), all with `ON UPDATE no action`.
- 23 `CREATE [UNIQUE] INDEX` statements match the index builders exactly, including `DESC NULLS LAST` on `publications_published_at_idx` and `prayer_requests_created_at_idx`.
- Composite PKs match: `department_media_department_id_media_id_pk`, `event_media_event_id_media_id_pk`.
- The `media_path_unique` UNIQUE constraint matches `.unique()` on `media.path`.

### 2.2 Present in SQL but not in Drizzle, or vice versa

**NOTHING.** There is no orphan object in either direction:
- No extra column in SQL (e.g. no `is_archived`).
- No extra index in SQL (e.g. no `(event_date, is_archived)` composite — the schema comment states this index *replaced* the one from `docs/005`).
- No extra table in either.
- No extra enum value in either.
- The only SQL-side artifacts with no Drizzle counterpart are Drizzle-kit's own bookkeeping (`drizzle.__drizzle_migrations`, created by the migration runner, referenced in `README.md`) — not part of `0000_elite_pretty_boy.sql`.

### 2.3 Schema-drift risk assessment

The drift risk is **structural, not present**: `schema/index.ts` is the single import point for both `drizzle-kit` and the repositories (*"une seule source de vérité, aucune divergence possible entre le schéma et les requêtes"*). Because only one migration exists and it matches exactly, the database described by `drizzle/` is the database the code expects. However, **there is no automated check** enforcing this in CI — `npm run db:generate` must be re-run manually. Any future schema edit followed by a deploy **without** a regenerated migration will make SQL and code diverge silently.

---

## 3. DOMAIN LAYER

### 3.1 `domain/entities/index.ts` — entity interfaces, VERBATIM

```ts
export type EventStatus = "UPCOMING" | "ARCHIVED";

export type PublicationType = "VIDEO" | "PHOTO" | "TEXTE";
export type PublicationCategory =
  | "ACTUALITE"
  | "ENSEIGNEMENT"
  | "MEDIA"
  | "RESSOURCE";
export type PublicationStatus = "DRAFT" | "PUBLISHED";

export type AdminRole = "ROLE_ADMIN";

export type PrayerConfidentiality = "private" | "community";
export type PrayerStatus = "NEW" | "PRAYED";

export interface MediaAsset {
  id: string;
  bucket: string;
  path: string;
  publicUrl: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  alt: string | null;
  uploadedBy: string | null;
  createdAt: Date;
}

export interface Department {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  responsibleName: string | null;
  tagline: string | null;
  meetingSchedule: string | null;
  keyPoints: string[] | null;
  bannerMediaId: string | null;
  /** URL publique résolue, exposée par l'API (le frontend attend `bannerImage`). */
  bannerImageUrl: string | null;
  galleryUrls: string[];
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Event {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  excerpt: string | null;
  /** Date ISO `YYYY-MM-DD` — jamais un objet `Date` (pas de décalage de fuseau). */
  eventDate: string;
  /** Heure `HH:MM:SS` ou `HH:MM`. */
  eventTime: string | null;
  location: string | null;
  imageMediaId: string | null;
  bannerMediaId: string | null;
  imageUrl: string | null;
  bannerImageUrl: string | null;
  galleryUrls: string[];
  departmentId: string | null;
  practicalInfo: string[] | null;
  /** Calculé, jamais stocké. */
  status: EventStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Publication {
  id: string;
  title: string;
  slug: string;
  type: PublicationType;
  category: PublicationCategory;
  status: PublicationStatus;
  contentUrl: string | null;
  /** URL du média de couverture résolue, si un média est associé. */
  coverImageUrl: string | null;
  description: string | null;
  body: string[] | null;
  author: string | null;
  publishedAt: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Leader {
  id: string;
  name: string;
  role: string;
  scope: string | null;
  bio: string | null;
  photoMediaId: string | null;
  photoUrl: string | null;
  departmentId: string | null;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Testimony {
  id: string;
  quote: string;
  personName: string;
  personRole: string | null;
  photoMediaId: string | null;
  photoUrl: string | null;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommunityFace {
  id: string;
  personName: string;
  caption: string;
  photoMediaId: string | null;
  photoUrl: string | null;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminProfile {
  id: string;
  username: string;
  displayName: string | null;
  role: AdminRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface StaticPage {
  id: string;
  pageKey: string;
  content: Record<string, unknown>;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Scripture {
  id: string;
  key: string;
  text: string;
  reference: string;
  translation: string;
  context: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScheduleEntry {
  id: string;
  day: string;
  title: string;
  timeLabel: string;
  audience: string | null;
  isConfirmed: boolean;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SocialLink {
  id: string;
  label: string;
  href: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SiteSetting {
  key: string;
  value: string;
  updatedAt: Date;
}

export interface PrayerRequest {
  id: string;
  requestText: string;
  requesterName: string | null;
  requesterContact: string | null;
  confidentiality: PrayerConfidentiality;
  status: PrayerStatus;
  handledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Page<T> {
  items: T[];
  total: number;
}
```

**Note:** `AdminProfile` has **no `departmentId` and no scope field**. The domain type itself forecloses department scoping.

### 3.2 `domain/repositories/index.ts` — port interfaces, VERBATIM

```ts
export interface ListOptions {
  limit: number;
  offset: number;
}

export interface ListResult<T> {
  items: T[];
  total: number;
}

export interface DepartmentInput {
  name: string;
  description?: string | null;
  responsibleName?: string | null;
  tagline?: string | null;
  meetingSchedule?: string | null;
  keyPoints?: string[] | null;
  bannerMediaId?: string | null;
  galleryMediaIds?: string[];
  position?: number;
}

export interface EventInput {
  title: string;
  description?: string | null;
  excerpt?: string | null;
  eventDate: string;
  eventTime?: string | null;
  location?: string | null;
  imageMediaId?: string | null;
  bannerMediaId?: string | null;
  departmentId?: string | null;
  practicalInfo?: string[] | null;
  galleryMediaIds?: string[];
}

export interface EventFilters {
  status?: EventStatus;
  departmentId?: string;
  /** Borne de comparaison pour le statut, injectable pour les tests. */
  today?: string;
}

export type EventSortColumn = "event_date" | "created_at";

export interface PublicationInput {
  title: string;
  type: PublicationType;
  category: PublicationCategory;
  status?: PublicationStatus;
  contentUrl?: string | null;
  coverMediaId?: string | null;
  description?: string | null;
  body?: string[] | null;
  author?: string | null;
  publishedAt: string;
}

export interface PublicationFilters {
  type?: PublicationType;
  category?: PublicationCategory;
  status?: PublicationStatus;
}

export type PublicationSortColumn = "published_at" | "created_at";

export interface LeaderInput {
  name: string;
  role: string;
  scope?: string | null;
  bio?: string | null;
  photoMediaId?: string | null;
  departmentId?: string | null;
  position?: number;
}

export interface TestimonyInput {
  quote: string;
  personName: string;
  personRole?: string | null;
  photoMediaId?: string | null;
  position?: number;
}

export interface CommunityFaceInput {
  personName: string;
  caption: string;
  photoMediaId?: string | null;
  position?: number;
}

export interface ScriptureInput {
  key: string;
  text: string;
  reference: string;
  translation?: string;
  context?: string | null;
}

export interface ScheduleEntryInput {
  day: string;
  title: string;
  timeLabel: string;
  audience?: string | null;
  isConfirmed?: boolean;
  position?: number;
}

export interface SocialLinkInput {
  label: string;
  href: string;
  position?: number;
}

export interface MediaInput {
  bucket: string;
  path: string;
  publicUrl: string;
  mimeType: string;
  sizeBytes: number;
  width?: number | null;
  height?: number | null;
  alt?: string | null;
  uploadedBy?: string | null;
}

export interface PrayerRequestInput {
  requestText: string;
  requesterName?: string | null;
  requesterContact?: string | null;
  confidentiality?: "private" | "community";
}

export interface DepartmentRepository {
  list(options: ListOptions): Promise<ListResult<Department>>;
  findById(id: string): Promise<Department | null>;
  findByIdOrSlug(value: string): Promise<Department | null>;
  slugExists(slug: string, exceptId?: string): Promise<boolean>;
  exists(id: string): Promise<boolean>;
  create(data: DepartmentInput, slug: string): Promise<Department>;
  update(id: string, data: Partial<DepartmentInput>): Promise<Department | null>;
  remove(id: string): Promise<boolean>;
}

export interface EventRepository {
  list(
    options: ListOptions,
    filters: EventFilters,
    sort: { column: EventSortColumn; direction: "asc" | "desc" },
  ): Promise<ListResult<Event>>;
  findById(id: string): Promise<Event | null>;
  findByIdOrSlug(value: string): Promise<Event | null>;
  slugExists(slug: string, exceptId?: string): Promise<boolean>;
  create(data: EventInput, slug: string): Promise<Event>;
  update(id: string, data: Partial<EventInput>): Promise<Event | null>;
  remove(id: string): Promise<boolean>;
}

export interface PublicationRepository {
  list(
    options: ListOptions,
    filters: PublicationFilters,
    sort: { column: PublicationSortColumn; direction: "asc" | "desc" },
  ): Promise<ListResult<Publication>>;
  findById(id: string): Promise<Publication | null>;
  findByIdOrSlug(value: string, includeDrafts: boolean): Promise<Publication | null>;
  slugExists(slug: string, exceptId?: string): Promise<boolean>;
  create(data: PublicationInput, slug: string): Promise<Publication>;
  update(id: string, data: Partial<PublicationInput>): Promise<Publication | null>;
  remove(id: string): Promise<boolean>;
}

export interface LeaderRepository {
  list(options: ListOptions): Promise<ListResult<Leader>>;
  findById(id: string): Promise<Leader | null>;
  create(data: LeaderInput): Promise<Leader>;
  update(id: string, data: Partial<LeaderInput>): Promise<Leader | null>;
  remove(id: string): Promise<boolean>;
}

export interface TestimonyRepository {
  list(options: ListOptions): Promise<ListResult<Testimony>>;
  findById(id: string): Promise<Testimony | null>;
  create(data: TestimonyInput): Promise<Testimony>;
  update(id: string, data: Partial<TestimonyInput>): Promise<Testimony | null>;
  remove(id: string): Promise<boolean>;
}

export interface CommunityFaceRepository {
  list(options: ListOptions): Promise<ListResult<CommunityFace>>;
  findById(id: string): Promise<CommunityFace | null>;
  create(data: CommunityFaceInput): Promise<CommunityFace>;
  update(id: string, data: Partial<CommunityFaceInput>): Promise<CommunityFace | null>;
  remove(id: string): Promise<boolean>;
}

export interface ScriptureRepository {
  list(): Promise<Scripture[]>;
  findByKey(key: string): Promise<Scripture | null>;
  create(data: ScriptureInput): Promise<Scripture>;
  update(key: string, data: Partial<ScriptureInput>): Promise<Scripture | null>;
  remove(key: string): Promise<boolean>;
}

export interface ScheduleRepository {
  list(): Promise<ScheduleEntry[]>;
  findById(id: string): Promise<ScheduleEntry | null>;
  create(data: ScheduleEntryInput): Promise<ScheduleEntry>;
  update(id: string, data: Partial<ScheduleEntryInput>): Promise<ScheduleEntry | null>;
  remove(id: string): Promise<boolean>;
}

export interface SocialLinkRepository {
  list(): Promise<SocialLink[]>;
  findById(id: string): Promise<SocialLink | null>;
  create(data: SocialLinkInput): Promise<SocialLink>;
  update(id: string, data: Partial<SocialLinkInput>): Promise<SocialLink | null>;
  remove(id: string): Promise<boolean>;
}

export interface SettingRepository {
  listAll(): Promise<SiteSetting[]>;
  upsertMany(values: Record<string, string>): Promise<SiteSetting[]>;
}

export interface StaticPageRepository {
  findByKey(pageKey: string): Promise<StaticPage | null>;
  upsert(
    pageKey: string,
    content: Record<string, unknown>,
    updatedBy: string | null,
  ): Promise<StaticPage>;
}

export interface MediaRepository {
  list(options: ListOptions): Promise<ListResult<MediaAsset>>;
  findById(id: string): Promise<MediaAsset | null>;
  findByPath(path: string): Promise<MediaAsset | null>;
  create(data: MediaInput): Promise<MediaAsset>;
  remove(id: string): Promise<boolean>;
  /** Nombre de références à ce média (galeries, couvertures, portraits). */
  countReferences(mediaId: string): Promise<number>;
}

export interface PrayerRequestRepository {
  list(
    options: ListOptions,
    filters: { status?: "NEW" | "PRAYED" },
  ): Promise<ListResult<PrayerRequest>>;
  findById(id: string): Promise<PrayerRequest | null>;
  create(data: PrayerRequestInput): Promise<PrayerRequest>;
  markHandled(id: string): Promise<PrayerRequest | null>;
  remove(id: string): Promise<boolean>;
}

export interface AdminProfileRepository {
  findById(id: string): Promise<AdminProfile | null>;
  findByUsername(username: string): Promise<AdminProfile | null>;
  upsert(data: {
    id: string;
    username: string;
    displayName?: string | null;
    role?: "ROLE_ADMIN";
  }): Promise<AdminProfile>;
  list(): Promise<AdminProfile[]>;
}
```
The interface header comment states the intended invariant: *"Le contrat commun à toutes les ressources gérées par le back-office. Les lectures publiques ne voient que les ressources publiées ; le filtrage est explicite dans chaque contrat plutôt qu'implicite."*

**Critical observation on this comment vs. code:** the "les lectures publiques ne voient que les ressources publiées" invariant is realised **for `publications` only** (`findByIdOrSlug(…, includeDrafts)`). **Every other contract has no published/visibility filter** — `DepartmentRepository`, `LeaderRepository`, `TestimonyRepository`, `CommunityFaceRepository`, `ScriptureRepository`, `ScheduleRepository` have no visibility parameter at all, and `MediaRepository.list` is admin-only via routing, not via filtering. **`AdminProfileRepository` has no `departmentId` field and offers no method to change `isActive`** (revocation is CLI/DB-only).

**MISSING ports:** no `AuditLogRepository`, no `PermissionRepository`/`RoleRepository`, no `RevisionRepository`/`VersionRepository`, no `NotificationRepository`.

### 3.3 `domain/rules/event-status.ts` — business rule, VERBATIM and complete

```ts
import type { EventStatus } from "@/domain/entities";

/**
 * Règle métier de l'état d'un événement (`docs/006` §5, §19, §21.2).
 *
 * `is_archived` n'est pas persisté : l'état est **toujours** recalculé depuis
 * `eventDate`. C'est ce qui garantit qu'un événement passé ne reste jamais
 * affiché comme à venir, même si personne ne l'a « archivé » manuellement —
 * il n'existe d'ailleurs aucune transition manuelle (`docs/006` §19).
 *
 * La comparaison se fait sur des chaînes `YYYY-MM-DD`, ce qui évite tout
 * décalage de fuseau horaire entre le serveur et Lubumbashi.
 */
export function computeEventStatus(
  eventDate: string,
  now: Date = new Date(),
): EventStatus {
  const today = toIsoDate(now);
  return eventDate >= today ? "UPCOMING" : "ARCHIVED";
}

/** Date locale du serveur au format `YYYY-MM-DD`. */
export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Date locale du serveur, décalée de `days` jours. */
export function isoDateFromNow(days: number, now: Date = new Date()): string {
  const date = new Date(now);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}
```

**The exact rule:** `eventDate >= today ⇒ "UPCOMING"`, otherwise `"ARCHIVED"`. The boundary is **inclusive** — an event dated *today* is `UPCOMING`.
**Threshold constants:** there are **NO numeric threshold constants** in this file. The only "threshold" semantics are the implicit "today" boundary. There is no `ARCHIVE_AFTER_DAYS`, no `N`, no grace period.
**Timezone note:** `toIsoDate` uses `getFullYear/getMonth/getDate` (server-local time), **not** UTC — so the UPCOMING/ARCHIVED flip happens at the *server's* local midnight, not Lubumbashi's. The file comment claims this "évite tout décalage de fuseau horaire entre le serveur et Lubumbashi", which is only true in the sense that no `Date` object is compared; the **day boundary itself is server-local**.

**This is the ONLY archive/recency rule in the entire backend.** It applies to **events**, not publications.

### 3.4 `domain/content/page-content.ts` — the page/section/block content model

**Answer to "is there a page/section/block content model already?": PARTIAL — there is a PAGE + FLAT-FIELD model. There is NO section model and NO block model.**

Precisely what it defines:
- A **registry `pageContentSchemas: Record<string, ZodType>`**, i.e. **one Zod schema per `pageKey`**. The schema of the `jsonb` column depends on the `page_key` row.
- 6 page keys. Every page's schema is a flat `z.object` of **named text fields only**.
- The single validation primitive, verbatim: `const text = (max: number) => z.string().trim().min(1).max(max);` — i.e. every field is `string`, trimmed, non-empty after trim, length-bounded. **No enums, no URLs, no dates, no numbers, no arrays, no nested objects, no regex, no defaults, no transforms anywhere in this file.**
- Three accessors: `knownPageKeys` (`Object.keys(pageContentSchemas)`), `getPageContentSchema(pageKey)` (returns `undefined` for unknown keys), `isKnownPageKey(pageKey)` (uses `Object.hasOwn` deliberately so prototype keys such as `toString`/`constructor` are not accepted).

**Every page key literal and every field literal, VERBATIM and complete:**

```ts
export const pageContentSchemas: Record<string, ZodType> = {
  accueil: z.object({
    heroTitle: text(120),
    heroIntro: text(600),
    pastorHeading: text(160).optional(),
    pastorMessage: text(900).optional(),
  }),

  "qui-sommes-nous": z.object({
    title: text(120),
    intro: text(600),
    historyTitle: text(160).optional(),
    historyIntro: text(900).optional(),
  }),

  organisation: z.object({
    title: text(120),
    intro: text(600),
    departmentsTitle: text(160).optional(),
    departmentsIntro: text(600).optional(),
  }),

  communaute: z.object({
    title: text(120),
    intro: text(600),
    facesTitle: text(160).optional(),
    facesIntro: text(600).optional(),
  }),

  "vie-de-leglise": z.object({
    title: text(120),
    intro: text(600),
    rhythmTitle: text(160).optional(),
    rhythmIntro: text(600).optional(),
  }),

  publications: z.object({
    title: text(120),
    intro: text(600),
    teachingsTitle: text(160).optional(),
    teachingsIntro: text(600).optional(),
  }),
};
```

**Enumerated:**

| `pageKey` (verbatim) | Required fields | Optional fields | Field count |
|---|---|---|---|
| `accueil` | `heroTitle` text(120), `heroIntro` text(600) | `pastorHeading` text(160), `pastorMessage` text(900) | 4 |
| `qui-sommes-nous` | `title` text(120), `intro` text(600) | `historyTitle` text(160), `historyIntro` text(900) | 4 |
| `organisation` | `title` text(120), `intro` text(600) | `departmentsTitle` text(160), `departmentsIntro` text(600) | 4 |
| `communaute` | `title` text(120), `intro` text(600) | `facesTitle` text(160), `facesIntro` text(600) | 4 |
| `vie-de-leglise` | `title` text(120), `intro` text(600) | `rhythmTitle` text(160), `rhythmIntro` text(600) | 4 |
| `publications` | `title` text(120), `intro` text(600) | `teachingsTitle` text(160), `teachingsIntro` text(600) | 4 |

**30 fields total: 12 required, 18 optional.**

**SECTION KEYS: there are NONE.** There is no `sections` array, no section identifier, no ordering field, no block type, no nested structure, no markdown, no HTML. The only section-like concepts are **field-name prefixes** (`hero*`, `pastor*`, `history*`, `departments*`, `faces*`, `rhythm*`, `teachings*`), and the file explicitly states that section order belongs to frontend code, not to the data model: *"Jamais de HTML, jamais de mise en page, jamais d'ordre de sections — ceux-ci appartiennent au code du frontend."*

**Lists are explicitly excluded from this model:** *"Les listes (événements, publications, départements, versets) ne sont **pas** ici : elles ont leurs propres tables."*

---

## 4. MODULES — routes / schemas / services / serializers

### 4.0 Cross-cutting facts that apply to every module

- **Base path:** `apiBasePath = \`/api/${env.API_VERSION}\`` with `API_VERSION` default `"v1"` → `/api/v1`. The prefix is added at mount in `app.ts`, **never** inside a router.
- **The admin chain, expanded:** every module declares `const admin = requireAnyAdmin(deps.authDeps, "ROLE_ADMIN")` and spreads it as `...admin`, which is exactly `[authenticate(), requireAdmin(deps), requireRole("ROLE_ADMIN")]`. **`requireAuth` does not exist anywhere in the codebase** (grep: 0 matches); the real primitive names are `authenticate`, `requireAdmin`, `requireRole`, `requireAnyAdmin`.
- **`router.use(...)` appears ZERO times in the entire `backend/src` tree.** All middleware is per-route, so no route inherits protection. The upside is explicitness; the downside is that forgetting `...admin` is a silent public write.
- **Middleware order on writes is always auth → validate** (`authenticate → requireAdmin → requireRole → validate`). On reads, `validate` runs with no auth at all.
- **Pagination constants, verbatim:** `export const DEFAULT_PAGE_SIZE = 20;` / `export const MAX_PAGE_SIZE = 100;`. There is **no `MAX_LIMIT` constant**. `paginationQuerySchema` is a `z.strictObject({ page: coerce int min 1 default 1, limit: coerce int min 1 max 100 default 20 })`. `emptyQuerySchema = z.strictObject({})`. `toOffset(page, limit) = (page - 1) * limit`.
- **Query strictness convention:** every collection query schema is strict, so an unknown parameter is a `400 VALIDATION_ERROR` naming the key (`Champ non reconnu : « … »`). `.extend()` preserves strictness; spreading `.shape` loses it (documented, and locked by `tests/unit/pagination.test.ts`).
- **Only `events` and `publications` expose a sort**; elsewhere `?sort=…` is a 400 by design.
- **Same-`NotFoundError`-with-different-detail discipline is inconsistent:** `leaders`/`community-faces` pass `{ id }`; `events`/`departments` pass nothing; `publications`/`scriptures` interpolate the client-supplied id/slug/key into the message; `prayer-requests` is deliberately opaque.

---

### 4.1 `admin` — mount `/api/v1/admin`

**ROUTES** (`admin.routes.ts`); declared groups verbatim:
```ts
const activeAdmin = [authenticate(), requireAdmin(deps.authDeps)];
const administration = requireAnyAdmin(deps.authDeps, "ROLE_ADMIN");
```
| Method | Path | Middleware chain, in order |
|---|---|---|
| GET | `/me` | `authenticate()` → `requireAdmin(deps.authDeps)` → `controller.me` |
| GET | `/profiles` | `authenticate()` → `requireAdmin` → `requireRole("ROLE_ADMIN")` → `validate({ query: listAdminProfilesQuerySchema })` → `controller.listProfiles` |

`/me` deliberately omits `requireRole` — comment: *"cette fabrique termine par `requireRole`, qui refuserait un appel sans rôle exigé."* `/me` also has **no `validate` middleware**.
**MISSING: there are NO write routes.** No POST/PATCH/DELETE on admin profiles — an administrator can never be created, deactivated or re-roled through the API.

**SCHEMA** (`admin.schema.ts`): exactly one schema, `export const listAdminProfilesQuerySchema = paginationQuerySchema;` → strict `page`/`limit` only. No body schema, no params schema. Any other query key (`?role=`, `?isActive=`, `?sort=`, `?q=`) is a 400.

**SERVICE** (`admin.service.ts`):
- `currentProfile(profile)` → throws `AuthRequiredError` if undefined, else returns it. **No role check** — comment: *"la route n'exige donc aucun rôle particulier au-delà d'être un administrateur **actif**."*
- `listProfiles(query)` → `const profiles = await this.adminProfiles.list();` then **in-memory pagination**: `items: profiles.slice(offset, offset + query.limit)`, `total: profiles.length`. The whole table is loaded into Node. Comment: *"le contrat de persistance expose `list()` sans pagination : la fenêtre est découpée ici."*
- Repository `list()`: `.orderBy(asc(adminProfiles.username))` — **ORDER BY username ASC, no SQL LIMIT/OFFSET**.
- `findById`: `eq(adminProfiles.id, id)` + `.limit(1)` — **no `isActive` filter in the repository**; the active check lives in the middleware.
- `upsert`: `onConflictDoUpdate({ target: adminProfiles.id, set: { username, displayName, role, updatedAt: new Date() } })` — **`isActive` is deliberately NOT in the `set` clause**, so re-running the script cannot silently reactivate a revoked account.
- `findByUsername`: `sql\`lower(${adminProfiles.username}) = ${normalized}\`` with `normalized = username.trim().toLowerCase()`; empty input short-circuits to `null` without a query.
- **MISSING: no method to toggle `isActive`.** The `!profile.isActive → 403` path is unreachable through any API or repository method — only by writing the DB directly.

**SERIALIZER** (`admin.serializer.ts`): output keys verbatim `{ id, username, displayName, role }`; summary adds `{ isActive, createdAt }`. **Hidden: `updatedAt`, and any Supabase Auth identity (no email, no token, no secret).**

---

### 4.2 `community-faces` — mount `/api/v1/community-faces`

**ROUTES:**
| Method | Path | Middleware chain, in order |
|---|---|---|
| GET | `/` | `validate({ query: listQuerySchema })` — **public, no auth** |
| GET | `/:id` | `validate({ params: communityFaceIdParamSchema })` — **public** |
| POST | `/` | `authenticate()` → `requireAdmin` → `requireRole("ROLE_ADMIN")` → `validate({ body: createCommunityFaceSchema })` |
| PATCH | `/:id` | `authenticate()` → `requireAdmin` → `requireRole("ROLE_ADMIN")` → `validate({ params, body })` |
| DELETE | `/:id` | `authenticate()` → `requireAdmin` → `requireRole("ROLE_ADMIN")` → `validate({ params })` |

**SCHEMA** verbatim:
```ts
export const communityFaceIdParamSchema = z.object({ id: z.uuid("Identifiant de visage invalide") });
export const listQuerySchema = paginationQuerySchema;
export const createCommunityFaceSchema = z.object({
  personName: z.string().trim().min(1, "Le prénom est requis").max(120),
  caption: z.string().trim().min(1, "La légende est requise").max(1000),
  photoMediaId: z.uuid("Identifiant de média invalide").nullish(),
  position: z.coerce.number().int().min(0).max(9999).optional(),
});
export const updateCommunityFaceSchema = createCommunityFaceSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, { message: "Aucun champ à mettre à jour" });
```
Required vs optional: `personName` **required**; `caption` **required**; `photoMediaId` optional+nullable (`nullish`); `position` optional (no Zod default — repository applies `?? 0`). **No `.default()`, no enum, no regex, no transform.**

**SERVICE** (`community-face.service.ts`): pure delegation — `list`, `get`, `create`, `update`, `remove`. Only rules: `findById → null` → `NotFoundError("COMMUNITY_FACE_NOT_FOUND", "Visage introuvable", { id })`, same for failed update/remove. **NO business rule of any kind** — no authz, no department check, no FK existence check, no position normalisation.
Repository: `ORDER BY asc(position), asc(createdAt)` + `limit/offset` pushed to SQL; separate `count()` with no filters; `findById` uses `leftJoin(media, …)` selecting `media.publicUrl`; **no `isUuid` guard** (unlike event/department repositories); `create` sets `position: data.position ?? 0`, `photoMediaId ?? null`; `remove` is a hard `DELETE … returning({ id })`.

**SERIALIZER:** output keys verbatim `{ id, photo, name, caption, position }` with `photo ← photoUrl`, `name ← personName`. **Hidden: `photoMediaId`, `createdAt`, `updatedAt`.**

---

### 4.3 `departments` — mount `/api/v1/departments`

**ROUTES:**
| Method | Path | Middleware chain, in order |
|---|---|---|
| GET | `/` | `validate({ query: listDepartmentQuerySchema })` — **public** |
| GET | `/:idOrSlug` | `validate({ params: departmentIdOrSlugSchema })` — **public** |
| POST | `/` | `authenticate()` → `requireAdmin` → `requireRole("ROLE_ADMIN")` → `validate({ body: createDepartmentSchema })` |
| PATCH | `/:idOrSlug` | `authenticate()` → `requireAdmin` → `requireRole("ROLE_ADMIN")` → `validate({ params: departmentIdOrSlugSchema, body: updateDepartmentSchema })` |
| DELETE | `/:idOrSlug` | `authenticate()` → `requireAdmin` → `requireRole("ROLE_ADMIN")` → `validate({ params: departmentIdOrSlugSchema })` |

**SCHEMA** verbatim (field map + create/update):
```ts
export const departmentIdOrSlugSchema = z.object({
  idOrSlug: z.string().trim().min(1, "L'identifiant ou le slug est requis")
    .max(200, "L'identifiant ou le slug est trop long"),
});
export const listDepartmentQuerySchema = paginationQuerySchema;

const departmentFields = {
  name: z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne peut pas dépasser 100 caractères"),
  description: z.string().trim().max(5000, "La description est trop longue").nullish(),
  responsibleName: z.string().trim().max(120, "Le nom du responsable est trop long").nullish(),
  tagline: z.string().trim().max(200, "L'accroche est trop longue").nullish(),
  meetingSchedule: z.string().trim().max(255, "Le rythme de rencontre est trop long").nullish(),
  keyPoints: z.array(z.string().trim().min(1).max(300)).max(20, "20 points clés au maximum").nullish(),
  bannerMediaId: z.uuid("L'identifiant de média doit être un UUID").nullish(),
  galleryMediaIds: z.array(z.uuid("Identifiant de média invalide")).max(60).optional(),
  position: z.coerce.number().int().min(0).max(10_000).optional(),
};

export const createDepartmentSchema = z.object({
  ...departmentFields,
  slug: z.string().trim().min(2, "Le slug doit contenir au moins 2 caractères")
    .max(160, "Le slug ne peut pas dépasser 160 caractères").optional(),
});
export const updateDepartmentSchema = z.object(departmentFields).partial();
```
- Required: `name` (2–100). All others optional/nullable.
- Min/max: `name` 2–100; `description` ≤5000; `responsibleName` ≤120; `tagline` ≤200; `meetingSchedule` ≤255; `keyPoints` array ≤20 items, each 1–300; `galleryMediaIds` array ≤60; `position` 0–**10 000**; `slug` (create only) 2–160.
- **`slug` is absent from update on purpose** — an admin cannot change a public URL.
- **`updateDepartmentSchema` has NO non-empty refine** → a body of `{}` is accepted (this diverges from leaders/testimonies/faces/scriptures/schedule/social-links, which all refuse `{}`).

**SERVICE** (`department.service.ts`) — every rule:
1. `create`: destructures `slug: requestedSlug` out of the body, then `resolveSlug(input.name, requestedSlug)`.
2. `resolveSlug`: **explicit slug → `slugify()` → if `slugExists(explicit)` → `DuplicateSlugError(explicit)` (409 `DUPLICATE_SLUG`, never auto-suffixed)**; otherwise → `uniqueSlug(name, c => slugExists(c))`.
3. `update`/`remove`: `require(idOrSlug)` first (404 `DEPARTMENT_NOT_FOUND` with the message `Aucun département ne correspond à « ${idOrSlug} »`, **no details**), then act; a `null`/`false` return after the read produces the same 404 (documented as a race between read and write).
4. FK behaviour documented in code: deleting a department does **not** delete its events — `events.department_id` is `onDelete: "set null"`, so they become general events.
5. `slugExists` is called **without `exceptId`** at every call site → the `exceptId` branch of the repository method is **dead code**.
6. **NO authorization check inside the service** — authorization is middleware-only.
Query filters: **none** (pagination only). Repository `ORDER BY asc(position), asc(name)` — deterministic tie-break by name. `findByIdOrSlug` branches on an `isUuid()` regex; `exists(id)` guards on `isUuid` and returns `false` otherwise. Gallery replacement: `replaceGallery()` de-duplicates with `new Set`, then in a **transaction** deletes all `department_media` rows for that department and re-inserts with `position = array index`.

**SERIALIZER:** output keys verbatim `{ id, name, slug, description, responsibleName, bannerImage, meetingSchedule, keyPoints, gallery, tagline }`; optional fields are emitted as `?? undefined` (**omitted**, never `null`); `gallery` is omitted when empty. **Hidden: `bannerMediaId`, `createdAt`, `updatedAt`, and — notably — `position`.** The ordering key is therefore **settable but unreadable** through the API.

---

### 4.4 `events` — mount `/api/v1/events`

**ROUTES:**
| Method | Path | Middleware chain, in order |
|---|---|---|
| GET | `/` | `validate({ query: listEventQuerySchema })` — **public** |
| GET | `/:idOrSlug` | `validate({ params: eventIdOrSlugSchema })` — **public** |
| POST | `/` | `authenticate()` → `requireAdmin` → `requireRole("ROLE_ADMIN")` → `validate({ body: createEventSchema })` |
| PATCH | `/:idOrSlug` | `authenticate()` → `requireAdmin` → `requireRole("ROLE_ADMIN")` → `validate({ params, body: updateEventSchema })` |
| DELETE | `/:idOrSlug` | `authenticate()` → `requireAdmin` → `requireRole("ROLE_ADMIN")` → `validate({ params })` |

**SCHEMA** verbatim (list query — the only module with filters + sort):
```ts
export const eventIdOrSlugSchema = z.object({
  idOrSlug: z.string().trim().min(1, "L'identifiant ou le slug est requis")
    .max(200, "L'identifiant ou le slug est trop long"),
});
export const EVENT_SORT_COLUMNS = ["event_date", "created_at"] as const;

export const listEventQuerySchema = paginationQuerySchema.extend({
  status: z.enum(["UPCOMING", "ARCHIVED"]).optional(),
  departmentId: z.uuid("Le département doit être identifié par un UUID").optional(),
  sort: createSortSchema(EVENT_SORT_COLUMNS, "event_date"),
});
```
Enum values for the filter, verbatim: `["UPCOMING", "ARCHIVED"]`, `.optional()`. **`today` is deliberately NOT exposed** — comment: *"une borne de date fournie par le client fausserait la notion d'« à venir »."*

Body field map:
```ts
const eventFields = {
  title: z.string().trim().min(3, "Le titre doit contenir au moins 3 caractères")
    .max(150, "Le titre ne peut pas dépasser 150 caractères"),
  description: z.string().trim().max(5000, "La description est trop longue").nullish(),
  excerpt: z.string().trim().max(500, "L'accroche est trop longue").nullish(),
  eventDate: z.iso.date("La date doit être au format AAAA-MM-JJ"),
  eventTime: z.string().trim()
    .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, "L'heure doit être au format HH:MM").nullish(),
  location: z.string().trim().max(150, "Le lieu est trop long").nullish(),
  imageMediaId: z.uuid("L'identifiant de média doit être un UUID").nullish(),
  bannerMediaId: z.uuid("L'identifiant de média doit être un UUID").nullish(),
  departmentId: z.uuid("L'identifiant de département doit être un UUID").nullish(),
  practicalInfo: z.array(z.string().trim().min(1).max(300)).max(20, "20 informations pratiques au maximum").nullish(),
  galleryMediaIds: z.array(z.uuid("Identifiant de média invalide")).max(60).optional(),
};
export const createEventSchema = z.object({ ...eventFields, slug: z.string().trim().min(2).max(180).optional() });
export const updateEventSchema = z.object(eventFields).partial();
```
Required: `title` (3–150) and **`eventDate` (ISO `YYYY-MM-DD`)**. Everything else optional/nullable. `slug` create-only, 2–180. **`updateEventSchema` has no non-empty refine.**

**SERVICE** (`event.service.ts`) — every rule:
1. **`list`** passes `{ limit, offset }`, `{ status: query.status, departmentId: query.departmentId }` (no `today`), `query.sort`. **The repository translates `status` into a DATE COMPARISON** — comment: *"`status` is not a column"*.
2. **Filters, verbatim from `buildFilters`:**
```ts
if (filters.departmentId !== undefined) conditions.push(eq(events.departmentId, filters.departmentId));
if (filters.status !== undefined) {
  const today = filters.today ?? toIsoDate(new Date());
  conditions.push(filters.status === "UPCOMING" ? gte(events.eventDate, today) : lt(events.eventDate, today));
}
```
3. **Ordering, verbatim:** `const primary = sort.direction === "desc" ? desc(column) : asc(column); return [primary, asc(events.id)];` — default `event_date ASC, id ASC`.
4. **`assertDepartmentExists(departmentId)`**: returns early for `undefined`/`null`; otherwise `departments.exists(id)`; if absent → `NotFoundError("DEPARTMENT_NOT_FOUND", …)`. Called on **create and update**. This is the **only domain-level FK existence check in the whole backend**.
5. Status is **never written** — the repository computes it via `computeEventStatus` (§3.3).
6. `resolveSlug` identical in shape to departments (explicit → 409 `DUPLICATE_SLUG`; derived → `uniqueSlug`).
7. `update` semantics: absent `departmentId` (`undefined`) leaves the attachment intact; explicit `null` detaches the event (it "redevient général").
8. **NO authorization check inside the service.**
9. Repository `findById`, `findByIdOrSlug`, `update`, `remove` all guard on `isUuid()` (non-UUID → `null`/`false`), **so a request for a nonexistent-but-well-formed id and a malformed id are indistinguishable** (both 404).
10. `replaceGallery` de-duplicates and rewrites positions as array indices inside a transaction.

**SERIALIZER:** output keys verbatim `{ id, title, slug, description, eventDate, eventTime, location, imageUrl, departmentId, status, excerpt, bannerImage, gallery, practicalInfo }`. **Null policy is mixed inside one DTO:** `departmentId` is **always present, including `null`** (documented so the frontend can distinguish a general event); `description`, `eventTime`, `location`, `imageUrl`, `excerpt`, `bannerImage`, `gallery`, `practicalInfo` are emitted as `?? undefined` (omitted). `eventTime` is normalised by `toShortTime()` → Postgres `HH:MM:SS` becomes `HH:MM`. **Hidden: `imageMediaId`, `bannerMediaId`, `createdAt`, `updatedAt`.**

---

### 4.5 `leaders` — mount `/api/v1/leaders`

**ROUTES:**
| Method | Path | Middleware chain, in order |
|---|---|---|
| GET | `/` | `validate({ query: listQuerySchema })` — **public** |
| GET | `/:id` | `validate({ params: leaderIdParamSchema })` — **public** |
| POST | `/` | `authenticate()` → `requireAdmin` → `requireRole("ROLE_ADMIN")` → `validate({ body: createLeaderSchema })` |
| PATCH | `/:id` | `authenticate()` → `requireAdmin` → `requireRole("ROLE_ADMIN")` → `validate({ params, body: updateLeaderSchema })` |
| DELETE | `/:id` | `authenticate()` → `requireAdmin` → `requireRole("ROLE_ADMIN")` → `validate({ params })` |

Note the route parameter is `/:id` (UUID), **not** `/:idOrSlug` — `leaders` has no slug.

**SCHEMA** verbatim:
```ts
export const leaderIdParamSchema = z.object({ id: z.uuid("Identifiant de responsable invalide") });
export const listQuerySchema = paginationQuerySchema;
export const createLeaderSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis").max(120),
  role: z.string().trim().min(1, "La fonction est requise").max(120),
  scope: z.string().trim().max(120).nullish(),
  bio: z.string().trim().max(5000).nullish(),
  photoMediaId: z.uuid("Identifiant de média invalide").nullish(),
  departmentId: z.uuid("Identifiant de département invalide").nullish(),
  position: z.coerce.number().int().min(0).max(9999).optional(),
});
export const updateLeaderSchema = createLeaderSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, { message: "Aucun champ à mettre à jour" });
```
Required: `name` (1–120), `role` (1–120). Optional/nullable: `scope` ≤120, `bio` ≤5000, `photoMediaId`, `departmentId`, `position` 0–9999. **`scope` and `bio` have no `.min(1)` → empty strings are valid.** `updateLeaderSchema` **refuses `{}`**.

**SERVICE** (`leader.service.ts`): pure delegation + existence guards. `findById → null` → `NotFoundError("LEADER_NOT_FOUND", "Responsable introuvable", { id })`; same for failed update/remove. **CRITICAL ASYMMETRY: `LeaderService` has NO `assertDepartmentExists`** — unlike `EventService`. `leaders.departmentId` is accepted as any well-formed UUID and only the DB FK decides; a nonexistent department surfaces as an unmapped constraint error → **500**. `departmentId` is also **never usable as a list filter** (`listQuerySchema` is strict pagination).
Repository: `leftJoin(media, …)`, `ORDER BY asc(position), asc(createdAt)`, `limit/offset` in SQL, unbounded `count()`, **no `isUuid` guard** on `findById`/`update`/`remove`.

**SERIALIZER:** output keys verbatim `{ id, name, role, scope, bio, photo, departmentId, position }`. `scope`, `bio`, `photo`, `departmentId` are emitted as **`null` (keys always present)** — a different convention from `DepartmentDto`, which omits absent optionals. **Hidden: `photoMediaId`, `createdAt`, `updatedAt`.**

---

### 4.6 `media` — mount `/api/v1/media` (see also §6)

**ROUTES — every route is admin-only:**
| Method | Path | Middleware chain, in order |
|---|---|---|
| GET | `/` | `authenticate()` → `requireAdmin` → `requireRole("ROLE_ADMIN")` → `validate({ query: listQuerySchema })` |
| GET | `/:id/usage` | `authenticate()` → `requireAdmin` → `requireRole("ROLE_ADMIN")` → `validate({ params: mediaIdParamSchema })` |
| GET | `/:id` | `authenticate()` → `requireAdmin` → `requireRole("ROLE_ADMIN")` → `validate({ params: mediaIdParamSchema })` |
| POST | `/` | `authenticate()` → `requireAdmin` → `requireRole("ROLE_ADMIN")` → `singleFileUpload()` → `validate({ body: uploadMediaBodySchema })` |
| DELETE | `/:id` | `authenticate()` → `requireAdmin` → `requireRole("ROLE_ADMIN")` → `validate({ params: mediaIdParamSchema, query: deleteMediaQuerySchema })` |

`/:id/usage` is registered **before** `/:id`. **`GET /api/v1/media` is NOT public** — the media registry is never exposed.

**SCHEMA** verbatim:
```ts
export const MEDIA_FOLDERS = [
  "events", "departments", "publications", "leaders", "testimonies", "community", "pages",
] as const satisfies readonly StorageFolder[];
export const mediaFolderSchema = z.enum(MEDIA_FOLDERS, "Dossier de destination invalide");
export const mediaIdParamSchema = z.object({ id: z.uuid("Identifiant de média invalide") });
export const listQuerySchema = paginationQuerySchema;
export const uploadMediaBodySchema = z.object({
  folder: mediaFolderSchema,
  alt: z.string().trim().max(300).optional(),
});
export const deleteMediaQuerySchema = z.strictObject({
  force: z.enum(["true", "false"]).default("false").transform((value) => value === "true"),
});
```
Required: `folder` (closed enum, 7 values), `file` (multipart, not Zod-described). Optional: `alt` ≤300. `force` is the literal string enum `["true","false"]` — **only the literal `"true"` authorises a forced delete**; the schema is strict, so `?forcee=true` is a 400 rather than being read as "no force".

**SERVICE** (`media.service.ts`): `list` (passthrough), `get` (404 `MEDIA_NOT_FOUND` with `{ id }`), `usage` (returns `{ media, total, usages }` filtered to `count > 0`), `upload`, `remove`. Ordered guarantees documented in-file: upload file **first**, DB row **second**, compensate by deleting the file if the insert fails; on delete, detach references and delete the row **before** removing the file. `remove` throws `ConflictError("CONFLICT", …, { total, usages })` when `total > 0 && !force`. Full detail in §6.

**SERIALIZER:** output keys verbatim `{ id, url, bucket, path, folder, mimeType, sizeBytes, width, height, alt, uploadedBy, createdAt }`. `folder` is derived as `path.slice(0, path.indexOf("/"))` or `null`. **This DTO exposes internal storage coordinates (`bucket`, raw `path`)** — acceptable only because every media route is admin-only. Usage DTO: `{ source, label, count }`.

---

### 4.7 `prayer-requests` — mount `/api/v1/prayer-requests`

**ROUTES:**
| Method | Path | Middleware chain, in order |
|---|---|---|
| POST | `/` | **`publicWriteLimiter`** → `validate({ body: createPrayerRequestSchema })` → `controller.create` |
| GET | `/` | `authenticate()` → `requireAdmin` → `requireRole("ROLE_ADMIN")` → `validate({ query: listPrayerRequestsQuerySchema })` |
| GET | `/:id` | `authenticate()` → `requireAdmin` → `requireRole("ROLE_ADMIN")` → `validate({ params: prayerRequestIdParamsSchema })` |
| PATCH | `/:id` | `authenticate()` → `requireAdmin` → `requireRole("ROLE_ADMIN")` → `validate({ params, body: updatePrayerRequestSchema })` |
| DELETE | `/:id` | `authenticate()` → `requireAdmin` → `requireRole("ROLE_ADMIN")` → `validate({ params })` |

**This is the ONLY public write route in the entire API and the ONLY module with a route-scoped rate limiter.** Constants verbatim:
```ts
const PUBLIC_WRITE_WINDOW_MS = 60 * 60 * 1_000;
const PUBLIC_WRITE_MAX_PER_WINDOW = 5;
```
→ **5 submissions per hour per IP**, applied **before** validation, with a custom 429 body in the API error shape. `standardHeaders: true` here vs. `standardHeaders: "draft-8"` on the global limiter — **a header-contract inconsistency across the API**.

**SCHEMA** verbatim:
```ts
export const PRAYER_REQUEST_TEXT_MAX_LENGTH = 1_000;
export const PRAYER_REQUEST_NAME_MAX_LENGTH = 120;
export const PRAYER_REQUEST_CONTACT_MAX_LENGTH = 120;

export const createPrayerRequestSchema = z.strictObject({
  requestText: z.string({ error: "Le texte de la demande est requis" }).trim()
    .min(1, "Le texte de la demande ne peut pas être vide")
    .max(PRAYER_REQUEST_TEXT_MAX_LENGTH, …),
  requesterName: optionalShortText(PRAYER_REQUEST_NAME_MAX_LENGTH, "Le prénom ou nom"),
  requesterContact: optionalShortText(PRAYER_REQUEST_CONTACT_MAX_LENGTH, "Le contact"),
  confidentiality: prayerConfidentialitySchema.default("private"),
});
export const updatePrayerRequestSchema = z.strictObject({
  status: z.literal("PRAYED", { error: "Seule la valeur « PRAYED » est acceptée pour le statut" }),
});
export const prayerRequestIdParamsSchema = z.strictObject({ id: z.uuid({ error: "Identifiant de demande de prière invalide" }) });
export const listPrayerRequestsQuerySchema = paginationQuerySchema.extend({ status: prayerStatusSchema.optional() });
```
- `requestText`: **required**, 1–**1000**, trimmed, stored trimmed.
- `requesterName`, `requesterContact`: optional, ≤**120 each**; the `optionalShortText` helper **transforms empty/whitespace to `null`**, never `""`.
- `confidentiality`: enum `["private","community"]`, **default `"private"`**.
- `status` on PATCH: **only the literal `"PRAYED"`** — no way back to `NEW`.
- All three of `create`, `update`, `params` schemas are **`.strictObject`** → unknown keys are a 400 (the public body cannot inject a column).
- List query accepts exactly `page`, `limit`, `status` (`["NEW","PRAYED"]`). **No `sort`, no date filter, no search, no confidentiality filter.**

**SERVICE** (`prayer-request.service.ts`):
1. `submit` — **no business rule at all**: no profanity filter, no duplicate detection, no spam heuristic beyond the route limiter, no CAPTCHA. Logs only `{ prayerRequestId }` — comment verbatim: *"seuls des identifiants sont écrits. Le texte d'une intention, un prénom ou un contact sont des données personnelles sensibles et n'apparaissent dans aucun journal, même en `debug`."*
2. `markPrayed` re-validates the transition independently of HTTP: `if (status !== "PRAYED") throw new ValidationError("Seule la transition vers le statut « PRAYED » est supportée");` then `getById` (to produce the exact 404 code) then `markHandled`.
3. `remove` is a hard delete.
4. 404 factory: `NotFoundError("PRAYER_REQUEST_NOT_FOUND", "Cette demande de prière est introuvable")` — **deliberately identical for every cause**, no existence oracle and no PII echo.
5. **NO authorization check inside the service.**
6. Repository `list`: `where = filters.status ? eq(status, filters.status) : undefined`; **`ORDER BY desc(createdAt)` with NO tiebreaker** (two requests in the same millisecond can paginate non-deterministically); separate `count()` with the same `where`. `markHandled` sets `{ status: "PRAYED", handledAt: new Date() }`.

**SERIALIZER** — two representations, and the split is the security contract:
- `toPrayerRequestDto` → `{ id, requestText, requesterName, requesterContact, confidentiality, status, handledAt, createdAt, updatedAt }` — used **only by the three admin routes**.
- `toPrayerRequestCreatedDto` → `{ id, createdAt, status }` **only** — used by the public `POST /`. **It contains NEITHER `requestText`, NOR `requesterName`, NOR `requesterContact`, NOR `confidentiality`.**
**No public endpoint returns any prayer text, name or contact.** `confidentiality` is returned to admins only and does **not** gate admin access.

---

### 4.8 `publications` — mount `/api/v1/publications` (see also §4.15, the workflow finding)

**ROUTES:**
| Method | Path | Middleware chain, in order |
|---|---|---|
| GET | `/` | `validate({ query: listPublicationQuerySchema })` — **public** |
| GET | `/:idOrSlug` | `validate({ params: publicationIdOrSlugSchema })` — **public** |
| POST | `/` | `authenticate()` → `requireAdmin` → `requireRole("ROLE_ADMIN")` → `validate({ body: createPublicationSchema })` |
| PATCH | `/:idOrSlug` | `authenticate()` → `requireAdmin` → `requireRole("ROLE_ADMIN")` → `validate({ params, body: updatePublicationSchema })` |
| DELETE | `/:idOrSlug` | `authenticate()` → `requireAdmin` → `requireRole("ROLE_ADMIN")` → `validate({ params })` |

**SCHEMA** verbatim (list query — note the deliberate ABSENCE of `status`):
```ts
export const PUBLICATION_SORT_COLUMNS = ["published_at", "created_at"] as const;
const DEFAULT_SORT = "-published_at";

export const listPublicationQuerySchema = paginationQuerySchema.extend({
  type: z.enum(["VIDEO", "PHOTO", "TEXTE"]).optional(),
  category: z.enum(["ACTUALITE", "ENSEIGNEMENT", "MEDIA", "RESSOURCE"]).optional(),
  sort: z.preprocess((raw) => (raw === undefined ? DEFAULT_SORT : raw),
    createSortSchema(PUBLICATION_SORT_COLUMNS, "published_at")),
});
```
Query keys accepted publicly: exactly `page`, `limit`, `type`, `category`, `sort`. **There is NO `status` key** — comment verbatim: *"Le filtre public ne comporte **pas** de `status` … il est **absent**, et le service force `PUBLISHED` côté base."* Because the object stays strict, `?status=DRAFT` is a **400**, not an ignored parameter. **No date-window / recency parameter exists.**

Body field map + create/update:
```ts
title: trim 3–150 | type: enum VIDEO|PHOTO|TEXTE | category: enum ACTUALITE|ENSEIGNEMENT|MEDIA|RESSOURCE
status: z.enum(["DRAFT","PUBLISHED"]).optional()   // NO Zod default
contentUrl: trim ≤1000 nullish                     // NO url format check in Zod
coverMediaId: uuid nullish | description: trim ≤5000 nullish
body: array(trim 1–5000) ≤50 nullish | author: trim ≤120 nullish
publishedAt: z.iso.date("La date doit être au format AAAA-MM-JJ")

export const createPublicationSchema = z.object({
  ...publicationFields,
  publishedAt: z.iso.date(…).default(() => toIsoDate(new Date())),
  slug: z.string().trim().min(2).max(180).optional(),
});
export const updatePublicationSchema = z.object(publicationFields).partial();
```
- Required on create: `title`, `type`, `category`, `publishedAt` (which **defaults to today** on create only).
- `status` is optional with **no Zod default** — the `PUBLISHED` default is applied **in SQL** (`status: data.status ?? "PUBLISHED"` in the repository).
- `slug` is create-only, 2–180.
- **`updatePublicationSchema` has no non-empty refine** → `{}` is accepted.

**SERVICE** (`publication.service.ts`) — every rule:
1. **Public list forces `PUBLISHED`, verbatim:**
```ts
return this.publications.list(
  { limit: query.limit, offset: toOffset(query.page, query.limit) },
  { type: query.type, category: query.category, status: "PUBLISHED" },
  query.sort,
);
```
2. **Public detail is draft-blind:** `async get(idOrSlug: string) { return this.require(idOrSlug, false); }` — comment: *"un brouillon est indistinguable d'un absent."*
3. **Admin paths include drafts:** both `update` and `remove` call `this.require(idOrSlug, true)` — *"sans cela, un administrateur ne pourrait ni corriger ni supprimer ce qu'il a dépublié."*
4. **Repository-level guard (second line of defence), verbatim:**
```ts
const identity = isUuid(value) ? eq(publications.id, value) : eq(publications.slug, value);
const where = includeDrafts ? identity : and(identity, eq(publications.status, "PUBLISHED"));
```
5. **Filters** (repository `buildFilters`): `type`, `category`, `status` — whitelist only. **No department filter, no author filter, no search, no date range.**
6. **Ordering, verbatim:** `return [primary, asc(publications.id)];` — default `published_at DESC, id ASC`, deterministic tie-break.
7. **Content coherence rule `assertContentCoherence`, run on create AND on PATCH against the MERGED resource:**
   - `VIDEO`: `contentUrl === null || !isHttpUrl(contentUrl)` → `ValidationError("Une publication VIDEO doit avoir un contentUrl http(s) valide", { champ: "contentUrl" })`
   - `PHOTO`: `contentUrl === null && !hasCover` → `ValidationError("Une publication PHOTO doit avoir un contentUrl ou un coverMediaId", { champ: "contentUrl" })`
   - `TEXTE`: zero non-blank paragraphs → `ValidationError("Une publication TEXTE doit avoir un body non vide", { champ: "body" })`
   `isHttpUrl` accepts only `http:`/`https:` protocols. This is the **only URL validation** — it does not exist in Zod.
8. `resolveSlug` identical in shape to departments/events (explicit → 409 `DUPLICATE_SLUG`, never suffixed; derived → `uniqueSlug`).
9. **`coverMediaId` is NOT existence-checked** — `hasCover` is derived purely from non-null input or `existing.coverImageUrl !== null`.
10. **NO authorization check inside the service.**

**SERIALIZER:** output keys verbatim `{ id, title, slug, type, contentUrl, description, publishedAt, category, author, body, status, coverImage }`; `contentUrl`, `description`, `author`, `body`, `coverImage` are emitted as `?? undefined`. **`status` and `coverImage` are the two additive fields beyond the frontend contract.** **The same DTO is used for public list, public detail and every admin route — there is no admin serializer and no field hidden from the public response**; the only distinction is that public responses can only ever contain `PUBLISHED` rows. **Hidden: `coverMediaId`, `createdAt`, `updatedAt`.**

---

### 4.9 `schedule` — mount `/api/v1/schedule`

**ROUTES:**
| Method | Path | Middleware chain, in order |
|---|---|---|
| GET | `/` | `validate({ query: emptyQuerySchema })` — **public** |
| POST | `/` | `authenticate()` → `requireAdmin` → `requireRole("ROLE_ADMIN")` → `validate({ body: scheduleCreateSchema })` |
| PATCH | `/:id` | `authenticate()` → `requireAdmin` → `requireRole("ROLE_ADMIN")` → `validate({ params: scheduleParamsSchema, body: scheduleUpdateSchema })` |
| DELETE | `/:id` | `authenticate()` → `requireAdmin` → `requireRole("ROLE_ADMIN")` → `validate({ params: scheduleParamsSchema })` |

**There is NO `GET /schedule/:id`** — reading a single entry is not exposed.

**SCHEMA** verbatim:
```ts
export const scheduleParamsSchema = z.object({ id: z.uuid() });
export const scheduleCreateSchema = z.object({
  day: z.string().trim().min(1).max(20),
  title: z.string().trim().min(1).max(120),
  timeLabel: z.string().trim().min(1).max(60),
  audience: z.string().trim().max(120).nullish(),
  isConfirmed: z.boolean().default(false),
  position: z.coerce.number().int().min(0).max(9999).default(0),
});
export const scheduleUpdateSchema = scheduleCreateSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, { message: "Aucun champ à mettre à jour" });
```
Required: `day` (1–20), `title` (1–120), `timeLabel` (1–60). Defaults: `isConfirmed` **`false`**, `position` **`0`**. Optional: `audience` ≤120. Update refuses `{}`. `timeLabel` is deliberately a free label — the real values include `"16h30 – 18h30"` and `"Dans la nuit"`.

**SERVICE** (`schedule.service.ts`): the **thinnest service in the backend — no business rule, no authorization check, no filter**. `list()` → `this.schedule.list()` (no options at all); `create` → passthrough; `update`/`remove` → 404 `SCHEDULE_ENTRY_NOT_FOUND` with `{ id }`. **NO authorization check inside the service.**
Repository `list()`: `ORDER BY asc(position), asc(createdAt)` — **NO `.limit()`**: the whole table is returned. `update` with an empty patch returns `findById(id)` **without writing** (so `updated_at` is not bumped). **No `position` uniqueness or reorder logic.**

**SERIALIZER:** output keys verbatim `{ id, day, title, timeLabel, audience, isConfirmed, position, createdAt, updatedAt }`. **Nothing is hidden — the public list DTO is identical to what admin routes return.** Response shape: `sendItem(res, { data: [...] })` — a bare `{ data }` **with no `meta`**, unlike paginated collections.

---

### 4.10 `scriptures` — mount `/api/v1/scriptures`

**ROUTES — note the parameter is `:key`, not `:id`:**
| Method | Path | Middleware chain, in order |
|---|---|---|
| GET | `/` | `validate({ query: emptyQuerySchema })` — **public** |
| GET | `/:key` | `validate({ params: scriptureParamsSchema })` — **public** |
| POST | `/` | `authenticate()` → `requireAdmin` → `requireRole("ROLE_ADMIN")` → `validate({ body: scriptureCreateSchema })` |
| PATCH | `/:key` | `authenticate()` → `requireAdmin` → `requireRole("ROLE_ADMIN")` → `validate({ params: scriptureParamsSchema, body: scriptureUpdateSchema })` |
| DELETE | `/:key` | `authenticate()` → `requireAdmin` → `requireRole("ROLE_ADMIN")` → `validate({ params: scriptureParamsSchema })` |

**SCHEMA** verbatim:
```ts
export const DEFAULT_SCRIPTURE_TRANSLATION = "Louis Segond 1910";
export const scriptureKeySchema = z.string().trim().min(1).max(60)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Clé attendue en minuscules, sans espace (ex. « rassemblement »)");
export const scriptureParamsSchema = z.object({ key: scriptureKeySchema });
export const scriptureCreateSchema = z.object({
  key: scriptureKeySchema,
  text: z.string().trim().min(1).max(2000),
  reference: z.string().trim().min(1).max(80),
  translation: z.string().trim().min(1).max(80).default(DEFAULT_SCRIPTURE_TRANSLATION),
  context: z.string().trim().max(200).nullish(),
});
export const scriptureUpdateSchema = scriptureCreateSchema
  .omit({ key: true }).partial()
  .refine((value) => Object.keys(value).length > 0, { message: "Aucun champ à mettre à jour" });
```
Required: `key` (regex `^[a-z0-9]+(?:-[a-z0-9]+)*$`, 1–60), `text` (1–2000), `reference` (1–80), `translation` (1–80, **default `"Louis Segond 1910"`**). Optional: `context` ≤200. **`key` is `omit`-ted from update → a verse cannot be re-keyed by PATCH.** Update refuses `{}`.

**SERVICE** (`scripture.service.ts`):
1. **Uniqueness pre-check / conflict mapping, verbatim:**
```ts
const existing = await this.scriptures.findByKey(input.key);
if (existing) {
  throw new ConflictError("CONFLICT", `La clé « ${input.key} » est déjà utilisée par un autre verset`, { key: input.key });
}
```
Comment: *"on détecte le conflit avant l'écriture pour renvoyer une erreur métier plutôt qu'une violation de contrainte SQL."* Note the code is **`"CONFLICT"`, not `"DUPLICATE_SLUG"`**. It is a check-then-act with no transaction, so a race still ends as an unmapped 500.
2. `getByKey` 404 message **echoes the client-supplied key**: `Aucun verset n'est enregistré pour la clé « ${key} »` with `{ key }` — constrained by regex, so low risk, but inconsistent with the deliberately opaque prayer-request 404.
3. `translation` default lives in **three places**: the Zod default, the DB column default, and `input.translation ?? DEFAULT_SCRIPTURE_TRANSLATION` in the service.
4. Repository `list()`: `ORDER BY scriptures.key` (lexicographic), **no `.limit()`**. `update` accepts `data.key` at the repository signature level even though Zod omitted it — **key immutability is enforced only at the HTTP boundary.**
5. **NO authorization check inside the service.**

**SERIALIZER:** output keys verbatim `{ id, key, text, reference, translation, context, createdAt, updatedAt }`. **Nothing hidden, no separate admin DTO.** Response shape for the list: bare `{ data }` with **no `meta`**.

---

### 4.11 `settings` — mount `/api/v1/settings` (see also §7)

| Method | Path | Middleware chain, in order |
|---|---|---|
| GET | `/` | `validate({ query: emptyQuerySchema })` — **public** |
| PATCH | `/` | `authenticate()` → `requireAdmin` → `requireRole("ROLE_ADMIN")` → `validate({ body: settingsPatchSchema })` |

Note: **`PATCH`, not `PUT`** (README says `PUT` — a doc/code conflict, §11).
**SCHEMA:** `settingsPatchSchema = z.object({ settings: z.record(z.string(), z.string().trim().min(1).max(500)) })` — non-strict at the top level, so unknown *top-level* keys are silently stripped. Values 1–500 chars, empty forbidden. Keys are validated **only by the service**. The **15 allowed key literals** are listed in §7.1.
**SERVICE:** empty `settings` → `ValidationError("Aucun réglage à mettre à jour", { allowedKeys })`; any unknown key → `ValidationError("Clé de réglage non autorisée : …", { unknownKeys, allowedKeys })` — **all-or-nothing**, one bad key fails the whole batch. Response is the **full re-read document**, including keys not in the request. `getOverview()` reads settings and social links with `Promise.all`. **NO authorization check inside the service.**
Repository `listAll()`: `ORDER BY site_settings.key` — **no WHERE, no filter, no limit**. `upsertMany`: one bulk `insert … onConflictDoUpdate({ target: key, set: { value: excluded.value, updatedAt: now() } })`. **The whitelist is NOT enforced in the repository** (documented as intentional so the rule is testable without a DB) — **consequence: a row written out-of-band into `site_settings` IS returned by the public `GET /settings`.** The whitelist is write-only, not read-restricting.
**SERIALIZER:** `{ settings: Record<string,string>, socialLinks: { label, href }[] }` — **`SiteSetting.updatedAt` and every `SocialLink` field except label/href are dropped**. Response is the bare object (no `data` wrapper).

### 4.12 `social-links` — mount `/api/v1/social-links`

| Method | Path | Middleware chain, in order |
|---|---|---|
| GET | `/` | `validate({ query: emptyQuerySchema })` — **public** |
| POST | `/` | `authenticate()` → `requireAdmin` → `requireRole("ROLE_ADMIN")` → `validate({ body: socialLinkCreateSchema })` |
| PATCH | `/:id` | `authenticate()` → `requireAdmin` → `requireRole("ROLE_ADMIN")` → `validate({ params, body: socialLinkUpdateSchema })` |
| DELETE | `/:id` | `authenticate()` → `requireAdmin` → `requireRole("ROLE_ADMIN")` → `validate({ params })` |

**SCHEMA** verbatim:
```ts
export const socialLinkParamsSchema = z.object({ id: z.uuid() });
export const socialLinkCreateSchema = z.object({
  label: z.string().trim().min(1).max(60),
  href: z.url({ protocol: z.regexes.httpProtocol }),
  position: z.coerce.number().int().min(0).max(9999).default(0),
});
export const socialLinkUpdateSchema = socialLinkCreateSchema.partial()
  .refine((value) => Object.keys(value).length > 0, { message: "Aucun champ à mettre à jour" });
```
Required: `label` (1–60), `href` (**http/https only** — `javascript:`/`data:` are refused by `z.regexes.httpProtocol`). Optional: `position` 0–9999, default `0`.
**SERVICE:** pure pass-through with existence guards → 404 `SOCIAL_LINK_NOT_FOUND` with `{ id }`. **No duplicate check** (duplicate `label`/`href` allowed), **no authorization check inside the service**.
Repository `list()`: `ORDER BY asc(position), asc(label)` — **no limit, no filter**.
**SERIALIZER:** `{ id, label, href, position, createdAt, updatedAt }` — 1:1 with the entity, nothing extra leaked. A reduced `toSocialLinkSummaryDto` exists but is **unused** (dead helper). List shape is `{ data }` **without `meta`**.

### 4.13 `static-pages` — mount `/api/v1/pages` (see also §7.2)

| Method | Path | Middleware chain, in order |
|---|---|---|
| GET | `/:pageKey` | `validate({ params: pageParamsSchema, query: emptyQuerySchema })` — **public** |
| PATCH | `/:pageKey` | `authenticate()` → `requireAdmin` → `requireRole("ROLE_ADMIN")` → `validate({ params: pageParamsSchema, body: pageContentUpdateSchema })` |

**There is NO collection route** (`GET /api/v1/pages` falls through to the 404 handler) and **NO DELETE route** — a page body can never be deleted through the API. Note **`PATCH`, not `PUT`** (README says `PUT` — doc/code conflict).
**SCHEMA** verbatim:
```ts
export const pageParamsSchema = z.object({
  pageKey: z.string().trim().min(1).max(60),   // permissif : clé inconnue ⇒ 404 métier, pas 400
});
export const pageContentUpdateSchema = z.object({ content: z.record(z.string(), z.unknown()) });
```
Stage 1 validates only that `content` is a record of unknown values (non-strict). **Stage 2 is the per-`pageKey` Zod schema from `page-content.ts`, applied in the service.**
**SERVICE (`static-page.service.ts`):** `schemaFor(pageKey)` throws `NotFoundError("PAGE_NOT_FOUND", \`Aucune page éditable ne correspond à la clé « ${pageKey} »\`, { pageKey })` for any unregistered key. `getByKey` 404s **twice** for distinct reasons (unregistered key vs. registered-but-unseeded, with two different messages). `updateContent` `safeParse`s the content against the page schema → on failure `ValidationError(\`Contenu invalide pour la page « ${pageKey} »\`, [{champ,message}])`; only the **parsed** data is persisted, so unknown field names inside `content` are **stripped, not rejected**. `toContentRecord` re-checks the object shape. **Full-replacement semantics, no merge** — and because `heroTitle`/`heroIntro` (accueil) and `title`/`intro` (the other five) are required, a partial patch containing only optional fields fails. `updatedBy` comes from `req.admin?.id ?? null`, **never from the body**. **NO authorization check inside the service.**
Repository `upsert` is an `onConflictDoUpdate({ target: pageKey, set: { content: excluded, updatedBy: excluded, updatedAt: now() } })` — idempotent, full overwrite, no history. `asContent()` coerces a non-object `jsonb` to `{}` on read (silent degradation).
**SERIALIZER:** `toStaticPageDto` returns **all six entity fields**, including **`updatedBy`** — and it does so on the **public unauthenticated `GET /api/v1/pages/:pageKey`**. The file's own comment says *"`updatedBy` identifie l'administrateur de la dernière modification : c'est une donnée de traçabilité, jamais une donnée d'affichage public."* **The code contradicts its own comment: the admin UUID is publicly exposed.** (Also flagged in OpenAPI as `"Administrateur de la dernière modification (traçabilité, jamais affiché)"` — same contradiction.)

### 4.14 `testimonies` — mount `/api/v1/testimonies`

| Method | Path | Middleware chain, in order |
|---|---|---|
| GET | `/` | `validate({ query: listQuerySchema })` — **public** |
| GET | `/:id` | `validate({ params: testimonyIdParamSchema })` — **public** |
| POST | `/` | `authenticate()` → `requireAdmin` → `requireRole("ROLE_ADMIN")` → `validate({ body: createTestimonySchema })` |
| PATCH | `/:id` | `authenticate()` → `requireAdmin` → `requireRole("ROLE_ADMIN")` → `validate({ params, body: updateTestimonySchema })` |
| DELETE | `/:id` | `authenticate()` → `requireAdmin` → `requireRole("ROLE_ADMIN")` → `validate({ params })` |

**SCHEMA** verbatim:
```ts
export const testimonyIdParamSchema = z.object({ id: z.uuid("Identifiant de témoignage invalide") });
export const listQuerySchema = paginationQuerySchema;
export const createTestimonySchema = z.object({
  quote: z.string().trim().min(1, "La parole rapportée est requise").max(2000),
  personName: z.string().trim().min(1, "Le prénom est requis").max(120),
  personRole: z.string().trim().max(120).nullish(),
  photoMediaId: z.uuid("Identifiant de média invalide").nullish(),
  position: z.coerce.number().int().min(0).max(9999).optional(),
});
export const updateTestimonySchema = createTestimonySchema
  .partial().refine((value) => Object.keys(value).length > 0, { message: "Aucun champ à mettre à jour" });
```
Required: `quote` (1–**2000**), `personName` (1–120). Optional: `personRole` ≤120 (**no `.min(1)` → empty string valid**), `photoMediaId`, `position` 0–9999.
**SERVICE:** pure delegation with 404 `TESTIMONY_NOT_FOUND` + `{ id }`. **No moderation state, no ownership, no authorization check** — a testimony is public the instant it is created.
Repository: `leftJoin(media, …)`, `ORDER BY asc(position), asc(createdAt)`, limit/offset in SQL, separate unscoped `count()`, `create`/`update` each cost an extra `findById` round trip, hard delete.
**SERIALIZER:** output keys verbatim `{ id, photo, quote, name, role, position }` — `photo ← photoUrl`, `name ← personName`, `role ← personRole`. **Hidden: `photoMediaId`, `createdAt`, `updatedAt`.**

---

### 4.15 PUBLICATIONS ARCHIVE RULE / RECENCY THRESHOLD — definitive answer

**There is NO archive rule, NO recency threshold, and NO expiry in the backend for publications. This is an ABSENT feature, not an undocumented one.** Evidence:

- `PublicationFilters` (domain port, verbatim) is exactly `{ type?, category?, status? }`. There is no date field, no window, no threshold.
- `PublicationSortColumn = "published_at" | "created_at"` — ordering only.
- The `publications` table has no `archived_at`, `expires_at`, `archive_after`, `is_archived`, or `visibility` column (§1.8).
- `PublicationStatus = "DRAFT" | "PUBLISHED"` only (§3.1); `pgEnum("publication_status", ["DRAFT", "PUBLISHED"])` (§1.1). **There is no `ARCHIVED` literal anywhere for publications.**
- There is **no date-window query parameter** on `GET /publications` — `listPublicationQuerySchema` accepts exactly `page`, `limit`, `type`, `category`, `sort`.
- A repo-wide grep for `archiv|recen|threshold|expir|seuil|mois|months|olderThan|cutoff|purge|retention` over `backend/src` returns matches **only in the events module** (`domain/rules/event-status.ts`, `domain/entities/index.ts:21-23`, `schema/events.ts:20-25`, `infrastructure/repositories/event.repository.ts:24,74`, `modules/events/event.schema.ts:42`) plus JWT-expiry wording in `infrastructure/supabase/auth.ts` and OpenAPI text.
- The **only** recency/archive rule in the backend is `computeEventStatus` (§3.3) and it belongs to **events**.

**Consequence:** a publication dated any number of years in the past remains publicly listable and individually readable forever. "Recency" for publications is purely a **sort order** (`published_at DESC`). Any archive/recency behaviour the documentation describes lives in the frontend or in `docs/` — **it does not exist in backend code.**

### 4.16 DRAFT → PUBLISHED → ARCHIVED WORKFLOW — definitive answer

**The workflow exists in code ONLY as a two-state draft/publish toggle on `publications`. There is no third state and no transition machinery.**

Present in code:
- Two states: `"DRAFT"`, `"PUBLISHED"` (enum + domain type).
- Default `PUBLISHED` applied in **SQL** (`status: data.status ?? "PUBLISHED"`), while the Zod schema leaves `status` optional with no default.
- Public invisibility of drafts, **enforced twice**: the service hard-codes `status: "PUBLISHED"` on the list, and the single read calls `findByIdOrSlug(value, false)` which adds `and(identity, eq(publications.status, "PUBLISHED"))` in SQL. A draft returns `PUBLICATION_NOT_FOUND` — indistinguishable from a missing row.
- Admin read paths include drafts (`require(idOrSlug, true)`) so an admin can correct or delete what they unpublished.
- `status` is **not** an accepted query parameter publicly, so `?status=DRAFT` is a 400 on the strict object.

ABSENT from code (documentation-only or nonexistent):
- **No `ARCHIVED` state** for publications.
- **No transition endpoint** — no `POST /publications/:id/publish`, no `POST /publications/:id/archive`, no `unpublish`. Status changes only via a generic `PATCH /publications/:idOrSlug` body.
- **No scheduled publishing** (`published_at` is a plain date, never compared to "now" to gate visibility — a `FUTURE` `publishedAt` is **immediately visible**).
- **No transition validation** — any `DRAFT ↔ PUBLISHED` jump is allowed with no rule, no guard, no reason field.
- **No `publishedBy`/`archivedBy`/`statusChangedAt`** — nothing records who published, unpublished or when.
- **No workflow history / revision table.**
- **No draft state at all on any other entity** — departments, events, leaders, testimonies, community faces, scriptures, schedule, settings, social links and static pages are public the instant they are written.

---

## 5. AUTH & AUTHORIZATION

### 5.1 What roles exist — every role literal VERBATIM

| Literal | Where | Count |
|---|---|---|
| `"ROLE_ADMIN"` | `domain/entities/index.ts` (`export type AdminRole = "ROLE_ADMIN";`) | the only application role |
| `"ROLE_ADMIN"` | `schema/enums.ts` (`export const adminRoleEnum = pgEnum("admin_role", ["ROLE_ADMIN"]);`) | the only DB role value |
| `"ROLE_ADMIN"` | every one of the 14 routers: `requireAnyAdmin(deps.authDeps, "ROLE_ADMIN")` | the only role ever required |
| `"ROLE_ADMIN"` | `domain/repositories/index.ts` (`role?: "ROLE_ADMIN"`) and `admin-profile.repository.ts` (`const role = data.role ?? "ROLE_ADMIN"`) | the only role assignable |
| `"ROLE_ADMIN"` | `scripts/create-admin.ts` (`role: "ROLE_ADMIN"`) | the only role the CLI creates |
| `"ROLE_DEPARTMENT_EDITOR"` | **ONLY inside an `enums.ts` comment** as a future example — *never in code* | 0 |
| `"authenticated"`, `"service_role"` | `AuthenticatedUser.tokenRole` — the **Supabase JWT** `role` claim, read into `req.auth.tokenRole` | not an application role |

**Definitive: there is exactly ONE application role, `ROLE_ADMIN`, and `requireRole("ROLE_ADMIN")` is therefore a no-op distinction within the administrator population.**

### 5.2 SCOPE / DEPARTMENT-SCOPING mechanism — definitive answer

**There is NONE. Department-restricted managers cannot be expressed, granted, or enforced in this codebase.**

Evidence, exhaustively:
1. **`admin_profiles` has no `department_id` column** and no scope column (§1.2). It has exactly: `id`, `username`, `display_name`, `role`, `is_active`, `created_at`, `updated_at`.
2. **No join table** exists linking admins to departments (the only join tables are `department_media` and `event_media`, both about media).
3. **The `AdminProfile` domain entity and the `AdminProfileRepository` port** have no department/scope field and no scoped query method (§3.1, §3.2). The repository's only lookups are `findById`, `findByUsername`, `list`.
4. **`AdminRole` has one value**, so a "department editor" role cannot be represented in the type system or the DB enum.
5. **`req.admin` carries no scope** — `express.d.ts` declares only `{ auth?: AuthenticatedUser; admin?: AdminProfile }`, neither of which has a department.
6. **The only `scope` in the schema is `leaders.scope`**, a free-text display field ("Domaine couvert, ex. « Chorale »") with no relation to authorization. Grepping `scope` across `backend/src` returns only `leaders`/`leadership` display usage, `personRole`/`role` display strings, and OpenAPI prose.
7. **`tokenRole` is read from the JWT and then NEVER used.** `verifyAccessToken` returns it (`tokenRole: readString(payload, "role")`) but no middleware, service, or route consults it. Authorization uses only the DB `admin_profiles.role`.
8. **No claims check beyond the JWT `sub`.** The only claims inspected are `sub` (→ `userId`), `email`, and `role` (unused); verification enforces `issuer` and `audience: "authenticated"`.
9. **No resource-ownership check anywhere.** Any `ROLE_ADMIN` can mutate any department, any department's events, any leader, any publication, any prayer request — grep for `req.admin` in a service context returns nothing but logging.

**How is a department-restricted manager enforced? It is NOT. There is no code path, no column, no role, and no check. A "department manager" today would necessarily be a full `ROLE_ADMIN` with global write access.** The `enums.ts` comment shows the design *anticipated* adding `ROLE_DEPARTMENT_EDITOR` via `ALTER TYPE … ADD VALUE` — but it was never added, and even adding the enum value would not by itself create a scoping mechanism (there is no column to scope on).

### 5.3 RBAC beyond a role string — definitive answer

**There is NO permission table, NO permission list, NO permission enum, NO policy engine, NO CASL/ABAC library, and NO route-permission mapping.** The complete authorization vocabulary is:

```ts
// presentation/middlewares/auth.ts — the full authorization surface, verbatim
export interface AuthDependencies {
  adminProfiles: AdminProfileRepository;
}

export function authenticate(): RequestHandler {
  return async (req, _res, next) => {
    try {
      const token = extractBearerToken(req.headers.authorization);
      if (!token) throw new AuthRequiredError();
      req.auth = await verifyAccessToken(token);
      next();
    } catch (error) { next(error); }
  };
}

export function requireAdmin(deps: AuthDependencies): RequestHandler {
  return async (req, _res, next) => {
    try {
      if (!req.auth) throw new AuthRequiredError();
      const profile = await deps.adminProfiles.findById(req.auth.userId);
      if (!profile) {
        logger.warn({ userId: req.auth.userId }, "Accès refusé : utilisateur authentifié sans profil administratif");
        throw new ForbiddenError("Ce compte n'est pas autorisé à administrer le site");
      }
      if (!profile.isActive) {
        logger.warn({ userId: req.auth.userId }, "Accès refusé : compte administratif désactivé");
        throw new ForbiddenError("Ce compte administrateur est désactivé");
      }
      req.admin = profile;
      next();
    } catch (error) { next(error); }
  };
}

export function requireRole(...roles: readonly AdminRole[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.admin) { next(new AuthRequiredError()); return; }
    if (!roles.includes(req.admin.role)) {
      logger.warn({ userId: req.admin.id, role: req.admin.role, required: roles }, "Accès refusé : rôle insuffisant");
      next(new ForbiddenError("Votre rôle ne permet pas cette opération"));
      return;
    }
    next();
  };
}

export function requireAnyAdmin(deps: AuthDependencies, ...roles: readonly AdminRole[]): RequestHandler[] {
  return [authenticate(), requireAdmin(deps), requireRole(...roles)];
}
```
That is the whole authorization system: **token validity + an active row in `admin_profiles` + membership in a one-element role list.** The header comment states the (accurate) design intent: *"Le contrôle est centralisé : aucun controller ne teste un rôle lui-même."* — verified: no controller and no service performs any authorization check.

### 5.4 Token verification — `infrastructure/supabase/auth.ts`

- Asymmetric verification against the project's JWKS: `createRemoteJWKSet(new URL(\`${env.SUPABASE_URL}/auth/v1/.well-known/jwks.json\`), { cacheMaxAge: 10*60*1000, timeoutDuration: 5_000, cooldownDuration: 30_000 })`.
- `jwtVerify(token, JWKS, { issuer, audience: "authenticated" })` where `issuer = \`${env.SUPABASE_URL}/auth/v1\``.
- `AuthenticatedUser = { userId (from sub), email, tokenRole (from role) }`.
- Failure → `AuthRequiredError("Jeton d'accès invalide ou expiré")` with a deliberately generic message (*"on ne dit pas au client *pourquoi* le jeton est refusé"*).
- `extractBearerToken` requires the exact scheme `bearer` (case-insensitive) followed by a non-empty token; a missing/short/malformed header returns `null`.
- **The token is verified locally with no network call per request** (JWKS cached) — an explicit performance constraint.

### 5.5 Protected vs public — complete route-by-route table

**PUBLIC (no `Authorization` required) — 15 operations:**

| Method | Full path | Middleware |
|---|---|---|
| GET | `/api/v1/health` | none (mounted **before** the rate limiter) |
| GET | `/api/v1/departments` | `validate({ query })` |
| GET | `/api/v1/departments/:idOrSlug` | `validate({ params })` |
| GET | `/api/v1/events` | `validate({ query })` |
| GET | `/api/v1/events/:idOrSlug` | `validate({ params })` |
| GET | `/api/v1/publications` | `validate({ query })` |
| GET | `/api/v1/publications/:idOrSlug` | `validate({ params })` |
| GET | `/api/v1/leaders` | `validate({ query })` |
| GET | `/api/v1/leaders/:id` | `validate({ params })` |
| GET | `/api/v1/testimonies` | `validate({ query })` |
| GET | `/api/v1/testimonies/:id` | `validate({ params })` |
| GET | `/api/v1/community-faces` | `validate({ query })` |
| GET | `/api/v1/community-faces/:id` | `validate({ params })` |
| GET | `/api/v1/scriptures`, `GET /api/v1/scriptures/:key` | `validate` |
| GET | `/api/v1/schedule`, `GET /api/v1/social-links`, `GET /api/v1/settings`, `GET /api/v1/pages/:pageKey` | `validate` |
| POST | `/api/v1/prayer-requests` | **`publicWriteLimiter` (5/h/IP)** → `validate({ body })` |

**PROTECTED — all writes plus the whole media registry and admin surface.** Every one uses the same chain: `authenticate()` → `requireAdmin(deps)` → `requireRole("ROLE_ADMIN")` → `validate(...)`.
Exception: `GET /api/v1/admin/me` uses `authenticate()` → `requireAdmin(deps)` **without `requireRole`** (active admin, any role).

Full protected list: `POST/PATCH/DELETE` on `departments`, `events`, `publications`, `leaders`, `testimonies`, `community-faces`, `scriptures`, `schedule`, `social-links`; `PATCH /settings`; `PATCH /pages/:pageKey`; **every** `media` route (GET list, GET `:id`, GET `:id/usage`, POST, DELETE); `GET/PATCH/DELETE` on `prayer-requests` and `GET /prayer-requests`; `GET /admin/me`; `GET /admin/profiles`.

**MISSING: there is no role-restricted route beyond `ROLE_ADMIN`. Every protected route has identical authorization — a single global administrator privilege level.**

### 5.6 Error semantics

- Missing/invalid token → **401 `AUTH_REQUIRED`**.
- Valid token, **no `admin_profiles` row** → **403 `FORBIDDEN`** ("Ce compte n'est pas autorisé à administrer le site"). **Authenticating with the identity provider confers no permission on its own** — explicitly documented.
- Valid token, profile present, **`is_active = false`** → **403 `FORBIDDEN`** ("Ce compte administrateur est désactivé").
- Valid token, active profile, wrong role → **403 `FORBIDDEN`** ("Votre rôle ne permet pas cette opération").
- `UNAUTHENTICATED_ADMIN` is declared in the `ErrorCode` union but **is never thrown by the implementation**; the OpenAPI document admits this verbatim: *"Le code `UNAUTHENTICATED_ADMIN` est déclaré pour ce cas dans `shared/errors/app-error.ts` mais n'est pas émis par l'implémentation V1, qui répond toujours `FORBIDDEN`."* → **dead error code.**

---

## 6. STORAGE & MEDIA

### 6.1 Bucket(s)

- **There is no exported bucket-name literal.** The bucket is `env.SUPABASE_STORAGE_BUCKET`, declared `z.string().min(1).default("ccjv-media")` — **default `"ccjv-media"`**.
- Consumed as a constructor default: `constructor(private readonly bucket: string = env.SUPABASE_STORAGE_BUCKET) {}`; a singleton `export const storageService = new StorageService();` is created at module load.
- The seed **creates the bucket if missing and forces it public**: `supabaseAdmin.storage.createBucket(bucket, { public: true })`, and if `current.data.public !== true` it calls `updateBucket(bucket, { public: true })` and prints *"Bucket « … » : rendu public (il ne l'était pas)."*
- **Exactly one bucket is used.** No separate bucket for private/draft media, no per-tenant bucket.

### 6.2 Allowed MIME types and size limit — VERBATIM

```ts
export const ACCEPTED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;
```
- **Images only. No video, no PDF, no GIF, no BMP, no SVG.** SVG absence is a deliberate XSS-avoidance posture; video publications store an external URL instead.
- Detection is by **magic bytes, never `Content-Type` or filename**: JPEG `FF D8 FF`; PNG `89 50 4E 47 0D 0A 1A 0A`; WEBP `RIFF`…`WEBP`; AVIF ISO-BMFF `ftyp` + `avif`/`avis`. An empty buffer or an unrecognised signature → `UnsupportedMediaTypeError(ACCEPTED_IMAGE_MIME_TYPES)` → **415 `INVALID_FILE_TYPE`**, details `{ accepted }`.
- Size: `MAX_UPLOAD_BYTES: z.coerce.number().int().positive().default(5_242_880)` → **5 MiB**, enforced **twice**: multer `limits: { fileSize: env.MAX_UPLOAD_BYTES, files: 1 }` (request time; `LIMIT_FILE_SIZE` mapped to `PayloadTooLargeError` → 413 `FILE_TOO_LARGE`, details `{ maxBytes }`) **and** `StorageService.upload` (`if (file.size > env.MAX_UPLOAD_BYTES) throw new PayloadTooLargeError(…)`), which *"ne fait confiance à aucune métadonnée de la requête."*
- **MISSING: no dimension/aspect-ratio limit, no pixel-bomb guard, no EXIF stripping, no AV scanning, no re-encoding, no thumbnails/variants.**

### 6.3 Upload flow

1. Route chain: `...admin` → `singleFileUpload()` → `validate({ body: uploadMediaBodySchema })` → controller.
2. **Multipart via multer `memoryStorage()` — NOT presigned.** Nothing is written to the server disk (*"le système de fichiers de l'hébergement est éphémère"*). Field name is **`"file"`**, one file only.
3. `singleFileUpload()` wraps `uploadFile.single("file")` and translates multer errors: `LIMIT_FILE_SIZE` → 413 `FILE_TOO_LARGE`; anything else → `ValidationError("Téléversement invalide", [{ champ: error.field ?? "file", message: error.message }])`.
4. `StorageService.upload(folder, { buffer, size }, alt)`:
   - size check, then empty-buffer check, then magic-byte MIME detection;
   - `const extension = extensionForMimeType(mimeType);` → `jpg` | `png` | `webp` | `avif`;
   - **`const path = \`${folder}/${randomUUID()}.${extension}\`;`** — **the client-provided filename never reaches Storage**, eliminating `../` traversal and collisions;
   - `supabaseAdmin.storage.from(bucket).upload(path, file.buffer, { contentType: mimeType, upsert: false, cacheControl: "31536000" })` (1 year — justified by the immutable UUID name);
   - dimensions read from bytes (`readImageDimensions`); **AVIF returns `null` by design** (*"On préfère ne rien annoncer plutôt qu'annoncer un chiffre faux"*);
   - public URL from `getPublicUrl(path)`.
5. `MediaService.upload`: file **first**, `media` row **second**; on insert failure `compensate()` calls `storage.remove(path)`; if compensation also fails it logs *"Compensation impossible : le fichier téléversé reste orphelin dans le Storage"* and rethrows the original error. **Best-effort, not transactional** — a process crash between the two steps still orphans the object.
6. Response: `sendItem(res, toMediaDto(asset), 201)` — bare DTO, **no `Location` header**.

**Ordering caveat (documented vs code):** `media.routes.ts` claims *"Le dossier de destination est validé avant tout appel au Storage."* The chain actually runs `singleFileUpload()` **before** `validate({ body })`, so the full file (up to 5 MiB) is buffered in memory **before** the `folder` whitelist and `alt` are validated. The claim holds only in the narrow sense that `storage.upload` runs later in the controller.

### 6.4 Folder / prefix conventions

`StorageFolder` union, verbatim — 7 values, and `MEDIA_FOLDERS` is contract-locked to it via `as const satisfies readonly StorageFolder[]`:

```
"events" | "departments" | "publications" | "leaders" | "testimonies" | "community" | "pages"
```
- The folder is a **closed Zod enum** at the API boundary — *"Il ne doit jamais venir d'une chaîne libre, sinon un client pourrait écrire n'importe où dans le bucket."*
- The seed uses exactly one folder: `const SEED_MEDIA_FOLDER = "pages";`.
- Serializer reports the folder as the first path segment: `folderOf(path) = path.slice(0, path.indexOf("/"))` or `null`.

### 6.5 How media rows relate to entities

An entity never stores a URL — it stores a **media id**, and the **repository** resolves it to a public URL:

| Entity column | FK | ON DELETE | Resolution |
|---|---|---|---|
| `departments.banner_media_id` | `media.id` | set null | repository `hydrate` → `bannerImageUrl` |
| `department_media.media_id` | `media.id` | **restrict** | repository gallery query, ordered by `position` |
| `events.image_media_id` | `media.id` | set null | repository `hydrate` → `imageUrl` |
| `events.banner_media_id` | `media.id` | set null | repository `hydrate` → `bannerImageUrl` |
| `event_media.media_id` | `media.id` | **restrict** | repository gallery query, ordered by `position` |
| `publications.cover_media_id` | `media.id` | set null | repository `hydrate` → `coverImageUrl` |
| `leaders.photo_media_id` | `media.id` | set null | `leftJoin(media)` → `photoUrl` |
| `testimonies.photo_media_id` | `media.id` | set null | `leftJoin(media)` → `photoUrl` |
| `community_faces.photo_media_id` | `media.id` | set null | `leftJoin(media)` → `photoUrl` |
| `media.uploaded_by` | `admin_profiles.id` | set null | not exposed publicly |

URL resolution is always **one batched query** — `inArray(media.id, [...ids])` for galleries, a single `leftJoin` for portraits — never N+1. A media id with no matching row degrades to `null` (cover/portrait) or a skipped gallery entry, never an error.

**Delete protection.** `MediaService.remove(id, force)`:
```ts
const usages = await this.media.listUsages(id);
const total = countTotal(usages);
if (total > 0 && !force) {
  throw new ConflictError("CONFLICT",
    "Ce média est encore utilisé : retirez-le des contenus concernés, ou forcez la suppression",
    { total, usages: usages.filter((usage) => usage.count > 0) });
}
if (total > 0) { logger.warn(…, "Suppression forcée d'un média référencé : les références sont détachées"); await this.media.clearReferences(id); }
const removed = await this.media.remove(id);
if (!removed) throw notFound(id);
await this.storage.remove(asset.path);
```
`listUsages` counts **9 sources in a single SQL statement** (sub-selects), with these exact source ids and labels:
`event_media` "Galerie d'un événement"; `department_media` "Galerie d'un département"; `events_image` "Image principale d'un événement"; `events_banner` "Bandeau d'un événement"; `departments_banner` "Bandeau d'un département"; `publications_cover` "Couverture d'une publication"; `leaders_photo` "Portrait d'un responsable"; `testimonies_photo` "Portrait d'un témoignage"; `community_faces_photo` "Portrait d'un visage de la communauté".
`clearReferences` runs inside **one transaction**: it **deletes** the `event_media`/`department_media` rows (because those `media_id` are `NOT NULL` + `restrict`) and **sets to `NULL`** every `*_media_id` column on events (image + banner), departments (banner), publications (cover), leaders, testimonies, community faces.
Order is deliberate: references detached and row deleted **before** the file, so a failure never leaves a page pointing at a missing image. The converse failure (storage remove fails after the row is gone) leaves a row-less object.
**Forced deletion is irreversible and leaves no audit trail beyond a single `logger.warn`. No delete actor is recorded anywhere.**

### 6.6 alt-text / caption / credit

- **`alt` EXISTS**: `media.alt` (`text`, nullable), surfaced through `UploadedFile & { alt: string | null }`, persisted, and exposed by `MediaDto.alt`. It is documented as *"Texte alternatif : obligatoire pour l'accessibilité WCAG 2.2 AA"*.
- **However `alt` is OPTIONAL in the API**: `alt: z.string().trim().max(300).optional()`, and `StorageService` stores `alt ?? null`. **There is no enforcement of the WCAG requirement it is justified by.**
- **`caption` exists ONLY on `community_faces.caption`** — it is a *person* caption, not a media caption.
- **`credit` DOES NOT EXIST ANYWHERE** in `backend/src` (grep for `credit`: 0 matches). There is no attribution, no licence, no photographer/source field, no copyright field on any table or DTO.

---

## 7. SETTINGS & STATIC PAGES & SOCIAL LINKS

### 7.1 What exactly is stored as a "setting" — every KEY literal

`site_settings` is `key varchar(80) PK` + `value text NOT NULL` + `updated_at`. **Scalar key/value text only.** No per-key type, no enum, no JSON, no validation of the *value* beyond `min(1).max(500)`.

**Every setting KEY literal found in code or seed data (15; identical in both places), VERBATIM in declaration order:**
```
site.name
site.acronym
site.location
site.foundedAt
site.ecodimFoundedAt
site.visionary
site.visionaryRole
site.address
site.addressLine1
site.addressLine2
site.addressLine3
site.scheduleAdults
site.scheduleChildren
site.whatsappNumber
site.whatsappHref
```
Source: `modules/settings/setting.schema.ts` `ALLOWED_SETTING_KEYS` (hardcoded array) and `infrastructure/database/seed-data.ts` `seedDataset.siteSettings` (the seeded values, §8.2).

**Two independent `ALLOWED_SETTING_KEYS` exports exist with the same name:**
- `modules/settings/setting.schema.ts` → the **runtime** whitelist (hardcoded 15-item `as const` array), used by `isAllowedSettingKey`.
- `infrastructure/database/seed-data.ts` → `export const ALLOWED_SETTING_KEYS: readonly string[] = Object.keys(seedDataset.siteSettings);`, consumed **only** by the OpenAPI document to build a description string.
**They currently agree by coincidence, not by construction — adding a key to one place and not the other would silently disagree.**

**Write path restrictions:** writes are exclusively `ROLE_ADMIN` via `requireAnyAdmin(deps.authDeps, "ROLE_ADMIN")`. The whitelist check lives in the **service** (not the repository), is all-or-nothing, and rejects empty objects. The response is the full re-read document.
**Read path gap:** `SettingRepository.listAll()` has **no key filter**, so the whitelist does **not** restrict reads — any out-of-band row in `site_settings` is publicly readable via the unauthenticated `GET /api/v1/settings`.
**Also MISSING:** no endpoint to delete a setting, no per-key PATCH, no history of setting changes (only `updated_at`, and no actor).

### 7.2 What is a "static page" and how is its body modelled

**A "static page" is a row in `static_pages` identified by a `page_key` from a closed registry, whose body is a `jsonb` object of named, length-bounded TEXT fields validated by a per-key Zod schema.**

**It is NOT markdown. It is NOT HTML. It is NOT sections. It is NOT blocks.** It is a flat map of named text fields (§3.4). The DB comment states the design: *"Le back-office édite des champs nommés, jamais du HTML : cela évite toute injection et empêche qu'une mise en page soit cassée par une saisie."*

Validation happens in **two stages**:
1. Route-level: `pageContentUpdateSchema = z.object({ content: z.record(z.string(), z.unknown()) })` — only the shape.
2. Service-level: the per-`pageKey` schema from `page-content.ts`; failure → `VALIDATION_ERROR` with `{champ,message}` details; **unknown key → `PAGE_NOT_FOUND` (404)**, which is why the path param is deliberately permissive (`pageKey: z.string().trim().min(1).max(60)`).

Only the **parsed** data is persisted, so undeclared fields inside `content` are **stripped, not rejected** (the page schemas are plain non-optional `z.object`). `PATCH` is a **full replacement with no merge**, and because 2 fields per page are required, a patch containing only optional fields fails validation. `updatedBy` comes from the verified token (`req.admin?.id ?? null`), never from the body.

**The structure, copied (repeated here for §7 completeness):** 6 page keys — `accueil`, `qui-sommes-nous`, `organisation`, `communaute`, `vie-de-leglise`, `publications` — each with 2 required fields (`heroTitle`/`heroIntro` for `accueil`; `title`/`intro` for the rest) and 2 optional fields, using the single primitive `text(max) = z.string().trim().min(1).max(max)`. **30 fields total: 12 required, 18 optional. No section keys, no ordering metadata.**
**MISSING:** no collection/list route, no DELETE route, no draft/status, no versioning or revision history, no preview, and **`updatedBy` (an admin UUID) is returned by the unauthenticated public GET** (§4.13).

### 7.3 Social links

`social_links`: `id uuid PK`, `label varchar(60) NOT NULL`, `href text NOT NULL`, `position integer NOT NULL default 0`, timestamps. Ordered by `asc(position), asc(label)`.
Public `GET /api/v1/social-links` returns `{ data: [...] }` **without `meta`** (bounded, non-paginated). `href` is validated as http/https only (`z.url({ protocol: z.regexes.httpProtocol })`) — *"un `href` arbitraire (`javascript:`, `data:`) est refusé par Zod"*. Writes are `ROLE_ADMIN`. **No duplicate check on `label`/`href`, no unique index.**
Social links are **also** exposed, reduced to `{ label, href }`, inside the public `GET /api/v1/settings` response — the same data reachable from two endpoints, with different shapes (the `/social-links` DTO includes `id`, `position`, timestamps).

---

## 8. SEED DATA

### 8.1 What `seed.ts` actually creates

Order of operations, verbatim from the script: **production guard → optional `--reset` → media phase → content tables in dependency order → summary.** Guarantees documented in-file: refuse in production; media first; idempotence; no invented data.

- **Production guard:** throws if `NODE_ENV=production` unless `ALLOW_SEED_IN_PRODUCTION=true`.
- **`--reset`** empties 11 content tables via `RESET_TABLES` in reverse-dependency order: `community_faces`, `testimonies`, `leaders`, `publications`, `events`, `departments`, `static_pages`, `scriptures`, `schedule_entries`, `social_links`, `site_settings`. Galleries follow their parent via `ON DELETE CASCADE`. It then removes **seed media only** (rows whose `alt` starts with `SEED_MEDIA_ALT_PREFIX = "CCJV (démo) — "`), file first then row. **`admin_profiles` and Supabase Auth accounts are NOT touched** (*"l'accès au back-office doit survivre à une remise à zéro du contenu"*), and back-office uploads without the marker are preserved.
- **Idempotence:** each table is `count()`ed first; a non-empty table is **skipped** entirely (`step()` returns `{ skipped: true }`). Re-running never duplicates.
- **Media:** the seed ensures the bucket exists and is public, uploads only files actually referenced by the dataset (via `collectMediaFilenames`), into the single folder `pages`, then creates `media` rows; it reuses an existing media found by `findByPath("pages/<filename>")` or by the `alt` marker; on insert failure it compensates by deleting the uploaded file.
- **Media file directory candidates:** `frontend/public/media/` resolved relative to this file, then `resolve(process.cwd(), "..", "frontend", "public", "media")`.
- **`static_pages` are seeded with `updatedBy = null`** — *"aucune modification humaine n'a eu lieu."*

**Exact counts created (from `seedDataset`):**

| Table | Count | Notes |
|---|---|---|
| `media` | up to **26** distinct referenced files | union of all `SeedMediaRef`s; actual count depends on the frontend media folder. Uploaded/reused counts are reported at runtime. |
| `site_settings` | **15** | one per key |
| `social_links` | **2** | `position` 0, 1 |
| `schedule_entries` | **6** | `position` 0..5 |
| `scriptures` | **7** | keys below |
| `static_pages` | **6** | one per page key |
| `departments` | **3** | names/slugs below |
| `events` | **7** | 4 future (`+3, +7, +10, +16` days), 3 past (`-4, -14, -18`) |
| `publications` | **10** | 2 VIDEO, 4 PHOTO, 4 TEXTE |
| `leaders` | **5** | `position` 0..4 |
| `testimonies` | **4** | `position` 0..3 |
| `community_faces` | **5** | `position` 0..4 |

**ADMIN USER / ROLE: the seed creates NONE.** `seed.ts` never touches `admin_profiles`, never calls `supabaseAdmin.auth.admin.createUser`, and never references `AdminProfileRepository`. **There is no seeded admin, no seeded credentials, and no seeded role row.** The only way to create a first administrator is the CLI `npm run admin:create` → `scripts/create-admin.ts` (creates the Supabase Auth user first, then the `admin_profiles` row with `role: "ROLE_ADMIN"`; on profile failure it deletes the auth user as compensation). That script is explicitly *"NON destiné à la production"*. **MISSING: no seed of a secondary/limited administrator, because no such role exists.**

### 8.2 Every department name + slug literal

| `name` (verbatim) | `slug` | How the slug is produced |
|---|---|---|
| `Adultes` | **`adultes`** | derived at seed time by `uniqueSlug(department.name, c => slugExists(c))` — **not a hardcoded literal** |
| `Enfants / Ecodim` | **`enfants-ecodim`** | derived (`/` → `-`, lowercased) |
| `Chorale` | **`chorale`** | derived |

**Important: slugs are NOT literals in `seed-data.ts`.** The dataset declares only `name`; `seed.ts` computes the slug with `uniqueSlug(name, …)` → `slugify()` (NFD, strip accents, lowercase, apostrophes→`-`, non-alphanumerics→`-`, trim/collapse dashes, `slice(0,160)`), suffixing `-2`, `-3`… on collision. Therefore the slugs above are the **derived results**, and they would change if a department were seeded earlier or renamed. Corresponding `responsibleName` values, verbatim: `"Pasteur Manasse Mwamba"`, `"Responsable Ecodim — à confirmer"`, `"Responsable chorale — à confirmer"`.

### 8.3 Other seeded name/key literals worth recording

- **Scripture keys (7, verbatim):** `rassemblement`, `louange`, `repos`, `parole`, `ouvrage`, `corps`, `memoire` — all `translation: "Louis Segond 1910"`, all `context: null`.
- **Static page keys (6):** `accueil`, `qui-sommes-nous`, `organisation`, `communaute`, `vie-de-leglise`, `publications` — **each seeded with ONLY its two required fields**; all 18 optional fields are unexercised in data.
- **Schedule entries (6):** `Dimanche`/"Culte dominical"/`09h00`/`isConfirmed: false`; `Dimanche`/"Ecodim"; `Lundi`/"Répétition de la chorale"/`16h30 – 18h30`/`isConfirmed: true`; `Mercredi`/"Répétition de la chorale"/`Dans la nuit`/`true`; `Mercredi`/"Prière et intercession"/`17h00`/`false`; `Samedi`/"Répétition de la chorale"/`16h30 – 18h30`/`true`.
- **Social links (2):** `Instagram` → `https://www.instagram.com/ecodim_ccjv/`; `TikTok` → `https://www.tiktok.com/@ecodim_ccjv`.
- **Leader names (5):** `Pasteur Manasse Mwamba` (scope `Direction générale`), `Responsable — Adultes` (`Adultes`), `Responsable — Ecodim` (`Enfants / Ecodim`), `Responsable — Chorale` (`Chorale`), `Responsable — Accueil` (`Communauté`).
- **Testimony person names (4):** `Grâce`, `Patrick`, `Esther`, `Josué`.
- **Community face names (5):** `Grâce`, `Patrick`, `Esther`, `Naomi`, `Emmanuel`.
- **Media file references are bare filenames** (`ccjv-01.jpeg` … `ccjv-40.jpeg`) resolved against `frontend/public/media/`; the seed's `alt` is `"CCJV (démo) — " + filename`.
- **Provenance discipline:** the dataset header distinguishes **CONFIRMÉ par CCJV** (foundation 17 March 2023; Ecodim 2 July 2023; Pasteur Manasse Mwamba; Quartier Hewa Bora / Avenue Djoloko; chorale times) from **DÉMONSTRATION** (everything else, including event dates, publications, testimonies, faces, Sunday service times, and the WhatsApp number `+243 123 456 789`). All YouTube URLs are demo values. Event/publication dates are **relative offsets** (`dateOffsetDays`) so the demo dataset never goes stale.

---

## 9. APP WIRING

### 9.1 Every mounted router prefix (`app.ts`)

```ts
app.use(`${apiBasePath}/departments`, routers.departments);
app.use(`${apiBasePath}/events`, routers.events);
app.use(`${apiBasePath}/publications`, routers.publications);
app.use(`${apiBasePath}/leaders`, routers.leaders);
app.use(`${apiBasePath}/testimonies`, routers.testimonies);
app.use(`${apiBasePath}/community-faces`, routers.communityFaces);
app.use(`${apiBasePath}/scriptures`, routers.scriptures);
app.use(`${apiBasePath}/schedule`, routers.schedule);
app.use(`${apiBasePath}/social-links`, routers.socialLinks);
app.use(`${apiBasePath}/settings`, routers.settings);
app.use(`${apiBasePath}/pages`, routers.staticPages);
app.use(`${apiBasePath}/media`, routers.media);
app.use(`${apiBasePath}/prayer-requests`, routers.prayerRequests);
app.use(`${apiBasePath}/admin`, routers.admin);
```
**14 mounted routers**, all under `/api/v1` (plus the standalone `/api/v1/health`). Two mounts have **no router file of their own** in `container.ts` order — every entry in `createRouters` corresponds 1:1 to an `app.use`, with **no orphan router and no unmounted module**.

### 9.2 Global middleware, in exact order

1. `app.set("trust proxy", 1)` — *"Railway place l'instance derrière un proxy : sans cela, `req.ip` serait toujours l'adresse du proxy et le rate limiting global serait inopérant."*
2. `app.disable("x-powered-by")`
3. `helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: "cross-origin" } })`
4. `cors(buildCorsOptions())`
5. `compression()`
6. `express.json({ limit: "1mb" })`
7. `express.urlencoded({ extended: true, limit: "1mb" })`
8. `pinoHttp({…})` — **only when `!isTest`**; `customLogLevel` maps 5xx→error, 4xx→warn, else debug in production / info otherwise; `autoLogging.ignore` skips `/api/v1/health`.
9. `app.get(\`${apiBasePath}/health\`, healthHandler)` — **registered BEFORE the limiter**, so it is never rate-limited.
10. `app.use(apiBasePath, globalLimiter)`
11. The 14 routers.
12. `app.use(notFoundHandler)`
13. `app.use(errorHandler)`

The composition comment states the ordering rationale: *"Les middlewares transverses sont ici ; ceux qui dépendent d'un rôle ou d'un schéma sont déclarés au niveau de chaque route, pour qu'aucune route ne puisse hériter par accident d'une protection qu'elle n'a pas demandée."*

### 9.3 CORS configuration

```ts
function buildCorsOptions(): cors.CorsOptions {
  const allowAll = corsOrigins.includes("*");
  return {
    origin: allowAll ? true : corsOrigins,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false,
    maxAge: 86_400,
  };
}
```
- `corsOrigins = env.CORS_ORIGIN.split(",").map(trim).filter(len>0)`; `CORS_ORIGIN` default `"http://localhost:3000"`.
- **`*` is explicitly accepted** (*"utile pour tester l'API depuis un outil externe"*) → `origin: true` (reflects any origin). Production must list real origins.
- **`credentials: false`** — no cookies are used; authentication is bearer-token only.
- Note `PUT` is **absent** from `methods` while `PATCH` is present — consistent with the code (which uses PATCH everywhere) and inconsistent with the README (§11).

### 9.4 Rate limiting

- **Global:** `rateLimit({ windowMs: env.RATE_LIMIT_WINDOW_MS, limit: env.RATE_LIMIT_MAX, standardHeaders: "draft-8", legacyHeaders: false, handler → sendError(429, "RATE_LIMITED", "Trop de requêtes, veuillez réessayer dans un instant") })`, mounted with `app.use(apiBasePath, globalLimiter)`. Defaults: **60 000 ms / 120 requests** → 120 req/min per IP, on everything under `/api/v1` **except `/api/v1/health`**.
- **Route-scoped:** only one — `publicWriteLimiter` on `POST /api/v1/prayer-requests`: **5 per 3 600 000 ms per IP**, `standardHeaders: true`, custom 429 body.
- **MISSING:** no rate limiter on any other route (in particular not on the public publications/scriptures/schedule reads, nor on the authenticated media upload path). No distributed/persistent store — the default in-memory store is per-instance and resets on redeploy, so a multi-instance deployment multiplies the effective limit by the instance count. No per-account or per-token limiting.

### 9.5 Body limits

- `express.json({ limit: "1mb" })` and `express.urlencoded({ extended: true, limit: "1mb" })` — *"Un corps JSON de plus de 1 Mo est une anomalie."*
- Multipart uploads bypass these and are bounded by `MAX_UPLOAD_BYTES` = 5 242 880 B via multer **and** `StorageService`.
- **A malformed JSON body produces `500 INTERNAL_ERROR`, not 400** — `express.json()` fails before `validate`; verified on the running API and documented in OpenAPI.

### 9.6 Container, server, config

- **`container.ts`** — one composition root. `createContainer(overrides)` builds 14 repositories, then 14 services, then `createRouters(deps)`. Services receive repositories, never the DB connection; `createRouters` builds `const authDeps = { adminProfiles: deps.repositories.adminProfiles }` and passes it to **every** router. `overrides` exists so tests can inject doubles (`Partial<Pick<AppDependencies, "db" | "storage" | "repositories">>`).
- **`server.ts`** — verifies the DB with `select 1` **before** accepting traffic (exit 1 on failure), logs the startup line, then graceful shutdown on `SIGTERM`/`SIGINT` (stop accepting, 10 s force-exit timer, `closeDatabase()`, exit 0), plus handlers for `unhandledRejection` and `uncaughtException`.
- **`config/env.ts`** — Zod-validated at import; the process refuses to start on invalid config, printing only the faulting **keys** (never values). Full schema: `NODE_ENV` (default `development`), `PORT` (4000), `DATABASE_URL` (required), `SUPABASE_URL` (required, URL), `SUPABASE_ANON_KEY` (required), `SUPABASE_SERVICE_ROLE_KEY` (required), `SUPABASE_STORAGE_BUCKET` (`ccjv-media`), `API_VERSION` (`v1`), `CORS_ORIGIN` (`http://localhost:3000`), `RATE_LIMIT_WINDOW_MS` (60 000), `RATE_LIMIT_MAX` (120), `MAX_UPLOAD_BYTES` (5 242 880), `LOG_LEVEL` (`info`).

### 9.7 Error handling / response envelopes

`error-handler.ts` is the single error→HTTP translator, placed last:
- `ZodError` (uncaught by `validate`) → 400 `VALIDATION_ERROR` with `[{champ,message}]`.
- `AppError` → `error.statusCode` / `error.code`; the message is replaced by `"Une erreur interne est survenue"` in production when `!error.isExposable`; 5xx logged at `error`, 4xx at `warn`.
- Anything else → 500 `INTERNAL_ERROR`, generic message in production.
- `notFoundHandler` → 404 `NOT_FOUND` with `Aucune route ne correspond à ${req.method} ${req.originalUrl}`.
**No stack trace, no internal message, no infrastructure detail is ever returned in production.**

Envelopes (`shared/http/respond.ts`): collection `{ data: [...], meta: { page, limit, total, totalPages } }` with `totalPages = total === 0 ? 0 : Math.ceil(total / limit)`; item = the bare resource, never wrapped; delete = `204` with empty body; error = `{ error: { code, message, details? } }`.
**Three real exceptions to the collection envelope**, documented in OpenAPI: `GET /scriptures`, `GET /schedule` and `GET /social-links` return `{ data: [...] }` **without `meta`** because they are bounded and non-paginated.

---

## 10. OPENAPI

Generated from implementation by `npm run openapi` → `src/presentation/openapi/generate.ts` → writes `backend/openapi.json` and `backend/openapi.yaml` (a local YAML emitter; no extra npm dependency). `document.ts` is 2 781 lines and is written **against** the implementation: paths/methods mirror `app.ts` + the routers, request bodies are the modules' **own Zod schemas imported** (not recopied), bounds and enum values are imported from implementation constants (`DEFAULT_PAGE_SIZE`, `MAX_PAGE_SIZE`, `MEDIA_FOLDERS`, `PRAYER_REQUEST_*_MAX_LENGTH`), and the 24 error codes are compile-time-verified exhaustive against the `ErrorCode` union (`satisfies readonly ErrorCode[]` + `MissingErrorCodes` assertion). Response DTOs **are** hand-written because the API has no output Zod schemas.

`generate.ts` prints a control summary: paths, operations split into public (`security: []`) vs administration (`security: bearerAuth`), tags, component schemas, component responses.

### 10.1 Distinct top-level endpoint paths (28, verbatim from `openapi.json`)

```
/api/v1/health                        [GET]
/api/v1/departments                   [GET,POST]
/api/v1/departments/{idOrSlug}        [GET,PATCH,DELETE]
/api/v1/events                        [GET,POST]
/api/v1/events/{idOrSlug}             [GET,PATCH,DELETE]
/api/v1/publications                  [GET,POST]
/api/v1/publications/{idOrSlug}       [GET,PATCH,DELETE]
/api/v1/leaders                       [GET,POST]
/api/v1/leaders/{id}                  [GET,PATCH,DELETE]
/api/v1/testimonies                   [GET,POST]
/api/v1/testimonies/{id}              [GET,PATCH,DELETE]
/api/v1/community-faces               [GET,POST]
/api/v1/community-faces/{id}          [GET,PATCH,DELETE]
/api/v1/scriptures                    [GET,POST]
/api/v1/scriptures/{key}              [GET,PATCH,DELETE]
/api/v1/schedule                      [GET,POST]
/api/v1/schedule/{id}                 [PATCH,DELETE]
/api/v1/social-links                  [GET,POST]
/api/v1/social-links/{id}             [PATCH,DELETE]
/api/v1/settings                      [GET,PATCH]
/api/v1/pages/{pageKey}               [GET,PATCH]
/api/v1/media                         [GET,POST]
/api/v1/media/{id}/usage              [GET]
/api/v1/media/{id}                    [GET,DELETE]
/api/v1/prayer-requests               [POST,GET]
/api/v1/prayer-requests/{id}          [GET,PATCH,DELETE]
/api/v1/admin/me                      [GET]
/api/v1/admin/profiles                [GET]
```
**These 28 paths match the routers in `app.ts` exactly** — no path is documented that is not mounted, and no mounted path is missing.

**Tags (15, verbatim):** `Système`, `departments`, `events`, `publications`, `leaders`, `testimonies`, `community-faces`, `scriptures`, `schedule`, `social-links`, `settings`, `pages`, `media`, `prayer-requests`, `admin`.

### 10.2 Distinct `components/schemas` names (34, verbatim)

```
AdminProfile, AdminProfileCollection, AdminProfileSummary,
CommunityFace, CommunityFaceCollection,
Department, DepartmentCollection, ErrorResponse, Event, EventCollection,
HealthStatus, Leader, LeaderCollection,
Media, MediaCollection, MediaUsageReport, PaginationMeta,
PrayerRequest, PrayerRequestCollection, PrayerRequestCreated,
Publication, PublicationCollection,
ScheduleEntry, ScheduleEntryList,
Scripture, ScriptureList, Settings, SocialLink, SocialLinkList, StaticPage,
Testimony, TestimonyCollection, UploadMediaRequest, ValidationIssue
```
**Note:** the harness's note that request bodies are inlined rather than factored into `components/schemas` is accurate — the module Zod schemas are passed directly into operations (the `extendZodWithOpenApi` prototype patch does not reach Zod 4.6 classes under `tsx`), so only the hand-written response DTOs and the `UploadMediaRequest` form schema appear as named components. The document is exact; the factoring is what is lost.

### 10.3 Distinct `components/responses` names (10, verbatim)

```
ValidationError, AuthenticationRequired, Forbidden, RateLimited, RateLimitedPublicWrite,
DuplicateSlug, Conflict, FileTooLarge, InvalidFileType, InternalError
```
### 10.4 Security scheme (1)

`bearerAuth` — `type: "http"`, `scheme: "bearer"`, `bearerFormat: "JWT"`. There is **exactly one** security scheme: public routes declare `security: []`, administration routes `security: [{ bearerAuth: [] }]`. No cookie scheme, no API key, no OAuth flow.

### 10.5 Document-level facts

`openapi: "3.1.0"`, `info.version: "v1"`, `info.title: "API CCJV — Centre Chrétien Jésus ma Vie"`, top-level `security: []`, servers `[{ url: "/" }, { url: "http://localhost:4000" }]`.

---

## 11. DOCUMENTATION vs CODE — conflicts found

Both `backend/README.md` (274 lines) and `backend/docs/IMPLEMENTATION_SPEC.md` (204 lines) were read in full. The implementation spec is a module-authoring standard (arborescence, layering, repository/service/controller/route rules, serialization mapping table, pagination/filters/sort, error codes, content notes) and is **largely accurately implemented** — including the middleware order rule (`authenticate → requireAdmin → requireRole → validate`), the no-`Date`-for-date-columns rule, the `{items,total}` contract, the `idOrSlug` rule, the `uniqueSlug`+`DUPLICATE_SLUG` rule, and the no-Express-in-services rule. Conflicts and inaccuracies found:

| # | Documentation claim | Code reality | Severity |
|---|---|---|---|
| 1 | README table: `Réglages du site … PUT /` | **`PATCH /api/v1/settings`** | doc error |
| 2 | README table: `Pages statiques … PUT /:pageKey` | **`PATCH /api/v1/pages/:pageKey`** | doc error |
| 3 | README: `Médias … POST / (multipart), DELETE /:id` | Code has **5** media routes: `GET /`, `GET /:id/usage`, `GET /:id`, `POST /`, `DELETE /:id` | doc incomplete |
| 4 | README table: `Responsables … GET /:idOrSlug` | `leaders` has **no slug**; the route is **`GET /:id` (UUID only)** | doc error |
| 5 | README table lists only `/media` POST+DELETE and omits all media GETs | as above | doc incomplete |
| 6 | README table omits `GET /api/v1/publications` draft behaviour nuance but is correct elsewhere | consistent | ok |
| 7 | README "Stack … Tests: **Vitest 5** + supertest"; `npm test` description implies Vitest | `package.json` `"test"` runs **Jest** (`node --experimental-vm-modules node_modules/jest/bin/jest.js`); a separate `test:vitest` script exists, and `jest.config.mjs` is the active config used by `tests/` (which `import { describe } from "@jest/globals"`) | doc error |
| 8 | README says migrations "jamais appliquées automatiquement au démarrage" | concordant with code (no auto-migrate in `server.ts`) — but **no CI check** enforces schema/migration parity | gap |
| 9 | README "Points de vigilance": `node dist/server.js` fails on `Cannot find package '@/app'` | consistent with `tsconfig` not rewriting aliases; `package.json` has since added `tsc-alias` to `build`, so the README note may be stale | doc risk |
| 10 | `static-page.serializer.ts` comment: `updatedBy` "jamais une donnée d'affichage public" | **`updatedBy` IS returned by the public unauthenticated `GET /pages/:pageKey`** | **code contradicts its own comment** |
| 11 | `media.routes.ts` comment: "Le dossier de destination est validé avant tout appel au Storage" | `singleFileUpload()` runs **before** `validate({ body })`, so the file is buffered before the folder whitelist is checked | code comment inaccurate |
| 12 | `setting.serializer.ts` / OpenAPI: setting keys form a closed list | `listAll()` has **no key filter** → the whitelist restricts **writes only**, not reads | doc incomplete |
| 13 | `domain/repositories/index.ts` header: "Les lectures publiques ne voient que les ressources publiées" | True for `publications` **only**; every other repository has no visibility filter | doc overstates |
| 14 | `docs/005` §2.1 described a `password_hash` | Resolved in favour of Supabase Auth; `admin.ts` documents the resolution | already resolved |
| 15 | `docs/005` §2.3 had `is_archived` + index `(event_date, is_archived)` | `is_archived` **does not exist**; index is `(event_date)`. Documented in `events.ts` | already resolved |
| 16 | `IMPLEMENTATION_SPEC` §9 error-code list omits `INTERNAL_ERROR` and `SETTING_NOT_FOUND` | Both exist in the `ErrorCode` union (24 codes) | doc incomplete |
| 17 | `IMPLEMENTATION_SPEC` §6 route skeleton shows `idOrSlug` for the generic CRUD shape | Correct only for departments/events/publications; leaders/testimonies/community-faces use `:id`, scriptures uses `:key` | doc simplification |

**Nothing in either document claims a feature that the code implements only in docs — except the general "public reads only published resources" invariant and the `updatedBy` secrecy claim, both of which the code contradicts.**

---

## 12. TESTS

16 files in `backend/tests`. Active runner: **Jest** (`@jest/globals`, `jest.config.mjs`); a `vitest.config.ts` and a `test:vitest` script also exist (dual config, README names the wrong one).

| File | Behaviour it locks in |
|---|---|
| `tests/setup/env.ts` | Forces `NODE_ENV=test` and `LOG_LEVEL=silent` **before any `src/` import**; documents the two `NODE_ENV=test` effects (no `pino-http` in `app.ts`; pool reduced to 2 connections). |
| `tests/helpers/database.ts` | `describeIfDatabaseAvailable(titre)` probes the real DB once per file (`select 1`) and returns `describe.skip` when unreachable — integration suites skip loudly instead of failing; `closeTestDatabase()` closes the pool. |
| `tests/integration/health.test.ts` | `GET /api/v1/health` → 200 `{status:"ok"}`; unknown route → 404 with the normalised error shape; the 404 leaks no stack trace or technical detail; Helmet hardening headers present; JSON responses. |
| `tests/integration/routes.test.ts` (45 KB, the largest) | The cross-cutting API contract: (1) every public collection returns the `{data, meta}` envelope and `?limit=2` is honoured with recomputed meta; (2) pagination bounds → 400; (2bis) an unknown query parameter is refused on **every** resource, including protected ones via the schema, plus `DELETE /media/:id` accepts `force` and refuses a typo; (2ter) sort whitelist enforced (`?sort=colonne_interdite` → 400, `?sort=-created_at` → 200) only where sort exists; (2quater) legitimate parameters still accepted; (3) **every** admin route without `Authorization` → **401 `AUTH_REQUIRED`**, plus malformed token/Bearer variants; (4) proves auth runs **before** validation — invalid bodies without a token give **401, never 400**; (5) **a real DRAFT row exists in the DB and never appears in the public list, returns 404 by id/slug, and the guard is proven to live in the repository (not only in the list filter)**; (6) prayer-request body validation (empty body, unknown key `isFeatured` refused by the strict schema, whitespace-only text refused); (7) `RateLimit`/`RateLimit-Policy` headers exposed without a 429; (8) unknown route → 404 in the standard format; (9) routes with no parameters refuse any unknown parameter and still return 200 without one. |
| `tests/unit/app-error.test.ts` | The error-code → HTTP-status mapping for the whole hierarchy (e.g. `DUPLICATE_SLUG`/`CONFLICT` → 409, `FILE_TOO_LARGE` → 413, `INVALID_FILE_TYPE` → 415, `RATE_LIMITED` → 429, `INTERNAL_ERROR` → 500); every documented `NotFoundError` resource code is accepted; `details` payloads; `InternalError` is not exposable but retains its cause; `isAppError` distinguishes an AppError from a structural clone. |
| `tests/unit/auth-middleware.test.ts` | `authenticate` refuses missing header, wrong scheme (`Basic`), bare `Bearer`, unknown scheme, and a malformed token **without consulting the DB**; `requireAdmin` refuses unauthenticated requests, a valid user with no `admin_profiles` row, a deactivated profile, and a profile found under a different id; passes an active admin and sets `req.admin`; queries the repository with the id from the token; propagates a repository failure **without granting access**; `requireRole` passes the required role, refuses a different role, refuses everything when no role is allowed, and requires prior authentication; `requireAnyAdmin` assembles auth + active-profile + role **in that order**. |
| `tests/unit/department.service.test.ts` | Slug derivation from name; suffixing on collision; incrementing to the first free slug; explicit free slug accepted after normalisation; explicit taken slug → **409 `DUPLICATE_SLUG` and never auto-suffixed**; the computed slug is passed separately from the create input; fallback to `"sans-titre"`; 404 `DEPARTMENT_NOT_FOUND` for unknown slug, unknown id, unknown update, unknown delete, and for a row that disappears between read and write/delete; reads by slug and by id; page offset; update preserves the slug; delete works; repository failures propagate untransformed. |
| `tests/unit/event-status.test.ts` | `computeEventStatus`: future → `UPCOMING`, **today → `UPCOMING`** (inclusive boundary), past → `ARCHIVED`, time-of-day ignored (the next day at 00:00 flips), default `now`; `toIsoDate` zero-pads and reasons in **local** time, never UTC; `isoDateFromNow` handles 0, month-end, year-end, leap years, a DST change, and never mutates the input instant. |
| `tests/unit/event.service.test.ts` | Event slug rules (same as departments); department-reference rules — nonexistent `departmentId` → 404 `DEPARTMENT_NOT_FOUND`, existing accepted, **`null` accepted without querying departments**, checked on update too, `null` detaches; status is delegated — never transmitted to the repository on create, exposed as computed for past and future dates, list filters passed through **without injecting a `today` bound**; reads by slug/id; 404s; delete; repository failures propagate. |
| `tests/unit/file-signature.test.ts` | Magic-byte acceptance for JPEG/PNG/WEBP/AVIF and consistency with the public `ACCEPTED_IMAGE_MIME_TYPES` constant; refusals for empty file, plain text, PDF, GIF/BMP/SVG, truncated header, non-WebP RIFF container, non-AVIF ISO-BMFF (MP4), and a `.jpg`-named text file; a truncated JPEG still identified; canonical extension mapping and never empty; PNG/JPEG/WEBP dimension parsing, `null` for short/unsupported inputs, and **AVIF never reports invented dimensions**. |
| `tests/unit/page-content.test.ts` | Every declared page key has a schema; the registry declares exactly the pages the frontend serves; valid content accepted; optional editorial complements accepted; values are trimmed; unknown keys return no schema; **inherited prototype keys are not treated as known**; only named text fields exist, never HTML; refusal of missing required fields, empty/whitespace required fields, over-long fields, wrong value types, and another page's content; each page validates against its own schema. Plus `StaticPageService`: valid content passed through; **undeclared fields stripped before write**; unknown `pageKey` → 404 `PAGE_NOT_FOUND` **on read too**; non-conforming content → 400 `VALIDATION_ERROR` naming the faulty fields; registered-but-unseeded page → 404; stored content returned; the author is recorded as given. |
| `tests/unit/pagination.test.ts` | `buildPaginationMeta` (0 pages for empty, exact division, ceiling for the last partial page, requested page/limit preserved) and the documented bounds; `toOffset`; `paginationQuerySchema` defaults, string coercion, out-of-bounds refusal; **strictness: unknown parameter refused, empty query accepted, `.extend()` PRESERVES strictness, and spreading `.shape` LOSES it (explicitly marked as the forbidden form for a query)**; `emptyQuerySchema` accepts nothing, not even pagination; `createSortSchema` default direction, `-` prefix = descending, whitespace tolerated, non-whitelisted column rejected with the allowed-columns message, single-column whitelist; and no invalid sort value slips through a full query. |
| `tests/unit/publication.service.test.ts` | The type↔content coherence rule for all three types (VIDEO requires http/https `contentUrl`; PHOTO requires `contentUrl` **or** `coverMediaId` and refuses explicit `null` without a URL; TEXTE requires a non-empty `body` and needs no link); status handling (absent → the repository applies `PUBLISHED`; explicit `DRAFT` and `PUBLISHED` transmitted); **the draft guard: `status: PUBLISHED` is forced on the public list whatever the client asks**, page offset, a published row read with `includeDrafts = false`, **a draft is indistinguishable from an absent row on public read**, drafts ARE resolved for admin update and delete; coherence re-checked on partial updates against the merged resource (cannot empty a VIDEO's `contentUrl`, cannot flip a TEXTE to VIDEO without a link, cannot empty a TEXTE's body); slug derivation/suffixing/explicit-conflict 409; 404s; repository failures propagate. |
| `tests/unit/slug.test.ts` | `slugify` accent stripping, straight and typographic apostrophes unified, lowercasing, whitespace/separator collapse, leading/trailing separator removal, special characters and emojis replaced, digits preserved including leading, empty input → empty string, 300→160 truncation without a trailing dash; `uniqueSlug` free base, suffix from `2`, incrementing, `"sans-titre"` fallback, already-normalised base untouched, **abandons after 100 attempts instead of looping forever**, and existence-check errors propagate. |
| `tests/unit/validate-middleware.test.ts` | Valid body is published and `next()` called without argument; the raw body is **replaced** by the transformed data; defaults/coercions applied; nothing written when no schema is given; invalid body → `ValidationError` listing faulty fields, missing-field naming, **raw body left untouched on failure**, absent body rejected, `(racine)` for whole-body issues; unknown-key handling (strict schema rejects, multiple keys each named, the refused key identified by name, strict body with only expected keys accepted, permissive schema prunes); params/query exposure via `validatedParams`/`validatedQuery`, invalid URL param and out-of-bounds query refused, **no validated values exposed until validation succeeds**; multiple sources aggregate into ONE error while a valid query is still published despite an invalid body. |

**Test-suite gaps (MISSING coverage):** no test for the media delete-protection/forced-delete flow; none for settings key whitelisting; none for social links; none for scripture key uniqueness; none for schedule; none for the media upload pipeline end-to-end; none for `computeEventStatus`-adjacent timezone behaviour at a real DST/server-local boundary; none for rate-limit *exhaustion* (only header presence); none asserting the public `static-pages` response does **not** leak `updatedBy`.

---

## 13. MISSING — consolidated negative inventory

### 13.1 Authorization / identity
1. **No scope / department-scoping mechanism at all** — no `admin_profiles.department_id`, no scope column, no admin↔department join table, no scoped query, no scoped check. A department-restricted manager cannot be expressed.
2. **No second role, no permission table, no permission list, no RBAC/ABAC beyond the single `ROLE_ADMIN` string.** `requireRole` is a no-op within the admin population.
3. **`UNAUTHENTICATED_ADMIN` is a dead error code** — declared but never thrown.
4. **No route to create, modify, deactivate or delete an administrator.** `AdminProfileRepository` has no `isActive` mutator; the 403-for-disabled path is reachable only by writing the DB directly.
5. **No resource ownership check anywhere** — any admin mutates any resource.
6. **`tokenRole` (JWT `role` claim) is read and never used** for authorization.
7. **No `GET /admin/audit`, no login history, no last-seen tracking.**

### 13.2 Workflow / content lifecycle
8. **No `ARCHIVED` publication state and no archive endpoint/transition** — only `DRAFT`/`PUBLISHED`, changed by a generic PATCH with no transition validation.
9. **No publications archive rule or recency threshold anywhere in code** (§4.15).
10. **No scheduled/delayed publishing** — a future `publishedAt` is immediately visible.
11. **No draft/visibility state on any entity other than `publications`** — departments, events, leaders, testimonies, community faces, scriptures, schedule entries, settings, social links, static pages and media are public the instant they are written.
12. **No workflow history, no approval step, no editorial review state, no reason/comment on a state change.**
13. **Static pages have no DELETE route and no list route**, and PATCH is a full replacement requiring the required fields — partial/atomic field edits are impossible.

### 13.3 Audit / integrity / concurrency
14. **No audit log** — no actor column on any table except `media.uploaded_by` and `static_pages.updated_by` (last writer only). Nothing records who created/updated/deleted/published anything; media **deletion has no actor at all**.
15. **No versioning, no revision table, no optimistic concurrency** — no `version` column, no `If-Match`/ETag; `updatedAt` is never used as a precondition; upserts are last-write-wins and concurrent editors silently clobber each other (and, for media, `clearReferences` can null references in a transaction nobody is warned about).
16. **No soft delete / trash / restore anywhere** — every `remove` is a hard `DELETE`.
17. **No Postgres constraint-violation mapping** — slug-uniqueness races and every FK violation (nonexistent `*MediaId`, `leaders.departmentId`, `publications.coverMediaId`) surface as **500 `INTERNAL_ERROR`** instead of 409/404/400.
18. **No FK existence validation for media ids** anywhere, and **no department-existence validation for `leaders.departmentId`** (unlike `events`, which does check).
19. **No transactional coverage of the slug check-then-insert** — `slugExists` → `insert` is racy in departments, events, publications and scriptures.
20. **No `exceptId` usage** — the `slugExists(slug, exceptId?)` parameter is dead code; no slug can be changed after creation anyway.

### 13.4 Media / storage
21. **No caption, credit, attribution, licence or copyright field** anywhere; only `alt`, and `alt` is **optional despite being justified by WCAG 2.2 AA**.
22. **No image dimension/aspect-ratio limits, no pixel-bomb guard, no EXIF stripping, no AV scanning, no re-encoding, no thumbnails/variants.**
23. **No orphan-media sweep / reconciliation job** — upload compensation is best-effort and a crash mid-upload leaves an orphan object; no "unused media" report endpoint (only per-id usage).
24. **No `Location` header on 201**, no per-route rate limiting on upload, no presigned-URL path, no public media endpoint at all.
25. **No media rename/move/replace/batch operations**, and no uploader-facing list filters (no folder/mime/date/uploader filter; ordering is hard-coded).

### 13.5 Data / privacy / operations
26. **No retention or purge policy for `prayer_requests`** — personal and sensitive data is kept indefinitely, with no anonymisation path, no `deleted_at`, and hard delete leaves **no record that a request was ever received and erased**.
27. **No CAPTCHA, honeypot, profanity filter, duplicate detection or content moderation on the only public write endpoint**; rate limiting is **per-IP only** with an **in-memory store** (per-instance, resets on redeploy, bypassable by rotating IPs) — so effective limits multiply with instance count.
28. **No request/source IP persisted for abuse investigation**, no `assigned_to`, no lock — two intercessors can act on the same request with no coordination, and nothing records admin **reads** of sensitive data.
29. **No notification/delivery** — nothing notifies the intercession team of a new request, and no confirmation reaches the requester.
30. **`site_settings` is untyped text** (a URL, a date and a phone number share one `text` column and one `max(500)` rule), has no per-key validation, no delete path, and its key whitelist restricts **writes only** (reads are unfiltered, so an out-of-band row is publicly readable). The whitelist is duplicated in two independent exports that can drift.
31. **`updatedBy` (an admin UUID) is exposed on the public unauthenticated `GET /api/v1/pages/:pageKey`**, contradicting the serializer's own comment.
32. **Inconsistent null-vs-omitted conventions across DTOs** (Department omits; Leader/CommunityFace emit `null`; Event mixes both), inconsistent 404 detail payloads, inconsistent rate-limit header styles, and two different `updated_at` clock sources (`new Date()` in `admin-profile.repository.ts` vs `sql\`now()\`` in the settings/static-page repositories).
33. **No CI enforcement that the Drizzle schema and the single migration stay in sync**, and **no check** that the two `ALLOWED_SETTING_KEYS` definitions agree.
34. **`scriptures` and `schedule` public lists are unbounded** (no `LIMIT` at all, and every query parameter is rejected), while `GET /social-links` is unbounded with no pagination cap — all three return `{ data }` with **no `meta`**, deviating from the collection envelope used everywhere else.
35. **No caching/ETag on the hot, essentially static public read paths**, and **no per-route rate limiting** on `publications`, `scriptures`, `schedule` or `media`.
36. **`leaders` has no slug and no unique constraint beyond the PK** (duplicate name+role pairs allowed); `social_links` allows duplicate `label`/`href`; `leaders.scope` and `bio` accept empty strings (no `.min(1)`); `departments`/`events` slug immutability is enforced three times over while `leaders`/`community-faces`/`testimonies` have no slug at all.
37. **`DepartmentDto` omits `position`** — the admin ordering key is writable but unreadable through the API; `position` caps also diverge (`10_000` for departments vs `9999` elsewhere), and no collection has a `position` uniqueness constraint or a reorder endpoint.
38. **`GET /api/v1/events` with no filter returns ARCHIVED events mixed with UPCOMING**, ordered date-ascending (past first), and `GET /events/:idOrSlug` returns an ARCHIVED event with no visibility filter — an admin has **no way to hide a future event** (no `isPublished`, no override).
39. **`eventTime`/`eventDate` day-boundary logic uses the server's local timezone**, not a configured church timezone.
40. **Malformed JSON → 500, not 400**, because `express.json()` runs before `validate` — a known and deliberately documented quirk, but still an incorrect status for a client error.

---

*End of evidence file. Every statement above is traceable to a specific file and line in `C:\Users\HP\desktop\PROJETS 2026\CCJV-CHURCH\backend`.*
