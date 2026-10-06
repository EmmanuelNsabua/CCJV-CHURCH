import {
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { prayerConfidentialityEnum, prayerStatusEnum } from "./enums";

/**
 * Demandes de prière.
 *
 * **Entité non documentée, justifiée par le frontend réel.**
 * `src/components/forms/PrayerRequestForm.tsx` collecte une intention, un
 * prénom facultatif, un contact facultatif et un niveau de confidentialité —
 * puis **simule** l'envoi (`setTimeout`) en affirmant « Votre demande a bien
 * été reçue ». Aucun document ne couvrait ce besoin (docs/018 §3).
 *
 * Deux conséquences de sécurité, traitées dans le code :
 * 1. l'écriture est **publique** — donc rate-limitée et bornée en taille ;
 * 2. la lecture est **strictement réservée à l'administration** : ces données
 *    sont personnelles et sensibles, elles n'apparaissent dans aucune réponse
 *    publique et ne sont jamais journalisées en clair.
 *
 * Le texte de l'engagement affiché à l'utilisateur (« ne sera jamais publiée »)
 * doit rester vrai : d'où l'absence totale d'exposition publique.
 */
export const prayerRequests = pgTable(
  "prayer_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    requestText: text("request_text").notNull(),
    /** Facultatif : la personne peut rester anonyme. */
    requesterName: varchar("requester_name", { length: 120 }),
    /** Facultatif : WhatsApp ou téléphone, pour un mot d'encouragement. */
    requesterContact: varchar("requester_contact", { length: 120 }),
    confidentiality: prayerConfidentialityEnum("confidentiality")
      .notNull()
      .default("private"),
    status: prayerStatusEnum("status").notNull().default("NEW"),
    /** Renseigné lorsque l'équipe d'intercession a porté la demande. */
    handledAt: timestamp("handled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    // Consultation administrative : les plus récentes d'abord.
    index("prayer_requests_created_at_idx").on(table.createdAt.desc()),
    index("prayer_requests_status_idx").on(table.status),
  ],
);

export type PrayerRequestRow = typeof prayerRequests.$inferSelect;
export type NewPrayerRequestRow = typeof prayerRequests.$inferInsert;
