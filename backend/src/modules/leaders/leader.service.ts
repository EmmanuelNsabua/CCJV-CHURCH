import type { Leader } from "@/domain/entities";
import type {
  LeaderInput,
  LeaderRepository,
  ListOptions,
  ListResult,
} from "@/domain/repositories";
import { NotFoundError } from "@/shared/errors/app-error";

/**
 * Règles métier des responsables.
 *
 * Aucune dépendance à Express ni à Drizzle : le service ne reçoit que le
 * contrat de repository, ce qui le rend testable sans base (`docs/004` §9).
 * Les entités qu'il manipule portent déjà leurs URL.
 */
export class LeaderService {
  constructor(private readonly leaders: LeaderRepository) {}

  list(options: ListOptions): Promise<ListResult<Leader>> {
    return this.leaders.list(options);
  }

  async get(id: string): Promise<Leader> {
    const leader = await this.leaders.findById(id);
    if (!leader) {
      throw new NotFoundError("LEADER_NOT_FOUND", "Responsable introuvable", { id });
    }
    return leader;
  }

  create(input: LeaderInput): Promise<Leader> {
    return this.leaders.create(input);
  }

  async update(id: string, input: Partial<LeaderInput>): Promise<Leader> {
    const updated = await this.leaders.update(id, input);
    if (!updated) {
      throw new NotFoundError("LEADER_NOT_FOUND", "Responsable introuvable", { id });
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    const removed = await this.leaders.remove(id);
    if (!removed) {
      throw new NotFoundError("LEADER_NOT_FOUND", "Responsable introuvable", { id });
    }
  }
}
