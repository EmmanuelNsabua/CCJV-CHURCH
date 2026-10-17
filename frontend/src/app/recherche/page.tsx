import { HeroPractical } from "@/components/composition/HeroPractical";
import { InformationPage } from "@/components/archetypes/InformationPage";
import { Prose } from "@/components/editorial/Prose";
import { CrossLinks } from "@/components/editorial/CrossLinks";
import { ContentUnavailable } from "@/components/ui/ContentUnavailable";
import {
  SearchClient,
  type SearchEntry,
} from "@/features/search/SearchClient";
import { primaryNav } from "@/lib/nav";
import {
  getDepartments,
  getEvents,
  getPublications,
  readOrUnavailable,
} from "@/lib/api/endpoints";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Recherche",
  description:
    "Rechercher un contenu sur le site du Centre Chrétien Jésus ma Vie : pages, événements, départements, enseignements et ressources.",
  path: "/recherche",
});

/** Entrées de navigation : elles ne dépendent d'aucune lecture d'API. */
function navigationEntries(): SearchEntry[] {
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

  return entries;
}

export default async function RecherchePage() {
  /*
   * Index construit au rendu serveur à partir des données réelles de l'API
   * (publications, événements, départements). Chaque lecture est évaluée
   * séparément : une source injoignable n'efface pas les autres, mais elle est
   * **signalée** — un index amputé présenté comme complet ferait croire à
   * l'absence de contenus qui existent.
   */
  const [publicationsRead, eventsRead, departmentsRead] = await Promise.all([
    readOrUnavailable((options) => getPublications({ limit: 100 }, options)),
    readOrUnavailable((options) => getEvents({ limit: 100 }, options)),
    readOrUnavailable((options) => getDepartments(options)),
  ]);

  const entries = navigationEntries();
  const unavailableSources: string[] = [];

  if (publicationsRead.status === "ok") {
    for (const publication of publicationsRead.data) {
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
  } else {
    unavailableSources.push("les publications");
  }

  if (eventsRead.status === "ok") {
    for (const event of eventsRead.data) {
      entries.push({
        href: `/vie-de-leglise/evenements/${event.slug}`,
        title: event.title,
        description: event.excerpt ?? event.description ?? "",
        kind: "Événement",
      });
    }
  } else {
    unavailableSources.push("les événements");
  }

  if (departmentsRead.status === "ok") {
    for (const department of departmentsRead.data) {
      entries.push({
        href: `/organisation#${department.slug}`,
        title: department.name,
        description: department.tagline ?? department.description ?? "",
        kind: "Département",
      });
    }
  } else {
    unavailableSources.push("les départements");
  }

  const indexIsPartial = unavailableSources.length > 0;

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
              value: indexIsPartial
                ? `${entries.length} entrées (index partiel)`
                : `${entries.length} entrées`,
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
      facts={
        <>
          {indexIsPartial && (
            <ContentUnavailable
              className="mb-10"
              resource={`Une partie de l'index (${unavailableSources.join(", ")})`}
              description="Ces contenus ne sont pas indexés pour l'instant : la recherche porte sur le reste du site. Rechargez la page dans quelques instants pour reconstituer l'index complet."
            />
          )}
          <SearchClient entries={entries} />
        </>
      }
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
