/**
 * Utilitaires légers et sans dépendance.
 */

export function cn(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * État métier d'un événement, calculé depuis `eventDate` (jamais persisté).
 * Conforme à docs/006 (suppression de `is_archived`).
 */
export function getEventStatus(
  eventDate: string,
  now: Date = new Date(),
): "UPCOMING" | "ARCHIVED" {
  const today = now.toISOString().slice(0, 10);
  return eventDate >= today ? "UPCOMING" : "ARCHIVED";
}

function toDate(iso: string): Date {
  return new Date(`${iso}T00:00:00`);
}

export function formatLongDate(
  iso: string,
  locale: string = "fr-FR",
): string {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(toDate(iso));
}

export function formatDay(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit" }).format(
    toDate(iso),
  );
}

export function formatMonthShort(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", { month: "short" })
    .format(toDate(iso))
    .replace(".", "")
    .toUpperCase();
}

export function formatYear(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", { year: "numeric" }).format(
    toDate(iso),
  );
}

/** Normalise une heure de type "09:00" en "09h00". */
export function formatTime(time?: string | null): string {
  if (!time) return "";
  const [h, m] = time.split(":");
  return `${h}h${m ?? ""}`;
}

/** Construit une date ISO relative à aujourd'hui (utile pour les mocks). */
export function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Extrait l'identifiant d'une vidéo YouTube.
 * Gère `watch?v=`, `youtu.be/`, `embed/`, `shorts/` et `live/`.
 */
export function getYouTubeId(url?: string | null): string | undefined {
  if (!url) return undefined;
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([A-Za-z0-9_-]{11})/,
  );
  return match?.[1];
}

/** Vignette YouTube haute définition (repli géré par `YouTubeThumb`). */
export function getYouTubeThumbnail(
  url?: string | null,
  quality: "max" | "hq" = "max",
): string | undefined {
  const id = getYouTubeId(url);
  if (!id) return undefined;
  return quality === "max"
    ? `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`
    : `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}
