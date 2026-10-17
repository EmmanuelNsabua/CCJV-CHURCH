/**
 * Utilitaires légers et sans dépendance.
 */

export function cn(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * État chronologique d'un événement, calculé depuis `endDate` (ou `eventDate`).
 * Si la date de fin est supérieure ou égale à aujourd'hui, l'événement est UPCOMING.
 */
export function getEventStatus(
  eventDate: string,
  endDate?: string | null,
  now: Date = new Date(),
): "UPCOMING" | "ARCHIVED" {
  const today = now.toISOString().slice(0, 10);
  const effectiveEnd = endDate && endDate.trim().length > 0 ? endDate : eventDate;
  return effectiveEnd >= today ? "UPCOMING" : "ARCHIVED";
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

/** Génère un slug propre à partir d'un texte. */
export function slugify(text: string): string {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");
}

/**
 * Calcule et affiche le délai relatif en français pour les publications :
 * « Maintenant », « Il y a 1 min », « Il y a 2 heures », « Il y a 3 jours »…
 */
export function formatRelativeTime(
  dateInput: string | Date,
  now: Date = new Date(),
): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return "";

  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) {
    return "Maintenant";
  }

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return `Il y a ${diffMin} min`;
  }

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) {
    return diffHours === 1 ? "Il y a 1 heure" : `Il y a ${diffHours} heures`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) {
    return diffDays === 1 ? "Il y a 1 jour" : `Il y a ${diffDays} jours`;
  }

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) {
    return diffMonths === 1 ? "Il y a 1 mois" : `Il y a ${diffMonths} mois`;
  }

  const diffYears = Math.floor(diffDays / 365);
  return diffYears === 1 ? "Il y a 1 an" : `Il y a ${diffYears} ans`;
}


