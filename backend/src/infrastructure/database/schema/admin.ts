import { sql } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import {
  boolean,
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { adminRoleEnum, userScopeEnum } from "./enums";
import { departments } from "./departments";

/**
 * Profil administrateur.
 *
 * **Aucun mot de passe n'est stocké ici.** L'authentification est déléguée à
 * Supabase Auth (`docs/004` §23, `docs/006` §2.2) : le hash reste chez Supabase.
 * Cette table ne conserve que ce dont le domaine a besoin — un identifiant
 * (identique à `auth.users.id`), un nom d'affichage, un rôle, un périmètre
 * (`scope`) et un état.
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
    /**
     * D-01 : trois rôles techniques, **aucun rôle de département**.
     *
     * Aucune valeur par défaut : le rôle est une décision d'habilitation, jamais
     * un implicite (`docs/032` §3.3). C'est également ce qui permet à la
     * migration de retirer le `DEFAULT 'ROLE_ADMIN'` hérité **avant** la
     * conversion du type — sinon la conversion échoue (`docs/033` §2.3.2).
     */
    role: adminRoleEnum("role").notNull(),
    /**
     * D-02 : le scope dit **sur quoi** le rôle agit. `GLOBAL` pour les rôles
     * système, `DEPARTMENT` pour un `DEPARTMENT_MANAGER`, rattaché à **un seul**
     * département.
     *
     * Pas de valeur par défaut, pour la même raison que `role` : un scope n'est
     * pas déductible du seul profil (`docs/032` §3.3).
     */
    scope: userScopeEnum("scope").notNull(),
    /**
     * Département de rattachement (D-02). `NULL` pour les rôles globaux.
     *
     * `ON DELETE SET NULL` : supprimer un département ne doit **jamais** faire
     * disparaître le compte de son responsable — le compte survit à la
     * restructuration, sans rattachement, et reste administrable.
     *
     * `AnyPgColumn` est requis : `admin_profiles → departments → media →
     * admin_profiles` forme un cycle de références, et l'annotation coupe
     * l'inférence circulaire sans changer le SQL produit.
     */
    departmentId: uuid("department_id").references(
      (): AnyPgColumn => departments.id,
      { onDelete: "set null" },
    ),
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
