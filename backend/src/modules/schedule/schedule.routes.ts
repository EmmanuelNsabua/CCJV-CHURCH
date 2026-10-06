import { Router } from "express";
import type { AuthDependencies } from "@/presentation/middlewares/auth";
import { requireAnyAdmin } from "@/presentation/middlewares/auth";
import { validate } from "@/presentation/middlewares/validate";
import { emptyQuerySchema } from "@/shared/http/pagination";
import type { ScheduleService } from "./schedule.service";
import { createScheduleController } from "./schedule.controller";
import { scheduleCreateSchema, scheduleParamsSchema, scheduleUpdateSchema } from "./schedule.schema";

/**
 * Routes `/schedule`.
 * Lecture publique, écriture réservée à l'administration (cahier §8).
 */
export interface ScheduleRouterDeps {
  service: ScheduleService;
  authDeps: AuthDependencies;
}

export function createScheduleRouter(deps: ScheduleRouterDeps): Router {
  const router = Router();
  const controller = createScheduleController(deps.service);
  const admin = requireAnyAdmin(deps.authDeps, "ROLE_ADMIN");

  // Liste bornée, non paginée : **aucun** paramètre de requête n'est reconnu
  // (`docs/018` §6.1). La *query* est validée comme telle — `?limit=20` est
  // refusé en `VALIDATION_ERROR` plutôt qu'accepté puis ignoré.
  router.get("/", validate({ query: emptyQuerySchema }), controller.list);

  router.post(
    "/",
    ...admin,
    validate({ body: scheduleCreateSchema }),
    controller.create,
  );
  router.patch(
    "/:id",
    ...admin,
    validate({ params: scheduleParamsSchema, body: scheduleUpdateSchema }),
    controller.update,
  );
  router.delete(
    "/:id",
    ...admin,
    validate({ params: scheduleParamsSchema }),
    controller.remove,
  );

  return router;
}
