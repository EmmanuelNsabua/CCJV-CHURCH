import { pageMetadata } from "@/lib/seo";
import {
  getEvents,
  getPublications,
  readOrUnavailable,
} from "@/lib/api/endpoints";
import { ActualitesView } from "@/features/actualites/ActualitesView";
import type { Event, PublicationRecord } from "@/lib/api";

export const metadata = pageMetadata({
  title: "Actualités",
  description:
    "Suivez nos actualités quotidiennes au Centre Chrétien Jésus ma Vie : cultes, événements, activités des départements Presse et Ecodim.",
  path: "/publications/actualites",
});

export const revalidate = 60;

export default async function ActualitesPage() {
  const [publicationsRead, eventsRead] = await Promise.all([
    readOrUnavailable((options) => getPublications({ limit: 100 }, options)),
    readOrUnavailable((options) => getEvents({ limit: 50 }, options)),
  ]);

  const publications: PublicationRecord[] =
    publicationsRead.status === "ok" ? publicationsRead.data : [];

  // Tri par date décroissante pour avoir les plus récentes en tête
  const sortedPublications = [...publications].sort((a, b) => {
    const timeA = new Date(a.publishedAt || 0).getTime();
    const timeB = new Date(b.publishedAt || 0).getTime();
    return timeB - timeA;
  });

  // Les 3 plus récentes pour la section À la une
  const featured = sortedPublications.slice(0, 3);
  // Les suivantes pour la grille des actualités
  const archives = sortedPublications.slice(3);

  // Événements à venir non dépassés (max 3 les plus proches)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const rawEvents: Event[] = eventsRead.status === "ok" ? eventsRead.data : [];
  const upcomingEvents = rawEvents
    .filter((evt) => {
      const d = new Date(evt.startDate || evt.eventDate);
      return !isNaN(d.getTime()) && d >= today;
    })
    .sort((a, b) => {
      const timeA = new Date(a.startDate || a.eventDate).getTime();
      const timeB = new Date(b.startDate || b.eventDate).getTime();
      return timeA - timeB;
    })
    .slice(0, 3);

  return (
    <ActualitesView
      featuredPublications={featured}
      archivePublications={archives}
      upcomingEvents={upcomingEvents}
    />
  );
}

