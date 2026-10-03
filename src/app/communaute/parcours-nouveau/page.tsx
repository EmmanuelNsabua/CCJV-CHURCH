import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CrossMark } from "@/components/shared/CrossMark";
import { Reveal } from "@/components/shared/Reveal";
import { ParallaxImage } from "@/components/shared/ParallaxImage";
import { images } from "@/data/mock/images";
import { site } from "@/data/mock/site";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Parcours nouveau — Centre Chrétien Jésus ma Vie",
  description:
    "Et si vous commenciez un nouveau chemin ? Découvrez la vie, le cœur et la communauté du Centre Chrétien Jésus ma Vie à Lubumbashi.",
  path: "/communaute/parcours-nouveau",
});

/** Les 5 dimensions vécues de la vie communautaire */
const dimensions = [
  {
    keyword: "CÉLÉBRER",
    title: "Le cœur qui s'élève",
    subtitle: "Vivre la louange et écouter la Parole chaque dimanche",
    description:
      "Le point de ralliement de toute l'assemblée. Chaque dimanche à 09h00, nous nous rassemblons pour chanter, prier, entendre l'Évangile proclamé et nous laisser renouveler par la présence de Dieu.",
    image: images.assemblee || "/media/ccjv-09.jpeg",
    aspect: "aspect-[16/10]",
    accent: "Le culte dominical",
  },
  {
    keyword: "RENCONTRER",
    title: "Des visages et des noms",
    subtitle: "Dépasser l'anonymat dans la fraternité sincère",
    description:
      "L'église n'est pas un bâtiment, c'est une famille. Après la célébration ou autour d'un moment d'échange, nous apprenons à nous connaître, à partager sans artifice et à porter les réalités des uns et des autres.",
    image: images.fraternite || "/media/ccjv-35.jpeg",
    aspect: "aspect-[4/3]",
    accent: "La communion fraternelle",
  },
  {
    keyword: "GRANDIR",
    title: "S'enraciner dans la Parole",
    subtitle: "Une foi qui mûrit au fil des saisons",
    description:
      "Approfondir les Écritures pour nourrir sa vie personnelle, son couple, sa famille et ses décisions quotidiennes. Grandir dans la foi est un chemin patient, jalonné d'enseignements et de prières partagées.",
    image: images.predication || "/media/ccjv-11.jpeg",
    aspect: "aspect-[16/10]",
    accent: "La maturité spirituelle",
  },
  {
    keyword: "PARTICIPER",
    title: "Mettre ses dons au service",
    subtitle: "Chacun a quelque chose d'unique à offrir",
    description:
      "Que ce soit dans un groupe de maison de quartier, à la chorale, au département de l'accueil, à la technique ou auprès des enfants de l'Ecodim, servir permet de s'épanouir et de bâtir l'édifice commun.",
    image: images.service || "/media/ccjv-28.jpeg",
    aspect: "aspect-[4/3]",
    accent: "L'engagement volontaire",
  },
  {
    keyword: "S'ENRACINER",
    title: "Trouver son foyer spirituel",
    subtitle: "Une communauté pour avancer toute la vie",
    description:
      "Trouver sa place stable au sein du CCJV, c'est savoir que dans les moments de célébration comme au cœur des épreuves, une assemblée digne et fidèle se tient à vos côtés à Lubumbashi.",
    image: images.communaute || "/media/ccjv-30.jpeg",
    aspect: "aspect-[16/10]",
    accent: "L'appartenance durable",
  },
];

/** Les portes d'accès pour se projeter */
const projectionPlaces = [
  {
    label: "Dans le culte",
    desc: "Célébrer chaque dimanche matin à 09h00.",
    href: "/vie-de-leglise/ou-nous-trouver",
  },
  {
    label: "Dans la prière",
    desc: "Déposer une intention ou intercéder le mercredi.",
    href: "/communaute/priere-et-intercession",
  },
  {
    label: "Dans un groupe",
    desc: "Vivre la proximité dans votre quartier.",
    href: "/communaute/groupes-de-maison",
  },
  {
    label: "Dans le service",
    desc: "Participer activement dans un département.",
    href: "/organisation/departements",
  },
  {
    label: "Dans la famille",
    desc: "L'Ecodim pour l'éveil joyeux des enfants.",
    href: "/vie-de-leglise/ou-nous-trouver",
  },
];

export default function ParcoursNouveauPage() {
  return (
    <div className="relative w-full overflow-hidden bg-ccjv-offwhite text-ccjv-ink selection:bg-ccjv-green selection:text-white">
      {/* =========================================================================
          01 — HERO CINÉMATOGRAPHIQUE (PLEIN ÉCRAN MIN-H-SCREEN)
          ========================================================================= */}
      <section className="relative flex min-h-screen min-h-[100svh] flex-col justify-end overflow-hidden bg-ccjv-black text-white">
        {/* Photographie immersive en arrière-plan */}
        <div className="absolute inset-0 z-0 opacity-35">
          <Image
            src={images.hero}
            alt="La communauté du Centre Chrétien Jésus ma Vie réunie"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>

        {/* Dégradé atmosphérique pour une lisibilité parfaite */}
        <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-ccjv-black via-ccjv-black/60 to-transparent" />

        <div className="container relative z-20 pt-36 pb-20 lg:pb-28">
          <div className="max-w-4xl">
            <Reveal>
              <h1 className="font-serif text-[clamp(2.8rem,2rem+4.8vw,6.2rem)] font-normal leading-[1.02] tracking-[-0.025em] text-white">
                Et si vous commenciez <br />
                <span className="italic text-ccjv-cream">un nouveau chemin ?</span>
              </h1>

              <div className="mt-12 flex flex-wrap items-center gap-5">
                <a
                  href="#decouverte"
                  className="inline-flex h-13 items-center justify-center border border-ccjv-green bg-ccjv-green px-8 font-sans text-xs font-semibold tracking-[0.18em] text-white uppercase transition-all duration-300 hover:bg-ccjv-green-dark hover:shadow-lg"
                >
                  En savoir plus
                </a>
                <Link
                  href="/vie-de-leglise/ou-nous-trouver"
                  className="inline-flex h-13 items-center justify-center border border-white/30 bg-white/10 px-8 font-sans text-xs font-semibold tracking-[0.16em] text-white uppercase backdrop-blur-md transition-all duration-300 hover:border-white hover:bg-white/20"
                >
                  Planifier ma visite
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* =========================================================================
          02 — IMMERSION DANS LA COMMUNAUTÉ (VOIR AVANT D'EXPLIQUER)
          ========================================================================= */}
      <section
        id="decouverte"
        className="relative scroll-mt-20 border-b border-ccjv-line bg-white py-24 lg:py-36"
      >
        <div className="container relative z-10">
          <div className="max-w-3xl">
            <Reveal>
              <h2 className="text-[clamp(2rem,1.3rem+2.6vw,3.6rem)] leading-[1.12]">
                La vie chrétienne <br />
                <span className="text-ccjv-green">ne s&apos;explique pas : elle se vit.</span>
              </h2>
              <p className="mt-6 font-sans text-base md:text-lg leading-relaxed text-ccjv-ink-secondary">
                Avant les programmes et les structures, il y a des rassemblements
                authentiques, des chants portés par la foi, des enfants qui
                grandissent et des mains tendues pour s&apos;épauler.
              </p>
            </Reveal>
          </div>

          {/* Mosaïque éditoriale asymétrique sans zoom au survol */}
          <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-12 md:gap-8 items-center">
            <Reveal className="md:col-span-7">
              <div className="relative aspect-[16/11] w-full overflow-hidden border border-ccjv-line bg-ccjv-line shadow-sm">
                <Image
                  src={images.louange || "/media/ccjv-08.jpeg"}
                  alt="La louange au Centre Chrétien Jésus ma Vie"
                  fill
                  sizes="(max-width: 768px) 100vw, 60vw"
                  className="object-cover"
                />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="font-sans text-xs text-ccjv-ink-secondary">
                  Adoration & louange vivante
                </span>
              </div>
            </Reveal>

            <Reveal delay={120} className="md:col-span-5 space-y-8">
              <div>
                <div className="relative aspect-[4/3] w-full overflow-hidden border border-ccjv-line bg-ccjv-line shadow-sm">
                  <Image
                    src={images.ecodim || "/media/ccjv-13.jpeg"}
                    alt="Les enfants à l'Ecodim CCJV"
                    fill
                    sizes="(max-width: 768px) 100vw, 40vw"
                    className="object-cover"
                  />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-sans text-xs text-ccjv-ink-secondary">
                    L&apos;éveil des enfants
                  </span>
                </div>
              </div>

              <div>
                <div className="relative aspect-[4/3] w-full overflow-hidden border border-ccjv-line bg-ccjv-line shadow-sm">
                  <Image
                    src={images.identite || "/media/ccjv-27.jpeg"}
                    alt="Communion fraternelle et partage"
                    fill
                    sizes="(max-width: 768px) 100vw, 40vw"
                    className="object-cover"
                  />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-sans text-xs text-ccjv-ink-secondary">
                    La foi vécue au quotidien
                  </span>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* =========================================================================
          03 — LE PARCOURS : LES DIMENSIONS DE LA VIE COMMUNAUTAIRE
          ========================================================================= */}
      <section className="relative border-b border-ccjv-line py-24 lg:py-36">
        <div className="container relative z-10">
          <Reveal className="max-w-3xl">
            <h2 className="text-[clamp(2rem,1.3rem+2.6vw,3.6rem)] leading-[1.12]">
              Cinq dimensions <br />
              <span className="text-ccjv-green">pour cheminer ensemble.</span>
            </h2>
          </Reveal>

          {/* Séquences narratives */}
          <div className="mt-20 space-y-24 lg:space-y-32">
            {dimensions.map((dim, idx) => {
              const isAlternate = idx % 2 === 1;

              return (
                <div
                  key={dim.keyword}
                  className="relative grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16 items-center"
                >
                  {/* Colonne Contenu */}
                  <Reveal
                    className={`lg:col-span-6 ${
                      isAlternate ? "lg:order-2" : "lg:order-1"
                    }`}
                  >
                    <h3 className="mt-3 font-serif text-[clamp(1.8rem,1.2rem+1.8vw,2.8rem)] font-normal leading-[1.14] text-ccjv-ink">
                      {dim.title}
                    </h3>

                    <p className="mt-2 font-serif text-base md:text-lg text-ccjv-ink/80">
                      {dim.subtitle}
                    </p>

                    <p className="mt-5 font-sans text-[1rem] leading-[1.8] text-ccjv-ink-secondary">
                      {dim.description}
                    </p>
                  </Reveal>

                  {/* Colonne Photographie avec Parallax */}
                  <Reveal
                    delay={120}
                    className={`lg:col-span-6 ${
                      isAlternate ? "lg:order-1" : "lg:order-2"
                    }`}
                  >
                    <ParallaxImage
                      src={dim.image}
                      alt={dim.title}
                      speed={0.08}
                      className={`${dim.aspect} w-full shadow-md`}
                    />
                  </Reveal>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          04 — RUPTURE SPIRITUELLE (LE CENTRE DU CHEMIN : CHRIST)
          ========================================================================= */}
      <section className="relative overflow-hidden bg-[#132A13] py-24 text-white lg:py-36">
        {/* Motif croix sacrée en filigrane large */}
        <div className="pointer-events-none absolute right-1/2 top-1/2 -translate-y-1/2 translate-x-1/2 text-white/5">
          <CrossMark size="watermark" />
        </div>

        <div className="container relative z-10 text-center">
          <Reveal className="mx-auto max-w-3xl">
            <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center border-2 border-ccjv-cream/40 bg-white/5 text-ccjv-cream shadow-inner">
              <CrossMark size="lg" />
            </div>

            <p className="font-sans text-xs font-semibold tracking-[0.24em] text-ccjv-cream uppercase">
              Le Centre de notre foi
            </p>

            <blockquote className="mt-6 font-serif text-[clamp(1.6rem,1.2rem+2.2vw,3rem)] font-normal leading-[1.3] tracking-[-0.01em] text-white">
              « Je suis le chemin, la vérité, et la vie. Nul ne vient au Père
              que par moi. »
            </blockquote>

            <figcaption className="mt-6 font-sans text-sm font-medium tracking-widest text-ccjv-cream/90 uppercase">
              — Jean 14:6
            </figcaption>

            <p className="mt-8 font-serif text-lg md:text-xl italic text-white/80">
              Notre parcours trouve tout son sens en Jésus-Christ.
            </p>
          </Reveal>
        </div>
      </section>

      {/* =========================================================================
          05 — SE PROJETER DANS LA COMMUNAUTÉ : « IL Y A UNE PLACE POUR VOUS »
          ========================================================================= */}
      <section className="relative border-b border-ccjv-line bg-white py-24 lg:py-36">
        <div className="container relative z-10">
          <Reveal className="max-w-3xl">
            <h2 className="text-[clamp(2rem,1.3rem+2.6vw,3.6rem)] leading-[1.12]">
              Il y a une place pour vous.
            </h2>
            <p className="mt-5 font-sans text-base md:text-lg leading-relaxed text-ccjv-ink-secondary">
              Peu importe d&apos;où vous venez, votre parcours ou votre histoire,
              la communauté s&apos;ouvre à vous à travers différents espaces.
            </p>
          </Reveal>

          {/* Grille des lieux d'intégration */}
          <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
            {projectionPlaces.map((place, idx) => (
              <Reveal key={place.label} delay={idx * 80} className="h-full">
                <Link
                  href={place.href}
                  className="group flex h-full flex-col justify-between border border-ccjv-line bg-ccjv-offwhite p-7 transition-all duration-300 hover:border-ccjv-green hover:bg-white hover:shadow-md"
                >
                  <div>
                    <span className="font-serif text-2xl font-light text-ccjv-green">
                      0{idx + 1}
                    </span>
                    <h3 className="mt-4 font-serif text-2xl font-normal text-ccjv-ink group-hover:text-ccjv-green transition-colors">
                      {place.label}
                    </h3>
                    <p className="mt-3 font-sans text-sm leading-relaxed text-ccjv-ink-secondary">
                      {place.desc}
                    </p>
                  </div>

                  <div className="mt-8 pt-4 border-t border-ccjv-line/60 flex items-center gap-2 font-sans text-xs font-semibold tracking-wider text-ccjv-ink uppercase group-hover:text-ccjv-green transition-colors">
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
      </section>

      {/* =========================================================================
          06 — INVITATION FINALE (L'APPEL SUBTIL ET ÉMOTIONNEL)
          ========================================================================= */}
      <section className="relative bg-ccjv-black py-24 text-white lg:py-36">
        {/* Voile photographique et lumière */}
        <div className="absolute inset-0 z-0 opacity-20">
          <Image
            src={images.exterieur || "/media/ccjv-21.jpeg"}
            alt="Le Centre Chrétien Jésus ma Vie à Lubumbashi"
            fill
            sizes="100vw"
            className="object-cover"
          />
        </div>

        <div className="container relative z-20">
          <Reveal className="mx-auto max-w-3xl text-center">
            <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center border border-white/20 bg-white/5 text-ccjv-cream">
              <CrossMark size="sm" />
            </div>

            <h2 className="font-serif text-[clamp(2.2rem,1.4rem+3vw,4.2rem)] font-normal leading-[1.08] text-white">
              Votre parcours <br />
              <span className="italic text-ccjv-cream">peut commencer ici.</span>
            </h2>

            <p className="mt-6 font-sans text-base md:text-lg leading-relaxed text-white/80">
              Venez simplement découvrir, rencontrer et vivre un moment avec nous
              ce dimanche à 09h00 au quartier Hewa Bora à Lubumbashi.
            </p>

            <div className="mt-12 flex flex-wrap justify-center gap-5">
              <Link
                href="/vie-de-leglise/ou-nous-trouver"
                className="inline-flex h-13 items-center justify-center border border-ccjv-green bg-ccjv-green px-8 font-sans text-xs font-semibold tracking-[0.18em] text-white uppercase transition-all duration-300 hover:bg-ccjv-green-dark hover:shadow-lg"
              >
                Planifier ma visite
              </Link>
              <a
                href={site.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-13 items-center justify-center border border-white/20 bg-transparent px-6 font-sans text-xs font-semibold tracking-[0.14em] text-ccjv-cream uppercase transition-all duration-300 hover:border-ccjv-cream"
              >
                Nous écrire
              </a>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
