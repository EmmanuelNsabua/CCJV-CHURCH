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
  "site.supportEmail",
  "site.latitude",
  "site.longitude",
  "site.timezone",
] as const;

export type SettingKey = (typeof ALLOWED_SETTING_KEYS)[number];

/** Garde de type : après ce test, `key` est une `SettingKey`. */
export function isAllowedSettingKey(key: string): key is SettingKey {
  return (ALLOWED_SETTING_KEYS as readonly string[]).includes(key);
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+?[0-9\s\-().]{6,25}$/;

export const settingsPatchSchema = z.object({
  settings: z.record(z.string(), z.string().trim().max(500)),
}).superRefine((data, ctx) => {
  const { settings } = data;
  if (settings["site.supportEmail"] && !emailRegex.test(settings["site.supportEmail"])) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "L'adresse e-mail de support est invalide.",
      path: ["settings", "site.supportEmail"],
    });
  }

  if (settings["site.whatsappNumber"] && !phoneRegex.test(settings["site.whatsappNumber"])) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Le numéro WhatsApp doit être un numéro international valide.",
      path: ["settings", "site.whatsappNumber"],
    });
  }

  if (settings["site.latitude"] !== undefined && settings["site.latitude"] !== "") {
    const lat = Number.parseFloat(settings["site.latitude"]);
    if (Number.isNaN(lat) || lat < -90 || lat > 90) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La latitude doit être un nombre décimal compris entre -90 et 90.",
        path: ["settings", "site.latitude"],
      });
    }
  }

  if (settings["site.longitude"] !== undefined && settings["site.longitude"] !== "") {
    const lng = Number.parseFloat(settings["site.longitude"]);
    if (Number.isNaN(lng) || lng < -180 || lng > 180) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La longitude doit être un nombre décimal compris entre -180 et 180.",
        path: ["settings", "site.longitude"],
      });
    }
  }

  if (settings["site.timezone"] !== undefined && settings["site.timezone"] !== "") {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: settings["site.timezone"] });
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Le fuseau horaire doit être un identifiant IANA valide (ex: Africa/Lubumbashi).",
        path: ["settings", "site.timezone"],
      });
    }
  }
}).transform((data) => {
  const { settings } = data;
  if (settings["site.whatsappNumber"] && !settings["site.whatsappHref"]) {
    const digits = settings["site.whatsappNumber"].replace(/\D/g, "");
    if (digits) {
      settings["site.whatsappHref"] = `https://wa.me/${digits}`;
    }
  }
  return data;
});

export type SettingsPatchInput = z.infer<typeof settingsPatchSchema>;
