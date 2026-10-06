import type { Request, Response } from "express";
import type { ListAdminProfilesQuery } from "./admin.schema";
import type { AdminService } from "./admin.service";
import {
  toAdminProfileDto,
  toAdminProfileSummaryDto,
} from "./admin.serializer";
import { validatedQuery } from "@/presentation/middlewares/validate";
import { sendCollection, sendItem } from "@/shared/http/respond";

/**
 * Contrôleurs HTTP de l'administration.
 *
 * Le contrôleur lit les entrées validées, appelle le service, sérialise et
 * répond. Aucun `try/catch` : Express 5 propage le rejet vers le middleware
 * d'erreur (`IMPLEMENTATION_SPEC` §5.3).
 */
export function createAdminController(service: AdminService) {
  return {
    /**
     * `GET /admin/me` — administrateur actif, sans rôle supplémentaire.
     *
     * Renvoie exactement `{ id, username, displayName, role }`. Le profil vient
     * de `req.admin`, chargé depuis `admin_profiles` par `requireAdmin` : un
     * compte absent ou désactivé n'atteint jamais ce controller.
     */
    me(req: Request, res: Response): void {
      sendItem(res, toAdminProfileDto(service.currentProfile(req.admin)));
    },

    /** `GET /admin/profiles` — administration : collection paginée. */
    async listProfiles(req: Request, res: Response): Promise<void> {
      const { page, limit } = validatedQuery<ListAdminProfilesQuery>(req);
      const { items, total } = await service.listProfiles({ page, limit });
      sendCollection(
        res,
        items.map(toAdminProfileSummaryDto),
        page,
        limit,
        total,
      );
    },
  };
}
