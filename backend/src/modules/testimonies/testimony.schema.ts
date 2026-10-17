import { z } from "zod";
import { paginationQuerySchema } from "@/shared/http/pagination";

/**
 * Schémas Zod du module « témoignages ».
 * Aucun slug : l'identifiant de ressource est toujours un UUID.
 */

export const testimonyIdParamSchema = z.object({
  id: z.uuid("Identifiant de témoignage invalide"),
});

export const testimonyStatusEnumSchema = z.enum([
  "PENDING",
  "PUBLISHED",
  "REJECTED",
  "ARCHIVED",
]);

export const testimonyListQuerySchema = paginationQuerySchema.extend({
  status: testimonyStatusEnumSchema.optional(),
  isFeatured: z
    .enum(["true", "false"])
    .transform((val) => val === "true")
    .optional(),
});

export type TestimonyListQuery = z.infer<typeof testimonyListQuerySchema>;

/** Formulaire public de soumission de témoignage. */
export const publicSubmitTestimonySchema = z.object({
  content: z
    .string()
    .trim()
    .min(10, "Le témoignage doit contenir au moins 10 caractères")
    .max(5000, "Le témoignage ne peut pas dépasser 5000 caractères"),
  authorName: z.string().trim().max(120, "Le nom est trop long").nullish(),
  isAnonymous: z.boolean().default(false),
  photoMediaId: z.string().uuid("Identifiant de média invalide").nullish(),
  consent: z
    .boolean()
    .refine(
      (val) => val === true,
      "Le consentement aux conditions d'examen et de modération est obligatoire",
    ),
});

export type PublicSubmitTestimonyBody = z.infer<
  typeof publicSubmitTestimonySchema
>;

/** Création directe par un administrateur. */
export const createTestimonySchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Le contenu est requis")
    .max(5000),
  authorName: z.string().trim().max(120).nullish(),
  isAnonymous: z.boolean().default(false),
  status: testimonyStatusEnumSchema.default("PENDING"),
  isFeatured: z.boolean().default(false),
  photoMediaId: z.string().uuid("Identifiant de média invalide").nullish(),
  position: z.coerce.number().int().min(0).max(9999).optional(),
});

/** Mise à jour / correction par un modérateur. */
export const updateTestimonySchema = z
  .object({
    content: z.string().trim().min(1).max(5000).optional(),
    authorName: z.string().trim().max(120).nullish(),
    isAnonymous: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    photoMediaId: z.string().uuid().nullish(),
    adminNotes: z.string().trim().max(2000).nullish(),
    position: z.coerce.number().int().min(0).max(9999).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Aucun champ à mettre à jour",
  });

/** Changement d'état de modération explicite. */
export const updateTestimonyStatusSchema = z.object({
  status: testimonyStatusEnumSchema,
  adminNotes: z.string().trim().max(2000).nullish(),
});

/** Bascule de sélection Hero. */
export const setTestimonyFeaturedSchema = z.object({
  isFeatured: z.boolean(),
});

export type CreateTestimonyBody = z.infer<typeof createTestimonySchema>;
export type UpdateTestimonyBody = z.infer<typeof updateTestimonySchema>;
export type UpdateTestimonyStatusBody = z.infer<
  typeof updateTestimonyStatusSchema
>;
export type SetTestimonyFeaturedBody = z.infer<
  typeof setTestimonyFeaturedSchema
>;
