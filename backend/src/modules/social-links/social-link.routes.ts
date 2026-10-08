import { Router } from "express";
import type { AuthDependencies } from "@/presentation/middlewares/auth";
import { requireAuthenticatedAdmin } from "@/presentation/middlewares/auth";
import { validate } from "@/presentation/middlewares/validate";
import { authorize, SiteSettingsPolicy } from "@/presentation/policies";
import { emptyQuerySchema } from "@/shared/http/pagination";
import type { SocialLinkService } from "./social-link.service";
import { createSocialLinkController } from "./social-link.controller";
import {
  socialLinkCreateSchema,
  socialLinkParamsSchema,
  socialLinkUpdateSchema,
} from "./social-link.schema";

/**
 * Routes `/social-links`.
 * Lecture publique, écriture réservée à l'administration (cahier §8), dans
 * l'ordre `authenticate → requireAdmin → authorize(SiteSettingsPolicy, ACTION) →
 * validate` (`docs/029` §4.2).
 *
 * Les routes d'écriture sont gouvernées par `SiteSettingsPolicy` (`docs/029`
 * §4.6, P-14), qui **refuse tous les rôles**, `SUPER_ADMIN` compris : elle porte
 * les questions ouvertes `docs/029` Q-13 et Q-28 (« quel est le périmètre de
 * l'ADMIN sur les paramètres ? »). Le `403 FORBIDDEN` opposé à `POST`, `PATCH` et
 * `DELETE` est donc la réponse attendue, et le motif du refus — référence de la
 * question comprise — reste au journal du serveur. La route de **lecture
 * publique** (`GET /`) est inchangée : elle ne porte aucune policy, faute
 * d'identité administrative à juger.
 */
export interface SocialLinkRouterDeps {
  service: SocialLinkService;
  authDeps: AuthDependencies;
}

export function createSocialLinkRouter(deps: SocialLinkRouterDeps): Router {
  const router = Router();
  const controller = createSocialLinkController(deps.service);
  const admin = requireAuthenticatedAdmin(deps.authDeps);

  // Liste bornée, non paginée : **aucun** paramètre de requête n'est reconnu.
  // La *query* est validée comme telle plutôt qu'acceptée puis ignorée.
  router.get("/", validate({ query: emptyQuerySchema }), controller.list);

  router.post(
    "/",
    ...admin,
    authorize(SiteSettingsPolicy, "CREATE"),
    validate({ body: socialLinkCreateSchema }),
    controller.create,
  );
  router.patch(
    "/:id",
    ...admin,
    authorize(SiteSettingsPolicy, "UPDATE"),
    validate({ params: socialLinkParamsSchema, body: socialLinkUpdateSchema }),
    controller.update,
  );
  router.delete(
    "/:id",
    ...admin,
    authorize(SiteSettingsPolicy, "DELETE"),
    validate({ params: socialLinkParamsSchema }),
    controller.remove,
  );

  return router;
}
