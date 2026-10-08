import { Router } from "express";
import type { AuthDependencies } from "@/presentation/middlewares/auth";
import { requireAuthenticatedAdmin } from "@/presentation/middlewares/auth";
import { validate } from "@/presentation/middlewares/validate";
import { authorize, SiteSettingsPolicy } from "@/presentation/policies";
import { emptyQuerySchema } from "@/shared/http/pagination";
import type { SettingService } from "./setting.service";
import { createSettingController } from "./setting.controller";
import { settingsPatchSchema } from "./setting.schema";

/**
 * Routes `/settings`.
 *
 * Une seule route publique (`GET`), une seule route d'administration (`PATCH`) :
 * c'est un document unique regroupant les scalaires et les liens sociaux, pas
 * une collection d'identifiants.
 *
 * Le document n'accepte **aucun** paramètre de requête : `GET /` monte donc
 * `emptyQuerySchema`, un objet strict. Un `?nimportequoi=1` y est refusé en
 * `400 VALIDATION_ERROR` au lieu d'être ignoré en silence — la convention est la
 * même que sur les collections.
 *
 * La route d'administration suit l'ordre `authenticate → requireAdmin →
 * authorize(SiteSettingsPolicy, ACTION) → validate` (`docs/029` §4.2).
 *
 * Cette route est gouvernée par `SiteSettingsPolicy` (`docs/029` §4.6, P-14), qui
 * **refuse tous les rôles**, `SUPER_ADMIN` compris : elle porte les questions
 * ouvertes `docs/029` Q-13 et Q-28 (« quel est le périmètre de l'ADMIN sur les
 * paramètres ? »). Le `403 FORBIDDEN` opposé à `PATCH` est donc la réponse
 * attendue, et le motif du refus — référence de la question comprise — reste au
 * journal du serveur. La route de **lecture publique** (`GET /`) est inchangée :
 * elle ne porte aucune policy, faute d'identité administrative à juger.
 */
export interface SettingRouterDeps {
  service: SettingService;
  authDeps: AuthDependencies;
}

export function createSettingRouter(deps: SettingRouterDeps): Router {
  const router = Router();
  const controller = createSettingController(deps.service);
  const admin = requireAuthenticatedAdmin(deps.authDeps);

  router.get("/", validate({ query: emptyQuerySchema }), controller.get);

  router.patch(
    "/",
    ...admin,
    authorize(SiteSettingsPolicy, "UPDATE"),
    validate({ body: settingsPatchSchema }),
    controller.update,
  );

  return router;
}
