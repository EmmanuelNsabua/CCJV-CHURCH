import type { Request, Response } from "express";
import { validatedParams } from "@/presentation/middlewares/validate";
import { sendItem, sendNoContent } from "@/shared/http/respond";
import type { ScheduleService } from "./schedule.service";
import { toScheduleEntryDto } from "./schedule.serializer";
import type { ScheduleCreateInput, ScheduleUpdateInput } from "./schedule.schema";

/**
 * Traduction HTTP du rythme hebdomadaire.
 * Aucune règle métier ici : lecture, appel du service, sérialisation, réponse.
 */
export function createScheduleController(service: ScheduleService) {
  return {
    async list(_req: Request, res: Response): Promise<void> {
      const entries = await service.list();
      // Liste bornée et ordonnée par `position` : pas de pagination.
      sendItem(res, { data: entries.map(toScheduleEntryDto) });
    },

    async create(req: Request, res: Response): Promise<void> {
      const body = req.body as ScheduleCreateInput;
      const created = await service.create(body);
      sendItem(res, toScheduleEntryDto(created), 201);
    },

    async update(req: Request, res: Response): Promise<void> {
      const { id } = validatedParams<{ id: string }>(req);
      const body = req.body as ScheduleUpdateInput;
      const updated = await service.update(id, body);
      sendItem(res, toScheduleEntryDto(updated));
    },

    async remove(req: Request, res: Response): Promise<void> {
      const { id } = validatedParams<{ id: string }>(req);
      await service.remove(id);
      sendNoContent(res);
    },
  };
}

export type ScheduleController = ReturnType<typeof createScheduleController>;
