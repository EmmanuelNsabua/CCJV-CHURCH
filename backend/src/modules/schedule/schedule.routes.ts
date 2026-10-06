import { Router } from "express";
import type { AuthDependencies } from "@/presentation/middlewares/auth";
import { requireAnyAdmin } from "@/presentation/middlewares/auth";
import { validate } from "@/presentation/middlewares/validate";
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

  router.get("/", controller.list);

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
