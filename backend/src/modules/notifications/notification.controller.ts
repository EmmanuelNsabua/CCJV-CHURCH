import type { Request, Response } from "express";
import type { AdminProfile } from "@/domain/entities";
import { AuthRequiredError } from "@/shared/errors/app-error";
import { sendCollection, sendItem } from "@/shared/http/respond";
import { validatedParams, validatedQuery } from "@/presentation/middlewares/validate";
import type { ListNotificationsQuery, NotificationIdParams } from "./notification.schema";
import { toNotificationDto, type NotificationDto } from "./notification.serializer";
import type { NotificationService } from "./notification.service";

/**
 * Contrôleur des notifications.
 *
 * Le destinataire est `req.admin` — **jamais** un paramètre de requête ni un
 * champ de corps. C'est la seule façon d'écrire une route dont on ne peut pas
 * dévier : il n'y a pas d'entrée à valider qui désignerait quelqu'un d'autre.
 *
 * Aucune décision d'autorisation n'est prise ici : la policy est appelée par le
 * service, sur le type puis sur chaque instance (`docs/029` §4.2).
 */
export function createNotificationController(service: NotificationService) {
  return {
    /** `GET /notifications` — la boîte de réception de l'appelant. */
    async list(req: Request, res: Response): Promise<void> {
      const query = validatedQuery<ListNotificationsQuery>(req);
      const { items, total } = await service.list(requireAdmin(req), query);

      sendCollection<NotificationDto>(
        res,
        items.map(toNotificationDto),
        query.page,
        query.limit,
        total,
      );
    },

    /** `GET /notifications/unread-count` — l'indicateur de la barre de navigation. */
    async unreadCount(req: Request, res: Response): Promise<void> {
      const total = await service.unreadCount(requireAdmin(req));
      sendItem(res, { unread: total });
    },

    /** `PATCH /notifications/:id/read` — marquage comme lue, idempotent. */
    async markAsRead(req: Request, res: Response): Promise<void> {
      const { id } = validatedParams<NotificationIdParams>(req);
      const notification = await service.markAsRead(requireAdmin(req), id);

      sendItem(res, toNotificationDto(notification));
    },
  };
}

export type NotificationController = ReturnType<typeof createNotificationController>;

/**
 * L'administrateur courant, garanti par la chaîne de middlewares.
 *
 * Même choix que le module média : le `?.` est écarté au profit d'une erreur
 * explicite, pour que le contrôleur reste sûr s'il était monté sans
 * `requireAdmin`.
 */
function requireAdmin(req: Request): AdminProfile {
  if (!req.admin) {
    throw new AuthRequiredError();
  }
  return req.admin;
}
