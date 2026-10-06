import { Router } from "express";
import type { AuthDependencies } from "@/presentation/middlewares/auth";
import { requireAnyAdmin } from "@/presentation/middlewares/auth";
import { validate } from "@/presentation/middlewares/validate";
import { createTestimonyController } from "./testimony.controller";
import {
  createTestimonySchema,
  listQuerySchema,
  testimonyIdParamSchema,
  updateTestimonySchema,
} from "./testimony.schema";
import type { TestimonyService } from "./testimony.service";

export interface TestimonyRouterDeps {
  service: TestimonyService;
  authDeps: AuthDependencies;
}

/** Routes `/api/v1/testimonies` : lecture publique, écriture administration. */
export function createTestimonyRouter(deps: TestimonyRouterDeps): Router {
  const router = Router();
  const controller = createTestimonyController(deps.service);
  const admin = requireAnyAdmin(deps.authDeps, "ROLE_ADMIN");

  router.get("/", validate({ query: listQuerySchema }), controller.list);
  router.get("/:id", validate({ params: testimonyIdParamSchema }), controller.get);

  router.post(
    "/",
    ...admin,
    validate({ body: createTestimonySchema }),
    controller.create,
  );
  router.patch(
    "/:id",
    ...admin,
    validate({ params: testimonyIdParamSchema, body: updateTestimonySchema }),
    controller.update,
  );
  router.delete(
    "/:id",
    ...admin,
    validate({ params: testimonyIdParamSchema }),
    controller.remove,
  );

  return router;
}
