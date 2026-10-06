import type { Request, Response } from "express";
import { validatedParams } from "@/presentation/middlewares/validate";
import { sendItem } from "@/shared/http/respond";
import type { StaticPageService } from "./static-page.service";
import { toStaticPageDto } from "./static-page.serializer";
import type { PageContentUpdateInput } from "./static-page.schema";

/**
 * Traduction HTTP des pages éditables.
 *
 * `updatedBy` vient du profil administratif attaché par `requireAdmin` : c'est
 * l'identité applicative, pas le contenu du corps de requête, qui est
 * enregistrée — un client ne peut donc pas falsifier l'auteur de la
 * modification.
 */
export function createStaticPageController(service: StaticPageService) {
  return {
    async get(req: Request, res: Response): Promise<void> {
      const { pageKey } = validatedParams<{ pageKey: string }>(req);
      const page = await service.getByKey(pageKey);
      sendItem(res, toStaticPageDto(page));
    },

    async update(req: Request, res: Response): Promise<void> {
      const { pageKey } = validatedParams<{ pageKey: string }>(req);
      const body = req.body as PageContentUpdateInput;
      const updatedBy = req.admin?.id ?? null;

      const page = await service.updateContent(pageKey, body.content, updatedBy);
      sendItem(res, toStaticPageDto(page));
    },
  };
}

export type StaticPageController = ReturnType<typeof createStaticPageController>;
