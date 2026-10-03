import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type SectionTone = "light" | "dark" | "tinted" | "green";

const toneClass: Record<SectionTone, string> = {
  light: "bg-ccjv-offwhite text-ccjv-ink",
  dark: "bg-ccjv-black text-white",
  tinted: "bg-ccjv-green-soft text-ccjv-ink",
  green: "bg-ccjv-green text-white",
};

export interface SectionProps {
  id?: string;
  tone?: SectionTone;
  /** `false` → pleine largeur (sans container). */
  contained?: boolean;
  className?: string;
  "aria-labelledby"?: string;
  children: ReactNode;
}

export function Section({
  id,
  tone = "light",
  contained = true,
  className,
  children,
  ...rest
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn("py-24 max-md:py-16", toneClass[tone], className)}
      {...rest}
    >
      {contained ? <div className="container">{children}</div> : children}
    </section>
  );
}
