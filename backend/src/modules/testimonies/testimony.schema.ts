import { z } from "zod";
import { paginationQuerySchema } from "@/shared/http/pagination";

/**
 * Schémas Zod du module « témoignages ».
 * Aucun slug : l'identifiant de ressource est toujours un UUID.
 */

export const testimonyIdParamSchema = z.object({
  id: z.uuid("Identifiant de témoignage invalide"),
});

/**
 * Aucun filtre serveur : la collection est seulement paginée.
 *
 * Alias de la pagination commune, donc **strict** : aucun tri n'est offert
 * (l'ordre vient de `position` côté repository), donc `?sort=…` est refusé en
 * `VALIDATION_ERROR` au même titre que tout paramètre non reconnu.
 */
export const listQuerySchema = paginationQuerySchema;

export const createTestimonySchema = z.object({
  quote: z.string().trim().min(1, "La parole rapportée est requise").max(2000),
  personName: z.string().trim().min(1, "Le prénom est requis").max(120),
  personRole: z.string().trim().max(120).nullish(),
  photoMediaId: z.uuid("Identifiant de média invalide").nullish(),
  position: z.coerce.number().int().min(0).max(9999).optional(),
});

export const updateTestimonySchema = createTestimonySchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Aucun champ à mettre à jour",
  });

export type CreateTestimonyBody = z.infer<typeof createTestimonySchema>;
export type UpdateTestimonyBody = z.infer<typeof updateTestimonySchema>;
