import { Router } from "express";
import type { AuthDependencies } from "@/presentation/middlewares/auth";
import { requireAuthenticatedAdmin } from "@/presentation/middlewares/auth";
import { authorize, NotificationPolicy } from "@/presentation/policies";
import { validate } from "@/presentation/middlewares/validate";
import { createNotificationController } from "./notification.controller";
import {
  emptyNotificationsQuerySchema,
  listNotificationsQuerySchema,
  notificationIdParamsSchema,
} from "./notification.schema";
import type { NotificationService } from "./notification.service";

/**
 * Routes `/api/v1/notifications`.
 *
 * ### Aucune route ne désigne un destinataire
 *
 * Le destinataire est toujours le profil authentifié. Il n'existe donc pas de
 * route « les notifications de X » : `docs/029` §2.9 en fait une donnée
 * **adressée**, et une route qui accepterait un identifiant ouvrirait une boîte de
 * réception qui n'est pas la sienne. Ne pas exposer l'entrée est plus sûr que de
 * la refuser.
 *
 * ### Trois routes, aucune de création
 *
 * Créer une notification n'est pas une action d'administrateur : elle est
 * déclenchée par le **système** au dépôt d'une demande de prière (`docs/030`
 * §6.2, Lot 8), et le contrôle de ce chemin est la règle D-10 — portée par le
 * service et **garantie** par le trigger de la base. Aucune cellule `CREATE`
 * n'existe dans la matrice (`docs/029` §2.9) : il n'y a donc rien à monter ici.
 *
 * Ordre imposé : `authenticate` → `requireAdmin` →
 * `authorize(NotificationPolicy, ACTION)` → `validate`.
 */
export interface NotificationRouterDeps {
  service: NotificationService;
  authDeps: AuthDependencies;
}

export function createNotificationRouter(deps: NotificationRouterDeps): Router {
  const router = Router();
  const controller = createNotificationController(deps.service);
  const admin = requireAuthenticatedAdmin(deps.authDeps);

  router.get(
    "/",
    ...admin,
    authorize(NotificationPolicy, "READ"),
    validate({ query: listNotificationsQuerySchema }),
    controller.list,
  );

  // Déclarée **avant** `/:id` : sans cela, `/unread-count` serait interprété
  // comme un identifiant, et le compteur répondrait `400` sur un UUID invalide.
  router.get(
    "/unread-count",
    ...admin,
    authorize(NotificationPolicy, "READ"),
    validate({ query: emptyNotificationsQuerySchema }),
    controller.unreadCount,
  );

  router.patch(
    "/:id/read",
    ...admin,
    authorize(NotificationPolicy, "UPDATE"),
    validate({ params: notificationIdParamsSchema }),
    controller.markAsRead,
  );

  return router;
}
