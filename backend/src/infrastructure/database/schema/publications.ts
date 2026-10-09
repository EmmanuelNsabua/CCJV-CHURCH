import { sql } from "drizzle-orm";
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
import { departments } from "./departments";
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
    /**
     * Département **responsable** (D-02, D-06) — `NOT NULL`.
     *
     * Une publication sans département n'a pas de responsable identifiable : ni la
     * portée éditoriale des responsables, ni le rattachement exigé par D-08 ne
     * peuvent s'appuyer sur un champ facultatif. `RESTRICT` : supprimer un
     * département qui porte des publications est **refusé**, plutôt que de les
     * laisser orphelines.
     */
    departmentId: uuid("department_id")
      .notNull()
      .references(() => departments.id, { onDelete: "restrict" }),
    /**
     * Date d'archivage, renseignée par la règle des 3 — jamais par un client.
     *
     * D-18/D-20 : l'archivage est **irréversible** et `ARCHIVED` est un état
     * persistant. La date en garde la trace et distingue un archivage volontaire
     * d'un archivage par quota, ce qu'aucun autre champ ne permettrait.
     */
    archivedAt: timestamp("archived_at", { withTimezone: true }),
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
    index("publications_department_idx").on(table.departmentId),
    /**
     * Index **partiel** de la règle des 3 : les trois places du site.
     *
     * La règle est globale (`docs/035` §1 : « toutes catégories et tous
     * départements confondus »), donc l'index ne porte **pas** sur
     * `department_id` — contrairement à ce que D-18 prévoyait avant l'arbitrage.
     * Il sert au tri d'archivage (`published_at ASC, id ASC`) et au comptage des
     * publiées, les deux seules opérations du quota.
     */
    index("publications_quota_idx")
      .on(table.publishedAt, table.id)
      .where(sql`${table.status} = 'PUBLISHED'`),
  ],
);

export type PublicationRow = typeof publications.$inferSelect;
export type NewPublicationRow = typeof publications.$inferInsert;
