import { Router } from "express";
import type { AuthDependencies } from "@/presentation/middlewares/auth";
import { requireAnyAdmin } from "@/presentation/middlewares/auth";
import { validate } from "@/presentation/middlewares/validate";
import type { ScriptureService } from "./scripture.service";
import { createScriptureController } from "./scripture.controller";
import {
  scriptureCreateSchema,
  scriptureParamsSchema,
  scriptureUpdateSchema,
} from "./scripture.schema";

/**
 * Routes `/scriptures`.
 *
 * Lecture publique, écriture réservée à l'administration (cahier §8). Ordre des
 * middlewares d'écriture : `authenticate` → `requireAdmin` → `requireRole` →
 * `validate` — jamais de validation avant authentification (`docs/018` §6).
 */
export interface ScriptureRouterDeps {
  service: ScriptureService;
  authDeps: AuthDependencies;
}

export function createScriptureRouter(deps: ScriptureRouterDeps): Router {
  const router = Router();
  const controller = createScriptureController(deps.service);
  const admin = requireAnyAdmin(deps.authDeps, "ROLE_ADMIN");

  router.get("/", controller.list);
  router.get("/:key", validate({ params: scriptureParamsSchema }), controller.get);

  router.post(
    "/",
    ...admin,
    validate({ body: scriptureCreateSchema }),
    controller.create,
  );
  router.patch(
    "/:key",
    ...admin,
    validate({ params: scriptureParamsSchema, body: scriptureUpdateSchema }),
    controller.update,
  );
  router.delete(
    "/:key",
    ...admin,
    validate({ params: scriptureParamsSchema }),
    controller.remove,
  );

  return router;
}
