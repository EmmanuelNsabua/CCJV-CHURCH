"use client";

import React, { useId } from "react";
import { cn } from "@/lib/utils";

export interface FormFieldProps {
  /** Libellé visible du champ */
  label: string;
  /** Identifiant HTML du contrôle associé (généré automatiquement si omis) */
  htmlFor?: string;
  /** Message d'erreur de validation */
  error?: string | null;
  /** Texte d'aide ou indication sous le champ */
  hint?: string;
  /** Indique si le champ est obligatoire */
  required?: boolean;
  /** Classes CSS supplémentaires pour le conteneur englobant */
  className?: string;
  /** Le contrôle interactif */
  children: React.ReactNode;
}

export function FormField({
  label,
  htmlFor: explicitId,
  error,
  hint,
  required = false,
  className,
  children,
}: FormFieldProps) {
  const generatedId = useId();
  const id = explicitId || generatedId;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  return (
    <div className={cn("space-y-1.5 flex flex-col", className)}>
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-xs font-semibold text-ccjv-ink font-sans tracking-wide">
          {label}
          {required && <span className="text-[#b91c1c] ml-1 font-bold" aria-hidden="true">*</span>}
        </label>
      </div>

      <div className="relative">
        {React.isValidElement(children)
          ? React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
              id,

              required,
              "aria-invalid": error ? "true" : undefined,
              "aria-describedby": [
                hint ? hintId : null,
                error ? errorId : null,
              ]
                .filter(Boolean)
                .join(" ") || undefined,
            })
          : children}
      </div>

      {hint && !error && (
        <p id={hintId} className="text-xs text-ccjv-ink-secondary font-sans">
          {hint}
        </p>
      )}

      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-[#b91c1c] font-sans flex items-center gap-1">
          {error}
        </p>
      )}
    </div>
  );
}
