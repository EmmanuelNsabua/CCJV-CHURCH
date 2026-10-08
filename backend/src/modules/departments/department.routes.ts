import { Router } from "express";
import type { AuthDependencies } from "@/presentation/middlewares/auth";
import { requireAuthenticatedAdmin } from "@/presentation/middlewares/auth";
import { authorize, DepartmentPolicy } from "@/presentation/policies";
import { validate } from "@/presentation/middlewares/validate";
import { createDepartmentController } from "./department.controller";
import {
  createDepartmentSchema,
  departmentIdOrSlugSchema,
  listDepartmentQuerySchema,
  updateDepartmentSchema,
} from "./department.schema";
import type { DepartmentService } from "./department.service";

/**
 * Fabrique du router « départements ».
 *
 * Le préfixe `/api/v1` est ajouté au montage (`app.ts`), jamais ici : le router
 * reste testable isolément.
 *
 * La séparation lecture publique / écriture administrée est explicite : aucune
 * route d'écriture n'est déclarée sans `...admin` (cahier §8). L'ordre des
 * middlewares est `authenticate` → `requireAdmin` →
 * `authorize(DepartmentPolicy, ACTION)` → `validate` : on n'analyse jamais le
 * corps d'une requête non authentifiée, ni celui d'une requête dont la policy
 * n'a pas encore admis l'action.
 */
export interface DepartmentRouterDeps {
  service: DepartmentService;
  authDeps: AuthDependencies;
}

export function createDepartmentRouter(deps: DepartmentRouterDeps): Router {
  const router = Router();
  const controller = createDepartmentController(deps.service);
  const admin = requireAuthenticatedAdmin(deps.authDeps);

  // --- Lecture publique -----------------------------------------------------
  router.get("/", validate({ query: listDepartmentQuerySchema }), controller.list);
  router.get(
    "/:idOrSlug",
    validate({ params: departmentIdOrSlugSchema }),
    controller.get,
  );

  // --- Administration -------------------------------------------------------
  router.post(
    "/",
    ...admin,
    authorize(DepartmentPolicy, "CREATE"),
    validate({ body: createDepartmentSchema }),
    controller.create,
  );
  router.patch(
    "/:idOrSlug",
    ...admin,
    authorize(DepartmentPolicy, "UPDATE"),
    validate({
      params: departmentIdOrSlugSchema,
      body: updateDepartmentSchema,
    }),
    controller.update,
  );
  router.delete(
    "/:idOrSlug",
    ...admin,
    authorize(DepartmentPolicy, "DELETE"),
    validate({ params: departmentIdOrSlugSchema }),
    controller.remove,
  );

  return router;
}
