import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { departments } from "./departments";
import { media } from "./media";

/**
 * Personnes et paroles.
 *
 * Ces trois entités sont absentes du schéma à cinq tables de `docs/005`, mais
 * elles sont **réellement rendues** par le frontend (`leaders.ts`,
 * `testimonies.ts`, `community.ts`) et explicitement listées par le cahier
 * d'implémentation §4. Les laisser en dur dans le frontend contredirait
 * l'objectif « maintenir le site sans modifier le code » (`docs/002` §3.6).
 *
 * `position` permet à l'administration de choisir l'ordre d'affichage sans
 * renommer quoi que ce soit.
 */

export const leaders = pgTable(
  "leaders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 120 }).notNull(),
    role: varchar("role", { length: 120 }).notNull(),
    /** Domaine couvert, ex. « Chorale ». */
    scope: varchar("scope", { length: 120 }),
    bio: text("bio"),
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
    /** Parole rapportée. Contenu de démonstration tant que CCJV n'a pas fourni les vrais. */
    quote: text("quote").notNull(),
    personName: varchar("person_name", { length: 120 }).notNull(),
    personRole: varchar("person_role", { length: 120 }),
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
  (table) => [index("testimonies_position_idx").on(table.position)],
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
