import type { CommunityFace } from "@/domain/entities";
import type {
  CommunityFaceInput,
  CommunityFaceRepository,
  ListOptions,
  ListResult,
} from "@/domain/repositories";
import { NotFoundError } from "@/shared/errors/app-error";

/**
 * Règles métier des visages de la communauté.
 * Aucun import d'Express ni de Drizzle.
 */
export class CommunityFaceService {
  constructor(private readonly faces: CommunityFaceRepository) {}

  list(options: ListOptions): Promise<ListResult<CommunityFace>> {
    return this.faces.list(options);
  }

  async get(id: string): Promise<CommunityFace> {
    const face = await this.faces.findById(id);
    if (!face) {
      throw new NotFoundError("COMMUNITY_FACE_NOT_FOUND", "Visage introuvable", { id });
    }
    return face;
  }

  create(input: CommunityFaceInput): Promise<CommunityFace> {
    return this.faces.create(input);
  }

  async update(id: string, input: Partial<CommunityFaceInput>): Promise<CommunityFace> {
    const updated = await this.faces.update(id, input);
    if (!updated) {
      throw new NotFoundError("COMMUNITY_FACE_NOT_FOUND", "Visage introuvable", { id });
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    const removed = await this.faces.remove(id);
    if (!removed) {
      throw new NotFoundError("COMMUNITY_FACE_NOT_FOUND", "Visage introuvable", { id });
    }
  }
}
