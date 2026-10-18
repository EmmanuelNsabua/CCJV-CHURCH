import Link from "next/link";
import { BookOpen, Mic, Video } from "lucide-react";
import { HeroEditorial } from "@/components/composition/HeroEditorial";
import { MediaPage } from "@/components/archetypes/MediaPage";
import { Prose } from "@/components/editorial/Prose";
import { PhotoGallery } from "@/components/editorial/PhotoGallery";
import { ScriptureBlock } from "@/components/editorial/ScriptureBlock";
import { CrossLinks, type CrossLink } from "@/components/editorial/CrossLinks";
import { EmptyState } from "@/components/ui/EmptyState";
import { ContentUnavailable } from "@/components/ui/ContentUnavailable";
import { TeachingFeature } from "@/features/publications/TeachingFeature";
import {
  enseignementHref,
  getScriptures,
  listAllEnseignements,
  pickMostRecentlyPublished,
  readOrUnavailable,
} from "@/lib/api/endpoints";
import { formatLongDate } from "@/lib/utils";
import { images } from "@/data/images";
import { pageMetadata } from "@/lib/seo";
import type { EnseignementRecord } from "@/lib/api/types";

export const metadata = pageMetadata({
  title: "Enseignements",
  description:
    "Les messages et prédications du Centre Chrétien Jésus ma Vie, à écouter ou à réécouter.",
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

/** Média lisible de l'enseignement : la vidéo prime, sinon l'audio. */
function playableRole(teaching: EnseignementRecord): "VIDEO" | "AUDIO" | null {
  const hasVideo = teaching.medias.some(
    (media) => media.role === "VIDEO" && Boolean(media.url),
  );
  if (hasVideo) return "VIDEO";

  const hasAudio = teaching.medias.some(
    (media) => media.role === "AUDIO" && Boolean(media.url),
  );
  return hasAudio ? "AUDIO" : null;
}

/**
 * Page publique des enseignements.
 *
 * Lecture réelle : **tous** les enseignements publiés (`listAllEnseignements`
 * parcourt les pages de l'API, aucune limite arbitraire), et le verset
 * éditorial. Les brouillons et les archives ne remontent jamais : le serveur
 * force `status = PUBLISHED` pour toute requête non administrative.
 *
 * Aucune donnée de remplacement n'est inventée : une liste vide donne un état
 * vide explicite, une API injoignable un état d'indisponibilité.
 */
export default async function EnseignementsPage() {
  const [teachingsRead, scripturesRead] = await Promise.all([
    readOrUnavailable((options) => listAllEnseignements(options)),
    readOrUnavailable((options) => getScriptures(options)),
  ]);

  const teachings =
    teachingsRead.status === "ok" ? teachingsRead.data : [];
  const teachingsUnavailable = teachingsRead.status === "unreachable";

  const verse =
    scripturesRead.status === "ok"
      ? scripturesRead.data.find((scripture) => scripture.key === "parole")
      : undefined;

  /*
   * Mise en avant : le message **le plus récemment publié**, sélectionné sur
   * `publishedAt` (jamais sur la date de prédication ni la date de création).
   */
  const featured = pickMostRecentlyPublished(teachings);

  /*
   * Le message mis en avant est déjà accessible juste au-dessus : on ne le
   * répète pas dans la liste, mais toutes les autres prédications publiées y
   * figurent — l'accès à l'ensemble est donc conservé.
   */
  const others = featured
    ? teachings.filter((teaching) => teaching.id !== featured.id)
    : teachings;

  /** Vignettes réellement rattachées aux messages publiés. */
  const thumbnails = teachings.flatMap((teaching) => {
    const thumbnail = teaching.medias.find(
      (media) => media.role === "THUMBNAIL" && Boolean(media.url),
    );
    return thumbnail?.url
      ? [{ url: thumbnail.url, title: teaching.title }]
      : [];
  });

  const listingTitle = featured ? "Les autres messages" : "Toutes les prédications";

  return (
    <MediaPage
      rhythm="standard"
      hero={
        <HeroEditorial
          title="Enseignements"
          intro="Les messages et prédications donnés à l'assemblée du Centre Chrétien Jésus ma Vie. On vient ici pour écouter, méditer les Écritures et grandir dans la foi."
          image={images.predication}
          imageAlt="Assemblée attentive pendant la prédication, au Centre Chrétien Jésus ma Vie"
          action={{ label: "Écouter les prédications ↓", href: "#messages" }}
        />
      }
      featured={
        /* Cible de l'action du héros : elle existe même sans message publié,
           pour qu'aucun bouton ne mène nulle part. */
        <div id="messages" className="scroll-mt-28">
          {teachingsUnavailable ? (
            <ContentUnavailable resource="Les enseignements" />
          ) : featured ? (
            <>
              <p className="mb-8 font-sans text-xs font-semibold tracking-[0.18em] text-ccjv-green uppercase">
                Le dernier message publié
              </p>
              <TeachingFeature teaching={featured} />
            </>
          ) : (
            <EmptyState
              title="Aucun enseignement pour le moment"
              description="Les messages publiés depuis le back-office apparaîtront ici."
            />
          )}
        </div>
      }
      listingTitle={listingTitle}
      listing={
        teachingsUnavailable ? (
          <ContentUnavailable resource="La liste des prédications" />
        ) : others.length > 0 ? (
          <>
            <div className="mb-12 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
              <div className="lg:col-span-4">
                <Prose width="narrow">
                  <p>
                    Un message s&apos;écoute une première fois, puis se reprend.
                    Retrouvez pour chaque prédication les passages bibliques
                    étudiés ainsi que le support audio ou vidéo associé.
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
              {others.map((teaching) => {
                const role = playableRole(teaching);
                const href = enseignementHref(teaching);

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
                          href={href}
                          className="font-serif text-[1.3rem] leading-snug transition-colors duration-[250ms] hover:text-ccjv-green"
                        >
                          {teaching.title}
                        </Link>

                        {teaching.summary && (
                          <p className="mt-2 max-w-[62ch] font-sans text-[0.92rem] leading-relaxed text-ccjv-ink-secondary">
                            {teaching.summary}
                          </p>
                        )}

                        {teaching.biblicalReferences.length > 0 && (
                          <div className="mt-3 flex flex-wrap items-center gap-1.5">
                            <BookOpen
                              aria-hidden="true"
                              className="h-3.5 w-3.5 shrink-0 text-ccjv-green"
                            />
                            {teaching.biblicalReferences.map((reference) => (
                              <span
                                key={reference.id}
                                className="inline-block border border-ccjv-line bg-ccjv-offwhite px-2 py-0.5 font-serif text-[11px] text-ccjv-ink"
                              >
                                {reference.formatted}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <p className="font-sans text-[0.85rem] text-ccjv-ink-secondary sm:col-span-2">
                        {teaching.speakerName}
                      </p>

                      <div className="sm:col-span-2 sm:text-right">
                        {role ? (
                          <Link
                            href={href}
                            className="inline-flex items-center gap-1.5 font-sans text-[0.85rem] font-medium text-ccjv-green hover:underline"
                          >
                            {role === "VIDEO" ? (
                              <Video aria-hidden="true" className="h-3.5 w-3.5" />
                            ) : (
                              <Mic aria-hidden="true" className="h-3.5 w-3.5" />
                            )}
                            {role === "VIDEO" ? "Voir la vidéo" : "Écouter l'audio"}
                          </Link>
                        ) : (
                          <Link
                            href={href}
                            className="font-sans text-[0.85rem] font-medium text-ccjv-green hover:underline"
                          >
                            Fiche du message
                          </Link>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        ) : featured ? (
          <Prose width="narrow">
            <p>
              Un seul message est publié pour le moment. Les prochaines
              prédications apparaîtront ici dès leur publication.
            </p>
          </Prose>
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
        thumbnails.length > 0 && !teachingsUnavailable ? (
          <PhotoGallery
            variant="strip"
            images={thumbnails.slice(0, 6).map((thumbnail) => thumbnail.url)}
            captions={thumbnails.slice(0, 6).map((thumbnail) => thumbnail.title)}
          />
        ) : undefined
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
