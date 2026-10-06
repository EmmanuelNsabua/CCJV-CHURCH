import type { Request, Response } from "express";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import type { AuthDependencies } from "@/presentation/middlewares/auth";
import { requireAnyAdmin } from "@/presentation/middlewares/auth";
import { validate } from "@/presentation/middlewares/validate";
import { sendError } from "@/shared/http/respond";
import {
  createPrayerRequestSchema,
  listPrayerRequestsQuerySchema,
  prayerRequestIdParamsSchema,
  updatePrayerRequestSchema,
} from "./prayer-request.schema";
import { createPrayerRequestController } from "./prayer-request.controller";
import type { PrayerRequestService } from "./prayer-request.service";

/**
 * Routes des demandes de prière.
 *
 * **Règle de sécurité non négociable : aucune lecture publique.**
 * Le formulaire affirme au visiteur que sa demande « ne sera jamais publiée sur
 * Internet ni sur les réseaux sociaux ». Cette promesse reste vraie parce que
 * les trois routes de lecture sont montées derrière `...admin` et que le
 * repository lui-même n'offre aucune recherche par critère libre.
 *
 * Ordre imposé : `authenticate` → `requireAdmin` → `requireRole` → `validate`
 * (`IMPLEMENTATION_SPEC` §6.2). Seule la création est publique.
 */

export interface PrayerRequestRouterDeps {
  service: PrayerRequestService;
  authDeps: AuthDependencies;
}

/**
 * Rate limiting dédié à l'écriture publique.
 *
 * Le plafond global (`RATE_LIMIT_MAX`, 120 requêtes par minute) protège l'API
 * en général ; il est bien trop permissif pour un formulaire qui alimente une
 * boîte de réception humaine. Un visiteur ne dépose pas sa détresse des
 * dizaines de fois par heure : au-delà de 5 dépôts par heure et par IP, la
 * requête est refusée. C'est ce qui borne l'usage du module comme vecteur de
 * pollution de la base et de harcèlement de l'équipe d'intercession.
 *
 * Le compteur est indexé sur l'adresse IP (clé par défaut de
 * `express-rate-limit`, qui gère aussi le sous-réseau IPv6) ; `trust proxy` est
 * configuré dans `app.ts` pour que l'IP réelle soit vue derrière Railway.
 */
const PUBLIC_WRITE_WINDOW_MS = 60 * 60 * 1_000;

const PUBLIC_WRITE_MAX_PER_WINDOW = 5;

const publicWriteLimiter = rateLimit({
  windowMs: PUBLIC_WRITE_WINDOW_MS,
  limit: PUBLIC_WRITE_MAX_PER_WINDOW,
  // En-têtes normalisés `RateLimit-*` uniquement : pas de `X-RateLimit-*`.
  standardHeaders: true,
  legacyHeaders: false,
  // Même format d'erreur que le reste de l'API, jamais un corps propre à la
  // bibliothèque.
  handler: (_req: Request, res: Response) => {
    sendError(
      res,
      429,
      "RATE_LIMITED",
      "Trop de demandes de prière envoyées depuis cette connexion. " +
        "Merci de réessayer dans une heure, ou d'écrire directement à l'équipe.",
    );
  },
});

export function createPrayerRequestRouter(
  deps: PrayerRequestRouterDeps,
): Router {
  const router = Router();
  const controller = createPrayerRequestController(deps.service);

  // Réservé à l'administration : aucun `GET` de ce router n'est monté sans.
  const admin = requireAnyAdmin(deps.authDeps, "ROLE_ADMIN");

  // --- Écriture PUBLIQUE : visiteurs non connectés --------------------------
  // Rate limit dédié, appliqué à cette seule route, avant la validation.
  router.post(
    "/",
    publicWriteLimiter,
    validate({ body: createPrayerRequestSchema }),
    controller.create,
  );

  // --- Lecture et gestion : ADMINISTRATION uniquement -----------------------
  router.get(
    "/",
    ...admin,
    validate({ query: listPrayerRequestsQuerySchema }),
    controller.list,
  );
  router.get(
    "/:id",
    ...admin,
    validate({ params: prayerRequestIdParamsSchema }),
    controller.get,
  );
  router.patch(
    "/:id",
    ...admin,
    validate({
      params: prayerRequestIdParamsSchema,
      body: updatePrayerRequestSchema,
    }),
    controller.update,
  );
  router.delete(
    "/:id",
    ...admin,
    validate({ params: prayerRequestIdParamsSchema }),
    controller.remove,
  );

  return router;
}
