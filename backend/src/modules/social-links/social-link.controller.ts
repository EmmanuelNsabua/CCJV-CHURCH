import type { Request, Response } from "express";
import { validatedParams } from "@/presentation/middlewares/validate";
import { sendItem, sendNoContent } from "@/shared/http/respond";
import type { SocialLinkService } from "./social-link.service";
import { toSocialLinkDto } from "./social-link.serializer";
import type { SocialLinkCreateInput, SocialLinkUpdateInput } from "./social-link.schema";

/**
 * Traduction HTTP des réseaux sociaux.
 * Lecture, appel du service, sérialisation, réponse : rien de plus.
 */
export function createSocialLinkController(service: SocialLinkService) {
  return {
    async list(_req: Request, res: Response): Promise<void> {
      const links = await service.list();
      // Liste ordonnée et bornée : pas de pagination.
      sendItem(res, { data: links.map(toSocialLinkDto) });
    },

    async create(req: Request, res: Response): Promise<void> {
      const body = req.body as SocialLinkCreateInput;
      const created = await service.create(body);
      sendItem(res, toSocialLinkDto(created), 201);
    },

    async update(req: Request, res: Response): Promise<void> {
      const { id } = validatedParams<{ id: string }>(req);
      const body = req.body as SocialLinkUpdateInput;
      const updated = await service.update(id, body);
      sendItem(res, toSocialLinkDto(updated));
    },

    async remove(req: Request, res: Response): Promise<void> {
      const { id } = validatedParams<{ id: string }>(req);
      await service.remove(id);
      sendNoContent(res);
    },
  };
}

export type SocialLinkController = ReturnType<typeof createSocialLinkController>;
