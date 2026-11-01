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
            <p className="mt-5 text-ccjv-ink-secondary">
              Que vous cherchiez Dieu depuis longtemps ou que vous poussiez la
              porte pour la première fois, il y a une place pour vous ici.
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
            <p className="mt-5 text-ccjv-ink-secondary">
              Le <strong>Centre Chrétien Jésus ma Vie</strong> est une église vivante où chacun trouve sa place.
              Depuis sa fondation, notre communauté grandit dans la foi,
              les enfants s&apos;épanouissent au sein de l&apos;Ecodim et les
              services se multiplient pour servir Dieu et la communauté.
            </p>
            <div className="mt-8">
              <Button variant="outline" href="/qui-sommes-nous">
                Lire plus
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

      {/* 04b — L'ÉCOLE DU DIMANCHE (ECODIM) */}
      <Section
        id="ecodim-passerelle"
        tone="tinted"
        aria-labelledby="ecodim-passerelle-titre"
      >
        <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-12 md:gap-14">
          <Reveal className="md:col-span-6 md:order-2">
            <div className="relative aspect-[4/3] overflow-hidden border border-ccjv-line bg-ccjv-surface">
              <Image
                src={images.ecodim}
                alt="Enfants réunis à l'École du Dimanche du CCJV"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </Reveal>
          <Reveal delay={100} className="md:col-span-6 md:order-1">
            <h2 id="ecodim-passerelle-titre" className="mt-4">
              L&apos;École du Dimanche : former les enfants à la vie chrétienne
            </h2>
            <p className="mt-5 text-ccjv-ink-secondary">
              L&apos;Ecodim accueille vos enfants chaque dimanche dans un cadre
              pédagogique structuré et bienveillant, pensé pour transmettre la
              Parole de Dieu selon leur âge. De l&apos;éveil à l&apos;adolescence, nos moniteurs consacrés
              enseignent les Écritures à travers des récits bibliques, la
              mémorisation de versets et la prière, en étroit partenariat avec les
              familles.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button variant="primary" href="/ecodim">
                Découvrir
              </Button>
              <Button variant="outline" href="/publications/enseignements?scope=ECODIM">
                Apprendre
              </Button>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* 04c — NOS DÉPARTEMENTS AU SERVICE */}
      <Section id="departements" aria-labelledby="departements-titre">
        <SectionHeading
          id="departements-titre"
          title="Une église vivante portée par le service"
          description="Chaque département œuvre avec dévouement pour l'édification du corps de Christ et le rayonnement de l'évangile."
        />
        {departmentsRead.status === "unreachable" ? (
          <ContentUnavailable resource="Les départements" />
        ) : (departmentsRead.status === "ok" && departmentsRead.data.length > 0) ? (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {departmentsRead.data.slice(0, 6).map((dept) => (
                <div
                  key={dept.id}
                  className="border border-ccjv-line p-6 bg-ccjv-surface/20 flex flex-col justify-between hover:border-ccjv-green transition-colors"
                >
                  <div>
                    <h3 className="font-serif text-xl font-medium text-ccjv-ink">
                      {dept.name}
                    </h3>
                    {dept.tagline && (
                      <p className="mt-2 font-sans text-xs text-ccjv-green font-semibold uppercase tracking-wider">
                        {dept.tagline}
                      </p>
                    )}
                    {dept.description && (
                      <p className="mt-3 font-sans text-xs text-ccjv-ink-secondary line-clamp-3 leading-relaxed">
                        {dept.description}
                      </p>
                    )}
                  </div>
                  <div className="mt-6 pt-4 border-t border-ccjv-line/60">
                    <Link
                      href={`/${dept.slug}`}
                      className="font-sans text-xs font-semibold uppercase tracking-wider text-ccjv-green hover:underline"
                    >
                      En savoir plus
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10 text-center">
              <Button variant="outline" href="/organisation">
                Voir les départements
              </Button>
            </div>
          </>
        ) : (
          <EmptyState
            title="Aucun département renseigné pour le moment"
            description="La liste des départements apparaîtra ici."
          />
        )}
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
            Contactez-nous
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
        {/*}
        <div className="mt-14 flex flex-col items-start gap-4 border-t border-ccjv-line pt-8 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="outline" href="/publications/enseignements">
            Découvrir plus
          </Button>
        </div>*/}
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
                Contactez-nous
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
              Nous écrire
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
        </Reveal>
      </Section>
    </>
  );
}
