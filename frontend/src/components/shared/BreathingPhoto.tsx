import Image from "next/image";
import { cn } from "@/lib/utils";
import { CrossMark } from "./CrossMark";

export interface BreathingPhotoProps {
  image: string;
  phrase: string;
  reference?: string;
  hasArch?: boolean;
  className?: string;
}

/**
 * La photographie comme témoignage et respiration visuelle :
 * Une grande image de la communauté réelle à Lubumbashi, accompagnée d'un texte méditatif court.
 * L'image ne décore pas : elle atteste de la vie de l'église.
 */
export function BreathingPhoto({
  image,
  phrase,
  reference,
  hasArch = false,
  className,
}: BreathingPhotoProps) {
  return (
    <section
      className={cn(
        "relative min-h-[75svh] w-full overflow-hidden bg-ccjv-black",
        className,
      )}
      aria-label="Témoignage photographique de la communauté"
    >
      <Image
        src={image}
        alt=""
        fill
        sizes="100vw"
        className="object-cover object-center brightness-95"
      />

      {/* Voiles sombres progressifs pour la lisibilité et l'atmosphère sacrée */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-ccjv-black/90 via-ccjv-black/45 to-ccjv-black/25"
        aria-hidden="true"
      />

      {/* Cadre architectural en arche discret si souhaité */}
      {hasArch && (
        <span
          className="pointer-events-none absolute inset-x-8 top-10 bottom-10 rounded-t-full border border-ccjv-cream/25 max-md:inset-4"
          aria-hidden="true"
        />
      )}

      <div className="relative flex min-h-[75svh] items-end">
        <div className="container pb-20 max-md:pb-14">
          <div className="flex items-center gap-3">
            <CrossMark size="sm" className="text-ccjv-cream" />
            <span className="font-sans text-xs font-semibold tracking-[0.2em] text-ccjv-cream uppercase">
              Témoignage
            </span>
          </div>

          <p className="mt-4 max-w-[22ch] font-serif text-[clamp(1.85rem,1.1rem+3.2vw,3.6rem)] leading-[1.14] font-medium text-white">
            {phrase}
          </p>

          {reference && (
            <p className="mt-6 font-sans text-xs font-semibold tracking-[0.18em] text-white/70 uppercase">
              {reference}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
