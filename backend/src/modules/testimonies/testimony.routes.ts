import { Router } from "express";
import type { AuthDependencies } from "@/presentation/middlewares/auth";
import {
  authenticate,
  requireAdmin,
  requireAuthenticatedAdmin,
} from "@/presentation/middlewares/auth";
import { validate } from "@/presentation/middlewares/validate";
import { authorize, EditorialEntityPolicy } from "@/presentation/policies";
import { paginationQuerySchema } from "@/shared/http/pagination";
import { createTestimonyController } from "./testimony.controller";
import {
  createTestimonySchema,
  publicSubmitTestimonySchema,
  setTestimonyFeaturedSchema,
  testimonyIdParamSchema,
  testimonyListQuerySchema,
  updateTestimonySchema,
  updateTestimonyStatusSchema,
} from "./testimony.schema";
import type { TestimonyService } from "./testimony.service";

export interface TestimonyRouterDeps {
  service: TestimonyService;
  authDeps: AuthDependencies;
}

/**
 * Routes `/api/v1/testimonies` :
 * - Routes publiques : soumission (POST /submit), galerie publique (GET /public), sélection Hero (GET /hero).
 * - Routes administration : boîte de réception (GET /), modération (POST /:id/status), sélection Hero (POST /:id/hero), correction (PATCH /:id), suppression (DELETE /:id).
 */
export function createTestimonyRouter(deps: TestimonyRouterDeps): Router {
  const router = Router();
  const controller = createTestimonyController(deps.service);
  const authMiddleware = authenticate();
  const adminMiddleware = requireAdmin(deps.authDeps);
  const admin = [authMiddleware, adminMiddleware];

  // --- Endpoints publics et boîte de réception adaptative ------------------
  router.get(
    "/public",
    validate({ query: paginationQuerySchema }),
    controller.listPublic,
  );
  router.get("/hero", controller.listHero);
  router.post(
    "/submit",
    validate({ body: publicSubmitTestimonySchema }),
    controller.submitPublic,
  );

  router.get("/", (req, res, next) => {
    if (req.headers.authorization) {
      return authMiddleware(req, res, (err: unknown) => {
        if (err) return next(err);
        return adminMiddleware(req, res, (err2: unknown) => {
          if (err2) return next(err2);
          return authorize(EditorialEntityPolicy, "READ")(req, res, (err3) => {
            if (err3) return next(err3);
            return validate({ query: testimonyListQuerySchema })(req, res, (err4) =>
              err4 ? next(err4) : controller.list(req, res),
            );
          });
        });
      });
    }
    return validate({ query: paginationQuerySchema })(req, res, (err) =>
      err ? next(err) : controller.listPublic(req, res),
    );
  });

  router.get(
    "/:id",
    validate({ params: testimonyIdParamSchema }),
    (req, res, next) => {
      if (req.headers.authorization) {
        return authMiddleware(req, res, (err: unknown) => {
          if (err) return next(err);
          return adminMiddleware(req, res, (err2: unknown) => {
            if (err2) return next(err2);
            return authorize(EditorialEntityPolicy, "READ")(req, res, (err3) => {
              if (err3) return next(err3);
              return controller.get(req, res);
            });
          });
        });
      }
      return controller.getPublic(req, res);
    },
  );
  router.post(
    "/",
    ...admin,
    authorize(EditorialEntityPolicy, "CREATE"),
    validate({ body: createTestimonySchema }),
    controller.create,
  );
  router.patch(
    "/:id",
    ...admin,
    authorize(EditorialEntityPolicy, "UPDATE"),
    validate({ params: testimonyIdParamSchema, body: updateTestimonySchema }),
    controller.update,
  );
  router.post(
    "/:id/status",
    ...admin,
    authorize(EditorialEntityPolicy, "UPDATE"),
    validate({
      params: testimonyIdParamSchema,
      body: updateTestimonyStatusSchema,
    }),
    controller.changeStatus,
  );
  router.post(
    "/:id/hero",
    ...admin,
    authorize(EditorialEntityPolicy, "UPDATE"),
    validate({
      params: testimonyIdParamSchema,
      body: setTestimonyFeaturedSchema,
    }),
    controller.setFeatured,
  );
  router.delete(
    "/:id",
    ...admin,
    authorize(EditorialEntityPolicy, "DELETE"),
    validate({ params: testimonyIdParamSchema }),
    controller.remove,
  );

  return router;
}
