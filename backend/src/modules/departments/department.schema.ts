import { z } from "zod";
import {
  paginationQuerySchema,
  type PaginationQuery,
} from "@/shared/http/pagination";

/**
 * Schémas d'entrée du module « départements ».
 *
 * Ils décrivent uniquement la **forme** des entrées HTTP. Les règles métier
 * (unicité de slug, cohérence de contenu) vivent dans le service : Zod ne sait
 * pas interroger la base et ne doit pas décider d'un `DUPLICATE_SLUG`.
 */

/**
 * Paramètre d'URL : un UUID **ou** un slug. C'est ce qui permet au frontend de
 * conserver ses URL actuelles (`/departements/chorale`) sans requête
 * supplémentaire (IMPLEMENTATION_SPEC §3.5).
 */
export const departmentIdOrSlugSchema = z.object({
  idOrSlug: z
    .string()
    .trim()
    .min(1, "L'identifiant ou le slug est requis")
    .max(200, "L'identifiant ou le slug est trop long"),
});

export type DepartmentIdOrSlugParams = z.infer<typeof departmentIdOrSlugSchema>;

/**
 * Aucun filtre métier en V1 : uniquement la pagination (page, limite).
 *
 * Le schéma est **strict** (alias de `paginationQuerySchema`, qui est un objet
 * strict) : `?sort=…` comme tout autre paramètre non reconnu est refusé en
 * `VALIDATION_ERROR`. L'API ne prétend pas trier cette collection — le tri est
 * fixé par le serveur (`position`), et le contrat de repository (`ListOptions`)
 * ne porte aucune colonne de tri.
 */
export const listDepartmentQuerySchema = paginationQuerySchema;

export type DepartmentListQuery = PaginationQuery;

/**
 * Champs communs à la création et à la mise à jour.
 *
 * `nullish()` et non `optional()` : un administrateur doit pouvoir **vider** un
 * champ facultatif (« ce département n'a plus de responsable »), ce qu'un
 * `undefined` ne permet pas de distinguer d'un champ non transmis.
 */
const departmentFields = {
  name: z
    .string()
    .trim()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne peut pas dépasser 100 caractères"),
  description: z.string().trim().max(5000, "La description est trop longue").nullish(),
  responsibleName: z
    .string()
    .trim()
    .max(120, "Le nom du responsable est trop long")
    .nullish(),
  tagline: z.string().trim().max(200, "L'accroche est trop longue").nullish(),
  meetingSchedule: z
    .string()
    .trim()
    .max(255, "Le rythme de rencontre est trop long")
    .nullish(),
  keyPoints: z
    .array(z.string().trim().min(1).max(300))
    .max(20, "20 points clés au maximum")
    .nullish(),
  bannerMediaId: z.uuid("L'identifiant de média doit être un UUID").nullish(),
  galleryMediaIds: z.array(z.uuid("Identifiant de média invalide")).max(60).optional(),
  position: z.coerce.number().int().min(0).max(10_000).optional(),
};

export const createDepartmentSchema = z.object({
  ...departmentFields,
  /**
   * Slug explicite, facultatif. S'il est déjà pris, le service lève
   * `DUPLICATE_SLUG` au lieu de le suffixer automatiquement : un slug imposé
   * par un administrateur est une intention, pas une suggestion.
   */
  slug: z
    .string()
    .trim()
    .min(2, "Le slug doit contenir au moins 2 caractères")
    .max(160, "Le slug ne peut pas dépasser 160 caractères")
    .optional(),
});

/**
 * Mise à jour partielle.
 *
 * `slug` en est volontairement absent : le contrat de repository
 * (`update(id, data: Partial<DepartmentInput>)`) ne permet pas de le modifier,
 * une URL publique ne doit donc pas changer dans le dos des visiteurs.
 */
export const updateDepartmentSchema = z.object(departmentFields).partial();

export type CreateDepartmentBody = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentBody = z.infer<typeof updateDepartmentSchema>;
