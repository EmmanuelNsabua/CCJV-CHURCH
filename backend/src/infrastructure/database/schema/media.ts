import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { adminProfiles } from "./admin";

/**
 * Registre des fichiers réellement téléversés vers Supabase Storage.
 *
 * Pourquoi une table alors que `docs/005` modélisait de simples chaînes ?
 * Parce qu'une URL seule ne permet ni de détecter un orphelin, ni de porter un
 * texte alternatif (accessibilité), ni de savoir qui a téléversé quoi, ni de
 * refuser la suppression d'un fichier encore référencé.
 *
 * Le **contrat d'API reste inchangé** : les entités exposent toujours des URL
 * (`imageUrl`, `bannerImage`, `photo`, `contentUrl`) conformément à
 * `src/types/index.ts`. La résolution référence interne → URL publique se fait
 * à la frontière de sérialisation (docs/018 §4.5).
 */
export const media = pgTable(
  "media",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Bucket Supabase Storage, ex. `ccjv-media`. */
    bucket: varchar("bucket", { length: 100 }).notNull(),
    /** Chemin interne au bucket, généré par le serveur. Jamais fourni par le client. */
    path: text("path").notNull().unique(),
    /** URL publique dénormalisée : évite un appel de signature à chaque lecture. */
    publicUrl: text("public_url").notNull(),
    /** Type MIME **déduit du contenu binaire**, pas de l'en-tête client. */
    mimeType: varchar("mime_type", { length: 100 }).notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    width: integer("width"),
    height: integer("height"),
    /** Texte alternatif : obligatoire pour l'accessibilité WCAG 2.2 AA. */
    alt: text("alt"),
    uploadedBy: uuid("uploaded_by").references(() => adminProfiles.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("media_uploaded_by_idx").on(table.uploadedBy),
    index("media_created_at_idx").on(table.createdAt),
  ],
);

export type MediaRow = typeof media.$inferSelect;
export type NewMediaRow = typeof media.$inferInsert;
