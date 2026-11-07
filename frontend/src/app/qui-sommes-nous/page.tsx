import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CrossMark } from "@/components/shared/CrossMark";
import { Reveal } from "@/components/shared/Reveal";
import { VerseSection } from "@/components/shared/VerseSection";
import { WeeklyTriptychScrolly } from "@/components/shared/WeeklyTriptychScrolly";
import { ContentUnavailable } from "@/components/ui/ContentUnavailable";
import { EmptyState } from "@/components/ui/EmptyState";
import { getCommunityFaces, getScriptures } from "@/lib/api";
import { readOrUnavailable } from "@/lib/api/endpoints";
import { images } from "@/data/images";
import { site } from "@/data/site";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Qui sommes-nous — Centre Chrétien Jésus ma Vie",
  description:
    "Découvrez l'histoire de notre église à Lubumbashi, la vision qui l'a fait naître, les convictions bibliques qui la fondent et la communauté vivante qui s'y rassemble.",
  path: "/qui-sommes-nous",
});

/**
 * 🏛️ Page Narrative Majeure : QUI SOMMES-NOUS (Notre Histoire & Notre Foi)
 * Récit fluide et épuré : tous les surtitres/numérotations ont été retirés
 * pour une immersion pure dans l'histoire, la foi et la vie de la communauté.
 *
 * Les deux respirations bibliques et les visages de la communauté viennent de
 * l'API (`/scriptures`, `/community-faces`) : aucun texte de démonstration ne
 * s'y substitue. Un verset non configuré est simplement absent de la page — il
 * n'y a rien à dire —, alors qu'une API injoignable est signalée comme telle.
 */
export default async function QuiSommesNousPage() {
  /*
   * Une seule lecture pour les deux respirations : elles puisent dans le même
   * recueil de versets, et une panne les rend donc indisponibles ensemble.
   */
  const [scripturesRead, facesRead] = await Promise.all([
    readOrUnavailable((options) => getScriptures(options)),
    readOrUnavailable((options) => getCommunityFaces(options)),
  ]);

  const scriptures = scripturesRead.status === "ok" ? scripturesRead.data : [];
  const scripture = (key: string) =>
    scriptures.find((entry) => entry.key === key);
  const parole = scripture("parole");
  const ouvrage = scripture("ouvrage");

  const communityFaces = facesRead.status === "ok" ? facesRead.data : [];

  return (
    <div className="relative w-full bg-ccjv-offwhite text-ccjv-ink selection:bg-ccjv-green selection:text-white">
      {/* =========================================================================
          HERO : « Une histoire qui commence »
          ========================================================================= */}
      <section className="relative flex min-h-screen min-h-[100svh] flex-col justify-end overflow-hidden bg-ccjv-black text-white">
        {/* Image de fond en filigrane sombre */}
        <div className="absolute inset-0 z-0 opacity-25">
          <Image
            src={images.hero}
            alt="Assemblée du Centre Chrétien Jésus ma Vie"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>

        <div className="relative z-10 container pt-32 pb-20 lg:pb-28">
          <Reveal>
            <h1 className="font-serif text-[clamp(2.5rem,1.5rem+4.5vw,5.5rem)] font-normal leading-[1.05] tracking-[-0.02em] text-white">
              Notre histoire <br />
              <span className="italic text-ccjv-cream">&</span> notre foi.
            </h1>

            <p className="mt-8 max-w-[46ch] font-serif text-[clamp(1.15rem,0.95rem+0.8vw,1.6rem)] font-light leading-relaxed text-white/85">
              « Une histoire née d&apos;une vision, portée par la foi et vécue
              ensemble à Lubumbashi. »
            </p>
          </Reveal>
        </div>
      </section>

      {/* =========================================================================
          LA VISION : « Avant la date, il y avait une vision »
          ========================================================================= */}
      <section className="relative py-20 lg:py-32">
        <div className="container">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
            <Reveal className="lg:col-span-5">
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-ccjv-line">
                <Image
                  src={images.pastor}
                  alt="Pasteur Manasse Mwamba, visionnaire CCJV"
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover"
                />
              </div>
              <p className="mt-3 font-sans text-xs text-ccjv-ink-secondary">
                {site.visionary} · {site.visionaryRole}
              </p>
            </Reveal>

            <Reveal delay={120} className="lg:col-span-7">
              <h2 className="text-[clamp(2rem,1.2rem+2.2vw,3.4rem)] leading-[1.12]">
                Avant la date, <br />
                <span className="text-ccjv-green">il y avait une vision.</span>
              </h2>

              <blockquote className="mt-8 font-serif text-[clamp(1.2rem,0.9rem+0.8vw,1.6rem)] leading-snug italic text-ccjv-ink">
                « Fonder une église ne commence pas par un bâtiment. Cela commence
                par une soif d&apos;obéir à Dieu, et de bâtir un foyer où chacun
                peut Le rencontrer en vérité. »
              </blockquote>

              <p className="mt-6 font-sans text-[1.02rem] leading-[1.75] text-ccjv-ink-secondary">
                Le Centre Chrétien Jésus ma Vie est né dans le cœur de serviteurs
                convaincus que l&apos;Évangile de Jésus-Christ transforme les vies,
                les familles et notre ville de Lubumbashi. Avant le premier
                rassemblement public, il y a eu la prière, le recueillement et
                l&apos;attente paisible de la direction divine.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* =========================================================================
          NAISSANCE : « Tout a commencé » — 17 MARS 2023
          ========================================================================= */}
      <section className="relative overflow-hidden bg-ccjv-cream/40 py-20 lg:py-32">
        <div className="container">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
            <Reveal className="lg:col-span-6">
              {/* Date monumentale */}
              <div className="border-b border-ccjv-ink/15 pb-6">
                <p className="font-serif text-[clamp(2.75rem,1.5rem+3.5vw,5rem)] font-bold leading-none tracking-tight text-ccjv-ink">
                  17 Mars 2023
                </p>
              </div>

              <h3 className="mt-6 font-serif text-2xl leading-snug">
                Tout a commencé à Lubumbashi.
              </h3>

              <p className="mt-4 font-sans text-[1rem] leading-[1.75] text-ccjv-ink-secondary">
                C&apos;est à cette date que l&apos;église a tenu son tout premier
                rassemblement. Commencer avec peu, sans savoir exactement de quoi
                demain sera fait, en tenant la Parole de Dieu et la communion
                fraternelle comme seuls appuis solides.
              </p>
            </Reveal>

            <Reveal delay={120} className="lg:col-span-6">
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-ccjv-line shadow-sm">
                <Image
                  src={images.assemblee}
                  alt="Premiers rassemblements CCJV à Lubumbashi"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
              <p className="mt-3 font-sans text-xs text-ccjv-ink-secondary">
                Rassemblement de l&apos;assemblée · {site.location}
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* =========================================================================
          RESPIRATION BIBLIQUE I : « La Parole comme boussole »
          ========================================================================= */}
      {scripturesRead.status === "unreachable" ? (
        <div className="container py-16 lg:py-24">
          <ContentUnavailable resource="Les versets de cette page" />
        </div>
      ) : (
        parole && (
          <VerseSection
            variant="center"
            tone="cream"
            text={parole.text}
            reference={parole.reference}
          />
        )
      )}

      {/* =========================================================================
          L'HISTOIRE CONTINUE : Jalons et Naissance de l'Ecodim
          ========================================================================= */}
      <section className="relative py-20 lg:py-32">
        <div className="container">
          <Reveal className="mx-auto max-w-3xl text-center">
            <h2 className="text-[clamp(2rem,1.2rem+2vw,3.2rem)] leading-tight">
              L&apos;histoire en marche.
            </h2>
            <p className="mt-4 text-ccjv-ink-secondary">
              Une église grandit au rythme des vies qui la composent et des
              ministères qui s&apos;y éveillent.
            </p>
          </Reveal>

          <div className="mt-16 grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-14">
            {/* Jalon 1 : Ecodim */}
            <Reveal className="lg:col-span-6">
              <div className="border border-ccjv-line p-8 lg:p-10 bg-white">
                <h3 className="mt-3 font-serif text-2xl font-semibold">
                  Naissance de l&apos;Ecodim
                </h3>
                <p className="mt-4 font-sans text-[0.95rem] leading-[1.7] text-ccjv-ink-secondary">
                  Ministère dédié aux enfants : chants, récits bibliques et
                  découverte de Dieu à leur mesure. Parce que la transmission de la
                  foi commence dès le plus jeune âge.
                </p>
                <div className="mt-6 relative aspect-[16/10] w-full overflow-hidden bg-ccjv-line">
                  <Image
                    src={images.ecodimAncien}
                    alt="Ministère des enfants Ecodim CCJV"
                    fill
                    sizes="(max-width: 1024px) 100vw, 45vw"
                    className="object-cover"
                  />
                </div>
              </div>
            </Reveal>

            {/* Jalon 2 : Vie fraternelle & Pôles */}
            <Reveal delay={120} className="lg:col-span-6">
              <div className="border border-ccjv-line p-8 lg:p-10 bg-white h-full flex flex-col justify-between">
                <div>
                  <h3 className="mt-3 font-serif text-2xl font-semibold">
                    Chorale, Groupes & Ministères
                  </h3>
                  <p className="mt-4 font-sans text-[0.95rem] leading-[1.7] text-ccjv-ink-secondary">
                    Structuration des temps de prière en semaine, veillées de
                    louange et réunions dans les quartiers. L&apos;église devient
                    une famille présente au quotidien.
                  </p>
                  <div className="mt-6 relative aspect-[16/10] w-full overflow-hidden bg-ccjv-line">
                    <Image
                      src={images.groupe}
                      alt="Chorale et louange au Centre Chrétien Jésus ma Vie"
                      fill
                      sizes="(max-width: 1024px) 100vw, 45vw"
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* =========================================================================
          TRANSITION CINÉMATOGRAPHIQUE : « Une communauté prend vie »
          ========================================================================= */}
      <section className="relative h-[65svh] min-h-[24rem] w-full overflow-hidden bg-ccjv-black text-white">
        <Image
          src={images.communaute}
          alt="La communauté du Centre Chrétien Jésus ma Vie"
          fill
          sizes="100vw"
          className="object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        <div className="relative z-10 container flex h-full flex-col justify-end pb-16 lg:pb-20">
          <Reveal>
            <h2 className="max-w-[28ch] font-serif text-[clamp(2rem,1.2rem+3vw,4rem)] font-normal leading-[1.12] text-white">
              Une communauté commence à prendre vie.
            </h2>
          </Reveal>
        </div>
      </section>

      {/* =========================================================================
          CE QUI NOUS DÉFINIT : « Des convictions qui nous portent »
          ========================================================================= */}
      <section className="relative py-20 lg:py-28">
        <div className="container max-w-4xl text-center">
          <Reveal>
            <CrossMark size="md" className="mx-auto text-ccjv-green" />
            <h2 className="mt-8 text-[clamp(2rem,1.2rem+2.2vw,3.4rem)] leading-snug font-serif">
              « Une histoire ne se résume pas à des dates. <br />
              Elle est portée par des convictions. »
            </h2>
            <p className="mt-6 font-sans text-[1.05rem] leading-[1.8] text-ccjv-ink-secondary">
              Ce que nous croyons oriente tout ce que nous faisons : notre façon
              d&apos;enseigner, d&apos;accueillir, de prier et d&apos;aimer notre
              prochain. Notre foi est fermement ancrée dans la Parole de Dieu.
            </p>
          </Reveal>
        </div>
      </section>

      {/* =========================================================================
          LES PILIERS DE NOTRE FOI
          ========================================================================= */}
      <section className="relative bg-ccjv-cream/30 py-20 lg:py-32 border-y border-ccjv-line">
        <div className="container">
          <div className="mb-14 text-center">
            <h2 className="text-[clamp(1.8rem,1rem+2vw,2.8rem)]">
              Les piliers de notre marche
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-10">
            {/* NOTRE FOI */}
            <Reveal className="border border-ccjv-line bg-white p-8 lg:p-10 shadow-xs">
              <div className="flex items-center justify-between border-b border-ccjv-line pb-4">
                <span className="font-serif text-xl font-bold text-ccjv-green uppercase tracking-wider">
                  Foi & Écriture
                </span>
                <CrossMark size="sm" className="text-ccjv-green" />
              </div>
              <h3 className="mt-6 font-serif text-2xl font-semibold">
                Notre Foi
              </h3>
              <p className="mt-4 font-sans text-[0.95rem] leading-[1.7] text-ccjv-ink-secondary">
                Nous confessons l&apos;autorité souveraine des Saintes Écritures,
                la foi en un seul Dieu manifesté en Père, Fils et Saint-Esprit, et
                le salut accordé par grâce par la foi en Jésus-Christ.
              </p>
              <div className="mt-6 font-sans text-xs font-semibold tracking-wider text-ccjv-green uppercase">
                Éphésiens 2:8-9 · 2 Timothée 3:16
              </div>
            </Reveal>

            {/* NOTRE VISION */}
            <Reveal delay={80} className="border border-ccjv-line bg-white p-8 lg:p-10 shadow-xs">
              <div className="flex items-center justify-between border-b border-ccjv-line pb-4">
                <span className="font-serif text-xl font-bold text-ccjv-green uppercase tracking-wider">
                  Vision & Espérance
                </span>
                <span className="font-sans text-xs tracking-widest text-ccjv-ink-secondary uppercase">
                  Regard vers l&apos;avenir
                </span>
              </div>
              <h3 className="mt-6 font-serif text-2xl font-semibold">
                Notre Vision
              </h3>
              <p className="mt-4 font-sans text-[0.95rem] leading-[1.7] text-ccjv-ink-secondary">
                Être une église vivante, chaleureuse et rayonnante à Lubumbashi,
                qui équipe les croyants, guérit les cœurs brisés et prépare une
                génération consacrée au service de Dieu.
              </p>
              <div className="mt-6 font-sans text-xs font-semibold tracking-wider text-ccjv-green uppercase">
                Ésaïe 61:1-3 · Actes 2:42
              </div>
            </Reveal>

            {/* NOS VALEURS */}
            <Reveal delay={120} className="border border-ccjv-line bg-white p-8 lg:p-10 shadow-xs">
              <div className="flex items-center justify-between border-b border-ccjv-line pb-4">
                <span className="font-serif text-xl font-bold text-ccjv-green uppercase tracking-wider">
                  Cœur & Service
                </span>
                <span className="font-sans text-xs tracking-widest text-ccjv-ink-secondary uppercase">
                  Ce qui nous guide
                </span>
              </div>
              <h3 className="mt-6 font-serif text-2xl font-semibold">
                Nos Valeurs
              </h3>
              <p className="mt-4 font-sans text-[0.95rem] leading-[1.7] text-ccjv-ink-secondary">
                L&apos;amour fraternel sincère, l&apos;intégrité de cœur,
                l&apos;humilité dans le service, la prière continuelle et
                l&apos;accueil inconditionnel de toute personne qui pousse nos
                portes.
              </p>
              <div className="mt-6 font-sans text-xs font-semibold tracking-wider text-ccjv-green uppercase">
                Colossiens 3:12-14 · Jean 13:35
              </div>
            </Reveal>

            {/* NOTRE MISSION */}
            <Reveal delay={160} className="border border-ccjv-line bg-white p-8 lg:p-10 shadow-xs">
              <div className="flex items-center justify-between border-b border-ccjv-line pb-4">
                <span className="font-serif text-xl font-bold text-ccjv-green uppercase tracking-wider">
                  Grand Mandat
                </span>
                <span className="font-sans text-xs tracking-widest text-ccjv-ink-secondary uppercase">
                  Le mandat
                </span>
              </div>
              <h3 className="mt-6 font-serif text-2xl font-semibold">
                Notre Mission
              </h3>
              <p className="mt-4 font-sans text-[0.95rem] leading-[1.7] text-ccjv-ink-secondary">
                Annoncer l&apos;Évangile de Jésus-Christ, faire des disciples de
                toutes les nations, enseigner Sa Parole et manifester Sa bonté
                par des œuvres de compassion concrètes.
              </p>
              <div className="mt-6 font-sans text-xs font-semibold tracking-wider text-ccjv-green uppercase">
                Matthieu 28:19-20 · Marc 16:15
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* =========================================================================
          LA FOI PREND FORME : Triptyque Narratif & Scrollytelling
          ========================================================================= */}
      <WeeklyTriptychScrolly />

      {/* =========================================================================
          DEUXIÈME RESPIRATION BIBLIQUE : Monumentale & Immersive
          (même lecture que la première : une panne a déjà été signalée plus haut)
          ========================================================================= */}
      {ouvrage && (
        <VerseSection
          variant="both"
          tone="dark"
          text={ouvrage.text}
          reference={ouvrage.reference}
          leftPhoto={images.identite}
          rightPhoto={images.assemblee}
        />
      )}

      {/* =========================================================================
          CCJV AUJOURD'HUI : Retour au présent
          ========================================================================= */}
      <section className="relative py-20 lg:py-32">
        <div className="container">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
            <Reveal className="lg:col-span-6">
              <div className="relative aspect-[16/11] w-full overflow-hidden bg-ccjv-line shadow-sm">
                <Image
                  src={images.churchVisual}
                  alt="L'assemblée CCJV réunie aujourd'hui"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            </Reveal>

            <Reveal delay={120} className="lg:col-span-6">
              <h2 className="text-[clamp(2rem,1.2rem+2vw,3.2rem)] leading-tight font-serif">
                CCJV aujourd&apos;hui.
              </h2>
              <p className="mt-6 font-sans text-[1rem] leading-[1.75] text-ccjv-ink-secondary">
                Aujourd&apos;hui, le Centre Chrétien Jésus ma Vie continue
                d&apos;accueillir des hommes, des femmes, des jeunes et des
                enfants venus de divers horizons de Lubumbashi. Une église
                unie par l&apos;amour de Christ, où chacun trouve une famille
                spirituelle solide.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* =========================================================================
          GRANDE RESPIRATION FINALE : « L'histoire continue »
          ========================================================================= */}
      <section className="relative py-24 lg:py-36 text-center bg-ccjv-cream">
        <div className="container max-w-2xl">
          <Reveal>
            <CrossMark size="xl" className="mx-auto text-ccjv-green" />
            <h2 className="mt-8 font-serif text-[clamp(2.2rem,1.2rem+3vw,4rem)] font-normal leading-tight">
              L&apos;histoire continue.
            </h2>
            <p className="mt-6 font-serif text-lg italic text-ccjv-ink-secondary">
              Ce qui a été commencé par la grâce de Dieu se poursuit avec chacun de
              ceux qu&apos;Il appelle et conduit parmi nous.
            </p>
          </Reveal>
        </div>
      </section>

      {/* =========================================================================
          L'APPEL CHALEUREUX : Invitation & Prochains Pas
          ========================================================================= */}
      <section className="relative overflow-hidden bg-ccjv-black py-20 text-white lg:py-28">
        <CrossMark
          size="watermark"
          className="left-1/2 top-1/2 h-[380px] w-[240px] -translate-x-1/2 -translate-y-1/2 text-white opacity-[0.03]"
        />

        <div className="relative z-10 container text-center max-w-3xl">
          <Reveal>
            <h2 className="font-serif text-[clamp(2rem,1.2rem+2.6vw,3.6rem)] font-normal leading-tight text-white">
              Et si vous veniez écrire la suite avec nous ?
            </h2>
            <p className="mt-6 font-sans text-[1.05rem] leading-relaxed text-white/80">
              Que vous soyez de passage à Lubumbashi ou en recherche d&apos;une
              maison spirituelle pour grandir dans la foi, vous êtes le bienvenu
              parmi nous.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/communaute#parcours-nouveau"
                className="inline-flex items-center justify-center bg-white px-8 py-4 font-sans text-xs font-semibold tracking-[0.16em] text-ccjv-black uppercase transition-all duration-300 hover:bg-ccjv-cream"
              >
                Planifier une visite
              </Link>
              <Link
                href="/vie-de-leglise/ou-nous-trouver"
                className="inline-flex items-center justify-center border border-white/40 bg-white/5 px-8 py-4 font-sans text-xs font-semibold tracking-[0.16em] text-white uppercase transition-all duration-300 hover:bg-white/15"
              >
                Nous-trouver
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
