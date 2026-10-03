import Link from "next/link";
import { notFound } from "next/navigation";
import { HeroPhoto } from "@/components/composition/HeroPhoto";
import { DetailPage } from "@/components/archetypes/DetailPage";
import { Prose } from "@/components/editorial/Prose";
import { KeyFacts } from "@/components/editorial/KeyFacts";
import { PhotoGallery } from "@/components/editorial/PhotoGallery";
import { ContentPending } from "@/components/editorial/ContentPending";
import { CrossLinks } from "@/components/editorial/CrossLinks";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { YouTubeThumb } from "@/components/shared/YouTubeThumb";
import {
  getPublicationBySlug,
  publications,
} from "@/data/mock/publications";
import { galleryImages, images } from "@/data/mock/images";
import { getYouTubeId, formatLongDate } from "@/lib/utils";
import type { Publication } from "@/types";
import { pageMetadata } from "@/lib/seo";

const typeLabel: Record<Publication["type"], string> = {
  VIDEO: "Enseignement",
  PHOTO: "Album photo",
  TEXTE: "Texte",
};

const categoryLabel: Record<NonNullable<Publication["category"]>, string> = {
  ACTUALITE: "Actualité",
  ENSEIGNEMENT: "Enseignement",
  MEDIA: "Média",
  RESSOURCE: "Ressource",
};

/** Image de repli lorsque la publication n'est pas elle-même une photographie. */
const fallbackImage: Record<Publication["type"], string> = {
  VIDEO: images.predication,
  PHOTO: images.assemblee,
  TEXTE: images.assemblee,
};

export function generateStaticParams() {
  return publications.map((publication) => ({ slug: publication.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const publication = getPublicationBySlug(slug);
  if (!publication) return {};

  return pageMetadata({
    title: publication.title,
    description:
      publication.description ??
      "Publication du Centre Chrétien Jésus ma Vie.",
    path: `/publications/${publication.slug}`,
  });
}

export default async function PublicationDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const publication = getPublicationBySlug(slug);
  if (!publication) notFound();

  const isPhoto = publication.type === "PHOTO";
  const contentUrl = publication.contentUrl;
  const isImageFile = Boolean(contentUrl && contentUrl.startsWith("/"));
  const heroImage = isImageFile && contentUrl ? contentUrl : fallbackImage[publication.type];
  const youtubeId = getYouTubeId(contentUrl);

  const related = publications
    .filter(
      (item) =>
        item.id !== publication.id &&
        (item.category === publication.category ||
          item.type === publication.type),
    )
    .slice(0, 3);

  /** Galerie associée : la photographie de l'album, puis les images voisines. */
  const gallery = [
    ...(isImageFile && contentUrl
      ? [contentUrl, ...galleryImages.filter((src) => src !== contentUrl)]
      : galleryImages),
  ].slice(0, 5);

  const paragraphs =
    publication.body && publication.body.length > 0
      ? publication.body
      : publication.description
        ? [publication.description]
        : [];

  return (
    <DetailPage
      rhythm="standard"
      media={
        <HeroPhoto
          overline={typeLabel[publication.type]}
          title={publication.title}
          image={heroImage}
          height="normal"
          caption={[
            publication.category ? categoryLabel[publication.category] : typeLabel[publication.type],
            formatLongDate(publication.publishedAt),
          ].join(" · ")}
        />
      }
      summary={
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-8">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline">{typeLabel[publication.type]}</Badge>
              {publication.category && (
                <Badge variant="outline">
                  {categoryLabel[publication.category]}
                </Badge>
              )}
            </div>

            <h2 className="mt-7 max-w-[28ch] font-serif text-[clamp(1.6rem,1rem+1.8vw,2.4rem)] leading-[1.12]">
              {publication.title}
            </h2>

            <p className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 font-sans text-[0.9rem] text-ccjv-ink-secondary">
              <time dateTime={publication.publishedAt}>
                {formatLongDate(publication.publishedAt)}
              </time>
              {publication.author && <span>{publication.author}</span>}
            </p>
          </div>
        </div>
      }
      body={
        paragraphs.length > 0 ? (
          <Prose large width="narrow">
            {paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </Prose>
        ) : (
          <ContentPending
            what="Corps de cette publication"
            hint="La publication ne contient ni texte de lecture, ni résumé : le contenu rédigé reste à fournir."
          />
        )
      }
      aside={
        <div className="flex flex-col gap-12">
          <div>
            <p className="font-sans text-xs font-semibold tracking-[0.18em] text-ccjv-green uppercase">
              Repères
            </p>
            <KeyFacts
              variant="pairs"
              className="mt-6"
              items={[
                { label: "Type", value: typeLabel[publication.type] },
                {
                  label: "Rubrique",
                  value: publication.category
                    ? categoryLabel[publication.category]
                    : "Publication",
                },
                {
                  label: "Publié le",
                  value: formatLongDate(publication.publishedAt),
                },
                ...(publication.author
                  ? [{ label: "Auteur", value: publication.author }]
                  : []),
              ]}
            />
          </div>

          {related.length > 0 && (
            <div>
              <p className="font-sans text-xs font-semibold tracking-[0.18em] text-ccjv-green uppercase">
                Contenus liés
              </p>
              <ul className="mt-6 border-t border-ccjv-line">
                {related.map((item) => (
                  <li key={item.id} className="border-b border-ccjv-line">
                    <Link
                      href={`/publications/${item.slug}`}
                      className="group flex items-baseline justify-between gap-4 py-4"
                    >
                      <span className="font-serif text-[1.02rem] leading-snug transition-colors duration-[250ms] group-hover:text-ccjv-green">
                        {item.title}
                      </span>
                      <span
                        className="font-sans text-[0.8rem] font-medium text-ccjv-green"
                        aria-hidden="true"
                      >
                        →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      }
      gallery={
        isPhoto ? (
          <>
            <h2 className="mb-10 font-sans text-[0.72rem] font-semibold tracking-[0.2em] text-ccjv-green uppercase">
              Galerie de l&apos;album
            </h2>
            <PhotoGallery variant="mosaic" images={gallery} />
          </>
        ) : publication.type === "VIDEO" && contentUrl ? (
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-3">
              <p className="font-sans text-xs font-semibold tracking-[0.18em] text-ccjv-green uppercase">
                La vidéo
              </p>
              <p className="mt-4 max-w-[34ch] font-sans text-[0.9rem] leading-relaxed text-ccjv-ink-secondary">
                Le message se regarde sur YouTube : nous n&apos;affichons ici
                que la vignette, sans lecteur intégré.
              </p>
            </div>

            <div className="lg:col-span-8 lg:col-start-5">
              <a
                href={contentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block aspect-video overflow-hidden bg-ccjv-black"
                aria-label={`Regarder « ${publication.title} » sur YouTube`}
              >
                {youtubeId && (
                  <YouTubeThumb
                    videoId={youtubeId}
                    sizes="(max-width: 1024px) 100vw, 800px"
                    className="transition-transform duration-[550ms] ease-ccjv group-hover:scale-[1.03]"
                  />
                )}
                <span
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ccjv-black/70 to-transparent"
                  aria-hidden="true"
                />
                <span
                  className="pointer-events-none absolute inset-0 flex items-center justify-center"
                  aria-hidden="true"
                >
                  <span className="flex h-16 w-16 items-center justify-center border border-white/60 bg-ccjv-black/45 transition-colors duration-[250ms] group-hover:border-ccjv-cream group-hover:bg-ccjv-black/65">
                    <svg viewBox="0 0 24 24" className="ml-1 h-6 w-6 fill-ccjv-cream">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                </span>
                <span
                  className="pointer-events-none absolute inset-x-5 bottom-5 font-sans text-[0.7rem] font-semibold tracking-[0.16em] text-white uppercase"
                  aria-hidden="true"
                >
                  Regarder sur YouTube
                </span>
              </a>

              <div className="mt-8">
                <Button variant="primary" href={contentUrl} external>
                  Regarder la vidéo sur YouTube
                </Button>
              </div>
            </div>
          </div>
        ) : undefined
      }
      relatedTitle="À découvrir aussi"
      related={
        <>
          {related.length > 0 ? (
            <ul className="border-t border-ccjv-line">
              {related.map((item) => (
                <li key={item.id} className="border-b border-ccjv-line">
                  <Link
                    href={`/publications/${item.slug}`}
                    className="group grid grid-cols-1 gap-3 py-6 sm:grid-cols-12 sm:items-baseline sm:gap-6"
                  >
                    <span className="font-sans text-[0.7rem] font-semibold tracking-[0.16em] text-ccjv-green uppercase sm:col-span-3">
                      {item.category
                        ? categoryLabel[item.category]
                        : typeLabel[item.type]}
                    </span>
                    <span className="font-serif text-[1.2rem] leading-snug transition-colors duration-[250ms] group-hover:text-ccjv-green sm:col-span-6">
                      {item.title}
                    </span>
                    <time
                      dateTime={item.publishedAt}
                      className="font-sans text-[0.78rem] text-ccjv-ink-secondary sm:col-span-3 sm:text-right"
                    >
                      {formatLongDate(item.publishedAt)}
                    </time>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="border-t border-ccjv-line pt-7 text-ccjv-ink-secondary">
              Aucun autre contenu de cette rubrique pour le moment.
            </p>
          )}

          <div className="mt-12 border-t border-ccjv-line pt-8">
            <p className="font-sans text-xs font-semibold tracking-[0.18em] text-ccjv-green uppercase">
              Toutes les rubriques
            </p>
            <div className="mt-6">
              <CrossLinks
                variant="inline"
                items={[
                  { href: "/publications/actualites", label: "Actualités" },
                  { href: "/publications/enseignements", label: "Enseignements" },
                  { href: "/publications/mediatheque", label: "Médiathèque" },
                  { href: "/publications/ressources", label: "Ressources" },
                ]}
              />
            </div>
          </div>
        </>
      }
    />
  );
}
