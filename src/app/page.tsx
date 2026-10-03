import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Section } from "@/components/shared/Section";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { Reveal } from "@/components/shared/Reveal";
import { CrossMark } from "@/components/shared/CrossMark";
import { OpenBookMark } from "@/components/shared/OpenBookMark";
import { VerseSection } from "@/components/shared/VerseSection";
import { BreathingPhoto } from "@/components/shared/BreathingPhoto";
import { WeekRhythm } from "@/components/shared/WeekRhythm";
import { CommunityFaces } from "@/components/shared/CommunityFaces";
import { Hero } from "@/features/pages/Hero";
import { EventsSection } from "@/features/events/EventsSection";
import { FeaturedEvent } from "@/features/events/FeaturedEvent";
import { EventRow } from "@/features/events/EventRow";

import { TeachingFeature } from "@/features/publications/TeachingFeature";
import { TeachingCard } from "@/features/publications/TeachingCard";
import { upcomingEvents } from "@/data/mock/events";
import { getDepartmentName } from "@/data/mock/departments";
import { getPublicationsByCategory } from "@/data/mock/publications";
import { communityFaces } from "@/data/mock/community";
import { images } from "@/data/mock/images";
import { site, socials, weeklyRhythm } from "@/data/mock/site";
import { verses } from "@/data/mock/verses";
import { defaultTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: { absolute: defaultTitle },
  description:
    "Le Centre Chrétien Jésus ma Vie est une église vivante à Lubumbashi : cultes, communauté, enseignements et accueil de chacun.",
};

export default function HomePage() {
  const [mainEvent, ...secondaryEvents] = upcomingEvents;
  const teachings = getPublicationsByCategory("ENSEIGNEMENT");
  const [leadTeaching, ...otherTeachings] = teachings;

  return (
    <>
      {/* 01 — ACCUEILLIR */}
      <Hero />

      {/* 02 — LA PAROLE DU JOUR */}
      <VerseSection
        context="Une parole pour aujourd'hui"
        text={verses.rassemblement.text}
        reference={verses.rassemblement.reference}
        tone="dark"
      />

      {/* 03 — UN MOT DU PASTEUR */}
      <Section
        id="mot-du-pasteur"
        tone="tinted"
        aria-labelledby="mot-pasteur-titre"
      >
        <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-12 md:gap-14">
          <Reveal className="md:col-span-5">
            <div className="relative aspect-[3/4] overflow-hidden rounded-t-full bg-ccjv-line">
              <Image
                src={images.portraitLarge}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 42vw"
                className="object-cover"
              />
            </div>
          </Reveal>
          <Reveal delay={100} className="md:col-span-7">
            <div className="flex items-center gap-3">
              <CrossMark size="sm" className="text-ccjv-green" />
              <p className="overline">Un mot du pasteur</p>
            </div>
            <h2 id="mot-pasteur-titre" className="mt-4">
              Vous êtes les bienvenus parmi nous.
            </h2>
            <p className="lead mt-6">
              Que vous cherchiez Dieu depuis longtemps ou que vous poussiez la
              porte pour la première fois, il y a une place pour vous ici.
            </p>
            <p className="mt-5 text-ccjv-ink-secondary">
              Notre désir est simple : que chacun rencontre Jésus-Christ,
              grandisse dans Sa Parole et trouve une famille pour avancer. Venez
              tel que vous êtes — nous vous attendons avec joie.
            </p>
            <p className="mt-8 font-serif text-lg">{site.visionary}</p>
            <p className="font-sans text-xs font-semibold tracking-[0.16em] text-ccjv-ink-secondary uppercase">
              {site.visionaryRole}
            </p>
          </Reveal>
        </div>
      </Section>

      {/* 04 — QUI SOMMES-NOUS EN BREF */}
      <Section id="qui-sommes-nous" aria-labelledby="qui-sommes-nous-titre">
        <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-12 md:gap-14">
          <Reveal className="md:col-span-6">
            <p className="overline">Qui sommes-nous</p>
            <h2 id="qui-sommes-nous-titre" className="mt-4">
              Une famille née le {site.foundedAt}
            </h2>
            <p className="lead mt-6">
              Le {site.name} est une église de Lubumbashi fondée le{" "}
              {site.foundedAt}. Depuis, une communauté grandit, les enfants ont
              leur propre ministère — l&apos;Ecodim, né le{" "}
              {site.ecodimFoundedAt} — et les services se multiplient.
            </p>
            <div className="mt-8">
              <Button variant="outline" href="/qui-sommes-nous">
                Découvrir notre histoire →
              </Button>
            </div>
          </Reveal>
          <Reveal delay={100} className="md:col-span-6">
            <div className="relative aspect-[4/3] overflow-hidden bg-ccjv-line">
              <Image
                src={images.identite}
                alt=""
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </Reveal>
        </div>
      </Section>

      {/* 05 — LA VIE DE L'ÉGLISE / ÉVÉNEMENTS */}
      <EventsSection
        title="Ce qui se passe"
        description="Rejoignez-nous et marchons ensemble avec Jésus ! Découvrez nos prochains cultes, temps de prière et rencontres fraternelles."
        ctaLabel="TOUT L'AGENDA"
        ctaHref="/vie-de-leglise/evenements"
        tone="tinted"
      />


      {/* 06 — NOTRE RYTHME DE LA SEMAINE */}
      <Section id="horaires" aria-labelledby="horaires-titre">
        <SectionHeading
          overline="Notre semaine"
          title="Quand nous nous rassemblons"
          id="horaires-titre"
          description="Les horaires ne sont pas qu'une information : c'est le rythme de la vie de l'église."
        />
        <WeekRhythm items={weeklyRhythm} />
        <div className="mt-10">
          <Button variant="outline" href="/vie-de-leglise/ou-nous-trouver">
            Nous trouver et nous contacter →
          </Button>
        </div>
      </Section>

      {/* 07 — DERNIERS ENSEIGNEMENTS (card vidéo YouTube) */}
      <Section
        id="enseignements"
        tone="tinted"
        aria-labelledby="enseignements-titre"
      >
        <SectionHeading
          overline="Enseignements"
          title="Écouter la Parole"
          id="enseignements-titre"
          description="Les messages récents. La vidéo s'ouvre sur notre chaîne YouTube — rien n'est téléchargé à votre insu."
        />
        {leadTeaching && (
          <Reveal>
            <TeachingFeature publication={leadTeaching} />
          </Reveal>
        )}
        {otherTeachings.length > 0 && (
          <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2">
            {otherTeachings.slice(0, 2).map((teaching) => (
              <Reveal key={teaching.id} delay={80}>
                <TeachingCard publication={teaching} />
              </Reveal>
            ))}
          </div>
        )}
        <div className="mt-14 flex flex-col items-start gap-4 border-t border-ccjv-line pt-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <OpenBookMark size="md" className="text-ccjv-green" />
            <p className="max-w-[42ch] text-[0.95rem] text-ccjv-ink-secondary">
              Retrouvez l&apos;ensemble de nos messages sur notre chaîne
              YouTube.
            </p>
          </div>
          <Button variant="outline" href="/publications/enseignements">
            Tous les enseignements →
          </Button>
        </div>
      </Section>

      {/* 08 — LA COMMUNAUTÉ (visages, scrollytelling) */}
      <Section id="communaute" aria-labelledby="communaute-titre">
        <SectionHeading
          overline="La communauté"
          title="Des visages, pas des rubriques"
          id="communaute-titre"
          description="Faites défiler : ce que Dieu fait ici se voit d'abord sur des visages."
        />
        <CommunityFaces faces={communityFaces} />
      </Section>

      {/* 09 — RESPIRATION (photographie-témoignage) */}
      <BreathingPhoto
        image={images.louange}
        phrase="La parole nous rassemble"
        reference={`${site.acronym} — Lubumbashi`}
      />

      {/* 10 — LA PRIÈRE */}
      <Section id="priere" tone="tinted" aria-labelledby="priere-titre">
        <Reveal className="mx-auto flex max-w-[46rem] flex-col items-center text-center">
          <CrossMark size="lg" className="text-ccjv-green" />
          <h2
            id="priere-titre"
            className="mt-8 font-serif text-[clamp(1.5rem,1rem+2.2vw,2.5rem)] leading-tight"
          >
            Prenez un moment.
          </h2>
          <p className="lead mt-6">
            Vous traversez une épreuve, une joie, une question ? Vous pouvez
            déposer votre demande de prière. Notre équipe prie pour chaque
            intention reçue.
          </p>
          <p className="mt-8">
            <Button variant="primary" href={site.whatsappHref} external>
              Demander la prière
            </Button>
          </p>
          <p className="mt-3 font-sans text-xs text-ccjv-ink-secondary">
            Pour l&apos;instant par WhatsApp — un espace de prière dédié arrive
            bientôt.
          </p>
        </Reveal>
      </Section>

      {/* 11 — SOUTENIR L'ÉGLISE */}
      <Section id="soutenir" aria-labelledby="soutenir-titre">
        <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-12 md:gap-14">
          <Reveal className="md:col-span-7">
            <p className="overline">Soutenir</p>
            <h2 id="soutenir-titre" className="mt-4">
              Soutenir l&apos;œuvre de l&apos;église
            </h2>
            <p className="lead mt-6">
              Vos dons soutiennent l&apos;accueil, l&apos;enseignement des
              enfants, la louange et l&apos;entraide au sein de la communauté.
            </p>
            <p className="mt-5 text-ccjv-ink-secondary">
              Les dons en ligne ne sont pas encore ouverts. En attendant, vous
              pouvez nous écrire : nous vous indiquerons les moyens disponibles
              sur place.
            </p>
            <div className="mt-8">
              <Button variant="outline" href={site.whatsappHref} external>
                Nous écrire à ce sujet
              </Button>
            </div>
          </Reveal>
          <Reveal delay={100} className="md:col-span-5">
            <div className="relative aspect-[4/3] overflow-hidden bg-ccjv-line">
              <Image
                src={images.communaute}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 42vw"
                className="object-cover"
              />
            </div>
          </Reveal>
        </div>
      </Section>

      {/* 12 — L'ENVOI */}
      <Section id="envoi" tone="green" aria-labelledby="envoi-titre">
        <Reveal className="mx-auto flex max-w-[48rem] flex-col items-center text-center">
          <CrossMark size="lg" className="text-ccjv-cream" />
          <h2
            id="envoi-titre"
            className="mt-8 font-serif text-[clamp(1.75rem,1rem+3vw,3rem)] leading-tight text-white"
          >
            La porte est ouverte.
          </h2>
          <p className="mt-6 text-white/85">
            Vous n&apos;avez rien à préparer, rien à prouver. Venez un dimanche,
            présentez-vous : nous serons heureux de vous accueillir.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Button
              variant="inverse"
              size="lg"
              href="/vie-de-leglise/ou-nous-trouver"
            >
              Planifier ma visite
            </Button>
            <Button variant="inverse" size="lg" href={site.whatsappHref} external>
              Écrire sur WhatsApp
            </Button>
          </div>
          <ul className="mt-10 flex flex-wrap items-center justify-center gap-6">
            {socials.map((social) => (
              <li key={social.label}>
                <a
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-sans text-sm text-ccjv-cream underline underline-offset-4 hover:text-white"
                >
                  {social.label}
                  <span aria-hidden="true"> ↗</span>
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-10">
            <Link
              href="/vie-de-leglise/ou-nous-trouver"
              className="font-sans text-sm text-white/70 underline underline-offset-4 hover:text-white"
            >
              Voir les horaires et l&apos;accès →
            </Link>
          </p>
        </Reveal>
      </Section>
    </>
  );
}
