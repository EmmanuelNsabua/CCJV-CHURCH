import { cn } from "@/lib/utils";

/**
 * Emplacement explicitement en attente de contenu institutionnel CCJV.
 *
 * Principe (docs/015 §5) : une information institutionnelle non fournie
 * n'est JAMAIS inventée. On laisse un emplacement identifié, visible et
 * assumé, plutôt qu'un texte plausible mais faux.
 */
export interface ContentPendingProps {
  /** Ce qui manque, en clair : « Confession de foi », « Témoignages réels ». */
  what: string;
  /** Ce qu'il faut fournir pour remplir l'emplacement. */
  hint?: string;
  variant?: "block" | "inline";
  className?: string;
}

export function ContentPending({
  what,
  hint,
  variant = "block",
  className,
}: ContentPendingProps) {
  if (variant === "inline") {
    return (
      <p
        className={cn(
          "border-l-2 border-dashed border-ccjv-green/50 py-1 pl-4 font-sans text-[0.85rem] leading-relaxed text-ccjv-ink-secondary",
          className,
        )}
      >
        <span className="font-semibold tracking-[0.08em] text-ccjv-green uppercase">
          TODO
        </span>{" "}
        — {what} à fournir.
        {hint && <span className="mt-1 block">{hint}</span>}
      </p>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-2 border border-dashed border-ccjv-green/40 px-7 py-8",
        className,
      )}
    >
      <p className="font-sans text-[0.68rem] font-semibold tracking-[0.2em] text-ccjv-green uppercase">
        TODO — {what} à fournir
      </p>
      {hint && (
        <p className="max-w-[52ch] font-sans text-[0.88rem] leading-relaxed text-ccjv-ink-secondary">
          {hint}
        </p>
      )}
    </div>
  );
}
