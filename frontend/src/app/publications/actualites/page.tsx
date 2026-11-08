import { ActualitesView } from "@/features/actualites/ActualitesView";
import { getPublications, getEvents, readOrUnavailable } from "@/lib/api/endpoints";
import { pageMetadata } from "@/lib/seo";
import type { PublicationRecord, Event } from "@/lib/api/types";

export const metadata = pageMetadata({
  title: "Actualités",
  description:
    "Suivez nos actualités quotidiennes au Centre Chrétien Jésus ma Vie : culte, vie communautaire, annonces et rendez-vous à Lubumbashi.",
  path: "/publications/actualites",
});

export default async function ActualitesPage() {
  const [pubsRead, eventsRead] = await Promise.all([
    readOrUnavailable((options) => getPublications({ limit: 100 }, options)),
    readOrUnavailable((options) => getEvents({ limit: 20 }, options)),
  ]);

  const rawPubs = pubsRead.status === "ok" ? pubsRead.data : [];

  // Tri rigoureux chronologique décroissant (les parutions les plus récentes en tête)
  const publications: PublicationRecord[] = [...rawPubs].sort((a, b) => {
    const timeA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const timeB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return timeB - timeA;
  });

  // Événements à venir : filtre sur date >= aujourd'hui et tri par ordre chronologique croissant
  const nowIso = new Date().toISOString().slice(0, 10);
  const rawEvents = eventsRead.status === "ok" ? eventsRead.data : [];

  const upcomingEvents: Event[] = rawEvents
    .filter((e) => {
      const eventDate = e.startDate?.slice(0, 10) || e.eventDate?.slice(0, 10);
      return !eventDate || eventDate >= nowIso || e.status === "UPCOMING";
    })
    .sort((a, b) => {
      const dateA = a.startDate?.slice(0, 10) || a.eventDate?.slice(0, 10) || "";
      const dateB = b.startDate?.slice(0, 10) || b.eventDate?.slice(0, 10) || "";
      return dateA.localeCompare(dateB);
    })
    .slice(0, 3);

  return (
    <ActualitesView
      publications={publications}
      upcomingEvents={upcomingEvents}
    />
  );
}
