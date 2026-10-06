import { z } from "zod";

/**
 * Entrées des routes `/schedule`.
 *
 * `timeLabel` est un **libellé libre** et non une heure : le rythme réel de la
 * communauté contient « 16h30 – 18h30 » et « Dans la nuit », qu'un type `time`
 * refuserait. Les longueurs reprennent celles des colonnes.
 */

export const scheduleParamsSchema = z.object({ id: z.uuid() });

export const scheduleCreateSchema = z.object({
  day: z.string().trim().min(1).max(20),
  title: z.string().trim().min(1).max(120),
  timeLabel: z.string().trim().min(1).max(60),
  audience: z.string().trim().max(120).nullish(),
  isConfirmed: z.boolean().default(false),
  position: z.coerce.number().int().min(0).max(9999).default(0),
});

export const scheduleUpdateSchema = scheduleCreateSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Aucun champ à mettre à jour",
  });

export type ScheduleCreateInput = z.infer<typeof scheduleCreateSchema>;
export type ScheduleUpdateInput = z.infer<typeof scheduleUpdateSchema>;
