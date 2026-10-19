/**
 * Construction du catalogue de la Médiathèque.
 *
 * Module **pur et sans dépendance** : il ne lit ni le réseau ni le DOM, et se
 * vérifie donc isolément (voir la note de test du compte rendu).
 *
 * ## D'où viennent les médias
 *
 * Uniquement de sources **publiques déjà exposées par l'API**, sans nouvel
 * endpoint et sans ouvrir le registre des médias (`/api/v1/media` est
 * strictement administratif — `docs/018` §6.2) :
 *
 * | Source | Champ réel | Nature |
 * | --- | --- | --- |
 * | `GET /departments` | `gallery[]` | photographies |
 * | `GET /events` | `gallery[]` | photographies, datées |
 * | `GET /publications?type=PHOTO` | `coverImage` / `contentUrl` | photographies, datées |
 * | `GET /publications?type=VIDEO` | `contentUrl` | vidéos, datées |
 *
 * Les **enseignements** sont hors périmètre : une publication vidéo de rubrique
 * `ENSEIGNEMENT` est écartée, comme toute prédication.
 *
 * ## Ce que le catalogue ne fait pas
 *
 * - il n'invente aucun média : une URL absente écarte l'entrée ;
 * - il ne déduplique pas « à peu près » : l'identité d'un média est son URL
 *   exacte, car une même photographie est souvent rattachée à plusieurs
 *   contenus (un événement et un département, par exemple). L'ordre de
 *   découverte fait donc office de priorité : les sources **datées** sont lues
 *   avant les galeries sans date, si bien qu'une même photo garde la provenance
 *   la plus informative ;
 * - il ne fabrique pas de métadonnées : une galerie de département n'a ni titre
 *   ni date par image, l'entrée porte donc le nom du département et **aucune
 *   date**.
 */

/** Nature du média — seules deux natures existent dans ce catalogue. */
export type MediaKind = "photo" | "video";

/** Une entrée du catalogue. Sérialisable : elle traverse la frontière RSC. */
export interface MediaItem {
  /** Clé stable : l'URL du média, unique après déduplication. */
  id: string;
  kind: MediaKind;
  /** Source ouverte dans la visionneuse (image ou fichier vidéo). */
  src: string;
  /** Affiche de la tuile. `null` pour une vidéo sans miniature réelle. */
  thumbnailUrl: string | null;
  /** Provenance réelle et lisible (« Culte dominical », « Les Serviteurs »…). */
  origin: string;
  /** Date ISO quand la source en porte une ; `null` sinon. */
  date: string | null;
  /** Texte alternatif : la provenance, jamais une description inventée. */
  alt: string;
  /** Identifiant YouTube quand la vidéo est réellement hébergée là. */
  youtubeId: string | null;
}

/** Département minimal attendu (issu de `GET /departments`). */
export interface CatalogueDepartment {
  name: string;
  gallery?: readonly string[];
}

/** Événement minimal attendu (issu de `GET /events`). */
export interface CatalogueEvent {
  title: string;
  eventDate: string;
  gallery?: readonly string[];
}

/** Publication minimale attendue (issue de `GET /publications`). */
export interface CataloguePublication {
  title: string;
  type: string;
  category?: string;
  contentUrl?: string;
  coverImage?: string;
  publishedAt: string;
}

export interface CatalogueInput {
  departments: readonly CatalogueDepartment[];
  events: readonly CatalogueEvent[];
  photoPublications: readonly CataloguePublication[];
  videoPublications: readonly CataloguePublication[];
}

/** Rubrique dont les médias n'appartiennent pas à la Médiathèque. */
const EXCLUDED_CATEGORY = "ENSEIGNEMENT";

function isHttpUrl(value: string | undefined | null): value is string {
  return typeof value === "string" && /^https?:\/\//i.test(value.trim());
}

/** Identifiant YouTube d'une URL, ou `null` si elle n'en porte pas. */
export function youTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([A-Za-z0-9_-]{11})/,
  );
  return match?.[1] ?? null;
}

/** Date comparable, ou `null`. Les dates `AAAA-MM-JJ` sont acceptées. */
function normalizeDate(value: string | undefined | null): string | null {
  if (!value) return null;
  const iso = value.trim();
  return /^\d{4}-\d{2}-\d{2}/.test(iso) ? iso : null;
}

/**
 * Construit le catalogue : déduplication par URL, puis ordre déterministe.
 *
 * Ordre retenu — le plus récent d'abord, puis les entrées sans date dans
 * l'ordre de découverte (événements, puis départements, puis publications) :
 * la même entrée d'API produit toujours le même catalogue.
 */
export function buildMediaCatalogue(input: CatalogueInput): MediaItem[] {
  const byUrl = new Map<string, MediaItem>();

  const push = (item: MediaItem): void => {
    if (byUrl.has(item.id)) return;
    byUrl.set(item.id, item);
  };

  // 1. Illustrations de publications (photographies) — les plus récentes en tête.
  for (const publication of input.photoPublications) {
    const url = publication.coverImage ?? publication.contentUrl;
    if (!isHttpUrl(url)) continue;

    push({
      id: url,
      kind: "photo",
      src: url,
      thumbnailUrl: url,
      origin: publication.title,
      date: normalizeDate(publication.publishedAt),
      alt: publication.title,
      youtubeId: null,
    });
  }

  // 2. Vidéos publiées, hors enseignements (hors périmètre de la Médiathèque).
  for (const publication of input.videoPublications) {
    if (publication.category === EXCLUDED_CATEGORY) continue;
    const url = publication.contentUrl;
    if (!isHttpUrl(url)) continue;

    push({
      id: url,
      kind: "video",
      src: url,
      /*
       * Le modèle ne porte aucune affiche de vidéo : la tuile reste donc un
       * aplat sombre avec un repère de lecture, jamais une image d'emprunt.
       */
      thumbnailUrl: isHttpUrl(publication.coverImage)
        ? (publication.coverImage as string)
        : null,
      origin: publication.title,
      date: normalizeDate(publication.publishedAt),
      alt: publication.title,
      youtubeId: youTubeId(url),
    });
  }

  // 3. Galeries d'événements — photographies datées.
  const eventsByDate = [...input.events].sort((a, b) =>
    b.eventDate.localeCompare(a.eventDate),
  );
  for (const event of eventsByDate) {
    for (const url of event.gallery ?? []) {
      if (!isHttpUrl(url)) continue;
      push({
        id: url,
        kind: "photo",
        src: url,
        thumbnailUrl: url,
        origin: event.title,
        date: normalizeDate(event.eventDate),
        alt: event.title,
        youtubeId: null,
      });
    }
  }

  // 4. Galeries de départements — photographies sans date propre.
  for (const department of input.departments) {
    for (const url of department.gallery ?? []) {
      if (!isHttpUrl(url)) continue;
      push({
        id: url,
        kind: "photo",
        src: url,
        thumbnailUrl: url,
        origin: department.name,
        date: null,
        alt: department.name,
        youtubeId: null,
      });
    }
  }

  /*
   * Tri final : les entrées datées d'abord, de la plus récente à la plus
   * ancienne ; les entrées sans date ensuite, dans l'ordre de découverte. Le
   * tri est stable, donc deux rendus successifs donnent le même catalogue.
   */
  const items = [...byUrl.values()];
  const dated = items.filter((item) => item.date !== null);
  const undated = items.filter((item) => item.date === null);

  dated.sort((a, b) => (b.date as string).localeCompare(a.date as string));

  return [...dated, ...undated];
}

/** Compte par nature, pour l'en-tête compact. */
export function countByKind(items: readonly MediaItem[]): {
  photos: number;
  videos: number;
} {
  let photos = 0;
  let videos = 0;

  for (const item of items) {
    if (item.kind === "video") videos += 1;
    else photos += 1;
  }

  return { photos, videos };
}
