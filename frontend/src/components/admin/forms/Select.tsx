"use client";

import React, { forwardRef, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options?: SelectOption[];
  error?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, children, error, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <select
          ref={ref}
          className={cn(
            "w-full h-10 pl-3 pr-9 py-2 bg-white border rounded-none font-sans text-sm text-ccjv-ink appearance-none cursor-pointer",
            "transition-colors focus:outline-none focus:border-ccjv-green focus:ring-1 focus:ring-ccjv-green",
            "disabled:bg-ccjv-offwhite disabled:text-ccjv-ink-secondary/50 disabled:cursor-not-allowed",
            error ? "border-[#b91c1c] focus:border-[#b91c1c] focus:ring-[#b91c1c]" : "border-ccjv-line",
            className,
          )}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-ccjv-ink-secondary">
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        </div>
      </div>
    );
  },
);

Select.displayName = "Select";
