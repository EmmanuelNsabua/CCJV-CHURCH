import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { adminProfiles } from "./admin";

/**
 * Contenu éditable du site.
 *
 * Périmètre volontairement borné (cahier §9) : on ne transforme pas
 * l'interface en CMS générique. Ne sont stockés ici que les contenus qui
 * changent réellement sans redéploiement, et qui ne sont pas des entités
 * métier à part entière.
 */

/**
 * Pages éditables.
 *
 * `content` est un `jsonb` **validé par un schéma Zod par `page_key`**
 * (docs/018 §5). Le back-office édite des champs nommés, jamais du HTML :
 * cela évite toute injection et empêche qu'une mise en page soit cassée par
 * une saisie. Une `page_key` inconnue est rejetée à l'écriture.
 */
export const staticPages = pgTable(
  "static_pages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pageKey: varchar("page_key", { length: 60 }).notNull(),
    content: jsonb("content").notNull(),
    updatedBy: uuid("updated_by").references(() => adminProfiles.id, {
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
  (table) => [uniqueIndex("static_pages_page_key_idx").on(table.pageKey)],
);

/**
 * Versets bibliques, référencés par clé depuis les pages.
 *
 * `translation` est explicite : les textes utilisés sont Louis Segond 1910
 * (domaine public), et la traduction doit être affichée. Aucun verset n'est
 * inventé — la sélection reste à valider par CCJV (docs/015 §5).
 */
export const scriptures = pgTable(
  "scriptures",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Clé de référence, ex. `rassemblement`, `repos`, `ouvrage`. */
    key: varchar("key", { length: 60 }).notNull(),
    text: text("text").notNull(),
    reference: varchar("reference", { length: 80 }).notNull(),
    translation: varchar("translation", { length: 80 })
      .notNull()
      .default("Louis Segond 1910"),
    /** Pourquoi ce verset est placé là — éditorial, facultatif. */
    context: varchar("context", { length: 200 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [uniqueIndex("scriptures_key_idx").on(table.key)],
);

/**
 * Rythme hebdomadaire de la communauté.
 *
 * `isConfirmed` reprend le drapeau `confirmed` du frontend : il distingue un
 * horaire communiqué par CCJV d'un horaire encore provisoire. C'est une
 * information de confiance, pas un détail d'affichage.
 */
export const scheduleEntries = pgTable(
  "schedule_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    day: varchar("day", { length: 20 }).notNull(),
    title: varchar("title", { length: 120 }).notNull(),
    /** Libellé libre : « 09h00 », « 16h30 – 18h30 », « Dans la nuit ». */
    timeLabel: varchar("time_label", { length: 60 }).notNull(),
    audience: varchar("audience", { length: 120 }),
    isConfirmed: boolean("is_confirmed").notNull().default(false),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("schedule_entries_position_idx").on(table.position)],
);

export const socialLinks = pgTable(
  "social_links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    label: varchar("label", { length: 60 }).notNull(),
    href: text("href").notNull(),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("social_links_position_idx").on(table.position)],
);

/**
 * Réglages institutionnels scalaires.
 *
 * Choix délibéré et borné : clé/valeur ne convient qu'à des scalaires déjà
 * présents dans `src/data/mock/site.ts` (nom, adresse, WhatsApp, dates de
 * fondation). Toute liste ordonnée ou entité a sa propre table — c'est ce qui
 * évite la dérive vers un CMS générique.
 */
export const siteSettings = pgTable(
  "site_settings",
  {
    key: varchar("key", { length: 80 }).primaryKey(),
    value: text("value").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    /**
     * **Aucune clé de configuration ne peut porter un secret de prière.**
     *
     * `docs/032` §3.10 relie deux décisions qui, prises séparément, laisseraient
     * une porte ouverte : le `SUPER_ADMIN` **lit** les paramètres (`docs/028` D-03
     * lui attribue « les paramètres ») et ne doit **rien** voir du domaine
     * `PrayerRequest` (D-10 — « fonctionnellement inexistant pour lui »). Une clé
     * de secours rangée dans `site_settings` rouvrirait donc exactement la fuite
     * que D-10 ferme, par un chemin que personne ne surveille : un simple
     * enregistrement de configuration.
     *
     * `docs/030` §5.5 en fait une interdiction explicite — « toute forme de clé de
     * secours en ligne recréerait exactement O3 et est interdite » — et c'est cette
     * phrase que ce `CHECK` traduit en garantie.
     *
     * Le motif couvre les préfixes qui trahissent un secret : `prayer`, `crypto`,
     * `dek` (clé de données), `recovery`, `kek` (clé d'enveloppe), `master`.
     * Insensible à la casse (`!~*`) : `Prayer_Recovery` doit être refusé comme
     * `prayer_recovery`.
     *
     * C'est une barrière **structurelle**, au même titre que l'absence de colonne :
     * elle s'applique à toute écriture, y compris à un script d'administration ou
     * à un correctif manuel — les chemins par lesquels un secret entrerait
     * justement sans passer par une policy.
     *
     * Note d'implémentation : ajouter une **contrainte** ne change aucune colonne,
     * donc aucune lecture. C'est la raison pour laquelle cette règle peut être
     * livrée sans toucher aux routes publiques des paramètres, contrairement aux
     * évolutions de schéma qui ajoutent des colonnes.
     */
    check(
      "site_settings_no_prayer_secret",
      sql`${table.key} !~* '^(prayer|crypto|dek|recovery|kek|master)'`,
    ),
  ],
);

export type StaticPageRow = typeof staticPages.$inferSelect;
export type ScriptureRow = typeof scriptures.$inferSelect;
export type ScheduleEntryRow = typeof scheduleEntries.$inferSelect;
export type SocialLinkRow = typeof socialLinks.$inferSelect;
export type SiteSettingRow = typeof siteSettings.$inferSelect;
