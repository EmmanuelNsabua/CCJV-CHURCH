import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { publicationStatusEnum, teachingMediaRoleEnum } from "./enums";
import { media } from "./media";

/**
 * Table des enseignements (sermons / prédications) du Centre Chrétien Jésus ma Vie.
 *
 * Distincte des publications génériques :
 * - Portée par un orateur (`speaker_name`) et une date de prédication (`preached_at`).
 * - Associée à des références bibliques ordonnées (`teaching_biblical_references`).
 * - Liée à des médias de la bibliothèque centrale (`teaching_media`) avec rôle (VIDEO, AUDIO, THUMBNAIL).
 * - Statut métier : DRAFT, PUBLISHED, ARCHIVED.
 */
export const teachings = pgTable(
  "teachings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: varchar("title", { length: 200 }).notNull(),
    slug: varchar("slug", { length: 220 }).notNull(),
    speakerName: varchar("speaker_name", { length: 150 }).notNull(),
    /** Date du sermon (distincte de published_at). */
    preachedAt: date("preached_at").notNull(),
    summary: text("summary"),
    description: text("description"),
    status: publicationStatusEnum("status").notNull().default("DRAFT"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("teachings_slug_idx").on(table.slug),
    index("teachings_status_idx").on(table.status),
    index("teachings_preached_at_idx").on(table.preachedAt),
  ],
);

export type TeachingRow = typeof teachings.$inferSelect;
export type InsertTeachingRow = typeof teachings.$inferInsert;

/**
 * Références bibliques associées à un enseignement.
 * Relation 1:N avec suppression en cascade.
 */
export const teachingBiblicalReferences = pgTable(
  "teaching_biblical_references",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teachingId: uuid("teaching_id")
      .notNull()
      .references(() => teachings.id, { onDelete: "cascade" }),
    book: varchar("book", { length: 100 }).notNull(),
    startChapter: integer("start_chapter").notNull(),
    startVerse: integer("start_verse").notNull(),
    endChapter: integer("end_chapter"),
    endVerse: integer("end_verse"),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("teaching_biblical_ref_teaching_idx").on(table.teachingId),
  ],
);

export type TeachingBiblicalReferenceRow =
  typeof teachingBiblicalReferences.$inferSelect;
export type InsertTeachingBiblicalReferenceRow =
  typeof teachingBiblicalReferences.$inferInsert;

/**
 * Association N:M entre un enseignement et la bibliothèque centrale de médias.
 * Rôles autorisés : VIDEO, AUDIO, THUMBNAIL.
 */
export const teachingMedia = pgTable(
  "teaching_media",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teachingId: uuid("teaching_id")
      .notNull()
      .references(() => teachings.id, { onDelete: "cascade" }),
    mediaId: uuid("media_id")
      .notNull()
      .references(() => media.id, { onDelete: "restrict" }),
    role: teachingMediaRoleEnum("role").notNull(),
    isPrimary: boolean("is_primary").notNull().default(false),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("teaching_media_teaching_idx").on(table.teachingId),
    index("teaching_media_media_idx").on(table.mediaId),
  ],
);

export type TeachingMediaRow = typeof teachingMedia.$inferSelect;
export type InsertTeachingMediaRow = typeof teachingMedia.$inferInsert;
