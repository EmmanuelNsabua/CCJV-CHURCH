import Image from "next/image";
import Link from "next/link";
import { CrossMark } from "@/components/shared/CrossMark";
import { VerseSection } from "@/components/shared/VerseSection";
import { Reveal } from "@/components/shared/Reveal";
import { ParallaxImage } from "@/components/shared/ParallaxImage";
import { site, weeklyRhythm } from "@/data/mock/site";
import { images } from "@/data/mock/images";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Où nous trouver & Venir — CCJV",
  description:
    "Adresse, horaires des cultes, accès et accueil au Centre Chrétien Jésus ma Vie à Lubumbashi. Quartier Hewa Bora, Avenue Djoloko — préparez votre visite en toute simplicité.",
  path: "/vie-de-leglise/ou-nous-trouver",
});

const itineraryHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  site.address,
)}`;

export default function OuNousTrouverPage() {
  const firstVisitPoints = [
    {
      title: "Venez comme vous êtes",
      description:
        "Aucun code vestimentaire imposé, aucune démarche complexe. Vous êtes le bienvenu tel que vous êtes.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
    {
      title: "Seul ou accompagné",
      description:
        "Que vous veniez en famille, entre amis ou seul pour la première fois, une équipe d'accueil attentionnée sera là pour vous guider.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      title: "Vos enfants sont les bienvenus",
      description:
        "Pendant le culte, les enfants ont leur propre espace avec l'Ecodim : chants, récits bibliques et encadrement bienveillant.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M12 2v20" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
    },
  ];

  return (
    <div className="bg-ccjv-offwhite text-ccjv-ink selection:bg-ccjv-cream selection:text-ccjv-ink">
      {/* =========================================================================
          01 — HERO : L'ACCUEIL (IMAGE À GAUCHE / TEXTE À DROITE)
          ========================================================================= */}
      <section className="relative overflow-hidden pt-28 pb-16 lg:pt-36 lg:pb-24 border-b border-ccjv-line bg-white">
        <div className="container">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14 xl:gap-16">
            {/* Colonne gauche : Grande photographie authentique avec Parallax */}
            <div className="lg:col-span-6">
              <Reveal>
                <ParallaxImage
                  src={images.exterieur || "/media/ccjv-21.jpeg"}
                  alt="Centre Chrétien Jésus ma Vie à Lubumbashi"
                  priority
                  speed={0.10}
                  className="aspect-[4/3] w-full shadow-lg"
                />
              </Reveal>
            </div>

            {/* Colonne droite : Titre unique et CTA épuré */}
            <div className="flex flex-col justify-center lg:col-span-6">
              <Reveal delay={100}>
                <h1 className="font-serif text-[clamp(2.5rem,1.8rem+3.5vw,4.5rem)] font-normal leading-[1.08] tracking-[-0.02em] text-ccjv-ink">
                  Une communauté prête à vous accueillir.
                </h1>

                <div className="mt-8 sm:mt-10">
                  <a
                    href="#quand-et-ou"
                    className="inline-flex items-center justify-center bg-ccjv-ink px-8 py-4 font-sans text-xs font-semibold tracking-[0.16em] text-white uppercase transition-all duration-200 hover:bg-ccjv-green"
                  >
                    Planifier ma visite ↓
                  </a>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          02 — SECTION : QUAND & OÙ (HORAIRES + ADRESSE + ITINÉRAIRE)
          ========================================================================= */}
      <section
        id="quand-et-ou"
        className="relative scroll-mt-24 py-16 lg:py-24"
        aria-labelledby="when-where-title"
      >
        <div className="container">
          <Reveal>
            <h2
              id="when-where-title"
              className="font-serif text-[clamp(2rem,1.4rem+2.2vw,3.2rem)] font-normal tracking-[-0.02em] leading-tight"
            >
              Venez nous rencontrer.
            </h2>
            <p className="mt-3 max-w-[50ch] font-sans text-sm leading-relaxed text-ccjv-ink-secondary">
              Toutes les informations nécessaires pour nous rejoindre simplement, sans complication.
            </p>
          </Reveal>

          <div className="mt-12 grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12 lg:gap-10">
            {/* Colonne 1 : Les Horaires réguliers (lg:col-span-6) */}
            <div className="flex flex-col justify-between border border-ccjv-line bg-white p-7 sm:p-9 shadow-xs lg:col-span-6">
              <div>
                <h3 className="font-serif text-2xl font-semibold leading-snug">
                  Les rendez-vous réguliers
                </h3>
                <p className="mt-2 font-sans text-xs text-ccjv-ink-secondary">
                  Nos temps de rassemblement hebdomadaires ouverts à tous.
                </p>

                <div className="mt-6 divide-y divide-ccjv-line">
                  {/* Culte Dominical */}
                  <div className="py-4 first:pt-0">
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="font-serif text-lg font-bold text-ccjv-ink">
                        Culte Dominical
                      </span>
                      <span className="font-sans text-xs font-bold tracking-[0.14em] text-ccjv-green uppercase">
                        Dimanche · 09:00
                      </span>
                    </div>
                    <p className="mt-1 font-sans text-xs leading-relaxed text-ccjv-ink-secondary">
                      Le grand culte de toute l&apos;assemblée, suivi de moments fraternels.
                    </p>
                  </div>

                  {/* Ecodim */}
                  <div className="py-4">
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="font-serif text-lg font-bold text-ccjv-ink">
                        Enfants · Ecodim
                      </span>
                      <span className="font-sans text-xs font-bold tracking-[0.14em] text-ccjv-green uppercase">
                        Dimanche · 09:00
                      </span>
                    </div>
                    <p className="mt-1 font-sans text-xs leading-relaxed text-ccjv-ink-secondary">
                      Temps dédié aux enfants pendant le culte des adultes.
                    </p>
                  </div>

                  {/* Prière & Étude */}
                  <div className="py-4">
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="font-serif text-lg font-bold text-ccjv-ink">
                        Prière & Enseignement
                      </span>
                      <span className="font-sans text-xs font-bold tracking-[0.14em] text-ccjv-green uppercase">
                        Mercredi · 17:00
                      </span>
                    </div>
                    <p className="mt-1 font-sans text-xs leading-relaxed text-ccjv-ink-secondary">
                      Méditation de la Parole et temps d&apos;intercession communautaire.
                    </p>
                  </div>

                  {/* Chorale */}
                  <div className="py-4 last:pb-0">
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="font-serif text-lg font-bold text-ccjv-ink">
                        Répétition de la Chorale
                      </span>
                      <span className="font-sans text-xs font-bold tracking-[0.14em] text-ccjv-green uppercase">
                        Lundi & Samedi · 16:30
                      </span>
                    </div>
                    <p className="mt-1 font-sans text-xs leading-relaxed text-ccjv-ink-secondary">
                      Préparation spirituelle, musicale et vocale pour la louange.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-ccjv-line pt-5 font-sans text-xs text-ccjv-ink-secondary">
                <span>Aucune réservation nécessaire. L&apos;accueil commence 30 minutes avant chaque service.</span>
              </div>
            </div>

            {/* Colonne 2 : Adresse, Carte & Itinéraire (lg:col-span-6) */}
            <div className="flex flex-col justify-between border border-ccjv-line bg-white p-7 sm:p-9 shadow-xs lg:col-span-6">
              <div>
                <h3 className="font-serif text-2xl font-semibold leading-snug">
                  Notre adresse
                </h3>
                <p className="mt-2 font-sans text-xs text-ccjv-ink-secondary">
                  Où trouver l&apos;église à Lubumbashi.
                </p>

                {/* Bloc Adresse stylisé */}
                <div className="mt-6 border border-ccjv-line bg-ccjv-offwhite p-5 sm:p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-ccjv-ink text-white">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-serif text-lg font-bold text-ccjv-ink">
                        Centre Chrétien Jésus ma Vie
                      </h4>
                      <p className="mt-1 font-sans text-sm text-ccjv-ink leading-relaxed">
                        Avenue Djoloko, Quartier Hewa Bora
                      </p>
                      <p className="font-sans text-xs text-ccjv-ink-secondary">
                        Lubumbashi, République démocratique du Congo
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contact direct rapide */}
                <div className="mt-6 flex flex-col gap-2 font-sans text-xs text-ccjv-ink">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-ccjv-green">Besoin d&apos;orientation :</span>
                    <span>Écrivez-nous sur WhatsApp pour des repères précis.</span>
                  </div>
                </div>
              </div>

              {/* Bouton d'itinéraire Google Maps */}
              <div className="mt-8 border-t border-ccjv-line pt-6">
                <a
                  href={itineraryHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 border border-ccjv-ink bg-transparent px-6 py-4 font-sans text-xs font-semibold tracking-[0.14em] text-ccjv-ink uppercase transition-all duration-200 hover:bg-ccjv-ink hover:text-white"
                >
                  <span>Ouvrir l&apos;itinéraire sur Google Maps ↗</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          03 — RESPIRATION BIBLIQUE (PAUSE SPIRITUELLE CALME)
          ========================================================================= */}
      <VerseSection
        variant="center"
        tone="cream"
        text="« Venez, et voyez. »"
        reference="Jean 1:46"
      />

      {/* =========================================================================
          04 — SECTION : PREMIÈRE VISITE (RASSURER LE NOUVEAU VISITEUR)
          ========================================================================= */}
      <section className="relative py-16 lg:py-24 border-t border-ccjv-line bg-white">
        <div className="container">
          <Reveal>
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="font-serif text-[clamp(2rem,1.4rem+2.2vw,3.2rem)] font-normal tracking-[-0.02em] leading-tight">
                Vous venez pour la première fois ?
              </h2>
              <p className="mt-3 font-sans text-sm leading-relaxed text-ccjv-ink-secondary">
                Trois repères simples pour vous sentir immédiatement chez vous.
              </p>
            </div>
          </Reveal>

          {/* 3 Cartes rassurantes */}
          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            {firstVisitPoints.map((point, index) => (
              <Reveal key={point.title} delay={index * 80}>
                <div className="flex h-full flex-col justify-between border border-ccjv-line bg-ccjv-offwhite p-7 sm:p-8">
                  <div>
                    <div className="mb-6 flex h-12 w-12 items-center justify-center border border-ccjv-ink/20 bg-white text-ccjv-green">
                      {point.icon}
                    </div>

                    <h3 className="font-serif text-xl font-semibold leading-snug">
                      {point.title}
                    </h3>

                    <p className="mt-3 font-sans text-xs leading-relaxed text-ccjv-ink-secondary">
                      {point.description}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          05 — SECTION FINALE : INVITATION (« NOUS SERONS HEUREUX DE VOUS ACCUEILLIR »)
          ========================================================================= */}
      <section className="relative overflow-hidden bg-ccjv-black py-24 text-white lg:py-32">
        {/* Photo panoramique de communauté en filigrane sombre */}
        <div className="absolute inset-0 z-0 opacity-25">
          <Image
            src={images.communaute || "/media/ccjv-30.jpeg"}
            alt="Communauté fraternelle CCJV"
            fill
            sizes="100vw"
            className="object-cover"
          />
        </div>

        <div className="container relative z-10 mx-auto max-w-3xl text-center">
          <Reveal>
            <CrossMark size="md" className="mx-auto text-ccjv-cream mb-6" />

            <h2 className="font-serif text-[clamp(2.2rem,1.6rem+2.6vw,3.8rem)] font-normal leading-tight tracking-[-0.02em] text-white">
              Nous serons heureux de vous accueillir.
            </h2>

            <p className="mt-6 font-sans text-sm md:text-base leading-relaxed text-white/80 max-w-[50ch] mx-auto">
              N&apos;hésitez pas à nous écrire si vous avez la moindre question avant de venir. Notre équipe est à votre disposition.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <a
                href={site.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center bg-white px-8 py-4 font-sans text-xs font-semibold tracking-[0.16em] text-ccjv-black uppercase transition-all duration-200 hover:bg-ccjv-cream"
              >
                Écrire sur WhatsApp
              </a>
              <Link
                href="/vie-de-leglise/evenements"
                className="inline-flex items-center justify-center border border-white/40 bg-transparent px-8 py-4 font-sans text-xs font-semibold tracking-[0.16em] text-white uppercase transition-all duration-200 hover:border-white hover:bg-white/10"
              >
                Voir les prochains événements →
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
