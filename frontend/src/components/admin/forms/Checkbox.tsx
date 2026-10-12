"use client";

import React, { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: React.ReactNode;
  hint?: string;
  error?: string | null;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, hint, error, id, ...props }, ref) => {
    return (
      <div className="flex items-start gap-2.5">
        <div className="flex h-5 items-center">
          <input
            id={id}
            ref={ref}
            type="checkbox"
            className={cn(
              "h-4 w-4 rounded-none border-ccjv-line text-ccjv-green focus:ring-ccjv-green focus:ring-offset-0 transition cursor-pointer",
              error ? "border-[#b91c1c]" : "border-ccjv-line",
              className,
            )}
            {...props}
          />
        </div>
        {(label || hint) && (
          <div className="flex flex-col">
            {label && (
              <label htmlFor={id} className="text-xs font-medium text-ccjv-ink cursor-pointer select-none">
                {label}
              </label>
            )}
            {hint && <p className="text-[11px] text-ccjv-ink-secondary">{hint}</p>}
            {error && <p className="text-[11px] text-[#b91c1c] font-medium">{error}</p>}
          </div>
        )}
      </div>
    );
  },
);

Checkbox.displayName = "Checkbox";
