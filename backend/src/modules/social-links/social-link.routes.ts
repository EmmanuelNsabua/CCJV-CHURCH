import { Router } from "express";
import type { AuthDependencies } from "@/presentation/middlewares/auth";
import { requireAnyAdmin } from "@/presentation/middlewares/auth";
import { validate } from "@/presentation/middlewares/validate";
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
 * Lecture publique, écriture réservée à l'administration (cahier §8).
 */
export interface SocialLinkRouterDeps {
  service: SocialLinkService;
  authDeps: AuthDependencies;
}

export function createSocialLinkRouter(deps: SocialLinkRouterDeps): Router {
  const router = Router();
  const controller = createSocialLinkController(deps.service);
  const admin = requireAnyAdmin(deps.authDeps, "ROLE_ADMIN");

  // Liste bornée, non paginée : **aucun** paramètre de requête n'est reconnu.
  // La *query* est validée comme telle plutôt qu'acceptée puis ignorée.
  router.get("/", validate({ query: emptyQuerySchema }), controller.list);

  router.post(
    "/",
    ...admin,
    validate({ body: socialLinkCreateSchema }),
    controller.create,
  );
  router.patch(
    "/:id",
    ...admin,
    validate({ params: socialLinkParamsSchema, body: socialLinkUpdateSchema }),
    controller.update,
  );
  router.delete(
    "/:id",
    ...admin,
    validate({ params: socialLinkParamsSchema }),
    controller.remove,
  );

  return router;
}
