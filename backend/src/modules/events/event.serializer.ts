import type { Event } from "@/domain/entities";

/**
 * Représentation API d'un événement (Envent).
 *
 * Expose les champs normalisés :
 * - `startDate` et `endDate` (avec maintien de `eventDate` pour rétrocompatibilité)
 * - `startTime` et `endTime` (avec maintien de `eventTime` pour rétrocompatibilité)
 * - `status` : "DRAFT" | "PUBLISHED" | "CANCELLED"
 * - `location`, `imageUrl`, etc.
 */
export interface EventDto {
  id: string;
  title: string;
  slug: string;
  description?: string;
  startDate: string;
  eventDate: string;
  endDate: string;
  startTime?: string;
  eventTime?: string;
  endTime?: string;
  location?: string;
  imageMediaId?: string;
  bannerMediaId?: string;
  imageUrl?: string;
  departmentId: string | null;
  status: string;
  excerpt?: string;
  bannerImage?: string;
  gallery?: string[];
  practicalInfo?: string[];
}

function toShortTime(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  return /^\d{2}:\d{2}/.test(value) ? value.slice(0, 5) : value;
}

export function toEventDto(event: Event): EventDto {
  const startDate = event.startDate ?? event.eventDate;
  const endDate = event.endDate ?? startDate;
  const startTime = toShortTime(event.startTime ?? event.eventTime);
  const endTime = toShortTime(event.endTime);

  return {
    id: event.id,
    title: event.title,
    slug: event.slug,
    description: event.description ?? undefined,
    startDate,
    eventDate: startDate,
    endDate,
    startTime,
    eventTime: startTime,
    endTime,
    location: event.location ?? undefined,
    imageMediaId: event.imageMediaId ?? undefined,
    bannerMediaId: event.bannerMediaId ?? undefined,
    imageUrl: event.imageUrl ?? undefined,
    departmentId: event.departmentId,
    status: event.status,
    excerpt: event.excerpt ?? undefined,
    bannerImage: event.bannerImageUrl ?? undefined,
    gallery: event.galleryUrls && event.galleryUrls.length > 0 ? event.galleryUrls : undefined,
    practicalInfo: event.practicalInfo ?? undefined,
  };
}
