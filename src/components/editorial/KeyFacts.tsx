import { cn } from "@/lib/utils";

/**
 * Informations factuelles mises en forme.
 *
 * `pairs`  — libellé / valeur sur deux colonnes, filets horizontaux
 * `tiles`  — valeurs en grand corps dans des cases
 * `inline` — une seule ligne, séparateurs verticaux
 */
export type KeyFactsVariant = "pairs" | "tiles" | "inline";

export interface KeyFact {
  label: string;
  value: string;
  hint?: string;
}

export interface KeyFactsProps {
  items: readonly KeyFact[];
  variant?: KeyFactsVariant;
  onDark?: boolean;
  className?: string;
}

export function KeyFacts({
  items,
  variant = "pairs",
  onDark = false,
  className,
}: KeyFactsProps) {
  if (items.length === 0) return null;

  const line = onDark ? "border-white/15" : "border-ccjv-line";
  const muted = onDark ? "text-white/60" : "text-ccjv-ink-secondary";

  if (variant === "inline") {
    return (
      <dl
        className={cn(
          "flex flex-wrap items-center gap-x-8 gap-y-3 font-sans text-[0.92rem]",
          className,
        )}
      >
        {items.map((item) => (
          <div key={item.label} className="flex items-baseline gap-2">
            <dt
              className={cn(
                "text-[0.68rem] font-semibold tracking-[0.16em] uppercase",
                muted,
              )}
            >
              {item.label}
            </dt>
            <dd className="font-medium">{item.value}</dd>
          </div>
        ))}
      </dl>
    );
  }

  if (variant === "tiles") {
    return (
      <dl
        className={cn(
          "grid grid-cols-1 gap-px border sm:grid-cols-2 lg:grid-cols-3",
          line,
          onDark ? "bg-white/15" : "bg-ccjv-line",
          className,
        )}
      >
        {items.map((item) => (
          <div
            key={item.label}
            className={cn(
              "flex flex-col gap-2 p-7",
              onDark ? "bg-ccjv-black" : "bg-ccjv-offwhite",
            )}
          >
            <dt
              className={cn(
                "font-sans text-[0.68rem] font-semibold tracking-[0.18em] uppercase",
                muted,
              )}
            >
              {item.label}
            </dt>
            <dd className="font-serif text-[clamp(1.2rem,0.7rem+1vw,1.6rem)] leading-snug">
              {item.value}
            </dd>
            {item.hint && (
              <p className={cn("font-sans text-[0.8rem] leading-relaxed", muted)}>
                {item.hint}
              </p>
            )}
          </div>
        ))}
      </dl>
    );
  }

  // pairs
  return (
    <dl className={cn("border-t", line, className)}>
      {items.map((item) => (
        <div
          key={item.label}
          className={cn(
            "grid grid-cols-1 gap-1.5 border-b py-6 sm:grid-cols-12 sm:items-baseline sm:gap-6",
            line,
          )}
        >
          <dt
            className={cn(
              "font-sans text-[0.7rem] font-semibold tracking-[0.18em] uppercase sm:col-span-4",
              muted,
            )}
          >
            {item.label}
          </dt>
          <dd className="font-serif text-[1.15rem] leading-snug sm:col-span-8">
            {item.value}
            {item.hint && (
              <span
                className={cn(
                  "mt-1 block font-sans text-[0.82rem] leading-relaxed",
                  muted,
                )}
              >
                {item.hint}
              </span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
