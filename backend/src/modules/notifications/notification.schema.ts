import { z } from "zod";
import { paginationQuerySchema } from "@/shared/http/pagination";

/**
 * Schémas d'entrée du module « notifications ».
 *
 * **Aucune route ne reçoit d'identifiant de destinataire**, et ce n'est pas un
 * oubli : le destinataire est toujours le profil authentifié (`req.admin.id`).
 * `docs/029` §2.9 fait d'une notification une donnée adressée — « une
 * notification se lit par identité, pas par rôle » — et accepter un
 * `?recipientId=` ouvrirait la boîte de réception d'un autre administrateur, ce
 * que la policy refuserait de toute façon. Ne pas déclarer le champ est plus sûr
 * que le refuser : il n'y a rien à oublier de vérifier.
 */

export const notificationIdParamsSchema = z.object({
  id: z.uuid("Identifiant de notification invalide"),
});

export type NotificationIdParams = z.infer<typeof notificationIdParamsSchema>;

/**
 * Filtre de lecture : les non-lues, ou tout.
 *
 * `unreadOnly` est **strict** (`true`/`false` littéraux, comme `?force` du module
 * média) : `Boolean("false")` vaut `true`, et un `?unreadOnly=0` interprété comme
 * « vrai » afficherait une liste que l'appelant croyait complète.
 */
export const listNotificationsQuerySchema = paginationQuerySchema.extend({
  unreadOnly: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
});

export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;

/** Aucun paramètre de requête n'est reconnu sur le compteur. */
export const emptyNotificationsQuerySchema = z.strictObject({});
