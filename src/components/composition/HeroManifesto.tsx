import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { CrossMark } from "@/components/shared/CrossMark";

/**
 * Héros Type G — manifeste.
 *
 * Une déclaration, puis une Écriture en très grand corps. Aucune image : la page
 * affirme avant de montrer. Réservé aux pages de conviction et de parole
 * (ce que nous croyons, témoignages).
 */
export interface HeroManifestoProps {
  overline: string;
  title: string;
  /** Déclaration d'ouverture, en une ou deux phrases. */
  declaration?: string;
  scripture: { text: string; reference: string };
  /** Précision éditoriale sous la référence (contexte du verset). */
  scriptureContext?: string;
  tone?: "dark" | "cream";
  children?: ReactNode;
}

export function HeroManifesto({
  overline,
  title,
  declaration,
  scripture,
  scriptureContext,
  tone = "dark",
  children,
}: HeroManifestoProps) {
  const isDark = tone === "dark";
  const accent = isDark ? "text-ccjv-cream" : "text-ccjv-green";
  const muted = isDark ? "text-white/70" : "text-ccjv-ink-secondary";

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        isDark ? "bg-ccjv-black text-white" : "bg-ccjv-cream text-ccjv-ink",
      )}
    >
      <div className="container">
        <div className="pt-[calc(72px+clamp(2.5rem,5vw,4rem))] pb-[clamp(3rem,7vw,6rem)]">
          <Breadcrumbs tone={isDark ? "dark" : "light"} />

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <div className="flex items-center gap-4">
                <CrossMark size="md" className={accent} />
                <p
                  className={cn(
                    "font-sans text-xs font-semibold tracking-[0.2em] uppercase",
                    accent,
                  )}
                >
                  {overline}
                </p>
              </div>

              <h1
                className={cn(
                  "mt-6 text-[clamp(2.25rem,1.2rem+3vw,3.75rem)] leading-[1.04] font-semibold",
                  isDark && "text-white",
                )}
              >
                {title}
              </h1>

              {declaration && (
                <p className={cn("lead mt-7 max-w-[46ch]", isDark && "text-white/72")}>
                  {declaration}
                </p>
              )}

              {children && <div className="mt-9">{children}</div>}
            </div>

            {/* L'Écriture en grand */}
            <figure className="lg:col-span-6 lg:col-start-7">
              <div
                className={cn(
                  "border-l-2 pl-7",
                  isDark ? "border-ccjv-cream/50" : "border-ccjv-green/50",
                )}
              >
                {scriptureContext && (
                  <p
                    className={cn(
                      "mb-5 font-sans text-[0.7rem] font-semibold tracking-[0.2em] uppercase",
                      accent,
                    )}
                  >
                    {scriptureContext}
                  </p>
                )}
                <blockquote
                  className={cn(
                    "font-serif text-[clamp(1.4rem,0.7rem+2vw,2.35rem)] leading-[1.32] italic",
                    isDark ? "text-white/94" : "text-ccjv-ink",
                  )}
                >
                  «&nbsp;{scripture.text}&nbsp;»
                </blockquote>
                <figcaption
                  className={cn(
                    "mt-6 font-sans text-[0.7rem] font-semibold tracking-[0.2em] uppercase",
                    accent,
                  )}
                >
                  {scripture.reference}
                </figcaption>
              </div>
              <p className={cn("mt-6 max-w-[40ch] text-[0.82rem] leading-relaxed", muted)}>
                Traduction Louis Segond 1910.
              </p>
            </figure>
          </div>
        </div>
      </div>
    </div>
  );
}
