import { z } from "zod";
import { paginationQuerySchema } from "@/shared/http/pagination";

export const resourceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Le nom est obligatoire").max(200),
  slug: z.string().min(1).max(220),
  description: z.string().nullable().optional(),
  file: z.string().min(1, "La référence au fichier PDF est obligatoire"),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createResourceSchema = z.object({
  name: z.string().min(1, "Le nom est obligatoire").max(200),
  slug: z.string().max(220).optional(),
  description: z.string().max(2000).nullable().optional(),
  file: z.string().min(1, "Le fichier PDF est obligatoire"),
});

export const updateResourceSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  slug: z.string().max(220).optional(),
  description: z.string().max(2000).nullable().optional(),
  file: z.string().min(1).optional(),
});

export const replaceResourceFileSchema = z.object({
  file: z.string().min(1, "Le nouveau fichier PDF est obligatoire"),
});

/**
 * *Query* de la collection publique.
 *
 * `paginationQuerySchema.extend(...)` et non un `z.object` neuf : la stricteur
 * de la pagination commune est ainsi préservée (`shared/http/pagination.ts`
 * §convention), et un paramètre non reconnu est refusé en `400` au lieu d'être
 * silencieusement ignoré — comme sur toutes les autres collections.
 */
export const resourceListQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().optional(),
});

export type CreateResourceInput = z.infer<typeof createResourceSchema>;
export type UpdateResourceInput = z.infer<typeof updateResourceSchema>;
export type ReplaceResourceFileInput = z.infer<typeof replaceResourceFileSchema>;
export type ResourceListQuery = z.infer<typeof resourceListQuerySchema>;
