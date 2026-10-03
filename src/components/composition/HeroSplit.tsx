import type { ReactNode } from "react";
import Image from "next/image";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";

/**
 * Héros Type D — composition asymétrique.
 *
 * Le texte occupe délibérément plus de place que l'image, et la seconde
 * photographie vient casser la symétrie en se décalant. Utilisé pour les pages
 * institutionnelles qui doivent montrer de la substance avant de montrer des
 * visages : organisation, départements.
 */
export interface HeroSplitProps {
  overline: string;
  title: string;
  intro?: string;
  image: string;
  imageAlt?: string;
  /** Seconde photographie, volontairement décalée. */
  secondaryImage?: string;
  secondaryCaption?: string;
  /** Paragraphes de contexte, en retrait sous l'introduction. */
  paragraphs?: string[];
  children?: ReactNode;
}

export function HeroSplit({
  overline,
  title,
  intro,
  image,
  secondaryImage,
  secondaryCaption,
  paragraphs,
  children,
}: HeroSplitProps) {
  return (
    <div className="relative overflow-hidden bg-ccjv-offwhite">
      <div className="container">
        <div className="grid grid-cols-1 gap-14 pt-[calc(72px+clamp(2.5rem,5vw,4rem))] pb-[clamp(3rem,6vw,5rem)] lg:grid-cols-12 lg:gap-12">
          {/* Colonne de texte large */}
          <div className="lg:col-span-7">
            <Breadcrumbs />

            <p className="font-sans text-xs font-semibold tracking-[0.18em] text-ccjv-green uppercase">
              {overline}
            </p>

            <h1 className="mt-5 max-w-[26ch] text-[clamp(2.25rem,1.2rem+3vw,3.9rem)] leading-[1.06] font-semibold">
              {title}
            </h1>

            {intro && <p className="lead mt-7 max-w-[54ch]">{intro}</p>}

            {paragraphs && paragraphs.length > 0 && (
              <div className="prose-body mt-7 max-w-[60ch] text-ccjv-ink-secondary">
                {paragraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 32)}>{paragraph}</p>
                ))}
              </div>
            )}

            {children && <div className="mt-9">{children}</div>}
          </div>

          {/* Composition décalée */}
          <div className="relative lg:col-span-5 lg:pt-16">
            <figure>
              <div className="relative aspect-3/4 w-[86%] overflow-hidden bg-ccjv-line lg:ml-auto">
                <Image
                  src={image}
                  alt=""
                  fill
                  priority
                  sizes="(max-width: 1024px) 86vw, 32vw"
                  className="object-cover"
                />
              </div>
            </figure>

            {secondaryImage && (
              <figure className="relative z-10 -mt-[18%] w-[52%] max-lg:mt-6 max-lg:w-[62%]">
                <div className="relative aspect-square overflow-hidden border-4 border-ccjv-offwhite bg-ccjv-line">
                  <Image
                    src={secondaryImage}
                    alt=""
                    fill
                    sizes="(max-width: 1024px) 60vw, 18vw"
                    className="object-cover"
                  />
                </div>
              </figure>
            )}

            {secondaryCaption && (
              <p className="mt-5 max-w-[34ch] border-t border-ccjv-line pt-3 font-sans text-[0.78rem] leading-relaxed text-ccjv-ink-secondary lg:ml-auto lg:text-right">
                {secondaryCaption}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
