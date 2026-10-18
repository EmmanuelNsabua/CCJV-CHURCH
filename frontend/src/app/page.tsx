import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ContentUnavailable } from "@/components/ui/ContentUnavailable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Section } from "@/components/shared/Section";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { Reveal } from "@/components/shared/Reveal";
import { CrossMark } from "@/components/shared/CrossMark";
import { OpenBookMark } from "@/components/shared/OpenBookMark";
import { VerseSection } from "@/components/shared/VerseSection";
import { BreathingPhoto } from "@/components/shared/BreathingPhoto";
import { WeekRhythm, type RhythmItem } from "@/components/shared/WeekRhythm";
import { CommunityFaces } from "@/components/shared/CommunityFaces";
import { Hero } from "@/features/pages/Hero";
import { EventsSection } from "@/features/events/EventsSection";

import { TeachingFeature } from "@/features/publications/TeachingFeature";
import {
  getCommunityFaces,
  getDepartments,
  getEvents,
  getHeroTestimonies,
  getLatestPublishedEnseignement,
  getSchedule,
  getScripture,
  getSettings,
} from "@/lib/api";
import { readOrUnavailable } from "@/lib/api/endpoints";
import type { Scripture } from "@/lib/api";
import { images } from "@/data/images";
import { site } from "@/data/site";
import { defaultTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: { absolute: defaultTitle },
  description:
    "Le Centre Chrétien Jésus ma Vie est une église vivante à Lubumbashi : cultes, communauté, enseignements et accueil de chacun.",
};

/** Résultat de la lecture d'un verset éditorial. */
type ScriptureRead =
  | { status: "ok"; scripture: Scripture }
  | { status: "absent" }
  | { status: "unreachable" };

/**
 * Lit un verset en séparant nettement trois situations.
 *
 * Une clé non configurée côté API répond `404 SCRIPTURE_NOT_FOUND` : c'est une
 * **absence** de contenu, pas une panne. Or `readOrUnavailable` signale les deux
 * de la même manière (le lecteur ne lève jamais, il prévient par `onFailure`) :
 * on relève donc le statut HTTP pour ne pas annoncer une panne là où il n'y a
 * simplement rien à afficher — et inversement.
 */
async function readScripture(key: string): Promise<ScriptureRead> {
  let httpStatus: number | null = null;

  const read = await readOrUnavailable((options) =>
    getScripture(key, {
      onFailure: (error) => {
        httpStatus = error.status;
        options.onFailure?.(error);
      },
    }),
  );

  if (read.status === "unreachable") {
    return httpStatus === 404 ? { status: "absent" } : { status: "unreachable" };
  }

  return read.data ? { status: "ok", scripture: read.data } : { status: "absent" };
}

export default async function HomePage() {
  /*
   * Lectures publiques servies par l'API (mises en cache 60 s côté Next).
   * `readOrUnavailable` distingue « l'API a répondu, et sa réponse est vide »
   * de « on n'a pas pu lire » : la page n'affiche donc jamais une panne comme
   * un état éditorial, et ne se rabat sur aucune donnée de démonstration.
   */
  const [
    scriptureRead,
    eventsRead,
    teachingsRead,
    facesRead,
    scheduleRead,
    settingsRead,
    departmentsRead,
    heroTestimoniesRead,
  ] = await Promise.all([
    readScripture("rassemblement"),
    readOrUnavailable((options) =>
      getEvents({ status: "UPCOMING", limit: 6 }, options),
    ),
    /*
     * Un seul enseignement, le plus récemment **publié** : la sélection se fait
     * sur `publishedAt` (jamais sur la date de prédication, la date de création
     * ou la date de modification). Le serveur ne renvoie de toute façon que les
     * enseignements `PUBLISHED`.
     */
    readOrUnavailable((options) => getLatestPublishedEnseignement(options)),
    readOrUnavailable((options) => getCommunityFaces(options)),
    readOrUnavailable((options) => getSchedule(options)),
    readOrUnavailable((options) => getSettings(options)),
    readOrUnavailable((options) => getDepartments(options)),
    readOrUnavailable((options) => getHeroTestimonies(options)),
  ]);

  const upcoming = eventsRead.status === "ok" ? eventsRead.data : [];
  const latestTeaching = teachingsRead.status === "ok" ? teachingsRead.data : null;
  const communityFaces = facesRead.status === "ok" ? facesRead.data : [];
  const featuredTestimony =
    heroTestimoniesRead.status === "ok" ? heroTestimoniesRead.data[0] ?? null : null;

  /** Les événements de l'API référencent les départements par identifiant. */
  const departmentNames = Object.fromEntries(
    (departmentsRead.status === "ok" ? departmentsRead.data : []).map(
      (department) => [department.id, department.name],
    ),
  );

  /** Rythme hebdomadaire : `timeLabel` de l'API est déjà mis en forme. */
  const weeklyRhythm: RhythmItem[] = (
    scheduleRead.status === "ok" ? scheduleRead.data : []
  ).map((entry) => ({
    day: entry.days && entry.days.length > 0 ? entry.days.join(", ") : entry.day,
    title: entry.title,
    time:
      entry.timeLabel ||
      (entry.startTime
        ? entry.endTime
          ? `${entry.startTime} – ${entry.endTime}`
          : `À partir de ${entry.startTime}`
        : ""),
    audience: entry.audience ?? undefined,
  }));

  /** Liens officiels des réseaux, servis par les réglages institutionnels. */
  const socialLinks =
    settingsRead.status === "ok" ? (settingsRead.data?.socialLinks ?? []) : [];

  return (
    <>
      {/* 01 — ACCUEILLIR */}
      <Hero featuredTestimony={featuredTestimony} />

      {/* 02 — LA PAROLE DU JOUR */}
      {scriptureRead.status === "unreachable" ? (
        <Section aria-label="Parole du jour momentanément indisponible">
          <ContentUnavailable resource="La parole du jour" />
        </Section>
      ) : scriptureRead.status === "ok" ? (
        <VerseSection
          text={scriptureRead.scripture.text}
          reference={scriptureRead.scripture.reference}
          tone="dark"
        />
      ) : null}

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
            <CrossMark size="sm" className="mb-4 text-ccjv-green" />
            <h2 id="mot-pasteur-titre">
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
            <h2 id="qui-sommes-nous-titre">
              Une famille chrétienne au cœur de Lubumbashi
            </h2>
            <p className="lead mt-6">
              Le {site.name} est une église vivante où chacun trouve sa place.
              Depuis sa fondation, notre communauté grandit dans la foi,
              les enfants s&apos;épanouissent au sein de l&apos;Ecodim et les
              services se multiplient pour servir Dieu et la communauté.
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
      {eventsRead.status === "unreachable" ? (
        <Section tone="tinted" aria-labelledby="evenements-titre">
          <SectionHeading
            id="evenements-titre"
            title="Ce qui se passe"
            description="Rejoignez-nous et marchons ensemble avec Jésus ! Découvrez nos prochains cultes, temps de prière et rencontres fraternelles."
          />
          <ContentUnavailable resource="L'agenda" />
          <div className="mt-10">
            <Button
              variant="outline"
              href="/vie-de-leglise/evenements"
            >
              TOUT L&apos;AGENDA
            </Button>
          </div>
        </Section>
      ) : (
        <EventsSection
          title="Ce qui se passe"
          description="Rejoignez-nous et marchons ensemble avec Jésus ! Découvrez nos prochains cultes, temps de prière et rencontres fraternelles."
          ctaLabel="TOUT L'AGENDA"
          ctaHref="/vie-de-leglise/evenements"
          events={upcoming}
          departmentNames={departmentNames}
          tone="tinted"
        />
      )}


      {/* 06 — NOTRE RYTHME DE LA SEMAINE */}
      <Section id="horaires" aria-labelledby="horaires-titre">
        <SectionHeading
          title="Quand nous nous rassemblons"
          id="horaires-titre"
          description="Retrouvez les horaires de nos cultes, temps de prière et répétitions tout au long de la semaine."
        />
        {scheduleRead.status === "unreachable" ? (
          <ContentUnavailable resource="Le rythme de la semaine" />
        ) : weeklyRhythm.length > 0 ? (
          <WeekRhythm items={weeklyRhythm} />
        ) : (
          <EmptyState
            title="Aucun horaire publié pour le moment"
            description="Les temps de rassemblement publiés depuis le back-office apparaîtront ici."
          />
        )}
        <div className="mt-10">
          <Button variant="outline" href="/vie-de-leglise/ou-nous-trouver">
            Nous trouver et nous contacter →
          </Button>
        </div>
      </Section>

      {/* 07 — DERNIER ENSEIGNEMENT PUBLIÉ */}
      <Section
        id="enseignements"
        tone="tinted"
        aria-labelledby="enseignements-titre"
      >
        <SectionHeading
          title="Écouter la Parole"
          id="enseignements-titre"
          description="Retrouvez notre prédication la plus récente pour nourrir votre foi."
        />
        {teachingsRead.status === "unreachable" ? (
          <ContentUnavailable resource="Les enseignements" />
        ) : !latestTeaching ? (
          <EmptyState
            title="Aucun enseignement publié pour le moment"
            description="Les prédications publiées depuis le back-office apparaîtront ici."
          />
        ) : (
          <Reveal>
            <TeachingFeature teaching={latestTeaching} />
          </Reveal>
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
          title="Les visages de notre communauté"
          id="communaute-titre"
          description="Découvrez les hommes et les femmes qui font vivre l'église au quotidien."
        />
        {facesRead.status === "unreachable" ? (
          <ContentUnavailable resource="Les visages de notre communauté" />
        ) : communityFaces.length > 0 ? (
          <CommunityFaces faces={communityFaces} />
        ) : (
          <EmptyState
            title="Aucun portrait publié pour le moment"
            description="Les visages publiés depuis le back-office apparaîtront ici."
          />
        )}
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
        </Reveal>
      </Section>

      {/* 11 — SOUTENIR L'ÉGLISE */}
      <Section id="soutenir" aria-labelledby="soutenir-titre">
        <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-12 md:gap-14">
          <Reveal className="md:col-span-7">
            <h2 id="soutenir-titre">
              Soutenir l&apos;œuvre de l&apos;église
            </h2>
            <p className="lead mt-6">
              Vos dons soutiennent l&apos;accueil, l&apos;enseignement des
              enfants, la louange et l&apos;entraide au sein de la communauté.
            </p>
            <p className="mt-5 text-ccjv-ink-secondary">
              Vous pouvez déposer votre offrande lors de nos rassemblements ou
              nous contacter directement pour connaître les modalités de
              contribution.
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
          {settingsRead.status === "unreachable" ? (
            <ContentUnavailable
              className="mt-10 max-w-xl text-left"
              resource="Nos liens vers les réseaux sociaux"
            />
          ) : (
            socialLinks.length > 0 && (
              <ul className="mt-10 flex flex-wrap items-center justify-center gap-6">
                {socialLinks.map((social) => (
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
            )
          )}
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
