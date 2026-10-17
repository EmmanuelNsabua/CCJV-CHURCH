import type { Request, Response } from "express";
import {
  validatedParams,
  validatedQuery,
} from "@/presentation/middlewares/validate";
import { sendCollection, sendItem, sendNoContent } from "@/shared/http/respond";
import type { PublicationService } from "./publication.service";
import { toPublicationDto } from "./publication.serializer";
import type {
  CreatePublicationBody,
  PublicationIdOrSlugParams,
  PublicationListQuery,
  UpdatePublicationBody,
} from "./publication.schema";

/**
 * Traduction HTTP ↔ service (IMPLEMENTATION_SPEC §5).
 *
 * Les deux lectures publiques (`list`, `get`) ne transmettent **aucun** filtre
 * de statut : c'est le service qui force `PUBLISHED`. Le controller n'a donc
 * aucun moyen, même par erreur, de rendre un brouillon visible.
 */
export function createPublicationController(service: PublicationService) {
  return {
    /** `GET /` — collection paginée, filtrée et triée, lecture publique. */
    async list(req: Request, res: Response): Promise<void> {
      const { page, limit, type, category, sort } =
        validatedQuery<PublicationListQuery>(req);

      const { items, total } = await service.list({
        page,
        limit,
        type,
        category,
        sort,
      });

      sendCollection(res, items.map(toPublicationDto), page, limit, total);
    },

    /** `GET /:idOrSlug` — ressource publiée individuelle. */
    async get(req: Request, res: Response): Promise<void> {
      const { idOrSlug } = validatedParams<PublicationIdOrSlugParams>(req);

      sendItem(res, toPublicationDto(await service.get(idOrSlug)));
    },

    /** `GET /featured` — les 3 publications publiées les plus récentes. */
    async featured(_req: Request, res: Response): Promise<void> {
      const items = await service.listFeatured(3);
      sendItem(res, items.map(toPublicationDto));
    },

    /** `GET /archives` — archives publiques chronologiques. */
    async archives(req: Request, res: Response): Promise<void> {
      const { page, limit, type, category, sort } =
        validatedQuery<PublicationListQuery>(req);

      const { items, total } = await service.listArchives({
        page,
        limit,
        type,
        category,
        sort,
      });

      sendCollection(res, items.map(toPublicationDto), page, limit, total);
    },

    /** `POST /:idOrSlug/publish` — publication directe ou republication. */
    async publish(req: Request, res: Response): Promise<void> {
      const { idOrSlug } = validatedParams<PublicationIdOrSlugParams>(req);
      const publication = await service.publish(idOrSlug);
      sendItem(res, toPublicationDto(publication));
    },

    /** `POST /:idOrSlug/revert-to-draft` — repasse en brouillon avant modification. */
    async revertToDraft(req: Request, res: Response): Promise<void> {
      const { idOrSlug } = validatedParams<PublicationIdOrSlugParams>(req);
      const publication = await service.revertToDraft(idOrSlug);
      sendItem(res, toPublicationDto(publication));
    },

    /** `POST /` — administration : création (brouillon possible). */
    async create(req: Request, res: Response): Promise<void> {
      const body = req.body as CreatePublicationBody;

      sendItem(res, toPublicationDto(await service.create(body)), 201);
    },

    /** `PATCH /:idOrSlug` — administration : mise à jour, brouillons compris. */
    async update(req: Request, res: Response): Promise<void> {
      const { idOrSlug } = validatedParams<PublicationIdOrSlugParams>(req);
      const body = req.body as UpdatePublicationBody;

      sendItem(res, toPublicationDto(await service.update(idOrSlug, body)));
    },

    /** `DELETE /:idOrSlug` — administration : suppression. */
    async remove(req: Request, res: Response): Promise<void> {
      const { idOrSlug } = validatedParams<PublicationIdOrSlugParams>(req);

      await service.remove(idOrSlug);
      sendNoContent(res);
    },
  };
}
