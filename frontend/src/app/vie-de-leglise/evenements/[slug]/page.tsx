import Link from "next/link";
import { notFound } from "next/navigation";
import { HeroPhoto } from "@/components/composition/HeroPhoto";
import { HeroCompact } from "@/components/composition/HeroCompact";
import { EventPage } from "@/components/archetypes/EventPage";
import { Prose } from "@/components/editorial/Prose";
import { KeyFacts } from "@/components/editorial/KeyFacts";
import { PhotoGallery } from "@/components/editorial/PhotoGallery";
import { Badge } from "@/components/ui/Badge";
import { ContentUnavailable } from "@/components/ui/ContentUnavailable";
import { EventRow } from "@/features/events/EventRow";
import { site } from "@/data/site";
import {
  getDepartments,
  getEvent,
  getEvents,
  readOrUnavailable,
} from "@/lib/api/endpoints";
import type { Event } from "@/lib/api/types";
import { formatLongDate, formatTime } from "@/lib/utils";
import { pageMetadata } from "@/lib/seo";

/**
 * Résultat d'une lecture unitaire, où **absent** et **illisible** sont deux
 * états distincts.
 *
 * `getEvent` ne lève jamais : elle renvoie `null` aussi bien pour un slug
 * inconnu (HTTP 404) que pour une API injoignable. Seul le statut porté par
 * l'`ApiError` permet de trancher — « introuvable » se termine en `notFound()`,
 * une panne en `ContentUnavailable`.
 */
type EventRead =
  | { status: "ok"; data: Event }
  | { status: "missing" }
  | { status: "unreachable" };

async function readEvent(slug: string): Promise<EventRead> {
  const failures: Array<{ status: number | null }> = [];

  const event = await getEvent(slug, {
    onFailure: (error) => {
      failures.push({ status: error.status });
    },
  });

  if (event !== null) return { status: "ok", data: event };

  return failures.some((failure) => failure.status === 404)
    ? { status: "missing" }
    : { status: "unreachable" };
}

/**
 * Pré-génère une fiche par événement publié.
 *
 * ⚠️ Cette fonction s'exécute **au build** : si l'API est injoignable à ce
 * moment-là (conteneur Railway endormi, réseau coupé), elle doit renvoyer `[]`
 * sans jamais échouer — sinon le déploiement Vercel casse. Les fiches restent
 * servies à la demande (`dynamicParams` par défaut) et seront pré-générées au
 * build suivant.
 */
export async function generateStaticParams() {
  const result = await readOrUnavailable((options) =>
    getEvents({ limit: 100 }, options),
  );

  if (result.status === "unreachable") return [];

  return result.data.map((event) => ({ slug: event.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const read = await readEvent(slug);

  /* Aucune métadonnée n'est affirmée sur un contenu qu'on n'a pas pu lire. */
  if (read.status !== "ok") return {};

  const event = read.data;

  return pageMetadata({
    title: event.title,
    description:
      event.excerpt ??
      event.description ??
      `Événement du ${site.name} à Lubumbashi.`,
    path: `/vie-de-leglise/evenements/${event.slug}`,
  });
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const read = await readEvent(slug);

  if (read.status === "unreachable") {
    return (
      <div className="container py-[clamp(3rem,7vw,6rem)]">
        <ContentUnavailable resource="Cet événement" />
      </div>
    );
  }

  if (read.status === "missing") notFound();

  const event = read.data;

  const [departmentsRead, upcomingRead] = await Promise.all([
    readOrUnavailable((options) => getDepartments(options)),
    /*
     * `status: "UPCOMING"` plutôt que `view: "UPCOMING"` : le filtre déployé est
     * strict et refuse `view` (400), alors que `status` porte exactement la même
     * sémantique, calculée par l'API depuis la date de l'événement.
     */
    readOrUnavailable((options) =>
      getEvents({ status: "UPCOMING", limit: 4 }, options),
    ),
  ]);

  /** Les événements de l'API référencent les départements par identifiant. */
  const departments = departmentsRead.status === "ok" ? departmentsRead.data : [];
  const departmentNames = Object.fromEntries(
    departments.map((dept) => [dept.id, dept.name]),
  );
  const departmentName = event.departmentId
    ? departmentNames[event.departmentId]
    : undefined;

  /** `status` est calculé par l'API : le frontend ne le recalcule jamais. */
  const isUpcoming = event.status === "UPCOMING";

  const related =
    upcomingRead.status === "ok"
      ? upcomingRead.data.filter((item) => item.id !== event.id).slice(0, 3)
      : [];

  /** Photographie réelle de l'événement — aucune image d'emprunt à défaut. */
  const heroImage = event.bannerImage ?? event.imageUrl;

  const metaLine = [formatLongDate(event.eventDate), event.location]
    .filter(Boolean)
    .join(" · ");

  return (
    <EventPage
      hero={
        heroImage ? (
          <HeroPhoto
            overline={departmentName ?? "Vie de l'Église"}
            title={event.title}
            image={heroImage}
            caption={metaLine}
            height="tall"
          />
        ) : (
          /* Sans photographie fournie, l'ouverture reste typographique. */
          <HeroCompact
            overline={departmentName ?? "Vie de l'Église"}
            title={event.title}
            aside={
              <p className="font-sans text-[0.8rem] text-ccjv-ink-secondary">
                {metaLine}
              </p>
            }
          />
        )
      }
      summary={
        <div className="grid grid-cols-1 items-end gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-6">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant={isUpcoming ? "default" : "outline"}>
                {isUpcoming ? "À venir" : "Passé"}
              </Badge>
              {departmentName && <Badge variant="outline">{departmentName}</Badge>}
            </div>

            <p className="mt-8 font-serif text-[clamp(1.75rem,1rem+2.2vw,2.9rem)] leading-[1.1]">
              {formatLongDate(event.eventDate)}
            </p>
            <p className="mt-3 font-sans text-[1.02rem] text-ccjv-ink-secondary">
              {[formatTime(event.eventTime), event.location]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>

          {event.excerpt && (
            <p className="text-[1.0625rem] leading-[1.7] text-ccjv-ink-secondary lg:col-span-5 lg:col-start-8">
              {event.excerpt}
            </p>
          )}
        </div>
      }
      description={
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <h2 className="text-[clamp(1.6rem,1rem+1.6vw,2.35rem)] leading-[1.16]">
              À propos de ce rendez-vous
            </h2>
            {event.description && (
              <Prose large className="mt-6">
                <p>{event.description}</p>
              </Prose>
            )}
          </div>

          {event.practicalInfo && event.practicalInfo.length > 0 && (
            <div className="lg:col-span-4 lg:col-start-9">
              <p className="font-sans text-xs font-semibold tracking-[0.18em] text-ccjv-green uppercase">
                Bon à savoir
              </p>
              <ul className="mt-6 border-t border-ccjv-line">
                {event.practicalInfo.map((info) => (
                  <li
                    key={info}
                    className="border-b border-ccjv-line py-4 text-[0.95rem] leading-relaxed text-ccjv-ink-secondary"
                  >
                    {info}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      }
      practical={
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <p className="font-sans text-xs font-semibold tracking-[0.18em] text-ccjv-green uppercase">
              Informations pratiques
            </p>
            <h2 className="mt-4 text-[clamp(1.6rem,1rem+1.6vw,2.35rem)] leading-[1.16]">
              Ce qu&apos;il faut pour venir
            </h2>
          </div>
          <div className="lg:col-span-7 lg:col-start-6">
            <KeyFacts
              variant="pairs"
              items={[
                { label: "Date", value: formatLongDate(event.eventDate) },
                {
                  label: "Heure",
                  value: formatTime(event.eventTime) || "Horaire à confirmer",
                },
                ...(event.location
                  ? [{ label: "Lieu", value: event.location }]
                  : []),
                {
                  label: "Entrée",
                  value: "Libre et ouverte à tous",
                  hint: "Aucune inscription n'est requise pour participer.",
                },
                {
                  label: "Accès",
                  value: `${site.address}`,
                  hint: "Écrivez-nous si vous avez besoin d'être guidé jusqu'à l'église.",
                },
              ]}
            />
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/vie-de-leglise/ou-nous-trouver"
                className="inline-flex min-h-11 items-center border border-ccjv-ink px-6 font-sans text-[0.9375rem] font-medium transition-colors duration-[250ms] hover:border-ccjv-green hover:text-ccjv-green"
              >
                Planifier ma visite
              </Link>
              <Link
                href={site.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center font-sans text-[0.9375rem] font-medium text-ccjv-green underline decoration-1 underline-offset-4"
              >
                Poser une question →
              </Link>
            </div>
          </div>
        </div>
      }
      gallery={
        event.gallery && event.gallery.length > 0 ? (
          <>
            <h2 className="mb-10 font-sans text-[0.72rem] font-semibold tracking-[0.2em] text-ccjv-green uppercase">
              En images
            </h2>
            <PhotoGallery variant="mosaic" images={event.gallery} />
          </>
        ) : undefined
      }
      related={
        upcomingRead.status === "unreachable" ? (
          <ContentUnavailable resource="Les autres rendez-vous à venir" />
        ) : related.length > 0 ? (
          <>
            <h2 className="mb-8 font-sans text-[0.72rem] font-semibold tracking-[0.2em] text-ccjv-green uppercase">
              Autres rendez-vous à venir
            </h2>
            <div className="border-t border-ccjv-line">
              {related.map((item) => (
                <Link
                  key={item.id}
                  href={`/vie-de-leglise/evenements/${item.slug}`}
                  className="block transition-opacity duration-[250ms] hover:opacity-80"
                >
                  <EventRow
                    event={item}
                    departmentName={
                      item.departmentId
                        ? departmentNames[item.departmentId]
                        : undefined
                    }
                  />
                </Link>
              ))}
            </div>
          </>
        ) : undefined
      }
    />
  );
}
