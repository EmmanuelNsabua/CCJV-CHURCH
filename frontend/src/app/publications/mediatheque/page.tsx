import Image from "next/image";
import Link from "next/link";
import { HeroBackdrop } from "@/components/composition/HeroBackdrop";
import { MediaPage } from "@/components/archetypes/MediaPage";
import { Prose } from "@/components/editorial/Prose";
import { MediaFeature } from "@/components/editorial/MediaFeature";
import { PhotoGallery } from "@/components/editorial/PhotoGallery";
import { CrossLinks } from "@/components/editorial/CrossLinks";
import { EmptyState } from "@/components/ui/EmptyState";
import { ContentUnavailable } from "@/components/ui/ContentUnavailable";
import { getPublications, readOrUnavailable } from "@/lib/api/endpoints";
import { images } from "@/data/images";
import { formatLongDate, getYouTubeId } from "@/lib/utils";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Médiathèque",
  description:
    "Photos et vidéos des moments vécus ensemble au Centre Chrétien Jésus ma Vie : cultes, célébrations et vie communautaire.",
  path: "/publications/mediatheque",
});

export default async function MediathequePage() {
  /*
   * Les albums et la vidéo mise en avant sont **les publications réelles** de
   * l'API : un album est une publication de type PHOTO accompagnée de son
   * média, la vidéo est la dernière publication vidéo d'enseignement. Aucune
   * image n'est empruntée à un autre contenu pour combler un média manquant.
   */
  const [photosRead, videosRead] = await Promise.all([
    readOrUnavailable((options) =>
      getPublications({ type: "PHOTO", limit: 50 }, options),
    ),
    readOrUnavailable((options) =>
      getPublications({ type: "VIDEO", category: "ENSEIGNEMENT", limit: 10 }, options),
    ),
  ]);

  /** Albums publiés : les publications photo accompagnées d'un média réel. */
  const albums =
    photosRead.status === "ok"
      ? photosRead.data.flatMap((publication) => {
          /* L'API peut renvoyer la photo en `coverImage` plutôt qu'en `contentUrl`. */
          const image = publication.coverImage ?? publication.contentUrl;
          if (!image) return [];

          return [
            {
              id: publication.id,
              title: publication.title,
              slug: publication.slug,
              description: publication.description,
              publishedAt: publication.publishedAt,
              image,
            },
          ];
        })
      : [];

  /** Vidéo mise en avant : le message vidéo publié le plus récent. */
  const latestVideo =
    videosRead.status === "ok"
      ? videosRead.data.find((publication) => Boolean(publication.contentUrl))
      : undefined;
  const videoUrl = latestVideo?.contentUrl;

  /*
   * `MediaFeature` annonce une vidéo « à regarder sur YouTube » : elle n'est
   * employée que si le média publié est réellement un lien YouTube. Une vidéo
   * hébergée ailleurs est présentée par sa fiche.
   */
  const videoOnYouTube = videoUrl ? Boolean(getYouTubeId(videoUrl)) : false;

  return (
    <MediaPage
      rhythm="standard"
      hero={
        <HeroBackdrop
          title={
            <>
              Ce que nous avons <span className="italic text-ccjv-cream">vécu</span>.
            </>
          }
          intro="Une communauté se souvient aussi par ce qu'elle a vu. Ces images sont faites pour être revues, pas seulement conservées."
          image={images.communaute}
        />
      }
      featured={
        <>
          <Prose className="mb-14 max-w-[62ch]" large>
            <p>
              La médiathèque rassemble deux manières de revoir : la vidéo d&apos;un
              message, et les albums photographiques publiés après un moment
              vécu ensemble.
            </p>
          </Prose>

          {videosRead.status === "unreachable" ? (
            <ContentUnavailable resource="La vidéo à la une" />
          ) : latestVideo && videoUrl && videoOnYouTube ? (
            <MediaFeature
              variant="hero"
              href={videoUrl}
              title={latestVideo.title}
              excerpt={latestVideo.description}
              author={latestVideo.author}
              date={formatLongDate(latestVideo.publishedAt)}
            />
          ) : latestVideo ? (
            /* Vidéo réelle non hébergée sur YouTube : présentée par sa fiche. */
            <div className="border-t border-ccjv-line pt-10">
              <p className="font-sans text-[0.7rem] font-semibold tracking-[0.2em] text-ccjv-green uppercase">
                Dernier enseignement
              </p>
              <Link
                href={`/publications/${latestVideo.slug}`}
                className="group mt-5 block"
              >
                <h3 className="max-w-[30ch] font-serif text-[clamp(1.7rem,1rem+1.9vw,2.6rem)] leading-[1.12] transition-colors duration-[250ms] group-hover:text-ccjv-green">
                  {latestVideo.title}
                </h3>
              </Link>
              {latestVideo.description && (
                <p className="mt-6 max-w-[60ch] text-[1.02rem] leading-[1.7] text-ccjv-ink-secondary">
                  {latestVideo.description}
                </p>
              )}
              <p className="mt-6 font-sans text-[0.88rem] text-ccjv-ink-secondary">
                {[latestVideo.author, formatLongDate(latestVideo.publishedAt)]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <Link
                href={`/publications/${latestVideo.slug}`}
                className="group mt-8 inline-flex items-center gap-3 border border-ccjv-ink px-6 py-3 font-sans text-[0.9rem] font-medium transition-colors duration-[250ms] hover:border-ccjv-green hover:text-ccjv-green"
              >
                Voir la vidéo
                <span aria-hidden="true" className="transition-transform duration-[250ms] group-hover:translate-x-1">
                  →
                </span>
              </Link>
            </div>
          ) : (
            <EmptyState
              title="Aucune vidéo pour le moment"
              description="Les vidéos publiées depuis le back-office apparaîtront ici."
            />
          )}
        </>
      }
      galleryTitle="Galerie"
      /*
       * La bande « Galerie » ne montre que des médias réels (couvertures des
       * albums). Quand il n'y en a aucun, elle est simplement omise : les états
       * « vide » et « injoignable » sont portés une seule fois, par la section
       * des albums, pour ne pas annoncer deux fois la même chose.
       */
      gallery={
        albums.length > 0 ? (
          <>
            <PhotoGallery
              variant="mosaic"
              images={albums.slice(0, 5).map((album) => album.image)}
              captions={albums.slice(0, 5).map((album) => album.title)}
            />
            {albums.length > 5 && (
              <PhotoGallery
                variant="columns"
                className="mt-16 lg:mt-20"
                images={albums.slice(5, 11).map((album) => album.image)}
                captions={albums.slice(5, 11).map((album) => album.title)}
              />
            )}
          </>
        ) : undefined
      }
      collectionsTitle="Albums publiés"
      collections={
        photosRead.status === "unreachable" ? (
          <ContentUnavailable resource="Les albums photo" />
        ) : albums.length > 0 ? (
          <ul className="border-t border-ccjv-line">
            {albums.map((album) => (
              <li key={album.id} className="border-b border-ccjv-line">
                <Link
                  href={`/publications/${album.slug}`}
                  className="group grid grid-cols-1 gap-6 py-8 sm:grid-cols-12 sm:items-center sm:gap-8"
                >
                  <div className="sm:col-span-2">
                    <div className="relative aspect-square overflow-hidden bg-ccjv-line">
                      <Image
                        src={album.image}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 100vw, 16vw"
                        className="object-cover transition-transform duration-[550ms] ease-ccjv group-hover:scale-[1.03]"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-7">
                    <h3 className="font-serif text-[1.35rem] leading-snug transition-colors duration-[250ms] group-hover:text-ccjv-green">
                      {album.title}
                    </h3>
                    {album.description && (
                      <p className="mt-2 max-w-[62ch] font-sans text-[0.92rem] leading-relaxed text-ccjv-ink-secondary">
                        {album.description}
                      </p>
                    )}
                  </div>

                  <div className="font-sans text-[0.85rem] text-ccjv-ink-secondary sm:col-span-3 sm:text-right">
                    <time dateTime={album.publishedAt}>
                      {formatLongDate(album.publishedAt)}
                    </time>
                    <span className="mt-2 block font-medium text-ccjv-green">
                      Ouvrir l&apos;album →
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="Aucun album publié"
            description="Les albums publiés depuis le back-office apparaîtront ici."
          />
        )
      }
      related={
        <>
          <p className="font-sans text-xs font-semibold tracking-[0.18em] text-ccjv-green uppercase">
            Continuer
          </p>
          <h2 className="mt-4 mb-8 text-[clamp(1.6rem,1rem+1.6vw,2.35rem)] leading-[1.16]">
            Retrouver ce qui a été dit et partagé
          </h2>
          <CrossLinks
            variant="inline"
            items={[
              { href: "/publications/enseignements", label: "Les enseignements" },
              { href: "/publications/actualites", label: "Les actualités" },
              { href: "/publications/ressources", label: "Les ressources" },
              { href: "/vie-de-leglise/evenements", label: "L'agenda" },
            ]}
          />
        </>
      }
    />
  );
}
