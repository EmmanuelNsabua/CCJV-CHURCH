import Link from "next/link";
import { notFound } from "next/navigation";
import { HeroPhoto } from "@/components/composition/HeroPhoto";
import { DetailPage } from "@/components/archetypes/DetailPage";
import { Prose } from "@/components/editorial/Prose";
import { KeyFacts, type KeyFact } from "@/components/editorial/KeyFacts";
import { PhotoGallery } from "@/components/editorial/PhotoGallery";
import { StepsList, type Step } from "@/components/editorial/StepsList";
import { CrossLinks, type CrossLink } from "@/components/editorial/CrossLinks";
import { ContentPending } from "@/components/editorial/ContentPending";
import { Button } from "@/components/ui/Button";
import {
  departments,
  getDepartmentBySlug,
} from "@/data/mock/departments";
import { images } from "@/data/mock/images";
import { choraleSchedule, site } from "@/data/mock/site";
import { pageMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

/** Pré-génère une fiche par département (aucune requête au runtime). */
export function generateStaticParams() {
  return departments.map((department) => ({ slug: department.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const department = getDepartmentBySlug(slug);
  if (!department) return {};

  return pageMetadata({
    title: department.name,
    description:
      department.tagline ??
      department.description ??
      `Département du ${site.name} à Lubumbashi.`,
    path: `/organisation/departements/${department.slug}`,
  });
}

/**
 * Rejoindre un département. Parcours d'invitation, sans condition
 * institutionnelle inventée.
 */
const joiningSteps: Step[] = [
  {
    title: "Écrire à l'église",
    text: "Un message suffit : précisez ce département et ce que vous souhaitez savoir.",
  },
  {
    title: "Parler avec le responsable",
    text: "Le responsable du département est la personne à qui poser vos questions et avec qui préciser la suite.",
  },
  {
    title: "Venir et voir",
    text: "Ce qui se vit dans un département se comprend mieux en y participant une première fois.",
  },
];

export default async function DepartmentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const department = getDepartmentBySlug(slug);
  if (!department) notFound();

  const others = departments.filter((item) => item.id !== department.id);

  /** Horaires confirmés par CCJV (voir src/data/mock/site.ts). */
  const scheduleConfirmed =
    Boolean(department.meetingSchedule) &&
    department.meetingSchedule === choraleSchedule;

  const keyFacts: KeyFact[] = [
    {
      label: "Rythme de rencontre",
      value: department.meetingSchedule ?? "Rythme non communiqué",
      hint: scheduleConfirmed
        ? "Horaires communiqués par l'église."
        : "Horaire affiché à titre indicatif, en attente de validation.",
    },
    {
      label: "Responsable",
      value: department.responsibleName ?? "Responsable non communiqué",
      hint:
        department.responsibleName &&
        /confirmer/i.test(department.responsibleName)
          ? "Identité non encore communiquée par l'église."
          : undefined,
    },
    {
      label: "Adresse de l'église",
      value: site.address,
    },
  ];

  const otherDepartments: CrossLink[] = others.map((item) => ({
    href: `/organisation/departements/${item.slug}`,
    label: item.name,
    description: item.tagline,
    image: item.bannerImage,
  }));

  const points = department.keyPoints ?? [];

  return (
    <DetailPage
      rhythm="standard"
      media={
        <HeroPhoto
          overline="Département"
          title={department.name}
          image={department.bannerImage ?? images.communaute}
          caption="Centre Chrétien Jésus ma Vie — Lubumbashi"
          height="normal"
        />
      }
      summary={
        <div className="grid grid-cols-1 items-end gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <p className="font-sans text-xs font-semibold tracking-[0.18em] text-ccjv-green uppercase">
              Département — {department.name}
            </p>
            {department.tagline && (
              <p className="mt-6 max-w-[32ch] font-serif text-[clamp(1.5rem,1rem+1.7vw,2.45rem)] leading-[1.16] italic">
                {department.tagline}
              </p>
            )}
          </div>

          <p className="max-w-[52ch] text-[1.02rem] leading-[1.7] text-ccjv-ink-secondary lg:col-span-4 lg:col-start-9">
            Cette fiche présente la vocation de ce département, son rythme de
            rencontre, ce qui le structure et la manière de le rejoindre.
          </p>
        </div>
      }
      body={
        <>
          {/* Sa vocation */}
          <div>
            <h2 className="text-[clamp(1.6rem,1rem+1.6vw,2.35rem)] leading-[1.16]">
              Sa vocation
            </h2>
            {department.description ? (
              <Prose large className="mt-7">
                <p>{department.description}</p>
              </Prose>
            ) : (
              <ContentPending
                className="mt-7"
                what="Vocation du département"
                hint="La description de ce département doit être fournie par l'église."
              />
            )}
          </div>

          {/* Ce qui le structure */}
          {points.length > 0 ? (
            <div className="mt-[clamp(2.75rem,5vw,4rem)]">
              <p className="font-sans text-xs font-semibold tracking-[0.18em] text-ccjv-green uppercase">
                Activités et piliers
              </p>
              <h2 className="mt-4 text-[clamp(1.45rem,1rem+1.3vw,2rem)] leading-[1.18]">
                Ce qui structure ce département
              </h2>
              <ol className="mt-8 border-t border-ccjv-line">
                {points.map((point, index) => (
                  <li
                    key={point}
                    className={cn(
                      "grid grid-cols-1 gap-2 border-b border-ccjv-line py-6 sm:grid-cols-12 sm:gap-5",
                      index % 2 === 1 && "sm:pl-10",
                    )}
                  >
                    <p
                      className="font-serif text-[1.3rem] leading-none text-ccjv-green sm:col-span-2"
                      aria-hidden="true"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </p>
                    <p className="text-[0.98rem] leading-[1.7] text-ccjv-ink-secondary sm:col-span-10">
                      {point}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            <ContentPending
              className="mt-[clamp(2.75rem,5vw,4rem)]"
              what="Activités et piliers du département"
              hint="Les activités qui structurent ce département doivent être fournies par l'église."
            />
          )}

          {/* Public concerné */}
          <div className="mt-[clamp(2.75rem,5vw,4rem)]">
            <h2 className="text-[clamp(1.45rem,1rem+1.3vw,2rem)] leading-[1.18]">
              Public concerné
            </h2>
            <p className="mt-5 max-w-[52ch] text-[0.98rem] leading-[1.7] text-ccjv-ink-secondary">
              Qui ce département rejoint aujourd&apos;hui — âges, situations et
              éventuelles conditions de participation — relève d&apos;une
              information que l&apos;église doit préciser.
            </p>
            <ContentPending
              className="mt-6"
              what="Public concerné par ce département"
              hint="Tranches d'âge, situations concernées et conditions de participation, telles que l'église souhaite les communiquer."
            />
          </div>
        </>
      }
      aside={
        <>
          <p className="font-sans text-xs font-semibold tracking-[0.18em] text-ccjv-green uppercase">
            Repères
          </p>
          <KeyFacts className="mt-6" variant="pairs" items={keyFacts} />
          <div className="mt-8 flex flex-wrap gap-4">
            <Button variant="primary" href={site.whatsappHref} external>
              Écrire à l&apos;église
            </Button>
          </div>
          <Link
            href="/organisation/departements"
            className="mt-6 inline-block font-sans text-[0.88rem] font-medium text-ccjv-green underline decoration-1 underline-offset-4"
          >
            Voir tous les départements →
          </Link>
        </>
      }
      gallery={
        department.gallery && department.gallery.length > 0 ? (
          <>
            <p className="font-sans text-xs font-semibold tracking-[0.18em] text-ccjv-green uppercase">
              En images
            </p>
            <h2 className="mt-4 mb-10 text-[clamp(1.45rem,1rem+1.3vw,2rem)] leading-[1.18]">
              La vie de ce département
            </h2>
            <PhotoGallery images={department.gallery} variant="columns" />
          </>
        ) : undefined
      }
      related={
        <>
          <p className="font-sans text-xs font-semibold tracking-[0.18em] text-ccjv-green uppercase">
            Passer à l&apos;acte
          </p>
          <h2 className="mt-4 text-[clamp(1.45rem,1rem+1.3vw,2rem)] leading-[1.18]">
            Rejoindre ce département
          </h2>
          <div className="mt-10">
            <StepsList steps={joiningSteps} variant="horizontal" />
          </div>

          {otherDepartments.length > 0 && (
            <div className="mt-[clamp(3rem,6vw,5rem)]">
              <p className="font-sans text-xs font-semibold tracking-[0.18em] text-ccjv-green uppercase">
                Continuer
              </p>
              <h2 className="mt-4 mb-10 text-[clamp(1.45rem,1rem+1.3vw,2rem)] leading-[1.18]">
                Les autres départements
              </h2>
              <CrossLinks items={otherDepartments} variant="doors" />
            </div>
          )}
        </>
      }
    />
  );
}
