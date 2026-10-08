import { Router } from "express";
import type { AuthDependencies } from "@/presentation/middlewares/auth";
import { requireAuthenticatedAdmin } from "@/presentation/middlewares/auth";
import { validate } from "@/presentation/middlewares/validate";
import { authorize, SchedulePolicy } from "@/presentation/policies";
import { emptyQuerySchema } from "@/shared/http/pagination";
import type { ScheduleService } from "./schedule.service";
import { createScheduleController } from "./schedule.controller";
import { scheduleCreateSchema, scheduleParamsSchema, scheduleUpdateSchema } from "./schedule.schema";

/**
 * Routes `/schedule`.
 * Lecture publique, écriture réservée à l'administration (cahier §8), dans
 * l'ordre `authenticate → requireAdmin → authorize(SchedulePolicy, ACTION) →
 * validate` (`docs/029` §4.2).
 *
 * Les routes d'écriture sont gouvernées par `SchedulePolicy` (`docs/029` §4.6,
 * P-13), qui **refuse tous les rôles**, `SUPER_ADMIN` compris : elle porte la
 * question ouverte `docs/029` Q-15 (« qui administre le rythme de rencontre ? »).
 * Le `403 FORBIDDEN` opposé à `POST`, `PATCH` et `DELETE` est donc la réponse
 * attendue, et le motif du refus — référence de la question comprise — reste au
 * journal du serveur. La route de **lecture publique** (`GET /`) est inchangée :
 * elle ne porte aucune policy, faute d'identité administrative à juger.
 */
export interface ScheduleRouterDeps {
  service: ScheduleService;
  authDeps: AuthDependencies;
}

export function createScheduleRouter(deps: ScheduleRouterDeps): Router {
  const router = Router();
  const controller = createScheduleController(deps.service);
  const admin = requireAuthenticatedAdmin(deps.authDeps);

  // Liste bornée, non paginée : **aucun** paramètre de requête n'est reconnu
  // (`docs/018` §6.1). La *query* est validée comme telle — `?limit=20` est
  // refusé en `VALIDATION_ERROR` plutôt qu'accepté puis ignoré.
  router.get("/", validate({ query: emptyQuerySchema }), controller.list);

  router.post(
    "/",
    ...admin,
    authorize(SchedulePolicy, "CREATE"),
    validate({ body: scheduleCreateSchema }),
    controller.create,
  );
  router.patch(
    "/:id",
    ...admin,
    authorize(SchedulePolicy, "UPDATE"),
    validate({ params: scheduleParamsSchema, body: scheduleUpdateSchema }),
    controller.update,
  );
  router.delete(
    "/:id",
    ...admin,
    authorize(SchedulePolicy, "DELETE"),
    validate({ params: scheduleParamsSchema }),
    controller.remove,
  );

  return router;
}
