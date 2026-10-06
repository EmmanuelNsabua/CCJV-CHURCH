import { z } from "zod";
import { createSortSchema, paginationQuerySchema } from "@/shared/http/pagination";
import { toIsoDate } from "@/domain/rules/event-status";

/**
 * Schémas d'entrée du module « publications ».
 *
 * ⚠️ Le filtre public ne comporte **pas** de `status` : il n'est pas « optionnel
 * avec une valeur par défaut », il est **absent**, et le service force
 * `PUBLISHED` côté base. Un client ne peut donc pas demander les brouillons,
 * même en forgeant la *query* string (IMPLEMENTATION_SPEC §Règles publications).
 */

/** Paramètre d'URL : un UUID ou un slug (contrat `findByIdOrSlug`). */
export const publicationIdOrSlugSchema = z.object({
  idOrSlug: z
    .string()
    .trim()
    .min(1, "L'identifiant ou le slug est requis")
    .max(200, "L'identifiant ou le slug est trop long"),
});

export type PublicationIdOrSlugParams = z.infer<
  typeof publicationIdOrSlugSchema
>;

/** Colonnes de tri autorisées, alignées sur `PublicationSortColumn`. */
export const PUBLICATION_SORT_COLUMNS = ["published_at", "created_at"] as const;

/**
 * Tri par défaut, exprimé sous la forme que `createSortSchema` sait lire : le
 * préfixe `-` demande une direction décroissante. `preprocess` l'injecte quand
 * le client ne transmet aucun `sort` — la valeur de repli du helper ne peut pas
 * porter ce préfixe, sa signature exigeant un nom de colonne nu.
 */
const DEFAULT_SORT = "-published_at";

/** Filtres publics : type, rubrique éditoriale, pagination, tri. */
export const listPublicationQuerySchema = z.object({
  ...paginationQuerySchema.shape,
  type: z.enum(["VIDEO", "PHOTO", "TEXTE"]).optional(),
  category: z.enum(["ACTUALITE", "ENSEIGNEMENT", "MEDIA", "RESSOURCE"]).optional(),
  // Défaut chronologique décroissant : c'est l'ordre des données de
  // démonstration du frontend et l'attendu d'une rubrique d'actualités.
  sort: z.preprocess(
    (raw) => (raw === undefined ? DEFAULT_SORT : raw),
    createSortSchema(PUBLICATION_SORT_COLUMNS, "published_at"),
  ),
});

export type PublicationListQuery = z.infer<typeof listPublicationQuerySchema>;

/**
 * Champs communs à la création et à la mise à jour.
 *
 * La cohérence entre `type` et contenu (une VIDEO sans lien, un TEXTE sans
 * corps) n'est **pas** vérifiable ici : sur une mise à jour partielle, elle
 * dépend de la valeur déjà stockée. Elle est donc arbitrée par le service, qui
 * dispose de la ressource existante (IMPLEMENTATION_SPEC §4.4).
 */
const publicationFields = {
  title: z
    .string()
    .trim()
    .min(3, "Le titre doit contenir au moins 3 caractères")
    .max(150, "Le titre ne peut pas dépasser 150 caractères"),
  type: z.enum(["VIDEO", "PHOTO", "TEXTE"]),
  category: z.enum(["ACTUALITE", "ENSEIGNEMENT", "MEDIA", "RESSOURCE"]),
  /** `DRAFT` dépublie sans supprimer ; `PUBLISHED` est la valeur par défaut. */
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
  contentUrl: z.string().trim().max(1000, "L'URL est trop longue").nullish(),
  coverMediaId: z.uuid("L'identifiant de média doit être un UUID").nullish(),
  description: z.string().trim().max(5000, "La description est trop longue").nullish(),
  body: z
    .array(z.string().trim().min(1).max(5000))
    .max(50, "50 paragraphes au maximum")
    .nullish(),
  author: z.string().trim().max(120, "Le nom de l'auteur est trop long").nullish(),
  publishedAt: z.iso.date("La date doit être au format AAAA-MM-JJ"),
};

export const createPublicationSchema = z.object({
  ...publicationFields,
  /**
   * Date de publication par défaut : aujourd'hui, au moment de la requête.
   * La fabrique est évaluée à chaque parsing — un serveur qui franchit minuit
   * ne doit pas continuer à dater les publications de la veille.
   */
  publishedAt: z.iso.date("La date doit être au format AAAA-MM-JJ").default(() =>
    toIsoDate(new Date()),
  ),
  slug: z
    .string()
    .trim()
    .min(2, "Le slug doit contenir au moins 2 caractères")
    .max(180, "Le slug ne peut pas dépasser 180 caractères")
    .optional(),
});

/**
 * Mise à jour partielle.
 *
 * `publishedAt` n'a **pas** de valeur par défaut ici : un `PATCH` qui ne parle
 * pas de la date de publication ne doit pas la réécrire à la date du jour.
 * `slug` est absent : le contrat de repository ne permet pas de le modifier.
 */
export const updatePublicationSchema = z.object(publicationFields).partial();

export type CreatePublicationBody = z.infer<typeof createPublicationSchema>;
export type UpdatePublicationBody = z.infer<typeof updatePublicationSchema>;
