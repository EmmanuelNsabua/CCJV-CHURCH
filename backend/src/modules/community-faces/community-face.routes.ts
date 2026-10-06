import { Router } from "express";
import type { AuthDependencies } from "@/presentation/middlewares/auth";
import { requireAnyAdmin } from "@/presentation/middlewares/auth";
import { validate } from "@/presentation/middlewares/validate";
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
 * Lecture publique, écriture administration (cahier §8).
 */
export function createCommunityFaceRouter(deps: CommunityFaceRouterDeps): Router {
  const router = Router();
  const controller = createCommunityFaceController(deps.service);
  const admin = requireAnyAdmin(deps.authDeps, "ROLE_ADMIN");

  router.get("/", validate({ query: listQuerySchema }), controller.list);
  router.get(
    "/:id",
    validate({ params: communityFaceIdParamSchema }),
    controller.get,
  );

  router.post(
    "/",
    ...admin,
    validate({ body: createCommunityFaceSchema }),
    controller.create,
  );
  router.patch(
    "/:id",
    ...admin,
    validate({ params: communityFaceIdParamSchema, body: updateCommunityFaceSchema }),
    controller.update,
  );
  router.delete(
    "/:id",
    ...admin,
    validate({ params: communityFaceIdParamSchema }),
    controller.remove,
  );

  return router;
}
