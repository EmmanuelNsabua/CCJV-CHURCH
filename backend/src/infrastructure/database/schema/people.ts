import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { adminProfiles } from "./admin";
import { departments } from "./departments";
import { testimonyStatusEnum } from "./enums";
import { media } from "./media";

/**
 * Personnes et paroles.
 *
 * `leaders` : Responsables de département (entités de présentation simples citées
 * dans la fiche du département). Pas de scope, pas de bio, pas de compte auth.
 * `testimonies` : Témoignages reçus du public avec workflow de modération,
 * réversibilité, sélection Hero et respect strict de l'anonymat.
 */

export const leaders = pgTable(
  "leaders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 120 }).notNull(),
    role: varchar("role", { length: 120 }).notNull().default("Responsable"),
    photoMediaId: uuid("photo_media_id").references(() => media.id, {
      onDelete: "set null",
    }),
    departmentId: uuid("department_id").references(() => departments.id, {
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
    index("leaders_position_idx").on(table.position),
    index("leaders_department_id_idx").on(table.departmentId),
  ],
);

export const testimonies = pgTable(
  "testimonies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Contenu textuel du témoignage. */
    content: text("content"),
    /** Colonne legacy maintenue pour compatibilité existante. */
    quote: text("quote"),
    /** Nom de l'auteur (facultatif). */
    authorName: varchar("author_name", { length: 120 }),
    /** Colonne legacy. */
    personName: varchar("person_name", { length: 120 }),
    /** Choix explicite d'anonymat public. */
    isAnonymous: boolean("is_anonymous").notNull().default(false),
    /** État de modération : PENDING, PUBLISHED, REJECTED, ARCHIVED. */
    status: testimonyStatusEnum("status").notNull().default("PENDING"),
    /** Sélection éditoriale pour affichage dans la section Hero. */
    isFeatured: boolean("is_featured").notNull().default(false),
    /** Référence facultative à une photo envoyée avec la soumission. */
    photoMediaId: uuid("photo_media_id").references(() => media.id, {
      onDelete: "set null",
    }),
    /** Horodatage du consentement obligatoire. */
    consentedAt: timestamp("consented_at", { withTimezone: true }),
    /** Date effective de publication. */
    publishedAt: timestamp("published_at", { withTimezone: true }),
    /** Administrateur ayant modéré le témoignage. */
    reviewedBy: uuid("reviewed_by").references(() => adminProfiles.id, {
      onDelete: "set null",
    }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    adminNotes: text("admin_notes"),
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
    index("testimonies_status_idx").on(table.status),
    index("testimonies_featured_idx").on(table.isFeatured),
    index("testimonies_position_idx").on(table.position),
  ],
);

export const communityFaces = pgTable(
  "community_faces",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    personName: varchar("person_name", { length: 120 }).notNull(),
    caption: text("caption").notNull(),
    photoMediaId: uuid("photo_media_id").references(() => media.id, {
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
  (table) => [index("community_faces_position_idx").on(table.position)],
);

export type LeaderRow = typeof leaders.$inferSelect;
export type TestimonyRow = typeof testimonies.$inferSelect;
export type CommunityFaceRow = typeof communityFaces.$inferSelect;
