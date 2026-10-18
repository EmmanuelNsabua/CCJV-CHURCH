import Image from "next/image";
import Link from "next/link";
import { CrossMark } from "@/components/shared/CrossMark";
import { VerseSection } from "@/components/shared/VerseSection";
import { Reveal } from "@/components/shared/Reveal";
import { ParallaxImage } from "@/components/shared/ParallaxImage";
import { EmptyState } from "@/components/ui/EmptyState";
import { ContentUnavailable } from "@/components/ui/ContentUnavailable";
import { site } from "@/data/site";
import { getSchedule, getSettings, readOrUnavailable } from "@/lib/api/endpoints";
import { images } from "@/data/images";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Où nous trouver & Venir — CCJV",
  description:
    "Adresse, horaires des cultes, accès et accueil au Centre Chrétien Jésus ma Vie à Lubumbashi. Quartier Hewa Bora, Avenue Djoloko — préparez votre visite en toute simplicité.",
  path: "/vie-de-leglise/ou-nous-trouver",
});

export default async function OuNousTrouverPage() {
  /*
   * Les horaires affichés sont ceux de `getSchedule()` et les informations
   * institutionnelles proviennent de `getSettings()` (base de données).
   */
  const [scheduleRead, settingsRead] = await Promise.all([
    readOrUnavailable((options) => getSchedule(options)),
    readOrUnavailable((options) => getSettings(options)),
  ]);

  const schedule = scheduleRead.status === "ok" ? scheduleRead.data : [];
  const settings = settingsRead.status === "ok" && settingsRead.data ? settingsRead.data.settings : {};

  const address = settings["site.address"] || site.address;
  const addressLine1 = settings["site.addressLine1"] || site.addressLines[0];
  const addressLine2 = settings["site.addressLine2"] || site.addressLines[1];
  const addressLine3 = settings["site.addressLine3"] || site.addressLines[2];
  const latitude = settings["site.latitude"];
  const longitude = settings["site.longitude"];
  const whatsappNumber = settings["site.whatsappNumber"] || site.whatsappNumber;
  const whatsappHref = settings["site.whatsappHref"] || site.whatsappHref;
  const supportEmail = settings["site.supportEmail"];

  const itineraryHref = latitude && longitude
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(latitude)},${encodeURIComponent(longitude)}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  const mapEmbedUrl = latitude && longitude
    ? `https://maps.google.com/maps?q=${encodeURIComponent(latitude)},${encodeURIComponent(longitude)}&t=&z=16&ie=UTF8&iwloc=&output=embed`
    : `https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

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
                  {scheduleRead.status === "unreachable" ? (
                    <ContentUnavailable resource="Les rendez-vous réguliers" />
                  ) : schedule.length > 0 ? (
                    schedule.map((entry) => (
                      <div key={entry.id} className="py-4 first:pt-0 last:pb-0">
                        <div className="flex items-baseline justify-between gap-4">
                          <span className="font-serif text-lg font-bold text-ccjv-ink">
                            {entry.title}
                          </span>
                          <span className="font-sans text-xs font-bold tracking-[0.14em] text-ccjv-green uppercase">
                            {entry.day} · {entry.timeLabel}
                          </span>
                        </div>
                        {entry.audience && (
                          <p className="mt-1 font-sans text-xs leading-relaxed text-ccjv-ink-secondary">
                            {entry.audience}
                          </p>
                        )}
                        {!entry.isConfirmed && (
                          <p className="mt-1 font-sans text-xs leading-relaxed text-ccjv-ink-secondary">
                            Horaire à confirmer.
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <EmptyState
                      title="Aucun horaire publié"
                      description="Les temps de rassemblement de la semaine apparaîtront ici dès leur publication."
                    />
                  )}
                </div>
              </div>

              <div className="mt-8 border-t border-ccjv-line pt-5 font-sans text-xs text-ccjv-ink-secondary">
                <span>Aucune réservation nécessaire : présentez-vous simplement à l&apos;heure du rendez-vous.</span>
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
                        {settings["site.name"] || site.name}
                      </h4>
                      {/* Adresse institutionnelle dynamique */}
                      <p className="mt-1 font-sans text-sm text-ccjv-ink leading-relaxed">
                        {[addressLine1, addressLine2].filter(Boolean).join(", ") || address}
                      </p>
                      {addressLine3 && (
                        <p className="font-sans text-xs text-ccjv-ink-secondary">
                          {addressLine3}
                        </p>
                      )}
                      {latitude && longitude && (
                        <p className="mt-2 font-mono text-[11px] text-ccjv-green font-medium">
                          Coordonnées GPS : {latitude}, {longitude}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Carte interactive */}
                <div className="mt-6 aspect-[16/9] w-full border border-ccjv-line bg-ccjv-offwhite overflow-hidden relative">
                  <iframe
                    title="Plan d'accès et localisation de l'église"
                    src={mapEmbedUrl}
                    className="w-full h-full border-0"
                    loading="lazy"
                  />
                </div>

                {/* Contact direct rapide */}
                <div className="mt-6 flex flex-col gap-2.5 font-sans text-xs text-ccjv-ink">
                  {whatsappNumber && (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-ccjv-green">WhatsApp assistance :</span>
                      <a
                        href={whatsappHref || `https://wa.me/${whatsappNumber.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-ccjv-green font-medium"
                      >
                        {whatsappNumber}
                      </a>
                    </div>
                  )}
                  {supportEmail && (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-ccjv-green">E-mail support :</span>
                      <a
                        href={`mailto:${supportEmail}`}
                        className="underline hover:text-ccjv-green font-medium"
                      >
                        {supportEmail}
                      </a>
                    </div>
                  )}
                  <p className="text-ccjv-ink-secondary text-[11px] mt-1">
                    Besoin d&apos;orientation ? Écrivez-nous pour recevoir des repères d&apos;accès précis.
                  </p>
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
