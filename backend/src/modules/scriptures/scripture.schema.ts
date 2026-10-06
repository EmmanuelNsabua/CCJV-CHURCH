import { z } from "zod";

/**
 * Entrées des routes `/scriptures`.
 *
 * La `key` est l'identifiant d'URL (les pages référencent leurs versets par clé)
 * et n'est donc pas modifiable par `PATCH /:key` : le schéma de mise à jour
 * l'omet. Elle sert aussi de contrainte de forme — minuscules, chiffres, tirets —
 * pour qu'aucune clé ne puisse contenir d'espace ou de caractère d'URL.
 */

/** Traduction par défaut des versets — domaine public, affichée avec le texte. */
export const DEFAULT_SCRIPTURE_TRANSLATION = "Louis Segond 1910";

export const scriptureKeySchema = z
  .string()
  .trim()
  .min(1)
  .max(60)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Clé attendue en minuscules, sans espace (ex. « rassemblement »)",
  );

export const scriptureParamsSchema = z.object({ key: scriptureKeySchema });

export const scriptureCreateSchema = z.object({
  key: scriptureKeySchema,
  text: z.string().trim().min(1).max(2000),
  reference: z.string().trim().min(1).max(80),
  translation: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .default(DEFAULT_SCRIPTURE_TRANSLATION),
  context: z.string().trim().max(200).nullish(),
});

/**
 * Mise à jour partielle. Au moins un champ est exigé : un `PATCH` vide serait un
 * aller-retour inutile et masquerait une erreur de formulaire.
 */
export const scriptureUpdateSchema = scriptureCreateSchema
  .omit({ key: true })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Aucun champ à mettre à jour",
  });

export type ScriptureCreateInput = z.infer<typeof scriptureCreateSchema>;
export type ScriptureUpdateInput = z.infer<typeof scriptureUpdateSchema>;
