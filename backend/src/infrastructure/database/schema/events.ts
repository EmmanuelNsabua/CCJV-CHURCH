import {
  date,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { departments } from "./departments";
import { eventVisibilityScopeEnum } from "./enums";
import { media } from "./media";

/**
 * Événements de l'église.
 *
 * **`is_archived` n'existe pas.** La contradiction entre `docs/005` §2.3 et
 * `docs/006` §5 est tranchée en faveur du second : l'état est calculé depuis
 * `event_date`, ce qui évite qu'un booléen persisté devienne faux avec le temps.
 * Aucune transition manuelle « archiver » n'existe (`docs/006` §19).
 *
 * L'index `(event_date)` remplace l'index `(event_date, is_archived)` de
 * `docs/005` §2.3 — il portait sur une colonne supprimée.
 */
export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: varchar("title", { length: 150 }).notNull(),
    slug: varchar("slug", { length: 180 }).notNull(),
    description: text("description"),
    /** Accroche éditoriale des listes (frontend : `Event.excerpt`). */
    excerpt: text("excerpt"),
    eventDate: date("event_date").notNull(),
    eventTime: time("event_time"),
    location: varchar("location", { length: 150 }),
    imageMediaId: uuid("image_media_id").references(() => media.id, {
      onDelete: "set null",
    }),
    bannerMediaId: uuid("banner_media_id").references(() => media.id, {
      onDelete: "set null",
    }),
    /**
     * Département **responsable** : `NOT NULL` (D-26, XD-15).
     *
     * « Un événement global au sens d'un `department_id = NULL` **n'existe pas** ».
     * `RESTRICT` plutôt que `SET NULL` : sans département, l'événement perdrait son
     * responsable — exactement l'état que XD-15 interdit.
     */
    departmentId: uuid("department_id")
      .notNull()
      .references(() => departments.id, { onDelete: "restrict" }),
    /**
     * **Qui est concerné** par l'événement (`docs/028` D-26).
     *
     * Distinct du département responsable : un événement est *toujours* porté par
     * un département, et sa portée peut concerner toute l'église. `GLOBAL` n'est
     * ouvert qu'aux départements portant la capacité `EVENT_SCOPE_GLOBAL` (D-25) —
     * vérifié par `EventPolicy` **et** par un trigger (migration 0008) : une policy
     * contournée par un script d'administration ne doit pas suffire à publier à
     * l'échelle de l'église.
     *
     * Défaut `DEPARTMENT` : la portée la plus **restreinte**, pour qu'une omission
     * ne publie jamais à l'échelle de l'église.
     */
    visibilityScope: eventVisibilityScopeEnum("visibility_scope")
      .notNull()
      .default("DEPARTMENT"),
    /** Informations pratiques affichées en liste sur la fiche. */
    practicalInfo: text("practical_info").array(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("events_slug_idx").on(table.slug),
    // Index principal : liste des événements par date.
    index("events_event_date_idx").on(table.eventDate),
    index("events_department_id_idx").on(table.departmentId),
  ],
);

/** Galerie photographique ordonnée d'un événement. */
export const eventMedia = pgTable(
  "event_media",
  {
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    mediaId: uuid("media_id")
      .notNull()
      .references(() => media.id, { onDelete: "restrict" }),
    position: integer("position").notNull().default(0),
  },
  (table) => [
    primaryKey({ columns: [table.eventId, table.mediaId] }),
    index("event_media_position_idx").on(table.eventId, table.position),
  ],
);

export type EventRow = typeof events.$inferSelect;
export type NewEventRow = typeof events.$inferInsert;
