import { Router } from "express";
import type { AuthDependencies } from "@/presentation/middlewares/auth";
import { requireAuthenticatedAdmin } from "@/presentation/middlewares/auth";
import { authorize, EventPolicy } from "@/presentation/policies";
import { validate } from "@/presentation/middlewares/validate";
import { createEventController } from "./event.controller";
import {
  createEventSchema,
  eventIdOrSlugSchema,
  listEventQuerySchema,
  updateEventSchema,
} from "./event.schema";
import type { EventService } from "./event.service";

/**
 * Fabrique du router « événements ».
 *
 * Lecture publique (`GET /`, `GET /:idOrSlug`) et écriture administrée
 * (`POST`, `PATCH`, `DELETE`) sont séparées de façon explicite : aucune route
 * d'écriture n'est déclarée sans `...admin` (cahier §8). L'ordre imposé
 * `authenticate` → `requireAdmin` → `authorize(EventPolicy, ACTION)` →
 * `validate` garantit qu'un corps n'est jamais analysé avant que l'identité
 * soit vérifiée, ni avant que la policy ait statué sur l'action.
 */
export interface EventRouterDeps {
  service: EventService;
  authDeps: AuthDependencies;
}

export function createEventRouter(deps: EventRouterDeps): Router {
  const router = Router();
  const controller = createEventController(deps.service);
  const admin = requireAuthenticatedAdmin(deps.authDeps);

  // --- Lecture publique -----------------------------------------------------
  router.get("/", validate({ query: listEventQuerySchema }), controller.list);
  router.get(
    "/:idOrSlug",
    validate({ params: eventIdOrSlugSchema }),
    controller.get,
  );

  // --- Administration -------------------------------------------------------
  router.post(
    "/",
    ...admin,
    authorize(EventPolicy, "CREATE"),
    validate({ body: createEventSchema }),
    controller.create,
  );
  router.patch(
    "/:idOrSlug",
    ...admin,
    authorize(EventPolicy, "UPDATE"),
    validate({ params: eventIdOrSlugSchema, body: updateEventSchema }),
    controller.update,
  );
  router.delete(
    "/:idOrSlug",
    ...admin,
    authorize(EventPolicy, "DELETE"),
    validate({ params: eventIdOrSlugSchema }),
    controller.remove,
  );

  return router;
}
