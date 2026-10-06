import { z } from "zod";
import { paginationQuerySchema } from "@/shared/http/pagination";

/**
 * Schémas Zod du module « visages de la communauté ».
 * Aucun slug : l'identifiant de ressource est toujours un UUID.
 */

export const communityFaceIdParamSchema = z.object({
  id: z.uuid("Identifiant de visage invalide"),
});

/**
 * Aucun filtre serveur : la collection est seulement paginée.
 *
 * Alias de la pagination commune, donc **strict** : aucun tri n'est offert
 * (l'ordre vient de `position` côté repository), donc `?sort=…` est refusé en
 * `VALIDATION_ERROR` au même titre que tout paramètre non reconnu.
 */
export const listQuerySchema = paginationQuerySchema;

export const createCommunityFaceSchema = z.object({
  personName: z.string().trim().min(1, "Le prénom est requis").max(120),
  caption: z.string().trim().min(1, "La légende est requise").max(1000),
  photoMediaId: z.uuid("Identifiant de média invalide").nullish(),
  position: z.coerce.number().int().min(0).max(9999).optional(),
});

export const updateCommunityFaceSchema = createCommunityFaceSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Aucun champ à mettre à jour",
  });

export type CreateCommunityFaceBody = z.infer<typeof createCommunityFaceSchema>;
export type UpdateCommunityFaceBody = z.infer<typeof updateCommunityFaceSchema>;
