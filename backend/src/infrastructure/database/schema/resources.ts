import { pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";

/**
 * Table des ressources documentaires (PDF téléchargeables sans authentification).
 *
 * Conforme à la spécification CCJV :
 * - `name` : nom obligatoire
 * - `slug` : identifiant unique d'URL
 * - `file` : référence stable au fichier PDF stocké dans Supabase Storage
 * - `description` : description facultative
 *
 * Aucun champ de couverture, miniature ou département.
 */
export const resources = pgTable(
  "resources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 200 }).notNull(),
    slug: varchar("slug", { length: 220 }).notNull(),
    description: text("description"),
    file: text("file").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("resources_slug_idx").on(table.slug),
  ],
);

export type ResourceRow = typeof resources.$inferSelect;
export type NewResourceRow = typeof resources.$inferInsert;
