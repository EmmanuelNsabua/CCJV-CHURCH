import type { ScheduleEntry } from "@/domain/entities";
import type { ScheduleEntryInput, ScheduleRepository } from "@/domain/repositories";
import { NotFoundError } from "@/shared/errors/app-error";

/**
 * Règles métier du rythme hebdomadaire.
 *
 * L'ordre d'affichage est celui rendu par le repository (`position` croissant) :
 * le service ne réordonne rien, il ne fait que garantir l'existence de la
 * ressource avant écriture.
 */
export class ScheduleService {
  constructor(private readonly schedule: ScheduleRepository) {}

  async list(): Promise<ScheduleEntry[]> {
    return this.schedule.list();
  }

  async create(input: ScheduleEntryInput): Promise<ScheduleEntry> {
    return this.schedule.create(input);
  }

  async update(id: string, input: Partial<ScheduleEntryInput>): Promise<ScheduleEntry> {
    const updated = await this.schedule.update(id, input);
    if (!updated) {
      throw new NotFoundError(
        "SCHEDULE_ENTRY_NOT_FOUND",
        "Aucune entrée d'horaire ne correspond à cet identifiant",
        { id },
      );
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    const removed = await this.schedule.remove(id);
    if (!removed) {
      throw new NotFoundError(
        "SCHEDULE_ENTRY_NOT_FOUND",
        "Aucune entrée d'horaire ne correspond à cet identifiant",
        { id },
      );
    }
  }
}
