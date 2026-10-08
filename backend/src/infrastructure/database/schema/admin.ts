import { sql } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import {
  boolean,
  check,
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { adminRoleEnum, adminScopeEnum } from "./enums";
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
    scope: adminScopeEnum("scope").notNull(),
    /**
     * Département de rattachement (D-02). `NULL` pour les rôles globaux.
     *
     * `ON DELETE RESTRICT`, conformément à `docs/032` §3.1 : « supprimer un
     * département ne doit pas faire disparaître silencieusement le rattachement
     * d'un responsable ». Un référentiel organisationnel ne s'efface pas sous un
     * compte : la suppression est refusée tant qu'un responsable y est rattaché,
     * ce qui impose de réaffecter le compte d'abord. La contrainte de cohérence
     * ci-dessous rend d'ailleurs l'inverse impossible : un
     * `DEPARTMENT_MANAGER` **doit** porter un `department_id` non nul.
     *
     * `AnyPgColumn` est requis : `admin_profiles → departments → media →
     * admin_profiles` forme un cycle de références, et l'annotation coupe
     * l'inférence circulaire sans changer le SQL produit.
     */
    departmentId: uuid("department_id").references(
      (): AnyPgColumn => departments.id,
      { onDelete: "restrict" },
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
    /**
     * D-02 explicité **en base** (`docs/032` §3.1).
     *
     * Un `DEPARTMENT_MANAGER` porte un scope `DEPARTMENT` **et** un
     * `department_id` non nul ; un rôle système porte `GLOBAL` **et** aucun
     * département. La conséquence est voulue : l'égalité départementale de
     * `docs/029` §4.3 ne peut jamais être satisfaite par accident, et
     * « `department_id` absent ou nul vaut refus » ne peut jamais se produire
     * pour un responsable — la base le refuse avant la policy.
     *
     * Sans cette contrainte, un profil incohérent (rôle `ADMIN` avec un
     * département, ou responsable sans rattachement) serait accepté par la base
     * et ne serait rattrapé par aucune couche : les policies lisent `scope` et
     * `department_id` comme des faits.
     */
    check(
      "admin_profiles_scope_coherence",
      sql`(${table.role} = 'DEPARTMENT_MANAGER' AND ${table.scope} = 'DEPARTMENT' AND ${table.departmentId} IS NOT NULL) OR (${table.role} <> 'DEPARTMENT_MANAGER' AND ${table.scope} = 'GLOBAL' AND ${table.departmentId} IS NULL)`,
    ),
  ],
);

export type AdminProfileRow = typeof adminProfiles.$inferSelect;
export type NewAdminProfileRow = typeof adminProfiles.$inferInsert;
