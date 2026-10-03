import Link from "next/link";
import Image from "next/image";
import { HeroCompact } from "@/components/composition/HeroCompact";
import { ListingPage } from "@/components/archetypes/ListingPage";
import { CrossLinks } from "@/components/editorial/CrossLinks";
import { FeatureImage } from "@/components/editorial/FeatureImage";
import { EmptyState } from "@/components/ui/EmptyState";
import { getPublicationsByCategory, publications } from "@/data/mock/publications";
import { images } from "@/data/mock/images";
import { formatLongDate } from "@/lib/utils";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Actualités",
  description:
    "Les nouvelles et annonces du Centre Chrétien Jésus ma Vie : vie de l'église, rendez-vous et informations pratiques à Lubumbashi.",
  path: "/publications/actualites",
});

export default function ActualitesPage() {
  const items = getPublicationsByCategory("ACTUALITE");
  const [lead, ...others] = items;

  /** Ce qui a été publié récemment dans les autres rubriques. */
  const elsewhere = publications
    .filter((publication) => publication.category !== "ACTUALITE")
    .slice(0, 4);

  return (
    <ListingPage
      header={
        <HeroCompact
          overline="Publications & Médias"
          title="Actualités"
          intro="Les nouvelles de la vie de l'église : annonces, rentrées, informations pratiques. Ce qui change dans les prochaines semaines se trouve ici."
          aside={
            <p className="font-sans text-[0.8rem] text-ccjv-ink-secondary">
              {items.length} actualité{items.length > 1 ? "s" : ""} publiée
              {items.length > 1 ? "s" : ""}
              {lead ? ` · dernière le ${formatLongDate(lead.publishedAt)}` : ""}
            </p>
          }
        />
      }
      lead={
        lead ? (
          <div>
            <article>
              <p className="font-sans text-xs font-semibold tracking-[0.2em] text-ccjv-green uppercase">
                À la une
              </p>

              <Link href={`/publications/${lead.slug}`} className="group mt-6 block">
                <h2 className="max-w-[20ch] font-serif text-[clamp(2rem,1.1rem+3vw,3.6rem)] leading-[1.06] transition-colors duration-[250ms] group-hover:text-ccjv-green">
                  {lead.title}
                </h2>
              </Link>

              <div className="mt-8 grid grid-cols-1 gap-8 border-t border-ccjv-line pt-8 lg:grid-cols-12">
                <p className="font-sans text-[0.8rem] text-ccjv-ink-secondary lg:col-span-3">
                  <time dateTime={lead.publishedAt}>
                    {formatLongDate(lead.publishedAt)}
                  </time>
                </p>
                <div className="lg:col-span-8 lg:col-start-5">
                  {lead.description && (
                    <p className="max-w-[62ch] text-[1.0625rem] leading-[1.7] text-ccjv-ink-secondary">
                      {lead.description}
                    </p>
                  )}
                  <Link
                    href={`/publications/${lead.slug}`}
                    className="mt-6 inline-flex items-center gap-2 font-sans text-[0.9rem] font-medium text-ccjv-green"
                  >
                    Lire l&apos;actualité
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>
            </article>

            {/* Rupture visuelle entre la une et le reste de l'index */}
            <FeatureImage
              className="mt-16"
              variant="wide"
              src={images.fraternite}
              caption="Centre Chrétien Jésus ma Vie — Lubumbashi"
            />
          </div>
        ) : (
          <EmptyState
            title="Aucune actualité pour le moment"
            description="Les nouvelles publiées depuis le back-office apparaîtront ici."
          />
        )
      }
      listTitle="Autres actualités"
      list={
        others.length > 0 ? (
          <ul className="border-t border-ccjv-line">
            {others.map((publication) => (
              <li key={publication.id} className="border-b border-ccjv-line">
                <Link
                  href={`/publications/${publication.slug}`}
                  className="group grid grid-cols-1 gap-3 py-7 sm:grid-cols-12 sm:items-baseline sm:gap-8"
                >
                  <time
                    dateTime={publication.publishedAt}
                    className="font-sans text-[0.78rem] text-ccjv-ink-secondary sm:col-span-3"
                  >
                    {formatLongDate(publication.publishedAt)}
                  </time>
                  <span className="font-serif text-[1.4rem] leading-snug transition-colors duration-[250ms] group-hover:text-ccjv-green sm:col-span-6">
                    {publication.title}
                  </span>
                  <span
                    className="font-sans text-[0.85rem] font-medium text-ccjv-green sm:col-span-3 sm:text-right"
                    aria-hidden="true"
                  >
                    Lire →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="border-t border-ccjv-line pt-7 text-ccjv-ink-secondary">
            Aucune autre actualité pour l&apos;instant. Les prochaines
            publications apparaîtront ici.
          </p>
        )
      }
      archivesTitle="Également publié sur le site"
      archives={
        <ul className="grid grid-cols-1 gap-x-12 sm:grid-cols-2">
          {elsewhere.map((publication) => (
            <li
              key={publication.id}
              className="border-t border-ccjv-line py-6 first:border-t-0 sm:[&:nth-child(2)]:border-t-0"
            >
              <Link
                href={`/publications/${publication.slug}`}
                className="group flex items-start gap-5"
              >
                {publication.type === "PHOTO" && publication.contentUrl ? (
                  <span className="relative h-20 w-28 shrink-0 overflow-hidden bg-ccjv-line">
                    <Image
                      src={publication.contentUrl}
                      alt=""
                      fill
                      sizes="112px"
                      className="object-cover transition-transform duration-[550ms] ease-ccjv group-hover:scale-[1.04]"
                    />
                  </span>
                ) : null}

                <span className="flex flex-col">
                  <span className="font-sans text-[0.7rem] font-semibold tracking-[0.16em] text-ccjv-green uppercase">
                    {publication.category === "ENSEIGNEMENT"
                      ? "Enseignement"
                      : publication.category === "MEDIA"
                        ? "Média"
                        : "Ressource"}
                  </span>
                  <span className="mt-2 font-serif text-[1.2rem] leading-snug transition-colors duration-[250ms] group-hover:text-ccjv-green">
                    {publication.title}
                  </span>
                  <time
                    dateTime={publication.publishedAt}
                    className="mt-2 font-sans text-[0.78rem] text-ccjv-ink-secondary"
                  >
                    {formatLongDate(publication.publishedAt)}
                  </time>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      }
      related={
        <CrossLinks
          variant="inline"
          items={[
            { href: "/publications/enseignements", label: "Les enseignements" },
            { href: "/publications/mediatheque", label: "La médiathèque" },
            { href: "/publications/ressources", label: "Les ressources" },
            { href: "/vie-de-leglise/evenements", label: "L'agenda" },
          ]}
        />
      }
    />
  );
}
