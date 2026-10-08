import { and, count, desc, eq } from "drizzle-orm";
import type { Notification, NotificationType } from "@/domain/entities";
import type { ListOptions, ListResult, NotificationRepository } from "@/domain/repositories";
import type { Database } from "@/infrastructure/database/client";
import { notifications } from "@/infrastructure/database/schema/notifications";
import type { NotificationRow } from "@/infrastructure/database/schema/notifications";
import { ConflictError, InternalError } from "@/shared/errors/app-error";

/**
 * Persistance des notifications (`docs/032` §3.3).
 *
 * ### Aucune lecture sans destinataire
 *
 * Chaque méthode de lecture exige `recipientUserId`. Ce n'est pas une commodité
 * d'API : une notification est **adressée**, et une requête qui l'oublierait
 * renverrait la boîte de réception de tout le monde. Le contrat rend l'oubli
 * impossible plutôt que de compter sur la relecture.
 *
 * ### D-10 est garanti par la base, et ce repository le traduit
 *
 * Le trigger `notifications_check_recipient_role` (créé avec la table) refuse :
 * - une notification de prière vers un non-`ADMIN` ou un `ADMIN` inactif ;
 * - une notification de sécurité des clés vers un `SUPER_ADMIN`.
 *
 * `NotificationPolicy` refuse déjà ces cas — la base le garantit. Une violation
 * n'est donc pas une panne mais un refus, et elle est traduite comme tel : un
 * `500` sur une tentative d'écrire une notification interdite masquerait la règle
 * au lieu de la rendre lisible.
 */
export class DrizzleNotificationRepository implements NotificationRepository {
  constructor(private readonly db: Database) {}

  async listForRecipient(
    recipientUserId: string,
    options: ListOptions,
    filters: { unreadOnly?: boolean },
  ): Promise<ListResult<Notification>> {
    const conditions = [eq(notifications.recipientUserId, recipientUserId)];
    if (filters.unreadOnly) {
      conditions.push(eq(notifications.isRead, false));
    }

    const rows = await this.db
      .select()
      .from(notifications)
      .where(and(...conditions))
      // Les plus récentes d'abord : une boîte de réception se lit par le haut.
      .orderBy(desc(notifications.createdAt), desc(notifications.id))
      .limit(options.limit)
      .offset(options.offset);

    const [totaux] = await this.db
      .select({ total: count() })
      .from(notifications)
      .where(and(...conditions));

    return { items: rows.map(toEntity), total: totaux?.total ?? 0 };
  }

  async findById(id: string): Promise<Notification | null> {
    const [row] = await this.db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id))
      .limit(1);

    return row ? toEntity(row) : null;
  }

  async countUnread(recipientUserId: string): Promise<number> {
    const [row] = await this.db
      .select({ total: count() })
      .from(notifications)
      .where(
        and(
          eq(notifications.recipientUserId, recipientUserId),
          eq(notifications.isRead, false),
        ),
      );

    return row?.total ?? 0;
  }

  async create(data: {
    recipientUserId: string;
    type: NotificationType;
    referenceId?: string | null;
  }): Promise<Notification> {
    try {
      const [row] = await this.db
        .insert(notifications)
        .values({
          recipientUserId: data.recipientUserId,
          type: data.type,
          referenceId: data.referenceId ?? null,
        })
        .returning();

      if (!row) {
        throw new InternalError("La notification n'a pas pu être enregistrée");
      }

      return toEntity(row);
    } catch (error) {
      throw translate(error);
    }
  }

  /**
   * Marque comme lue, de façon **idempotente**.
   *
   * Une notification déjà lue est renvoyée telle quelle : rejouer un marquage
   * n'est pas une faute, et une erreur sur ce chemin ferait clignoter une
   * interface sans raison. C'est la différence avec `grant` d'un accès média —
   * ici, aucun auteur ni horodatage n'est écrasé, il n'y a donc rien à perdre.
   */
  async markAsRead(id: string): Promise<Notification | null> {
    const [row] = await this.db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();

    return row ? toEntity(row) : null;
  }
}

/**
 * Traduit une erreur du trigger D-10 en refus métier.
 *
 * Les deux messages du trigger citent `D-10` et `030 §6.2` : c'est délibéré de
 * sa part, et c'est ce qui permet ici de distinguer un refus d'autorisation d'une
 * panne réelle, sans avoir à reproduire la logique du trigger côté application.
 */
function translate(error: unknown): Error {
  const message = error instanceof Error ? error.message : String(error);

  if (/D-10|030 §6\.2/.test(message)) {
    return new ConflictError(
      "CONFLICT",
      "Cette notification ne peut pas être adressée à ce destinataire : le domaine des prières est refusé au SUPER_ADMIN et réservé aux ADMIN actifs (docs/028 D-10, docs/030 §6.2)",
      { regle: "D-10" },
    );
  }

  if (/destinataire .* inexistant|foreign_key_violation/.test(message)) {
    return new ConflictError(
      "CONFLICT",
      "Le destinataire de la notification n'existe pas",
      { champ: "recipientUserId" },
    );
  }

  return error instanceof Error ? error : new Error(message);
}

function toEntity(row: NotificationRow): Notification {
  return {
    id: row.id,
    recipientUserId: row.recipientUserId,
    type: row.type,
    referenceId: row.referenceId,
    isRead: row.isRead,
    createdAt: row.createdAt,
  };
}
