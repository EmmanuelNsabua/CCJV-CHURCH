import Image from "next/image";
import Link from "next/link";
import { CrossMark } from "@/components/shared/CrossMark";
import { VerseSection } from "@/components/shared/VerseSection";
import { Reveal } from "@/components/shared/Reveal";
import { upcomingEvents, archivedEvents } from "@/data/mock/events";
import { getDepartmentName, departments } from "@/data/mock/departments";
import { images } from "@/data/mock/images";
import { pageMetadata } from "@/lib/seo";
import { formatLongDate, formatDay, formatMonthShort, formatYear } from "@/lib/utils";

export const metadata = pageMetadata({
  title: "Événements & Vie de l'Église — CCJV",
  description:
    "Découvrez les prochains rassemblements, cultes dominicaux, rencontres des enfants et temps forts du Centre Chrétien Jésus ma Vie à Lubumbashi.",
  path: "/vie-de-leglise/evenements",
});

export default function EvenementsPage() {
  const [leadEvent, ...otherEvents] = upcomingEvents;
  const [firstUpcoming, ...subsequentEvents] = otherEvents;

  // 4 Pôles d'expériences éditoriales
  const experiencePillars = [
    {
      tag: "CÉLÉBRER",
      title: "Louange & Adoration",
      description:
        "Des temps où toute l'assemblée s'unit pour célébrer la fidélité de Dieu d'un seul cœur et d'une seule voix.",
      image: "/media/ccjv-08.jpeg",
      link: "#a-venir",
      linkLabel: "Participer au culte",
    },
    {
      tag: "GRANDIR",
      title: "Étude & Enseignement",
      description:
        "S'enraciner dans la Parole de Dieu, approfondir sa foi et équiper chaque génération pour la vie.",
      image: "/media/ccjv-11.jpeg",
      link: "#cette-semaine",
      linkLabel: "Voir les temps d'étude",
    },
    {
      tag: "SE RETROUVER",
      title: "Communion & Fraternité",
      description:
        "Partager des repas, tisser des liens d'amitié sincères et prier les uns pour les autres au quotidien.",
      image: "/media/ccjv-30.jpeg",
      link: "/communaute/groupes-de-maison",
      linkLabel: "Groupes de maison",
    },
    {
      tag: "SERVIR",
      title: "Ministères & Entraide",
      description:
        "Mettre nos dons et notre temps au service du Royaume, des enfants et des plus vulnérables.",
      image: "/media/ccjv-28.jpeg",
      link: "/organisation/departements",
      linkLabel: "Nos départements",
    },
  ];

  // Rythme récurrent de la semaine
  const weeklyRhythm = [
    {
      day: "MERCREDI",
      time: "18:00",
      title: "Étude biblique & Intercession",
      location: "Temple CCJV",
      type: "Enseignement",
      description: "Méditation collective des Écritures et temps de prière pour la communauté.",
    },
    {
      day: "VENDREDI",
      time: "17:00",
      title: "Répétition de la chorale",
      location: "Temple CCJV",
      type: "Louange & Musique",
      description: "Préparation vocale, instrumentale et consécration dans la prière.",
    },
    {
      day: "DIMANCHE",
      time: "09:00",
      title: "Culte Dominical & Ecodim",
      location: "Grand Temple CCJV",
      type: "Célébration générale",
      description: "Le grand rassemblement de la famille CCJV : louange, prédication et culte des enfants.",
    },
  ];

  return (
    <div className="bg-ccjv-offwhite text-ccjv-ink selection:bg-ccjv-cream selection:text-ccjv-ink">
      {/* =========================================================================
          01 — HERO : COMPOSITION TEXTE + COMPOSITION PHOTOGRAPHIQUE (2 PÔLES)
          ========================================================================= */}
      <section className="relative overflow-hidden bg-ccjv-black pt-28 pb-20 text-white lg:pt-36 lg:pb-28">
        <div className="container relative z-10">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-14 xl:gap-16">
            {/* Colonne gauche : Uniquement le grand titre épuré */}
            <div className="flex flex-col justify-center lg:col-span-6 xl:col-span-5">
              <Reveal>
                <h1 className="font-serif text-[clamp(2.5rem,1.8rem+3.8vw,4.8rem)] font-normal leading-[1.08] tracking-[-0.02em] text-white">
                  Des temps pour se retrouver, <span className="italic text-ccjv-cream">célébrer,</span> apprendre et grandir ensemble.
                </h1>
              </Reveal>
            </div>

            {/* Colonne droite : Composition photographique en chevauchement (sans aucun badge) */}
            <div className="lg:col-span-6 xl:col-span-7">
              <Reveal delay={120}>
                <div className="relative mx-auto w-full max-w-[580px] lg:max-w-none pt-4 pb-8 sm:pb-12">
                  {/* Photo 1 (Grande image principale — Louange) */}
                  <div className="relative z-10 w-[74%] overflow-hidden bg-ccjv-line shadow-2xl">
                    <div className="relative aspect-[4/3] w-full">
                      <Image
                        src="/media/ccjv-08.jpeg"
                        alt="Louange et célébration au CCJV"
                        fill
                        priority
                        sizes="(max-width: 1024px) 70vw, 40vw"
                        className="object-cover"
                      />
                    </div>
                  </div>

                  {/* Photo 2 (Verticale chevauchant en haut à droite) */}
                  <div className="absolute top-0 right-0 z-20 w-[44%] overflow-hidden bg-ccjv-line shadow-2xl border-4 border-ccjv-black">
                    <div className="relative aspect-[3/4] w-full">
                      <Image
                        src="/media/ccjv-09.jpeg"
                        alt="Assemblée en prière"
                        fill
                        priority
                        sizes="(max-width: 1024px) 40vw, 25vw"
                        className="object-cover"
                      />
                    </div>
                  </div>

                  {/* Photo 3 (Large chevauchant en bas à droite) */}
                  <div className="absolute -bottom-4 right-[6%] z-30 w-[56%] overflow-hidden bg-ccjv-line shadow-2xl border-4 border-ccjv-black">
                    <div className="relative aspect-[16/10] w-full">
                      <Image
                        src="/media/ccjv-27.jpeg"
                        alt="Communion fraternelle"
                        fill
                        sizes="(max-width: 1024px) 55vw, 30vw"
                        className="object-cover"
                      />
                    </div>
                  </div>

                  {/* Photo 4 (Enfants Ecodim chevauchant en bas à gauche sur écran moyen+) */}
                  <div className="absolute -bottom-6 -left-2 z-20 hidden sm:block w-[34%] overflow-hidden bg-ccjv-line shadow-2xl border-4 border-ccjv-black">
                    <div className="relative aspect-[4/3] w-full">
                      <Image
                        src="/media/ccjv-13.jpeg"
                        alt="Enfants de l'Ecodim"
                        fill
                        sizes="(max-width: 1024px) 30vw, 18vw"
                        className="object-cover"
                      />
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          02 — PREMIÈRE RESPIRATION BIBLIQUE (Fond clair & contemplatif)
          ========================================================================= */}
      <VerseSection
        variant="center"
        tone="offwhite"
        text="« Car là où deux ou trois sont assemblés en mon nom, je suis au milieu d'eux. »"
        reference="Matthieu 18:20"
      />

      {/* =========================================================================
          03 — SECTION : LE PROCHAIN RENDEZ-VOUS (AFFICHE ÉDITORIALE MAJEURE)
          ========================================================================= */}
      {leadEvent && (
        <section
          id="a-venir"
          className="relative scroll-mt-24 border-y border-ccjv-line bg-white py-16 lg:py-24"
          aria-labelledby="featured-event-title"
        >
          <div className="container">
            <Reveal>
              <h2
                id="featured-event-title"
                className="font-serif text-[clamp(2rem,1.4rem+2.2vw,3.4rem)] font-normal tracking-[-0.02em] leading-tight"
              >
                Le prochain rendez-vous.
              </h2>
            </Reveal>

            {/* Affiche numérique éditoriale */}
            <Reveal delay={80} className="mt-10 lg:mt-14">
              <div className="grid grid-cols-1 overflow-hidden border border-ccjv-line bg-ccjv-offwhite shadow-sm lg:grid-cols-12">
                {/* Colonne visuelle (Grande photo narrative) */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-ccjv-line lg:col-span-7 lg:aspect-auto lg:min-h-[440px]">
                  <Image
                    src={leadEvent.imageUrl || images.assemblee}
                    alt={leadEvent.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent lg:hidden" />

                  {/* Badge département sur l'image */}
                  <div className="absolute top-5 left-5 bg-ccjv-black px-3.5 py-1.5 font-sans text-xs font-semibold tracking-[0.16em] text-ccjv-cream uppercase">
                    {getDepartmentName(leadEvent.departmentId) || "Événement Majeur"}
                  </div>
                </div>

                {/* Colonne textuelle & Date forte */}
                <div className="flex flex-col justify-between p-8 sm:p-10 lg:col-span-5 lg:p-12">
                  <div>
                    {/* Date typographique monumentale */}
                    <div className="flex items-baseline gap-3 border-b border-ccjv-line pb-6">
                      <span className="font-serif text-[clamp(3rem,2rem+2.5vw,4.5rem)] font-bold leading-none text-ccjv-ink">
                        {formatDay(leadEvent.eventDate)}
                      </span>
                      <div className="flex flex-col font-sans">
                        <span className="text-sm font-bold tracking-[0.18em] text-ccjv-green uppercase">
                          {formatMonthShort(leadEvent.eventDate)}
                        </span>
                        <span className="text-xs text-ccjv-ink-secondary">
                          {formatYear(leadEvent.eventDate)}
                        </span>
                      </div>
                    </div>

                    {/* Titre & Description */}
                    <h3 className="mt-6 font-serif text-[clamp(1.6rem,1.2rem+1.2vw,2.3rem)] font-semibold leading-snug">
                      {leadEvent.title}
                    </h3>

                    <p className="mt-4 font-sans text-sm leading-relaxed text-ccjv-ink-secondary">
                      {leadEvent.description || leadEvent.excerpt}
                    </p>

                    {/* Détails pratiques concis (Horaires & Lieu) */}
                    <div className="mt-6 flex flex-col gap-2 font-sans text-xs text-ccjv-ink">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-ccjv-green">Quand :</span>
                        <span>
                          {formatLongDate(leadEvent.eventDate)} à {leadEvent.eventTime}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-ccjv-green">Lieu :</span>
                        <span>{leadEvent.location}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bouton d'action */}
                  <div className="mt-8 pt-6 border-t border-ccjv-line">
                    <Link
                      href={`/vie-de-leglise/evenements/${leadEvent.slug}`}
                      className="inline-flex w-full items-center justify-center bg-ccjv-ink px-6 py-4 font-sans text-xs font-semibold tracking-[0.16em] text-white uppercase transition-colors duration-200 hover:bg-ccjv-green sm:w-auto"
                    >
                      Voir les détails de l&apos;événement →
                    </Link>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* =========================================================================
          04 — SECTION : CE QUI ARRIVE BIENTÔT (STICKY À GAUCHE, SCROLLABLE À DROITE)
          ========================================================================= */}
      {otherEvents.length > 0 && (
        <section
          className="relative py-16 lg:py-24"
          aria-labelledby="upcoming-list-title"
        >
          <div className="container">
            <Reveal>
              <h2
                id="upcoming-list-title"
                className="font-serif text-[clamp(2rem,1.4rem+2.2vw,3.2rem)] font-normal tracking-[-0.02em] leading-tight"
              >
                Ce qui arrive bientôt.
              </h2>
            </Reveal>

            {/* Disposition optimisée : Gauche élargie (66% & sticky) / Espacement réduit (4%) / Droite (30% flux vertical) */}
            <div className="mt-10 flex flex-col items-start gap-8 lg:flex-row lg:justify-between lg:gap-6 xl:gap-8">
              {/* ============================================================
                  COLONNE GAUCHE (66% & STICKY & ÉLARGIE) : Événement le plus proche
                  ============================================================ */}
              {firstUpcoming && (
                <div className="w-full lg:w-[66%] shrink-0 lg:sticky lg:top-28 self-start">
                  <Reveal>
                    <Link
                      href={`/vie-de-leglise/evenements/${firstUpcoming.slug}`}
                      className="group block border border-ccjv-line bg-white p-7 sm:p-9 transition-all duration-300 hover:border-ccjv-green hover:shadow-xl"
                    >
                      {firstUpcoming.imageUrl && (
                        <div className="relative mb-6 aspect-[16/10] w-full overflow-hidden bg-ccjv-line">
                          <Image
                            src={firstUpcoming.imageUrl}
                            alt={firstUpcoming.title}
                            fill
                            sizes="(max-width: 1024px) 100vw, 66vw"
                            className="object-cover"
                          />
                          <div className="absolute top-4 left-4 bg-black/85 px-3 py-1 font-sans text-xs font-semibold tracking-[0.14em] text-white uppercase backdrop-blur-xs">
                            {getDepartmentName(firstUpcoming.departmentId) || "Vie de l'église"}
                          </div>
                        </div>
                      )}

                      <div className="flex items-baseline gap-3">
                        <span className="font-serif text-3xl sm:text-4xl font-bold leading-none text-ccjv-ink group-hover:text-ccjv-green transition-colors">
                          {formatDay(firstUpcoming.eventDate)}
                        </span>
                        <span className="font-sans text-xs font-semibold tracking-[0.16em] text-ccjv-green uppercase">
                          {formatMonthShort(firstUpcoming.eventDate)} {formatYear(firstUpcoming.eventDate)}
                        </span>
                      </div>

                      <h3 className="mt-4 font-serif text-[clamp(1.5rem,1.2rem+1vw,2.1rem)] font-semibold leading-snug text-ccjv-ink group-hover:text-ccjv-green transition-colors">
                        {firstUpcoming.title}
                      </h3>

                      <p className="mt-3 font-sans text-sm leading-relaxed text-ccjv-ink-secondary">
                        {firstUpcoming.excerpt || firstUpcoming.description}
                      </p>

                      <div className="mt-6 flex items-center justify-between border-t border-ccjv-line pt-4 font-sans text-xs text-ccjv-ink-secondary">
                        <span>
                          {firstUpcoming.eventTime} · {firstUpcoming.location}
                        </span>
                        <span className="font-bold text-ccjv-green transition-transform group-hover:translate-x-1">
                          Voir l&apos;événement →
                        </span>
                      </div>
                    </Link>
                  </Reveal>
                </div>
              )}

              {/* ============================================================
                  COLONNE DROITE (30% & SCROLLABLE & FLUX VERTICAL)
                  ============================================================ */}
              {subsequentEvents.length > 0 && (
                <div className="w-full lg:w-[30%] shrink-0 flex flex-col gap-6">
                  {subsequentEvents.map((event, idx) => {
                    const dept = getDepartmentName(event.departmentId);

                    return (
                      <Reveal key={event.id} delay={idx * 50}>
                        <Link
                          href={`/vie-de-leglise/evenements/${event.slug}`}
                          className="group block border border-ccjv-line bg-white p-4 sm:p-5 transition-all duration-300 hover:border-ccjv-green hover:shadow-md"
                        >
                          {/* Flux vertical : Image au sommet */}
                          {event.imageUrl && (
                            <div className="relative mb-4 aspect-[16/10] w-full overflow-hidden bg-ccjv-line">
                              <Image
                                src={event.imageUrl}
                                alt={event.title}
                                fill
                                sizes="(max-width: 1024px) 100vw, 30vw"
                                className="object-cover"
                              />
                              <div className="absolute top-2.5 left-2.5 bg-black/80 px-2.5 py-0.5 font-sans text-[0.62rem] font-semibold tracking-[0.14em] text-white uppercase backdrop-blur-xs">
                                {dept || "Vie de l'église"}
                              </div>
                            </div>
                          )}

                          {/* Date & Titre */}
                          <div className="flex items-baseline gap-2">
                            <span className="font-serif text-2xl font-bold leading-none text-ccjv-ink group-hover:text-ccjv-green transition-colors">
                              {formatDay(event.eventDate)}
                            </span>
                            <span className="font-sans text-[0.72rem] font-semibold tracking-[0.14em] text-ccjv-green uppercase">
                              {formatMonthShort(event.eventDate)} {formatYear(event.eventDate)}
                            </span>
                          </div>

                          <h4 className="mt-2.5 font-serif text-base sm:text-lg font-semibold leading-snug text-ccjv-ink group-hover:text-ccjv-green transition-colors">
                            {event.title}
                          </h4>

                          <p className="mt-1.5 font-sans text-xs leading-relaxed text-ccjv-ink-secondary line-clamp-2">
                            {event.excerpt || event.description}
                          </p>

                          {/* Pied de carte */}
                          <div className="mt-4 flex items-center justify-between border-t border-ccjv-line pt-3 font-sans text-[0.75rem] text-ccjv-ink-secondary">
                            <span>
                              {event.eventTime} · {event.location}
                            </span>
                            <span className="font-bold text-ccjv-green transition-transform group-hover:translate-x-1">
                              Voir →
                            </span>
                          </div>
                        </Link>
                      </Reveal>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          05 — SECTION : DIFFÉRENTES MANIÈRES DE VIVRE CCJV (4 PÔLES D'EXPÉRIENCE)
          ========================================================================= */}
      <section
        className="relative border-t border-ccjv-line bg-ccjv-cream py-16 lg:py-24"
        aria-labelledby="experience-pillars-title"
      >
        <div className="container">
          <Reveal>
            <h2
              id="experience-pillars-title"
              className="font-serif text-[clamp(2rem,1.4rem+2.2vw,3.2rem)] font-normal tracking-[-0.02em] leading-tight"
            >
              Ce que vous pouvez vivre ici.
            </h2>
            <p className="mt-4 max-w-[50ch] font-sans text-sm leading-relaxed text-ccjv-ink-secondary">
              Chaque événement répond à une dimension de notre marche avec Dieu.
              Trouvez l&apos;espace qui correspond à votre étape spirituelle.
            </p>
          </Reveal>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {experiencePillars.map((pillar, index) => (
              <Reveal key={pillar.tag} delay={index * 60}>
                <div className="flex h-full flex-col justify-between border border-ccjv-ink/15 bg-white p-6 shadow-xs">
                  <div>
                    <div className="relative mb-5 aspect-[4/3] w-full overflow-hidden bg-ccjv-line">
                      <Image
                        src={pillar.image}
                        alt={pillar.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 25vw"
                        className="object-cover"
                      />
                    </div>
                    <span className="font-sans text-[0.7rem] font-bold tracking-[0.18em] text-ccjv-green uppercase">
                      {pillar.tag}
                    </span>
                    <h3 className="mt-2 font-serif text-xl font-semibold leading-snug">
                      {pillar.title}
                    </h3>
                    <p className="mt-3 font-sans text-xs leading-relaxed text-ccjv-ink-secondary">
                      {pillar.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-ccjv-line">
                    <a
                      href={pillar.link}
                      className="font-sans text-xs font-bold tracking-[0.14em] text-ccjv-ink uppercase underline underline-offset-4 transition-colors hover:text-ccjv-green"
                    >
                      {pillar.linkLabel} →
                    </a>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          06 — SECTION : CETTE SEMAINE (LE RYTHME ÉVÉNEMENTIEL)
          ========================================================================= */}
      <section
        id="cette-semaine"
        className="relative scroll-mt-24 border-t border-ccjv-line bg-white py-16 lg:py-24"
        aria-labelledby="weekly-rhythm-title"
      >
        <div className="container">
          <Reveal>
            <h2
              id="weekly-rhythm-title"
              className="font-serif text-[clamp(2rem,1.4rem+2.2vw,3.2rem)] font-normal tracking-[-0.02em] leading-tight"
            >
              Le rythme régulier qui nous rassemble.
            </h2>
            <p className="mt-4 max-w-[50ch] font-sans text-sm leading-relaxed text-ccjv-ink-secondary">
              Les rendez-vous hebdomadaires pour prier, écouter la Parole et
              servir ensemble.
            </p>
          </Reveal>

          {/* Timeline / Liste rythmée */}
          <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {weeklyRhythm.map((item, i) => (
              <Reveal key={item.day} delay={i * 80}>
                <div className="flex h-full flex-col justify-between border border-ccjv-line bg-ccjv-offwhite p-8">
                  <div>
                    <div className="flex items-center justify-between border-b border-ccjv-line pb-4">
                      <span className="font-sans text-xs font-bold tracking-[0.2em] text-ccjv-green uppercase">
                        {item.day}
                      </span>
                      <span className="font-serif text-lg font-bold text-ccjv-ink">
                        {item.time}
                      </span>
                    </div>

                    <h3 className="mt-5 font-serif text-xl font-semibold leading-snug">
                      {item.title}
                    </h3>

                    <p className="mt-3 font-sans text-xs leading-relaxed text-ccjv-ink-secondary">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-6 flex items-center justify-between pt-4 border-t border-ccjv-line font-sans text-xs text-ccjv-ink-secondary">
                    <span>📍 {item.location}</span>
                    <span className="text-ccjv-green font-medium">{item.type}</span>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          07 — SECTION PHOTOGRAPHIQUE (« NOUS NOUS RETROUVONS »)
          ========================================================================= */}
      <section className="relative overflow-hidden bg-ccjv-black py-24 text-white lg:py-32">
        {/* Photo panoramique d'assemblée en filigrane sombre */}
        <div className="absolute inset-0 z-0 opacity-20">
          <Image
            src={images.assemblee}
            alt="Communauté CCJV rassemblée"
            fill
            sizes="100vw"
            className="object-cover"
          />
        </div>

        <div className="container relative z-10 mx-auto max-w-4xl text-center">
          <Reveal>
            <CrossMark size="md" className="mx-auto text-ccjv-cream mb-6" />

            <h2 className="font-serif text-[clamp(2rem,1.5rem+3vw,3.8rem)] font-normal leading-[1.12] tracking-[-0.01em] text-white">
              « Nous ne nous réunissons pas seulement pour assister à quelque
              chose. <br />
              <span className="italic text-ccjv-cream">
                Nous nous réunissons pour être ensemble. »
              </span>
            </h2>

            <p className="mt-8 font-sans text-sm md:text-base leading-relaxed text-white/75 max-w-[54ch] mx-auto">
              Chaque dimanche, chaque répétition, chaque temps de prière est une
              occasion de vivre l&apos;amour fraternel et de grandir dans la foi.
            </p>

            <div className="mt-10">
              <Link
                href="/qui-sommes-nous"
                className="inline-flex items-center justify-center border border-ccjv-cream bg-transparent px-8 py-4 font-sans text-xs font-semibold tracking-[0.16em] text-ccjv-cream uppercase transition-all duration-200 hover:bg-ccjv-cream hover:text-black"
              >
                Découvrir notre histoire & notre foi →
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* =========================================================================
          08 — SECTION : PAR DÉPARTEMENT (COMMENT LA VIE S'ORGANISE)
          ========================================================================= */}
      <section
        className="relative py-16 lg:py-24"
        aria-labelledby="departments-events-title"
      >
        <div className="container">
          <Reveal>
            <h2
              id="departments-events-title"
              className="font-serif text-[clamp(2rem,1.4rem+2.2vw,3.2rem)] font-normal tracking-[-0.02em] leading-tight"
            >
              La vie dans nos différents ministères.
            </h2>
            <p className="mt-4 max-w-[50ch] font-sans text-sm leading-relaxed text-ccjv-ink-secondary">
              Des espaces dédiés à chaque tranche d&apos;âge et à chaque forme
              d&apos;engagement au sein de l&apos;église.
            </p>
          </Reveal>

          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            {departments.map((dept, index) => (
              <Reveal key={dept.id} delay={index * 80}>
                <div className="flex h-full flex-col justify-between border border-ccjv-line bg-white p-6 sm:p-8 shadow-xs">
                  <div>
                    <div className="relative mb-6 aspect-[4/3] w-full overflow-hidden bg-ccjv-line">
                      <Image
                        src={dept.bannerImage || "/media/ccjv-27.jpeg"}
                        alt={dept.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover"
                      />
                    </div>

                    <h3 className="font-serif text-2xl font-semibold leading-snug">
                      {dept.name}
                    </h3>

                    <p className="mt-3 font-sans text-xs font-medium text-ccjv-green">
                      {dept.tagline}
                    </p>

                    <p className="mt-3 font-sans text-xs leading-relaxed text-ccjv-ink-secondary">
                      {dept.description}
                    </p>
                  </div>

                  <div className="mt-8 pt-6 border-t border-ccjv-line">
                    <Link
                      href={`/organisation/departements/${dept.slug}`}
                      className="font-sans text-xs font-bold tracking-[0.14em] text-ccjv-ink uppercase underline underline-offset-4 transition-colors hover:text-ccjv-green"
                    >
                      Découvrir ce département →
                    </Link>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          09 — SECTION : MOMENTS VÉCUS (MÉMOIRE VISUELLE & ARCHIVES)
          ========================================================================= */}
      {archivedEvents.length > 0 && (
        <section
          className="relative border-t border-ccjv-line bg-white py-16 lg:py-24"
          aria-labelledby="archived-events-title"
        >
          <div className="container">
            <Reveal>
              <h2
                id="archived-events-title"
                className="font-serif text-[clamp(2rem,1.4rem+2.2vw,3.2rem)] font-normal tracking-[-0.02em] leading-tight"
              >
                Les moments vécus ensemble.
              </h2>
              <p className="mt-4 max-w-[50ch] font-sans text-sm leading-relaxed text-ccjv-ink-secondary">
                Retour en images sur les temps forts qui ont marqué la vie de notre
                communauté.
              </p>
            </Reveal>

            {/* Galerie éditoriale des événements passés */}
            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {archivedEvents.map((event, idx) => (
                <Reveal key={event.id} delay={idx * 60}>
                  <Link
                    href={`/vie-de-leglise/evenements/${event.slug}`}
                    className="group flex flex-col border border-ccjv-line bg-ccjv-offwhite p-5 transition-all duration-300 hover:border-ccjv-green"
                  >
                    <div className="relative mb-4 aspect-[16/10] w-full overflow-hidden bg-ccjv-line">
                      <Image
                        src={event.imageUrl || "/media/ccjv-11.jpeg"}
                        alt={event.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover"
                      />
                    </div>
                    <span className="font-sans text-[0.7rem] font-semibold tracking-[0.14em] text-ccjv-green uppercase">
                      {formatLongDate(event.eventDate)}
                    </span>
                    <h3 className="mt-2 font-serif text-lg font-semibold text-ccjv-ink group-hover:text-ccjv-green transition-colors">
                      {event.title}
                    </h3>
                    <p className="mt-2 font-sans text-xs leading-relaxed text-ccjv-ink-secondary line-clamp-2">
                      {event.excerpt || event.description}
                    </p>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          10 — DEUXIÈME RESPIRATION BIBLIQUE (Fond sombre immersif)
          ========================================================================= */}
      <VerseSection
        variant="both"
        tone="dark"
        text="« Veillons les uns sur les autres pour nous exciter à l'amour et aux bonnes œuvres. N'abandonnons pas notre assemblée, comme c'est la coutume de quelques-uns, mais exhortons-nous réciproquement. »"
        reference="Hébreux 10:24-25"
        leftPhoto="/media/ccjv-08.jpeg"
        rightPhoto="/media/ccjv-30.jpeg"
      />

      {/* =========================================================================
          11 — SECTION FINALE : L'INVITATION (ENGAGEMENT & ACCUEIL)
          ========================================================================= */}
      <section className="relative overflow-hidden border-t border-ccjv-line bg-ccjv-offwhite py-20 lg:py-28">
        <div className="container relative z-10 mx-auto max-w-3xl text-center">
          <Reveal>
            <h2 className="font-serif text-[clamp(2.2rem,1.6rem+2.6vw,3.6rem)] font-normal leading-tight tracking-[-0.02em] text-ccjv-ink">
              Quel sera votre prochain rendez-vous avec nous ?
            </h2>

            <p className="mt-6 font-sans text-sm md:text-base leading-relaxed text-ccjv-ink-secondary">
              Que ce soit pour un dimanche de célébration, une rencontre en
              semaine ou simplement pour faire vos premiers pas, nos portes vous
              sont grandes ouvertes. Venez comme vous êtes.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <a
                href="#a-venir"
                className="inline-flex items-center justify-center bg-ccjv-ink px-8 py-4 font-sans text-xs font-semibold tracking-[0.16em] text-white uppercase transition-all duration-200 hover:bg-ccjv-green"
              >
                Voir les prochains événements ↑
              </a>
              <Link
                href="/vie-de-leglise/ou-nous-trouver"
                className="inline-flex items-center justify-center border border-ccjv-ink bg-transparent px-8 py-4 font-sans text-xs font-semibold tracking-[0.16em] text-ccjv-ink uppercase transition-all duration-200 hover:bg-ccjv-ink hover:text-white"
              >
                Planifier ma visite
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
