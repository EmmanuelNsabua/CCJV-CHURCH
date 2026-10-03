import Link from "next/link";
import Image from "next/image";
import { cn, getYouTubeId } from "@/lib/utils";
import { YouTubeThumb } from "@/components/shared/YouTubeThumb";

/**
 * Vidéo mise en avant.
 *
 * `hero`   : la vidéo ouvre la page, titre et extrait à côté de la vignette
 * `inline` : la vidéo est présentée dans le fil, format éditorial large
 *
 * Aucune iframe n'est chargée : seule la vignette est appelée, et le visionnage
 * se poursuit sur YouTube — conforme à la règle « pas de faux lecteur ».
 */
export interface MediaFeatureProps {
  href: string;
  title: string;
  excerpt?: string;
  author?: string;
  date?: string;
  duration?: string;
  /** Image de repli si le lien n'est pas une vidéo YouTube. */
  fallbackImage?: string;
  variant?: "hero" | "inline";
  className?: string;
}

export function MediaFeature({
  href,
  title,
  excerpt,
  author,
  date,
  duration,
  fallbackImage,
  variant = "hero",
  className,
}: MediaFeatureProps) {
  const videoId = getYouTubeId(href);
  const isHero = variant === "hero";

  const meta = [author, date, duration].filter(Boolean).join(" · ");

  const thumb = (
    <div
      className={cn(
        "relative w-full overflow-hidden bg-ccjv-black",
        isHero ? "aspect-16/9" : "aspect-16/9",
      )}
    >
      {videoId ? (
        <YouTubeThumb
          videoId={videoId}
          sizes={isHero ? "(max-width: 1024px) 100vw, 58vw" : "(max-width: 1024px) 100vw, 50vw"}
          className="transition-transform duration-[550ms] ease-ccjv group-hover:scale-[1.02]"
        />
      ) : fallbackImage ? (
        <Image
          src={fallbackImage}
          alt=""
          fill
          sizes="(max-width: 1024px) 100vw, 58vw"
          className="object-cover"
        />
      ) : null}

      {/* Affordance de lecture */}
      <span
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        aria-hidden="true"
      >
        <span className="flex h-16 w-16 items-center justify-center border border-white/60 bg-ccjv-black/45 backdrop-blur-[2px] transition-colors duration-[250ms] group-hover:border-ccjv-cream group-hover:bg-ccjv-black/65">
          <svg viewBox="0 0 24 24" className="ml-1 h-6 w-6 fill-ccjv-cream">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      </span>
    </div>
  );

  if (!isHero) {
    return (
      <Link href={href} target="_blank" rel="noopener noreferrer" className={cn("group block", className)}>
        {thumb}
        <div className="mt-5 border-t border-ccjv-line pt-5">
          {meta && (
            <p className="font-sans text-[0.72rem] font-semibold tracking-[0.14em] text-ccjv-green uppercase">
              {meta}
            </p>
          )}
          <h3 className="mt-3 font-serif text-[1.35rem] leading-snug transition-colors duration-[250ms] group-hover:text-ccjv-green">
            {title}
          </h3>
          {excerpt && (
            <p className="mt-3 max-w-[54ch] text-[0.95rem] leading-relaxed text-ccjv-ink-secondary">
              {excerpt}
            </p>
          )}
        </div>
      </Link>
    );
  }

  return (
    <article className={cn("grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14", className)}>
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="group block lg:col-span-7"
      >
        {thumb}
      </Link>

      <div className="lg:col-span-5">
        <p className="font-sans text-[0.7rem] font-semibold tracking-[0.2em] text-ccjv-green uppercase">
          Dernier enseignement
        </p>
        <h3 className="mt-4 font-serif text-[clamp(1.7rem,1rem+1.9vw,2.6rem)] leading-[1.12]">
          {title}
        </h3>
        {meta && (
          <p className="mt-4 font-sans text-[0.88rem] text-ccjv-ink-secondary">{meta}</p>
        )}
        {excerpt && (
          <p className="mt-6 max-w-[50ch] text-[1.02rem] leading-[1.7] text-ccjv-ink-secondary">
            {excerpt}
          </p>
        )}
        <Link
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="group mt-8 inline-flex items-center gap-3 border border-ccjv-ink px-6 py-3 font-sans text-[0.9rem] font-medium transition-colors duration-[250ms] hover:border-ccjv-green hover:text-ccjv-green"
        >
          Regarder sur YouTube
          <span aria-hidden="true" className="transition-transform duration-[250ms] group-hover:translate-x-1">
            →
          </span>
        </Link>
      </div>
    </article>
  );
}
