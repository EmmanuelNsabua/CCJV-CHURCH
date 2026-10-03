import Link from "next/link";
import { HeroPhoto } from "@/components/composition/HeroPhoto";
import { DirectoryPage } from "@/components/archetypes/DirectoryPage";
import { Prose } from "@/components/editorial/Prose";
import { PortraitPanel } from "@/components/editorial/PortraitPanel";
import { PeopleGrid } from "@/components/editorial/PeopleGrid";
import { PhotoDuo } from "@/components/editorial/PhotoDuo";
import { ScriptureBlock } from "@/components/editorial/ScriptureBlock";
import { StepsList, type Step } from "@/components/editorial/StepsList";
import { CrossLinks, type CrossLink } from "@/components/editorial/CrossLinks";
import { ContentPending } from "@/components/editorial/ContentPending";
import { Button } from "@/components/ui/Button";
import { departments } from "@/data/mock/departments";
import { leaders, leadPastor } from "@/data/mock/leaders";
import { images } from "@/data/mock/images";
import { site } from "@/data/mock/site";
import { verses } from "@/data/mock/verses";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Responsables",
  description:
    "Le Pasteur Manasse Mwamba et les responsables des départements du Centre Chrétien Jésus ma Vie à Lubumbashi.",
  path: "/organisation/responsables",
});

/**
 * Annuaire — le pasteur est présenté à part, en grand : il n'est pas répété ici.
 * Les autres entrées sont des contenus de démonstration à noms génériques
 * (voir src/data/mock/leaders.ts) : aucune identité n'est inventée.
 */
const team = leaders.filter((leader) => leader.id !== leadPastor.id);

/** Domaine de service → fiche du département, résolu depuis les données. */
const departmentFor = (scope?: string) =>
  scope ? departments.find((department) => department.name === scope) : undefined;

/** Servir à son tour : une invitation, sans procédure institutionnelle inventée. */
const servingSteps: Step[] = [
  {
    title: "Repérer un domaine",
    text: "La répartition des responsabilités ci-dessus montre quels services existent aujourd'hui dans l'église.",
  },
  {
    title: "Écrire à l'église",
    text: "Un message suffit, en indiquant le domaine qui vous intéresse. Il sera transmis au responsable concerné.",
  },
  {
    title: "Parler avec le responsable",
    text: "C'est avec lui ou elle que se précisent le rythme du service et la manière de commencer.",
  },
];

const related: CrossLink[] = [
  {
    href: "/organisation/departements",
    label: "Les départements",
    description: "Ce que chaque département porte, et comment le rejoindre.",
  },
  {
    href: "/vie-de-leglise/ou-nous-trouver",
    label: "Où nous trouver",
    description: "Adresse, rendez-vous et contact de l'église à Lubumbashi.",
  },
];

export default function ResponsablesPage() {
  return (
    <DirectoryPage
      rhythm="standard"
      hero={
        <HeroPhoto
          overline="Organisation"
          title="Les personnes avant les fonctions"
          intro="Derrière chaque département, il y a des membres qui donnent de leur temps. Cette page présente celles et ceux qui portent la communauté — et indique comment les rejoindre."
          image={images.assemblee}
          caption="Centre Chrétien Jésus ma Vie — Lubumbashi"
          height="tall"
        />
      }
      intro={
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <p className="font-sans text-xs font-semibold tracking-[0.18em] text-ccjv-green uppercase">
              Une équipe, pas un organigramme
            </p>
            <h2 className="mt-4 text-[clamp(1.75rem,1rem+1.9vw,2.6rem)] leading-[1.14]">
              Des visages, avant des titres
            </h2>
            <Prose dropcap large className="mt-7">
              <p>
                On peut décrire une église par ses services, ses horaires et ses
                départements. On la comprend mieux en regardant les personnes qui
                les portent : des membres de l&apos;assemblée, avec un métier, une
                famille, un emploi du temps — et un service qu&apos;ils ont
                accepté.
              </p>
              <p>
                Cette page ne cherche donc pas à dresser un trombinoscope. Elle
                présente d&apos;abord celui qui a fondé l&apos;église, puis les
                personnes qui coordonnent chaque domaine, et ce que chacun
                surveille concrètement.
              </p>
              <p>
                Si vous cherchez quelqu&apos;un pour poser une question, parler
                d&apos;un projet ou proposer votre aide, c&apos;est ici que vous
                trouverez vers qui vous tourner.
              </p>
            </Prose>
          </div>

          <div className="lg:col-span-4 lg:col-start-9">
            <ScriptureBlock
              variant="marginal"
              context="Pourquoi servir"
              text={verses.ouvrage.text}
              reference={verses.ouvrage.reference}
            />
          </div>
        </div>
      }
      lead={
        <>
          <p className="font-sans text-xs font-semibold tracking-[0.18em] text-ccjv-green uppercase">
            Le pasteur visionnaire
          </p>
          <h2 className="mt-4 mb-12 text-[clamp(1.75rem,1rem+1.9vw,2.6rem)] leading-[1.14]">
            Celui qui a fondé l&apos;église
          </h2>
          <PortraitPanel
            image={leadPastor.photo ?? images.portraitLarge}
            name={leadPastor.name}
            role={leadPastor.role}
            scope={leadPastor.scope}
            bio={leadPastor.bio}
            side="right"
          />
        </>
      }
      directoryTitle="Les responsables de département"
      directory={
        <>
          <ContentPending
            what="Identités et notices des responsables"
            hint="Les entrées ci-dessous sont des contenus de démonstration à noms génériques. Les noms, fonctions et notices définitifs doivent être fournis par l'église, avec l'accord des personnes concernées."
          />
          <div className="mt-14">
            <PeopleGrid people={team} variant="feature" />
          </div>
        </>
      }
      responsibilitiesTitle="Qui veille sur quoi"
      responsibilities={
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <p className="mb-8 max-w-[56ch] text-[1.02rem] leading-[1.7] text-ccjv-ink-secondary">
              Chaque domaine de la vie de l&apos;église a quelqu&apos;un qui le
              porte. Voici la répartition telle qu&apos;elle est communiquée
              aujourd&apos;hui, domaine par domaine.
            </p>

            <ul className="border-t border-ccjv-line">
              {leaders.map((leader) => {
                const department = departmentFor(leader.scope);
                return (
                  <li
                    key={leader.id}
                    className="border-b border-ccjv-line py-7"
                  >
                    <p className="font-sans text-[0.7rem] font-semibold tracking-[0.18em] text-ccjv-green uppercase">
                      {leader.scope ?? "Église"}
                    </p>
                    <p className="mt-3 font-serif text-[1.2rem] leading-snug">
                      {leader.role}
                    </p>
                    <p className="mt-2 font-sans text-[0.88rem] text-ccjv-ink-secondary">
                      {leader.name}
                    </p>
                    {department && (
                      <Link
                        href={`/organisation/departements/${department.slug}`}
                        className="mt-4 inline-block font-sans text-[0.88rem] font-medium text-ccjv-green underline decoration-1 underline-offset-4"
                      >
                        Voir la fiche de ce département →
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="lg:col-span-4 lg:col-start-9 lg:pt-16">
            <PhotoDuo
              variant="offset"
              left={{ src: images.service }}
              right={{ src: images.fraternite }}
            />
            <p className="mt-6 border-t border-ccjv-line pt-4 font-sans text-[0.82rem] leading-relaxed text-ccjv-ink-secondary">
              Les domaines listés ici correspondent aux services actuellement
              portés par l&apos;église. Cette répartition évolue avec la
              communauté.
            </p>
          </div>
        </div>
      }
      related={
        <>
          <p className="font-sans text-xs font-semibold tracking-[0.18em] text-ccjv-green uppercase">
            Et vous ?
          </p>
          <h2 className="mt-4 text-[clamp(1.6rem,1rem+1.6vw,2.35rem)] leading-[1.16]">
            Servir à votre tour
          </h2>
          <div className="mt-10">
            <StepsList steps={servingSteps} variant="horizontal" />
          </div>
          <div className="mt-12 flex flex-wrap gap-4">
            <Button variant="primary" href={site.whatsappHref} external>
              Proposer mon service
            </Button>
            <Button variant="outline" href="/organisation/departements">
              Voir les départements
            </Button>
          </div>
          <div className="mt-16">
            <CrossLinks items={related} variant="list" />
          </div>
        </>
      }
    />
  );
}
