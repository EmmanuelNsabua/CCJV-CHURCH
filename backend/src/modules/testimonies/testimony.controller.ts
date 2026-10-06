import type { Request, Response } from "express";
import { toOffset, type PaginationQuery } from "@/shared/http/pagination";
import { sendCollection, sendItem, sendNoContent } from "@/shared/http/respond";
import {
  validatedParams,
  validatedQuery,
} from "@/presentation/middlewares/validate";
import type { CreateTestimonyBody, UpdateTestimonyBody } from "./testimony.schema";
import type { TestimonyDto } from "./testimony.serializer";
import { toTestimonyDto } from "./testimony.serializer";
import type { TestimonyService } from "./testimony.service";

export interface TestimonyIdParams {
  id: string;
}

/** Controller : lit les données validées, appelle le service, sérialise. */
export function createTestimonyController(service: TestimonyService) {
  return {
    async list(req: Request, res: Response): Promise<void> {
      const { page, limit } = validatedQuery<PaginationQuery>(req);
      const { items, total } = await service.list({
        limit,
        offset: toOffset(page, limit),
      });
      sendCollection<TestimonyDto>(res, items.map(toTestimonyDto), page, limit, total);
    },

    async get(req: Request, res: Response): Promise<void> {
      const { id } = validatedParams<TestimonyIdParams>(req);
      sendItem(res, toTestimonyDto(await service.get(id)));
    },

    async create(req: Request, res: Response): Promise<void> {
      const body = req.body as CreateTestimonyBody;
      sendItem(res, toTestimonyDto(await service.create(body)), 201);
    },

    async update(req: Request, res: Response): Promise<void> {
      const { id } = validatedParams<TestimonyIdParams>(req);
      const body = req.body as UpdateTestimonyBody;
      sendItem(res, toTestimonyDto(await service.update(id, body)));
    },

    async remove(req: Request, res: Response): Promise<void> {
      const { id } = validatedParams<TestimonyIdParams>(req);
      await service.remove(id);
      sendNoContent(res);
    },
  };
}

export type TestimonyController = ReturnType<typeof createTestimonyController>;
