import type { Request, Response } from "express";
import {
  validatedParams,
  validatedQuery,
} from "@/presentation/middlewares/validate";
import { sendCollection, sendItem, sendNoContent } from "@/shared/http/respond";
import type { DepartmentService } from "./department.service";
import { toDepartmentDto } from "./department.serializer";
import type {
  CreateDepartmentBody,
  DepartmentIdOrSlugParams,
  DepartmentListQuery,
  UpdateDepartmentBody,
} from "./department.schema";

/**
 * Traduction HTTP ↔ service.
 *
 * Le controller **lit** les entrées validées, **appelle** le service,
 * **sérialise** et **répond** — rien d'autre (IMPLEMENTATION_SPEC §5).
 *
 * Aucun `try/catch` : Express 5 propage automatiquement le rejet d'une fonction
 * `async` vers le middleware d'erreur, qui est seul à construire une réponse
 * d'erreur.
 */
export function createDepartmentController(service: DepartmentService) {
  return {
    /** `GET /` — collection paginée, lecture publique. */
    async list(req: Request, res: Response): Promise<void> {
      const { page, limit } = validatedQuery<DepartmentListQuery>(req);
      const { items, total } = await service.list({ page, limit });

      sendCollection(res, items.map(toDepartmentDto), page, limit, total);
    },

    /** `GET /:idOrSlug` — ressource individuelle, lecture publique. */
    async get(req: Request, res: Response): Promise<void> {
      const { idOrSlug } = validatedParams<DepartmentIdOrSlugParams>(req);

      sendItem(res, toDepartmentDto(await service.get(idOrSlug)));
    },

    /** `POST /` — administration : création. */
    async create(req: Request, res: Response): Promise<void> {
      // `validate` a remplacé `req.body` par la valeur validée : la lecture est
      // sûre, seule l'annotation de type est nécessaire.
      const body = req.body as CreateDepartmentBody;

      sendItem(res, toDepartmentDto(await service.create(body)), 201);
    },

    /** `PATCH /:idOrSlug` — administration : mise à jour partielle. */
    async update(req: Request, res: Response): Promise<void> {
      const { idOrSlug } = validatedParams<DepartmentIdOrSlugParams>(req);
      const body = req.body as UpdateDepartmentBody;

      sendItem(res, toDepartmentDto(await service.update(idOrSlug, body)));
    },

    /** `POST /:idOrSlug/archive` — administration : archivage explicite. */
    async archive(req: Request, res: Response): Promise<void> {
      const { idOrSlug } = validatedParams<DepartmentIdOrSlugParams>(req);
      const user = (req as unknown as { user?: { id?: string } }).user;
      const body = req.body as { reason?: string | null };

      const archived = await service.archive(idOrSlug, {
        archivedBy: user?.id ?? null,
        reason: body?.reason ?? null,
      });

      sendItem(res, archived, 200);
    },

    /** `DELETE /:idOrSlug` — administration : archivage préalable puis suppression. */
    async remove(req: Request, res: Response): Promise<void> {
      const { idOrSlug } = validatedParams<DepartmentIdOrSlugParams>(req);
      const user = (req as unknown as { user?: { id?: string } }).user;
      const body = req.body as { reason?: string | null } | undefined;

      await service.archive(idOrSlug, {
        archivedBy: user?.id ?? null,
        reason: body?.reason ?? "Suppression administrative",
      });
      sendNoContent(res);
    },
  };
}
