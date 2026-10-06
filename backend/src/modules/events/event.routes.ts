import { Router } from "express";
import type { AuthDependencies } from "@/presentation/middlewares/auth";
import { requireAnyAdmin } from "@/presentation/middlewares/auth";
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
 * `authenticate` → `requireAdmin` → `requireRole` → `validate` garantit qu'un
 * corps n'est jamais analysé avant que l'identité soit vérifiée.
 */
export interface EventRouterDeps {
  service: EventService;
  authDeps: AuthDependencies;
}

export function createEventRouter(deps: EventRouterDeps): Router {
  const router = Router();
  const controller = createEventController(deps.service);
  const admin = requireAnyAdmin(deps.authDeps, "ROLE_ADMIN");

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
    validate({ body: createEventSchema }),
    controller.create,
  );
  router.patch(
    "/:idOrSlug",
    ...admin,
    validate({ params: eventIdOrSlugSchema, body: updateEventSchema }),
    controller.update,
  );
  router.delete(
    "/:idOrSlug",
    ...admin,
    validate({ params: eventIdOrSlugSchema }),
    controller.remove,
  );

  return router;
}
