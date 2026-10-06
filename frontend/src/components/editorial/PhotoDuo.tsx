import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Diptyque : deux photographies qui se répondent.
 *
 * Sert à raconter une évolution (avant/après, intérieur/extérieur,
 * enfants/adultes) plutôt que d'aligner deux images décoratives.
 */
export interface PhotoDuoProps {
  left: { src: string; caption?: string };
  right: { src: string; caption?: string };
  /** `offset` décale la seconde image vers le bas pour casser l'alignement. */
  variant?: "equal" | "offset";
  className?: string;
}

export function PhotoDuo({
  left,
  right,
  variant = "equal",
  className,
}: PhotoDuoProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8",
        variant === "offset" && "sm:items-start",
        className,
      )}
    >
      <figure>
        <div
          className={cn(
            "relative overflow-hidden bg-ccjv-line",
            variant === "offset" ? "aspect-3/4" : "aspect-4/5",
          )}
        >
          <Image
            src={left.src}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, 45vw"
            className="object-cover"
          />
        </div>
        {left.caption && (
          <figcaption className="mt-3 border-t border-ccjv-line pt-3 font-sans text-[0.76rem] leading-relaxed text-ccjv-ink-secondary">
            {left.caption}
          </figcaption>
        )}
      </figure>

      <figure className={cn(variant === "offset" && "sm:mt-16")}>
        <div
          className={cn(
            "relative overflow-hidden bg-ccjv-line",
            variant === "offset" ? "aspect-square" : "aspect-4/5",
          )}
        >
          <Image
            src={right.src}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, 45vw"
            className="object-cover"
          />
        </div>
        {right.caption && (
          <figcaption className="mt-3 border-t border-ccjv-line pt-3 font-sans text-[0.76rem] leading-relaxed text-ccjv-ink-secondary">
            {right.caption}
          </figcaption>
        )}
      </figure>
    </div>
  );
}
