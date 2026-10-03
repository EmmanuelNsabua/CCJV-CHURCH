import Link from "next/link";
import Image from "next/image";
import { HeroCompact } from "@/components/composition/HeroCompact";
import { DirectoryPage } from "@/components/archetypes/DirectoryPage";
import { Prose } from "@/components/editorial/Prose";
import { FeatureImage } from "@/components/editorial/FeatureImage";
import { StepsList, type Step } from "@/components/editorial/StepsList";
import { CrossLinks, type CrossLink } from "@/components/editorial/CrossLinks";
import { EmptyState } from "@/components/ui/EmptyState";
import { departments } from "@/data/mock/departments";
import { images } from "@/data/mock/images";
import { pageMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const metadata = pageMetadata({
  title: "Départements",
  description:
    "Les départements du Centre Chrétien Jésus ma Vie : Adultes, Enfants / Ecodim, chorale et services de la communauté à Lubumbashi.",
  path: "/organisation/departements",
});

/**
 * Rejoindre un département — un parcours d'invitation.
 * Aucune procédure institutionnelle n'est inventée : les étapes restent
 * descriptives et renvoient aux fiches et au contact de l'église.
 */
const joiningSteps: Step[] = [
  {
    title: "Lire la fiche du département",
    text: "Chaque département a la sienne : ce qu'il porte, son rythme de rencontre, les activités qui le structurent et la manière de le rejoindre.",
  },
  {
    title: "Écrire à l'église",
    text: "Indiquez le département qui vous intéresse : votre message sera transmis à la personne qui le coordonne.",
  },
  {
    title: "Venir une première fois",
    text: "Le plus simple est de venir voir sur place, puis d'en parler avec le responsable du département.",
  },
];

const related: CrossLink[] = [
  {
    href: "/organisation/responsables",
    label: "Les responsables",
    description: "Les personnes qui portent chaque domaine de service.",
  },
  {
    href: "/vie-de-leglise/evenements",
    label: "L'agenda de l'église",
    description: "Les rendez-vous de la communauté et les temps forts à venir.",
  },
];

export default function DepartementsPage() {
  const count = departments.length;

  return (
    <DirectoryPage
      rhythm="dense"
      hero={
        <HeroCompact
          overline="Organisation"
          title="Les départements"
          intro="Les départements sont la manière concrète dont l'église prend soin de chacun : selon l'âge, le don et le service. Cette page les présente comme une cartographie de la vie de l'Église — pas comme une liste de cases à remplir."
          aside={
            <p className="font-sans text-[0.8rem] text-ccjv-ink-secondary">
              {count > 0
                ? `${count} départements ouverts aujourd'hui`
                : "Départements en cours de publication"}
            </p>
          }
        />
      }
      intro={
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <p className="font-sans text-xs font-semibold tracking-[0.18em] text-ccjv-green uppercase">
              De quoi parle-t-on ?
            </p>
            <h2 className="mt-4 text-[clamp(1.75rem,1rem+1.9vw,2.6rem)] leading-[1.14]">
              Ce qu&apos;est un département
            </h2>
            <Prose dropcap large className="mt-7">
              <p>
                Un département n&apos;est pas un service administratif : c&apos;est
                un ensemble de membres de l&apos;assemblée qui se donnent une même
                charge, sous la conduite d&apos;un responsable.
              </p>
              <p>
                Sa raison d&apos;être est toujours la même — que quelqu&apos;un
                soit rejoint. Un enfant qui découvre la Bible, un adulte qui
                cherche à grandir, une assemblée qui apprend à louer : derrière
                chaque département, il y a des personnes à rejoindre.
              </p>
              <p>
                C&apos;est pourquoi cette page ne range pas les départements en
                cases identiques. Elle les présente comme une cartographie :
                chacun occupe une place différente dans la même vie d&apos;Église.
              </p>
            </Prose>
          </div>

          <div className="lg:col-span-4 lg:col-start-9">
            <FeatureImage src={images.predication} variant="portrait" />
          </div>
        </div>
      }
      directoryTitle="Cartographie de la vie de l'Église"
      directory={
        count === 0 ? (
          <EmptyState
            title="Aucun département pour le moment"
            description="Les départements sont ajoutés depuis le back-office et apparaîtront ici automatiquement."
          />
        ) : (
          <ol className="border-t border-ccjv-line">
            {departments.map((department, index) => {
              const isLead = index === 0;
              const detail = department.gallery?.[0];
              const mediaSide = index % 2 === 1;

              return (
                <li key={department.id} className="border-b border-ccjv-line">
                  <Link
                    href={`/organisation/departements/${department.slug}`}
                    className="group grid grid-cols-1 gap-8 py-12 lg:grid-cols-12 lg:items-center lg:gap-12"
                  >
                    <div
                      className={cn(
                        isLead
                          ? "lg:col-span-7"
                          : mediaSide
                            ? "lg:col-span-5 lg:col-start-8 lg:row-start-1"
                            : "lg:col-span-6",
                      )}
                    >
                      <span
                        className={cn(
                          "relative block overflow-hidden bg-ccjv-line",
                          isLead
                            ? "aspect-4/3"
                            : mediaSide
                              ? "aspect-3/4"
                              : "aspect-16/10",
                        )}
                      >
                        <Image
                          src={department.bannerImage ?? images.communaute}
                          alt=""
                          fill
                          sizes="(max-width: 1024px) 100vw, 50vw"
                          className="object-cover transition-transform duration-[550ms] ease-ccjv group-hover:scale-[1.03]"
                        />
                      </span>

                      {isLead && detail && (
                        <span className="relative z-10 -mt-[14%] ml-[6%] block aspect-square w-[38%] overflow-hidden border-4 border-ccjv-cream bg-ccjv-line">
                          <Image
                            src={detail}
                            alt=""
                            fill
                            sizes="(max-width: 1024px) 38vw, 16vw"
                            className="object-cover"
                          />
                        </span>
                      )}
                    </div>

                    <div
                      className={cn(
                        "flex flex-col",
                        isLead
                          ? "lg:col-span-4 lg:col-start-9"
                          : mediaSide
                            ? "lg:col-span-6 lg:row-start-1"
                            : "lg:col-span-5 lg:col-start-8",
                      )}
                    >
                      <p
                        className="font-serif text-[1.6rem] leading-none text-ccjv-green"
                        aria-hidden="true"
                      >
                        {String(index + 1).padStart(2, "0")}
                      </p>
                      <h3 className="mt-4 font-serif text-[clamp(1.5rem,1rem+1.5vw,2.1rem)] leading-tight transition-colors duration-[250ms] group-hover:text-ccjv-green">
                        {department.name}
                      </h3>
                      {department.tagline && (
                        <p className="mt-3 font-serif text-[1.05rem] leading-snug text-ccjv-ink-secondary italic">
                          {department.tagline}
                        </p>
                      )}
                      {department.description && (
                        <p className="mt-4 max-w-[48ch] text-[0.95rem] leading-[1.7] text-ccjv-ink-secondary">
                          {department.description}
                        </p>
                      )}

                      {isLead &&
                        department.keyPoints &&
                        department.keyPoints.length > 0 && (
                          <ul className="mt-6 flex flex-col gap-2">
                            {department.keyPoints.map((point) => (
                              <li
                                key={point}
                                className="flex gap-3 text-[0.9rem] leading-relaxed text-ccjv-ink-secondary"
                              >
                                <span
                                  className="mt-2 h-px w-4 shrink-0 bg-ccjv-green"
                                  aria-hidden="true"
                                />
                                {point}
                              </li>
                            ))}
                          </ul>
                        )}

                      <dl className="mt-6 border-t border-ccjv-line pt-5 text-[0.85rem]">
                        {department.meetingSchedule && (
                          <div className="flex flex-col gap-1">
                            <dt className="font-sans text-[0.68rem] font-semibold tracking-[0.16em] text-ccjv-ink-secondary uppercase">
                              Rythme
                            </dt>
                            <dd className="font-sans text-ccjv-ink-secondary">
                              {department.meetingSchedule}
                            </dd>
                          </div>
                        )}
                        {department.responsibleName && (
                          <div className="mt-4 flex flex-col gap-1">
                            <dt className="font-sans text-[0.68rem] font-semibold tracking-[0.16em] text-ccjv-ink-secondary uppercase">
                              Responsable
                            </dt>
                            <dd className="font-sans text-ccjv-ink-secondary">
                              {department.responsibleName}
                            </dd>
                          </div>
                        )}
                      </dl>

                      <span className="mt-6 font-sans text-[0.9rem] font-medium text-ccjv-green">
                        Voir ce département →
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ol>
        )
      }
      responsibilitiesTitle="Rejoindre un département"
      responsibilities={
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <Prose width="narrow">
              <p>
                On n&apos;entre pas dans un département par une porte
                administrative. On commence par s&apos;intéresser à ce qui s&apos;y
                vit, puis on le dit simplement.
              </p>
            </Prose>
          </div>
          <div className="lg:col-span-7 lg:col-start-6">
            <StepsList steps={joiningSteps} variant="vertical" />
          </div>
        </div>
      }
      related={
        <>
          <p className="font-sans text-xs font-semibold tracking-[0.18em] text-ccjv-green uppercase">
            Continuer
          </p>
          <h2 className="mt-4 mb-10 text-[clamp(1.6rem,1rem+1.6vw,2.35rem)] leading-[1.16]">
            Comprendre l&apos;ensemble, ou rencontrer les personnes
          </h2>
          <CrossLinks items={related} variant="list" />
        </>
      }
    />
  );
}
