import type { Request, Response } from "express";
import type {
  AdminUserParams,
  CreateAdminUserBody,
  ListAdminProfilesQuery,
  SetAdminActivationBody,
  UpdateAdminAuthorizationBody,
} from "./admin.schema";
import type { AdminService } from "./admin.service";
import {
  toAdminProfileDto,
  toAdminProfileSummaryDto,
} from "./admin.serializer";
import { validatedParams, validatedQuery } from "@/presentation/middlewares/validate";
import { sendCollection, sendItem } from "@/shared/http/respond";

/**
 * Contrôleurs HTTP de l'administration.
 *
 * Le contrôleur lit les entrées validées, appelle le service, sérialise et
 * répond. Aucun `try/catch` : Express 5 propage le rejet vers le middleware
 * d'erreur (`IMPLEMENTATION_SPEC` §5.3).
 *
 * Aucune règle d'habilitation n'est écrite ici : le garde de route
 * (`authorize(UserPolicy, …)`) filtre le **type** d'action, et le service
 * tranche sur l'**instance** — notamment parce que « créer un compte » ne veut
 * pas dire la même chose selon le rôle demandé (`docs/028` D-04). Un contrôleur
 * qui inspecterait le rôle serait exactement l'`if (req.admin.role === …)` que
 * `docs/029` §4.2 interdit.
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

    /**
     * `POST /admin/users` — création d'un compte et de son habilitation.
     *
     * `201 Created` avec le profil créé, et **jamais** le mot de passe : ni
     * celui fourni par l'appelant, ni celui généré par le serveur. Un secret qui
     * repart dans une réponse circule une fois de plus sans utilité — la règle
     * appliquée au formulaire de prière vaut ici identiquement.
     */
    async createUser(req: Request, res: Response): Promise<void> {
      // `validate({ body })` a remplacé `req.body` par la valeur validée : le
      // transtypage est sûr par construction, et c'est la convention du dépôt.
      const body = req.body as CreateAdminUserBody;
      const profile = await service.createUser(req.admin, body);

      res.status(201).json(toAdminProfileSummaryDto(profile));
    },

    /** `PATCH /admin/users/:id/authorization` — rôle, périmètre, rattachement. */
    async updateAuthorization(req: Request, res: Response): Promise<void> {
      const { id } = validatedParams<AdminUserParams>(req);
      const body = req.body as UpdateAdminAuthorizationBody;
      const profile = await service.updateAuthorization(req.admin, id, body);

      sendItem(res, toAdminProfileSummaryDto(profile));
    },

    /** `PATCH /admin/users/:id/activation` — désactivation ou réactivation. */
    async setActivation(req: Request, res: Response): Promise<void> {
      const { id } = validatedParams<AdminUserParams>(req);
      const body = req.body as SetAdminActivationBody;
      const profile = await service.setActivation(req.admin, id, body);

      sendItem(res, toAdminProfileSummaryDto(profile));
    },
  };
}
