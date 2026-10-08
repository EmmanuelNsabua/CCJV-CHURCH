import { Router } from "express";
import type { AuthDependencies } from "@/presentation/middlewares/auth";
import { requireAuthenticatedAdmin } from "@/presentation/middlewares/auth";
import { authorize, UserPolicy } from "@/presentation/policies";
import { validate } from "@/presentation/middlewares/validate";
import { listAdminProfilesQuerySchema } from "./admin.schema";
import { createAdminController } from "./admin.controller";
import type { AdminService } from "./admin.service";

/**
 * Routes d'administration.
 *
 * Aucune route de ce module n'est publique. Deux niveaux sont distingués :
 *
 * - `GET /admin/me` exige seulement d'être un administrateur **actif** : c'est
 *   l'appel par lequel l'interface sait qui est connecté. Aucune policy ne le
 *   gouverne : il ne vise aucune ressource, il rend le profil que la chaîne
 *   d'accès vient de charger.
 * - `GET /admin/profiles` expose l'annuaire administratif : son action est
 *   jugée par `authorize(UserPolicy, "READ")`.
 *
 * Les deux niveaux montent la **même** chaîne, construite en un seul point.
 * Ordre imposé : `authenticate` → `requireAdmin` →
 * `authorize(UserPolicy, "READ")` → `validate` (`IMPLEMENTATION_SPEC` §6.2). La
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

  return router;
}
