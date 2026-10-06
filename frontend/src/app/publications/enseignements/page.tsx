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
import { getPublicationsByCategory } from "@/data/mock/publications";
import { photoPool } from "@/data/mock/images";
import { verses } from "@/data/mock/verses";
import { formatLongDate } from "@/lib/utils";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Enseignements",
  description:
    "Les messages et prédications du Centre Chrétien Jésus ma Vie, à écouter ou réécouter sur YouTube.",
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

export default function EnseignementsPage() {
  const items = getPublicationsByCategory("ENSEIGNEMENT");
  const featured = items[0];
  const featuredVideo =
    featured?.type === "VIDEO" && featured.contentUrl
      ? featured.contentUrl
      : undefined;

  return (
    <MediaPage
      rhythm="standard"
      hero={
        <HeroCompact
          tone="tinted"
          overline="Publications & Médias"
          title="Enseignements"
          intro="Les messages donnés à l'assemblée. On vient ici pour écouter : la vidéo passe avant le commentaire, et le visionnage se poursuit sur YouTube."
          aside={
            <p className="font-sans text-[0.8rem] text-ccjv-ink-secondary">
              {items.length} message{items.length > 1 ? "s" : ""} publié
              {items.length > 1 ? "s" : ""}
              {featured
                ? ` · le plus récent le ${formatLongDate(featured.publishedAt)}`
                : ""}
            </p>
          }
        />
      }
      featured={
        featured && featuredVideo ? (
          <MediaFeature
            variant="hero"
            href={featuredVideo}
            title={featured.title}
            excerpt={featured.description}
            author={featured.author}
            date={formatLongDate(featured.publishedAt)}
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
        items.length > 0 ? (
          <>
            <div className="mb-12 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
              <div className="lg:col-span-4">
                <Prose width="narrow">
                  <p>
                    Un message s&apos;écoute une première fois, puis se
                    reprend. Chaque ligne ci-dessous mène à sa page, où la vidéo
                    peut être regardée sans quitter le site.
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
              {items.map((publication) => (
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
                          YouTube
                          <span aria-hidden="true"> ↗</span>
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

            {items.length === 1 && (
              <p className="mt-8 font-sans text-[0.85rem] text-ccjv-ink-secondary">
                Les messages plus anciens apparaîtront ici au fur et à mesure de
                leur publication.
              </p>
            )}
          </>
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
          hint="Les publications de cette rubrique ne comportent aujourd'hui ni série, ni thème, et aucune durée de message n'est renseignée dans les données. Ces informations restent à fournir pour regrouper les prédications et afficher leur durée."
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
