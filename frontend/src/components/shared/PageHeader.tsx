import Image from "next/image";
import { cn } from "@/lib/utils";
import { CrossMark } from "./CrossMark";
import { Breadcrumbs } from "./Breadcrumbs";

export interface PageHeaderProps {
  overline: string;
  title: string;
  description?: string;
  verse?: { text: string; reference: string };
  tone?: "light" | "dark";
  /** Photographie optionnelle, mise en scène dans la baie. */
  image?: string;
  className?: string;
}

/**
 * En-tête éditorial des pages internes.
 *
 * Composition : texte à gauche, **« baie » à droite** — une arche d'architecture
 * religieuse (filet extérieur + panneau sombre) portant une **croix pleinement
 * visible**, et non un filigrane. La baie accueille une photographie lorsqu'une
 * image pertinente est disponible pour la page.
 */
export function PageHeader({
  overline,
  title,
  description,
  verse,
  tone = "light",
  image,
  className,
}: PageHeaderProps) {
  const isDark = tone === "dark";

  return (
    <div
      className={cn(
        "relative overflow-hidden border-b",
        isDark
          ? "border-white/10 bg-ccjv-black text-white"
          : "border-ccjv-line bg-ccjv-offwhite text-ccjv-ink",
        className,
      )}
    >
      <div className="container">
        <div className="grid grid-cols-1 items-center gap-12 pt-[calc(68px+clamp(2.5rem,5vw,4rem))] pb-[clamp(3rem,6vw,4.5rem)] lg:grid-cols-12 lg:gap-16">
          {/* Texte */}
          <div className="lg:col-span-7">
            <Breadcrumbs tone={isDark ? "dark" : "light"} />

            <div className="flex items-center gap-4">
              <CrossMark
                size="md"
                className={isDark ? "text-ccjv-cream" : "text-ccjv-green"}
              />
              <p
                className={cn(
                  "font-sans text-xs font-semibold tracking-[0.18em] uppercase",
                  isDark ? "text-ccjv-cream" : "text-ccjv-ink-secondary",
                )}
              >
                {overline}
              </p>
            </div>

            <h1
              className={cn(
                "mt-6 max-w-[22ch] text-[clamp(2.25rem,1.2rem+3vw,3.75rem)] leading-[1.08] font-semibold",
                isDark ? "text-white" : "text-ccjv-ink",
              )}
            >
              {title}
            </h1>

            {description && (
              <p
                className={cn(
                  "mt-6 max-w-[56ch] text-[clamp(1.02rem,0.5rem+0.9vw,1.2rem)] leading-[1.65]",
                  isDark ? "text-white/75" : "text-ccjv-ink-secondary",
                )}
              >
                {description}
              </p>
            )}

            {verse && (
              <blockquote
                className={cn(
                  "mt-9 max-w-[54ch] border-l-2 pl-5",
                  isDark ? "border-ccjv-cream/45" : "border-ccjv-green/45",
                )}
              >
                <p
                  className={cn(
                    "font-serif text-[1.05rem] leading-[1.6] italic",
                    isDark ? "text-white/85" : "text-ccjv-ink",
                  )}
                >
                  «&nbsp;{verse.text}&nbsp;»
                </p>
                <p
                  className={cn(
                    "mt-2 font-sans text-xs font-semibold tracking-[0.18em] uppercase",
                    isDark ? "text-ccjv-cream" : "text-ccjv-green",
                  )}
                >
                  {verse.reference}
                </p>
              </blockquote>
            )}
          </div>

          {/* Composition : la baie */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto aspect-[3/4] w-full max-w-[15rem] sm:max-w-[18rem] lg:max-w-[21rem]">
              {/* Baie extérieure (filet) */}
              <span
                className={cn(
                  "absolute inset-0 rounded-t-full border",
                  isDark ? "border-white/20" : "border-ccjv-line",
                )}
                aria-hidden="true"
              />

              {/* Baie intérieure */}
              <span
                className="absolute inset-[7%] overflow-hidden rounded-t-full bg-ccjv-black"
                aria-hidden="true"
              >
                {image && (
                  <Image
                    src={image}
                    alt=""
                    fill
                    sizes="(max-width: 1024px) 18rem, 21rem"
                    className="object-cover opacity-75"
                  />
                )}
                {image && (
                  <span className="absolute inset-0 bg-gradient-to-t from-ccjv-black/85 via-ccjv-black/30 to-transparent" />
                )}
              </span>

              {/* Croix pleinement visible */}
              <span
                className="absolute top-[46%] left-1/2 -translate-x-1/2 -translate-y-1/2"
                aria-hidden="true"
              >
                <CrossMark size="xl" className="text-ccjv-cream" />
              </span>

              {/* Marqueur identitaire */}
              <p
                className="absolute inset-x-0 bottom-[8%] text-center font-sans text-[0.6rem] font-semibold tracking-[0.34em] text-ccjv-cream/85 uppercase"
                aria-hidden="true"
              >
                CCJV
              </p>
            </div>

            {/* Filet éditorial sous la baie */}
            <span
              className={cn(
                "mx-auto mt-8 block h-px w-full max-w-[15rem] sm:max-w-[18rem] lg:max-w-[21rem]",
                isDark ? "bg-white/15" : "bg-ccjv-line",
              )}
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
