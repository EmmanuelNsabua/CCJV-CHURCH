import { YouTubeThumb } from "@/components/shared/YouTubeThumb";
import { getYouTubeId } from "@/lib/utils";
import type { Publication } from "@/types";

/**
 * Enseignement secondaire : vignette YouTube compacte + titre + extrait.
 */
export function TeachingCard({ publication }: { publication: Publication }) {
  const youtubeId = getYouTubeId(publication.contentUrl);
  const href = publication.contentUrl;

  const content = (
    <>
      <span className="relative block aspect-video w-full shrink-0 overflow-hidden bg-ccjv-black sm:w-44">
        {youtubeId && (
          <YouTubeThumb
            videoId={youtubeId}
            sizes="176px"
            className="transition-transform duration-[550ms] ease-ccjv group-hover:scale-[1.06]"
          />
        )}
        <span
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          aria-hidden="true"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-ccjv-cream bg-black/45 text-ccjv-cream transition-colors duration-[250ms] group-hover:bg-ccjv-cream group-hover:text-ccjv-black">
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 translate-x-[1px]"
              fill="currentColor"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </span>
      </span>

      <span className="mt-4 flex min-w-0 flex-col sm:mt-0">
        {publication.author && (
          <span className="font-sans text-xs font-semibold tracking-[0.14em] text-ccjv-ink-secondary uppercase">
            {publication.author}
          </span>
        )}
        <span className="mt-2 font-serif text-[1.15rem] leading-snug">
          {publication.title}
        </span>
        {publication.description && (
          <span className="mt-2 font-sans text-[0.9rem] text-ccjv-ink-secondary">
            {publication.description}
          </span>
        )}
        <span className="mt-3 font-sans text-sm font-medium text-ccjv-green">
          Regarder sur YouTube →
        </span>
      </span>
    </>
  );

  return (
    <article className="border-t border-ccjv-line pt-6">
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex flex-col gap-4 sm:flex-row sm:gap-5"
          aria-label={`Regarder « ${publication.title} » sur YouTube`}
        >
          {content}
        </a>
      ) : (
        <div className="flex flex-col gap-4 sm:flex-row sm:gap-5">{content}</div>
      )}
    </article>
  );
}
