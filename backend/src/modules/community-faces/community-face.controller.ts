import type { Request, Response } from "express";
import { toOffset, type PaginationQuery } from "@/shared/http/pagination";
import { sendCollection, sendItem, sendNoContent } from "@/shared/http/respond";
import {
  validatedParams,
  validatedQuery,
} from "@/presentation/middlewares/validate";
import type {
  CreateCommunityFaceBody,
  UpdateCommunityFaceBody,
} from "./community-face.schema";
import type { CommunityFaceDto } from "./community-face.serializer";
import { toCommunityFaceDto } from "./community-face.serializer";
import type { CommunityFaceService } from "./community-face.service";

export interface CommunityFaceIdParams {
  id: string;
}

/** Controller : lire, appeler, sérialiser, répondre. Rien de plus. */
export function createCommunityFaceController(service: CommunityFaceService) {
  return {
    async list(req: Request, res: Response): Promise<void> {
      const { page, limit } = validatedQuery<PaginationQuery>(req);
      const { items, total } = await service.list({
        limit,
        offset: toOffset(page, limit),
      });
      sendCollection<CommunityFaceDto>(
        res,
        items.map(toCommunityFaceDto),
        page,
        limit,
        total,
      );
    },

    async get(req: Request, res: Response): Promise<void> {
      const { id } = validatedParams<CommunityFaceIdParams>(req);
      sendItem(res, toCommunityFaceDto(await service.get(id)));
    },

    async create(req: Request, res: Response): Promise<void> {
      const body = req.body as CreateCommunityFaceBody;
      sendItem(res, toCommunityFaceDto(await service.create(body)), 201);
    },

    async update(req: Request, res: Response): Promise<void> {
      const { id } = validatedParams<CommunityFaceIdParams>(req);
      const body = req.body as UpdateCommunityFaceBody;
      sendItem(res, toCommunityFaceDto(await service.update(id, body)));
    },

    async remove(req: Request, res: Response): Promise<void> {
      const { id } = validatedParams<CommunityFaceIdParams>(req);
      await service.remove(id);
      sendNoContent(res);
    },
  };
}

export type CommunityFaceController = ReturnType<
  typeof createCommunityFaceController
>;
