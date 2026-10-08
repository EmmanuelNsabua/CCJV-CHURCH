import type { AdminProfile, Notification } from "@/domain/entities";
import type { ListResult, NotificationRepository } from "@/domain/repositories";
import { NotificationPolicy } from "@/presentation/policies";
import { AuthRequiredError, ForbiddenError, NotFoundError } from "@/shared/errors/app-error";
import { toOffset } from "@/shared/http/pagination";
import { logger } from "@/infrastructure/logger";
import type { ListNotificationsQuery } from "./notification.schema";

/**
 * Règles métier des notifications.
 *
 * ### Le destinataire n'est jamais une entrée
 *
 * Toutes les méthodes prennent l'acteur et **imposent** `actor.id` comme
 * destinataire. Ce n'est pas une convention d'appel : c'est la traduction, dans
 * le contrat du service, de « une notification se lit par identité, pas par
 * rôle ». Un service qui accepterait un destinataire en paramètre serait un
 * service où l'on peut se tromper — et une erreur de destinataire, ici, se
 * traduit par la lecture de la boîte de réception d'un autre.
 *
 * ### La policy est consultée deux fois, comme partout
 *
 * Une fois sur le **type** d'action (l'acteur est-il un administrateur dont la
 * policy accepte cette lecture ?), et une fois par **instance** — chaque
 * notification renvoyée est soumise à `NotificationPolicy`, qui refuse
 * notamment toute notification de prière adressée à un `SUPER_ADMIN` (D-10).
 *
 * Cette seconde vérification est un **contrôle de défense en profondeur** : le
 * repository filtre déjà par destinataire, et le trigger de la base interdit déjà
 * ces lignes. Si une ligne refusée apparaissait malgré tout, elle serait écartée
 * plutôt que servie — et signalée dans le journal, parce qu'un tel cas signale un
 * défaut ailleurs, pas un simple refus.
 */
export class NotificationService {
  constructor(private readonly notifications: NotificationRepository) {}

  async list(
    actor: AdminProfile | undefined,
    query: ListNotificationsQuery,
  ): Promise<ListResult<Notification>> {
    const profile = this.requireProfile(actor);

    const page = await this.notifications.listForRecipient(
      profile.id,
      { limit: query.limit, offset: toOffset(query.page, query.limit) },
      { unreadOnly: query.unreadOnly },
    );

    const autorisees = page.items.filter((notification) => {
      const decision = NotificationPolicy.can(profile, "READ", {
        recipientUserId: notification.recipientUserId,
        type: notification.type,
      });

      if (!decision.allowed) {
        logger.warn(
          {
            actorId: profile.id,
            notificationId: notification.id,
            type: notification.type,
            reason: decision.reason,
          },
          "Notification écartée à la lecture : la policy la refuse (défaut ailleurs — repository ou trigger)",
        );
      }

      return decision.allowed;
    });

    return { items: autorisees, total: page.total };
  }

  /** Compteur de la boîte de réception — jamais un contenu, jamais un type. */
  async unreadCount(actor: AdminProfile | undefined): Promise<number> {
    return this.notifications.countUnread(this.requireProfile(actor).id);
  }

  /**
   * Marque une notification comme lue.
   *
   * Une notification **d'un autre destinataire** produit le même `404` qu'une
   * notification inexistante : `docs/029` §4.5 interdit qu'un refus révèle
   * l'existence d'une donnée adressée à quelqu'un d'autre. Distinguer `403` et
   * `404` ici serait un oracle — « cette notification existe, mais pas pour
   * vous ».
   */
  async markAsRead(
    actor: AdminProfile | undefined,
    id: string,
  ): Promise<Notification> {
    const profile = this.requireProfile(actor);
    const notification = await this.notifications.findById(id);

    if (notification === null || notification.recipientUserId !== profile.id) {
      throw notFound(id);
    }

    this.assertAllowed(profile, "UPDATE", notification);

    const updated = await this.notifications.markAsRead(id);
    if (updated === null) {
      // Course entre la lecture et l'écriture : la ligne a disparu.
      throw notFound(id);
    }

    return updated;
  }

  /**
   * **Où se branchera l'intégration avec `PrayerRequest` (Lot 8).**
   *
   * Le chemin de création d'une notification **n'est pas exposé ici**, et ce
   * n'est pas un oubli. Trois raisons, dans l'ordre d'importance :
   *
   * 1. **Aucune décision n'autorise un administrateur à créer une
   *    notification.** `docs/029` §2.9 ne comporte aucune cellule `CREATE` :
   *    `NotificationPolicy` n'a donc pas de ligne `CREATE`, et le refus par
   *    défaut s'applique — ce qui est exact. Il n'existe d'ailleurs aucune route
   *    pour le faire.
   * 2. **Le créateur est le système, pas un acteur.** Une demande de prière
   *    déposée par un visiteur déclenche une notification sans qu'aucun
   *    administrateur n'agisse (`docs/030` §6.2). Le contrôle de ce chemin n'est
   *    donc pas un contrôle de **rôle** mais la règle D-10 : le destinataire doit
   *    être un `ADMIN` **actif**, et jamais un `SUPER_ADMIN`. Cette règle est
   *    aujourd'hui portée par l'exclusion de `NotificationPolicy` et **garantie**
   *    par le trigger `notifications_check_recipient_role` de la base.
   * 3. **Le contrat de persistance est prêt.** `NotificationRepository.create`
   *    existe, prend un type et un identifiant de référence — jamais un contenu —
   *    et traduit le refus du trigger en `CONFLICT` lisible. Le jour où le cycle
   *    des prières est écrit (Lot 8), il appellera ce contrat avec le garde D-10
   *    du domaine.
   *
   * Écrire dès maintenant une méthode `notify` obligerait à inventer soit un
   * acteur système (que rien ne définit), soit une ligne `CREATE` dans la policy
   * (qu'aucune décision n'autorise). Les deux seraient pires que l'absence : une
   * autorisation inventée survit toujours à la relecture qui l'a créée.
   */

  private requireProfile(actor: AdminProfile | undefined): AdminProfile {
    if (!actor) {
      throw new AuthRequiredError();
    }
    return actor;
  }

  private assertAllowed(
    actor: AdminProfile,
    action: Parameters<typeof NotificationPolicy.can>[1],
    notification: Notification,
  ): void {
    const decision = NotificationPolicy.can(actor, action, {
      recipientUserId: notification.recipientUserId,
      type: notification.type,
    });

    if (decision.allowed) return;

    logger.warn(
      {
        actorId: actor.id,
        actorRole: actor.role,
        action,
        reason: decision.reason,
      },
      "Notification refusée",
    );

    throw new ForbiddenError();
  }
}

function notFound(id: string): NotFoundError {
  return new NotFoundError(
    "NOTIFICATION_NOT_FOUND",
    "Aucune notification ne correspond à cet identifiant",
    { id },
  );
}
