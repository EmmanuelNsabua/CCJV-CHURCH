import {
  boolean,
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
export const siteSettings = pgTable("site_settings", {
  key: varchar("key", { length: 80 }).primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type StaticPageRow = typeof staticPages.$inferSelect;
export type ScriptureRow = typeof scriptures.$inferSelect;
export type ScheduleEntryRow = typeof scheduleEntries.$inferSelect;
export type SocialLinkRow = typeof socialLinks.$inferSelect;
export type SiteSettingRow = typeof siteSettings.$inferSelect;
