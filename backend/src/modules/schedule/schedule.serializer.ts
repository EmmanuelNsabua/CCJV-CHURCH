import type { ScheduleEntry } from "@/domain/entities";

/**
 * Représentation API d'une entrée du rythme hebdomadaire.
 *
 * Le frontend consomme `day`, `title`, `timeLabel`, `audience` et `isConfirmed`
 * (`data/mock/site.ts`, `weeklyRhythm`) : `isConfirmed` est une information de
 * confiance — elle distingue un horaire communiqué par CCJV d'un horaire encore
 * provisoire — et doit donc rester exposée.
 */
export interface ScheduleEntryDto {
  id: string;
  day: string;
  title: string;
  timeLabel: string;
  audience: string | null;
  isConfirmed: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export function toScheduleEntryDto(entry: ScheduleEntry): ScheduleEntryDto {
  return {
    id: entry.id,
    day: entry.day,
    title: entry.title,
    timeLabel: entry.timeLabel,
    audience: entry.audience,
    isConfirmed: entry.isConfirmed,
    position: entry.position,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  };
}
