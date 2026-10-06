import type { ReactNode } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";

/**
 * Héros Type B — photographique.
 *
 * La photographie ouvre la page et occupe tout l'écran ; le titre vit DANS
 * l'image. L'introduction est rejetée sous l'image, dans une colonne décalée.
 * Utilisé quand l'image raconte mieux que le texte : événements, médiathèque,
 * histoire.
 */
export interface HeroPhotoProps {
  overline: string;
  title: string;
  /** Rejeté sous la photographie, dans une colonne décalée. */
  intro?: string;
  image: string;
  /** Légende posée sur l'image (crédit, lieu, date). */
  caption?: string;
  /** Hauteur du cadre. `tall` pour un moment immersif. */
  height?: "normal" | "tall";
  /** Actions alignées avec l'introduction. */
  children?: ReactNode;
}

export function HeroPhoto({
  overline,
  title,
  intro,
  image,
  caption,
  height = "normal",
  children,
}: HeroPhotoProps) {
  return (
    <div className="bg-ccjv-offwhite">
      {/* Photographie plein cadre */}
      <div
        className={cn(
          "relative w-full overflow-hidden bg-ccjv-black",
          height === "tall" ? "h-[82svh] min-h-[30rem]" : "h-[62svh] min-h-[24rem]",
        )}
      >
        <Image
          src={image}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-ccjv-black/88 via-ccjv-black/35 to-ccjv-black/45"
          aria-hidden="true"
        />

        <div className="relative flex h-full items-end">
          <div className="container pb-12 max-md:pb-9">
            <Breadcrumbs tone="dark" />

            <div className="flex items-center gap-4">
              <span className="h-px w-10 bg-ccjv-cream" aria-hidden="true" />
              <p className="font-sans text-xs font-semibold tracking-[0.18em] text-ccjv-cream uppercase">
                {overline}
              </p>
            </div>

            <h1 className="mt-5 max-w-[20ch] text-[clamp(2.5rem,1.2rem+3.6vw,4.5rem)] leading-[1.02] font-semibold text-white">
              {title}
            </h1>

            {caption && (
              <p className="mt-6 font-sans text-[0.78rem] tracking-[0.04em] text-white/60">
                {caption}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Introduction rejetée sous l'image, dans une colonne décalée */}
      {(intro || children) && (
        <div className="container">
          <div className="grid grid-cols-1 gap-8 py-[clamp(2.5rem,4.5vw,4rem)] lg:grid-cols-12">
            <div className="lg:col-span-3 lg:col-start-5">
              {intro && <p className="lead">{intro}</p>}
              {children && <div className="mt-7">{children}</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
