import type { Notification } from "@/domain/entities";

/**
 * Représentation API d'une notification.
 *
 * Trois champs de contenu (`id`, `type`, `referenceId`, `isRead`, `createdAt`), et
 * **rien d'autre**. C'est la traduction visible de `docs/032` §3.3 : la
 * notification dit qu'un événement a eu lieu, jamais de quoi il s'agit. Le type
 * (`PRAYER_REQUEST_RECEIVED`) et un identifiant de référence permettent à
 * l'interface d'afficher « une nouvelle demande de prière » et de renvoyer vers
 * l'écran concerné — c'est-à-dire vers une page qui, elle, appliquera ses propres
 * règles d'accès.
 *
 * **Rien n'est omis par prudence : il n'y a rien à omettre.** Aucun champ de ce
 * DTO ne pourrait recevoir un contenu de prière, un nom ou un extrait — le
 * domaine, la table et ce sérialiseur n'ont pas de place pour eux. Un oubli de
 * filtrage est impossible là où il n'existe pas de champ à filtrer.
 */
export interface NotificationDto {
  id: string;
  type: string;
  /** Identifiant de la ressource référencée (demande de prière, clé). */
  referenceId: string | null;
  isRead: boolean;
  createdAt: string;
}

export function toNotificationDto(notification: Notification): NotificationDto {
  return {
    id: notification.id,
    type: notification.type,
    referenceId: notification.referenceId,
    isRead: notification.isRead,
    createdAt: notification.createdAt.toISOString(),
  };
}
