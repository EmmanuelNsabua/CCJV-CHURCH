import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { CrossMark } from "@/components/shared/CrossMark";

/**
 * Héros Type C — introduction centrée.
 *
 * Aucune photographie : uniquement la typographie et un verset encadré. Le
 * regard se pose sur une phrase. Réservé aux pages d'intériorité — prière,
 * parcours nouveaux, don — où l'image distrairait.
 */
export interface HeroCenteredProps {
  overline: string;
  title: string;
  intro?: string;
  verse?: { text: string; reference: string };
  tone?: "light" | "cream" | "dark";
  /** Actions centrées sous le bloc. */
  children?: ReactNode;
}

export function HeroCentered({
  overline,
  title,
  intro,
  verse,
  tone = "light",
  children,
}: HeroCenteredProps) {
  const isDark = tone === "dark";
  const toneClass = isDark
    ? "bg-ccjv-black text-white"
    : tone === "cream"
      ? "bg-ccjv-cream"
      : "bg-ccjv-offwhite";
  const accent = isDark ? "text-ccjv-cream" : "text-ccjv-green";
  const line = isDark ? "border-white/20" : "border-ccjv-line";

  return (
    <div className={cn("relative overflow-hidden", toneClass)}>
      <div className="container">
        <div className="pt-[calc(72px+clamp(2.5rem,5vw,4rem))] pb-[clamp(3rem,6vw,5rem)]">
          <Breadcrumbs tone={isDark ? "dark" : "light"} />

          <div className="mx-auto flex max-w-[46rem] flex-col items-center text-center">
            <CrossMark size="md" className={accent} />

            <p
              className={cn(
                "mt-5 font-sans text-xs font-semibold tracking-[0.2em] uppercase",
                accent,
              )}
            >
              {overline}
            </p>

            <h1
              className={cn(
                "mt-6 text-[clamp(2.25rem,1.2rem+3vw,4rem)] leading-[1.05] font-semibold",
                isDark && "text-white",
              )}
            >
              {title}
            </h1>

            {intro && (
              <p
                className={cn(
                  "mt-7 max-w-[52ch] text-[clamp(1.05rem,0.4rem+0.9vw,1.25rem)] leading-[1.65]",
                  isDark ? "text-white/72" : "text-ccjv-ink-secondary",
                )}
              >
                {intro}
              </p>
            )}

            {verse && (
              <blockquote
                className={cn(
                  "mt-12 w-full max-w-[38rem] border-y px-4 py-9",
                  line,
                )}
              >
                <p
                  className={cn(
                    "font-serif text-[clamp(1.15rem,0.6rem+1.1vw,1.6rem)] leading-[1.5] italic",
                    isDark ? "text-white/92" : "text-ccjv-ink",
                  )}
                >
                  «&nbsp;{verse.text}&nbsp;»
                </p>
                <p
                  className={cn(
                    "mt-4 font-sans text-[0.7rem] font-semibold tracking-[0.2em] uppercase",
                    accent,
                  )}
                >
                  {verse.reference}
                </p>
              </blockquote>
            )}

            {children && (
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                {children}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
