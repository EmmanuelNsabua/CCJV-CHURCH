import {
  check,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { adminProfiles } from "./admin";
import { media } from "./media";

/**
 * Départements de l'église.
 *
 * Entièrement dynamiques (`docs/006` §3) : aucune liste n'est codée en dur, ni
 * en base, ni dans le frontend. Ajouter un département = insérer une ligne.
 *
 * Les champs éditoriaux ajoutés par rapport à `docs/005` §2.2 (`tagline`,
 * `meeting_schedule`, `key_points`, `banner_media_id`, `position`) ne sont pas
 * décoratifs : ils sont **lus par le frontend réel** — voir `src/types/index.ts`
 * (`Department`) et `DepartmentModal.tsx`.
 */
export const departments = pgTable(
  "departments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 100 }).notNull(),
    slug: varchar("slug", { length: 160 }).notNull(),
    description: text("description"),
    responsibleName: varchar("responsible_name", { length: 120 }),
    /** Accroche courte affichée dans les listes. */
    tagline: varchar("tagline", { length: 200 }),
    /** Rythme de rencontre, ex. « Lundi 16h30–18h30 · Mercredi dans la nuit ». */
    meetingSchedule: varchar("meeting_schedule", { length: 255 }),
    /** Piliers / valeurs mis en avant sur la fiche. */
    keyPoints: text("key_points").array(),
    bannerMediaId: uuid("banner_media_id").references(() => media.id, {
      onDelete: "set null",
    }),
    /** Ordre d'affichage voulu par l'administration. */
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
    uniqueIndex("departments_slug_idx").on(table.slug),
    index("departments_position_idx").on(table.position),
  ],
);

/** Galerie photographique ordonnée d'un département. */
export const departmentMedia = pgTable(
  "department_media",
  {
    departmentId: uuid("department_id")
      .notNull()
      .references(() => departments.id, { onDelete: "cascade" }),
    mediaId: uuid("media_id")
      .notNull()
      .references(() => media.id, { onDelete: "restrict" }),
    position: integer("position").notNull().default(0),
  },
  (table) => [
    primaryKey({ columns: [table.departmentId, table.mediaId] }),
    index("department_media_position_idx").on(table.departmentId, table.position),
  ],
);

/**
 * Capacités d'un département (`docs/028` D-25, `docs/032` §3.5).
 *
 * C'est la réponse retenue à « comment un département publie-t-il un événement à
 * l'échelle de toute l'église, sans que le code nomme ce département ? ».
 *
 * **Le vocabulaire est fermé, et volontairement minuscule.** Une seule capacité
 * existe : `EVENT_SCOPE_GLOBAL`. `docs/032` §3.5 est explicite — « Aucune autre
 * n'est inventée ; le `CHECK` est élargi par **décision explicite**, jamais par
 * commodité ». Un `CHECK` plutôt qu'une énumération PostgreSQL pour une raison
 * pratique : élargir un `CHECK` est un `ALTER` anodin, là où ajouter une valeur
 * à une énumération impose la séquence `ADD VALUE` et ses contraintes
 * transactionnelles (`docs/033` §2.3.2).
 *
 * **La clé primaire est composée** `(department_id, capability)` : une capacité
 * est un attribut du département, pas une entité autonome. L'index inverse (par
 * capacité) sert le sens de lecture réel — « quels départements peuvent publier
 * globalement ? » — c'est-à-dire celui du trigger de portée (`docs/032` §3.6) et
 * de la résolution des capacités d'un acteur.
 *
 * `granted_by` est **nullable** : `docs/032` §3.5 le déclare `NULL`-able, et
 * c'est cohérent avec l'absence d'arbitrage de Q-06 — une capacité peut avoir
 * été posée par une migration, sans auteur applicatif. Le jour où Q-06 est
 * tranchée, la valeur devient renseignée par la policy qui l'écrit ; la colonne
 * n'a pas à changer. `RESTRICT` préserve l'attribution : supprimer le compte
 * auteur d'un grant est refusé tant que le grant existe.
 */
export const departmentCapabilities = pgTable(
  "department_capabilities",
  {
    departmentId: uuid("department_id")
      .notNull()
      .references(() => departments.id, { onDelete: "cascade" }),
    /** Code de capacité (`varchar(60)`), contrôlé par le `CHECK` ci-dessous. */
    capability: varchar("capability", { length: 60 }).notNull(),
    /**
     * Auteur du grant. `AnyPgColumn` coupe l'inférence circulaire :
     * `departments → admin_profiles → departments` referme un cycle.
     */
    grantedBy: uuid("granted_by").references(
      (): AnyPgColumn => adminProfiles.id,
      { onDelete: "restrict" },
    ),
    grantedAt: timestamp("granted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.departmentId, table.capability] }),
    index("department_capabilities_capability_idx").on(table.capability),
    check(
      "department_capabilities_known_capability",
      sql`${table.capability} IN ('EVENT_SCOPE_GLOBAL')`,
    ),
  ],
);

export type DepartmentCapabilityRow = typeof departmentCapabilities.$inferSelect;
export type NewDepartmentCapabilityRow = typeof departmentCapabilities.$inferInsert;

export type DepartmentRow = typeof departments.$inferSelect;
export type NewDepartmentRow = typeof departments.$inferInsert;
