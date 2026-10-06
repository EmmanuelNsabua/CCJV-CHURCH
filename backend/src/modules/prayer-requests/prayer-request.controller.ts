import type { Request, Response } from "express";
import type {
  CreatePrayerRequestBody,
  ListPrayerRequestsQuery,
  PrayerRequestIdParams,
  UpdatePrayerRequestBody,
} from "./prayer-request.schema";
import type { PrayerRequestService } from "./prayer-request.service";
import {
  toPrayerRequestCreatedDto,
  toPrayerRequestDto,
} from "./prayer-request.serializer";
import {
  validatedParams,
  validatedQuery,
} from "@/presentation/middlewares/validate";
import { sendCollection, sendItem, sendNoContent } from "@/shared/http/respond";

/**
 * Contrôleurs HTTP des demandes de prière.
 *
 * Le contrôleur **lit** les entrées validées, **appelle** le service,
 * **sérialise** et **répond** — rien d'autre (`IMPLEMENTATION_SPEC` §5).
 *
 * Aucun `try/catch` : Express 5 propage automatiquement le rejet d'une fonction
 * `async` vers le middleware d'erreur, qui est le seul à construire une réponse
 * d'erreur.
 *
 * Les entrées ne sont jamais lues directement sur `req.params` / `req.query` :
 * elles passent par `validatedParams` / `validatedQuery`, c'est-à-dire par les
 * valeurs effectivement validées par Zod.
 */
export function createPrayerRequestController(service: PrayerRequestService) {
  return {
    /**
     * `POST /prayer-requests` — **route publique**.
     *
     * Réponse `201` volontairement minimale (`id`, `createdAt`, `status`) : ni
     * le texte de l'intention, ni le prénom, ni le contact ne sont renvoyés. Le
     * client les connaît déjà, et les faire circuler une seconde fois
     * augmenterait sans besoin la surface d'exposition d'une donnée sensible.
     */
    async create(req: Request, res: Response): Promise<void> {
      const body = req.body as CreatePrayerRequestBody;
      const created = await service.submit(body);
      sendItem(res, toPrayerRequestCreatedDto(created), 201);
    },

    /** `GET /prayer-requests` — administration : collection paginée. */
    async list(req: Request, res: Response): Promise<void> {
      const { page, limit, status } = validatedQuery<ListPrayerRequestsQuery>(req);
      const { items, total } = await service.list({ page, limit, status });
      sendCollection(res, items.map(toPrayerRequestDto), page, limit, total);
    },

    /** `GET /prayer-requests/:id` — administration. */
    async get(req: Request, res: Response): Promise<void> {
      const { id } = validatedParams<PrayerRequestIdParams>(req);
      const found = await service.getById(id);
      sendItem(res, toPrayerRequestDto(found));
    },

    /**
     * `PATCH /prayer-requests/:id` — administration.
     *
     * Le corps est validé en amont (`{ status: "PRAYED" }` et rien d'autre) :
     * la seule transition supportée est `NEW → PRAYED`.
     */
    async update(req: Request, res: Response): Promise<void> {
      const { id } = validatedParams<PrayerRequestIdParams>(req);
      const { status } = req.body as UpdatePrayerRequestBody;
      const handled = await service.markPrayed(id, status);
      sendItem(res, toPrayerRequestDto(handled));
    },

    /** `DELETE /prayer-requests/:id` — administration. */
    async remove(req: Request, res: Response): Promise<void> {
      const { id } = validatedParams<PrayerRequestIdParams>(req);
      await service.remove(id);
      sendNoContent(res);
    },
  };
}
