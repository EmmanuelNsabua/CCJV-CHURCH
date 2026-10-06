import { Router } from "express";
import type { AuthDependencies } from "@/presentation/middlewares/auth";
import { requireAnyAdmin } from "@/presentation/middlewares/auth";
import { validate } from "@/presentation/middlewares/validate";
import { createLeaderController } from "./leader.controller";
import {
  createLeaderSchema,
  leaderIdParamSchema,
  listQuerySchema,
  updateLeaderSchema,
} from "./leader.schema";
import type { LeaderService } from "./leader.service";

export interface LeaderRouterDeps {
  service: LeaderService;
  authDeps: AuthDependencies;
}

/**
 * Routes `/api/v1/leaders`.
 *
 * Le préfixe `/api/v1` est ajouté au montage (`app.ts`), jamais ici. Lecture
 * publique ; écriture réservée à l'administration, avec l'ordre
 * `authenticate → requireAdmin → requireRole → validate`
 * (`IMPLEMENTATION_SPEC.md` §6).
 */
export function createLeaderRouter(deps: LeaderRouterDeps): Router {
  const router = Router();
  const controller = createLeaderController(deps.service);
  const admin = requireAnyAdmin(deps.authDeps, "ROLE_ADMIN");

  router.get("/", validate({ query: listQuerySchema }), controller.list);
  router.get("/:id", validate({ params: leaderIdParamSchema }), controller.get);

  router.post("/", ...admin, validate({ body: createLeaderSchema }), controller.create);
  router.patch(
    "/:id",
    ...admin,
    validate({ params: leaderIdParamSchema, body: updateLeaderSchema }),
    controller.update,
  );
  router.delete(
    "/:id",
    ...admin,
    validate({ params: leaderIdParamSchema }),
    controller.remove,
  );

  return router;
}
