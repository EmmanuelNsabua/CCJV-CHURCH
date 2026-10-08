import { Router } from "express";
import type { AuthDependencies } from "@/presentation/middlewares/auth";
import { requireAuthenticatedAdmin } from "@/presentation/middlewares/auth";
import { validate } from "@/presentation/middlewares/validate";
import { authorize, EditorialEntityPolicy } from "@/presentation/policies";
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
 * `authenticate → requireAdmin → authorize(EditorialEntityPolicy, ACTION) →
 * validate` (`IMPLEMENTATION_SPEC.md` §6). Le rôle ne filtre plus rien ici : la
 * décision appartient à la policy (`docs/029` §4.2).
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
export function createLeaderRouter(deps: LeaderRouterDeps): Router {
  const router = Router();
  const controller = createLeaderController(deps.service);
  const admin = requireAuthenticatedAdmin(deps.authDeps);

  router.get("/", validate({ query: listQuerySchema }), controller.list);
  router.get("/:id", validate({ params: leaderIdParamSchema }), controller.get);

  router.post(
    "/",
    ...admin,
    authorize(EditorialEntityPolicy, "CREATE"),
    validate({ body: createLeaderSchema }),
    controller.create,
  );
  router.patch(
    "/:id",
    ...admin,
    authorize(EditorialEntityPolicy, "UPDATE"),
    validate({ params: leaderIdParamSchema, body: updateLeaderSchema }),
    controller.update,
  );
  router.delete(
    "/:id",
    ...admin,
    authorize(EditorialEntityPolicy, "DELETE"),
    validate({ params: leaderIdParamSchema }),
    controller.remove,
  );

  return router;
}
