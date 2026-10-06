import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Le rythme vertical de CCJV.
 *
 * `Band` remplace l'usage systématique de `Section` : elle porte le TON et la
 * RESPIRATION, jamais l'ordre du contenu. C'est ce qui permet à deux pages
 * d'utiliser le même vocabulaire sans produire la même silhouette.
 *
 * Voir docs/015-architecture_editoriale.md §2.1.
 */

export type BandTone =
  | "light"
  | "cream"
  | "tinted"
  | "dark"
  | "green"
  | "bare";

export type BandSpace =
  | "flush"
  | "tight"
  | "normal"
  | "airy"
  | "silence";

export type BandWidth = "container" | "wide" | "full";

const toneClass: Record<BandTone, string> = {
  light: "bg-ccjv-offwhite text-ccjv-ink",
  cream: "bg-ccjv-cream text-ccjv-ink",
  tinted: "bg-ccjv-green-soft text-ccjv-ink",
  dark: "bg-ccjv-black text-white",
  green: "bg-ccjv-green text-white",
  bare: "",
};

const spaceClass: Record<BandSpace, string> = {
  flush: "",
  tight: "py-12 max-md:py-9",
  normal: "py-20 max-md:py-14",
  airy: "py-28 max-md:py-18",
  silence: "py-36 max-md:py-24",
};

const widthClass: Record<BandWidth, string> = {
  container: "mx-auto w-full max-w-[1200px] px-[clamp(16px,4vw,48px)]",
  wide: "mx-auto w-full max-w-[1480px] px-[clamp(16px,3vw,40px)]",
  full: "w-full",
};

export interface BandProps {
  tone?: BandTone;
  space?: BandSpace;
  width?: BandWidth;
  /** Filet de séparation — hairline, jamais une ombre. */
  rule?: "top" | "bottom" | "both";
  id?: string;
  className?: string;
  innerClassName?: string;
  children: ReactNode;
  "aria-labelledby"?: string;
  "aria-label"?: string;
}

export function Band({
  tone = "light",
  space = "normal",
  width = "container",
  rule,
  id,
  className,
  innerClassName,
  children,
  ...rest
}: BandProps) {
  const onDeepTone = tone === "dark" || tone === "green";
  const ruleColor = onDeepTone ? "border-white/12" : "border-ccjv-line";

  return (
    <section
      id={id}
      className={cn(
        "relative",
        toneClass[tone],
        spaceClass[space],
        rule === "top" && cn("border-t", ruleColor),
        rule === "bottom" && cn("border-b", ruleColor),
        rule === "both" && cn("border-y", ruleColor),
        className,
      )}
      {...rest}
    >
      <div className={cn(widthClass[width], innerClassName)}>{children}</div>
    </section>
  );
}
