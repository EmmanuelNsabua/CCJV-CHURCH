/**
 * Point d'entrée du formulaire public partagé.
 *
 * ```tsx
 * import {
 *   PublicSubmissionForm,
 *   readTextValue,
 *   type PublicSubmissionConfig,
 * } from "@/components/forms/publicSubmission";
 * ```
 *
 * Chaque usage (témoignage, intention de prière…) déclare sa configuration et
 * monte `<PublicSubmissionForm config={…} />` : aucune présentation commune
 * n'est dupliquée d'un formulaire à l'autre.
 */

export { PublicSubmissionForm } from "./PublicSubmissionForm";
export type { PublicSubmissionFormProps } from "./PublicSubmissionForm";

export {
  ANONYMITY_VALUE_KEY,
  CONSENT_VALUE_KEY,
  readBooleanValue,
  readTextValue,
  type AnonymityConfig,
  type ChoiceFieldConfig,
  type ChoiceOption,
  type ConsentConfig,
  type ErrorMessagesConfig,
  type PublicFieldConfig,
  type PublicSubmissionConfig,
  type SuccessConfig,
  type SubmissionFieldErrors,
  type SubmissionValue,
  type SubmissionValues,
  type TextareaFieldConfig,
  type TextFieldConfig,
  type ValidationOutcome,
} from "./types";
