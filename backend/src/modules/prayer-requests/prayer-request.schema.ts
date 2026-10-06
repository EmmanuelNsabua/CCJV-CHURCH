import { z } from "zod";
import { paginationQuerySchema } from "@/shared/http/pagination";

/**
 * Schémas d'entrée des demandes de prière.
 *
 * **Ce module est le seul point d'écriture publique du site** : n'importe quel
 * visiteur non authentifié peut y déposer du texte libre. Les schémas sont donc
 * délibérément stricts :
 *
 * - bornes de longueur basses (le formulaire réel
 *   `frontend/src/components/forms/PrayerRequestForm.tsx` demande « quelques
 *   mots ») ;
 * - `requestText` non vide **après `trim()`** : un texte composé uniquement
 *   d'espaces est refusé, et la valeur stockée est nettoyée ;
 * - objets `.strict()` : toute clé inconnue provoque un `VALIDATION_ERROR`
 *   plutôt que d'être silencieusement ignorée. Un champ non prévu ne peut donc
 *   pas être injecté dans la ligne.
 */

/** Le formulaire promet une intention courte : 1 000 caractères est un plafond. */
export const PRAYER_REQUEST_TEXT_MAX_LENGTH = 1_000;

/** Aligné sur la largeur des colonnes `varchar(120)` du schéma. */
export const PRAYER_REQUEST_NAME_MAX_LENGTH = 120;
export const PRAYER_REQUEST_CONTACT_MAX_LENGTH = 120;

/** Niveaux de confidentialité acceptés (enum PostgreSQL `prayer_confidentiality`). */
export const prayerConfidentialitySchema = z.enum(["private", "community"]);

/** États d'une demande (enum PostgreSQL `prayer_status`). */
export const prayerStatusSchema = z.enum(["NEW", "PRAYED"]);

/**
 * Champ texte facultatif et court.
 *
 * Une chaîne vide ou blanche devient `null` : la personne peut rester anonyme,
 * et la base ne stocke pas de faux contact fait d'espaces.
 */
function optionalShortText(maxLength: number, label: string) {
  return z
    .string()
    .trim()
    .max(maxLength, `${label} ne peut pas dépasser ${maxLength} caractères`)
    .transform((value) => (value.length === 0 ? null : value))
    .optional();
}

/** Corps de `POST /prayer-requests` — route publique, donc strict. */
export const createPrayerRequestSchema = z.strictObject({
  requestText: z
    .string({ error: "Le texte de la demande est requis" })
    .trim()
    .min(1, "Le texte de la demande ne peut pas être vide")
    .max(
      PRAYER_REQUEST_TEXT_MAX_LENGTH,
      `Le texte de la demande ne peut pas dépasser ${PRAYER_REQUEST_TEXT_MAX_LENGTH} caractères`,
    ),
  requesterName: optionalShortText(
    PRAYER_REQUEST_NAME_MAX_LENGTH,
    "Le prénom ou nom",
  ),
  requesterContact: optionalShortText(
    PRAYER_REQUEST_CONTACT_MAX_LENGTH,
    "Le contact",
  ),
  confidentiality: prayerConfidentialitySchema.default("private"),
});

/**
 * Corps de `PATCH /prayer-requests/:id`.
 *
 * Une seule transition existe en V1 : `NEW → PRAYED`. `z.literal` plutôt que
 * `z.enum` : accepter `NEW` laisserait croire à un retour arrière que la
 * persistance ne sait pas exprimer (`handledAt` ne serait plus cohérent).
 */
export const updatePrayerRequestSchema = z.strictObject({
  status: z.literal("PRAYED", {
    error: "Seule la valeur « PRAYED » est acceptée pour le statut",
  }),
});

/** Paramètre d'URL : un identifiant est toujours un UUID (jamais un slug). */
export const prayerRequestIdParamsSchema = z.strictObject({
  id: z.uuid({ error: "Identifiant de demande de prière invalide" }),
});

/**
 * *Query* de `GET /prayer-requests` : pagination commune + filtre fermé.
 * Aucun paramètre de tri : l'ordre est fixé par le serveur (date décroissante).
 */
export const listPrayerRequestsQuerySchema = paginationQuerySchema.extend({
  status: prayerStatusSchema.optional(),
});

export type CreatePrayerRequestBody = z.infer<typeof createPrayerRequestSchema>;
export type UpdatePrayerRequestBody = z.infer<typeof updatePrayerRequestSchema>;
export type PrayerRequestIdParams = z.infer<typeof prayerRequestIdParamsSchema>;
export type ListPrayerRequestsQuery = z.infer<typeof listPrayerRequestsQuerySchema>;
