import { Router } from "express";
import type { AuthDependencies } from "@/presentation/middlewares/auth";
import { requireAuthenticatedAdmin } from "@/presentation/middlewares/auth";
import { validate } from "@/presentation/middlewares/validate";
import { authorize, EditorialEntityPolicy } from "@/presentation/policies";
import { createCommunityFaceController } from "./community-face.controller";
import {
  communityFaceIdParamSchema,
  createCommunityFaceSchema,
  listQuerySchema,
  updateCommunityFaceSchema,
} from "./community-face.schema";
import type { CommunityFaceService } from "./community-face.service";

export interface CommunityFaceRouterDeps {
  service: CommunityFaceService;
  authDeps: AuthDependencies;
}

/**
 * Routes `/api/v1/community-faces`.
 * Lecture publique, écriture administration (cahier §8), dans l'ordre
 * `authenticate → requireAdmin → authorize(EditorialEntityPolicy, ACTION) →
 * validate` (`docs/029` §4.2) — le rôle ne filtre plus rien, la décision
 * appartient à la policy.
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
export function createCommunityFaceRouter(deps: CommunityFaceRouterDeps): Router {
  const router = Router();
  const controller = createCommunityFaceController(deps.service);
  const admin = requireAuthenticatedAdmin(deps.authDeps);

  router.get("/", validate({ query: listQuerySchema }), controller.list);
  router.get(
    "/:id",
    validate({ params: communityFaceIdParamSchema }),
    controller.get,
  );

  router.post(
    "/",
    ...admin,
    authorize(EditorialEntityPolicy, "CREATE"),
    validate({ body: createCommunityFaceSchema }),
    controller.create,
  );
  router.patch(
    "/:id",
    ...admin,
    authorize(EditorialEntityPolicy, "UPDATE"),
    validate({ params: communityFaceIdParamSchema, body: updateCommunityFaceSchema }),
    controller.update,
  );
  router.delete(
    "/:id",
    ...admin,
    authorize(EditorialEntityPolicy, "DELETE"),
    validate({ params: communityFaceIdParamSchema }),
    controller.remove,
  );

  return router;
}
