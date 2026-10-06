import type { Testimony } from "@/domain/entities";
import type {
  ListOptions,
  ListResult,
  TestimonyInput,
  TestimonyRepository,
} from "@/domain/repositories";
import { NotFoundError } from "@/shared/errors/app-error";

/**
 * Règles métier des témoignages.
 * Aucun import d'Express : le service lève des erreurs du domaine.
 */
export class TestimonyService {
  constructor(private readonly testimonies: TestimonyRepository) {}

  list(options: ListOptions): Promise<ListResult<Testimony>> {
    return this.testimonies.list(options);
  }

  async get(id: string): Promise<Testimony> {
    const testimony = await this.testimonies.findById(id);
    if (!testimony) {
      throw new NotFoundError("TESTIMONY_NOT_FOUND", "Témoignage introuvable", { id });
    }
    return testimony;
  }

  create(input: TestimonyInput): Promise<Testimony> {
    return this.testimonies.create(input);
  }

  async update(id: string, input: Partial<TestimonyInput>): Promise<Testimony> {
    const updated = await this.testimonies.update(id, input);
    if (!updated) {
      throw new NotFoundError("TESTIMONY_NOT_FOUND", "Témoignage introuvable", { id });
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    const removed = await this.testimonies.remove(id);
    if (!removed) {
      throw new NotFoundError("TESTIMONY_NOT_FOUND", "Témoignage introuvable", { id });
    }
  }
}
