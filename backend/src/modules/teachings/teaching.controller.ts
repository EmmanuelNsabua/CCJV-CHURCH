import type { Request, Response } from "express";
import {
  validatedParams,
  validatedQuery,
} from "@/presentation/middlewares/validate";
import { sendCollection, sendItem, sendNoContent } from "@/shared/http/respond";
import type {
  CreateTeachingBody,
  TeachingListQuery,
  UpdateBiblicalReferencesBody,
  UpdateTeachingBody,
  UpdateTeachingMediasBody,
} from "./teaching.schema";
import {
  toBiblicalReferenceDto,
  toTeachingDto,
  toTeachingMediaDto,
  type TeachingDto,
} from "./teaching.serializer";
import type { TeachingService } from "./teaching.service";

export interface TeachingIdParams {
  id: string;
}

export function createTeachingController(service: TeachingService) {
  return {
    async list(req: Request, res: Response): Promise<void> {
      const query = validatedQuery<TeachingListQuery>(req);
      const page = query.page ?? 1;
      const limit = query.limit ?? 20;

      const { items, total } = await service.list(query, req.admin);
      sendCollection<TeachingDto>(
        res,
        items.map(toTeachingDto),
        page,
        limit,
        total,
      );
    },

    async get(req: Request, res: Response): Promise<void> {
      const { id } = validatedParams<TeachingIdParams>(req);
      const teaching = await service.get(id, req.admin);
      sendItem(res, toTeachingDto(teaching));
    },

    async create(req: Request, res: Response): Promise<void> {
      const body = req.body as CreateTeachingBody;
      const created = await service.create(body);
      sendItem(res, toTeachingDto(created), 201);
    },

    async update(req: Request, res: Response): Promise<void> {
      const { id } = validatedParams<TeachingIdParams>(req);
      const body = req.body as UpdateTeachingBody;
      const updated = await service.update(id, body);
      sendItem(res, toTeachingDto(updated));
    },

    async updateBiblicalReferences(
      req: Request,
      res: Response,
    ): Promise<void> {
      const { id } = validatedParams<TeachingIdParams>(req);
      const { references } = req.body as UpdateBiblicalReferencesBody;
      const updated = await service.updateBiblicalReferences(id, references);
      sendItem(res, updated.map(toBiblicalReferenceDto));
    },

    async updateMedias(req: Request, res: Response): Promise<void> {
      const { id } = validatedParams<TeachingIdParams>(req);
      const { medias } = req.body as UpdateTeachingMediasBody;
      const updated = await service.updateMedias(id, medias);
      sendItem(res, updated.map(toTeachingMediaDto));
    },

    async publish(req: Request, res: Response): Promise<void> {
      const { id } = validatedParams<TeachingIdParams>(req);
      const published = await service.publish(id);
      sendItem(res, toTeachingDto(published));
    },

    async archive(req: Request, res: Response): Promise<void> {
      const { id } = validatedParams<TeachingIdParams>(req);
      const archived = await service.archive(id);
      sendItem(res, toTeachingDto(archived));
    },

    async remove(req: Request, res: Response): Promise<void> {
      const { id } = validatedParams<TeachingIdParams>(req);
      await service.delete(id);
      sendNoContent(res);
    },
  };
}
