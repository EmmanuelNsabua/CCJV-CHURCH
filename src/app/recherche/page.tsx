import { HeroPractical } from "@/components/composition/HeroPractical";
import { InformationPage } from "@/components/archetypes/InformationPage";
import { Prose } from "@/components/editorial/Prose";
import { CrossLinks } from "@/components/editorial/CrossLinks";
import {
  SearchClient,
  type SearchEntry,
} from "@/features/search/SearchClient";
import { primaryNav } from "@/lib/nav";
import { events } from "@/data/mock/events";
import { departments } from "@/data/mock/departments";
import { publications } from "@/data/mock/publications";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Recherche",
  description:
    "Rechercher un contenu sur le site du Centre Chrétien Jésus ma Vie : pages, événements, départements, enseignements et ressources.",
  path: "/recherche",
});

/** Index construit au rendu serveur à partir des données réelles du site. */
function buildIndex(): SearchEntry[] {
  const entries: SearchEntry[] = [];

  for (const item of primaryNav) {
    // Un pôle n'a pas de page : il n'a rien à faire dans l'index de recherche.
    if (item.href) {
      entries.push({
        href: item.href,
        title: item.label,
        description: item.description ?? "",
        kind: "Page",
      });
    }
    for (const child of item.children ?? []) {
      entries.push({
        href: child.href,
        title: child.label,
        description: child.description ?? "",
        kind: "Page",
      });
    }
  }

  for (const event of events) {
    entries.push({
      href: `/vie-de-leglise/evenements/${event.slug}`,
      title: event.title,
      description: event.excerpt ?? event.description ?? "",
      kind: "Événement",
    });
  }

  for (const department of departments) {
    entries.push({
      href: `/organisation/departements/${department.slug}`,
      title: department.name,
      description: department.tagline ?? department.description ?? "",
      kind: "Département",
    });
  }

  for (const publication of publications) {
    const kind =
      publication.category === "ENSEIGNEMENT"
        ? "Enseignement"
        : publication.category === "RESSOURCE"
          ? "Ressource"
          : publication.category === "MEDIA"
            ? "Média"
            : "Actualité";

    entries.push({
      href: `/publications/${publication.slug}`,
      title: publication.title,
      description: publication.description ?? "",
      kind,
    });
  }

  return entries;
}

export default function RecherchePage() {
  const entries = buildIndex();

  return (
    <InformationPage
      rhythm="dense"
      header={
        <HeroPractical
          overline="Recherche"
          title="Trouver un contenu"
          intro="Une page, un événement, un département, un enseignement : retrouvez rapidement ce que vous cherchez sur le site."
          facts={[
            {
              label: "Contenus indexés",
              value: `${entries.length} entrées`,
            },
            {
              label: "Types de contenu",
              value: "Pages, événements, départements, publications",
            },
            {
              label: "Recherche",
              value: "Immédiate, sans rechargement",
            },
          ]}
        />
      }
      context={
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-6">
            <h2 className="text-[clamp(1.6rem,1rem+1.6vw,2.35rem)] leading-[1.16]">
              Une seule adresse pour tout le site
            </h2>
            <Prose className="mt-6" width="narrow">
              <p>
                La recherche couvre l&apos;ensemble des contenus publiés : les
                pages de présentation, les rendez-vous de l&apos;église, les
                départements, ainsi que les actualités, enseignements, médias et
                ressources.
              </p>
            </Prose>
          </div>
          <div className="lg:col-span-5 lg:col-start-8">
            <p className="font-sans text-xs font-semibold tracking-[0.18em] text-ccjv-green uppercase">
              Si vous ne trouvez pas
            </p>
            <Prose className="mt-5" width="narrow">
              <p>
                Certains contenus ne sont pas encore publiés — la médiathèque et
                les ressources s&apos;enrichiront au fil des publications. Si
                vous cherchez une information précise, écrivez-nous directement
                : nous vous répondrons.
              </p>
            </Prose>
          </div>
        </div>
      }
      factsTitle="Rechercher sur le site"
      facts={<SearchClient entries={entries} />}
      related={
        <CrossLinks
          variant="list"
          items={[
            {
              href: "/vie-de-leglise/ou-nous-trouver",
              label: "Où nous trouver",
              description: "Adresse, horaires et contact.",
            },
            {
              href: "/publications/actualites",
              label: "Actualités",
              description: "Les nouvelles et annonces de l'église.",
            },
            {
              href: "/qui-sommes-nous",
              label: "Qui sommes-nous",
              description: "Notre histoire, notre foi et notre vision.",
            },
          ]}
        />
      }
    />
  );
}
