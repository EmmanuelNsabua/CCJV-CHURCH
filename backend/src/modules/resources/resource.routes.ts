import { Router } from "express";
import { z } from "zod";
import type { AuthDependencies } from "@/presentation/middlewares/auth";
import { requireAuthenticatedAdmin } from "@/presentation/middlewares/auth";
import { validate } from "@/presentation/middlewares/validate";
import { authorize, ResourcePolicy } from "@/presentation/policies";
import { createResourceController } from "./resource.controller";
import type { ResourceService } from "./resource.service";
import {
  createResourceSchema,
  replaceResourceFileSchema,
  resourceListQuerySchema,
  updateResourceSchema,
} from "./resource.schema";

export interface ResourceRouterDeps {
  service: ResourceService;
  authDeps: AuthDependencies;
}

const idParamSchema = z.object({
  id: z.string().uuid("L'identifiant doit être un UUID valide"),
});

/**
 * Paramètre de lecture : UUID **ou** slug.
 *
 * Le paramètre s'appelle `id` comme celui des écritures, et non `idOrSlug` :
 * un contrat OpenAPI ne peut pas porter deux gabarits équivalents
 * (`/resources/{id}` et `/resources/{idOrSlug}` désignent la même URL), et
 * l'ambiguïté ferait diverger la documentation de la réalité. La valeur, elle,
 * accepte bien les deux formes — c'est `ResourceService.get` qui tranche.
 */
const idOrSlugParamSchema = z.object({
  id: z.string().min(1),
});

export function createResourceRouter(deps: ResourceRouterDeps): Router {
  const router = Router();
  const controller = createResourceController(deps.service);
  const admin = requireAuthenticatedAdmin(deps.authDeps);

  // --- Routes publiques (sans authentification) -----------------------------
  router.get("/", validate({ query: resourceListQuerySchema }), controller.list);
  router.get("/:id", validate({ params: idOrSlugParamSchema }), controller.get);

  // --- Routes d'administration ----------------------------------------------
  router.post(
    "/",
    ...admin,
    authorize(ResourcePolicy, "CREATE"),
    validate({ body: createResourceSchema }),
    controller.create,
  );
  router.patch(
    "/:id",
    ...admin,
    authorize(ResourcePolicy, "UPDATE"),
    validate({ params: idParamSchema, body: updateResourceSchema }),
    controller.update,
  );
  router.put(
    "/:id/file",
    ...admin,
    authorize(ResourcePolicy, "UPDATE"),
    validate({ params: idParamSchema, body: replaceResourceFileSchema }),
    controller.replaceFile,
  );
  router.delete(
    "/:id",
    ...admin,
    authorize(ResourcePolicy, "DELETE"),
    validate({ params: idParamSchema }),
    controller.remove,
  );

  return router;
}
