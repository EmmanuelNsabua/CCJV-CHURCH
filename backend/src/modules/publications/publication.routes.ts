import { Router } from "express";
import type { AuthDependencies } from "@/presentation/middlewares/auth";
import { requireAuthenticatedAdmin } from "@/presentation/middlewares/auth";
import { authorize, PublicationPolicy } from "@/presentation/policies";
import { validate } from "@/presentation/middlewares/validate";
import { createPublicationController } from "./publication.controller";
import {
  createPublicationSchema,
  listPublicationQuerySchema,
  publicationIdOrSlugSchema,
  updatePublicationSchema,
} from "./publication.schema";
import type { PublicationService } from "./publication.service";

/**
 * Fabrique du router « publications ».
 *
 * La médiathèque, les actualités et les ressources partagent **un seul**
 * système filtré par `category` (cahier §13) : ce router ne connaît donc aucune
 * route par rubrique.
 *
 * La séparation public / administration est explicite : les deux `GET` sont
 * ouverts et sans authentification ; `POST`, `PATCH` et `DELETE` sont toujours
 * précédés de `...admin` puis de `authorize(PublicationPolicy, ACTION)`, dans
 * l'ordre `authenticate` → `requireAdmin` → `authorize` → `validate` : une
 * demande refusée par la policy n'atteint jamais la validation de son corps.
 */
export interface PublicationRouterDeps {
  service: PublicationService;
  authDeps: AuthDependencies;
}

export function createPublicationRouter(deps: PublicationRouterDeps): Router {
  const router = Router();
  const controller = createPublicationController(deps.service);
  const admin = requireAuthenticatedAdmin(deps.authDeps);

  // --- Lecture publique (jamais de brouillon) --------------------------------
  router.get("/", validate({ query: listPublicationQuerySchema }), controller.list);
  router.get(
    "/:idOrSlug",
    validate({ params: publicationIdOrSlugSchema }),
    controller.get,
  );

  // --- Administration -------------------------------------------------------
  router.post(
    "/",
    ...admin,
    authorize(PublicationPolicy, "CREATE"),
    validate({ body: createPublicationSchema }),
    controller.create,
  );
  router.patch(
    "/:idOrSlug",
    ...admin,
    authorize(PublicationPolicy, "UPDATE"),
    validate({ params: publicationIdOrSlugSchema, body: updatePublicationSchema }),
    controller.update,
  );
  router.delete(
    "/:idOrSlug",
    ...admin,
    authorize(PublicationPolicy, "DELETE"),
    validate({ params: publicationIdOrSlugSchema }),
    controller.remove,
  );

  return router;
}
