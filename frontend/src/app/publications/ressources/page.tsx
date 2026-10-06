import Link from "next/link";
import { HeroPractical } from "@/components/composition/HeroPractical";
import { ListingPage } from "@/components/archetypes/ListingPage";
import { FeatureImage } from "@/components/editorial/FeatureImage";
import { StepsList, type Step } from "@/components/editorial/StepsList";
import { CrossLinks, type CrossLink } from "@/components/editorial/CrossLinks";
import { EmptyState } from "@/components/ui/EmptyState";
import { getPublicationsByCategory } from "@/data/mock/publications";
import { images } from "@/data/mock/images";
import { formatLongDate } from "@/lib/utils";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Ressources",
  description:
    "Guides d'étude et plans de lecture proposés par le Centre Chrétien Jésus ma Vie pour avancer dans la foi, seul ou en groupe.",
  path: "/publications/ressources",
});

/** Comment se servir d'une ressource — mode d'emploi, sans engagement institutionnel. */
const steps: Step[] = [
  {
    title: "Choisir selon le moment",
    text: "Un guide d'étude convient à qui veut reprendre les fondements ; un plan de lecture à qui cherche un rythme régulier. Les deux se lisent directement en ligne.",
  },
  {
    title: "Avancer à son rythme",
    text: "Ces textes ne fixent aucune cadence. Une séance, un passage, une question : mieux vaut peu, tenu dans le temps, que beaucoup en une fois.",
  },
  {
    title: "En parler avec d'autres",
    text: "Une ressource lue seul prend une autre dimension lorsqu'elle est partagée. Elle peut servir de base à un échange en petit groupe.",
  },
];

const related: CrossLink[] = [
  {
    href: "/publications/enseignements",
    label: "Les enseignements",
    description: "Les messages donnés à l'assemblée, à écouter sur YouTube.",
  },
  {
    href: "/publications/mediatheque",
    label: "La médiathèque",
    description: "Les albums et les vidéos des moments vécus ensemble.",
  },
  {
    href: "/publications/actualites",
    label: "Les actualités",
    description: "Les nouvelles et annonces de la vie de l'église.",
  },
];

export default function RessourcesPage() {
  const items = getPublicationsByCategory("RESSOURCE");
  const lead = items[0];
  const others = items.slice(1);

  return (
    <ListingPage
      rhythm="dense"
      header={
        <HeroPractical
          overline="Publications & Médias"
          title="Ressources"
          intro="Des outils simples pour avancer : guides d'étude et plans de lecture, à lire seul ou en petit groupe. Rien à imprimer, rien à télécharger."
          facts={[
            {
              label: "Ressources disponibles",
              value: `${items.length}`,
              hint: "Publiées sur le site à ce jour.",
            },
            {
              label: "Format",
              value: "Textes à lire en ligne",
              hint: "Aucun document à télécharger n'est proposé pour ces ressources.",
            },
            {
              label: "Public",
              value: "Seul ou en groupe",
              hint: "Ces textes peuvent servir à une lecture personnelle comme à un échange à plusieurs.",
            },
            {
              label: "Dernière parution",
              value: lead ? formatLongDate(lead.publishedAt) : "À venir",
              hint: "Les ressources s'ajoutent au fil des publications.",
            },
          ]}
        />
      }
      lead={
        lead ? (
          <article>
            <p className="font-sans text-xs font-semibold tracking-[0.2em] text-ccjv-green uppercase">
              Ressource principale
            </p>

            <div className="mt-6 grid grid-cols-1 gap-8 border-t border-ccjv-line pt-8 lg:grid-cols-12 lg:gap-16">
              <div className="lg:col-span-7">
                <Link href={`/publications/${lead.slug}`} className="group block">
                  <h2 className="max-w-[24ch] font-serif text-[clamp(1.8rem,1rem+2.4vw,3rem)] leading-[1.08] transition-colors duration-[250ms] group-hover:text-ccjv-green">
                    {lead.title}
                  </h2>
                </Link>

                {lead.description && (
                  <p className="mt-6 max-w-[62ch] text-[1.0625rem] leading-[1.7] text-ccjv-ink-secondary">
                    {lead.description}
                  </p>
                )}

                <Link
                  href={`/publications/${lead.slug}`}
                  className="mt-7 inline-flex items-center gap-2 font-sans text-[0.9rem] font-medium text-ccjv-green"
                >
                  Consulter la ressource
                  <span aria-hidden="true">→</span>
                </Link>
              </div>

              <dl className="lg:col-span-4 lg:col-start-9">
                <div className="border-t border-ccjv-line py-4">
                  <dt className="font-sans text-[0.68rem] font-semibold tracking-[0.18em] text-ccjv-ink-secondary uppercase">
                    Publiée le
                  </dt>
                  <dd className="mt-1 font-serif text-[1.1rem]">
                    <time dateTime={lead.publishedAt}>
                      {formatLongDate(lead.publishedAt)}
                    </time>
                  </dd>
                </div>
                <div className="border-t border-ccjv-line py-4">
                  <dt className="font-sans text-[0.68rem] font-semibold tracking-[0.18em] text-ccjv-ink-secondary uppercase">
                    Rubrique
                  </dt>
                  <dd className="mt-1 font-serif text-[1.1rem]">Ressources</dd>
                </div>
                <div className="border-y border-ccjv-line py-4">
                  <dt className="font-sans text-[0.68rem] font-semibold tracking-[0.18em] text-ccjv-ink-secondary uppercase">
                    Lecture
                  </dt>
                  <dd className="mt-1 font-serif text-[1.1rem]">
                    Directement en ligne
                  </dd>
                </div>
              </dl>
            </div>
          </article>
        ) : (
          <EmptyState
            title="Aucune ressource pour le moment"
            description="Les ressources publiées depuis le back-office apparaîtront ici."
          />
        )
      }
      listTitle="Autres ressources"
      list={
        others.length > 0 ? (
          <ul className="border-t border-ccjv-line">
            {others.map((item) => (
              <li key={item.id} className="border-b border-ccjv-line">
                <Link
                  href={`/publications/${item.slug}`}
                  className="group grid grid-cols-1 gap-3 py-7 sm:grid-cols-12 sm:items-baseline sm:gap-6"
                >
                  <time
                    dateTime={item.publishedAt}
                    className="font-sans text-[0.78rem] text-ccjv-ink-secondary sm:col-span-3"
                  >
                    {formatLongDate(item.publishedAt)}
                  </time>
                  <span className="sm:col-span-7">
                    <span className="block font-serif text-[1.3rem] leading-snug transition-colors duration-[250ms] group-hover:text-ccjv-green">
                      {item.title}
                    </span>
                    {item.description && (
                      <span className="mt-2 block max-w-[62ch] font-sans text-[0.92rem] leading-relaxed text-ccjv-ink-secondary">
                        {item.description}
                      </span>
                    )}
                  </span>
                  <span
                    className="font-sans text-[0.85rem] font-medium text-ccjv-green sm:col-span-2 sm:text-right"
                    aria-hidden="true"
                  >
                    Consulter →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="border-t border-ccjv-line pt-7 text-ccjv-ink-secondary">
            Les prochaines ressources apparaîtront ici.
          </p>
        )
      }
      archivesTitle="Comment utiliser ces ressources"
      archives={
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <FeatureImage src={images.predication} variant="wide" />
            <p className="mt-6 max-w-[46ch] font-sans text-[0.9rem] leading-relaxed text-ccjv-ink-secondary">
              Vous cherchez une ressource précise, ou vous souhaitez en
              proposer une ? Écrivez-nous : les ressources publiées ici viennent
              de la vie de l&apos;église.
            </p>
          </div>

          <div className="lg:col-span-6 lg:col-start-7">
            <StepsList variant="vertical" steps={steps} />
          </div>
        </div>
      }
      related={
        <>
          <p className="font-sans text-xs font-semibold tracking-[0.18em] text-ccjv-green uppercase">
            Continuer
          </p>
          <h2 className="mt-4 mb-10 text-[clamp(1.6rem,1rem+1.6vw,2.35rem)] leading-[1.16]">
            Autour des ressources
          </h2>
          <CrossLinks items={related} variant="list" />
        </>
      }
    />
  );
}
