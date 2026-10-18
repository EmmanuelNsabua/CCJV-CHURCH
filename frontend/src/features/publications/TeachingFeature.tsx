import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { YouTubeThumb } from "@/components/shared/YouTubeThumb";
import { MediaAvailabilityBadge } from "@/features/publications/TeachingMediaPlayer";
import { enseignementHref } from "@/lib/api/endpoints";
import { getYouTubeId } from "@/lib/utils";
import type { Publication } from "@/types";
import type { EnseignementRecord } from "@/lib/api/types";

export interface TeachingFeatureProps {
  publication?: Publication;
  teaching?: EnseignementRecord;
}

/**
 * Enseignement mis en avant : le message du moment, présenté de façon
 * éditoriale — visuel réel, prédicateur, date de prédication, passages
 * bibliques et disponibilité audio/vidéo.
 *
 * Règles tenues ici :
 * - **aucun faux lecteur.** Le visuel n'est cliquable que s'il mène quelque
 *   part : YouTube (média réellement hébergé là) ou la fiche du message, où le
 *   lecteur lit le fichier de la bibliothèque centrale. Un simple visuel
 *   (rôle `THUMBNAIL`) ne promet donc jamais une lecture qui n'existe pas ;
 * - la vignette vient du média `THUMBNAIL` réellement rattaché — jamais d'une
 *   image d'emprunt ;
 * - les références bibliques sont affichées dans l'ordre décidé côté serveur
 *   (`position`), sans recalcul de la forme lisible fournie par l'API.
 */
export function TeachingFeature({
  publication,
  teaching,
}: TeachingFeatureProps) {
  const title = teaching?.title ?? publication?.title ?? "";
  const author = teaching?.speakerName ?? publication?.author ?? "";
  const description =
    teaching?.summary ||
    teaching?.description ||
    publication?.description ||
    "";

  const medias = teaching?.medias ?? [];
  const videoMedia = medias.find((media) => media.role === "VIDEO");
  const audioMedia = medias.find((media) => media.role === "AUDIO");
  const thumbnailUrl = medias.find((media) => media.role === "THUMBNAIL")?.url;

  /** Média réellement lisible : priorité à la vidéo, puis à l'audio. */
  const playableUrl = videoMedia?.url ?? audioMedia?.url ?? null;
  const youtubeId = playableUrl ? getYouTubeId(playableUrl) : null;

  const detailHref = teaching ? enseignementHref(teaching) : null;

  /*
   * Destination du visuel :
   * - média YouTube → la plateforme qui l'héberge ;
   * - média CCJV (audio/vidéo) → la fiche, où le lecteur de la page joue le
   *   fichier (on n'envoie pas le visiteur vers un fichier brut) ;
   * - sinon, aucune interaction : le visuel reste décoratif.
   */
  const visualHref = youtubeId && playableUrl ? playableUrl : detailHref;
  const isExternal = Boolean(youtubeId && playableUrl);

  const visualLabel = youtubeId
    ? "Regarder sur YouTube"
    : videoMedia
      ? "Voir le message"
      : audioMedia
        ? "Écouter le message"
        : null;

  const visual = (
    <>
      {youtubeId ? (
        <YouTubeThumb
          videoId={youtubeId}
          sizes="(max-width: 768px) 100vw, 58vw"
          className="transition-transform duration-[550ms] ease-ccjv group-hover:scale-[1.04]"
        />
      ) : thumbnailUrl ? (
        <Image
          src={thumbnailUrl}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 58vw"
          className="object-cover transition-transform duration-[550ms] ease-ccjv group-hover:scale-[1.04]"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center bg-ccjv-green-soft text-ccjv-green">
          <span className="font-serif text-lg tracking-wider">
            CCJV · Prédication
          </span>
        </span>
      )}

      {visualLabel && (
        <>
          <span
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ccjv-black/80 via-ccjv-black/10 to-transparent"
            aria-hidden="true"
          />
          <span
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
            aria-hidden="true"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full border border-ccjv-cream bg-ccjv-black/45 text-ccjv-cream transition-colors duration-[250ms] group-hover:bg-ccjv-cream group-hover:text-ccjv-black md:h-20 md:w-20">
              <svg viewBox="0 0 24 24" className="h-7 w-7 translate-x-[2px]" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </span>
          <span
            className="pointer-events-none absolute inset-x-5 bottom-5 font-sans text-xs font-semibold tracking-[0.16em] text-white uppercase"
            aria-hidden="true"
          >
            {visualLabel}
          </span>
        </>
      )}
    </>
  );

  return (
    <article className="grid grid-cols-1 gap-10 border-t border-ccjv-line pt-10 md:grid-cols-12 md:gap-12">
      {visualHref ? (
        <a
          href={isExternal ? (playableUrl as string) : visualHref}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
          className="group relative block aspect-video overflow-hidden border border-ccjv-line bg-ccjv-black md:col-span-7"
          aria-label={visualLabel ? `${visualLabel} — ${title}` : title}
        >
          {visual}
        </a>
      ) : (
        <div className="relative aspect-video overflow-hidden border border-ccjv-line bg-ccjv-black md:col-span-7">
          {visual}
        </div>
      )}

      <div className="flex flex-col justify-center md:col-span-5">
        <h3 className="font-serif text-[clamp(1.5rem,1rem+1.6vw,2.25rem)] leading-tight">
          {detailHref ? (
            <Link href={detailHref} className="transition-colors hover:text-ccjv-green">
              {title}
            </Link>
          ) : (
            title
          )}
        </h3>

        <p className="mt-3 font-sans text-sm text-ccjv-ink-secondary">
          {[author, teaching ? `prêché le ${formatPreachedDate(teaching.preachedAt)}` : null]
            .filter(Boolean)
            .join(" · ")}
        </p>

        {/* Disponibilité réelle des médias — aucune pastille sans média associé. */}
        {(videoMedia || audioMedia) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {videoMedia && <MediaAvailabilityBadge role="VIDEO" />}
            {audioMedia && <MediaAvailabilityBadge role="AUDIO" />}
          </div>
        )}

        {description && (
          <div className="mt-6 border-l-2 border-ccjv-green/40 pl-5">
            <p className="line-clamp-4 font-serif text-[1.05rem] leading-[1.6] text-ccjv-ink">
              {description}
            </p>
          </div>
        )}

        {teaching && teaching.biblicalReferences.length > 0 && (
          <ul className="mt-6 flex flex-wrap gap-2">
            {teaching.biblicalReferences.map((reference) => (
              <li
                key={reference.id}
                className="border border-ccjv-line bg-ccjv-offwhite px-2.5 py-1 font-serif text-[0.8rem] text-ccjv-ink"
              >
                {reference.formatted}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-7 flex flex-wrap gap-4">
          {isExternal && playableUrl && (
            <Button variant="primary" href={playableUrl} external>
              Regarder sur YouTube
            </Button>
          )}
          {detailHref && (
            <Button variant={isExternal ? "outline" : "primary"} href={detailHref}>
              {videoMedia ? "Voir le message" : audioMedia ? "Écouter le message" : "Détails du message"}
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

/** Date de prédication au format long français (« 11 octobre 2026 »). */
function formatPreachedDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}
