import type { SocialLink } from "@/domain/entities";
import type { SocialLinkInput, SocialLinkRepository } from "@/domain/repositories";
import { NotFoundError } from "@/shared/errors/app-error";

/**
 * Règles métier des réseaux sociaux.
 *
 * La validation de forme de `href` (URL `http`/`https`) est portée par Zod, côté
 * entrée : le service ne garantit ici que l'existence de la ressource avant
 * écriture.
 */
export class SocialLinkService {
  constructor(private readonly socialLinks: SocialLinkRepository) {}

  async list(): Promise<SocialLink[]> {
    return this.socialLinks.list();
  }

  async create(input: SocialLinkInput): Promise<SocialLink> {
    return this.socialLinks.create(input);
  }

  async update(id: string, input: Partial<SocialLinkInput>): Promise<SocialLink> {
    const updated = await this.socialLinks.update(id, input);
    if (!updated) {
      throw new NotFoundError(
        "SOCIAL_LINK_NOT_FOUND",
        "Aucun lien social ne correspond à cet identifiant",
        { id },
      );
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    const removed = await this.socialLinks.remove(id);
    if (!removed) {
      throw new NotFoundError(
        "SOCIAL_LINK_NOT_FOUND",
        "Aucun lien social ne correspond à cet identifiant",
        { id },
      );
    }
  }
}
