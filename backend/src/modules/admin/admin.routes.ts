import { Router } from "express";
import type { AuthDependencies } from "@/presentation/middlewares/auth";
import { requireAuthenticatedAdmin } from "@/presentation/middlewares/auth";
import { authorize, UserPolicy } from "@/presentation/policies";
import { validate } from "@/presentation/middlewares/validate";
import {
  adminUserParamsSchema,
  createAdminUserSchema,
  listAdminProfilesQuerySchema,
  setAdminActivationSchema,
  updateAdminAuthorizationSchema,
} from "./admin.schema";
import { createAdminController } from "./admin.controller";
import type { AdminService } from "./admin.service";

/**
 * Routes d'administration.
 *
 * Aucune route de ce module n'est publique. Trois niveaux sont distingués :
 *
 * - `GET /admin/me` exige seulement d'être un administrateur **actif** : c'est
 *   l'appel par lequel l'interface sait qui est connecté. Aucune policy ne le
 *   gouverne : il ne vise aucune ressource, il rend le profil que la chaîne
 *   d'accès vient de charger.
 * - `GET /admin/profiles` expose l'annuaire administratif : son action est jugée
 *   par `authorize(UserPolicy, "READ")` — cellule 1.4, ouverte pour l'`ADMIN`
 *   (Q-02), donc refusée à lui.
 * - `POST /admin/users` et les deux `PATCH` gèrent les **comptes**, et ce sont
 *   les seules routes de l'API dont la décision dépend de la **cible**. Le garde
 *   ci-dessous filtre donc le type d'action, et le service tranche sur
 *   l'instance (`docs/029` §4.2, deux temps et une seule policy).
 *
 * **Aucune route ne supprime un compte.** `docs/028` D-03 ne connaît que la
 * désactivation et la révocation, `docs/029` cellule 1.8 laisse la suppression
 * physique en `?` (Q-24) et `UserPolicy.DELETE` la refuse à tout le monde. Une
 * route absente est ici plus sûre qu'une route refusante : il n'y a rien à
 * oublier de vérifier.
 *
 * Ordre imposé : `authenticate` → `requireAdmin` →
 * `authorize(UserPolicy, ACTION)` → `validate` (`IMPLEMENTATION_SPEC` §6.2). La
 * validation d'une route protégée ne précède jamais son authentification.
 */

export interface AdminRouterDeps {
  service: AdminService;
  authDeps: AuthDependencies;
}

export function createAdminRouter(deps: AdminRouterDeps): Router {
  const router = Router();
  const controller = createAdminController(deps.service);

  /** Administrateur actif : profil chargé et compte non désactivé. */
  const admin = requireAuthenticatedAdmin(deps.authDeps);

  router.get("/me", ...admin, controller.me);

  router.get(
    "/profiles",
    ...admin,
    authorize(UserPolicy, "READ"),
    validate({ query: listAdminProfilesQuerySchema }),
    controller.listProfiles,
  );

  /*
   * Le garde de création monte l'action `CREATE` — celle du responsable, la
   * seule que l'`ADMIN` détient (D-04). Ce n'est pas un relâchement : un
   * `ADMIN` qui demanderait un compte `ADMIN` ou `SUPER_ADMIN` franchit ce
   * garde puis est **refusé par le service** avec un `403`, sur la même policy
   * et sur la cible réellement demandée. Le second temps est indispensable ici,
   * parce que l'action dépend du corps de la requête — le garde, qui ne lit
   * jamais le corps, ne peut pas la connaître.
   */
  router.post(
    "/users",
    ...admin,
    authorize(UserPolicy, "CREATE"),
    validate({ body: createAdminUserSchema }),
    controller.createUser,
  );

  router.patch(
    "/users/:id/authorization",
    ...admin,
    authorize(UserPolicy, "UPDATE_ROLE_SCOPE"),
    validate({
      params: adminUserParamsSchema,
      body: updateAdminAuthorizationSchema,
    }),
    controller.updateAuthorization,
  );

  /*
   * Activation et désactivation partagent **une seule** action (`DEACTIVATE`) :
   * `docs/029` cellule 1.6 ne connaît qu'un droit, et une route par direction
   * laisserait croire à deux. `isActive` porte le sens dans le corps.
   */
  router.patch(
    "/users/:id/activation",
    ...admin,
    authorize(UserPolicy, "DEACTIVATE"),
    validate({ params: adminUserParamsSchema, body: setAdminActivationSchema }),
    controller.setActivation,
  );

  return router;
}
