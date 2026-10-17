import type { Request, Response } from "express";
import { toOffset, type PaginationQuery } from "@/shared/http/pagination";
import { sendCollection, sendItem, sendNoContent } from "@/shared/http/respond";
import {
  validatedParams,
  validatedQuery,
} from "@/presentation/middlewares/validate";
import type { CreateLeaderBody, LeaderListQuery, UpdateLeaderBody } from "./leader.schema";
import type { LeaderDto } from "./leader.serializer";
import { toLeaderDto } from "./leader.serializer";
import type { LeaderService } from "./leader.service";

/** Paramètres validés par `leaderIdParamSchema`. */
export interface LeaderIdParams {
  id: string;
}

/**
 * Traduction HTTP → service → réponse.
 *
 * Aucune règle métier, aucun `try/catch` : Express 5 propage le rejet d'une
 * fonction `async` vers le middleware d'erreur (`IMPLEMENTATION_SPEC.md` §5).
 */
export function createLeaderController(service: LeaderService) {
  return {
    async list(req: Request, res: Response): Promise<void> {
      const { page, limit, departmentId } = validatedQuery<LeaderListQuery>(req);
      if (departmentId) {
        const items = await service.listByDepartment(departmentId);
        sendCollection<LeaderDto>(res, items.map(toLeaderDto), 1, Math.max(items.length, 1), items.length);
        return;
      }
      const { items, total } = await service.list({
        limit,
        offset: toOffset(page, limit),
      });
      sendCollection<LeaderDto>(res, items.map(toLeaderDto), page, limit, total);
    },

    async get(req: Request, res: Response): Promise<void> {
      const { id } = validatedParams<LeaderIdParams>(req);
      sendItem(res, toLeaderDto(await service.get(id)));
    },

    async create(req: Request, res: Response): Promise<void> {
      // `validate({ body })` a remplacé `req.body` par les données validées.
      const body = req.body as CreateLeaderBody;
      sendItem(res, toLeaderDto(await service.create(body)), 201);
    },

    async update(req: Request, res: Response): Promise<void> {
      const { id } = validatedParams<LeaderIdParams>(req);
      const body = req.body as UpdateLeaderBody;
      sendItem(res, toLeaderDto(await service.update(id, body)));
    },

    async remove(req: Request, res: Response): Promise<void> {
      const { id } = validatedParams<LeaderIdParams>(req);
      await service.remove(id);
      sendNoContent(res);
    },
  };
}

export type LeaderController = ReturnType<typeof createLeaderController>;
