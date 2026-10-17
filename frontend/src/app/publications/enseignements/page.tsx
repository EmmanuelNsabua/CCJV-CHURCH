import Link from "next/link";
import { HeroCompact } from "@/components/composition/HeroCompact";
import { MediaPage } from "@/components/archetypes/MediaPage";
import { Prose } from "@/components/editorial/Prose";
import { MediaFeature } from "@/components/editorial/MediaFeature";
import { PhotoGallery } from "@/components/editorial/PhotoGallery";
import { ScriptureBlock } from "@/components/editorial/ScriptureBlock";
import { ContentPending } from "@/components/editorial/ContentPending";
import { CrossLinks, type CrossLink } from "@/components/editorial/CrossLinks";
import { EmptyState } from "@/components/ui/EmptyState";
import { ContentUnavailable } from "@/components/ui/ContentUnavailable";
import {
  getScriptures,
  listEnseignements,
  readOrUnavailable,
} from "@/lib/api/endpoints";
import { formatLongDate, getYouTubeId } from "@/lib/utils";
import { pageMetadata } from "@/lib/seo";
import { Video, Mic, BookOpen } from "lucide-react";
import type { BiblicalReferenceRecord } from "@/lib/api/types";

export const metadata = pageMetadata({
  title: "Enseignements",
  description:
    "Les messages et prédications du Centre Chrétien Jésus ma Vie, à écouter ou réécouter.",
  path: "/publications/enseignements",
});

const related: CrossLink[] = [
  {
    href: "/publications/mediatheque",
    label: "La médiathèque",
    description: "Les images des moments vécus ensemble.",
  },
  {
    href: "/publications/ressources",
    label: "Les ressources",
    description: "Des textes à lire seul ou en groupe.",
  },
  {
    href: "/publications/actualites",
    label: "Les actualités",
    description: "Les nouvelles et annonces de la vie de l'église.",
  },
];

function formatBiblicalReference(ref: BiblicalReferenceRecord): string {
  if (ref.endChapter && ref.endChapter !== ref.startChapter) {
    return `${ref.book} ${ref.startChapter}:${ref.startVerse}–${ref.endChapter}:${ref.endVerse ?? ""}`;
  }
  if (ref.endVerse && ref.endVerse !== ref.startVerse) {
    return `${ref.book} ${ref.startChapter}:${ref.startVerse}–${ref.endVerse}`;
  }
  return `${ref.book} ${ref.startChapter}:${ref.startVerse}`;
}

export default async function EnseignementsPage() {
  /*
   * Source réelle : les enseignements publiés (`listEnseignements`) et le verset
   * éditorial de l'API (`getScriptures`). Aucune publication de secours ne vient
   * remplacer une liste vide : un message absent de l'API n'est pas affiché.
   *
   * `listEnseignements` absorbe les pannes (il renvoie une liste vide), tandis
   * que la lecture des versets, elle, signale l'échec. C'est cette seconde
   * lecture qui permet de ne pas présenter une API injoignable comme « aucun
   * enseignement publié ».
   */
  const [teachingsRes, scripturesRead] = await Promise.all([
    listEnseignements({ limit: 50 }),
    readOrUnavailable((options) => getScriptures(options)),
  ]);

  const teachings = teachingsRes.items;
  const verse =
    scripturesRead.status === "ok"
      ? scripturesRead.data.find((scripture) => scripture.key === "parole")
      : undefined;

  /*
   * « Rien de publié » ou « on n'a pas pu lire » ? Une liste vide n'a de sens
   * que si l'API a répondu : c'est donc le signal d'échec porté par la lecture
   * des versets qui tranche. Quand des messages sont bel et bien revenus, ils
   * sont affichés — seul le verset manquant est omis.
   */
  const teachingsUnavailable =
    teachings.length === 0 && scripturesRead.status === "unreachable";

  const featuredTeaching = teachings[0];
  const primaryMedia = featuredTeaching?.medias?.find((m) => m.isPrimary);
  const primaryMediaUrl = primaryMedia?.media?.publicUrl;

  /*
   * `MediaFeature` présente la vidéo comme regardable **sur YouTube** : on ne
   * l'utilise donc que pour un média réellement hébergé sur YouTube. Un média
   * hébergé ailleurs est présenté par sa fiche, où il est lu par le lecteur de
   * la page — plutôt que sous une promesse qui ne correspondrait pas.
   */
  const primaryMediaOnYouTube = primaryMediaUrl
    ? Boolean(getYouTubeId(primaryMediaUrl))
    : false;

  /** Vignettes réelles des messages publiés — aucune image d'emprunt. */
  const thumbnails = teachings.flatMap((teaching) => {
    const thumbnail = teaching.medias.find((media) => media.role === "THUMBNAIL");
    const url = thumbnail?.media?.publicUrl;
    return url ? [{ url, title: teaching.title }] : [];
  });

  const featuredMeta = featuredTeaching
    ? [featuredTeaching.speakerName, formatLongDate(featuredTeaching.preachedAt)].join(" · ")
    : "";

  return (
    <MediaPage
      rhythm="standard"
      hero={
        <HeroCompact
          tone="tinted"
          overline="Publications & Médias"
          title="Enseignements"
          intro="Les messages et prédications donnés à l'assemblée du Centre Chrétien Jésus ma Vie. On vient ici pour écouter, méditer les Écritures et grandir dans la foi."
          aside={
            <p className="font-sans text-[0.8rem] text-ccjv-ink-secondary">
              {teachingsUnavailable
                ? "Le nombre de messages publiés n'a pas pu être lu."
                : `${teachings.length} message${teachings.length > 1 ? "s" : ""} publié${teachings.length > 1 ? "s" : ""}`}
              {featuredTeaching
                ? ` · le plus récent le ${formatLongDate(featuredTeaching.preachedAt)}`
                : ""}
            </p>
          }
        />
      }
      featured={
        teachingsUnavailable ? (
          <ContentUnavailable resource="Les enseignements" />
        ) : featuredTeaching && primaryMediaUrl && primaryMediaOnYouTube ? (
          <MediaFeature
            variant="hero"
            href={primaryMediaUrl}
            title={featuredTeaching.title}
            excerpt={featuredTeaching.summary || featuredTeaching.description || undefined}
            author={featuredTeaching.speakerName}
            date={formatLongDate(featuredTeaching.preachedAt)}
          />
        ) : featuredTeaching ? (
          /* Message publié sans vidéo YouTube : on le met en avant sans faux lecteur. */
          <div className="border-t border-ccjv-line pt-10">
            <p className="font-sans text-[0.7rem] font-semibold tracking-[0.2em] text-ccjv-green uppercase">
              Dernier enseignement
            </p>
            <Link
              href={`/publications/enseignements/${featuredTeaching.slug}`}
              className="group mt-5 block"
            >
              <h3 className="max-w-[30ch] font-serif text-[clamp(1.7rem,1rem+1.9vw,2.6rem)] leading-[1.12] transition-colors duration-[250ms] group-hover:text-ccjv-green">
                {featuredTeaching.title}
              </h3>
            </Link>
            {(featuredTeaching.summary || featuredTeaching.description) && (
              <p className="mt-6 max-w-[60ch] text-[1.02rem] leading-[1.7] text-ccjv-ink-secondary">
                {featuredTeaching.summary || featuredTeaching.description}
              </p>
            )}
            <p className="mt-6 font-sans text-[0.88rem] text-ccjv-ink-secondary">
              {featuredMeta}
            </p>
            <Link
              href={`/publications/enseignements/${featuredTeaching.slug}`}
              className="group mt-8 inline-flex items-center gap-3 border border-ccjv-ink px-6 py-3 font-sans text-[0.9rem] font-medium transition-colors duration-[250ms] hover:border-ccjv-green hover:text-ccjv-green"
            >
              Lire la fiche du message
              <span aria-hidden="true" className="transition-transform duration-[250ms] group-hover:translate-x-1">
                →
              </span>
            </Link>
          </div>
        ) : (
          <EmptyState
            title="Aucun enseignement pour le moment"
            description="Les messages publiés depuis le back-office apparaîtront ici."
          />
        )
      }
      listingTitle="Toutes les prédications"
      listing={
        teachingsUnavailable ? (
          <ContentUnavailable resource="La liste des prédications" />
        ) : teachings.length > 0 ? (
          <>
            <div className="mb-12 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
              <div className="lg:col-span-4">
                <Prose width="narrow">
                  <p>
                    Un message s&apos;écoute une première fois, puis se reprend.
                    Retrouvez pour chaque prédication les passages bibliques
                    étudiés ainsi que le support multimédia associé.
                  </p>
                </Prose>
              </div>

              {verse && (
                <div className="lg:col-span-5 lg:col-start-8">
                  <ScriptureBlock
                    variant="inline"
                    context={verse.context ?? "Pourquoi nous revenons à la Parole"}
                    text={verse.text}
                    reference={verse.reference}
                  />
                </div>
              )}
            </div>

            <ul className="border-t border-ccjv-line">
              {teachings.map((teaching) => {
                const primary = teaching.medias?.find((m) => m.isPrimary);
                return (
                  <li key={teaching.id} className="border-b border-ccjv-line">
                    <div className="grid grid-cols-1 gap-3 py-7 sm:grid-cols-12 sm:items-baseline sm:gap-6">
                      <time
                        dateTime={teaching.preachedAt}
                        className="font-sans text-[0.78rem] text-ccjv-ink-secondary sm:col-span-2"
                      >
                        {formatLongDate(teaching.preachedAt)}
                      </time>

                      <div className="sm:col-span-6">
                        <Link
                          href={`/publications/enseignements/${teaching.slug}`}
                          className="font-serif text-[1.3rem] leading-snug transition-colors duration-[250ms] hover:text-ccjv-green"
                        >
                          {teaching.title}
                        </Link>
                        {teaching.summary && (
                          <p className="mt-2 max-w-[62ch] font-sans text-[0.92rem] leading-relaxed text-ccjv-ink-secondary">
                            {teaching.summary}
                          </p>
                        )}

                        {/* Références bibliques */}
                        {teaching.references && teaching.references.length > 0 && (
                          <div className="mt-3 flex flex-wrap items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-ccjv-green shrink-0" />
                            {teaching.references.map((ref) => (
                              <span
                                key={ref.id}
                                className="inline-block text-[11px] font-serif bg-ccjv-surface border border-ccjv-line px-2 py-0.5 text-ccjv-ink"
                              >
                                {formatBiblicalReference(ref)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <p className="font-sans text-[0.85rem] text-ccjv-ink-secondary sm:col-span-2">
                        {teaching.speakerName}
                      </p>

                      <div className="sm:col-span-2 sm:text-right">
                        {primary?.role === "VIDEO" ? (
                          <Link
                            href={`/publications/enseignements/${teaching.slug}`}
                            className="inline-flex items-center gap-1 text-[0.85rem] font-medium text-ccjv-green hover:underline"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>Voir vidéo</span>
                          </Link>
                        ) : primary?.role === "AUDIO" ? (
                          <Link
                            href={`/publications/enseignements/${teaching.slug}`}
                            className="inline-flex items-center gap-1 text-[0.85rem] font-medium text-blue-700 hover:underline"
                          >
                            <Mic className="w-3.5 h-3.5" />
                            <span>Écouter audio</span>
                          </Link>
                        ) : (
                          <span className="font-sans text-[0.85rem] text-ccjv-ink-secondary">
                            Enseignement
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <EmptyState
            title="Aucune prédication publiée"
            description="La liste des messages apparaîtra ici dès la première publication."
          />
        )
      }
      galleryTitle="En images"
      /* Vignettes réellement rattachées aux messages publiés ; sinon, pas de bande. */
      gallery={
        thumbnails.length > 0 ? (
          <PhotoGallery
            variant="strip"
            images={thumbnails.slice(0, 6).map((thumbnail) => thumbnail.url)}
            captions={thumbnails.slice(0, 6).map((thumbnail) => thumbnail.title)}
          />
        ) : undefined
      }
      collectionsTitle="Séries et thèmes"
      collections={
        <ContentPending
          what="Séries et thèmes des prédications"
          hint="Les enseignements publiés sont répertoriés chronologiquement par date de culte."
        />
      }
      related={
        <>
          <p className="font-sans text-xs font-semibold tracking-[0.18em] text-ccjv-green uppercase">
            Continuer
          </p>
          <h2 className="mt-4 mb-10 text-[clamp(1.6rem,1rem+1.6vw,2.35rem)] leading-[1.16]">
            Ce qui accompagne un message
          </h2>
          <CrossLinks items={related} variant="list" />
        </>
      }
    />
  );
}
