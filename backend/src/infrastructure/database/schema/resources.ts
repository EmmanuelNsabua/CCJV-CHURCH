import { boolean, index, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { departments } from "./departments";

/**
 * Table des ressources documentaires (PDF, livrets, documents d'édification).
 *
 * Évoluée pour rattachement départemental et gestion du cycle d'archivage :
 * - `departmentId` : rattachement optionnel à un département (ex: Ecodim, Presse)
 * - `isArchived` : état d'archivage (permet de masquer ou archiver un document)
 */
export const resources = pgTable(
  "resources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 200 }).notNull(),
    slug: varchar("slug", { length: 220 }).notNull(),
    description: text("description"),
    file: text("file").notNull(),
    departmentId: uuid("department_id").references(() => departments.id, {
      onDelete: "set null",
    }),
    isArchived: boolean("is_archived").notNull().default(false),
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
    index("resources_department_idx").on(table.departmentId),
    index("resources_is_archived_idx").on(table.isArchived),
  ],
);

export type ResourceRow = typeof resources.$inferSelect;
export type NewResourceRow = typeof resources.$inferInsert;
