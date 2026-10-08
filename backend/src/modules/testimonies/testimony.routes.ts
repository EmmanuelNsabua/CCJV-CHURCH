import { Router } from "express";
import type { AuthDependencies } from "@/presentation/middlewares/auth";
import { requireAuthenticatedAdmin } from "@/presentation/middlewares/auth";
import { validate } from "@/presentation/middlewares/validate";
import { authorize, EditorialEntityPolicy } from "@/presentation/policies";
import { createTestimonyController } from "./testimony.controller";
import {
  createTestimonySchema,
  listQuerySchema,
  testimonyIdParamSchema,
  updateTestimonySchema,
} from "./testimony.schema";
import type { TestimonyService } from "./testimony.service";

export interface TestimonyRouterDeps {
  service: TestimonyService;
  authDeps: AuthDependencies;
}

/**
 * Routes `/api/v1/testimonies` : lecture publique, écriture administration.
 *
 * L'écriture suit l'ordre `authenticate → requireAdmin →
 * authorize(EditorialEntityPolicy, ACTION) → validate` (`docs/029` §4.2 : la
 * validation ne précède jamais l'autorisation).
 *
 * Les routes d'écriture sont gouvernées par `EditorialEntityPolicy` (`docs/029`
 * §4.6, P-11), qui **refuse tous les rôles**, `SUPER_ADMIN` compris : elle porte
 * la question ouverte `docs/029` Q-14 (« qui administre les entités éditoriales
 * déclarées persistantes par D-24 ? »), sans titulaire nommé par D-24. Le
 * `403 FORBIDDEN` opposé à `POST`, `PATCH` et `DELETE` est donc la réponse
 * attendue, et le motif du refus — référence de la question comprise — reste au
 * journal du serveur. Les routes de **lecture publique** (`GET /`, `GET /:id`)
 * ne portent aucune policy : elles servent le visiteur, sans identité
 * administrative à juger.
 */
export function createTestimonyRouter(deps: TestimonyRouterDeps): Router {
  const router = Router();
  const controller = createTestimonyController(deps.service);
  const admin = requireAuthenticatedAdmin(deps.authDeps);

  router.get("/", validate({ query: listQuerySchema }), controller.list);
  router.get("/:id", validate({ params: testimonyIdParamSchema }), controller.get);

  router.post(
    "/",
    ...admin,
    authorize(EditorialEntityPolicy, "CREATE"),
    validate({ body: createTestimonySchema }),
    controller.create,
  );
  router.patch(
    "/:id",
    ...admin,
    authorize(EditorialEntityPolicy, "UPDATE"),
    validate({ params: testimonyIdParamSchema, body: updateTestimonySchema }),
    controller.update,
  );
  router.delete(
    "/:id",
    ...admin,
    authorize(EditorialEntityPolicy, "DELETE"),
    validate({ params: testimonyIdParamSchema }),
    controller.remove,
  );

  return router;
}
