import Link from "next/link";
import { notFound } from "next/navigation";
import { HeroPhoto } from "@/components/composition/HeroPhoto";
import { EventPage } from "@/components/archetypes/EventPage";
import { Prose } from "@/components/editorial/Prose";
import { KeyFacts } from "@/components/editorial/KeyFacts";
import { PhotoGallery } from "@/components/editorial/PhotoGallery";
import { Badge } from "@/components/ui/Badge";
import { EventRow } from "@/features/events/EventRow";
import { events, getEventBySlug, upcomingEvents } from "@/data/mock/events";
import { getDepartmentName } from "@/data/mock/departments";
import { site } from "@/data/mock/site";
import { formatLongDate, formatTime } from "@/lib/utils";
import { pageMetadata } from "@/lib/seo";

/** Pré-génère une page par événement (aucune requête au runtime). */
export function generateStaticParams() {
  return events.map((event) => ({ slug: event.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = getEventBySlug(slug);
  if (!event) return {};

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
  const event = getEventBySlug(slug);
  if (!event) notFound();

  const departmentName = getDepartmentName(event.departmentId);
  const isUpcoming = event.status === "UPCOMING";

  const related = upcomingEvents
    .filter((item) => item.id !== event.id)
    .slice(0, 3);

  return (
    <EventPage
      hero={
        <HeroPhoto
          overline={departmentName ?? "Vie de l'Église"}
          title={event.title}
          image={event.bannerImage ?? event.imageUrl ?? "/media/ccjv-08.jpeg"}
          caption={[
            formatLongDate(event.eventDate),
            event.location,
          ]
            .filter(Boolean)
            .join(" · ")}
          height="tall"
        />
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
                { label: "Lieu", value: event.location ?? "Lubumbashi" },
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
        related.length > 0 ? (
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
                    departmentName={getDepartmentName(item.departmentId)}
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
