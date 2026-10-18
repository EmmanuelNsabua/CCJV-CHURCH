"use client";

import type { ChangeEvent } from "react";
import { cn } from "@/lib/utils";
import type { PublicFieldConfig, SubmissionValue } from "./types";

/**
 * Rendu d'un champ déclaratif.
 *
 * Les contrôles sont **natifs** (input, textarea, radio) et stylés avec les
 * jetons du design system : aucune bibliothèque de formulaire, conformément à
 * `docs/037` §5.3 et à `GEMINI.md` §3.4.
 *
 * Chaque champ est lié de façon explicite à son libellé, à son texte d'aide et
 * à son message d'erreur (`htmlFor`, `aria-describedby`, `aria-invalid`),
 * exactement selon le contrat d'accessibilité du projet.
 */

export interface FieldControlProps {
  readonly field: PublicFieldConfig;
  readonly value: SubmissionValue;
  readonly error: string | null;
  /** Identifiant de base, préfixé par l'instance de formulaire. */
  readonly baseId: string;
  readonly onChange: (value: SubmissionValue) => void;
}

/**
 * Styles communs des zones de saisie.
 *
 * Teintes issues des jetons CCJV (`--color-ccjv-line`, `--color-ccjv-green`).
 * L'anneau de focus est fourni globalement par `globals.css`
 * (`:focus-visible { outline: 2px solid … }`) : on ne le neutralise jamais.
 */
const controlBase =
  "block w-full rounded-none border-b bg-transparent focus:outline-none px-3.5 font-sans text-[0.9375rem] leading-[1.65] text-inherit transition-colors duration-200 placeholder:text-current placeholder:opacity-55";

function controlTone(error: string | null): string {
  return error
    ? "border-b-[#b91c1c] focus:border-b-[#b91c1c]"
    : "border-current/50 hover:border-current/70 focus:border-b-ccjv-green";
}

const labelClass =
  "block font-sans text-sm font-medium leading-snug text-ccjv-ink";

const hintClass =
  "font-sans text-[0.8125rem] leading-relaxed text-ccjv-ink-secondary";

const errorClass =
  "font-sans text-[0.8125rem] leading-relaxed font-medium text-[#b91c1c]";

const counterClass =
  "shrink-0 font-sans text-[0.75rem] tabular-nums text-ccjv-ink-secondary/80";

/** Astérisque visuelle doublée d'un texte lu par les lecteurs d'écran. */
function RequiredMark({ required }: { required: boolean }) {
  if (!required) return null;
  return (
    <>
      <span aria-hidden="true" className="ml-1 text-ccjv-green">
        *
      </span>
      <span className="sr-only"> (obligatoire)</span>
    </>
  );
}

function describedBy(
  hintId: string | null,
  errorId: string | null,
): string | undefined {
  const ids = [hintId, errorId].filter((id): id is string => Boolean(id));
  return ids.length > 0 ? ids.join(" ") : undefined;
}

export function FieldControl({
  field,
  value,
  error,
  baseId,
  onChange,
}: FieldControlProps) {
  const controlId = `${baseId}-${field.id}`;
  const hintId = field.hint ? `${controlId}-hint` : null;
  const errorId = error ? `${controlId}-error` : null;
  const description = describedBy(hintId, errorId);
  const required = field.required === true;

  if (field.kind === "choice") {
    const selected = typeof value === "string" ? value : "";
    const inline = field.orientation === "inline";

    return (
      <fieldset
        data-field={field.id}
        data-invalid={error ? "true" : undefined}
        aria-describedby={description}
        aria-invalid={error ? "true" : undefined}
      >
        <legend className={labelClass}>
          {field.label}
          <RequiredMark required={required} />
        </legend>

        <div
          className={cn(
            "mt-2.5",
            inline
              ? "flex flex-wrap items-center gap-x-6 gap-y-2"
              : "space-y-2.5",
          )}
        >
          {field.options.map((option) => {
            const optionId = `${controlId}-${option.value}`;
            const isSelected = selected === option.value;

            // Variante compacte : une simple ligne « bouton + libellé ».
            if (inline) {
              return (
                <label
                  key={option.value}
                  htmlFor={optionId}
                  className="flex cursor-pointer items-center gap-2.5"
                >
                  <input
                    type="radio"
                    id={optionId}
                    name={controlId}
                    value={option.value}
                    checked={isSelected}
                    onChange={() => onChange(option.value)}
                    className="h-4 w-4 shrink-0 cursor-pointer accent-ccjv-green"
                  />
                  <span className="font-sans text-[0.9375rem] leading-snug text-ccjv-ink">
                    {option.label}
                  </span>
                </label>
              );
            }

            return (
              <label
                key={option.value}
                htmlFor={optionId}
                className={cn(
                  "flex cursor-pointer items-start gap-3 border px-3.5 py-3 transition-colors duration-200",
                  isSelected
                    ? "border-ccjv-green/45 bg-ccjv-green-soft"
                    : "border-ccjv-line bg-white hover:border-ccjv-ink-secondary/45",
                )}
              >
                <input
                  type="radio"
                  id={optionId}
                  name={controlId}
                  value={option.value}
                  checked={isSelected}
                  onChange={() => onChange(option.value)}
                  className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-ccjv-green"
                />
                <span className="min-w-0">
                  <span className="block font-sans text-sm leading-snug text-ccjv-ink">
                    {option.label}
                  </span>
                  {option.description && (
                    <span className={cn("mt-0.5 block", hintClass)}>
                      {option.description}
                    </span>
                  )}
                </span>
              </label>
            );
          })}
        </div>

        {field.hint && (
          <p id={hintId ?? undefined} className={cn("mt-2", hintClass)}>
            {field.hint}
          </p>
        )}

        {error && (
          <p id={errorId ?? undefined} className={cn("mt-2", errorClass)}>
            {error}
          </p>
        )}
      </fieldset>
    );
  }

  const text = typeof value === "string" ? value : "";
  const showCounter =
    field.maxLength !== undefined && field.kind === "textarea";

  return (
    <div
      data-field={field.id}
      data-invalid={error ? "true" : undefined}
      className="space-y-1.5"
    >
      <label htmlFor={controlId} className={labelClass}>
        {field.label}
        <RequiredMark required={required} />
      </label>

      {field.kind === "text" ? (
        <input
          type="text"
          id={controlId}
          value={text}
          required={required}
          aria-required={required || undefined}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={description}
          autoComplete={field.autoComplete}
          placeholder={field.placeholder}
          minLength={field.minLength}
          maxLength={field.maxLength}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            onChange(event.target.value)
          }
          className={cn(controlBase, controlTone(error), "h-11 py-2")}
        />
      ) : (
        <textarea
          id={controlId}
          value={text}
          required={required}
          aria-required={required || undefined}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={description}
          placeholder={field.placeholder}
          rows={field.rows ?? 7}
          minLength={field.minLength}
          maxLength={field.maxLength}
          onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
            onChange(event.target.value)
          }
          className={cn(
            controlBase,
            controlTone(error),
            "min-h-[9.5rem] resize-y py-3",
          )}
        />
      )}

      {(field.hint || showCounter) && (
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          {field.hint ? (
            <p id={hintId ?? undefined} className={cn(hintClass, "min-w-0")}>
              {field.hint}
            </p>
          ) : (
            <span />
          )}
          {showCounter && (
            <span className={counterClass} aria-hidden="true">
              {text.length} / {field.maxLength}
            </span>
          )}
        </div>
      )}

      {error && (
        <p id={errorId ?? undefined} className={errorClass}>
          {error}
        </p>
      )}
    </div>
  );
}
