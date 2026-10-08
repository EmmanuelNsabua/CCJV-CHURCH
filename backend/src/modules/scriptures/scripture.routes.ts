import { Router } from "express";
import type { AuthDependencies } from "@/presentation/middlewares/auth";
import { requireAuthenticatedAdmin } from "@/presentation/middlewares/auth";
import { validate } from "@/presentation/middlewares/validate";
import { authorize, ScripturePolicy } from "@/presentation/policies";
import { emptyQuerySchema } from "@/shared/http/pagination";
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
 * middlewares d'écriture : `authenticate` → `requireAdmin` →
 * `authorize(ScripturePolicy, ACTION)` → `validate` — jamais de validation avant
 * authentification, ni d'autorisation après validation (`docs/018` §6,
 * `docs/029` §4.2).
 *
 * Les routes d'écriture sont gouvernées par `ScripturePolicy` (`docs/029` §4.6,
 * P-12), qui **refuse tous les rôles**, `SUPER_ADMIN` compris : elle porte la
 * question ouverte `docs/029` Q-12 et `docs/028` Q-PG2 (« les versets sont-ils
 * éditables par le back-office ? »). Le `403 FORBIDDEN` opposé à `POST`, `PATCH`
 * et `DELETE` est donc la réponse attendue, et le motif du refus reste au journal
 * du serveur. Les routes de **lecture publique** (`GET /`, `GET /:key`) ne
 * portent aucune policy : elles servent le visiteur, sans identité
 * administrative à juger — un verset n'est pas confidentiel, seule son
 * administration n'a pas de titulaire.
 */
export interface ScriptureRouterDeps {
  service: ScriptureService;
  authDeps: AuthDependencies;
}

export function createScriptureRouter(deps: ScriptureRouterDeps): Router {
  const router = Router();
  const controller = createScriptureController(deps.service);
  const admin = requireAuthenticatedAdmin(deps.authDeps);

  // Liste complète, non paginée : **aucun** paramètre de requête n'est reconnu
  // (`docs/018` §6.1). Un `?limit=20` est donc refusé, jamais ignoré.
  router.get("/", validate({ query: emptyQuerySchema }), controller.list);
  router.get("/:key", validate({ params: scriptureParamsSchema }), controller.get);

  router.post(
    "/",
    ...admin,
    authorize(ScripturePolicy, "CREATE"),
    validate({ body: scriptureCreateSchema }),
    controller.create,
  );
  router.patch(
    "/:key",
    ...admin,
    authorize(ScripturePolicy, "UPDATE"),
    validate({ params: scriptureParamsSchema, body: scriptureUpdateSchema }),
    controller.update,
  );
  router.delete(
    "/:key",
    ...admin,
    authorize(ScripturePolicy, "DELETE"),
    validate({ params: scriptureParamsSchema }),
    controller.remove,
  );

  return router;
}
