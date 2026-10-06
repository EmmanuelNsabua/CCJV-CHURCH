import { Button } from "@/components/ui/Button";
import { YouTubeThumb } from "@/components/shared/YouTubeThumb";
import { getYouTubeId } from "@/lib/utils";
import type { Publication } from "@/types";

/**
 * Enseignement mis en avant : **card visuelle de la vidéo YouTube** (vignette +
 * bouton de lecture), **extrait du message** et invitation explicite à
 * regarder la vidéo sur YouTube.
 *
 * Aucune iframe ni lecteur intégré : la vignette est une image, la lecture se
 * fait sur YouTube (performance + bande passante, cf. contraintes Lubumbashi).
 */
export function TeachingFeature({
  publication,
}: {
  publication: Publication;
}) {
  const youtubeId = getYouTubeId(publication.contentUrl);
  const href = publication.contentUrl;

  return (
    <article className="grid grid-cols-1 gap-10 border-t border-ccjv-line pt-10 md:grid-cols-12 md:gap-12">
      {href && (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative block aspect-video overflow-hidden bg-ccjv-black md:col-span-7"
          aria-label={`Regarder « ${publication.title} » sur YouTube`}
        >
          {youtubeId && (
            <YouTubeThumb
              videoId={youtubeId}
              sizes="(max-width: 768px) 100vw, 58vw"
              className="transition-transform duration-[550ms] ease-ccjv group-hover:scale-[1.04]"
            />
          )}

          {/* Voile bas pour la lisibilité du libellé */}
          <span
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent"
            aria-hidden="true"
          />

          {/* Bouton de lecture */}
          <span
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
            aria-hidden="true"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full border border-ccjv-cream bg-black/45 text-ccjv-cream transition-colors duration-[250ms] group-hover:bg-ccjv-cream group-hover:text-ccjv-black md:h-20 md:w-20">
              <svg
                viewBox="0 0 24 24"
                className="h-7 w-7 translate-x-[2px]"
                fill="currentColor"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </span>

          <span
            className="pointer-events-none absolute inset-x-5 bottom-5 font-sans text-xs font-semibold tracking-[0.16em] text-white uppercase"
            aria-hidden="true"
          >
            Regarder sur YouTube
          </span>
        </a>
      )}

      <div className="flex flex-col justify-center md:col-span-5">
        <p className="overline">Dernier message</p>
        <h3 className="mt-4 font-serif text-[clamp(1.5rem,1rem+1.6vw,2.25rem)] leading-tight">
          {publication.title}
        </h3>
        {publication.author && (
          <p className="mt-3 font-sans text-sm text-ccjv-ink-secondary">
            {publication.author}
          </p>
        )}

        {publication.description && (
          <div className="mt-6 border-l-2 border-ccjv-green/40 pl-5">
            <p className="font-serif text-[1.05rem] leading-[1.6] text-ccjv-ink">
              {publication.description}
            </p>
          </div>
        )}

        {href && (
          <>
            <div className="mt-7">
              <Button variant="primary" href={href} external>
                Regarder la vidéo sur YouTube
              </Button>
            </div>
            <p className="mt-3 font-sans text-xs text-ccjv-ink-secondary">
              La vidéo s&apos;ouvre sur YouTube, dans un nouvel onglet.
            </p>
          </>
        )}
      </div>
    </article>
  );
}
