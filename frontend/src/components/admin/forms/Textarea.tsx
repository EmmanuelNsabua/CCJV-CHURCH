"use client";

import React, { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "w-full min-h-[100px] px-3 py-2 bg-white border rounded-none font-sans text-sm text-ccjv-ink resize-y",
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

Textarea.displayName = "Textarea";
