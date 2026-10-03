import type { ReactNode } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";

/**
 * Héros Type A — éditorial.
 *
 * L'ouverture la plus sobre : le texte porte le sujet, une photographie
 * dominante au format vertical (4:5) l'incarne. Utilisé pour les pages dont le
 * propos se développe par le texte.
 *
 * Le symbole de croix est volontairement remplacé par un filet vert : la croix
 * n'est plus un en-tête automatique (docs/015 §2.3).
 */
export interface HeroEditorialProps {
  overline: string;
  title: string;
  intro?: string;
  image: string;
  /** Légende honnête sous la photographie. */
  imageCaption?: string;
  /** Repères factuels alignés sous l'introduction. */
  meta?: { label: string; value: string }[];
  tone?: "light" | "cream" | "tinted";
  /** Actions ou complément (bouton, liens) sous l'introduction. */
  children?: ReactNode;
}

export function HeroEditorial({
  overline,
  title,
  intro,
  image,
  imageCaption,
  meta,
  tone = "light",
  children,
}: HeroEditorialProps) {
  const toneClass =
    tone === "cream"
      ? "bg-ccjv-cream"
      : tone === "tinted"
        ? "bg-ccjv-green-soft"
        : "bg-ccjv-offwhite";

  return (
    <div className={cn("relative overflow-hidden", toneClass)}>
      <div className="container">
        <div className="grid grid-cols-1 gap-12 pt-[calc(72px+clamp(2.5rem,5vw,4rem))] pb-[clamp(3rem,6vw,5rem)] lg:grid-cols-12 lg:items-end lg:gap-16">
          {/* Texte */}
          <div className="lg:col-span-7">
            <Breadcrumbs />

            <div className="flex items-center gap-4">
              <span
                className="h-px w-10 bg-ccjv-green"
                aria-hidden="true"
              />
              <p className="font-sans text-xs font-semibold tracking-[0.18em] text-ccjv-green uppercase">
                {overline}
              </p>
            </div>

            <h1 className="mt-6 max-w-[24ch] text-[clamp(2.25rem,1.2rem+3vw,3.9rem)] leading-[1.06] font-semibold">
              {title}
            </h1>

            {intro && (
              <p className="lead mt-7 max-w-[58ch]">{intro}</p>
            )}

            {meta && meta.length > 0 && (
              <dl className="mt-10 grid grid-cols-1 gap-x-10 gap-y-6 border-t border-ccjv-line pt-8 sm:grid-cols-2">
                {meta.map((item) => (
                  <div key={item.label} className="flex flex-col gap-1">
                    <dt className="font-sans text-[0.7rem] font-semibold tracking-[0.16em] text-ccjv-ink-secondary uppercase">
                      {item.label}
                    </dt>
                    <dd className="font-serif text-[1.15rem] leading-snug">
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>
            )}

            {children && <div className="mt-9">{children}</div>}
          </div>

          {/* Photographie dominante */}
          <div className="lg:col-span-5">
            <figure className="lg:pb-2">
              <div className="relative aspect-4/5 overflow-hidden bg-ccjv-line">
                <Image
                  src={image}
                  alt=""
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover"
                />
              </div>
              {imageCaption && (
                <figcaption className="mt-4 flex gap-3 border-t border-ccjv-line pt-3 font-sans text-[0.78rem] leading-relaxed text-ccjv-ink-secondary">
                  <span
                    className="mt-2 h-px w-5 shrink-0 bg-ccjv-green"
                    aria-hidden="true"
                  />
                  <span>{imageCaption}</span>
                </figcaption>
              )}
            </figure>
          </div>
        </div>
      </div>
    </div>
  );
}
