import type { Request, Response } from "express";
import { toOffset, type PaginationQuery } from "@/shared/http/pagination";
import { sendCollection, sendItem, sendNoContent } from "@/shared/http/respond";
import { NotFoundError } from "@/shared/errors/app-error";
import {
  validatedParams,
  validatedQuery,
} from "@/presentation/middlewares/validate";
import type {
  CreateTestimonyBody,
  PublicSubmitTestimonyBody,
  SetTestimonyFeaturedBody,
  TestimonyListQuery,
  UpdateTestimonyBody,
  UpdateTestimonyStatusBody,
} from "./testimony.schema";
import type {
  AdminTestimonyDto,
  PublicTestimonyDto,
} from "./testimony.serializer";
import {
  toAdminTestimonyDto,
  toPublicTestimonyDto,
} from "./testimony.serializer";
import type { TestimonyService } from "./testimony.service";

export interface TestimonyIdParams {
  id: string;
}

/** Controller : lit les données validées, appelle le service, sérialise. */
export function createTestimonyController(service: TestimonyService) {
  return {
    /** GET /public — Galerie publique des témoignages validés. */
    async listPublic(req: Request, res: Response): Promise<void> {
      const { page, limit } = validatedQuery<PaginationQuery>(req);
      const { items, total } = await service.listPublic({
        limit,
        offset: toOffset(page, limit),
      });
      sendCollection<PublicTestimonyDto>(
        res,
        items.map(toPublicTestimonyDto),
        page,
        limit,
        total,
      );
    },

    /** GET /hero — Sélection éditoriale pour la section Hero (anonymat garanti). */
    async listHero(req: Request, res: Response): Promise<void> {
      const items = await service.listHeroFeatured(3);
      sendItem(res, items.map(toPublicTestimonyDto));
    },

    /** POST /submit — Soumission publique d'un visiteur. */
    async submitPublic(req: Request, res: Response): Promise<void> {
      const body = req.body as PublicSubmitTestimonyBody;
      const created = await service.submitPublic(body);
      sendItem(res, toPublicTestimonyDto(created), 201);
    },

    /** GET / — Boîte de réception administration avec filtres de statut. */
    async list(req: Request, res: Response): Promise<void> {
      const { page, limit, status, isFeatured } =
        validatedQuery<TestimonyListQuery>(req);

      const { items, total } = await service.list(
        {
          limit,
          offset: toOffset(page, limit),
        },
        { status, isFeatured },
      );
      sendCollection<AdminTestimonyDto>(
        res,
        items.map(toAdminTestimonyDto),
        page,
        limit,
        total,
      );
    },

    /** GET /:id — Consultation publique ou détaillée d'un témoignage. */
    async getPublic(req: Request, res: Response): Promise<void> {
      const { id } = validatedParams<TestimonyIdParams>(req);
      const testimony = await service.get(id);
      if (testimony.status !== "PUBLISHED") {
        throw new NotFoundError("TESTIMONY_NOT_FOUND", "Témoignage introuvable", { id });
      }
      sendItem(res, toPublicTestimonyDto(testimony));
    },

    /** GET /:id — Consultation détaillée d'un témoignage pour modération. */
    async get(req: Request, res: Response): Promise<void> {
      const { id } = validatedParams<TestimonyIdParams>(req);
      sendItem(res, toAdminTestimonyDto(await service.get(id)));
    },

    /** POST / — Création directe par un administrateur. */
    async create(req: Request, res: Response): Promise<void> {
      const body = req.body as CreateTestimonyBody;
      sendItem(res, toAdminTestimonyDto(await service.create(body)), 201);
    },

    /** PATCH /:id — Correction du texte ou mise à jour par l'administration. */
    async update(req: Request, res: Response): Promise<void> {
      const { id } = validatedParams<TestimonyIdParams>(req);
      const body = req.body as UpdateTestimonyBody;
      sendItem(res, toAdminTestimonyDto(await service.update(id, body)));
    },

    /** POST /:id/status — Changement d'état de modération (validé, rejeté, archivé, en attente). */
    async changeStatus(req: Request, res: Response): Promise<void> {
      const { id } = validatedParams<TestimonyIdParams>(req);
      const body = req.body as UpdateTestimonyStatusBody;
      const user = (req as unknown as { user?: { id?: string } }).user;

      const updated = await service.changeStatus(id, body.status, {
        reviewedBy: user?.id ?? null,
        adminNotes: body.adminNotes ?? null,
      });

      sendItem(res, toAdminTestimonyDto(updated));
    },

    /** POST /:id/hero — Bascule de sélection pour la section Hero. */
    async setFeatured(req: Request, res: Response): Promise<void> {
      const { id } = validatedParams<TestimonyIdParams>(req);
      const body = req.body as SetTestimonyFeaturedBody;

      const updated = await service.setFeatured(id, body.isFeatured);
      sendItem(res, toAdminTestimonyDto(updated));
    },

    /** DELETE /:id — Suppression définitive (protégée par confirmation). */
    async remove(req: Request, res: Response): Promise<void> {
      const { id } = validatedParams<TestimonyIdParams>(req);
      await service.remove(id);
      sendNoContent(res);
    },
  };
}

export type TestimonyController = ReturnType<typeof createTestimonyController>;
