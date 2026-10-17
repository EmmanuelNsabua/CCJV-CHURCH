import type { Request, Response } from "express";
import {
  validatedParams,
  validatedQuery,
} from "@/presentation/middlewares/validate";
import { sendCollection, sendItem, sendNoContent } from "@/shared/http/respond";
import type { EventService } from "./event.service";
import { toEventDto } from "./event.serializer";
import type {
  CreateEventBody,
  EventIdOrSlugParams,
  EventListQuery,
  UpdateEventBody,
} from "./event.schema";

/**
 * Traduction HTTP ↔ service : lit les entrées validées, appelle le service,
 * sérialise, répond (IMPLEMENTATION_SPEC §5). Aucune règle métier, aucun
 * `try/catch` — Express 5 achemine seul un rejet `async` vers le middleware
 * d'erreur.
 */
export function createEventController(service: EventService) {
  return {
    /** `GET /` — collection paginée et filtrée, lecture publique. */
    async list(req: Request, res: Response): Promise<void> {
      const { page, limit, status, departmentId, sort } =
        validatedQuery<EventListQuery>(req);

      const { items, total } = await service.list({
        page,
        limit,
        status,
        departmentId,
        sort,
      });

      sendCollection(res, items.map(toEventDto), page, limit, total);
    },

    /** `GET /:idOrSlug` — ressource individuelle, lecture publique. */
    async get(req: Request, res: Response): Promise<void> {
      const { idOrSlug } = validatedParams<EventIdOrSlugParams>(req);

      sendItem(res, toEventDto(await service.get(idOrSlug)));
    },

    /** `POST /` — administration : création. */
    async create(req: Request, res: Response): Promise<void> {
      // `validate` a remplacé `req.body` par la valeur validée.
      const body = req.body as CreateEventBody;

      sendItem(res, toEventDto(await service.create(body)), 201);
    },

    /** `PATCH /:idOrSlug` — administration : mise à jour partielle. */
    async update(req: Request, res: Response): Promise<void> {
      const { idOrSlug } = validatedParams<EventIdOrSlugParams>(req);
      const body = req.body as UpdateEventBody;

      sendItem(res, toEventDto(await service.update(idOrSlug, body)));
    },

    /** `POST /:idOrSlug/publish` — administration : publication avec validations strictes. */
    async publish(req: Request, res: Response): Promise<void> {
      const { idOrSlug } = validatedParams<EventIdOrSlugParams>(req);
      sendItem(res, toEventDto(await service.publish(idOrSlug)));
    },

    /** `POST /:idOrSlug/revert-to-draft` — administration : repasse en brouillon avant modification. */
    async revertToDraft(req: Request, res: Response): Promise<void> {
      const { idOrSlug } = validatedParams<EventIdOrSlugParams>(req);
      sendItem(res, toEventDto(await service.revertToDraft(idOrSlug)));
    },

    /** `POST /:idOrSlug/cancel` — administration : annulation d'un événement. */
    async cancel(req: Request, res: Response): Promise<void> {
      const { idOrSlug } = validatedParams<EventIdOrSlugParams>(req);
      sendItem(res, toEventDto(await service.cancel(idOrSlug)));
    },

    /** `DELETE /:idOrSlug` — administration : suppression. */
    async remove(req: Request, res: Response): Promise<void> {
      const { idOrSlug } = validatedParams<EventIdOrSlugParams>(req);

      await service.remove(idOrSlug);
      sendNoContent(res);
    },
  };
}
