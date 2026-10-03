import { HeroSplit } from "@/components/composition/HeroSplit";
import { EditorialPage } from "@/components/archetypes/EditorialPage";
import { Prose } from "@/components/editorial/Prose";
import { FeatureImage } from "@/components/editorial/FeatureImage";
import { KeyFacts } from "@/components/editorial/KeyFacts";
import { PhotoDuo } from "@/components/editorial/PhotoDuo";
import { ScriptureBlock } from "@/components/editorial/ScriptureBlock";
import { CrossLinks, type CrossLink } from "@/components/editorial/CrossLinks";
import { Button } from "@/components/ui/Button";
import { images } from "@/data/mock/images";
import { site } from "@/data/mock/site";
import { verses } from "@/data/mock/verses";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Groupes de maison",
  description:
    "Les groupes de maison du Centre Chrétien Jésus ma Vie : de petits rassemblements de quartier pour prier, partager la Parole et s'entraider à Lubumbashi.",
  path: "/communaute/groupes-de-maison",
});

/** Ce qui se vit dans un groupe — présentation éditoriale, pas cartes. */
const lifeInGroup = [
  {
    title: "On y prie vraiment",
    text: "Les sujets personnels trouvent leur place : la santé, la famille, le travail, les décisions à prendre. On ne prie pas « en général ».",
  },
  {
    title: "On y partage la Parole",
    text: "Un texte biblique, des questions simples, et le droit de ne pas tout comprendre. La Bible s'y lit à voix haute, ensemble.",
  },
  {
    title: "On s'y entraide",
    text: "Un déménagement, une naissance, une épreuve : le groupe se mobilise concrètement, sans attendre qu'on le lui demande.",
  },
];

const related: CrossLink[] = [
  {
    href: "/communaute/priere",
    label: "Prière et intercession",
    description: "Déposer une demande, ou porter celle d'un autre.",
  },
  {
    href: "/communaute/parcours-nouveaux",
    label: "Parcours nouveaux",
    description: "Vos premiers pas parmi nous, accompagnés.",
  },
  {
    href: "/communaute/temoignages",
    label: "Témoignages",
    description: "Ce que Dieu a fait dans la vie de personnes de l'église.",
  },
  {
    href: "/vie-de-leglise/ou-nous-trouver",
    label: "Où nous trouver",
    description: "Adresse, horaires et contact de l'église.",
  },
];

export default function GroupesDeMaisonPage() {
  return (
    <EditorialPage
      rhythm="serene"
      hero={
        <HeroSplit
          overline="Communauté"
          title="Une église dans un salon"
          intro="L'église ne se vit pas seulement le dimanche. Les groupes de maison permettent de vivre la foi près de chez soi, à taille humaine — là où l'on peut être connu par son prénom."
          image={images.communaute}
          secondaryImage={images.portraitB}
          secondaryCaption="Centre Chrétien Jésus ma Vie — Lubumbashi"
          paragraphs={[
            "Un groupe de maison n'est pas une réunion de plus dans la semaine. C'est le lieu où la foi cesse d'être une opinion pour devenir une vie partagée : on y connaît les prénoms, les métiers, les difficultés de chacun.",
            "Cette page explique ce qui s'y vit, à quoi s'attendre lors d'une première soirée, et comment rejoindre le groupe le plus proche de chez vous.",
          ]}
        >
          <KeyFacts
            variant="inline"
            items={[
              { label: "Où", value: "Quartiers de Lubumbashi" },
              { label: "Pour qui", value: "Toute personne de l'église" },
              { label: "Pour rejoindre", value: "Par WhatsApp" },
            ]}
          />
          <div className="mt-8">
            <Button variant="primary" href={site.whatsappHref} external>
              Rejoindre un groupe
            </Button>
          </div>
        </HeroSplit>
      }
      intro={
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <p className="font-sans text-xs font-semibold tracking-[0.18em] text-ccjv-green uppercase">
              Qu&apos;est-ce que c&apos;est ?
            </p>
            <h2 className="mt-4 text-[clamp(1.75rem,1rem+1.9vw,2.6rem)] leading-[1.14]">
              Un petit nombre, une vraie proximité
            </h2>
            <Prose dropcap large className="mt-7">
              <p>
                Un groupe de maison, c&apos;est un petit rassemblement qui se
                tient chez l&apos;un des membres, dans un quartier. On y prie, on
                y ouvre la Bible, on y parle vrai, et on y partage un moment
                simple.
              </p>
              <p>
                La différence avec un culte n&apos;est pas le contenu, mais
                l&apos;échelle. Dans une assemblée, on peut rester anonyme. Dans
                un salon, non — et c&apos;est précisément là que quelque chose
                change.
              </p>
              <p>
                C&apos;est souvent dans ces maisons que se nouent les amitiés
                durables, et que les nouveaux venus se sentent enfin chez eux.
              </p>
            </Prose>
          </div>

          <div className="lg:col-span-4 lg:col-start-9">
            <ScriptureBlock
              variant="inline"
              context="Pourquoi pas seul"
              text={verses.rassemblement.text}
              reference={verses.rassemblement.reference}
            />
          </div>
        </div>
      }
      feature={
        <FeatureImage
          src={images.fraternite}
          variant="full"
          aspect="h-[58svh] min-h-[20rem] w-full"
        />
      }
      body={
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <p className="font-sans text-xs font-semibold tracking-[0.18em] text-ccjv-green uppercase">
              Ce qu&apos;on y trouve
            </p>
            <h2 className="mt-4 text-[clamp(1.75rem,1rem+1.9vw,2.6rem)] leading-[1.14]">
              Trois choses qu&apos;un groupe apporte
            </h2>
            <p className="mt-6 max-w-[42ch] text-ccjv-ink-secondary">
              Rien d&apos;extraordinaire, et c&apos;est justement ce qui rend ces
              rencontres tenables dans le temps.
            </p>
          </div>

          <dl className="lg:col-span-7 lg:col-start-6">
            {lifeInGroup.map((item, index) => (
              <div
                key={item.title}
                className="grid grid-cols-1 gap-3 border-t border-ccjv-line py-8 sm:grid-cols-12 sm:gap-6"
              >
                <dt className="flex items-baseline gap-4 sm:col-span-5">
                  <span
                    className="font-serif text-[1.35rem] leading-none text-ccjv-green"
                    aria-hidden="true"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="font-serif text-[1.25rem] leading-snug">
                    {item.title}
                  </span>
                </dt>
                <dd className="text-[0.95rem] leading-[1.7] text-ccjv-ink-secondary sm:col-span-7">
                  {item.text}
                </dd>
              </div>
            ))}
            <div className="border-t border-ccjv-line pt-8">
              <p className="max-w-[58ch] text-ccjv-ink-secondary">
                Les groupes se réunissent dans plusieurs quartiers de
                Lubumbashi. Écrivez-nous en indiquant votre quartier : nous vous
                orienterons vers le groupe le plus proche.
              </p>
            </div>
          </dl>
        </div>
      }
      deepening={
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <p className="font-sans text-xs font-semibold tracking-[0.18em] text-ccjv-green uppercase">
              À quoi s&apos;attendre
            </p>
            <h2 className="mt-4 text-[clamp(1.6rem,1rem+1.6vw,2.35rem)] leading-[1.16]">
              Votre première soirée
            </h2>
            <Prose className="mt-6" width="narrow">
              <p>
                Vous n&apos;aurez rien à préparer, rien à apporter et rien à
                réciter. On vous accueillera comme on a été accueilli
                soi-même.
              </p>
              <p>
                Si vous préférez venir accompagné la première fois, dites-le
                nous : quelqu&apos;un de l&apos;église pourra vous rejoindre et
                vous présenter.
              </p>
            </Prose>
            <div className="mt-8">
              <Button variant="outline" href={site.whatsappHref} external>
                Demander un groupe près de chez moi
              </Button>
            </div>
          </div>

          <div className="lg:col-span-6 lg:col-start-7">
            <PhotoDuo
              variant="offset"
              left={{ src: images.service }}
              right={{ src: images.assemblee }}
            />
          </div>
        </div>
      }
      scripture={
        <ScriptureBlock
          variant="concluding"
          context="Porter les fardeaux les uns des autres"
          text={verses.repos.text}
          reference={verses.repos.reference}
        />
      }
      related={
        <>
          <p className="font-sans text-xs font-semibold tracking-[0.18em] text-ccjv-green uppercase">
            Continuer
          </p>
          <h2 className="mt-4 mb-10 text-[clamp(1.6rem,1rem+1.6vw,2.35rem)] leading-[1.16]">
            La vie communautaire ne s&apos;arrête pas là
          </h2>
          <CrossLinks items={related} variant="list" />
        </>
      }
    />
  );
}
