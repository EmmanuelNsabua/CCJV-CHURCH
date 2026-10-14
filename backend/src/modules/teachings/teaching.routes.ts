import { Router, type NextFunction, type Request, type Response } from "express";
import type { AuthDependencies } from "@/presentation/middlewares/auth";
import { requireAuthenticatedAdmin } from "@/presentation/middlewares/auth";
import { authorize, TeachingPolicy } from "@/presentation/policies";
import { validate } from "@/presentation/middlewares/validate";
import { extractBearerToken, verifyAccessToken } from "@/infrastructure/supabase/auth";
import { createTeachingController } from "./teaching.controller";
import {
  createTeachingBodySchema,
  teachingIdOrSlugParamSchema,
  teachingIdParamSchema,
  teachingListQuerySchema,
  updateBiblicalReferencesBodySchema,
  updateTeachingBodySchema,
  updateTeachingMediasBodySchema,
} from "./teaching.schema";
import type { TeachingService } from "./teaching.service";

export interface TeachingRouterDeps {
  service: TeachingService;
  authDeps: AuthDependencies;
}

/**
 * Middleware d'authentification facultative :
 * Si un jeton Bearer valide est fourni, req.admin est renseigné afin que le service
 * puisse autoriser la consultation des brouillons et archives aux administrateurs.
 * Sinon, la requête est traitée comme publique (seuls les enseignements publiés sont renvoyés).
 */
function optionalAuth(deps: AuthDependencies) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const token = extractBearerToken(req.headers.authorization);
      if (token) {
        const auth = await verifyAccessToken(token);
        if (auth?.userId) {
          const profile = await deps.adminProfiles.findById(auth.userId);
          if (profile && profile.isActive) {
            req.admin = profile;
          }
        }
      }
    } catch {
      // Échec silencieux : traité comme public
    }
    next();
  };
}

export function createTeachingRouter(deps: TeachingRouterDeps): Router {
  const router = Router();
  const controller = createTeachingController(deps.service);
  const admin = requireAuthenticatedAdmin(deps.authDeps);
  const optAuth = optionalAuth(deps.authDeps);

  // --- Lecture publique / liste (ouverte avec option admin) -----------------
  router.get(
    "/",
    optAuth,
    validate({ query: teachingListQuerySchema }),
    controller.list,
  );

  router.get(
    "/:id",
    optAuth,
    validate({ params: teachingIdOrSlugParamSchema }),
    controller.get,
  );

  // --- Administration -------------------------------------------------------
  router.post(
    "/",
    ...admin,
    authorize(TeachingPolicy, "CREATE"),
    validate({ body: createTeachingBodySchema }),
    controller.create,
  );

  router.patch(
    "/:id",
    ...admin,
    authorize(TeachingPolicy, "UPDATE"),
    validate({ params: teachingIdParamSchema, body: updateTeachingBodySchema }),
    controller.update,
  );

  router.put(
    "/:id/references-bibliques",
    ...admin,
    authorize(TeachingPolicy, "UPDATE"),
    validate({
      params: teachingIdParamSchema,
      body: updateBiblicalReferencesBodySchema,
    }),
    controller.updateBiblicalReferences,
  );

  router.put(
    "/:id/medias",
    ...admin,
    authorize(TeachingPolicy, "UPDATE"),
    validate({
      params: teachingIdParamSchema,
      body: updateTeachingMediasBodySchema,
    }),
    controller.updateMedias,
  );

  router.post(
    "/:id/publish",
    ...admin,
    authorize(TeachingPolicy, "PUBLISH"),
    validate({ params: teachingIdParamSchema }),
    controller.publish,
  );

  router.post(
    "/:id/archive",
    ...admin,
    authorize(TeachingPolicy, "ARCHIVE"),
    validate({ params: teachingIdParamSchema }),
    controller.archive,
  );

  router.delete(
    "/:id",
    ...admin,
    authorize(TeachingPolicy, "DELETE"),
    validate({ params: teachingIdParamSchema }),
    controller.remove,
  );

  return router;
}
