import type { Request, Response } from "express";
import type {
  AdminUserParams,
  CreateAdminUserBody,
  ListAdminProfilesQuery,
  SetAdminActivationBody,
  SetAdminPasswordBody,
  UpdateAdminAuthorizationBody,
  UpdateAdminIdentityBody,
} from "./admin.schema";
import type { AdminService } from "./admin.service";
import {
  toAdminProfileDto,
  toAdminProfileSummaryDto,
} from "./admin.serializer";
import { validatedParams, validatedQuery } from "@/presentation/middlewares/validate";
import { sendCollection, sendItem, sendNoContent } from "@/shared/http/respond";

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

      /*
       * L'adresse de connexion vient du fournisseur d'identité, et seulement
       * pour les profils de **cette** page : on ne lit pas un annuaire entier
       * pour en afficher vingt. Une adresse non résolue reste `null` — la
       * colonne est alors vide, ce qui est exact.
       */
      const emails = await service.findEmails(items);

      sendCollection(
        res,
        items.map((profile) => toAdminProfileSummaryDto(profile, emails.get(profile.id) ?? null)),
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

    /**
     * `PATCH /admin/users/:id/identity` — nom d'utilisateur, nom affiché,
     * adresse de connexion.
     *
     * La réponse ne contient **aucune** donnée d'authentification au-delà de
     * l'adresse, quand elle vient d'être écrite : ni mot de passe, ni jeton.
     */
    async updateIdentity(req: Request, res: Response): Promise<void> {
      const { id } = validatedParams<AdminUserParams>(req);
      const body = req.body as UpdateAdminIdentityBody;
      const profile = await service.updateIdentity(req.admin, id, body);

      sendItem(res, toAdminProfileSummaryDto(profile, body.email ?? null));
    },

    /**
     * `PATCH /admin/users/:id/password` — réinitialisation administrative.
     *
     * `204` **sans corps** : il n'y a rien à renvoyer. Un mot de passe ne
     * revient jamais par l'API, ni celui saisi, ni un éventuel mot de passe
     * généré.
     */
    async setPassword(req: Request, res: Response): Promise<void> {
      const { id } = validatedParams<AdminUserParams>(req);
      const body = req.body as SetAdminPasswordBody;
      await service.setPassword(req.admin, id, body);

      sendNoContent(res);
    },

    /**
     * `PATCH /admin/me/password` — changement de son **propre** mot de passe.
     *
     * Aucun identifiant reçu : la cible est l'identité du jeton. `204` sans
     * corps, pour la même raison qu'au-dessus.
     */
    async changeOwnPassword(req: Request, res: Response): Promise<void> {
      const body = req.body as SetAdminPasswordBody;
      await service.changeOwnPassword(req.admin, body);

      sendNoContent(res);
    },

    /**
     * `DELETE /admin/users/:id` — suppression **définitive** d'un compte
     * (`SUPER_ADMIN` uniquement, arbitrage du commanditaire).
     *
     * `204` sans corps. Un `409` signale un compte encore auteur de droits
     * d'accès média : la base refuse la suppression, et la réponse le dit au lieu
     * de la présenter comme une panne.
     */
    async remove(req: Request, res: Response): Promise<void> {
      const { id } = validatedParams<AdminUserParams>(req);
      await service.deleteUser(req.admin, id);

      sendNoContent(res);
    },
  };
}
