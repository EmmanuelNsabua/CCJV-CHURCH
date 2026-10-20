import type { Request, Response } from "express";
import {
  validatedParams,
  validatedQuery,
} from "@/presentation/middlewares/validate";
import { sendCollection, sendItem, sendNoContent } from "@/shared/http/respond";
import type {
  CreateResourceInput,
  ReplaceResourceFileInput,
  ResourceListQuery,
  UpdateResourceInput,
} from "./resource.schema";
import type { ResourceService } from "./resource.service";
import type { Resource } from "@/domain/entities";

export interface ResourceIdParams {
  id: string;
}

export function createResourceController(service: ResourceService) {
  return {
    async list(req: Request, res: Response): Promise<void> {
      const query = validatedQuery<ResourceListQuery>(req);
      const page = query.page ?? 1;
      const limit = query.limit ?? 20;

      const { items, total } = await service.list(query);
      sendCollection<Resource>(res, items, page, limit, total);
    },

    async get(req: Request, res: Response): Promise<void> {
      // `id` porte un UUID **ou** un slug : c'est `ResourceService.get` qui
      // distingue les deux formes.
      const { id } = validatedParams<ResourceIdParams>(req);
      const resource = await service.get(id);
      sendItem(res, resource);
    },

    async create(req: Request, res: Response): Promise<void> {
      const body = req.body as CreateResourceInput;
      const resource = await service.create(body);
      sendItem(res, resource, 201);
    },

    async update(req: Request, res: Response): Promise<void> {
      const { id } = validatedParams<ResourceIdParams>(req);
      const body = req.body as UpdateResourceInput;
      const resource = await service.update(id, body);
      sendItem(res, resource);
    },

    async replaceFile(req: Request, res: Response): Promise<void> {
      const { id } = validatedParams<ResourceIdParams>(req);
      const body = req.body as ReplaceResourceFileInput;
      const resource = await service.replaceFile(id, body);
      sendItem(res, resource);
    },

    async remove(req: Request, res: Response): Promise<void> {
      const { id } = validatedParams<ResourceIdParams>(req);
      await service.remove(id);
      sendNoContent(res);
    },
  };
}

export type ResourceController = ReturnType<typeof createResourceController>;
