import { cn } from "@/lib/utils";

/**
 * Citation éditoriale — une PAROLE HUMAINE, jamais une Écriture.
 *
 * Pour les versets, utiliser `ScriptureBlock`. Cette distinction évite de
 * confondre la parole de l'église avec la Parole de Dieu.
 */
export interface PullQuoteProps {
  text: string;
  /** Auteur ou fonction. Omettre si la citation n'est pas attribuée. */
  attribution?: string;
  align?: "left" | "center" | "marginal";
  onDark?: boolean;
  className?: string;
}

export function PullQuote({
  text,
  attribution,
  align = "left",
  onDark = false,
  className,
}: PullQuoteProps) {
  const centered = align === "center";
  const marginal = align === "marginal";

  return (
    <figure
      className={cn(
        marginal
          ? "border-l-2 border-ccjv-green pl-5"
          : "border-y border-ccjv-line py-9",
        centered && "text-center",
        className,
      )}
    >
      <blockquote
        className={cn(
          "font-serif",
          marginal
            ? "text-[1.05rem] leading-[1.55] italic"
            : "text-[clamp(1.35rem,0.8rem+1.8vw,2.15rem)] leading-[1.34]",
          centered && "mx-auto max-w-[30ch]",
          !marginal && !centered && "max-w-[34ch]",
          onDark ? "text-white/92" : "text-ccjv-ink",
        )}
      >
        {text}
      </blockquote>

      {attribution && (
        <figcaption
          className={cn(
            "mt-5 font-sans text-[0.7rem] font-semibold tracking-[0.18em] uppercase",
            onDark ? "text-ccjv-cream" : "text-ccjv-green",
          )}
        >
          {attribution}
        </figcaption>
      )}
    </figure>
  );
}
