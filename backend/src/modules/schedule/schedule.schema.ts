import { z } from "zod";

/**
 * Entrées des routes `/schedule`.
 *
 * `timeLabel` est un **libellé libre** et non une heure : le rythme réel de la
 * communauté contient « 16h30 – 18h30 » et « Dans la nuit », qu'un type `time`
 * refuserait. Les longueurs reprennent celles des colonnes.
 */

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const scheduleParamsSchema = z.object({ id: z.uuid() });

export const scheduleCreateSchema = z
  .object({
    title: z.string().trim().min(1, "Le titre est obligatoire").max(120),
    day: z.string().trim().min(1).max(100).optional(),
    days: z.array(z.string().trim().min(1).max(30)).min(1).optional(),
    startTime: z.string().trim().regex(timeRegex, "Format d'heure de début invalide (HH:mm)").optional(),
    endTime: z.string().trim().regex(timeRegex, "Format d'heure de fin invalide (HH:mm)").nullish(),
    timeLabel: z.string().trim().min(1).max(60).optional(),
    timeZone: z.string().trim().max(80).default("Africa/Lubumbashi"),
    audience: z.string().trim().max(120).nullish(),
    isConfirmed: z.boolean().default(false),
    position: z.coerce.number().int().min(0).max(9999).default(0),
  })
  .superRefine((data, ctx) => {
    if (!data.day && (!data.days || data.days.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Au moins un jour ou libellé de jour est obligatoire",
        path: ["day"],
      });
    }

    if (!data.timeLabel && !data.startTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Une heure de début ou un libellé horaire est obligatoire",
        path: ["startTime"],
      });
    }

    if (data.startTime && data.endTime) {
      if (data.startTime >= data.endTime) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "L'heure de fin doit être postérieure à l'heure de début",
          path: ["endTime"],
        });
      }
    }
  })
  .transform((data) => {
    const computedDays = data.days && data.days.length > 0 ? data.days : data.day ? [data.day] : [];
    const computedDay = data.day || computedDays.join(", ");
    let computedTimeLabel = data.timeLabel;
    if (!computedTimeLabel && data.startTime) {
      const s = data.startTime.replace(":", "h");
      computedTimeLabel = data.endTime ? `${s} – ${data.endTime.replace(":", "h")}` : s;
    }

    return {
      title: data.title,
      day: computedDay,
      days: computedDays,
      timeLabel: computedTimeLabel || "",
      startTime: data.startTime || null,
      endTime: data.endTime || null,
      timeZone: data.timeZone || "Africa/Lubumbashi",
      audience: data.audience || null,
      isConfirmed: data.isConfirmed,
      position: data.position,
    };
  });

export const scheduleUpdateSchema = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
    day: z.string().trim().min(1).max(100).optional(),
    days: z.array(z.string().trim().min(1).max(30)).min(1).optional(),
    startTime: z.string().trim().regex(timeRegex, "Format d'heure de début invalide (HH:mm)").nullish(),
    endTime: z.string().trim().regex(timeRegex, "Format d'heure de fin invalide (HH:mm)").nullish(),
    timeLabel: z.string().trim().min(1).max(60).optional(),
    timeZone: z.string().trim().max(80).optional(),
    audience: z.string().trim().max(120).nullish(),
    isConfirmed: z.boolean().optional(),
    position: z.coerce.number().int().min(0).max(9999).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.startTime && data.endTime) {
      if (data.startTime >= data.endTime) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "L'heure de fin doit être postérieure à l'heure de début",
          path: ["endTime"],
        });
      }
    }
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Aucun champ à mettre à jour",
  })
  .transform((data) => {
    const res: Record<string, unknown> = { ...data };
    if (data.days && !data.day) {
      res.day = data.days.join(", ");
    } else if (data.day && !data.days) {
      res.days = [data.day];
    }

    if (data.startTime !== undefined || data.endTime !== undefined) {
      if (!data.timeLabel && data.startTime) {
        const s = data.startTime.replace(":", "h");
        res.timeLabel = data.endTime ? `${s} – ${data.endTime.replace(":", "h")}` : s;
      }
    }
    return res;
  });

export type ScheduleCreateInput = z.infer<typeof scheduleCreateSchema>;
export type ScheduleUpdateInput = z.infer<typeof scheduleUpdateSchema>;
