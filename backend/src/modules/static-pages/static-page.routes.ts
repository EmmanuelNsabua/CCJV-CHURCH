import { Router } from "express";
import type { AuthDependencies } from "@/presentation/middlewares/auth";
import { requireAuthenticatedAdmin } from "@/presentation/middlewares/auth";
import { authorize, PagePolicy } from "@/presentation/policies";
import { validate } from "@/presentation/middlewares/validate";
import { emptyQuerySchema } from "@/shared/http/pagination";
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
 *
 * La lecture ne reconnaît **aucun** paramètre de requête : sa *query* est
 * validée par `emptyQuerySchema`, objet strict. Un `?nimportequoi=1` est donc
 * refusé en `400 VALIDATION_ERROR`, comme sur toutes les autres routes.
 *
 * Le `PATCH` monte la chaîne complète, dans l'ordre `authenticate` →
 * `requireAdmin` → `authorize(PagePolicy, "UPDATE")` → `validate` : le contenu
 * d'une page n'est jamais analysé avant que la policy ait statué.
 */
export interface StaticPageRouterDeps {
  service: StaticPageService;
  authDeps: AuthDependencies;
}

export function createStaticPageRouter(deps: StaticPageRouterDeps): Router {
  const router = Router();
  const controller = createStaticPageController(deps.service);
  const admin = requireAuthenticatedAdmin(deps.authDeps);

  router.get(
    "/:pageKey",
    validate({ params: pageParamsSchema, query: emptyQuerySchema }),
    controller.get,
  );

  router.patch(
    "/:pageKey",
    ...admin,
    authorize(PagePolicy, "UPDATE"),
    validate({ params: pageParamsSchema, body: pageContentUpdateSchema }),
    controller.update,
  );

  return router;
}
