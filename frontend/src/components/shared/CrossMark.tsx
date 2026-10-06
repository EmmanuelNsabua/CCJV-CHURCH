import { cn } from "@/lib/utils";

export interface CrossMarkProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "watermark";
  variant?: "solid" | "fine" | "ornate";
}

/**
 * Motif chrétien CCJV : la Croix comme symbole central de foi et repère visuel.
 * Conforme à la Direction Créative (§7) :
 * - Nettement perceptible, contrastée et digne ;
 * - Jamais réduite à un micro-trait invisible ;
 * - Proportions sacrées (axe vertical élancé, traverse à 33% du sommet).
 */
export function CrossMark({
  className,
  size = "md",
}: CrossMarkProps) {
  if (size === "watermark") {
    return (
      <svg
        viewBox="0 0 100 160"
        fill="currentColor"
        className={cn(
          "pointer-events-none absolute select-none opacity-5",
          className,
        )}
        aria-hidden="true"
      >
        {/* Poutre verticale */}
        <rect x="46" y="0" width="8" height="160" rx="1" />
        {/* Poutre horizontale */}
        <rect x="15" y="44" width="70" height="8" rx="1" />
      </svg>
    );
  }

  if (size === "xl") {
    return (
      <svg
        viewBox="0 0 32 48"
        fill="currentColor"
        className={cn("h-24 w-auto shrink-0 text-current md:h-32", className)}
        aria-hidden="true"
      >
        <rect x="14" y="0" width="4" height="48" rx="1" />
        <rect x="4" y="14" width="24" height="4" rx="1" />
      </svg>
    );
  }

  if (size === "lg") {
    return (
      <svg
        viewBox="0 0 32 48"
        fill="currentColor"
        className={cn("h-12 w-8 shrink-0 text-current", className)}
        aria-hidden="true"
      >
        <rect x="14" y="0" width="4" height="48" rx="1" />
        <rect x="4" y="14" width="24" height="4" rx="1" />
      </svg>
    );
  }

  if (size === "sm") {
    return (
      <svg
        viewBox="0 0 18 26"
        fill="currentColor"
        className={cn("h-5 w-3.5 shrink-0 text-current", className)}
        aria-hidden="true"
      >
        <rect x="8" y="0" width="2" height="26" rx="0.5" />
        <rect x="2" y="7" width="14" height="2" rx="0.5" />
      </svg>
    );
  }

  // size === "md" (défaut)
  return (
    <svg
      viewBox="0 0 24 36"
      fill="currentColor"
      className={cn("h-8 w-5 shrink-0 text-current", className)}
      aria-hidden="true"
    >
      <rect x="10.5" y="0" width="3" height="36" rx="0.75" />
      <rect x="3" y="10.5" width="18" height="3" rx="0.75" />
    </svg>
  );
}
