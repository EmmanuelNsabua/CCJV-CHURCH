import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Grand portrait : une personne, sa fonction, ce qu'elle fait.
 *
 * Utilisé en ouverture des pages de direction — la personne avant la fonction,
 * l'inverse d'un trombinoscope administratif.
 */
export interface PortraitPanelProps {
  image: string;
  name: string;
  role: string;
  scope?: string;
  bio?: string;
  /** Mots de la personne elle-même (jamais attribués sans source). */
  quote?: string;
  side?: "left" | "right";
  onDark?: boolean;
  className?: string;
}

export function PortraitPanel({
  image,
  name,
  role,
  scope,
  bio,
  quote,
  side = "left",
  onDark = false,
  className,
}: PortraitPanelProps) {
  const imageFirst = side === "left";

  return (
    <div
      className={cn(
        "grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14",
        className,
      )}
    >
      <figure className={cn("lg:col-span-5", !imageFirst && "lg:order-2")}>
        <div className="relative aspect-4/5 overflow-hidden bg-ccjv-line">
          <Image
            src={image}
            alt=""
            fill
            sizes="(max-width: 1024px) 100vw, 38vw"
            className="object-cover"
          />
        </div>
      </figure>

      <div className={cn("lg:col-span-7", !imageFirst && "lg:order-1")}>
        {scope && (
          <p
            className={cn(
              "font-sans text-[0.7rem] font-semibold tracking-[0.2em] uppercase",
              onDark ? "text-ccjv-cream" : "text-ccjv-green",
            )}
          >
            {scope}
          </p>
        )}

        <h3
          className={cn(
            "mt-4 font-serif text-[clamp(1.9rem,1.1rem+2.2vw,3rem)] leading-[1.1]",
            onDark && "text-white",
          )}
        >
          {name}
        </h3>

        <p
          className={cn(
            "mt-3 font-sans text-[1.02rem]",
            onDark ? "text-white/70" : "text-ccjv-ink-secondary",
          )}
        >
          {role}
        </p>

        {bio && (
          <p
            className={cn(
              "mt-6 max-w-[58ch] text-[1.0625rem] leading-[1.75]",
              onDark ? "text-white/70" : "text-ccjv-ink-secondary",
            )}
          >
            {bio}
          </p>
        )}

        {quote && (
          <blockquote
            className={cn(
              "mt-8 max-w-[52ch] border-l-2 pl-5 font-serif text-[1.1rem] leading-[1.55] italic",
              onDark
                ? "border-ccjv-cream/45 text-white/90"
                : "border-ccjv-green/45 text-ccjv-ink",
            )}
          >
            {quote}
          </blockquote>
        )}
      </div>
    </div>
  );
}
