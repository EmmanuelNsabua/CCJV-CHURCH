import Image from "next/image";
import { HeroManifesto } from "@/components/composition/HeroManifesto";
import { NarrativePage } from "@/components/archetypes/NarrativePage";
import { Prose } from "@/components/editorial/Prose";
import { FeatureImage } from "@/components/editorial/FeatureImage";
import { PhotoDuo } from "@/components/editorial/PhotoDuo";
import { PullQuote } from "@/components/editorial/PullQuote";
import { ScriptureBlock } from "@/components/editorial/ScriptureBlock";
import { ContentPending } from "@/components/editorial/ContentPending";
import { CrossLinks, type CrossLink } from "@/components/editorial/CrossLinks";
import { Button } from "@/components/ui/Button";
import { testimonies } from "@/data/mock/testimonies";
import { images } from "@/data/mock/images";
import { site } from "@/data/mock/site";
import { verses } from "@/data/mock/verses";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Témoignages",
  description:
    "Des récits racontés par des membres du Centre Chrétien Jésus ma Vie, à Lubumbashi — et la place laissée à ceux qui souhaitent raconter à leur tour.",
  path: "/communaute/temoignages",
});

const related: CrossLink[] = [
  {
    href: "/communaute/priere",
    label: "Prière",
    description: "Confier une demande, ou porter celle d'un autre.",
  },
  {
    href: "/communaute/parcours-nouveaux",
    label: "Parcours nouveaux",
    description: "Vos premiers pas parmi nous, accompagnés.",
  },
  {
    href: "/communaute/groupes-de-maison",
    label: "Groupes de maison",
    description: "Là où ces histoires se racontent d'abord.",
  },
  {
    href: "/qui-sommes-nous",
    label: "Qui sommes-nous",
    description: "Notre histoire et notre foi.",
  },
];

export default function TemoignagesPage() {
  /**
   * ⚠️ Contenus de DÉMONSTRATION (`src/data/mock/testimonies.ts`) : ces récits
   * ne sont pas réels et servent à montrer le format (visage + parole). Ils sont
   * signalés comme tels dans la page et attendent les témoignages réels.
   */
  const [lead, ...others] = testimonies;

  return (
    <NarrativePage
      rhythm="serene"
      hero={
        <HeroManifesto
          tone="dark"
          overline="Communauté"
          title="Ce que Dieu a fait"
          declaration="Un témoignage n'est pas une performance. C'est une histoire vraie, racontée simplement par quelqu'un qui l'a vécue."
          scripture={{
            text: verses.memoire.text,
            reference: verses.memoire.reference,
          }}
          scriptureContext="Pourquoi nous racontons"
        />
      }
      prologue={
        <div className="max-w-[68ch]">
          <p className="font-sans text-xs font-semibold tracking-[0.18em] text-ccjv-green uppercase">
            Pourquoi nous racontons
          </p>
          <h2 className="mt-4 text-[clamp(1.75rem,1rem+1.9vw,2.6rem)] leading-[1.14]">
            Une histoire vaut mieux qu&apos;un argument
          </h2>
          <Prose dropcap large className="mt-7">
            <p>
              Un raisonnement ne suffit jamais à dire ce qui change une vie. Ce
              qui se raconte, ce sont des moments : une période traversée, une
              décision prise, une rencontre qui a déplacé quelque chose.
            </p>
            <p>
              Nous racontons parce que la Bible elle-même est pleine
              d&apos;histoires — et parce qu&apos;une église est faite de
              personnes qui ont quelque chose à dire, même maladroitement.
            </p>
            <p>
              Ces récits ne sont ni des preuves ni des modèles. Ce sont des voix,
              avec leurs mots, et elles ne prétendent pas parler pour tout le
              monde.
            </p>
          </Prose>

          <ContentPending
            className="mt-12"
            what="Témoignages réels"
            hint="Les témoignages présentés sur cette page sont des exemples de démonstration rédigés pour la maquette. Ils seront remplacés par de vrais témoignages, recueillis avec l'accord explicite des personnes concernées."
          />
        </div>
      }
      chapters={
        <>
          {/* Témoignage principal — portrait + parole, en grand */}
          <article className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
            <figure className="lg:col-span-5">
              <div className="relative aspect-4/5 w-full overflow-hidden bg-ccjv-line">
                <Image
                  src={lead.photo}
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 100vw, 38vw"
                  className="object-cover"
                />
              </div>
            </figure>

            <div className="lg:col-span-6 lg:col-start-7">
              <p className="font-sans text-xs font-semibold tracking-[0.18em] text-ccjv-green uppercase">
                Témoignage
              </p>
              <h2 className="mt-5 font-serif text-[clamp(1.9rem,1.1rem+2.2vw,3rem)] leading-[1.1]">
                {lead.name}
              </h2>
              <p className="mt-3 font-sans text-[0.98rem] text-ccjv-ink-secondary">
                {lead.role}
              </p>

              <PullQuote
                className="mt-10"
                align="left"
                text={`« ${lead.quote} »`}
              />
            </div>
          </article>

          {/* Témoignages secondaires — liste éditoriale à filets */}
          <div>
            <p className="font-sans text-xs font-semibold tracking-[0.18em] text-ccjv-green uppercase">
              D&apos;autres voix
            </p>
            <h2 className="mt-4 max-w-[30ch] text-[clamp(1.6rem,1rem+1.6vw,2.35rem)] leading-[1.16]">
              Des récits courts, chacun avec ses mots
            </h2>

            <ul className="mt-12 border-t border-ccjv-line">
              {others.map((testimony) => (
                <li
                  key={testimony.id}
                  className="grid grid-cols-1 gap-7 border-b border-ccjv-line py-10 sm:grid-cols-12 sm:gap-8"
                >
                  <figure className="sm:col-span-3">
                    <div className="relative aspect-3/4 w-full overflow-hidden bg-ccjv-line">
                      <Image
                        src={testimony.photo}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 100vw, 22vw"
                        className="object-cover"
                      />
                    </div>
                  </figure>

                  <div className="sm:col-span-8 sm:col-start-5">
                    <blockquote className="font-serif text-[clamp(1.15rem,0.8rem+1.1vw,1.6rem)] leading-[1.5] text-ccjv-ink italic">
                      « {testimony.quote} »
                    </blockquote>
                    <p className="mt-5 font-sans text-[0.95rem] font-semibold">
                      {testimony.name}
                    </p>
                    <p className="font-sans text-[0.78rem] font-semibold tracking-[0.14em] text-ccjv-ink-secondary uppercase">
                      {testimony.role}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <ContentPending
              className="mt-10"
              variant="inline"
              what="Témoignages réels"
              hint="Ces récits, comme le précédent, sont des contenus de démonstration : les témoignages définitifs doivent être recueillis auprès des personnes elles-mêmes."
            />
          </div>
        </>
      }
      feature={
        <FeatureImage
          src={images.service}
          variant="full"
          aspect="h-[64svh] min-h-[22rem] w-full"
        />
      }
      chronology={
        <div>
          <p className="font-sans text-xs font-semibold tracking-[0.18em] text-ccjv-green uppercase">
            Photographies
          </p>
          <h2 className="mt-4 max-w-[26ch] text-[clamp(1.6rem,1rem+1.6vw,2.35rem)] leading-[1.16]">
            L&apos;église, telle qu&apos;on y vit
          </h2>
          <Prose className="mt-6" width="narrow">
            <p>
              Un témoignage se dit aussi en images. Celles-ci ne prétendent rien
              démontrer : elles montrent un lieu, un rassemblement, et des
              personnes qui s&apos;y tiennent.
            </p>
          </Prose>

          <div className="mt-14">
            <PhotoDuo
              variant="offset"
              left={{ src: images.assemblee }}
              right={{ src: images.fraternite }}
            />
          </div>
        </div>
      }
      epilogue={
        <ScriptureBlock
          variant="wide"
          onDark
          context="Rendre grâce"
          text={verses.louange.text}
          reference={verses.louange.reference}
        />
      }
      related={
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-6">
            <p className="font-sans text-xs font-semibold tracking-[0.18em] text-ccjv-green uppercase">
              Partager
            </p>
            <h2 className="mt-4 text-[clamp(1.6rem,1rem+1.6vw,2.35rem)] leading-[1.16]">
              Et vous, que diriez-vous ?
            </h2>
            <Prose className="mt-6">
              <p>
                Si quelque chose a changé dans votre vie, votre histoire peut
                encourager quelqu&apos;un d&apos;autre. Nous serions honorés de
                l&apos;entendre — et vous restez libre de la raconter comme vous
                le souhaitez.
              </p>
            </Prose>

            <div className="mt-8">
              <Button variant="primary" href={site.whatsappHref} external>
                Proposer mon témoignage
              </Button>
            </div>

            <p className="mt-4 max-w-[52ch] font-sans text-[0.82rem] leading-relaxed text-ccjv-ink-secondary">
              Aucun témoignage n&apos;est publié sans l&apos;accord explicite de
              la personne concernée.
            </p>
          </div>

          <div className="lg:col-span-5 lg:col-start-8">
            <CrossLinks items={related} variant="list" />
          </div>
        </div>
      }
    />
  );
}
