"use client";

import React, { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full h-10 px-3 py-2 bg-white border rounded-none font-sans text-sm text-ccjv-ink",
          "placeholder:text-ccjv-ink-secondary/60 transition-colors",
          "focus:outline-none focus:border-ccjv-green focus:ring-1 focus:ring-ccjv-green",
          "disabled:bg-ccjv-offwhite disabled:text-ccjv-ink-secondary/50 disabled:cursor-not-allowed",
          error ? "border-[#b91c1c] focus:border-[#b91c1c] focus:ring-[#b91c1c]" : "border-ccjv-line",
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";
