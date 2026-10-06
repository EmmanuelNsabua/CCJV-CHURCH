import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Corps de texte long, à mesure maîtrisée.
 *
 * Les enfants doivent être des `<p>`, `<ul>`, `<h3>` — la mise en forme est
 * portée par `.prose-body` (globals.css) plutôt que par une classe sur chaque
 * paragraphe. La lettrine est rare : réservée à l'ouverture d'une page.
 */
export interface ProseProps {
  children: ReactNode;
  /** Paragraphes en corps de lecture (18px) plutôt qu'en texte courant. */
  large?: boolean;
  /** Lettrine sur le premier paragraphe. */
  dropcap?: boolean;
  width?: "narrow" | "normal" | "wide";
  /** Texte clair sur fond sombre. */
  onDark?: boolean;
  className?: string;
}

const widthClass = {
  narrow: "max-w-[56ch]",
  normal: "max-w-[68ch]",
  wide: "max-w-[80ch]",
} as const;

export function Prose({
  children,
  large = false,
  dropcap = false,
  width = "normal",
  onDark = false,
  className,
}: ProseProps) {
  return (
    <div
      className={cn(
        "prose-body",
        widthClass[width],
        large
          ? "text-[1.0625rem] leading-[1.75]"
          : "text-[0.9875rem] leading-[1.72]",
        onDark ? "text-white/72" : "text-ccjv-ink-secondary",
        dropcap && "prose-dropcap",
        className,
      )}
    >
      {children}
    </div>
  );
}
