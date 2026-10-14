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
import { listEnseignements, getPublications } from "@/lib/api/endpoints";
import { photoPool } from "@/data/mock/images";
import { verses } from "@/data/mock/verses";
import { formatLongDate } from "@/lib/utils";
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
  // Récupérer les prédications publiées du modèle métier Enseignement
  const teachingsRes = await listEnseignements({ limit: 50 });
  const teachings = teachingsRes.items;

  // Récupération facultative des publications génériques de secours si aucun enseignement n'est encore publié
  const legacyPublications =
    teachings.length === 0
      ? await getPublications({ category: "ENSEIGNEMENT", limit: 50 })
      : [];

  const featuredTeaching = teachings[0];
  const primaryMedia = featuredTeaching?.medias?.find((m) => m.isPrimary);

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
              {teachings.length > 0
                ? `${teachings.length} message${teachings.length > 1 ? "s" : ""} publié${teachings.length > 1 ? "s" : ""}`
                : `${legacyPublications.length} message${legacyPublications.length > 1 ? "s" : ""}`}
              {featuredTeaching
                ? ` · le plus récent le ${formatLongDate(featuredTeaching.preachedAt)}`
                : ""}
            </p>
          }
        />
      }
      featured={
        featuredTeaching && primaryMedia?.media?.publicUrl ? (
          <MediaFeature
            variant="hero"
            href={`/publications/enseignements/${featuredTeaching.slug}`}
            title={featuredTeaching.title}
            excerpt={featuredTeaching.summary || featuredTeaching.description || undefined}
            author={featuredTeaching.speakerName}
            date={formatLongDate(featuredTeaching.preachedAt)}
          />
        ) : (
          <EmptyState
            title="Aucun enseignement pour le moment"
            description="Les messages publiés depuis le back-office apparaîtront ici."
          />
        )
      }
      listingTitle="Toutes les prédications"
      listing={
        teachings.length > 0 ? (
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

              <div className="lg:col-span-5 lg:col-start-8">
                <ScriptureBlock
                  variant="inline"
                  context="Pourquoi nous revenons à la Parole"
                  text={verses.parole.text}
                  reference={verses.parole.reference}
                />
              </div>
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
        ) : legacyPublications.length > 0 ? (
          <ul className="border-t border-ccjv-line">
            {legacyPublications.map((publication) => (
              <li key={publication.id} className="border-b border-ccjv-line">
                <div className="grid grid-cols-1 gap-3 py-7 sm:grid-cols-12 sm:items-baseline sm:gap-6">
                  <time
                    dateTime={publication.publishedAt}
                    className="font-sans text-[0.78rem] text-ccjv-ink-secondary sm:col-span-2"
                  >
                    {formatLongDate(publication.publishedAt)}
                  </time>

                  <div className="sm:col-span-6">
                    <Link
                      href={`/publications/${publication.slug}`}
                      className="font-serif text-[1.3rem] leading-snug transition-colors duration-[250ms] hover:text-ccjv-green"
                    >
                      {publication.title}
                    </Link>
                    {publication.description && (
                      <p className="mt-2 max-w-[62ch] font-sans text-[0.92rem] leading-relaxed text-ccjv-ink-secondary">
                        {publication.description}
                      </p>
                    )}
                  </div>

                  <p className="font-sans text-[0.85rem] text-ccjv-ink-secondary sm:col-span-2">
                    {publication.author ?? "Auteur non renseigné"}
                  </p>

                  <p className="sm:col-span-2 sm:text-right">
                    {publication.type === "VIDEO" && publication.contentUrl ? (
                      <a
                        href={publication.contentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-sans text-[0.85rem] font-medium text-ccjv-green underline decoration-1 underline-offset-4"
                      >
                        YouTube ↗
                      </a>
                    ) : (
                      <span className="font-sans text-[0.85rem] text-ccjv-ink-secondary">
                        Vidéo à venir
                      </span>
                    )}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="Aucune prédication publiée"
            description="La liste des messages apparaîtra ici dès la première publication."
          />
        )
      }
      galleryTitle="En images"
      gallery={<PhotoGallery variant="strip" images={photoPool.slice(0, 3)} />}
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
