import type { ReactNode } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";

/**
 * Héros Type E — introduction immersive.
 *
 * Grande image, GRANDE RESPIRATION, puis le titre. L'ordre est inversé : on
 * laisse le regard entrer dans la photographie avant de nommer la page.
 * Utilisé pour les ouvertures communautaires (accueil de pôle, médiathèque).
 */
export interface HeroImmersiveProps {
  overline: string;
  title: string;
  text?: string;
  image: string;
  /** Légende discrète en bas de cadre. */
  caption?: string;
  align?: "bottom" | "center";
  children?: ReactNode;
}

export function HeroImmersive({
  overline,
  title,
  text,
  image,
  caption,
  align = "bottom",
  children,
}: HeroImmersiveProps) {
  return (
    <div className="relative h-[88svh] min-h-[32rem] w-full overflow-hidden bg-ccjv-black">
      <Image
        src={image}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />

      <div
        className={cn(
          "absolute inset-0",
          align === "center"
            ? "bg-ccjv-black/62"
            : "bg-gradient-to-t from-ccjv-black/92 via-ccjv-black/40 to-ccjv-black/55",
        )}
        aria-hidden="true"
      />

      <div
        className={cn(
          "relative flex h-full",
          align === "center" ? "items-center" : "items-end",
        )}
      >
        <div className="container pb-[clamp(3rem,7vw,6rem)]">
          <Breadcrumbs tone="dark" />

          {/* Respiration volontaire avant le titre */}
          <div className="mt-[clamp(2rem,6vw,5rem)]">
            <p className="font-sans text-xs font-semibold tracking-[0.24em] text-ccjv-cream uppercase">
              {overline}
            </p>

            <h1 className="mt-5 max-w-[18ch] text-[clamp(2.5rem,1.1rem+4vw,5rem)] leading-[0.98] font-semibold text-white">
              {title}
            </h1>

            {text && (
              <p className="mt-7 max-w-[46ch] text-[clamp(1rem,0.4rem+0.8vw,1.15rem)] leading-[1.6] text-white/78">
                {text}
              </p>
            )}

            {children && <div className="mt-9">{children}</div>}
          </div>

          {caption && (
            <p className="mt-12 font-sans text-[0.72rem] tracking-[0.06em] text-white/45">
              {caption}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
