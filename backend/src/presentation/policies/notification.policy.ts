import { createPolicy } from "./policy-kit";

/**
 * `NotificationPolicy` — P-09 de `docs/029` §4.6, **policy non nommée par
 * `docs/024` §8**.
 *
 * ### La seule règle que la documentation tranche
 *
 * `docs/028` D-10 ne se contente pas d'interdire au `SUPER_ADMIN` la lecture des
 * demandes de prière : il refuse aussi qu'**une notification** lui en parvienne.
 * Une notification est une fuite par un autre chemin — elle porte un type, une
 * date, et souvent un identifiant de ressource. Recevoir « une demande de prière
 * a été déposée » suffit à savoir **qu'il y en a une**, ce que D-10 interdit
 * explicitement (« ni **nombre** »).
 *
 * Le test N-04 de `docs/029` §6.2 l'inscrit comme un cas à part entière :
 * « Notification de prière · `SUPER_ADMIN` · **Aucune** notification créée ni
 * délivrée ». Ce n'est donc pas seulement une règle de lecture : la
 * **création** de la notification est fautive. Le refus est posé ici **et**
 * porté par la base (`docs/032` §3.3 : « AUCUNE notification de ce domaine ne
 * peut viser un `SUPER_ADMIN` », D-10).
 *
 * ### Ce que cette policy ne tranche pas
 *
 * Le vocabulaire des notifications est volontairement minimal —
 * `PRAYER_REQUEST_RECEIVED`, et les trois valeurs de sécurité exigées par
 * `docs/030` §4.7 (`KEY_REGISTERED`, `KEY_REVOKED`, `RECOVERY_KEY_CHANGED`).
 * `docs/032` §3.2 refuse d'ajouter une valeur générique de notification métier
 * « faute de décision » : cette policy ne crée donc **aucune** catégorie, et se
 * contente de juger celles qui existent.
 */

/**
 * Types de notification (`docs/032` §3.2, `notification_type`).
 *
 * La liste est fermée par la base (`ADD VALUE` documenté), et le seul type qui
 * déclenche une règle d'autorisation est le premier : c'est la marque d'un
 * domaine dont l'existence même est une information protégée.
 */
export type NotificationType =
  | "PRAYER_REQUEST_RECEIVED"
  | "KEY_REGISTERED"
  | "KEY_REVOKED"
  | "RECOVERY_KEY_CHANGED";

/** Vue d'une notification telle que la policy a besoin de la connaître. */
export interface NotificationPolicyResource {
  /** `notifications.recipient_user_id` — un destinataire, jamais un rôle. */
  recipientUserId: string;
  type: NotificationType;
}

export const NotificationPolicy = createPolicy<NotificationPolicyResource>(
  "NotificationPolicy",
  {
    /**
     * `canRead` — le **destinataire** de la notification, et personne d'autre.
     *
     * Une notification est adressée : sa lecture n'obéit pas à une hiérarchie
     * mais à une **identité**. Un `SUPER_ADMIN` ne lit pas les notifications
     * d'un autre administrateur, tout comme un responsable ne lit pas celles de
     * son voisin. La table accorde donc largement — le tri se fait sur
     * l'instance, par l'égalité de destinataire.
     */
    READ: {
      roles: ["SUPER_ADMIN", "ADMIN", "DEPARTMENT_MANAGER"],
      resource: (admin, resource) => mustBeRecipient(admin.id, resource),
    },

    /**
     * `canUpdate` — marquer comme lue. Même règle : seul le destinataire.
     *
     * L'action est distincte de `READ` parce que l'état « lue » est une donnée
     * partagée : si deux administrateurs pouvaient la modifier, le premier
     * écraserait la lecture du second et une notification importante
     * disparaîtrait de l'écran de celui à qui elle était adressée.
     */
    UPDATE: {
      roles: ["SUPER_ADMIN", "ADMIN", "DEPARTMENT_MANAGER"],
      resource: (admin, resource) => mustBeRecipient(admin.id, resource),
    },

    /**
     * `canDelete` — **refus pour tous**.
     *
     * La purge et la rétention des notifications ne sont tranchées nulle part
     * (`docs/029` Q-17 porte sur l'audit, et `docs/032` §3.3 conserve
     * `notifications` avec `ON DELETE CASCADE` sur le destinataire — la
     * disparition d'un compte emporte ses notifications, celle d'une
     * notification ne s'obtient pas par une route). Inventer une durée de
     * conservation reviendrait à effacer des traces d'activité sur la base d'un
     * chiffre arbitraire.
     */
    DELETE: { roles: [], pending: "docs/029 Q-17 · rétention non tranchée" },
  },
  /**
   * **Le domaine des notifications est réservé à l'`ADMIN`.**
   *
   * Cette exclusion est la transcription exacte des **deux règles** que
   * `docs/032` §3.3 fait appliquer par le trigger `notifications_check_recipient_role`
   * — et elle doit dire la même chose que lui, sinon la policy et la base
   * divergeraient, au point qu'une ligne impossible en base serait servie par
   * l'API (ou l'inverse).
   *
   * | Type | Destinataire admis (`docs/030` §6.2) |
   * | --- | --- |
   * | `PRAYER_REQUEST_RECEIVED` | un `ADMIN` **actif** uniquement |
   * | `KEY_REGISTERED`, `KEY_REVOKED`, `RECOVERY_KEY_CHANGED` | les `ADMIN` uniquement, **jamais** le `SUPER_ADMIN` |
   *
   * Les deux règles se résument donc à une seule : **rôle `ADMIN`, sinon refus**.
   * Le `DEPARTMENT_MANAGER` n'y a aucune part (le domaine des prières n'est pas
   * départemental), et le `SUPER_ADMIN` non plus.
   *
   * ⚠️ **Correction assumée d'une version antérieure.** La première rédaction de
   * cette policy laissait au `SUPER_ADMIN` les notifications de **sécurité des
   * clés**, au motif qu'il « devait pouvoir constater une révocation ». C'était une
   * déduction de ma part, et elle contredisait le texte : `docs/032` §3.3 écrit
   * que ces notifications vont « à TOUS les Admins et **JAMAIS** au
   * `SUPER_ADMIN` » (`docs/030` §4.7 et §6.2). Le domaine des prières, y compris
   * le cycle de vie de ses clés, est **entièrement fermé** au `SUPER_ADMIN` —
   * c'est le sens de D-10 : « le domaine `PrayerRequest` est fonctionnellement
   * inexistant pour lui ».
   *
   * L'exclusion est évaluée **avant** la table : elle vaut donc pour toute action
   * présente ou future, et aucune ligne ajoutée plus tard ne pourra la rouvrir.
   */
  (admin, resource) =>
    resource !== undefined && admin.role !== "ADMIN"
      ? admin.role === "SUPER_ADMIN"
        ? "docs/028 D-10 : le domaine des prières — notifications comprises — est fonctionnellement inexistant pour le SUPER_ADMIN (docs/030 §4.7, §6.2)"
        : "docs/030 §6.2 : une notification du domaine des prières ne peut viser qu'un ADMIN — le périmètre départemental n'y donne aucun accès"
      : null,
);

/** Une notification n'est lisible que par son destinataire. */
function mustBeRecipient(
  actorId: string,
  resource: NotificationPolicyResource | undefined,
): { allowed: boolean; reason?: string } {
  if (!resource) return { allowed: true };
  if (resource.recipientUserId !== actorId) {
    return {
      allowed: false,
      reason: "Notification adressée à un autre destinataire : une notification se lit par identité, pas par rôle",
    };
  }
  return { allowed: true };
}
