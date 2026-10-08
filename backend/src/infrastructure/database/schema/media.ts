import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { adminProfiles } from "./admin";
import { mediaGranteeTypeEnum } from "./enums";

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

/**
 * Droits d'accès aux médias (`docs/028` D-21, D-22, `docs/032` §3.4).
 *
 * ### Ce que cette table remplace
 *
 * `docs/028` X27 et `021` §19 interdisent `media.department_id` : la bibliothèque
 * est **centrale**, elle n'appartient à personne. L'accès d'un département à un
 * média passe donc **uniquement** par cette table, et jamais par un rattachement
 * du média. C'est ce qui permet à la Presse de téléverser un fichier que
 * l'Ecodume ne voit pas — sans que le fichier « appartienne » à la Presse.
 *
 * ### Trois droits, aucune hiérarchie
 *
 * Trois colonnes booléennes **indépendantes**, et non un niveau, un ordinal ou un
 * drapeau agrégé : D-21 exige que « le système d'autorisation teste
 * **explicitement** la permission demandée ». Une échelle `USE < MANAGE < DELETE`
 * produirait exactement la déduction que D-21 interdit.
 *
 * ### Aucun partage par défaut
 *
 * Les trois colonnes sont à `false` par défaut, et il n'existe **aucune ligne**
 * sans décision explicite : D-22 (« aucun partage par défaut ») et XD-09. Un
 * département sans ligne ne voit rien — le refus est l'état initial, jamais une
 * exception à rattraper.
 *
 * ### Deux contraintes qui portent des décisions
 *
 * - `media_access_department_no_delete` : un grant à un **département** ne peut
 *   jamais porter `DELETE` (XD-07, « Responsable Presse : … DELETE → non »). Le
 *   refus est donc écrit **en base**, pas seulement dans la policy : un script
 *   d'administration ne peut pas l'accorder non plus.
 * - `media_access_at_least_one_right` : un grant qui n'accorde rien est un défaut
 *   de saisie, pas une autorisation. Une ligne vide brouillerait la lecture « qui
 *   a accès à quoi », alors que le retrait d'un droit se fait par `DELETE` de la
 *   ligne (action `REVOKE`, `docs/029` §2.6).
 *
 * ### La cible est polymorphe, et son intégrité n'est pas portée par une FK
 *
 * `grantee_id` désigne un département **ou** un profil selon `grantee_type` : une
 * FK conditionnelle n'existe pas en SQL. Deux index uniques **partiels** (un par
 * type) garantissent qu'il n'existe qu'**une** ligne de droits par couple
 * (média, destinataire) ; l'existence de la cible est vérifiée par un trigger
 * `media_access_check_grantee` créé avec la table (`docs/033` M-H1). `docs/033`
 * R-NT1 signale honnêtement que ce trigger est « contournable par désactivation »
 * — c'est une réserve connue, pas un oubli.
 */
export const mediaAccess = pgTable(
  "media_access",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    mediaId: uuid("media_id")
      .notNull()
      .references(() => media.id, { onDelete: "cascade" }),
    granteeType: mediaGranteeTypeEnum("grantee_type").notNull(),
    /** Polymorphe : département ou profil, selon `granteeType`. Aucune FK. */
    granteeId: uuid("grantee_id").notNull(),
    canUse: boolean("can_use").notNull().default(false),
    canManage: boolean("can_manage").notNull().default(false),
    canDelete: boolean("can_delete").notNull().default(false),
    /**
     * Auteur du grant — la preuve de qui a autorisé quoi (`docs/029` §2.6).
     * `RESTRICT` : effacer l'auteur rendrait l'autorisation inattribuable.
     */
    grantedBy: uuid("granted_by")
      .notNull()
      .references(() => adminProfiles.id, { onDelete: "restrict" }),
    grantedAt: timestamp("granted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // Une seule ligne de droits par (média, destinataire), et par type de
    // destinataire : la cible étant polymorphe, l'unicité doit être partielle.
    uniqueIndex("media_access_department_unique")
      .on(table.mediaId, table.granteeId)
      .where(sql`${table.granteeType} = 'DEPARTMENT'`),
    uniqueIndex("media_access_profile_unique")
      .on(table.mediaId, table.granteeId)
      .where(sql`${table.granteeType} = 'ADMIN_PROFILE'`),
    index("media_access_grantee_idx").on(table.granteeId),
    check(
      "media_access_at_least_one_right",
      sql`${table.canUse} OR ${table.canManage} OR ${table.canDelete}`,
    ),
    check(
      "media_access_department_no_delete",
      sql`${table.granteeType} <> 'DEPARTMENT' OR ${table.canDelete} = false`,
    ),
    check(
      "media_access_timestamps_order",
      sql`${table.updatedAt} >= ${table.grantedAt}`,
    ),
  ],
);

export type MediaAccessRow = typeof mediaAccess.$inferSelect;
export type NewMediaAccessRow = typeof mediaAccess.$inferInsert;
