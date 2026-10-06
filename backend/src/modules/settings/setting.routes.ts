import { Router } from "express";
import type { AuthDependencies } from "@/presentation/middlewares/auth";
import { requireAnyAdmin } from "@/presentation/middlewares/auth";
import { validate } from "@/presentation/middlewares/validate";
import type { SettingService } from "./setting.service";
import { createSettingController } from "./setting.controller";
import { settingsPatchSchema } from "./setting.schema";

/**
 * Routes `/settings`.
 *
 * Une seule route publique (`GET`), une seule route d'administration (`PATCH`) :
 * c'est un document unique regroupant les scalaires et les liens sociaux, pas
 * une collection d'identifiants.
 */
export interface SettingRouterDeps {
  service: SettingService;
  authDeps: AuthDependencies;
}

export function createSettingRouter(deps: SettingRouterDeps): Router {
  const router = Router();
  const controller = createSettingController(deps.service);
  const admin = requireAnyAdmin(deps.authDeps, "ROLE_ADMIN");

  router.get("/", controller.get);

  router.patch("/", ...admin, validate({ body: settingsPatchSchema }), controller.update);

  return router;
}
