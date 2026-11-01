import Link from "next/link";
import { HeroEditorial } from "@/components/composition/HeroEditorial";
import { ListingPage } from "@/components/archetypes/ListingPage";
import { CrossLinks, type CrossLink } from "@/components/editorial/CrossLinks";
import { ScopeFilterTabs } from "@/components/editorial/ScopeFilterTabs";
import { EmptyState } from "@/components/ui/EmptyState";
import { ContentUnavailable } from "@/components/ui/ContentUnavailable";
import { Badge } from "@/components/ui/Badge";
import { getPublications, readOrUnavailable } from "@/lib/api/endpoints";
import { images } from "@/data/images";
import { formatLongDate } from "@/lib/utils";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Publications",
  description:
    "Toutes les publications, actualités, enseignements et ressources du Centre Chrétien Jésus ma Vie et de l'Ecodim.",
  path: "/publications",
});

const crossLinks: CrossLink[] = [
  {
    href: "/publications/actualites",
    label: "Les actualités",
    description: "Les annonces et nouvelles fraîches de la communauté.",
  },
  {
    href: "/publications/enseignements",
    label: "Les enseignements",
    description: "Les prédications et messages bibliques pour grandir dans la foi.",
  },
  {
    href: "/publications/mediatheque",
    label: "La médiathèque",
    description: "Photos et vidéos des cultes et rassemblements.",
  },
  {
    href: "/publications/ressources",
    label: "Les ressources",
    description: "Documents, livrets et guides d'étude téléchargeables.",
  },
];

interface PublicationsPageProps {
  searchParams?: Promise<{ scope?: string }>;
}

export default async function PublicationsPage(props: PublicationsPageProps) {
  const searchParams = await props.searchParams;
  const activeScope: "CCJV" | "ECODIM" =
    searchParams?.scope === "ECODIM" ? "ECODIM" : "CCJV";

  const [itemsRead, allRead] = await Promise.all([
    readOrUnavailable((options) =>
      getPublications({ scope: activeScope, limit: 30 }, options),
    ),
    readOrUnavailable((options) => getPublications({ limit: 100 }, options)),
  ]);

  const allPublications = allRead.status === "ok" ? allRead.data : [];
  const ccjvCount = allPublications.filter((p) => !p.scope || p.scope === "CCJV").length;
  const ecodimCount = allPublications.filter((p) => p.scope === "ECODIM").length;

  const items = itemsRead.status === "ok" ? itemsRead.data : [];
  const [lead, ...others] = items;

  return (
    <ListingPage
      header={
        <HeroEditorial
          title={activeScope === "ECODIM" ? "Publications Ecodim" : "Publications CCJV"}
          intro={
            activeScope === "ECODIM"
              ? "Actualités, ressources pédagogiques, activités et leçons de l'École du Dimanche pour l'édification spirituelle des enfants et des familles."
              : "Les communications officielles, enseignements et ressources du Centre Chrétien Jésus ma Vie pour nourrir votre marche avec le Seigneur."
          }
          image={images.assemblee}
          imageAlt="Assemblée réunie au Centre Chrétien Jésus ma Vie"
          action={{ label: "Consulter les publications ↓", href: "#contenu" }}
        />
      }
      lead={
        <div id="contenu" className="scroll-mt-28">
          <ScopeFilterTabs
            activeScope={activeScope}
            baseHref="/publications"
            ccjvLabel="CCJV"
            ecodimLabel="ECODIM"
            counts={{
              ccjv: ccjvCount,
              ecodim: ecodimCount,
            }}
          />

          {itemsRead.status === "unreachable" ? (
            <ContentUnavailable resource="Les publications" />
          ) : lead ? (
            <article className="border border-ccjv-line p-8 bg-ccjv-surface/30 rounded-none mb-12">
              <div className="flex items-center gap-3 mb-4">
                <span className="font-sans text-xs font-semibold tracking-[0.2em] text-ccjv-green uppercase">
                  Dernière parution
                </span>
                {lead.category && (
                  <Badge variant="outline">{lead.category}</Badge>
                )}
                <time
                  dateTime={lead.publishedAt}
                  className="font-sans text-xs text-ccjv-ink-secondary ml-auto"
                >
                  {formatLongDate(lead.publishedAt)}
                </time>
              </div>

              <Link href={`/publications/${lead.slug}`} className="group block">
                <h2 className="max-w-[28ch] font-serif text-[clamp(1.75rem,1.2rem+2vw,2.75rem)] leading-tight transition-colors duration-[250ms] group-hover:text-ccjv-green">
                  {lead.title}
                </h2>
              </Link>

              {lead.description && (
                <p className="mt-4 font-sans text-sm text-ccjv-ink-secondary max-w-[65ch] leading-relaxed">
                  {lead.description}
                </p>
              )}

              <div className="mt-6 pt-4 border-t border-ccjv-line/60 flex items-center justify-between">
                <Link
                  href={`/publications/${lead.slug}`}
                  className="font-sans text-xs font-semibold uppercase tracking-wider text-ccjv-green hover:underline"
                >
                  Lire la publication →
                </Link>
                {lead.author && (
                  <span className="font-sans text-xs text-ccjv-ink-secondary">
                    Par {lead.author}
                  </span>
                )}
              </div>
            </article>
          ) : (
            <EmptyState
              title={
                activeScope === "ECODIM"
                  ? "Aucune publication Ecodim pour le moment"
                  : "Aucune publication pour le moment"
              }
              description={
                activeScope === "ECODIM"
                  ? "Les publications attribuées à l'Ecodim apparaîtront ici."
                  : "Les publications ajoutées depuis le back-office apparaîtront ici."
              }
            />
          )}
        </div>
      }
      listTitle={
        others.length > 0
          ? activeScope === "ECODIM"
            ? "Autres publications de l'Ecodim"
            : "Autres publications récentes"
          : undefined
      }
      list={
        others.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {others.map((pub) => (
              <article
                key={pub.id}
                className="border border-ccjv-line p-6 flex flex-col justify-between rounded-none bg-ccjv-surface/20 hover:border-ccjv-green transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-sans text-[0.72rem] text-ccjv-ink-secondary">
                      {formatLongDate(pub.publishedAt)}
                    </span>
                    {pub.category && (
                      <span className="font-sans text-[0.68rem] tracking-wider uppercase font-semibold text-ccjv-green">
                        {pub.category}
                      </span>
                    )}
                  </div>

                  <Link href={`/publications/${pub.slug}`} className="group block">
                    <h4 className="font-serif text-lg leading-snug transition-colors group-hover:text-ccjv-green">
                      {pub.title}
                    </h4>
                  </Link>

                  {pub.description && (
                    <p className="mt-3 font-sans text-xs text-ccjv-ink-secondary line-clamp-3 leading-relaxed">
                      {pub.description}
                    </p>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-ccjv-line/40 flex items-center justify-between">
                  <Link
                    href={`/publications/${pub.slug}`}
                    className="font-sans text-xs font-semibold uppercase tracking-wider text-ccjv-green hover:underline"
                  >
                    Consulter →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : null
      }
      related={
        <div className="space-y-12">
          <CrossLinks items={crossLinks} />
        </div>
      }
    />
  );
}
