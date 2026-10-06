import { Router } from "express";
import type { AuthDependencies } from "@/presentation/middlewares/auth";
import {
  authenticate,
  requireAdmin,
  requireAnyAdmin,
} from "@/presentation/middlewares/auth";
import { validate } from "@/presentation/middlewares/validate";
import { listAdminProfilesQuerySchema } from "./admin.schema";
import { createAdminController } from "./admin.controller";
import type { AdminService } from "./admin.service";

/**
 * Routes d'administration.
 *
 * Aucune route de ce module n'est publique. Deux niveaux sont distingués :
 *
 * - `GET /admin/me` exige seulement d'être un administrateur **actif** (sans
 *   rôle supplémentaire) : c'est l'appel par lequel l'interface sait qui est
 *   connecté. On n'utilise pas `requireAnyAdmin` ici : cette fabrique termine
 *   par `requireRole`, qui refuserait un appel sans rôle exigé.
 * - `GET /admin/profiles` expose l'annuaire administratif : administration au
 *   sens plein, donc `requireAnyAdmin(authDeps, "ROLE_ADMIN")`.
 *
 * Ordre imposé : `authenticate` → `requireAdmin` → `requireRole` → `validate`
 * (`IMPLEMENTATION_SPEC` §6.2). La validation d'une route protégée ne précède
 * jamais son authentification.
 */

export interface AdminRouterDeps {
  service: AdminService;
  authDeps: AuthDependencies;
}

export function createAdminRouter(deps: AdminRouterDeps): Router {
  const router = Router();
  const controller = createAdminController(deps.service);

  /** Administrateur actif : profil chargé et compte non désactivé. */
  const activeAdmin = [authenticate(), requireAdmin(deps.authDeps)];

  /** Administration : administrateur actif titulaire du rôle applicatif. */
  const administration = requireAnyAdmin(deps.authDeps, "ROLE_ADMIN");

  router.get("/me", ...activeAdmin, controller.me);

  router.get(
    "/profiles",
    ...administration,
    validate({ query: listAdminProfilesQuerySchema }),
    controller.listProfiles,
  );

  return router;
}
