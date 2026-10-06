import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps {
  variant?: "default" | "dark" | "outline";
  className?: string;
  children: ReactNode;
}

const base =
  "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-[3px] font-sans text-[0.7rem] font-semibold uppercase leading-[1.4] tracking-[0.06em]";

const variants: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default: "bg-ccjv-green-soft text-ccjv-green",
  dark: "bg-ccjv-black text-ccjv-cream",
  outline: "border border-ccjv-line bg-transparent text-ccjv-ink-secondary",
};

export function Badge({ variant = "default", className, children }: BadgeProps) {
  return (
    <span className={cn(base, variants[variant], className)}>{children}</span>
  );
}
