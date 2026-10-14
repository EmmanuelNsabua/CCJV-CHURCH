import { z } from "zod";
import { paginationQuerySchema } from "@/shared/http/pagination";

export const teachingIdParamSchema = z.object({
  id: z.string().uuid("Identifiant UUID invalide"),
});

export const teachingIdOrSlugParamSchema = z.object({
  id: z.string().trim().min(1, "Identifiant ou slug requis"),
});

export const teachingStatusSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);

export const teachingListQuerySchema = paginationQuerySchema.extend({
  status: teachingStatusSchema.optional(),
  search: z.string().trim().optional(),
});

export type TeachingListQuery = z.infer<typeof teachingListQuerySchema>;

export const createTeachingBodySchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Le titre est obligatoire")
    .max(200, "Le titre ne doit pas dépasser 200 caractères"),
  slug: z.string().trim().max(220).optional(),
  speakerName: z
    .string()
    .trim()
    .min(1, "Le nom de l'orateur est obligatoire")
    .max(150, "Le nom de l'orateur ne doit pas dépasser 150 caractères"),
  preachedAt: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (AAAA-MM-JJ attendu)"),
  summary: z.string().trim().max(1000).optional().nullable(),
  description: z.string().trim().optional().nullable(),
  status: teachingStatusSchema.optional(),
});

export type CreateTeachingBody = z.infer<typeof createTeachingBodySchema>;

export const updateTeachingBodySchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  slug: z.string().trim().max(220).optional(),
  speakerName: z.string().trim().min(1).max(150).optional(),
  preachedAt: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (AAAA-MM-JJ attendu)")
    .optional(),
  summary: z.string().trim().max(1000).optional().nullable(),
  description: z.string().trim().optional().nullable(),
  status: teachingStatusSchema.optional(),
});

export type UpdateTeachingBody = z.infer<typeof updateTeachingBodySchema>;

export const biblicalReferenceItemSchema = z.object({
  book: z
    .string()
    .trim()
    .min(1, "Le livre ne peut pas être vide")
    .max(100),
  startChapter: z
    .number()
    .int()
    .positive("Le chapitre de début doit être supérieur à 0"),
  startVerse: z
    .number()
    .int()
    .positive("Le verset de début doit être supérieur à 0"),
  endChapter: z.number().int().positive().optional().nullable(),
  endVerse: z.number().int().positive().optional().nullable(),
  position: z.number().int().optional(),
});

export const updateBiblicalReferencesBodySchema = z.object({
  references: z.array(biblicalReferenceItemSchema),
});

export type UpdateBiblicalReferencesBody = z.infer<
  typeof updateBiblicalReferencesBodySchema
>;

export const teachingMediaRoleSchema = z.enum(["VIDEO", "AUDIO", "THUMBNAIL"]);

export const teachingMediaItemSchema = z.object({
  mediaId: z.string().uuid("Identifiant de média invalide"),
  role: teachingMediaRoleSchema,
  isPrimary: z.boolean().optional().default(false),
  position: z.number().int().optional(),
});

export const updateTeachingMediasBodySchema = z.object({
  medias: z.array(teachingMediaItemSchema),
});

export type UpdateTeachingMediasBody = z.infer<
  typeof updateTeachingMediasBodySchema
>;
