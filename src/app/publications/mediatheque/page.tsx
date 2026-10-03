import Image from "next/image";
import Link from "next/link";
import { HeroImmersive } from "@/components/composition/HeroImmersive";
import { MediaPage } from "@/components/archetypes/MediaPage";
import { Prose } from "@/components/editorial/Prose";
import { MediaFeature } from "@/components/editorial/MediaFeature";
import { PhotoGallery } from "@/components/editorial/PhotoGallery";
import { CrossLinks } from "@/components/editorial/CrossLinks";
import { EmptyState } from "@/components/ui/EmptyState";
import { getPublicationsByCategory } from "@/data/mock/publications";
import { images, photoPool } from "@/data/mock/images";
import { formatLongDate } from "@/lib/utils";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Médiathèque",
  description:
    "Photos et vidéos des moments vécus ensemble au Centre Chrétien Jésus ma Vie : cultes, célébrations et vie communautaire.",
  path: "/publications/mediatheque",
});

export default function MediathequePage() {
  /** Albums publiés : les entrées de la rubrique média de type photographie. */
  const albums = getPublicationsByCategory("MEDIA").flatMap((publication) =>
    publication.contentUrl
      ? [
          {
            id: publication.id,
            title: publication.title,
            slug: publication.slug,
            description: publication.description,
            publishedAt: publication.publishedAt,
            image: publication.contentUrl,
          },
        ]
      : [],
  );

  /** Vidéo mise en avant : le message le plus récent publié sur YouTube. */
  const latestVideo = getPublicationsByCategory("ENSEIGNEMENT")[0];
  const videoUrl =
    latestVideo?.type === "VIDEO" && latestVideo.contentUrl
      ? latestVideo.contentUrl
      : undefined;

  return (
    <MediaPage
      rhythm="standard"
      hero={
        <HeroImmersive
          align="center"
          overline="Publications & Médias"
          title="Médiathèque"
          text="Ce que nous avons vécu, gardé en images. Une communauté se souvient aussi par ce qu'elle a vu — et ces images sont faites pour être revues, pas seulement conservées."
          image={images.communaute}
          caption="Centre Chrétien Jésus ma Vie — Lubumbashi"
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

          {latestVideo && videoUrl ? (
            <MediaFeature
              variant="hero"
              href={videoUrl}
              title={latestVideo.title}
              excerpt={latestVideo.description}
              author={latestVideo.author}
              date={formatLongDate(latestVideo.publishedAt)}
            />
          ) : (
            <EmptyState
              title="Aucune vidéo pour le moment"
              description="Les vidéos publiées depuis le back-office apparaîtront ici."
            />
          )}
        </>
      }
      galleryTitle="Galerie"
      gallery={
        <>
          <PhotoGallery variant="mosaic" images={photoPool.slice(0, 5)} />
          <PhotoGallery
            variant="columns"
            className="mt-16 lg:mt-20"
            images={photoPool.slice(5, 11)}
          />
        </>
      }
      collectionsTitle="Albums publiés"
      collections={
        albums.length > 0 ? (
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
