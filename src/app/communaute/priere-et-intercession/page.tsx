import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CrossMark } from "@/components/shared/CrossMark";
import { Reveal } from "@/components/shared/Reveal";
import { ParallaxImage } from "@/components/shared/ParallaxImage";
import { PrayerRequestForm } from "@/components/forms/PrayerRequestForm";
import { images } from "@/data/mock/images";
import { site } from "@/data/mock/site";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Prière & intercession — Centre Chrétien Jésus ma Vie",
  description:
    "Déposez votre demande de prière au Centre Chrétien Jésus ma Vie à Lubumbashi : un espace confidentiel, digne et bienveillant pour porter vos fardeaux ensemble devant Dieu.",
  path: "/communaute/priere-et-intercession",
});

/**
 * 3 étapes simples du cheminement de la prière
 */
const prayerSteps = [
  {
    step: "01",
    title: "Vous déposez",
    tagline: "Liberté & discrétion",
    description:
      "Vous partagez ce que vous vivez, avec vos propres mots et sans protocole. Votre demande peut être nominative ou totalement anonyme.",
  },
  {
    step: "02",
    title: "Nous prions",
    tagline: "Engagement fidèle",
    description:
      "L'équipe pastorale et d'intercession du CCJV prend connaissance de votre intention et la porte fidèlement devant Dieu dans le secret.",
  },
  {
    step: "03",
    title: "Nous espérons",
    tagline: "Paix & accompagnement",
    description:
      "Nous croyons que Dieu entend les cœurs sincères. Nous nous tenons à vos côtés dans l'espérance, la foi et la bienveillance fraternelle.",
  },
];

/**
 * Liens croisés vers d'autres espaces communautaires
 */
const relatedLinks = [
  {
    title: "Groupes de maison",
    description: "Prier et partager la Parole dans un petit groupe de quartier.",
    href: "/communaute/groupes-de-maison",
  },
  {
    title: "Parcours nouveau",
    description: "Vos premiers pas au sein de notre communauté chrétienne.",
    href: "/communaute/parcours-nouveau",
  },
  {
    title: "Où nous retrouver",
    description: "Adresse au quartier Hewa Bora et horaires des cultes à Lubumbashi.",
    href: "/vie-de-leglise/ou-nous-trouver",
  },
];

export default function PriereEtIntercessionPage() {
  return (
    <div className="relative w-full overflow-hidden bg-ccjv-offwhite text-ccjv-ink selection:bg-ccjv-green selection:text-white">
      {/* =========================================================================
          01 — HERO : « Vous pouvez déposer votre prière. »
          ========================================================================= */}
      <section className="relative flex min-h-[92svh] flex-col justify-end overflow-hidden bg-ccjv-black text-white">
        {/* Photographie immersive de fond avec voile sombre */}
        <div className="absolute inset-0 z-0 opacity-30">
          <Image
            src={images.louange || "/media/ccjv-08.jpeg"}
            alt="Temps de louange et de prière au Centre Chrétien Jésus ma Vie"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>

        {/* Motif croix sacrée en filigrane */}
        <div className="pointer-events-none absolute right-6 top-24 z-0 text-white/5 md:right-16 md:top-32">
          <CrossMark size="xl" />
        </div>

        <div className="container relative z-10 pt-36 pb-16 lg:pb-24">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8">
              <Reveal>
                <h1 className="font-serif text-[clamp(2.6rem,1.8rem+4.2vw,5.6rem)] font-normal leading-[1.05] tracking-[-0.02em] text-white">
                  Vous pouvez déposer <br />
                  <span className="italic text-ccjv-cream">votre prière.</span>
                </h1>

                <p className="mt-7 max-w-[48ch] font-serif text-[clamp(1.12rem,0.95rem+0.75vw,1.55rem)] font-light leading-relaxed text-white/90">
                  Vous traversez une épreuve, une souffrance, une décision ou une
                  action de grâce ? Vous n&apos;avez pas à porter cela seul.
                </p>

                <div className="mt-10 flex flex-wrap items-center gap-4 sm:gap-6">
                  <a
                    href="#deposer-une-priere"
                    className="inline-flex h-12 items-center justify-center border border-ccjv-green bg-ccjv-green px-8 font-sans text-xs font-semibold tracking-[0.16em] text-white uppercase transition-colors hover:bg-ccjv-green-dark"
                  >
                    Déposer une demande
                  </a>
                  <a
                    href={site.whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-12 items-center justify-center border border-white/30 bg-white/5 px-6 font-sans text-xs font-semibold tracking-[0.14em] text-white uppercase backdrop-blur-sm transition-colors hover:border-white hover:bg-white/10"
                  >
                    Nous écrire
                  </a>
                </div>
              </Reveal>
            </div>

            {/* Cadrage photo éditorial flottant */}
            <div className="hidden lg:col-span-4 lg:block">
              <Reveal delay={150}>
                <div className="relative aspect-[4/5] w-full border border-white/20 bg-ccjv-black/60 p-2 backdrop-blur-md">
                  <div className="relative h-full w-full overflow-hidden">
                    <Image
                      src={images.predication || "/media/ccjv-11.jpeg"}
                      alt="Recueillement et prière"
                      fill
                      sizes="30vw"
                      className="object-cover"
                    />
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          02 — SECTION : VOUS POUVEZ VENIR COMME VOUS ÊTES (RÉASSURANCE)
          ========================================================================= */}
      <section className="relative border-b border-ccjv-line py-20 lg:py-32">
        <div className="container">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
            <Reveal className="lg:col-span-5">
              <ParallaxImage
                src={images.fraternite || "/media/ccjv-35.jpeg"}
                alt="Moment de prière et communion"
                speed={0.10}
                className="aspect-[4/5] w-full"
              />
              <p className="mt-3 font-sans text-xs text-ccjv-ink-secondary">
                Une communauté unie pour porter les fardeaux de chacun.
              </p>
            </Reveal>

            <Reveal delay={120} className="lg:col-span-7">
              <h2 className="text-[clamp(1.9rem,1.2rem+2.3vw,3.3rem)] leading-[1.14]">
                Vous pouvez venir <br />
                <span className="text-ccjv-green">exactement comme vous êtes.</span>
              </h2>

              <div className="mt-8 space-y-5 font-sans text-[1.02rem] leading-[1.8] text-ccjv-ink-secondary">
                <p>
                  Que vous soyez un chrétien affermi, en recherche spirituelle ou
                  simplement traversé par une épreuve douloureuse, vous n&apos;avez
                  pas besoin d&apos;employer un langage codé ni une formulation
                  parfaite.
                </p>
                <p>
                  Partagez simplement votre situation en quelques mots. Nous
                  croyons en un Dieu proche qui console les cœurs brisés et
                  fortifie ceux qui espèrent en Lui.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* =========================================================================
          03 — RESPIRATION BIBLIQUE (Philippiens 4:6-7)
          ========================================================================= */}
      <section className="relative overflow-hidden bg-ccjv-cream py-20 text-ccjv-ink lg:py-28">
        <div className="pointer-events-none absolute right-1/2 top-1/2 -translate-y-1/2 translate-x-1/2 text-ccjv-ink/5">
          <CrossMark size="watermark" />
        </div>

        <div className="container relative z-10">
          <Reveal className="mx-auto max-w-3xl text-center">
            <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center border border-ccjv-ink/20 bg-ccjv-ink/5 text-ccjv-green">
              <CrossMark size="sm" />
            </div>

            <blockquote className="font-serif text-[clamp(1.35rem,1rem+1.6vw,2.3rem)] font-normal leading-[1.45] tracking-[-0.01em] text-ccjv-ink">
              « Ne vous inquiétez de rien ; mais en toute chose faites connaître vos
              besoins à Dieu par des prières et des supplications, avec des
              actions de grâces. Et la paix de Dieu, qui surpasse toute
              intelligence, gardera vos cœurs et vos pensées en Jésus-Christ. »
            </blockquote>

            <figcaption className="mt-6 font-sans text-sm font-medium tracking-wide text-ccjv-ink-secondary">
              — Philippiens 4:6-7
            </figcaption>
          </Reveal>
        </div>
      </section>

      {/* =========================================================================
          04 — COMMENT ÇA SE PASSE ? (3 ÉTAPES NARRATIVES)
          ========================================================================= */}
      <section className="relative border-b border-ccjv-line py-20 lg:py-32">
        <div className="container">
          <Reveal className="max-w-2xl">
            <h2 className="text-[clamp(1.9rem,1.2rem+2.3vw,3.2rem)] leading-[1.15]">
              Comment votre prière est portée
            </h2>
            <p className="mt-4 font-sans text-base leading-relaxed text-ccjv-ink-secondary">
              Un cheminement respectueux et digne, depuis le dépôt de votre intention
              jusqu&apos;à son intercession régulière.
            </p>
          </Reveal>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3 items-stretch">
            {prayerSteps.map((item, index) => (
              <Reveal key={item.step} delay={index * 100} className="h-full">
                <div className="flex h-full flex-col justify-between border border-ccjv-line bg-white p-8 transition-colors hover:border-ccjv-green/40">
                  <div>
                    <div className="flex items-center justify-between border-b border-ccjv-line pb-4">
                      <span className="font-serif text-3xl font-light text-ccjv-green">
                        {item.step}
                      </span>
                      <span className="font-sans text-[0.7rem] uppercase tracking-[0.16em] text-ccjv-ink-secondary">
                        Étape {index + 1}
                      </span>
                    </div>

                    <h3 className="mt-5 font-serif text-2xl font-normal text-ccjv-ink">
                      {item.title}
                    </h3>
                    <p className="mt-1 font-sans text-xs font-semibold tracking-wider text-ccjv-green uppercase">
                      {item.tagline}
                    </p>

                    <p className="mt-4 font-sans text-sm leading-relaxed text-ccjv-ink-secondary">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-8 border-t border-ccjv-line/40 pt-4">
                    <span className="text-[0.75rem] font-sans text-ccjv-ink-secondary">
                      Fidélité & Discrétion
                    </span>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          05 — SECTION PRINCIPALE : DÉPOSER UNE DEMANDE DE PRIÈRE (FORMULAIRE)
          ========================================================================= */}
      <section
        id="deposer-une-priere"
        className="relative scroll-mt-20 border-b border-ccjv-line bg-white py-20 lg:py-32"
      >
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <Reveal className="text-center">
              <h2 className="text-[clamp(2rem,1.3rem+2.6vw,3.6rem)] leading-[1.12]">
                Déposer une demande de prière
              </h2>
              <p className="mt-4 font-sans text-base leading-relaxed text-ccjv-ink-secondary sm:text-lg">
                Remplissez ce formulaire en toute liberté. Votre intention sera
                confiée à nos responsables d&apos;intercession.
              </p>
            </Reveal>

            <div className="mt-12">
              <Reveal delay={120}>
                <PrayerRequestForm />
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          06 — SECTION : NOUS PRIONS LES UNS POUR LES AUTRES (INTERCESSION)
          ========================================================================= */}
      <section className="relative border-b border-ccjv-line py-20 lg:py-32">
        <div className="container">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
            <Reveal className="lg:col-span-6">
              <h2 className="text-[clamp(1.9rem,1.2rem+2.3vw,3.3rem)] leading-[1.14]">
                Nous prions <br />
                <span className="text-ccjv-green">les uns pour les autres.</span>
              </h2>

              <p className="mt-6 font-serif text-lg italic text-ccjv-ink">
                « L&apos;intercession est le souffle vivant de notre communauté. »
              </p>

              <div className="mt-6 space-y-4 font-sans text-[1.02rem] leading-[1.8] text-ccjv-ink-secondary">
                <p>
                  Au Centre Chrétien Jésus ma Vie, la prière n&apos;est pas une
                  formalité occasionnelle. Chaque semaine, lors de notre temps
                  d&apos;intercession le mercredi à 17h00 et au sein de nos groupes de
                  maison, nous portons les besoins concrets des familles, des
                  malades et de notre ville de Lubumbashi.
                </p>
                <p>
                  Vous pouvez également nous rejoindre sur place pour prier
                  ensemble et expérimenter la puissance de la communion fraternelle.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/communaute/groupes-de-maison"
                  className="inline-flex h-12 items-center justify-center border border-ccjv-green bg-ccjv-green px-8 font-sans text-xs font-semibold tracking-[0.16em] text-white uppercase transition-colors hover:bg-ccjv-green-dark"
                >
                  Prier en groupe de maison
                </Link>
                <Link
                  href="/vie-de-leglise/ou-nous-trouver"
                  className="inline-flex h-12 items-center justify-center border border-ccjv-line bg-white px-6 font-sans text-xs font-semibold tracking-[0.14em] text-ccjv-ink uppercase transition-colors hover:border-ccjv-green hover:text-ccjv-green"
                >
                  Horaires des cultes
                </Link>
              </div>
            </Reveal>

            <Reveal delay={140} className="lg:col-span-6">
              <div className="relative aspect-[4/3] w-full overflow-hidden border border-ccjv-line bg-ccjv-line">
                <Image
                  src={images.assemblee || "/media/ccjv-09.jpeg"}
                  alt="Assemblée réunie dans la prière au CCJV"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
              <p className="mt-3 font-sans text-xs text-ccjv-ink-secondary">
                Prière et intercession chaque mercredi à 17h00 à l&apos;église.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* =========================================================================
          07 — INVITATION FINALE & LIENS CROISÉS
          ========================================================================= */}
      <section className="relative bg-ccjv-black py-20 text-white lg:py-32">
        <div className="container">
          <Reveal className="mx-auto max-w-3xl text-center">
            <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center border border-white/20 bg-white/5 text-ccjv-cream">
              <CrossMark size="sm" />
            </div>

            <h2 className="font-serif text-[clamp(2rem,1.3rem+2.6vw,3.8rem)] font-normal leading-[1.12] text-white">
              Nous pouvons prier <br />
              <span className="italic text-ccjv-cream">avec vous.</span>
            </h2>

            <p className="mt-6 font-sans text-base leading-relaxed text-white/80 md:text-lg">
              Que ce soit par écrit, sur WhatsApp ou en personne lors de nos
              rassemblements, notre porte et nos cœurs vous restent ouverts.
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-4 sm:gap-6">
              <a
                href="#deposer-une-priere"
                className="inline-flex h-12 items-center justify-center border border-ccjv-green bg-ccjv-green px-8 font-sans text-xs font-semibold tracking-[0.16em] text-white uppercase transition-colors hover:bg-ccjv-green-dark"
              >
                Déposer une intention
              </a>
              <a
                href={site.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center justify-center border border-white/30 bg-white/10 px-8 font-sans text-xs font-semibold tracking-[0.16em] text-white uppercase backdrop-blur-sm transition-colors hover:border-white hover:bg-white/20"
              >
                Écrire à l&apos;équipe pastorale
              </a>
            </div>
          </Reveal>

          {/* Liens croisés */}
          <div className="mt-20 border-t border-white/15 pt-16">
            <Reveal>
              <h3 className="font-serif text-2xl font-normal text-white">
                Poursuivre la découverte
              </h3>
            </Reveal>

            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3 items-stretch">
              {relatedLinks.map((item, index) => (
                <Reveal key={item.href} delay={index * 100} className="h-full">
                  <Link
                    href={item.href}
                    className="group flex h-full flex-col justify-between border border-white/15 bg-white/5 p-6 transition-all duration-300 hover:border-ccjv-cream/60 hover:bg-white/10"
                  >
                    <div>
                      <h4 className="font-serif text-xl font-normal text-white group-hover:text-ccjv-cream transition-colors">
                        {item.title}
                      </h4>
                      <p className="mt-3 font-sans text-sm leading-relaxed text-white/70">
                        {item.description}
                      </p>
                    </div>
                    <div className="mt-6 flex items-center gap-2 font-sans text-xs font-semibold tracking-wider text-ccjv-cream uppercase">
                      <span>Découvrir</span>
                      <span className="transition-transform duration-300 group-hover:translate-x-1">
                        →
                      </span>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
