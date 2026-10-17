import {
  check,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { adminProfiles } from "./admin";
import { media } from "./media";

/**
 * Départements de l'église.
 *
 * Entièrement dynamiques (`docs/006` §3) : aucune liste n'est codée en dur, ni
 * en base, ni dans le frontend. Ajouter un département = insérer une ligne.
 *
 * Les champs éditoriaux ajoutés par rapport à `docs/005` §2.2 (`tagline`,
 * `meeting_schedule`, `key_points`, `banner_media_id`, `position`) ne sont pas
 * décoratifs : ils sont **lus par le frontend réel** — voir `src/types/index.ts`
 * (`Department`) et `DepartmentModal.tsx`.
 */
export const departments = pgTable(
  "departments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 100 }).notNull(),
    slug: varchar("slug", { length: 160 }).notNull(),
    description: text("description"),
    /** Présentation de la mission du département. */
    mission: text("mission"),
    /** Historique du département. */
    history: text("history"),
    responsibleName: varchar("responsible_name", { length: 120 }),
    /** Accroche courte affichée dans les listes. */
    tagline: varchar("tagline", { length: 200 }),
    /** Rythme de rencontre, ex. « Lundi 16h30–18h30 · Mercredi dans la nuit ». */
    meetingSchedule: varchar("meeting_schedule", { length: 255 }),
    /** Piliers / valeurs mis en avant sur la fiche. */
    keyPoints: text("key_points").array(),
    bannerMediaId: uuid("banner_media_id").references(() => media.id, {
      onDelete: "set null",
    }),
    /** Ordre d'affichage voulu par l'administration. */
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("departments_slug_idx").on(table.slug),
    index("departments_position_idx").on(table.position),
  ],
);

/** Activités de présentation d'un département. */
export const departmentActivities = pgTable(
  "department_activities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    departmentId: uuid("department_id")
      .notNull()
      .references(() => departments.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 150 }).notNull(),
    description: text("description"),
    imageMediaId: uuid("image_media_id").references(() => media.id, {
      onDelete: "set null",
    }),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("department_activities_department_idx").on(table.departmentId),
    index("department_activities_position_idx").on(
      table.departmentId,
      table.position,
    ),
  ],
);

/** Galerie photographique ordonnée d'un département (galerie unique). */
export const departmentMedia = pgTable(
  "department_media",
  {
    departmentId: uuid("department_id")
      .notNull()
      .references(() => departments.id, { onDelete: "cascade" }),
    mediaId: uuid("media_id")
      .notNull()
      .references(() => media.id, { onDelete: "restrict" }),
    position: integer("position").notNull().default(0),
  },
  (table) => [
    primaryKey({ columns: [table.departmentId, table.mediaId] }),
    index("department_media_position_idx").on(table.departmentId, table.position),
  ],
);

/**
 * Archive complète d'un département avant suppression active.
 * Conserve un snapshot JSON des données, activités, responsables et références médias.
 */
export const departmentArchives = pgTable(
  "department_archives",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    originalDepartmentId: uuid("original_department_id").notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    slug: varchar("slug", { length: 160 }).notNull(),
    snapshot: jsonb("snapshot").notNull(),
    archivedBy: uuid("archived_by").references(
      (): AnyPgColumn => adminProfiles.id,
      { onDelete: "set null" },
    ),
    archivedAt: timestamp("archived_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    reason: text("reason"),
  },
  (table) => [
    index("department_archives_original_id_idx").on(table.originalDepartmentId),
    index("department_archives_slug_idx").on(table.slug),
  ],
);

/**
 * Capacités d'un département (`docs/028` D-25, `docs/032` §3.5).
 */
export const departmentCapabilities = pgTable(
  "department_capabilities",
  {
    departmentId: uuid("department_id")
      .notNull()
      .references(() => departments.id, { onDelete: "cascade" }),
    /** Code de capacité (`varchar(60)`), contrôlé par le `CHECK` ci-dessous. */
    capability: varchar("capability", { length: 60 }).notNull(),
    /**
     * Auteur du grant. `AnyPgColumn` coupe l'inférence circulaire :
     * `departments → admin_profiles → departments` referme un cycle.
     */
    grantedBy: uuid("granted_by").references(
      (): AnyPgColumn => adminProfiles.id,
      { onDelete: "restrict" },
    ),
    grantedAt: timestamp("granted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.departmentId, table.capability] }),
    index("department_capabilities_capability_idx").on(table.capability),
    check(
      "department_capabilities_known_capability",
      sql`${table.capability} IN ('EVENT_SCOPE_GLOBAL', 'PUBLICATION_SCOPE')`,
    ),
  ],
);

export type DepartmentCapabilityRow = typeof departmentCapabilities.$inferSelect;
export type NewDepartmentCapabilityRow = typeof departmentCapabilities.$inferInsert;

export type DepartmentRow = typeof departments.$inferSelect;
export type NewDepartmentRow = typeof departments.$inferInsert;

export type DepartmentActivityRow = typeof departmentActivities.$inferSelect;
export type NewDepartmentActivityRow = typeof departmentActivities.$inferInsert;

export type DepartmentArchiveRow = typeof departmentArchives.$inferSelect;
export type NewDepartmentArchiveRow = typeof departmentArchives.$inferInsert;
