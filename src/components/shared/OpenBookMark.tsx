import { cn } from "@/lib/utils";

export interface OpenBookMarkProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * Motif du Livre Ouvert (Bible / Écritures) :
 * En écho direct au logo officiel de CCJV.
 * Évoque la Parole révélée, l'enseignement et la source de foi.
 */
export function OpenBookMark({ className, size = "md" }: OpenBookMarkProps) {
  const sizeClasses = {
    sm: "h-5 w-7",
    md: "h-7 w-10",
    lg: "h-10 w-14",
  };

  return (
    <svg
      viewBox="0 0 40 28"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("shrink-0 text-current", sizeClasses[size], className)}
      aria-hidden="true"
    >
      {/* Pages ouvertes gauche et droite */}
      <path d="M20 23C15 20.5 8 20 2 22V6C8 4 15 4.5 20 7C25 4.5 32 4 38 6V22C32 20 25 20.5 20 23Z" />
      {/* Reliure centrale */}
      <path d="M20 7V23" />
      {/* Filets discrets de texte / lumière */}
      <path d="M7 10C11 9 15 9.5 17 11" strokeWidth="1.5" opacity="0.6" />
      <path d="M7 14C11 13 15 13.5 17 15" strokeWidth="1.5" opacity="0.6" />
      <path d="M23 11C25 9.5 29 9 33 10" strokeWidth="1.5" opacity="0.6" />
      <path d="M23 15C25 13.5 29 13 33 14" strokeWidth="1.5" opacity="0.6" />
    </svg>
  );
}
