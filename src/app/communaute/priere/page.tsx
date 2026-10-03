import { HeroCentered } from "@/components/composition/HeroCentered";
import { Band } from "@/components/composition/Band";
import { EditorialPage } from "@/components/archetypes/EditorialPage";
import { Prose } from "@/components/editorial/Prose";
import { FeatureImage } from "@/components/editorial/FeatureImage";
import { ScriptureBlock } from "@/components/editorial/ScriptureBlock";
import { StepsList, type Step } from "@/components/editorial/StepsList";
import { ContentPending } from "@/components/editorial/ContentPending";
import { CrossLinks, type CrossLink } from "@/components/editorial/CrossLinks";
import { WeekRhythm } from "@/components/shared/WeekRhythm";
import { Button } from "@/components/ui/Button";
import { images } from "@/data/mock/images";
import { site, weeklyRhythm } from "@/data/mock/site";
import { verses } from "@/data/mock/verses";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Prière",
  description:
    "Confier une demande de prière au Centre Chrétien Jésus ma Vie : comment transmettre une intention, les temps de prière de la communauté et ce que nous nous engageons à respecter.",
  path: "/communaute/priere",
});

/**
 * Les deux seuls canaux réellement ouverts aujourd'hui : WhatsApp et le fait de
 * confier sa demande sur place. Aucun délai de réponse n'est promis.
 */
const steps: Step[] = [
  {
    title: "Par WhatsApp",
    text: "Écrivez au numéro de l'église et dites ce que vous souhaitez partager. Quelques mots suffisent : vous n'avez rien à rédiger de particulier.",
  },
  {
    title: "Sur place",
    text: "Vous pouvez aussi confier votre demande à l'un des temps de prière de la communauté, ou auprès de quelqu'un de l'église.",
  },
  {
    title: "Avec vos propres limites",
    text: "Vous choisissez ce que vous dites et ce que vous taisez. Rien de plus ne vous sera demandé.",
  },
];

/** Ce que nous cherchons à garantir à toute personne qui confie une demande. */
const commitments = [
  {
    title: "Rien n'est publié",
    text: "Une demande confiée n'est jamais publiée sur le site ni sur les réseaux sociaux de l'église.",
  },
  {
    title: "Votre nom n'est pas exigé",
    text: "Vous pouvez déposer une demande sans vous nommer, et sans entrer dans le détail de votre situation.",
  },
  {
    title: "Vous gardez la main",
    text: "Vous pouvez demander qu'une demande ne soit pas partagée au-delà d'une seule personne.",
  },
];

const related: CrossLink[] = [
  {
    href: "/communaute/groupes-de-maison",
    label: "Groupes de maison",
    description: "Prier à taille humaine, près de chez soi.",
  },
  {
    href: "/communaute/parcours-nouveaux",
    label: "Parcours nouveaux",
    description: "Vos premiers pas parmi nous, accompagnés.",
  },
  {
    href: "/communaute/temoignages",
    label: "Témoignages",
    description: "Ce que d'autres ont raconté de ce qu'ils ont vécu.",
  },
  {
    href: "/vie-de-leglise/ou-nous-trouver",
    label: "Où nous trouver",
    description: "Adresse, accès et horaires de l'église.",
  },
];

export default function PrierePage() {
  return (
    <EditorialPage
      rhythm="standard"
      hero={
        <>
          <HeroCentered
            tone="dark"
            overline="Communauté"
            title="Prendre le temps de prier"
            intro="Vous traversez une épreuve, une joie, une question, une décision ? Vous pouvez confier votre demande : elle sera portée dans la prière de l'église."
          />

          {/* Pourquoi nous prions — même nuit que le héros, sans rupture */}
          <Band tone="dark" space="tight">
            <div className="max-w-[62ch]">
              <p className="font-sans text-xs font-semibold tracking-[0.18em] text-ccjv-cream uppercase">
                Pourquoi nous prions
              </p>
              <h2 className="mt-4 text-[clamp(1.75rem,1rem+1.9vw,2.6rem)] leading-[1.14] text-white">
                Une conversation, pas une performance
              </h2>
              <Prose onDark large className="mt-7">
                <p>
                  La prière n&apos;est pas un exercice réservé à ceux qui
                  sauraient s&apos;exprimer. C&apos;est une conversation : on
                  vient comme on est, avec ce qu&apos;on a, et parfois sans mots
                  du tout.
                </p>
                <p>
                  Nous prions parce que nous croyons que Dieu entend. Nous prions
                  aussi parce que personne ne devrait porter seul ce qui est
                  trop lourd.
                </p>
                <p>
                  Cette page n&apos;est pas un guichet. Elle existe pour dire une
                  chose simple : il y a un endroit où votre demande peut être
                  déposée.
                </p>
              </Prose>
            </div>
          </Band>
        </>
      }
      intro={
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <p className="font-sans text-xs font-semibold tracking-[0.18em] text-ccjv-green uppercase">
              Ce que dit l&apos;Écriture
            </p>
            <h2 className="mt-4 text-[clamp(1.75rem,1rem+1.9vw,2.6rem)] leading-[1.14]">
              Une invitation, pas une exigence
            </h2>
            <Prose className="mt-6" width="narrow">
              <p>
                L&apos;Écriture ne demande pas de savoir prier pour venir à Dieu.
                Elle rapporte une invitation — et c&apos;est cette invitation que
                nous prenons au mot.
              </p>
            </Prose>
          </div>

          <div className="lg:col-span-7 lg:col-start-6">
            <ScriptureBlock
              variant="wide"
              context="L'invitation que nous prenons au mot"
              text={verses.repos.text}
              reference={verses.repos.reference}
            />
          </div>
        </div>
      }
      feature={
        <FeatureImage
          src={images.louange}
          variant="full"
          aspect="h-[58svh] min-h-[20rem] w-full"
        />
      }
      body={
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <p className="font-sans text-xs font-semibold tracking-[0.18em] text-ccjv-green uppercase">
              Confier une demande
            </p>
            <h2 className="mt-4 text-[clamp(1.75rem,1rem+1.9vw,2.6rem)] leading-[1.14]">
              Deux canaux, rien d&apos;autre à préparer
            </h2>
            <Prose className="mt-6" width="narrow">
              <p>
                Il n&apos;y a ni formulaire à remplir, ni texte à composer, ni
                rendez-vous à prendre. Voici comment cela se passe aujourd&apos;hui.
              </p>
            </Prose>

            <div className="mt-8">
              <Button variant="primary" href={site.whatsappHref} external>
                Confier une demande
              </Button>
              <p className="mt-3 font-sans text-[0.82rem] text-ccjv-ink-secondary">
                {site.whatsappNumber}
              </p>
            </div>
          </div>

          <div className="lg:col-span-7 lg:col-start-6">
            <StepsList steps={steps} variant="vertical" />

            <ContentPending
              className="mt-12"
              variant="inline"
              what="Espace de prière en ligne"
              hint="Un formulaire confidentiel est prévu ; en attendant, les demandes se transmettent par WhatsApp ou se confient sur place."
            />
          </div>
        </div>
      }
      deepening={
        <div className="flex flex-col gap-[clamp(3rem,7vw,6rem)]">
          {/* Les temps de la communauté */}
          <div>
            <p className="font-sans text-xs font-semibold tracking-[0.18em] text-ccjv-green uppercase">
              Les temps de la communauté
            </p>
            <h2 className="mt-4 text-[clamp(1.6rem,1rem+1.6vw,2.35rem)] leading-[1.16]">
              Quand l&apos;église se rassemble, on y prie
            </h2>
            <Prose className="mt-6" width="narrow">
              <p>
                Voici le rythme régulier de la semaine : le culte du dimanche, la
                prière et l&apos;intercession, les répétitions de la chorale, et
                l&apos;Ecodim pour les enfants. Ces rendez-vous ne sont pas
                réservés à quelques-uns : ils sont ouverts à tous.
              </p>
            </Prose>

            <div className="mt-12">
              <WeekRhythm items={weeklyRhythm} />
            </div>
          </div>

          {/* Confidentialité */}
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-4">
              <p className="font-sans text-xs font-semibold tracking-[0.18em] text-ccjv-green uppercase">
                Confidentialité et respect
              </p>
              <h2 className="mt-4 text-[clamp(1.6rem,1rem+1.6vw,2.35rem)] leading-[1.16]">
                Ce que nous cherchons à garantir
              </h2>
            </div>

            <div className="lg:col-span-7 lg:col-start-6">
              <dl>
                {commitments.map((item, index) => (
                  <div
                    key={item.title}
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
                        {item.title}
                      </span>
                    </dt>
                    <dd className="text-[0.95rem] leading-[1.7] text-ccjv-ink-secondary sm:col-span-7">
                      {item.text}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="border-t border-ccjv-line pt-7">
                <ContentPending
                  variant="inline"
                  what="Procédure de confidentialité des demandes de prière"
                  hint="À confirmer par CCJV : qui reçoit les demandes, qui prie pour elles, et combien de temps elles sont conservées."
                />
              </div>
            </div>
          </div>
        </div>
      }
      scripture={
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <p className="font-sans text-xs font-semibold tracking-[0.18em] text-ccjv-cream uppercase">
              Prier pour les autres
            </p>
            <h2 className="mt-4 text-[clamp(1.6rem,1rem+1.6vw,2.35rem)] leading-[1.16] text-white">
              Personne ne prie seulement pour lui-même
            </h2>
            <Prose onDark className="mt-6">
              <p>
                Une large place est faite aux demandes qui ne sont pas les
                nôtres : la santé d&apos;un proche, une famille, une décision à
                prendre, une situation que l&apos;on ne sait plus comment porter.
              </p>
              <p>
                Vous pouvez aussi demander à prier pour quelqu&apos;un d&apos;autre.
                C&apos;est même l&apos;une des manières les plus simples de
                commencer.
              </p>
            </Prose>

            <ScriptureBlock
              className="mt-12"
              variant="inline"
              onDark
              context="Pourquoi nous prions les uns pour les autres"
              text={verses.rassemblement.text}
              reference={verses.rassemblement.reference}
            />
          </div>

          <div className="lg:col-span-4 lg:col-start-9">
            <FeatureImage src={images.portraitA} variant="portrait" />
          </div>
        </div>
      }
      related={
        <>
          <p className="font-sans text-xs font-semibold tracking-[0.18em] text-ccjv-green uppercase">
            Continuer
          </p>
          <h2 className="mt-4 mb-6 text-[clamp(1.6rem,1rem+1.6vw,2.35rem)] leading-[1.16]">
            Et si vous préfériez venir prier avec nous
          </h2>
          <Prose className="mb-12" width="narrow">
            <p>
              Les portes sont ouvertes aux heures de rassemblement, et il est
              possible de venir simplement s&apos;asseoir et écouter. Vous pouvez
              aussi demander à rejoindre un groupe de maison : on y prie à
              plusieurs, à taille humaine.
            </p>
          </Prose>
          <CrossLinks items={related} variant="list" />
        </>
      }
    />
  );
}
