import Link from "next/link";
import { notFound } from "next/navigation";
import { HeroPhoto } from "@/components/composition/HeroPhoto";
import { HeroCompact } from "@/components/composition/HeroCompact";
import { DetailPage } from "@/components/archetypes/DetailPage";
import { Prose } from "@/components/editorial/Prose";
import { KeyFacts } from "@/components/editorial/KeyFacts";
import { ContentPending } from "@/components/editorial/ContentPending";
import { CrossLinks } from "@/components/editorial/CrossLinks";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ContentUnavailable } from "@/components/ui/ContentUnavailable";
import { YouTubeThumb } from "@/components/shared/YouTubeThumb";
import {
  getPublication,
  getPublications,
  readOrUnavailable,
} from "@/lib/api/endpoints";
import type { PublicationRecord } from "@/lib/api/types";
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

const IMAGE_FILE_PATTERN = /\.(?:avif|gif|jpe?g|png|webp)(?:\?.*)?$/i;

/**
 * Décide si l'URL de contenu d'une publication peut être affichée comme
 * photographie. L'API renvoie soit un chemin local (`/media/…`), soit une URL
 * Supabase Storage absolue ; un lien YouTube n'est jamais une image.
 */
function isImageSource(url?: string): boolean {
  if (!url) return false;
  if (url.startsWith("/")) return true;
  if (getYouTubeId(url)) return false;

  return (
    /^https?:\/\//i.test(url) &&
    (IMAGE_FILE_PATTERN.test(url) || url.includes("/storage/v1/object/public/"))
  );
}

/**
 * Résultat d'une lecture unitaire, où **absent** et **illisible** sont deux
 * états distincts.
 *
 * `getPublication` ne lève jamais : elle renvoie `null` aussi bien quand la
 * publication n'existe pas (HTTP 404 — c'est aussi le cas d'un brouillon, que
 * la lecture publique ne renvoie pas) que lorsque l'API est injoignable. Seul
 * le statut porté par l'`ApiError` permet de trancher : « introuvable » se
 * termine en `notFound()`, une panne en `ContentUnavailable`.
 */
type PublicationRead =
  | { status: "ok"; data: PublicationRecord }
  | { status: "missing" }
  | { status: "unreachable" };

async function readPublication(slug: string): Promise<PublicationRead> {
  const failures: Array<{ status: number | null }> = [];

  const publication = await getPublication(slug, {
    onFailure: (error) => {
      failures.push({ status: error.status });
    },
  });

  if (publication !== null) return { status: "ok", data: publication };

  return failures.some((failure) => failure.status === 404)
    ? { status: "missing" }
    : { status: "unreachable" };
}

/**
 * Pré-génère une fiche par publication publiée.
 *
 * ⚠️ Cette fonction s'exécute **au build** : si l'API est injoignable à ce
 * moment-là (conteneur Railway endormi, réseau coupé), elle doit renvoyer `[]`
 * sans jamais échouer — sinon le déploiement Vercel casse. Les fiches restent
 * accessibles à la demande (`dynamicParams` par défaut) et seront pré-générées
 * au build suivant.
 */
export async function generateStaticParams() {
  const result = await readOrUnavailable((options) =>
    getPublications({ limit: 100 }, options),
  );

  if (result.status === "unreachable") return [];

  return result.data.map((publication) => ({ slug: publication.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const read = await readPublication(slug);

  /*
   * Aucune métadonnée n'est affirmée quand la publication est absente ou
   * illisible : décrire un contenu qu'on n'a pas lu serait pire que de laisser
   * les métadonnées par défaut du layout.
   */
  if (read.status !== "ok") return {};

  const publication = read.data;

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
  const read = await readPublication(slug);

  if (read.status === "unreachable") {
    return (
      <div className="container py-[clamp(3rem,7vw,6rem)]">
        <ContentUnavailable resource="Cette publication" />
      </div>
    );
  }

  if (read.status === "missing") notFound();

  const publication = read.data;
  const contentUrl = publication.contentUrl;
  /**
   * Uniquement le média réel de la publication : `contentUrl` d'abord, puis la
   * couverture résolue par l'API. L'API n'expose **aucun** champ de galerie :
   * une publication PHOTO sans média n'affiche donc pas d'image, plutôt que
   * d'en emprunter une à un autre contenu.
   */
  const imageSource = [contentUrl, publication.coverImage].find(isImageSource);
  const youtubeId = getYouTubeId(contentUrl);

  /** Contenus liés : la même rubrique, sinon le même type de publication. */
  const relatedRead = await readOrUnavailable((options) =>
    publication.category
      ? getPublications({ category: publication.category, limit: 8 }, options)
      : getPublications({ type: publication.type, limit: 8 }, options),
  );

  const related =
    relatedRead.status === "ok"
      ? relatedRead.data
          .filter(
            (item) =>
              item.id !== publication.id &&
              (item.category === publication.category ||
                item.type === publication.type),
          )
          .slice(0, 3)
      : [];

  const paragraphs =
    publication.body && publication.body.length > 0
      ? publication.body
      : publication.description
        ? [publication.description]
        : [];

  const metaLine = [
    publication.category
      ? categoryLabel[publication.category]
      : typeLabel[publication.type],
    formatLongDate(publication.publishedAt),
  ].join(" · ");

  return (
    <DetailPage
      rhythm="standard"
      media={
        imageSource ? (
          <HeroPhoto
            overline={typeLabel[publication.type]}
            title={publication.title}
            image={imageSource}
            height="normal"
            caption={metaLine}
          />
        ) : (
          /* Sans média réel, l'en-tête reste typographique : aucune photographie
             ne vient illustrer une publication qui n'en a pas fourni. */
          <HeroCompact
            overline={typeLabel[publication.type]}
            title={publication.title}
            aside={
              <p className="font-sans text-[0.8rem] text-ccjv-ink-secondary">
                {metaLine}
              </p>
            }
          />
        )
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
        publication.type === "VIDEO" && contentUrl ? (
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
          {relatedRead.status === "unreachable" ? (
            <ContentUnavailable resource="Les contenus liés" />
          ) : related.length > 0 ? (
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
