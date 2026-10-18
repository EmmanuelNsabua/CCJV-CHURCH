"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Button } from "@/components/ui/Button";
import { CrossMark } from "@/components/shared/CrossMark";
import Image from "next/image";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { FieldControl } from "./FieldControl";
import {
  ANONYMITY_VALUE_KEY,
  CONSENT_VALUE_KEY,
  type PublicFieldConfig,
  type PublicSubmissionConfig,
  type SubmissionFieldErrors,
  type SubmissionValue,
  type SubmissionValues,
} from "./types";
import {
  applyValue,
  firstErrorKey,
  initialValues,
  refreshShownErrors,
  validateAll,
} from "./validation";

/**
 * Section publique de dépôt (témoignage, intention de prière, …).
 *
 * Le composant n'est pas « un formulaire posé dans le flux » : il rend une
 * **section autonome** (`<section>` + `min-h-screen`), placée directement sous
 * `<main>` et jamais imbriquée dans une autre section. La colonne gauche porte
 * le panneau visuel (titre + introduction, ou photographie + titre), la colonne
 * droite les champs ; l'ensemble est centré verticalement dans la hauteur
 * d'écran.
 *
 * Il porte **une seule fois** tout ce qui est commun : conteneur, panneau
 * visuel, champs, anonymat, consentement, bouton, états de chargement, retours
 * utilisateur, gestion du focus et annonces lecteur d'écran. Il ne contient
 * aucune règle métier : celles-ci vivent dans la `PublicSubmissionConfig` de
 * chaque usage (champs, validation, service de soumission).
 *
 * Comportements garantis :
 * - validation à la soumission uniquement ; une erreur déjà affichée est
 *   réactualisée à la saisie et disparaît dès que le problème est corrigé ;
 * - le formulaire n'est **jamais vidé** avant confirmation du succès ;
 * - une soumission en cours verrouille le bouton (aucun double envoi) ;
 * - un échec technique conserve les données saisies et n'expose aucun détail
 *   interne ;
 * - le panneau de confirmation distingue la réception de la publication.
 */
export interface PublicSubmissionFormProps {
  readonly config: PublicSubmissionConfig;
  /** Classes de la section englobante (fond, marges) si un usage le requiert. */
  readonly className?: string;
  /**
   * Contenu additionnel du panneau de confirmation (verset, contact direct…).
   *
   * Reçoit les valeurs soumises, car un message de suivi peut en dépendre
   * (par exemple un lien pré-rempli).
   */
  readonly renderSuccessExtra?: (values: SubmissionValues) => ReactNode;
}

type Phase = "form" | "success";

const RED_SURFACE =
  "border border-[#b91c1c]/30 bg-[#fef2f2] px-4 py-3 font-sans text-[0.875rem] leading-relaxed text-[#7f1d1d]";

/** Ligne de case à cocher : une case et son texte, sans encadré. */
const checkboxRowClass = "flex items-start gap-3";

const checkboxClass =
  "mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-ccjv-green";

/**
 * Regroupe les champs par ligne d'affichage.
 *
 * Deux champs `width: "half"` **consécutifs** partagent une ligne ; tout autre
 * champ occupe la sienne. Le regroupement est purement géométrique : il ne
 * connaît aucun libellé et n'a donc pas à changer quand un formulaire évolue.
 */
function groupFieldRows(
  fields: readonly PublicFieldConfig[],
): PublicFieldConfig[][] {
  const rows: PublicFieldConfig[][] = [];
  let pending: PublicFieldConfig[] = [];

  for (const field of fields) {
    if (field.width === "half") {
      pending.push(field);
      if (pending.length === 2) {
        rows.push([pending[0], pending[1]]);
        pending = [];
      }
      continue;
    }

    if (pending.length > 0) {
      rows.push(pending);
      pending = [];
    }
    rows.push([field]);
  }

  if (pending.length > 0) rows.push(pending);

  return rows;
}

/** Traduit une panne en message compréhensible, sans détail interne. */
function resolveErrorMessage(
  config: PublicSubmissionConfig,
  error: unknown,
): string {
  if (error instanceof ApiError && error.status === 429) {
    return config.errorMessages.rateLimited ?? config.errorMessages.generic;
  }
  return config.errorMessages.generic;
}

export function PublicSubmissionForm({
  config,
  className,
  renderSuccessExtra,
}: PublicSubmissionFormProps) {
  const [values, setValues] = useState<SubmissionValues>(() =>
    initialValues(config),
  );
  const [fieldErrors, setFieldErrors] = useState<SubmissionFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phase, setPhase] = useState<Phase>("form");

  const formRef = useRef<HTMLFormElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const submitLock = useRef(false);
  const restoreFocus = useRef(false);

  // Le focus accompagne le changement d'état : panneau de confirmation à
  // l'envoi, premier champ après une remise à zéro. Sans cela, le focus
  // retomberait sur le document et le clavier perdrait le fil.
  useEffect(() => {
    if (phase === "success") {
      successRef.current?.focus();
      return;
    }
    if (restoreFocus.current) {
      restoreFocus.current = false;
      const firstControl = formRef.current?.querySelector<
        HTMLInputElement | HTMLTextAreaElement
      >("input:not([type='checkbox']), textarea");
      firstControl?.focus();
    }
  }, [phase]);

  const handleChange = useCallback(
    (fieldId: string, value: SubmissionValue) => {
      const next = applyValue(config, values, fieldId, value);
      setValues(next);
      // Seules les erreurs déjà visibles sont recalculées : aucune erreur
      // nouvelle n'apparaît pendant la saisie.
      setFieldErrors((current) =>
        refreshShownErrors(config, next, Object.keys(current)),
      );
      setFormError(null);
    },
    [config, values],
  );

  /** Place le focus sur le premier champ en défaut (message lu à la suite). */
  const focusField = (fieldId: string | null) => {
    if (fieldId === null) return;
    const target = formRef.current?.querySelector<HTMLElement>(
      `[data-field="${fieldId}"] input, [data-field="${fieldId}"] textarea`,
    );
    target?.focus();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitLock.current) return;

    const { fieldErrors: errors, formError: globalError } = validateAll(
      config,
      values,
    );
    setFieldErrors(errors);
    setFormError(globalError);

    const firstKey = firstErrorKey(config, errors);
    if (firstKey !== null || globalError !== null) {
      focusField(firstKey);
      return;
    }

    submitLock.current = true;
    setIsSubmitting(true);

    try {
      await config.submit(values);
      setPhase("success");
    } catch (error) {
      setFormError(resolveErrorMessage(config, error));
    } finally {
      submitLock.current = false;
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    restoreFocus.current = true;
    setValues(initialValues(config));
    setFieldErrors({});
    setFormError(null);
    setPhase("form");
  };

  const titleId = `${config.id}-form-titre`;
  const fieldRows = groupFieldRows(config.fields);

  /**
   * Panneau de gauche — deux variantes explicites, jamais un mélange.
   *
   * Il reste affiché après l'envoi, pour que la confirmation apparaisse dans le
   * prolongement de l'invitation plutôt qu'en remplacement de la page.
   */
  const panel =
    config.visual.kind === "image" ? (
      <div className="relative aspect-[16/11] w-full overflow-hidden bg-ccjv-black lg:aspect-[4/5]">
        <Image
          src={config.visual.image.src}
          alt={config.visual.image.alt}
          fill
          sizes="(max-width: 1024px) 100vw, 40vw"
          className="object-cover"
        />
        {/* Voile sombre : garantit le contraste du titre en blanc, quelle que
            soit la photographie affichée. */}
        <div className="absolute inset-0 bg-gradient-to-t from-ccjv-black/90 via-ccjv-black/35 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
          {config.visual.eyebrow && (
            <p className="mb-2 font-sans text-[0.7rem] font-semibold tracking-[0.16em] text-ccjv-cream uppercase">
              {config.visual.eyebrow}
            </p>
          )}
          <h2
            id={titleId}
            className="font-serif text-[clamp(1.75rem,1.25rem+1.6vw,2.6rem)] leading-[1.12] text-white"
          >
            {config.title}
          </h2>
        </div>
      </div>
    ) : (
      <div>
        {config.visual.eyebrow && (
          <p className="font-sans text-[0.7rem] font-semibold tracking-[0.16em] text-ccjv-green uppercase">
            {config.visual.eyebrow}
          </p>
        )}
        <h2
          id={titleId}
          className={cn(
            "font-serif text-[clamp(1.85rem,1.3rem+2vw,2.9rem)] leading-[1.1] text-ccjv-ink",
            config.visual.eyebrow ? "mt-3" : undefined,
          )}
        >
          {config.title}
        </h2>
        <p className="mt-6 max-w-[44ch] font-sans text-[1.0625rem] leading-[1.8] text-ccjv-ink-secondary">
          {config.visual.intro}
        </p>
      </div>
    );

  const anonymity = config.anonymity;
  const anonymityId = `${config.id}-${ANONYMITY_VALUE_KEY}`;
  const consent = config.consent;
  const consentId = `${config.id}-${CONSENT_VALUE_KEY}`;
  const consentError = fieldErrors[CONSENT_VALUE_KEY] ?? null;

  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        "flex min-h-screen w-full items-center border-b border-ccjv-line px-6 pt-28 pb-16 sm:px-12 lg:px-20 lg:pt-32 lg:pb-20",
        className,
      )}
    >
      <div className="mx-auto w-full max-w-7xl">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-x-14">
          <div className="lg:col-span-5">{panel}</div>

          <div className="lg:col-span-7 lg:border-l lg:border-ccjv-line lg:pl-14">
            {phase === "success" ? (
              <div
                ref={successRef}
                role="status"
                tabIndex={-1}
                className="focus:outline-none"
              >
                <div className="flex h-12 w-12 items-center justify-center border border-ccjv-green/30 bg-ccjv-green-soft text-ccjv-green">
                  <CrossMark size="md" />
                </div>

                <h3 className="mt-6 font-serif text-[1.5rem] leading-[1.2] text-ccjv-ink sm:text-[1.75rem]">
                  {config.success.title}
                </h3>

                <p className="mt-4 max-w-[46ch] font-sans text-[0.9375rem] leading-[1.8] text-ccjv-ink-secondary">
                  {config.success.message}
                </p>

                {renderSuccessExtra && (
                  <div className="mt-7">{renderSuccessExtra(values)}</div>
                )}

                <div className="mt-8">
                  <Button variant="outline" size="md" onClick={handleReset}>
                    {config.success.resetLabel}
                  </Button>
                </div>
              </div>
            ) : (
              <form
                ref={formRef}
                noValidate
                onSubmit={handleSubmit}
                aria-labelledby={titleId}
                className="space-y-5"
              >
                {fieldRows.map((row) =>
                  row.length === 1 ? (
                    <FieldControl
                      key={row[0].id}
                      field={row[0]}
                      value={values[row[0].id] ?? ""}
                      error={fieldErrors[row[0].id] ?? null}
                      baseId={config.id}
                      onChange={(value) => handleChange(row[0].id, value)}
                    />
                  ) : (
                    <div
                      key={row.map((field) => field.id).join("-")}
                      className="grid grid-cols-1 gap-5 sm:grid-cols-2"
                    >
                      {row.map((field) => (
                        <FieldControl
                          key={field.id}
                          field={field}
                          value={values[field.id] ?? ""}
                          error={fieldErrors[field.id] ?? null}
                          baseId={config.id}
                          onChange={(value) => handleChange(field.id, value)}
                        />
                      ))}
                    </div>
                  ),
                )}

                {anonymity && (
                  <div
                    data-field={ANONYMITY_VALUE_KEY}
                    data-invalid={
                      fieldErrors[ANONYMITY_VALUE_KEY] ? "true" : undefined
                    }
                    className={checkboxRowClass}
                  >
                    <input
                      type="checkbox"
                      id={anonymityId}
                      checked={values[ANONYMITY_VALUE_KEY] === true}
                      onChange={(event) =>
                        handleChange(ANONYMITY_VALUE_KEY, event.target.checked)
                      }
                      aria-describedby={
                        anonymity.hint ? `${anonymityId}-hint` : undefined
                      }
                      className={checkboxClass}
                    />
                    <div className="min-w-0">
                      <label
                        htmlFor={anonymityId}
                        className="cursor-pointer font-sans text-[0.9375rem] leading-snug text-ccjv-ink"
                      >
                        {anonymity.label}
                      </label>
                      {anonymity.hint && (
                        <p
                          id={`${anonymityId}-hint`}
                          className="mt-1 font-sans text-[0.8125rem] leading-relaxed text-ccjv-ink-secondary"
                        >
                          {anonymity.hint}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {consent && (
                  <div
                    data-field={CONSENT_VALUE_KEY}
                    data-invalid={consentError ? "true" : undefined}
                    className={checkboxRowClass}
                  >
                    <input
                      type="checkbox"
                      id={consentId}
                      checked={values[CONSENT_VALUE_KEY] === true}
                      aria-required={
                        consent.required === false ? undefined : true
                      }
                      aria-invalid={consentError ? "true" : undefined}
                      aria-describedby={
                        consentError ? `${consentId}-error` : undefined
                      }
                      onChange={(event) =>
                        handleChange(CONSENT_VALUE_KEY, event.target.checked)
                      }
                      className={checkboxClass}
                    />
                    <div className="min-w-0">
                      <label
                        htmlFor={consentId}
                        className="cursor-pointer font-sans text-[0.9375rem] leading-snug text-ccjv-ink"
                      >
                        {consent.label}
                        {consent.required !== false && (
                          <>
                            <span
                              aria-hidden="true"
                              className="ml-1 text-ccjv-green"
                            >
                              *
                            </span>
                            <span className="sr-only"> (obligatoire)</span>
                          </>
                        )}
                      </label>
                      {consentError && (
                        <p
                          id={`${consentId}-error`}
                          className="mt-1.5 font-sans text-[0.8125rem] font-medium leading-relaxed text-[#b91c1c]"
                        >
                          {consentError}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {formError && (
                  <div role="alert" className={RED_SURFACE}>
                    {formError}
                  </div>
                )}

                <div className="pt-1">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    loading={isSubmitting}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto sm:min-w-[17rem]"
                  >
                    {isSubmitting
                      ? config.submittingLabel
                      : config.submitLabel}
                  </Button>

                  <p role="status" aria-live="polite" className="sr-only">
                    {isSubmitting ? config.submittingLabel : ""}
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
