/**
 * Règles de validation du formulaire public partagé.
 *
 * Fonctions **pures** et sans état : elles ne dépendent que de la configuration
 * et des valeurs saisies. Le composant se contente de décider *quand* les
 * appeler — c'est-à-dire quand une erreur a le droit d'être affichée.
 *
 * Le serveur demeure l'autorité finale : ces contrôles reprennent les bornes
 * du contrat métier pour éviter au visiteur un aller-retour inutile, jamais
 * pour s'y substituer.
 */

import {
  ANONYMITY_VALUE_KEY,
  CONSENT_VALUE_KEY,
  readTextValue,
  type PublicFieldConfig,
  type PublicSubmissionConfig,
  type SubmissionFieldErrors,
  type SubmissionValue,
  type SubmissionValues,
} from "./types";

/** Résultat complet d'une validation. */
export interface ValidationResult {
  readonly fieldErrors: SubmissionFieldErrors;
  readonly formError: string | null;
}

const NO_FIELDS: ReadonlySet<string> = new Set<string>();

/**
 * Champs masqués par la case d'anonymat à cet instant.
 *
 * Un champ masqué n'est ni validé ni transmis : sa valeur a été vidée au
 * moment de la coche, donc ce qui reste à l'écran est exactement ce qui part.
 */
export function hiddenFieldIds(
  config: PublicSubmissionConfig,
  values: SubmissionValues,
): ReadonlySet<string> {
  const declared = config.anonymity?.hidesFields;
  if (!declared || declared.length === 0) return NO_FIELDS;
  if (values[ANONYMITY_VALUE_KEY] !== true) return NO_FIELDS;
  return new Set(declared);
}

/** Valeurs initiales d'une configuration : champs vides, cases décochées. */
export function initialValues(
  config: PublicSubmissionConfig,
): SubmissionValues {
  const values: Record<string, SubmissionValue> = {};

  for (const field of config.fields) {
    values[field.id] =
      field.kind === "choice"
        ? (field.defaultValue ?? field.options[0]?.value ?? "")
        : "";
  }

  // Les deux cases sont explicitement **décochées** par défaut : ni l'anonymat
  // ni le consentement ne sont jamais pré-acceptés.
  if (config.anonymity) values[ANONYMITY_VALUE_KEY] = false;
  if (config.consent) values[CONSENT_VALUE_KEY] = false;

  return values;
}

/**
 * Applique une saisie et tire les conséquences structurelles.
 *
 * Cocher l'anonymat vide les champs qu'il masque ; décocher ne restaure rien
 * (aucune valeur n'est ressuscitée depuis un état antérieur).
 */
export function applyValue(
  config: PublicSubmissionConfig,
  values: SubmissionValues,
  fieldId: string,
  value: SubmissionValue,
): SubmissionValues {
  const next: Record<string, SubmissionValue> = { ...values, [fieldId]: value };

  for (const hiddenId of hiddenFieldIds(config, next)) {
    next[hiddenId] = "";
  }

  return next;
}

/** Valide un champ isolé et renvoie son message, ou `null` s'il est valide. */
function validateField(
  field: PublicFieldConfig,
  value: SubmissionValue | undefined,
): string | null {
  if (field.kind === "choice") {
    const selected = typeof value === "string" ? value : "";
    if (field.required && selected === "") {
      return (
        field.requiredMessage ??
        `${field.label} : merci de choisir une option.`
      );
    }
    return null;
  }

  const raw = typeof value === "string" ? value : "";
  const trimmed = raw.trim();

  if (trimmed === "") {
    if (!field.required) return null;
    return field.requiredMessage ?? `${field.label} est obligatoire.`;
  }

  if (field.minLength !== undefined && trimmed.length < field.minLength) {
    return `${field.label} doit contenir au moins ${field.minLength} caractères (${trimmed.length} pour l'instant).`;
  }

  if (field.maxLength !== undefined && raw.length > field.maxLength) {
    return `${field.label} ne peut pas dépasser ${field.maxLength} caractères (${raw.length} pour l'instant).`;
  }

  return null;
}

/** Message du consentement obligatoire, ou `null` si la case est acceptée. */
function consentError(
  config: PublicSubmissionConfig,
  values: SubmissionValues,
): string | null {
  const consent = config.consent;
  if (!consent) return null;
  if (consent.required === false) return null;
  if (values[CONSENT_VALUE_KEY] === true) return null;
  return (
    consent.errorMessage ??
    "Merci de cocher cette case pour que votre demande puisse être examinée."
  );
}

/**
 * Validation complète, utilisée à la soumission.
 *
 * Elle produit tous les messages à la fois : le visiteur voit d'un coup tout ce
 * qu'il lui reste à corriger, plutôt qu'un champ à la fois.
 */
export function validateAll(
  config: PublicSubmissionConfig,
  values: SubmissionValues,
): ValidationResult {
  const fieldErrors: Record<string, string> = {};
  const hidden = hiddenFieldIds(config, values);

  for (const field of config.fields) {
    if (hidden.has(field.id)) continue;
    const message = validateField(field, values[field.id]);
    if (message) fieldErrors[field.id] = message;
  }

  const consentMessage = consentError(config, values);
  if (consentMessage) fieldErrors[CONSENT_VALUE_KEY] = consentMessage;

  const extra = config.validate?.(values);
  if (extra?.fieldErrors) {
    for (const [id, message] of Object.entries(extra.fieldErrors)) {
      if (message) fieldErrors[id] = message;
    }
  }

  return { fieldErrors, formError: extra?.formError ?? null };
}

/**
 * Rafraîchissement ciblé après une saisie.
 *
 * Seuls les messages **déjà affichés** sont recalculés : une erreur disparaît
 * dès que le problème est corrigé, et aucune erreur nouvelle n'apparaît avant
 * que le visiteur ait tenté d'envoyer le formulaire.
 */
export function refreshShownErrors(
  config: PublicSubmissionConfig,
  values: SubmissionValues,
  shownIds: readonly string[],
): SubmissionFieldErrors {
  if (shownIds.length === 0) return {};

  const { fieldErrors } = validateAll(config, values);
  const refreshed: Record<string, string> = {};

  for (const id of shownIds) {
    const message = fieldErrors[id];
    if (message) refreshed[id] = message;
  }

  return refreshed;
}

/** Première clé en erreur dans l'ordre d'affichage (pour le focus). */
export function firstErrorKey(
  config: PublicSubmissionConfig,
  fieldErrors: SubmissionFieldErrors,
): string | null {
  for (const field of config.fields) {
    if (fieldErrors[field.id]) return field.id;
  }
  if (config.anonymity && fieldErrors[ANONYMITY_VALUE_KEY]) {
    return ANONYMITY_VALUE_KEY;
  }
  if (config.consent && fieldErrors[CONSENT_VALUE_KEY]) {
    return CONSENT_VALUE_KEY;
  }
  return null;
}

/** Longueur du texte saisi, bornes affichées à côté du champ concerné. */
export function currentLength(values: SubmissionValues, fieldId: string): number {
  return readTextValue(values, fieldId).length;
}
