import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { adminRoleEnum } from "./enums";

/**
 * Profil administrateur.
 *
 * **Aucun mot de passe n'est stocké ici.** L'authentification est déléguée à
 * Supabase Auth (`docs/004` §23, `docs/006` §2.2) : le hash reste chez Supabase.
 * Cette table ne conserve que ce dont le domaine a besoin — un identifiant
 * (identique à `auth.users.id`), un nom d'affichage, un rôle et un état.
 *
 * C'est ce qui lève la contradiction n°2 de `docs/018` §1 : `docs/005` §2.1
 * décrivait un `password_hash`, mais `docs/006` §2.2 délègue explicitement
 * l'authentification à Supabase.
 */
export const adminProfiles = pgTable(
  "admin_profiles",
  {
    /** Égale à `auth.users.id` : la FK est gérée hors Drizzle (schéma `auth`). */
    id: uuid("id").primaryKey(),
    username: varchar("username", { length: 50 }).notNull(),
    displayName: varchar("display_name", { length: 120 }),
    role: adminRoleEnum("role").notNull().default("ROLE_ADMIN"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    // Unicité insensible à la casse : « Admin » et « admin » sont le même compte.
    uniqueIndex("admin_profiles_username_lower_idx").on(sql`lower(${table.username})`),
    index("admin_profiles_role_idx").on(table.role),
  ],
);

export type AdminProfileRow = typeof adminProfiles.$inferSelect;
export type NewAdminProfileRow = typeof adminProfiles.$inferInsert;
