import { z } from "zod";
import { createSortSchema, paginationQuerySchema } from "@/shared/http/pagination";

/**
 * Schémas d'entrée du module « événements ».
 *
 * Le tri passe par `createSortSchema` : la liste des colonnes autorisées vient
 * du **serveur**, jamais du client. Un `sort=description` est donc rejeté en
 * `VALIDATION_ERROR` plutôt que de produire une requête arbitraire.
 */

/** Paramètre d'URL : un UUID ou un slug (contrat `findByIdOrSlug`). */
export const eventIdOrSlugSchema = z.object({
  idOrSlug: z
    .string()
    .trim()
    .min(1, "L'identifiant ou le slug est requis")
    .max(200, "L'identifiant ou le slug est trop long"),
});

export type EventIdOrSlugParams = z.infer<typeof eventIdOrSlugSchema>;

/** Colonnes de tri autorisées, alignées sur `EventSortColumn` du domaine. */
export const EVENT_SORT_COLUMNS = ["event_date", "created_at"] as const;

/**
 * Filtres publics.
 *
 * `status` n'existe pas en base : il est traduit en comparaison de dates par le
 * repository. `today` n'est **jamais** exposé ici — une borne de date fournie
 * par le client fausserait la notion d'« à venir ».
 *
 * Le tri par défaut est la date croissante : appelé avec `status=UPCOMING`,
 * l'écran public obtient naturellement l'événement le plus proche en premier.
 */
export const listEventQuerySchema = z.object({
  ...paginationQuerySchema.shape,
  status: z.enum(["UPCOMING", "ARCHIVED"]).optional(),
  departmentId: z.uuid("Le département doit être identifié par un UUID").optional(),
  sort: createSortSchema(EVENT_SORT_COLUMNS, "event_date"),
});

export type EventListQuery = z.infer<typeof listEventQuerySchema>;

/**
 * Champs communs à la création et à la mise à jour.
 *
 * `eventDate` est une chaîne `YYYY-MM-DD` (`z.iso.date`), jamais un objet
 * `Date` : c'est ce qui évite tout décalage de fuseau entre le serveur et
 * Lubumbashi. `eventTime` accepte `HH:MM` comme `HH:MM:SS`.
 */
const eventFields = {
  title: z
    .string()
    .trim()
    .min(3, "Le titre doit contenir au moins 3 caractères")
    .max(150, "Le titre ne peut pas dépasser 150 caractères"),
  description: z.string().trim().max(5000, "La description est trop longue").nullish(),
  excerpt: z.string().trim().max(500, "L'accroche est trop longue").nullish(),
  eventDate: z.iso.date("La date doit être au format AAAA-MM-JJ"),
  eventTime: z
    .string()
    .trim()
    .regex(
      /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/,
      "L'heure doit être au format HH:MM",
    )
    .nullish(),
  location: z.string().trim().max(150, "Le lieu est trop long").nullish(),
  imageMediaId: z.uuid("L'identifiant de média doit être un UUID").nullish(),
  bannerMediaId: z.uuid("L'identifiant de média doit être un UUID").nullish(),
  /**
   * `null` = événement général de l'église. Le service vérifie que le
   * département référencé existe réellement.
   */
  departmentId: z.uuid("L'identifiant de département doit être un UUID").nullish(),
  practicalInfo: z
    .array(z.string().trim().min(1).max(300))
    .max(20, "20 informations pratiques au maximum")
    .nullish(),
  galleryMediaIds: z.array(z.uuid("Identifiant de média invalide")).max(60).optional(),
};

export const createEventSchema = z.object({
  ...eventFields,
  slug: z
    .string()
    .trim()
    .min(2, "Le slug doit contenir au moins 2 caractères")
    .max(180, "Le slug ne peut pas dépasser 180 caractères")
    .optional(),
});

/** Mise à jour partielle : `slug` en est absent (l'URL publique ne change pas). */
export const updateEventSchema = z.object(eventFields).partial();

export type CreateEventBody = z.infer<typeof createEventSchema>;
export type UpdateEventBody = z.infer<typeof updateEventSchema>;
