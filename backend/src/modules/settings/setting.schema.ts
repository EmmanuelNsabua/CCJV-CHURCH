import { z } from "zod";

/**
 * Entrées des routes `/settings`.
 *
 * `site_settings` n'est **pas** un magasin clé/valeur générique : seules les clés
 * déclarées ici sont écrivables, ce qui empêche la dérive du modèle vers un CMS
 * (`docs/018` §4.3). La liste reprend les faits institutionnels scalaires de
 * `frontend/src/data/mock/site.ts` — elle est fermée : toute autre clé est
 * refusée par le service (`ValidationError`).
 *
 * Les listes ordonnées (réseaux sociaux) ont leur propre table : elles ne
 * figurent donc pas ici.
 */
export const ALLOWED_SETTING_KEYS = [
  "site.name",
  "site.acronym",
  "site.location",
  "site.foundedAt",
  "site.ecodimFoundedAt",
  "site.visionary",
  "site.visionaryRole",
  "site.address",
  "site.addressLine1",
  "site.addressLine2",
  "site.addressLine3",
  "site.scheduleAdults",
  "site.scheduleChildren",
  "site.whatsappNumber",
  "site.whatsappHref",
] as const;

export type SettingKey = (typeof ALLOWED_SETTING_KEYS)[number];

/** Garde de type : après ce test, `key` est une `SettingKey`. */
export function isAllowedSettingKey(key: string): key is SettingKey {
  return (ALLOWED_SETTING_KEYS as readonly string[]).includes(key);
}

export const settingsPatchSchema = z.object({
  // Valeur scalaire non vide : un réglage vidé par erreur casserait l'affichage
  // du site (nom, adresse, numéro WhatsApp).
  settings: z.record(z.string(), z.string().trim().min(1).max(500)),
});

export type SettingsPatchInput = z.infer<typeof settingsPatchSchema>;
