import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CrossMark } from "@/components/shared/CrossMark";
import { Reveal } from "@/components/shared/Reveal";
import { ParallaxImage } from "@/components/shared/ParallaxImage";
import { images } from "@/data/mock/images";
import { site } from "@/data/mock/site";
import { houseGroups } from "@/data/mock/community";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Groupes de maison — Centre Chrétien Jésus ma Vie",
  description:
    "Découvrez les groupes de maison du Centre Chrétien Jésus ma Vie à Lubumbashi : de petits espaces de proximité pour prier, partager la Bible et grandir ensemble.",
  path: "/communaute/groupes-de-maison",
});

/**
 * 4 piliers narratifs de l'expérience en petit groupe
 */
const groupPillars = [
  {
    step: "01",
    title: "Se retrouver",
    tagline: "L'accueil sans artifice",
    description:
      "Franchir le pas et être reçu simplement comme à la maison. Un cadre bienveillant où l'on est reconnu par son prénom, loin du bruit et de l'anonymat.",
  },
  {
    step: "02",
    title: "Partager",
    tagline: "La Parole & la vie",
    description:
      "Ouvrir la Bible à hauteur d'homme et échanger librement sur nos réalités du quotidien. Chacun a la parole pour poser ses questions en toute sincérité.",
  },
  {
    step: "03",
    title: "Prier",
    tagline: "Porter les fardeaux réels",
    description:
      "Prier concrètement pour la famille, la santé, le travail, les projets et les épreuves. On ne prie pas « en général », mais les uns pour les autres.",
  },
  {
    step: "04",
    title: "Grandir",
    tagline: "Des amitiés durables",
    description:
      "Tisser des liens profonds qui dépassent la réunion du soir : s'entraider, s'encourager mutuellement et mûrir ensemble dans la foi chrétienne.",
  },
];

/**
 * Liens croisés vers les autres aspects de la vie communautaire
 */
const relatedLinks = [
  {
    title: "Prière & intercession",
    description: "Déposer une demande de prière ou rejoindre nos temps d'intercession.",
    href: "/communaute/priere-et-intercession",
  },
  {
    title: "Première visite",
    description: "Tout ce que vous devez savoir pour votre premier dimanche parmi nous.",
    href: "/vie-de-leglise/premiere-visite",
  },
  {
    title: "Où nous retrouver",
    description: "Horaires, adresse au quartier Hewa Bora et plan d'accès à Lubumbashi.",
    href: "/vie-de-leglise/ou-nous-trouver",
  },
];

export default function GroupesDeMaisonPage() {
  return (
    <div className="relative w-full overflow-hidden bg-ccjv-offwhite text-ccjv-ink selection:bg-ccjv-green selection:text-white">
      {/* =========================================================================
          01 — HERO : « La foi se vit aussi ensemble. »
          ========================================================================= */}
      <section className="relative flex min-h-[92svh] flex-col justify-end overflow-hidden bg-ccjv-black text-white">
        {/* Composition photographique de fond avec voile sombre */}
        <div className="absolute inset-0 z-0 opacity-30">
          <Image
            src={images.communaute}
            alt="Communion fraternelle au Centre Chrétien Jésus ma Vie"
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
                  La foi se vit <br />
                  <span className="italic text-ccjv-cream">aussi</span> ensemble.
                </h1>

                <p className="mt-7 max-w-[48ch] font-serif text-[clamp(1.12rem,0.95rem+0.75vw,1.55rem)] font-light leading-relaxed text-white/90">
                  La vie avec Dieu n&apos;a jamais été pensée pour être vécue en
                  solitaire, ni limitée au seul rassemblement du dimanche.
                </p>

                <div className="mt-10 flex flex-wrap items-center gap-4 sm:gap-6">
                  <a
                    href="#trouvez-votre-groupe"
                    className="inline-flex h-12 items-center justify-center border border-ccjv-green bg-ccjv-green px-8 font-sans text-xs font-semibold tracking-[0.16em] text-white uppercase transition-colors hover:bg-ccjv-green-dark"
                  >
                    Trouver un groupe
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
                      src={images.fraternite}
                      alt="Partage et prière en maison"
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
          02 — POURQUOI LES GROUPES DE MAISON ?
          ========================================================================= */}
      <section className="relative border-b border-ccjv-line py-20 lg:py-32">
        <div className="container">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
            <Reveal className="lg:col-span-5">
              <ParallaxImage
                src={images.identite}
                alt="Échanges et prière fraternelle"
                speed={0.10}
                className="aspect-[4/5] w-full"
              />
              <p className="mt-3 font-sans text-xs text-ccjv-ink-secondary">
                Une communauté vivante, tissée de relations authentiques.
              </p>
            </Reveal>

            <Reveal delay={120} className="lg:col-span-7">
              <h2 className="text-[clamp(1.9rem,1.2rem+2.3vw,3.3rem)] leading-[1.14]">
                Parce que la communauté <br />
                <span className="text-ccjv-green">commence à petite échelle.</span>
              </h2>

              <div className="mt-8 space-y-5 font-sans text-[1.02rem] leading-[1.8] text-ccjv-ink-secondary">
                <p>
                  Un groupe de maison n&apos;est pas une réunion administrative de plus
                  dans la semaine. C&apos;est un foyer où chacun peut être écouté,
                  compris et accompagné dans ses joies comme dans ses épreuves.
                </p>
                <p>
                  On y vient pour ouvrir la Bible sans complexe, prier pour des sujets
                  qui touchent directement nos vies de famille, de couple ou d&apos;activité,
                  et expérimenter l&apos;entraide chrétienne concrète.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* =========================================================================
          03 — RESPIRATION BIBLIQUE (Actes 2:46-47)
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
              « Ils étaient chaque jour tous ensemble assidus au temple, ils
              rompaient le pain dans les maisons, et prenaient leur nourriture avec
              joie et simplicité de cœur, louant Dieu et ayant la faveur de tout le
              peuple. »
            </blockquote>

            <figcaption className="mt-6 font-sans text-sm font-medium tracking-wide text-ccjv-ink-secondary">
              — Actes 2:46-47
            </figcaption>
          </Reveal>
        </div>
      </section>

      {/* =========================================================================
          05 — TROUVEZ VOTRE GROUPE (SECTION FONCTIONNELLE RÉELLE)
          ========================================================================= */}
      <section
        id="trouvez-votre-groupe"
        className="relative scroll-mt-20 border-b border-ccjv-line bg-white py-20 lg:py-32"
      >
        <div className="container">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <Reveal className="max-w-2xl">
              <h2 className="text-[clamp(1.9rem,1.2rem+2.3vw,3.2rem)] leading-[1.15]">
                Trouvez votre groupe
              </h2>
              <p className="mt-4 font-sans text-base leading-relaxed text-ccjv-ink-secondary">
                Plusieurs cellules de quartier se réunissent chaque semaine à
                Lubumbashi. Choisissez le groupe le plus proche de votre domicile ou
                de votre lieu de travail.
              </p>
            </Reveal>

            <Reveal delay={100} className="shrink-0">
              <a
                href={site.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center justify-center border border-ccjv-line bg-ccjv-offwhite px-6 font-sans text-xs font-semibold tracking-[0.14em] text-ccjv-ink uppercase transition-colors hover:border-ccjv-green hover:text-ccjv-green"
              >
                Nous écrire
              </a>
            </Reveal>
          </div>

          {/* Grille des groupes de maison */}
          <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-2 items-stretch">
            {houseGroups.map((group, index) => {
              const whatsappUrl = `https://wa.me/243123456789?text=${encodeURIComponent(
                `Bonjour CCJV, je souhaite des informations pour rejoindre le ${group.name} (${group.quarter}).`,
              )}`;

              return (
                <Reveal key={group.id} delay={index * 120} className="h-full">
                  <div className="flex h-full flex-col justify-between border border-ccjv-line bg-ccjv-offwhite p-6 sm:p-8 transition-colors hover:border-ccjv-green/40">
                    <div>
                      {group.image && (
                        <div className="relative mb-6 aspect-[16/10] w-full overflow-hidden bg-ccjv-line">
                          <Image
                            src={group.image}
                            alt={group.name}
                            fill
                            sizes="(max-width: 768px) 100vw, 50vw"
                            className="object-cover"
                          />
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-sans text-xs font-semibold tracking-widest text-ccjv-green uppercase">
                          {group.quarter}
                        </span>
                        <span className="font-sans text-xs text-ccjv-ink-secondary">
                          {group.schedule}
                        </span>
                      </div>

                      <h3 className="mt-3 font-serif text-2xl font-normal text-ccjv-ink">
                        {group.name}
                      </h3>

                      <p className="mt-4 font-sans text-sm leading-relaxed text-ccjv-ink-secondary">
                        {group.description}
                      </p>

                      <div className="mt-6 border-t border-ccjv-line pt-4">
                        <p className="font-sans text-xs text-ccjv-ink-secondary">
                          <strong className="font-medium text-ccjv-ink">Lieu :</strong>{" "}
                          {group.host}
                        </p>
                      </div>
                    </div>

                    <div className="mt-8 pt-4">
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex w-full items-center justify-center border border-ccjv-ink/20 bg-white py-3.5 font-sans text-xs font-semibold tracking-[0.14em] text-ccjv-ink uppercase transition-colors hover:border-ccjv-green hover:bg-ccjv-green hover:text-white"
                      >
                        Rejoindre
                      </a>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          06 — ET SI JE SUIS NOUVEAU ? (RÉASSURANCE & ACCUEIL)
          ========================================================================= */}
      <section className="relative border-b border-ccjv-line py-20 lg:py-32">
        <div className="container">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
            <Reveal className="lg:col-span-6">
              <h2 className="text-[clamp(1.9rem,1.2rem+2.3vw,3.3rem)] leading-[1.14]">
                Vous ne connaissez <br />
                <span className="text-ccjv-green">encore personne ?</span>
              </h2>

              <p className="mt-6 font-serif text-lg text-ccjv-ink">
                C&apos;est précisément pour cela que ces groupes existent: pour permettre à chacun de venir tel qu'il est, sans prérequis biblique ni engagement. Si vous hésitez à faire le premier pas seul, un membre de la communauté peut vous accueillir et vous accompagner lors de votre première visite.
              </p>

              <div className="mt-8">
                <a
                  href={site.whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 items-center justify-center border border-ccjv-green bg-ccjv-green px-8 font-sans text-xs font-semibold tracking-[0.16em] text-white uppercase transition-colors hover:bg-ccjv-green-dark"
                >
                  Demander un guide
                </a>
              </div>
            </Reveal>

            <Reveal delay={140} className="lg:col-span-6">
              <div className="relative aspect-[4/3] w-full overflow-hidden border border-ccjv-line bg-ccjv-line">
                <Image
                  src={images.portraitA}
                  alt="Accueil chaleureux au CCJV"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
              <p className="mt-3 font-sans text-xs text-ccjv-ink-secondary">
                Un visage ami vous attend dès votre première visite.
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
              Une place peut être <br />
              <span className="italic text-ccjv-cream">la vôtre.</span>
            </h2>

            <p className="mt-6 font-sans text-base leading-relaxed text-white/80 md:text-lg">
              Ne restez pas seul avec votre foi. Rejoignez un petit groupe dans votre
              quartier et faites l&apos;expérience d&apos;une église proche et vivante.
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-4 sm:gap-6">
              <a
                href="#trouvez-votre-groupe"
                className="inline-flex h-12 items-center justify-center border border-ccjv-green bg-ccjv-green px-8 font-sans text-xs font-semibold tracking-[0.16em] text-white uppercase transition-colors hover:bg-ccjv-green-dark"
              >
                Choisir un quartier
              </a>
              <a
                href={site.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center justify-center border border-white/30 bg-white/10 px-8 font-sans text-xs font-semibold tracking-[0.16em] text-white uppercase backdrop-blur-sm transition-colors hover:border-white hover:bg-white/20"
              >
                Écrire à l&apos;accueil CCJV
              </a>
            </div>
          </Reveal>

          {/* Liens croisés vers les autres pages */}
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
