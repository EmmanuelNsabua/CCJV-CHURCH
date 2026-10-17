import { z } from "zod";
import { paginationQuerySchema } from "@/shared/http/pagination";

/**
 * Schémas Zod du module « responsables ».
 *
 * Zod valide la **forme** (types, longueurs, format d'UUID) ; les règles
 * métier (existence de la ressource, intégrité référentielle) appartiennent au
 * service et à la base.
 */

/** Paramètre d'URL `:id` — toujours un UUID : `leaders` n'a pas de slug. */
export const leaderIdParamSchema = z.object({
  id: z.uuid("Identifiant de responsable invalide"),
});

/**
 * Les responsables n'ont aucun filtre serveur : la collection est seulement
 * paginée (`docs/018` §6.3).
 *
 * Alias de la pagination commune, donc **strict** : aucun tri n'est offert,
 * l'ordre est fixé par le serveur (`position`) et le contrat de repository
 * (`ListOptions`) ne porte aucune colonne de tri. `?sort=…` — comme tout autre
 * paramètre non reconnu — est refusé en `VALIDATION_ERROR`.
 */
export const listQuerySchema = paginationQuerySchema.extend({
  departmentId: z.string().uuid("Identifiant de département invalide").optional(),
});

export type LeaderListQuery = z.infer<typeof listQuerySchema>;

export const createLeaderSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis").max(120),
  role: z.string().trim().max(120).default("Responsable"),
  /** Référence `media` issue de la bibliothèque centrale. */
  photoMediaId: z.uuid("Identifiant de média invalide").nullish(),
  departmentId: z.uuid("Identifiant de département invalide").nullish(),
  position: z.coerce.number().int().min(0).max(9999).optional(),
});

export const updateLeaderSchema = createLeaderSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Aucun champ à mettre à jour",
  });

export type CreateLeaderBody = z.infer<typeof createLeaderSchema>;
export type UpdateLeaderBody = z.infer<typeof updateLeaderSchema>;
