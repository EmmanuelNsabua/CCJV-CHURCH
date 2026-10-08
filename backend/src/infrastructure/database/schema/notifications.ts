import { sql } from "drizzle-orm";
import { boolean, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { adminProfiles } from "./admin";
import { notificationTypeEnum } from "./enums";

/**
 * Notifications (`docs/032` §3.3, `docs/030` §6.2).
 *
 * ### Ce que la table ne contient pas, et pourquoi c'est structurel
 *
 * Aucun contenu, aucun nom, aucun extrait, aucune longueur, aucune liste de
 * destinataires, aucun état anonyme : `docs/032` §3.3 l'écrit sans détour —
 * « cette interdiction est **structurelle** : les colonnes n'existent pas ».
 * C'est la seule forme d'interdiction qui survit à une relecture distraite : on
 * ne peut pas oublier de filtrer un champ qui n'est pas là. `reference_id` porte
 * un identifiant (`{ referenceId = requestId }`, `docs/030` §6.2), jamais un
 * fragment de texte.
 *
 * `reference_id` est **polymorphe** et sans clé étrangère : soit un identifiant de
 * demande de prière — dont l'existence est invisible hors du schéma isolé — soit
 * une référence de clé. Une FK franchirait la frontière de privilèges que
 * `docs/030` §4.6 interdit.
 *
 * ### D-10, garanti par un trigger et non par un `CHECK`
 *
 * « Aucune notification du domaine des prières ne peut viser un non-ADMIN »
 * (`docs/030` §6.2), et les notifications de sécurité des clés ne vont **jamais**
 * au `SUPER_ADMIN` (`docs/030` §4.7). La règle exige de lire
 * `public.admin_profiles`, or PostgreSQL **interdit toute sous-requête dans un
 * `CHECK`** : elle est donc portée par un trigger, créé avec la table.
 *
 * La conséquence est visible dans le code : `NotificationPolicy` refuse déjà ces
 * cas, et la base les refuse **aussi**. Un script d'administration, un correctif
 * manuel ou un futur service qui contournerait la policy ne produiraient pas
 * davantage de notification interdite — c'est la différence entre une règle
 * déclarée et une règle garantie, que D-03 exige précisément pour ce domaine.
 *
 * `recipient_user_id` est `ON DELETE CASCADE` : une notification sans
 * destinataire n'a plus d'objet, et la conserver maintiendrait un lien vers un
 * compte révoqué — ce que D-14 étape 1 interdit (« accès futur immédiatement
 * révoqué »).
 */
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    recipientUserId: uuid("recipient_user_id")
      .notNull()
      .references(() => adminProfiles.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    /** Identifiant référencé (polymorphe, sans FK). Jamais un contenu. */
    referenceId: text("reference_id"),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // Lecture d'une boîte de réception : par destinataire, les non-lues d'abord.
    index("notifications_recipient_idx").on(table.recipientUserId, table.isRead),
    index("notifications_created_at_idx").on(table.createdAt),
    index("notifications_type_idx").on(table.type),
  ],
);

export type NotificationRow = typeof notifications.$inferSelect;
export type NewNotificationRow = typeof notifications.$inferInsert;

/**
 * Rappel de conception, à l'usage des relecteurs du schéma.
 *
 * Le trigger D-10 de `docs/032` §3.3 n'est **pas exprimable en Drizzle** : il est
 * ajouté à la main à la migration (`drizzle/0004_*.sql`) et prouvé par exécution
 * annulée. Le laisser hors du schéma TypeScript est une limite de l'outil, pas un
 * oubli — et c'est la raison pour laquelle ce commentaire existe plutôt qu'un
 * silence.
 */
export const NOTIFICATIONS_D10_TRIGGER = sql`notifications_recipient_role_check`;
