import {
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
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

/** Galerie photographique ordonnée d'un département. */
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

export type DepartmentRow = typeof departments.$inferSelect;
export type NewDepartmentRow = typeof departments.$inferInsert;
