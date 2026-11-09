import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText, Download, ArrowLeft, Calendar, ShieldCheck, Share2 } from "lucide-react";
import { DetailPage } from "@/components/archetypes/DetailPage";
import { HeroCompact } from "@/components/composition/HeroCompact";
import { Prose } from "@/components/editorial/Prose";
import { KeyFacts } from "@/components/editorial/KeyFacts";
import { CrossLinks } from "@/components/editorial/CrossLinks";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ContentUnavailable } from "@/components/ui/ContentUnavailable";
import { getResource, getResources, readOrUnavailable } from "@/lib/api/endpoints";
import type { Resource } from "@/types";
import { formatLongDate } from "@/lib/utils";
import { pageMetadata } from "@/lib/seo";

type ResourceRead =
  | { status: "ok"; data: Resource }
  | { status: "missing" }
  | { status: "unreachable" };

async function readResource(slugOrId: string): Promise<ResourceRead> {
  const failures: Array<{ status: number | null }> = [];

  const resource = await getResource(slugOrId, {
    onFailure: (error) => {
      failures.push({ status: error.status });
    },
  });

  if (resource !== null) return { status: "ok", data: resource };

  return failures.some((failure) => failure.status === 404)
    ? { status: "missing" }
    : { status: "unreachable" };
}

export async function generateStaticParams() {
  const result = await readOrUnavailable((options) =>
    getResources({ limit: 50 }, options),
  );

  if (result.status === "unreachable") return [];

  return result.data.data.map((item) => ({ slug: item.id || item.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const read = await readResource(slug);

  if (read.status !== "ok") return {};

  const resource = read.data;

  return pageMetadata({
    title: resource.name,
    description:
      resource.description ??
      "Document et guide d'étude du Centre Chrétien Jésus ma Vie.",
    path: `/publications/ressources/${resource.id || resource.slug}`,
  });
}

export default async function RessourceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const read = await readResource(slug);

  if (read.status === "unreachable") {
    return (
      <div className="container py-[clamp(3rem,7vw,6rem)]">
        <ContentUnavailable resource="Cette ressource" />
      </div>
    );
  }

  if (read.status === "missing") notFound();

  const resource = read.data;

  // Lecture des autres ressources liées
  const othersRead = await readOrUnavailable((options) =>
    getResources({ limit: 6 }, options),
  );

  const related =
    othersRead.status === "ok"
      ? othersRead.data.data
        .filter((item) => item.id !== resource.id)
        .slice(0, 3)
      : [];

  const dateStr = resource.createdAt
    ? formatLongDate(resource.createdAt.slice(0, 10))
    : "Récemment";

  return (
    <DetailPage
      rhythm="standard"
      media={
        <HeroCompact
          overline="Guide d'étude & Document PDF"
          title={resource.name}
          aside={
            <div className="flex items-center gap-2 text-ccjv-ink-secondary text-sm">
              <Calendar className="h-4 w-4 text-ccjv-green" />
              <span>Publié le {dateStr}</span>
            </div>
          }
        />
      }
      summary={
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-8">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline">Document PDF</Badge>
              <Badge variant="outline">Accès libre</Badge>
            </div>

            <h2 className="mt-7 font-serif text-[clamp(1.6rem,1rem+1.8vw,2.4rem)] leading-[1.12] text-ccjv-ink">
              {resource.name}
            </h2>

            {resource.description && (
              <p className="mt-5 font-sans text-base sm:text-lg text-ccjv-ink-secondary leading-relaxed">
                {resource.description}
              </p>
            )}

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href={resource.file}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 bg-ccjv-green hover:bg-ccjv-green/90 px-6 py-3 font-sans text-sm font-semibold text-white transition-opacity shadow-xs cursor-pointer rounded-none"
              >
                <Download className="h-4 w-4" />
                <span>Télécharger le document PDF</span>
              </a>

              <Link
                href="/publications/ressources"
                className="inline-flex items-center gap-2 border border-ccjv-line hover:border-ccjv-green bg-white px-5 py-3 font-sans text-sm font-semibold text-ccjv-ink transition-colors rounded-none"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Tous les guides d&apos;étude</span>
              </Link>
            </div>
          </div>
        </div>
      }
      body={
        <div className="space-y-8">
          <Prose large width="narrow">
            <p>
              Ce document est mis gratuitement à disposition de la communauté et de toute
              personne désireuse d&apos;approfondir sa communion avec Dieu. Vous pouvez le
              télécharger, l&apos;imprimer et le partager librement dans le cadre de vos études
              bibliques personnelles, familiales ou en cellule de prière.
            </p>
          </Prose>

          {/* Fiche d'information technique du document */}
          <div className="border border-ccjv-line bg-ccjv-offwhite p-6 sm:p-8 max-w-xl">
            <h3 className="font-serif text-lg font-bold text-ccjv-ink flex items-center gap-2">
              <FileText className="h-5 w-5 text-ccjv-green" />
              <span>Consignes d&apos;utilisation</span>
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-ccjv-ink-secondary list-disc pl-5">
              <li>Support au format PDF standard, lisible sur tous les téléphones et ordinateurs.</li>
              <li>Aucune inscription ni authentification requise.</li>
              <li>Document vérifié et validé par l&apos;équipe pastorale du CCJV.</li>
            </ul>
          </div>
        </div>
      }
      aside={
        <div className="flex flex-col gap-10">
          <div>
            <p className="font-sans text-xs font-semibold tracking-[0.18em] text-ccjv-green uppercase">
              Informations
            </p>
            <KeyFacts
              variant="pairs"
              className="mt-6"
              items={[
                { label: "Format", value: "PDF téléchargeable" },
                { label: "Disponibilité", value: "Accès libre & gratuit" },
                { label: "Date d'ajout", value: dateStr },
                { label: "Usage", value: "Personnel ou groupe" },
              ]}
            />
          </div>

          {related.length > 0 && (
            <div>
              <p className="font-sans text-xs font-semibold tracking-[0.18em] text-ccjv-green uppercase">
                Autres guides d&apos;étude
              </p>
              <ul className="mt-6 border-t border-ccjv-line">
                {related.map((item) => (
                  <li key={item.id} className="border-b border-ccjv-line">
                    <Link
                      href={`/publications/ressources/${item.id || item.slug}`}
                      className="group flex items-baseline justify-between gap-4 py-4"
                    >
                      <span className="font-serif text-[1.02rem] leading-snug transition-colors duration-[250ms] group-hover:text-ccjv-green">
                        {item.name}
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
      relatedTitle="Découvrir également"
      related={
        <CrossLinks
          variant="list"
          items={[
            {
              href: "/publications/actualites",
              label: "Actualités",
              description: "Toutes les annonces et nouvelles de l'église.",
            },
            {
              href: "/publications/enseignements",
              label: "Enseignements",
              description: "Écoutez les prédications et messages dominicaux.",
            },
            {
              href: "/publications/mediatheque",
              label: "Médiathèque",
              description: "Parcourez les albums photos et vidéos du CCJV.",
            },
          ]}
        />
      }
    />
  );
}

