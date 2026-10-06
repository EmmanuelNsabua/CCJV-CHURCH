import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";

/**
 * En-tête compact — pour les pages d'index.
 *
 * Une page d'actualités, de ressources ou d'agenda n'a pas besoin d'un héros
 * éditorial : elle a besoin d'être située, puis de laisser la place au contenu.
 * Aucune photographie, une hauteur réduite, le propos tenu en deux colonnes.
 */
export interface HeroCompactProps {
  overline: string;
  title: string;
  intro?: string;
  /** Repères alignés à droite du titre (nombre d'entrées, dernière mise à jour…). */
  aside?: ReactNode;
  tone?: "light" | "tinted";
}

export function HeroCompact({
  overline,
  title,
  intro,
  aside,
  tone = "light",
}: HeroCompactProps) {
  return (
    <div
      className={cn(
        "border-b border-ccjv-line",
        tone === "tinted" ? "bg-ccjv-green-soft" : "bg-ccjv-offwhite",
      )}
    >
      <div className="container">
        <div className="pt-[calc(72px+clamp(1.75rem,3.5vw,2.75rem))] pb-[clamp(1.75rem,3vw,2.5rem)]">
          <Breadcrumbs className="mb-4" />

          <div className="grid grid-cols-1 items-end gap-8 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-6">
              <div className="flex items-center gap-4">
                <span className="h-px w-8 bg-ccjv-green" aria-hidden="true" />
                <p className="font-sans text-xs font-semibold tracking-[0.18em] text-ccjv-green uppercase">
                  {overline}
                </p>
              </div>
              <h1 className="mt-4 text-[clamp(1.9rem,1rem+2.2vw,3rem)] leading-[1.08] font-semibold">
                {title}
              </h1>
            </div>

            {(intro || aside) && (
              <div className="lg:col-span-6 lg:col-start-7">
                {intro && (
                  <p className="max-w-[52ch] text-[1.0625rem] leading-[1.65] text-ccjv-ink-secondary">
                    {intro}
                  </p>
                )}
                {aside && <div className="mt-5">{aside}</div>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
