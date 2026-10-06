import {
  date,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import {
  publicationCategoryEnum,
  publicationStatusEnum,
  publicationTypeEnum,
} from "./enums";
import { media } from "./media";

/**
 * Publications : actualités, enseignements, médias et ressources.
 *
 * Le hub Ressources et les rubriques Actualités / Enseignements / Médiathèque
 * s'appuient sur **un seul système** filtré par `category`, et non sur quatre
 * modèles dupliqués — c'est la logique déjà en place dans le frontend
 * (`getPublicationsByCategory`) et exigée par le cahier §13.
 *
 * Le champ `body` (tableau de paragraphes) concrétise la décision laissée
 * ouverte par `docs/006` §6 : une publication TEXTE a besoin d'un contenu
 * éditorial distinct d'une simple URL.
 *
 * `status` permet la publication / dépublication demandée par le cahier §8,
 * tout en gardant `PUBLISHED` par défaut pour ne pas rendre invisible un
 * contenu créé par mégarde en brouillon.
 */
export const publications = pgTable(
  "publications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: varchar("title", { length: 150 }).notNull(),
    slug: varchar("slug", { length: 180 }).notNull(),
    type: publicationTypeEnum("type").notNull(),
    category: publicationCategoryEnum("category").notNull(),
    /**
     * `VIDEO` → URL YouTube/Facebook (aucun hébergement vidéo côté CCJV).
     * `PHOTO` → URL Supabase Storage.
     * `TEXTE` → facultatif, le contenu porte sur `body`.
     */
    contentUrl: text("content_url"),
    description: text("description"),
    /** Corps éditorial des publications TEXTE : paragraphes ordonnés. */
    body: text("body").array(),
    /** Auteur ou orateur (frontend : `Publication.author`). */
    author: varchar("author", { length: 120 }),
    publishedAt: date("published_at").notNull(),
    status: publicationStatusEnum("status").notNull().default("PUBLISHED"),
    coverMediaId: uuid("cover_media_id").references(() => media.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("publications_slug_idx").on(table.slug),
    // Index chronologique décroissant : ordre d'affichage par défaut.
    index("publications_published_at_idx").on(table.publishedAt.desc()),
    index("publications_category_idx").on(table.category),
    index("publications_type_idx").on(table.type),
    index("publications_status_idx").on(table.status),
  ],
);

export type PublicationRow = typeof publications.$inferSelect;
export type NewPublicationRow = typeof publications.$inferInsert;
