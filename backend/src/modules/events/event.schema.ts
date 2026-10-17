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
 *
 * Le schéma est construit par `.extend()` — **pas** par étalement de
 * `paginationQuerySchema.shape` : `.extend()` préserve la stricteur de la
 * pagination commune, un étalement la perdrait et le paramètre inconnu
 * repasserait en silence (`shared/http/pagination.ts`).
 */
export const listEventQuerySchema = paginationQuerySchema.extend({
  status: z.enum(["UPCOMING", "ARCHIVED", "DRAFT", "PUBLISHED", "CANCELLED"]).optional(),
  view: z.enum(["UPCOMING", "ARCHIVED", "ALL"]).optional(),
  departmentId: z.string().uuid("Le département doit être identifié par un UUID").optional(),
  sort: createSortSchema(EVENT_SORT_COLUMNS, "event_date"),
});

export type EventListQuery = z.infer<typeof listEventQuerySchema>;

/**
 * Champs communs à la création et à la mise à jour.
 */
const timeRegex = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

const baseEventFields = {
  title: z
    .string()
    .trim()
    .min(2, "Le titre doit contenir au moins 2 caractères")
    .max(150, "Le titre ne peut pas dépasser 150 caractères"),
  description: z.string().trim().max(5000, "La description est trop longue").nullish(),
  excerpt: z.string().trim().max(500, "L'accroche est trop longue").nullish(),
  // Dates
  startDate: z.iso.date("La date de début doit être au format AAAA-MM-JJ").optional(),
  eventDate: z.iso.date("La date de début doit être au format AAAA-MM-JJ").optional(),
  endDate: z.iso.date("La date de fin doit être au format AAAA-MM-JJ").optional(),
  // Heures indépendantes
  startTime: z.string().trim().regex(timeRegex, "L'heure de début doit être au format HH:MM").nullish(),
  eventTime: z.string().trim().regex(timeRegex, "L'heure de début doit être au format HH:MM").nullish(),
  endTime: z.string().trim().regex(timeRegex, "L'heure de fin doit être au format HH:MM").nullish(),
  // Lieu
  location: z.string().trim().max(150, "Le lieu est trop long").nullish(),
  // Miniature & bandeau
  imageMediaId: z.uuid("L'identifiant de miniature doit être un UUID").nullish(),
  bannerMediaId: z.uuid("L'identifiant de média doit être un UUID").nullish(),
  // Statut
  status: z.enum(["DRAFT", "PUBLISHED", "CANCELLED"]).optional(),
  // Département optionnel (aucun département organisateur requis)
  departmentId: z.uuid("L'identifiant de département doit être un UUID").nullish(),
  visibilityScope: z.enum(["DEPARTMENT", "GLOBAL"]).optional(),
  practicalInfo: z
    .array(z.string().trim().min(1).max(300))
    .max(20, "20 informations pratiques au maximum")
    .nullish(),
  galleryMediaIds: z.array(z.uuid("Identifiant de média invalide")).max(60).optional(),
};

export const createEventSchema = z
  .object({
    ...baseEventFields,
    title: baseEventFields.title,
    slug: z
      .string()
      .trim()
      .min(2, "Le slug doit contenir au moins 2 caractères")
      .max(180, "Le slug ne peut pas dépasser 180 caractères")
      .optional(),
  })
  .refine(
    (data) => {
      const start = data.startDate ?? data.eventDate;
      const end = data.endDate ?? start;
      if (!start || !end) return true;
      return end >= start;
    },
    {
      message: "La date de fin ne peut pas être antérieure à la date de début",
      path: ["endDate"],
    },
  );

export const updateEventSchema = z
  .object(baseEventFields)
  .partial()
  .refine(
    (data) => {
      const start = data.startDate ?? data.eventDate;
      const end = data.endDate;
      if (!start || !end) return true;
      return end >= start;
    },
    {
      message: "La date de fin ne peut pas être antérieure à la date de début",
      path: ["endDate"],
    },
  );

export type CreateEventBody = z.infer<typeof createEventSchema>;
export type UpdateEventBody = z.infer<typeof updateEventSchema>;
