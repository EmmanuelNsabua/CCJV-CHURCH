import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/data/mock/site";
import { houseGroups } from "@/data/mock/community";
import { testimonies } from "@/data/mock/testimonies";
import { images } from "@/data/mock/images";
import { Button } from "@/components/ui/Button";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { CrossMark } from "@/components/shared/CrossMark";
import { VerseSection } from "@/components/shared/VerseSection";
import { PhotoDuo } from "@/components/editorial/PhotoDuo";

export const metadata: Metadata = pageMetadata({
  title: "Notre Communauté — Centre Chrétien Jésus ma Vie",
  description:
    "Découvrez la vie communautaire au Centre Chrétien Jésus ma Vie à Lubumbashi : fraternité sincère, groupes de maison de quartier, prière partagée et témoignages vivants.",
  path: "/communaute",
});

/**
 * Expérience éditoriale unique de la vie communautaire CCJV :
 * - Raconte comment la foi est vécue au quotidien entre frères et sœurs
 * - Moins de texte, plus de présence humaine et photographique
 * - Aucun funnel administratif ni numérotation décorative
 * - Regroupe la fraternité, les groupes de maison, la prière, le parcours nouveau et les témoignages
 */
export default function CommunautePage() {
  return (
    <main className="bg-ccjv-offwhite text-ccjv-ink selection:bg-ccjv-green selection:text-white">
      {/* =========================================================================
          01. HERO IMMERSIF : « UNE FOI QUE NOUS VIVONS ENSEMBLE »
          ========================================================================= */}
      <section
        data-hero-dark
        className="relative flex min-h-[80vh] w-full flex-col justify-end overflow-hidden bg-ccjv-black px-6 pt-32 pb-16 text-white sm:px-12 lg:px-20 lg:pt-36 lg:pb-24"
        aria-label="Notre communauté au Centre Chrétien Jésus ma Vie"
      >
        {/* Voile photographique texturé */}
        <div className="absolute inset-0 z-0">
          <Image
            src={images.communaute || "/media/ccjv-35.jpeg"}
            alt="Communion fraternelle à CCJV Lubumbashi"
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ccjv-black via-ccjv-black/80 to-ccjv-black/45" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-7xl">
          <Breadcrumbs tone="dark" />

          <p className="mt-4 font-sans text-xs font-semibold tracking-[0.18em] text-ccjv-cream uppercase">
            Notre communauté
          </p>

          <h1 className="mt-3 max-w-[20ch] font-serif text-[clamp(2.4rem,1.8rem+3.4vw,4.6rem)] leading-[1.05] text-white">
            Une foi que nous vivons ensemble.
          </h1>

          <p className="mt-6 max-w-[48ch] font-sans text-[clamp(1.05rem,0.95rem+0.4vw,1.25rem)] leading-[1.7] text-white/80">
            Au-delà du rassemblement dominical, l&apos;église est une famille unie par la prière,
            l&apos;entraide et la fidélité de Dieu au cœur de notre ville de Lubumbashi.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button variant="primary" href="#fraternite">
              Découvrir notre vie ensemble ↓
            </Button>
            <Button
              variant="outline"
              href={site.whatsappHref}
              external
              className="border-white/35 text-white hover:bg-white/10"
            >
              Nous écrire
            </Button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          02. APPARTENIR & FRATERNITÉ : L'ÉGLISE COMME FAMILLE
          ========================================================================= */}
      <section
        id="fraternite"
        className="border-b border-ccjv-line bg-ccjv-offwhite px-6 py-20 sm:px-12 lg:px-20 lg:py-28"
        aria-labelledby="fraternite-titre"
      >
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
            {/* Photographie authentique d'accueil et d'échange */}
            <div className="lg:col-span-6">
              <div className="relative aspect-[4/3] w-full overflow-hidden border border-ccjv-line bg-ccjv-line">
                <Image
                  src="/media/ccjv-35.jpeg"
                  alt="Moments fraternels et échanges chaleureux à CCJV"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            </div>

            {/* Message narratif fort & sobre */}
            <div className="lg:col-span-6">
              <span className="font-sans text-xs font-semibold tracking-[0.16em] text-ccjv-green uppercase">
                Appartenir
              </span>

              <h2
                id="fraternite-titre"
                className="mt-3 font-serif text-[clamp(1.9rem,1.3rem+2vw,3rem)] leading-[1.14] text-ccjv-ink"
              >
                Une église où personne ne reste anonyme.
              </h2>

              <p className="mt-6 font-sans text-[1.05rem] leading-[1.75] text-ccjv-ink-secondary max-w-[48ch]">
                Nous croyons que la foi grandit au contact des autres : être accueilli par son prénom,
                partager un repas après le culte, écouter le cheminement d&apos;un frère ou d&apos;une sœur.
                Ici, chacun trouve un espace pour être lui-même.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Button variant="outline" href="#groupes-de-maison">
                  Les groupes de maison →
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          03. GROUPES DE MAISON : LA PROXIMITÉ DANS LES QUARTIERS
          ========================================================================= */}
      <section
        id="groupes-de-maison"
        className="border-b border-ccjv-line bg-ccjv-cream px-6 py-20 sm:px-12 lg:px-20 lg:py-28"
        aria-labelledby="groupes-titre"
      >
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <span className="font-sans text-xs font-semibold tracking-[0.16em] text-ccjv-green uppercase">
              La proximité en semaine
            </span>
            <h2
              id="groupes-titre"
              className="mt-3 font-serif text-[clamp(1.9rem,1.3rem+2vw,3rem)] leading-[1.12] text-ccjv-ink"
            >
              La communauté au cœur des quartiers.
            </h2>
            <p className="mt-4 font-sans text-[1.05rem] leading-[1.7] text-ccjv-ink-secondary">
              Chaque semaine, nos cellules de maison se réunissent pour prier, méditer la Parole
              et veiller les uns sur les autres en toute simplicité.
            </p>
          </div>

          {/* Grille éditoriale des cellules de maison */}
          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {houseGroups.map((group) => (
              <div
                key={group.id}
                className="flex flex-col justify-between border border-ccjv-line bg-white p-6 sm:p-7 transition-colors hover:border-ccjv-green/40"
              >
                <div>
                  <span className="font-sans text-[0.72rem] font-semibold tracking-[0.14em] text-ccjv-green uppercase">
                    {group.quarter}
                  </span>

                  <h3 className="mt-2 font-serif text-xl text-ccjv-ink">
                    {group.name}
                  </h3>

                  <p className="mt-3 font-sans text-xs font-medium text-ccjv-ink-secondary">
                    {group.schedule}
                  </p>

                  <p className="mt-4 font-sans text-sm leading-[1.65] text-ccjv-ink-secondary">
                    {group.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-ccjv-line">
                  <span className="font-sans text-xs text-ccjv-ink-secondary">
                    {group.host}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Button variant="primary" href={site.whatsappHref} external>
              Rejoindre un groupe de maison près de chez vous
            </Button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          04. PREMIÈRE RESPIRATION BIBLIQUE : LA COMMUNION FRATERNELLE
          ========================================================================= */}
      <VerseSection
        text="Voici, oh ! qu'il est agréable, qu'il est doux pour des frères de demeurer ensemble !"
        reference="Psaume 133:1"
        variant="centered"
        tone="cream"
      />

      {/* =========================================================================
          05. LA PRIÈRE & L'INTERCESSION : PORTER LES FARDEAUX ENSEMBLE
          ========================================================================= */}
      <section
        id="priere"
        className="border-b border-ccjv-line bg-ccjv-offwhite px-6 py-20 sm:px-12 lg:px-20 lg:py-28"
        aria-labelledby="priere-titre"
      >
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
            {/* Texte à gauche */}
            <div className="lg:col-span-6 lg:order-1">
              <span className="font-sans text-xs font-semibold tracking-[0.16em] text-ccjv-green uppercase">
                Prière & Intercession
              </span>

              <h2
                id="priere-titre"
                className="mt-3 font-serif text-[clamp(1.9rem,1.3rem+2vw,3rem)] leading-[1.14] text-ccjv-ink"
              >
                Prier les uns pour les autres, sans relâche.
              </h2>

              <p className="mt-6 font-sans text-[1.05rem] leading-[1.75] text-ccjv-ink-secondary max-w-[48ch]">
                La prière est le souffle qui porte notre assemblée. Chaque intention déposée
                est confiée aux sentinelles et à l&apos;église pour soutenir les familles,
                les malades et tous ceux qui traversent une saison d&apos;épreuve.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Button variant="primary" href={site.whatsappHref} external>
                  Déposer une intention de prière
                </Button>
              </div>
            </div>

            {/* Photo à droite */}
            <div className="lg:col-span-6 lg:order-2">
              <div className="relative aspect-[4/3] w-full overflow-hidden border border-ccjv-line bg-ccjv-line">
                <Image
                  src="/media/ccjv-09.jpeg"
                  alt="Moments de prière et d'intercession fraternelle"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          06. PARCOURS NOUVEAU : UNE NOUVELLE ÉTAPE OUVERTE ET HUMAINE
          ========================================================================= */}
      <section
        id="parcours-nouveau"
        className="border-b border-ccjv-line bg-ccjv-cream px-6 py-20 sm:px-12 lg:px-20 lg:py-28"
        aria-labelledby="parcours-titre"
      >
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
            {/* Diptyque photographique accueillant */}
            <div className="lg:col-span-6">
              <PhotoDuo
                left={{ src: "/media/ccjv-38.jpeg", caption: "L'accueil chaleureux dès l'entrée" }}
                right={{ src: "/media/ccjv-01.jpeg", caption: "Des visages pour vous guider" }}
                variant="offset"
              />
            </div>

            {/* Narration humaine : invitation sans procédure */}
            <div className="lg:col-span-6">
              <span className="font-sans text-xs font-semibold tracking-[0.16em] text-ccjv-green uppercase">
                Vous découvrez CCJV ?
              </span>

              <h2
                id="parcours-titre"
                className="mt-3 font-serif text-[clamp(1.9rem,1.3rem+2vw,3rem)] leading-[1.14] text-ccjv-ink"
              >
                Une nouvelle étape de votre vie parmi nous.
              </h2>

              <p className="mt-6 font-sans text-[1.05rem] leading-[1.75] text-ccjv-ink-secondary max-w-[48ch]">
                Que vous franchissiez les portes pour un premier dimanche ou que vous cherchiez un foyer spirituel durable,
                nous prenons le temps de vous connaître, de répondre à vos questions et de vous entourer avec bienveillance.
              </p>

              <blockquote className="mt-8 border-l-2 border-ccjv-green pl-5 font-serif text-[1.1rem] leading-[1.6] italic text-ccjv-ink">
                « Vous n&apos;êtes pas un visiteur de passage, mais un membre attendu de la famille de Dieu. »
              </blockquote>

              <div className="mt-8">
                <Button variant="outline" href="/vie-de-leglise/ou-nous-trouver">
                  Planifier une visite au culte →
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          07. TÉMOIGNAGES : DES VOIX RÉELLES
          ========================================================================= */}
      {testimonies.length > 0 && (
        <section
          id="temoignages"
          className="border-b border-ccjv-line bg-ccjv-offwhite px-6 py-20 sm:px-12 lg:px-20 lg:py-28"
          aria-labelledby="temoignages-titre"
        >
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <span className="font-sans text-xs font-semibold tracking-[0.16em] text-ccjv-green uppercase">
                Témoignages
              </span>
              <h2
                id="temoignages-titre"
                className="mt-3 font-serif text-[clamp(1.9rem,1.3rem+2vw,3rem)] leading-[1.12] text-ccjv-ink"
              >
                Ce que nous vivons ici.
              </h2>
            </div>

            <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
              {testimonies.map((tem) => (
                <div
                  key={tem.id}
                  className="flex flex-col justify-between border border-ccjv-line bg-white p-6 sm:p-7"
                >
                  <div>
                    <div className="relative aspect-square w-16 overflow-hidden bg-ccjv-line">
                      <Image
                        src={tem.photo}
                        alt={tem.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>

                    <blockquote className="mt-5 font-serif text-[1.02rem] leading-[1.65] italic text-ccjv-ink">
                      « {tem.quote} »
                    </blockquote>
                  </div>

                  <div className="mt-6 pt-4 border-t border-ccjv-line">
                    <p className="font-sans text-sm font-semibold text-ccjv-ink">
                      {tem.name}
                    </p>
                    <p className="font-sans text-xs text-ccjv-ink-secondary">
                      {tem.role}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          08. DEUXIÈME RESPIRATION BIBLIQUE : L'AMOUR FRATERNEL
          ========================================================================= */}
      <VerseSection
        text="À ceci tous connaîtront que vous êtes mes disciples, si vous avez de l'amour les uns pour les autres."
        reference="Jean 13:35"
        variant="centered"
        tone="dark"
      />

      {/* =========================================================================
          09. CONCLUSION & INVITATION : TROUVER SA PLACE
          ========================================================================= */}
      <section
        id="rejoindre"
        className="px-6 py-20 sm:px-12 lg:px-20 lg:py-28 text-center"
        aria-labelledby="rejoindre-titre"
      >
        <div className="mx-auto max-w-3xl">
          <CrossMark size="md" className="mx-auto mb-6 text-ccjv-green" />

          <h2
            id="rejoindre-titre"
            className="font-serif text-[clamp(2rem,1.4rem+2.2vw,3.2rem)] leading-[1.14] text-ccjv-ink"
          >
            Et vous, où pourriez-vous trouver votre place ?
          </h2>

          <p className="mt-5 font-sans text-[1.05rem] leading-[1.75] text-ccjv-ink-secondary">
            Que ce soit pour un dimanche, pour une prière ou pour vous engager dans la vie de l&apos;église,
            notre communauté vous ouvre grand ses portes.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button variant="primary" size="lg" href={site.whatsappHref} external>
              Nous écrire
            </Button>
            <Button variant="outline" size="lg" href="/organisation">
              Découvrir les départements de service
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
