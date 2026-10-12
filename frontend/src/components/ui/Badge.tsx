import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "default"
  | "dark"
  | "outline"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "neutral";

export interface BadgeProps {
  variant?: BadgeVariant;
  className?: string;
  children: ReactNode;
}

const base =
  "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-[3px] font-sans text-[0.7rem] font-semibold uppercase leading-[1.4] tracking-[0.06em]";

const variants: Record<BadgeVariant, string> = {
  default: "bg-ccjv-green-soft text-ccjv-green",
  dark: "bg-ccjv-black text-ccjv-cream",
  outline: "border border-ccjv-line bg-transparent text-ccjv-ink-secondary",
  success: "bg-[#eaf3ea] text-[#1e7a1e] border border-[#1e7a1e]/20",
  warning: "bg-[#fffbeb] text-[#b45309] border border-[#fde68a]",
  error: "bg-[#fef2f2] text-[#b91c1c] border border-[#fecaca]",
  info: "bg-[#eff6ff] text-[#1d4ed8] border border-[#bfdbfe]",
  neutral: "bg-[#f3f2ee] text-[#5e5d59] border border-[#e5e2d9]",
};

export function Badge({ variant = "default", className, children }: BadgeProps) {
  return (
    <span className={cn(base, variants[variant], className)}>{children}</span>
  );
}
