import type { Event, EventStatus } from "@/domain/entities";

/**
 * Représentation API d'un événement.
 *
 * Calquée sur `frontend/src/types/index.ts` (`interface Event`) : `imageUrl`,
 * `bannerImage`, `gallery`, `eventDate`, `eventTime`, `practicalInfo` et
 * `status` portent exactement les noms attendus (IMPLEMENTATION_SPEC §7).
 *
 * `departmentId` est conservé même à `null` : le frontend distingue
 * explicitement « rattaché à aucun département » (événement général) d'un champ
 * absent, et affiche « Toute l'église » dans ce cas.
 */
export interface EventDto {
  id: string;
  title: string;
  slug: string;
  description?: string;
  /** Date ISO `YYYY-MM-DD`. */
  eventDate: string;
  /** Heure `HH:MM`. */
  eventTime?: string;
  location?: string;
  imageUrl?: string;
  departmentId: string | null;
  /** Toujours calculé depuis `eventDate`, jamais stocké. */
  status: EventStatus;
  excerpt?: string;
  /** Ex-`bannerImageUrl` : bandeau de la fiche événement. */
  bannerImage?: string;
  gallery?: string[];
  practicalInfo?: string[];
}

/**
 * `time` PostgreSQL revient sous la forme `HH:MM:SS` ; le contrat frontend
 * attend `HH:MM` (`formatTime` du frontend concatène les deux premiers
 * segments, mais la liste d'événements affiche la valeur brute). On tronque
 * donc les secondes, toujours nulles pour un horaire de culte.
 */
function toShortTime(value: string | null): string | undefined {
  if (value === null) return undefined;
  return /^\d{2}:\d{2}/.test(value) ? value.slice(0, 5) : value;
}

export function toEventDto(event: Event): EventDto {
  return {
    id: event.id,
    title: event.title,
    slug: event.slug,
    description: event.description ?? undefined,
    eventDate: event.eventDate,
    eventTime: toShortTime(event.eventTime),
    location: event.location ?? undefined,
    imageUrl: event.imageUrl ?? undefined,
    departmentId: event.departmentId,
    status: event.status,
    excerpt: event.excerpt ?? undefined,
    bannerImage: event.bannerImageUrl ?? undefined,
    gallery: event.galleryUrls.length > 0 ? event.galleryUrls : undefined,
    practicalInfo: event.practicalInfo ?? undefined,
  };
}
