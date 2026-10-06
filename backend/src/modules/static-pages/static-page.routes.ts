import { Router } from "express";
import type { AuthDependencies } from "@/presentation/middlewares/auth";
import { requireAnyAdmin } from "@/presentation/middlewares/auth";
import { validate } from "@/presentation/middlewares/validate";
import type { StaticPageService } from "./static-page.service";
import { createStaticPageController } from "./static-page.controller";
import { pageContentUpdateSchema, pageParamsSchema } from "./static-page.schema";

/**
 * Routes `/pages`.
 *
 * Lecture publique, écriture réservée à l'administration. Le paramètre
 * `:pageKey` reste dans l'URL : c'est l'identifiant que le frontend connaît, et
 * il n'y a pas de collection à lister (l'énumération des clés éditables vient du
 * registre, pas de la base).
 */
export interface StaticPageRouterDeps {
  service: StaticPageService;
  authDeps: AuthDependencies;
}

export function createStaticPageRouter(deps: StaticPageRouterDeps): Router {
  const router = Router();
  const controller = createStaticPageController(deps.service);
  const admin = requireAnyAdmin(deps.authDeps, "ROLE_ADMIN");

  router.get("/:pageKey", validate({ params: pageParamsSchema }), controller.get);

  router.patch(
    "/:pageKey",
    ...admin,
    validate({ params: pageParamsSchema, body: pageContentUpdateSchema }),
    controller.update,
  );

  return router;
}
