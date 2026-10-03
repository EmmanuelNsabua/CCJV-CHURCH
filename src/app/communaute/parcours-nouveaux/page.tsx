import { HeroCentered } from "@/components/composition/HeroCentered";
import { EditorialPage } from "@/components/archetypes/EditorialPage";
import { Prose } from "@/components/editorial/Prose";
import { FeatureImage } from "@/components/editorial/FeatureImage";
import { PhotoDuo } from "@/components/editorial/PhotoDuo";
import { StepsList, type Step } from "@/components/editorial/StepsList";
import { ScriptureBlock } from "@/components/editorial/ScriptureBlock";
import { ContentPending } from "@/components/editorial/ContentPending";
import { CrossLinks, type CrossLink } from "@/components/editorial/CrossLinks";
import { Button } from "@/components/ui/Button";
import { images } from "@/data/mock/images";
import { site } from "@/data/mock/site";
import { verses } from "@/data/mock/verses";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Parcours nouveaux",
  description:
    "Vos premiers pas au Centre Chrétien Jésus ma Vie : comment se passe une première visite, comment être accueilli et comment être accompagné, sans pression.",
  path: "/communaute/parcours-nouveaux",
});

/**
 * Déroulé d'une PREMIÈRE VISITE — même matière que la page précédente, remise
 * dans l'ordre de lecture. Aucune durée, aucune date, aucun nombre de séances.
 */
const steps: Step[] = [
  {
    title: "Vous venez un dimanche",
    text: "Aucune inscription, aucune tenue particulière, rien à apporter. Arrivez simplement — vous êtes attendu.",
  },
  {
    title: "Vous êtes accueilli",
    text: "Quelqu'un vous reçoit à l'entrée et vous aide à vous installer. Vous restez libre de vous asseoir où vous voulez.",
  },
  {
    title: "Vous vivez le culte avec nous",
    text: "Louange, enseignement de la Parole, prière. Vous pouvez simplement écouter : personne ne vous mettra en avant.",
  },
  {
    title: "Vous faites connaissance",
    text: "Après la célébration, un temps de fraternité. Venez nous saluer si vous le souhaitez, ou repartez tranquillement.",
  },
  {
    title: "Vous êtes accompagné",
    text: "Si vous le souhaitez, nous vous mettons en relation avec un groupe de maison proche de chez vous.",
  },
];

/** Les questions humaines que l'on peut poser — sans programme inventé. */
const topics = [
  {
    title: "Lire la Bible",
    text: "Par où commencer, comment lire un texte, et que faire lorsqu'on ne comprend pas.",
  },
  {
    title: "Prier",
    text: "Parler à Dieu avec ses propres mots : seul, et avec d'autres.",
  },
  {
    title: "Vivre avec d'autres",
    text: "Ce que change l'appartenance à une assemblée locale, dans la semaine et pas seulement le dimanche.",
  },
  {
    title: "Prendre sa place",
    text: "Servir selon ce que chacun a reçu, sans obligation et sans mise en avant.",
  },
];

const questions = [
  {
    q: "Faut-il être membre pour venir ?",
    a: "Non. Les cultes sont ouverts à tous : membres, sympathisants et visiteurs de passage.",
  },
  {
    q: "Faut-il s'annoncer avant de venir ?",
    a: "Ce n'est pas nécessaire. Vous pouvez venir directement ; si vous préférez prévenir, écrivez-nous sur WhatsApp.",
  },
  {
    q: "Que faut-il porter ?",
    a: "Ce que vous voulez. Personne n'est jugé ici sur son apparence.",
  },
  {
    q: "Et si je viens seul ?",
    a: "Vous ne serez pas laissé de côté : quelqu'un vous accueille à l'entrée et vous aide à vous installer.",
  },
  {
    q: "Y a-t-il un endroit pour les enfants ?",
    a: "Oui. L'Ecodim accompagne les enfants pendant le culte, avec un accompagnement adapté à leur âge.",
  },
];

const related: CrossLink[] = [
  {
    href: "/communaute/groupes-de-maison",
    label: "Groupes de maison",
    description: "La suite naturelle : une petite assemblée près de chez vous.",
  },
  {
    href: "/communaute/priere",
    label: "Prière",
    description: "Confier une demande, ou porter celle d'un autre.",
  },
  {
    href: "/communaute/temoignages",
    label: "Témoignages",
    description: "Ce que d'autres ont raconté de leur propre chemin.",
  },
  {
    href: "/vie-de-leglise/ou-nous-trouver",
    label: "Où nous trouver",
    description: "Adresse, accès et horaires de l'église.",
  },
];

export default function ParcoursNouveauxPage() {
  return (
    <EditorialPage
      rhythm="standard"
      hero={
        <HeroCentered
          overline="Communauté"
          title="Vos premiers pas parmi nous"
          intro={`Entrer dans une église pour la première fois demande du courage. Voici, concrètement, comment cela se passe au ${site.name} — et ce que vous n'aurez pas à faire.`}
        />
      }
      intro={
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <p className="font-sans text-xs font-semibold tracking-[0.18em] text-ccjv-green uppercase">
              Ce qu&apos;est ce parcours
            </p>
            <h2 className="mt-4 text-[clamp(1.75rem,1rem+1.9vw,2.6rem)] leading-[1.14]">
              Un accompagnement, pas un examen
            </h2>
            <Prose dropcap large className="mt-7">
              <p>
                Le parcours des nouveaux n&apos;est pas un sas à franchir avant
                d&apos;avoir le droit d&apos;entrer. C&apos;est un
                accompagnement proposé à celles et ceux qui veulent comprendre
                où ils mettent les pieds — et reprendre les bases sans être
                jugés.
              </p>
              <p>
                Vous pouvez venir au culte sans jamais le demander, et vous
                pouvez le demander après plusieurs mois. Il n&apos;y a ni ordre
                à respecter, ni condition à remplir.
              </p>
              <p>
                Rien n&apos;y est secret : on y parle de ce que dit la Bible, de
                la prière, et de la manière dont tout cela se vit dans une
                assemblée locale.
              </p>
            </Prose>
          </div>

          <div className="lg:col-span-4 lg:col-start-9">
            <div className="border-t border-ccjv-line pt-7">
              <p className="font-sans text-[0.68rem] font-semibold tracking-[0.2em] text-ccjv-green uppercase">
                En résumé
              </p>
              <dl className="mt-6 flex flex-col gap-5">
                <div>
                  <dt className="font-serif text-[1.1rem]">Pour qui</dt>
                  <dd className="mt-1 font-sans text-[0.9rem] leading-relaxed text-ccjv-ink-secondary">
                    Toute personne qui souhaite comprendre avant de s&apos;engager.
                  </dd>
                </div>
                <div>
                  <dt className="font-serif text-[1.1rem]">Ce qu&apos;il faut apporter</dt>
                  <dd className="mt-1 font-sans text-[0.9rem] leading-relaxed text-ccjv-ink-secondary">
                    Rien. Aucun document, aucune inscription préalable.
                  </dd>
                </div>
                <div>
                  <dt className="font-serif text-[1.1rem]">Comment commencer</dt>
                  <dd className="mt-1 font-sans text-[0.9rem] leading-relaxed text-ccjv-ink-secondary">
                    Venez un dimanche, ou posez votre question sur WhatsApp.
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      }
      feature={
        <FeatureImage
          src={images.assemblee}
          variant="full"
          aspect="h-[58svh] min-h-[20rem] w-full"
        />
      }
      body={
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <p className="font-sans text-xs font-semibold tracking-[0.18em] text-ccjv-green uppercase">
              Étape par étape
            </p>
            <h2 className="mt-4 text-[clamp(1.75rem,1rem+1.9vw,2.6rem)] leading-[1.14]">
              Comment cela se passe
            </h2>
            <Prose className="mt-6" width="narrow">
              <p>
                Voici une première visite, du pas de la porte au moment où vous
                repartez. Aucune de ces étapes ne vous engage dans la suivante.
              </p>
            </Prose>
          </div>

          <div className="lg:col-span-7 lg:col-start-6">
            <StepsList steps={steps} variant="vertical" />
          </div>
        </div>
      }
      deepening={
        <div className="flex flex-col gap-[clamp(3rem,7vw,6rem)]">
          {/* Ce qu'on y aborde */}
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-4">
              <p className="font-sans text-xs font-semibold tracking-[0.18em] text-ccjv-green uppercase">
                Ce qu&apos;on y aborde
              </p>
              <h2 className="mt-4 text-[clamp(1.6rem,1rem+1.6vw,2.35rem)] leading-[1.16]">
                Les questions que l&apos;on y pose
              </h2>
            </div>

            <dl className="lg:col-span-7 lg:col-start-6">
              {topics.map((topic, index) => (
                <div
                  key={topic.title}
                  className="grid grid-cols-1 gap-3 border-t border-ccjv-line py-7 sm:grid-cols-12 sm:gap-6"
                >
                  <dt className="flex items-baseline gap-4 sm:col-span-5">
                    <span
                      className="font-serif text-[1.35rem] leading-none text-ccjv-green"
                      aria-hidden="true"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="font-serif text-[1.2rem] leading-snug">
                      {topic.title}
                    </span>
                  </dt>
                  <dd className="text-[0.95rem] leading-[1.7] text-ccjv-ink-secondary sm:col-span-7">
                    {topic.text}
                  </dd>
                </div>
              ))}
              <div className="border-t border-ccjv-line pt-7">
                <ContentPending
                  variant="inline"
                  what="Contenu officiel du parcours nouveaux"
                  hint="Le programme, sa durée et le nombre de rencontres doivent être fournis par CCJV avant publication : ils ne sont pas inventés ici."
                />
              </div>
            </dl>
          </div>

          {/* À qui ça s'adresse */}
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-6">
              <p className="font-sans text-xs font-semibold tracking-[0.18em] text-ccjv-green uppercase">
                À qui ça s&apos;adresse
              </p>
              <h2 className="mt-4 text-[clamp(1.6rem,1rem+1.6vw,2.35rem)] leading-[1.16]">
                Vous n&apos;êtes pas le premier à hésiter
              </h2>
              <Prose className="mt-6">
                <p>
                  À celles et ceux qui viennent pour la première fois et qui
                  préfèrent comprendre avant de s&apos;engager.
                </p>
                <p>
                  À celles et ceux qui connaissent l&apos;église depuis
                  longtemps et souhaitent reprendre les bases, simplement.
                </p>
                <p>
                  À celles et ceux qui accompagnent un proche et veulent
                  pouvoir répondre à ses questions sans improviser.
                </p>
              </Prose>
            </div>

            <div className="lg:col-span-5 lg:col-start-8">
              <FeatureImage src={images.portraitB} variant="portrait" />
            </div>
          </div>

          {/* Questions fréquentes */}
          <div>
            <p className="font-sans text-xs font-semibold tracking-[0.18em] text-ccjv-green uppercase">
              Questions fréquentes
            </p>
            <h2 className="mt-4 text-[clamp(1.6rem,1rem+1.6vw,2.35rem)] leading-[1.16]">
              Ce que vous vous demandez peut-être
            </h2>

            <dl className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-x-14">
              {questions.map((item) => (
                <div key={item.q} className="border-t border-ccjv-line pt-6">
                  <dt className="font-serif text-[1.15rem] leading-snug">
                    {item.q}
                  </dt>
                  <dd className="mt-3 text-[0.95rem] leading-[1.7] text-ccjv-ink-secondary">
                    {item.a}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      }
      scripture={
        <ScriptureBlock
          variant="framed"
          onDark
          context="Pourquoi ce verset ici"
          text={verses.ouvrage.text}
          reference={verses.ouvrage.reference}
        />
      }
      related={
        <div className="flex flex-col gap-[clamp(3rem,7vw,5rem)]">
          <PhotoDuo
            variant="offset"
            left={{ src: images.fraternite }}
            right={{ src: images.chorale }}
          />

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7">
              <p className="font-sans text-xs font-semibold tracking-[0.18em] text-ccjv-green uppercase">
                Venir
              </p>
              <h2 className="mt-4 text-[clamp(1.6rem,1rem+1.6vw,2.35rem)] leading-[1.16]">
                La porte est ouverte
              </h2>
              <Prose className="mt-6">
                <p>
                  Venez un dimanche et présentez-vous : nous serons heureux de
                  vous accueillir. Et si une question vous retient avant de
                  venir, écrivez-nous — c&apos;est déjà un premier pas.
                </p>
              </Prose>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button variant="primary" href={site.whatsappHref} external>
                  Poser une question sur WhatsApp
                </Button>
                <Button variant="outline" href="/vie-de-leglise/ou-nous-trouver">
                  Adresse et horaires
                </Button>
              </div>

              <p className="mt-4 font-sans text-[0.82rem] text-ccjv-ink-secondary">
                {site.whatsappNumber}
              </p>
            </div>

            <div className="lg:col-span-4 lg:col-start-9">
              <CrossLinks items={related} variant="inline" />
            </div>
          </div>
        </div>
      }
    />
  );
}
