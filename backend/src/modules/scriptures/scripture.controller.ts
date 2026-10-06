import type { Request, Response } from "express";
import { validatedParams } from "@/presentation/middlewares/validate";
import { sendItem, sendNoContent } from "@/shared/http/respond";
import type { ScriptureService } from "./scripture.service";
import { toScriptureDto } from "./scripture.serializer";
import type { ScriptureCreateInput, ScriptureUpdateInput } from "./scripture.schema";

/**
 * Traduction HTTP des versets.
 *
 * Le controller lit les entrées **déjà validées**, appelle le service, sérialise
 * et répond : aucune règle métier, aucun `try/catch` — Express 5 propage le rejet
 * d'une fonction `async` vers le middleware d'erreur.
 */
export function createScriptureController(service: ScriptureService) {
  return {
    async list(_req: Request, res: Response): Promise<void> {
      const scriptures = await service.list();
      // Liste bornée et non paginée : pas de `meta` de pagination.
      sendItem(res, { data: scriptures.map(toScriptureDto) });
    },

    async get(req: Request, res: Response): Promise<void> {
      const { key } = validatedParams<{ key: string }>(req);
      const scripture = await service.getByKey(key);
      sendItem(res, toScriptureDto(scripture));
    },

    async create(req: Request, res: Response): Promise<void> {
      // Corps validé et remplacé par `validate({ body })` : la forme est garantie.
      const body = req.body as ScriptureCreateInput;
      const created = await service.create(body);
      sendItem(res, toScriptureDto(created), 201);
    },

    async update(req: Request, res: Response): Promise<void> {
      const { key } = validatedParams<{ key: string }>(req);
      const body = req.body as ScriptureUpdateInput;
      const updated = await service.update(key, body);
      sendItem(res, toScriptureDto(updated));
    },

    async remove(req: Request, res: Response): Promise<void> {
      const { key } = validatedParams<{ key: string }>(req);
      await service.remove(key);
      sendNoContent(res);
    },
  };
}

export type ScriptureController = ReturnType<typeof createScriptureController>;
