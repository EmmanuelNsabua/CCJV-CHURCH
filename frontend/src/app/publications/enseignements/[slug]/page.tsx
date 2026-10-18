import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BookOpen, Calendar, User } from "lucide-react";
import {
  enseignementHref,
  getEnseignement,
  readOrUnavailable,
} from "@/lib/api/endpoints";
import type { EnseignementRecord, TeachingMediaRecord } from "@/lib/api/types";
import { ContentUnavailable } from "@/components/ui/ContentUnavailable";
import { Button } from "@/components/ui/Button";
import { Prose } from "@/components/editorial/Prose";
import {
  MediaAvailabilityBadge,
  TeachingMediaPlayer,
} from "@/features/publications/TeachingMediaPlayer";
import { formatLongDate } from "@/lib/utils";
import { pageMetadata } from "@/lib/seo";

interface EnseignementDetailPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Panne ou absence ? `getEnseignement` ne lève jamais : il renvoie `null` aussi
 * bien quand l'enseignement n'existe pas que quand l'API est injoignable, et il
 * n'accepte pas encore les options de lecture publique qui portent `onFailure`.
 * Une seconde lecture — sur l'API publique — dit si le serveur répond :
 * « on n'a pas pu lire » ne doit jamais se présenter comme « ce message
 * n'existe pas ».
 */
type TeachingRead =
  | { status: "ok"; data: EnseignementRecord }
  | { status: "missing" }
  | { status: "unreachable" };

async function readTeaching(slug: string): Promise<TeachingRead> {
  let httpStatus: number | null = null;
  const read = await readOrUnavailable((options) =>
    getEnseignement(slug, {
      ...options,
      onFailure: (error) => {
        httpStatus = error.status;
        options.onFailure?.(error);
      },
    }),
  );

  if (read.status === "unreachable") {
    return httpStatus === 404
      ? { status: "missing" }
      : { status: "unreachable" };
  }

  return read.data ? { status: "ok", data: read.data } : { status: "missing" };
}

export async function generateMetadata({
  params,
}: EnseignementDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const read = await readTeaching(slug);

  /* Aucune métadonnée n'est affirmée sur un contenu qu'on n'a pas pu lire. */
  if (read.status === "unreachable") return {};

  if (read.status === "missing") {
    return pageMetadata({
      title: "Enseignement introuvable",
      description: "Le message demandé n'existe pas ou n'est plus publié.",
      path: "/publications/enseignements",
    });
  }

  const teaching = read.data;

  return pageMetadata({
    title: `${teaching.title} — Prédication`,
    description:
      teaching.summary ||
      `Prédication par ${teaching.speakerName} au Centre Chrétien Jésus ma Vie.`,
    path: enseignementHref(teaching),
  });
}

/** Media le plus pertinent pour l'écoute, hors média marqué principal. */
function pickSecondaryMedia(
  medias: readonly TeachingMediaRecord[],
  primaryRole: string | undefined,
): TeachingMediaRecord | null {
  const order: Array<TeachingMediaRecord["role"]> = ["VIDEO", "AUDIO"];

  for (const role of order) {
    if (role === primaryRole) continue;
    const found = medias.find((media) => media.role === role && media.url);
    if (found) return found;
  }

  return null;
}

export default async function EnseignementDetailPage({
  params,
}: EnseignementDetailPageProps) {
  const { slug } = await params;
  const read = await readTeaching(slug);

  if (read.status === "unreachable") {
    return (
      <div className="mx-auto w-full max-w-7xl px-6 py-[clamp(3rem,7vw,6rem)] sm:px-12 lg:px-20">
        <ContentUnavailable resource="Ce message" />
      </div>
    );
  }

  /*
   * Un brouillon ou un enseignement archivé n'est jamais servi au public : le
   * serveur répond `404` pour tout statut différent de `PUBLISHED` lorsque la
   * requête n'est pas administrative, ce que traduit `notFound()`.
   */
  if (read.status === "missing") notFound();

  const teaching = read.data;

  const primaryMedia =
    teaching.primaryMedia ??
    teaching.medias.find((media) => media.isPrimary) ??
    teaching.medias.find(
      (media) => media.role === "VIDEO" || media.role === "AUDIO",
    ) ??
    null;

  const hasVideo = teaching.medias.some(
    (media) => media.role === "VIDEO" && Boolean(media.url),
  );
  const hasAudio = teaching.medias.some(
    (media) => media.role === "AUDIO" && Boolean(media.url),
  );

  /** Média secondaire réellement lisible (l'autre format), s'il existe. */
  const secondaryMedia = primaryMedia
    ? pickSecondaryMedia(teaching.medias, primaryMedia.role)
    : null;

  const playable =
    primaryMedia &&
    (primaryMedia.role === "VIDEO" || primaryMedia.role === "AUDIO")
      ? primaryMedia
      : null;

  const thumbnail = teaching.medias.find(
    (media) => media.role === "THUMBNAIL" && media.url,
  );

  return (
    <main className="bg-ccjv-offwhite">
      <section className="border-b border-ccjv-line px-6 pt-28 pb-12 sm:px-12 lg:px-20 lg:pt-32">
        <div className="mx-auto w-full max-w-7xl">
          <Link
            href="/publications/enseignements"
            className="font-sans text-[0.8rem] font-medium text-ccjv-ink-secondary underline underline-offset-4 transition-colors hover:text-ccjv-green"
          >
            <span aria-hidden="true">←</span> Tous les enseignements
          </Link>

          <p className="mt-8 font-sans text-[0.7rem] font-semibold tracking-[0.18em] text-ccjv-green uppercase">
            Prédication
          </p>

          <h1 className="mt-3 max-w-[26ch] font-serif text-[clamp(2rem,1.3rem+2.4vw,3.4rem)] leading-[1.08] text-ccjv-ink">
            {teaching.title}
          </h1>

          <dl className="mt-7 flex flex-wrap items-center gap-x-8 gap-y-3 font-sans text-[0.85rem] text-ccjv-ink-secondary">
            <div className="flex items-center gap-2">
              <User aria-hidden="true" className="h-4 w-4 text-ccjv-green" />
              <dt className="sr-only">Prédicateur</dt>
              <dd>{teaching.speakerName}</dd>
            </div>
            <div className="flex items-center gap-2">
              <Calendar aria-hidden="true" className="h-4 w-4 text-ccjv-green" />
              <dt className="sr-only">Date de prédication</dt>
              <dd>
                Prêché le{" "}
                <time dateTime={teaching.preachedAt}>
                  {formatLongDate(teaching.preachedAt)}
                </time>
              </dd>
            </div>
          </dl>

          {(hasVideo || hasAudio) && (
            <div className="mt-5 flex flex-wrap gap-2">
              {hasVideo && <MediaAvailabilityBadge role="VIDEO" />}
              {hasAudio && <MediaAvailabilityBadge role="AUDIO" />}
            </div>
          )}
        </div>
      </section>

      <section
        aria-label="Écouter ou regarder le message"
        className="border-b border-ccjv-line px-6 py-12 sm:px-12 lg:px-20"
      >
        <div className="mx-auto w-full max-w-7xl">
          {playable ? (
            <>
              <TeachingMediaPlayer media={playable} title={teaching.title} />

              {secondaryMedia && (
                <div className="mt-5">
                  <p className="mb-2 font-sans text-[0.72rem] font-semibold tracking-[0.16em] text-ccjv-ink-secondary uppercase">
                    {secondaryMedia.role === "AUDIO"
                      ? "Aussi disponible en audio"
                      : "Aussi disponible en vidéo"}
                  </p>
                  <TeachingMediaPlayer
                    media={secondaryMedia}
                    title={teaching.title}
                  />
                </div>
              )}
            </>
          ) : (
            /*
             * Aucun média lisible : on ne simule ni lecteur ni vignette
             * cliquable. La vignette éventuelle est présentée comme une image.
             */
            <div className="border border-ccjv-line bg-ccjv-offwhite px-6 py-8">
              {thumbnail?.url && (
                /*
                 * La vignette vient de la bibliothèque centrale : ses dimensions
                 * réelles ne sont pas connues à la compilation, d'où `fill` dans
                 * un cadre de ratio maîtrisé.
                 */
                <div className="relative mx-auto mb-6 aspect-video w-full max-w-lg overflow-hidden border border-ccjv-line bg-ccjv-black">
                  <Image
                    src={thumbnail.url}
                    alt={thumbnail.alt?.trim() || ""}
                    fill
                    sizes="(max-width: 1024px) 100vw, 32rem"
                    className="object-contain"
                  />
                </div>
              )}
              <p className="text-center font-sans text-[0.9rem] text-ccjv-ink-secondary">
                L&apos;enregistrement de ce message n&apos;est pas encore
                disponible à l&apos;écoute. Les passages bibliques et le résumé
                restent consultables ci-dessous.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="px-6 py-14 sm:px-12 lg:px-20 lg:py-20">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-8">
            {teaching.description ? (
              <Prose width="narrow">
                <h2 className="font-serif text-[clamp(1.3rem,1rem+1vw,1.7rem)] leading-tight text-ccjv-ink">
                  Notes et extrait du message
                </h2>
                <div className="mt-6 whitespace-pre-line font-sans text-[1rem] leading-[1.8] text-ccjv-ink-secondary">
                  {teaching.description}
                </div>
              </Prose>
            ) : (
              teaching.summary && (
                <p className="max-w-[64ch] font-serif text-[1.15rem] leading-[1.7] text-ccjv-ink">
                  {teaching.summary}
                </p>
              )
            )}

            <div className="mt-12 flex flex-wrap gap-4 border-t border-ccjv-line pt-8">
              <Button variant="outline" href="/publications/enseignements">
                Tous les enseignements
              </Button>
              <Button variant="ghost" href="/publications/ressources">
                Ressources à lire →
              </Button>
            </div>
          </div>

          <aside className="lg:col-span-4">
            <div className="border border-ccjv-line bg-white p-6">
              <div className="flex items-center gap-2 border-b border-ccjv-line pb-3">
                <BookOpen aria-hidden="true" className="h-4 w-4 text-ccjv-green" />
                <h2 className="font-serif text-[0.95rem] font-semibold text-ccjv-ink">
                  Passages bibliques
                </h2>
              </div>

              {teaching.biblicalReferences.length > 0 ? (
                <ul className="mt-4 space-y-2.5">
                  {teaching.biblicalReferences.map((reference) => (
                    <li
                      key={reference.id}
                      className="border-l-2 border-ccjv-green/40 pl-4 font-serif text-[0.95rem] text-ccjv-ink"
                    >
                      {reference.formatted}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 font-sans text-[0.85rem] leading-relaxed text-ccjv-ink-secondary">
                  Aucun passage particulier n&apos;est référencé pour ce message.
                </p>
              )}
            </div>

            <p className="mt-6 font-sans text-[0.8rem] leading-relaxed text-ccjv-ink-secondary">
              Prédication donnée à l&apos;assemblée du Centre Chrétien Jésus ma
              Vie, à Lubumbashi.
            </p>
          </aside>
        </div>
      </section>
    </main>
  );
}
