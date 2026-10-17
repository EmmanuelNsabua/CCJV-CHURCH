import { HeroPractical } from "@/components/composition/HeroPractical";
import { ListingPage } from "@/components/archetypes/ListingPage";
import { FeatureImage } from "@/components/editorial/FeatureImage";
import { StepsList, type Step } from "@/components/editorial/StepsList";
import { CrossLinks, type CrossLink } from "@/components/editorial/CrossLinks";
import { EmptyState } from "@/components/ui/EmptyState";
import { ContentUnavailable } from "@/components/ui/ContentUnavailable";
import { getResources, readOrUnavailable } from "@/lib/api/endpoints";
import { images } from "@/data/images";
import { formatLongDate } from "@/lib/utils";
import { pageMetadata } from "@/lib/seo";
import { FileText, Download } from "lucide-react";

export const metadata = pageMetadata({
  title: "Ressources & Guides",
  description:
    "Guides d'étude, livrets et plans de lecture au format PDF proposés par le Centre Chrétien Jésus ma Vie en téléchargement libre.",
  path: "/publications/ressources",
});

/** Comment se servir d'une ressource — mode d'emploi. */
const steps: Step[] = [
  {
    title: "Téléchargement libre",
    text: "Toutes les ressources sont disponibles au format PDF. Téléchargez-les directement pour une lecture hors-ligne sur votre téléphone, tablette ou ordinateur.",
  },
  {
    title: "Avancer à son rythme",
    text: "Ces livrets et guides ne fixent aucune cadence. Une séance, un passage, une question : avancez selon votre disponibilité spirituelle.",
  },
  {
    title: "Partager avec d'autres",
    text: "Ces supports peuvent être librement partagés au sein de votre cellule de prière, votre famille ou votre groupe d'étude biblique.",
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

export default async function RessourcesPage() {
  /*
   * `getResources` ne lève jamais mais renvoie une collection vide aussi bien
   * quand il n'y a aucun document que quand l'API n'a pas répondu : le résultat
   * est donc lu par `readOrUnavailable`, qui sépare les deux situations.
   */
  const read = await readOrUnavailable((options) =>
    getResources({ limit: 50 }, options),
  );

  const items = read.status === "ok" ? read.data.data : [];
  const lead = items[0];
  const others = items.slice(1);

  return (
    <ListingPage
      rhythm="dense"
      header={
        <HeroPractical
          overline="Publications & Médias"
          title="Ressources"
          intro="Des outils d'édification au format PDF : livrets de jeûne, plans de lecture et guides spirituels en téléchargement direct et sans inscription."
          facts={[
            {
              label: "Ressources disponibles",
              value: read.status === "unreachable" ? "Indisponible" : `${items.length}`,
              hint: "Documents PDF en accès libre.",
            },
            {
              label: "Format",
              value: "Documents PDF",
              hint: "Téléchargement immédiat et sans authentification.",
            },
            {
              label: "Public",
              value: "Seul ou en groupe",
              hint: "Utilisable pour l'étude personnelle ou les partages fraternels.",
            },
            {
              label: "Dernière parution",
              value: lead && lead.createdAt ? formatLongDate(lead.createdAt.slice(0, 10)) : "Régulier",
              hint: "Ressources mises à jour régulièrement.",
            },
          ]}
        />
      }
      lead={
        read.status === "unreachable" ? (
          <ContentUnavailable resource="Les ressources documentaires" />
        ) : lead ? (
          <article className="border border-ccjv-line bg-white p-8 sm:p-10">
            <div className="flex items-center gap-2 text-ccjv-green">
              <FileText className="h-5 w-5" />
              <p className="font-sans text-xs font-semibold tracking-[0.2em] uppercase">
                Document PDF à la une
              </p>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-16">
              <div className="lg:col-span-8">
                <h2 className="font-serif text-[clamp(1.8rem,1rem+2.4vw,3rem)] leading-[1.08] text-ccjv-ink">
                  {lead.name}
                </h2>

                {lead.description && (
                  <p className="mt-6 max-w-[62ch] text-[1.0625rem] leading-[1.7] text-ccjv-ink-secondary">
                    {lead.description}
                  </p>
                )}

                <div className="mt-8 flex items-center gap-4">
                  <a
                    href={lead.file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2.5 bg-ccjv-green px-6 py-3 font-sans text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  >
                    <Download className="h-4 w-4" />
                    Télécharger le document PDF
                  </a>
                </div>
              </div>

              <dl className="lg:col-span-4 lg:col-start-9 border-t border-ccjv-line lg:border-t-0 lg:border-l lg:pl-8">
                <div className="py-4 first:pt-0">
                  <dt className="font-sans text-[0.68rem] font-semibold tracking-[0.18em] text-ccjv-ink-secondary uppercase">
                    Disponibilité
                  </dt>
                  <dd className="mt-1 font-serif text-[1.1rem]">Accès libre</dd>
                </div>
                <div className="border-t border-ccjv-line py-4">
                  <dt className="font-sans text-[0.68rem] font-semibold tracking-[0.18em] text-ccjv-ink-secondary uppercase">
                    Format de fichier
                  </dt>
                  <dd className="mt-1 font-serif text-[1.1rem]">PDF téléchargeable</dd>
                </div>
                <div className="border-t border-ccjv-line py-4">
                  <dt className="font-sans text-[0.68rem] font-semibold tracking-[0.18em] text-ccjv-ink-secondary uppercase">
                    Ajouté le
                  </dt>
                  <dd className="mt-1 font-serif text-[1.1rem]">
                    {lead.createdAt ? formatLongDate(lead.createdAt.slice(0, 10)) : "Récemment"}
                  </dd>
                </div>
              </dl>
            </div>
          </article>
        ) : (
          <EmptyState
            title="Aucun document pour le moment"
            description="Les ressources et livrets PDF mis en ligne apparaîtront ici."
          />
        )
      }
      listTitle="Autres ressources documentaires"
      list={
        read.status === "unreachable" ? (
          <ContentUnavailable resource="La liste des ressources" />
        ) : others.length > 0 ? (
          <ul className="border-t border-ccjv-line">
            {others.map((item) => (
              <li key={item.id} className="border-b border-ccjv-line">
                <div className="group grid grid-cols-1 gap-3 py-7 sm:grid-cols-12 sm:items-baseline sm:gap-6">
                  <time
                    dateTime={item.createdAt}
                    className="font-sans text-[0.78rem] text-ccjv-ink-secondary sm:col-span-3"
                  >
                    {item.createdAt ? formatLongDate(item.createdAt.slice(0, 10)) : "—"}
                  </time>
                  <div className="sm:col-span-6">
                    <h3 className="font-serif text-[1.3rem] leading-snug text-ccjv-ink">
                      {item.name}
                    </h3>
                    {item.description && (
                      <p className="mt-2 max-w-[62ch] font-sans text-[0.92rem] leading-relaxed text-ccjv-ink-secondary">
                        {item.description}
                      </p>
                    )}
                  </div>
                  <div className="sm:col-span-3 sm:text-right">
                    <a
                      href={item.file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-sans text-[0.85rem] font-medium text-ccjv-green hover:underline"
                    >
                      <Download className="h-4 w-4" />
                      Télécharger (PDF)
                    </a>
                  </div>
                </div>
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
