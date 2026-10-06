/**
 * Endpoints de l'API publique CCJV (`/api/v1`).
 *
 * Une fonction par ressource. Toutes sont **tolérantes aux pannes** : elles
 * renvoient un tableau vide (collection) ou `null` (ressource unique) quand
 * l'API est injoignable, de sorte qu'une page puisse toujours être rendue.
 *
 * Les chemins restent relatifs à `/api/v1` : c'est `client.ts` qui porte la
 * version d'API et l'URL de base.
 */

import { apiFetch, logApiIssue, withQuery } from "./client";
import type {
  CollectionResponse,
  CommunityFace,
  Department,
  EditablePage,
  Event,
  EventStatus,
  Leader,
  PublicationCategory,
  PublicationRecord,
  PublicationType,
  ScheduleEntry,
  Scripture,
  SiteSettings,
  SocialLink,
  Testimony,
} from "./types";

/** Filtres de `GET /events`. */
export interface EventsQuery {
  status?: EventStatus;
  departmentId?: string;
  page?: number;
  limit?: number;
  /** Colonne de tri (`event_date`, `-event_date`, `created_at`…). */
  sort?: string;
}

/** Filtres de `GET /publications`. */
export interface PublicationsQuery {
  type?: PublicationType;
  category?: PublicationCategory;
  page?: number;
  limit?: number;
  /** Colonne de tri (`published_at`, `-published_at`, `created_at`…). */
  sort?: string;
}

/**
 * Taille de page des collections de référence (départements, responsables,
 * témoignages…). L'API plafonne `limit` à 100 ; ces ensembles sont de toute
 * façon trop petits pour justifier une pagination côté site public.
 */
const REFERENCE_LIMIT = 100;

/* -------------------------------------------------------------------------- */
/* Utilitaires internes                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Lit une collection paginée.
 *
 * Tolère un tableau nu : un proxy qui aplatirait l'enveloppe `{ data, meta }`
 * ne doit pas vider les pages du site. Une charge malformée donne un tableau
 * vide, jamais une exception de rendu.
 */
function readCollection<T>(
  payload: CollectionResponse<T> | T[] | null,
): T[] {
  if (payload === null) return [];
  if (Array.isArray(payload)) return payload;
  return Array.isArray(payload.data) ? payload.data : [];
}

/** Garde de type : objet non nul, non tableau. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Écarte les entrées dépourvues de portrait.
 *
 * L'API renvoie `photo: string | null`. Les composants qui affichent ces
 * entrées (`CommunityFaces`, portraits de témoignages) exigent une source
 * d'image : une entrée sans portrait ne peut pas être rendue telle quelle, et
 * inventer une photo à la place d'une personne serait pire que de l'omettre.
 * L'omission est donc journalisée, jamais silencieuse.
 */
function keepWithPortrait<T extends { id: string; photo: string | null }>(
  items: T[],
  resource: string,
): Array<T & { photo: string }> {
  const kept: Array<T & { photo: string }> = [];

  for (const item of items) {
    if (typeof item.photo === "string" && item.photo.trim() !== "") {
      kept.push({ ...item, photo: item.photo });
      continue;
    }
    logApiIssue(
      `${resource} ${item.id} ignoré : aucun portrait rattaché côté API`,
    );
  }

  return kept;
}

/* -------------------------------------------------------------------------- */
/* Départements                                                               */
/* -------------------------------------------------------------------------- */

/** Départements et ministères de l'église, dans l'ordre de l'API. */
export async function getDepartments(): Promise<Department[]> {
  const payload = await apiFetch<
    CollectionResponse<Department> | Department[]
  >(withQuery("/departments", { limit: REFERENCE_LIMIT }));

  return readCollection(payload);
}

/** Fiche d'un département, résolue par slug (ou par UUID). */
export async function getDepartment(slug: string): Promise<Department | null> {
  return apiFetch<Department>(`/departments/${encodeURIComponent(slug)}`);
}

/* -------------------------------------------------------------------------- */
/* Événements                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Événements à venir ou passés.
 *
 * `status` est **calculé par l'API** depuis `eventDate` : le frontend ne
 * recalcule jamais l'état d'un événement reçu de l'API.
 */
export async function getEvents(query: EventsQuery = {}): Promise<Event[]> {
  const payload = await apiFetch<CollectionResponse<Event> | Event[]>(
    withQuery("/events", {
      status: query.status,
      departmentId: query.departmentId,
      page: query.page,
      limit: query.limit,
      sort: query.sort,
    }),
  );

  return readCollection(payload);
}

/** Fiche d'un événement, résolue par slug (ou par UUID). */
export async function getEvent(slug: string): Promise<Event | null> {
  return apiFetch<Event>(`/events/${encodeURIComponent(slug)}`);
}

/* -------------------------------------------------------------------------- */
/* Publications                                                               */
/* -------------------------------------------------------------------------- */

/** Publications publiées, filtrées par type et/ou rubrique éditoriale. */
export async function getPublications(
  query: PublicationsQuery = {},
): Promise<PublicationRecord[]> {
  const payload = await apiFetch<
    CollectionResponse<PublicationRecord> | PublicationRecord[]
  >(
    withQuery("/publications", {
      type: query.type,
      category: query.category,
      page: query.page,
      limit: query.limit,
      sort: query.sort,
    }),
  );

  return readCollection(payload);
}

/** Fiche d'une publication, résolue par slug (ou par UUID). */
export async function getPublication(
  slug: string,
): Promise<PublicationRecord | null> {
  return apiFetch<PublicationRecord>(
    `/publications/${encodeURIComponent(slug)}`,
  );
}

/* -------------------------------------------------------------------------- */
/* Responsables, témoignages, visages                                         */
/* -------------------------------------------------------------------------- */

/** Responsables et serviteurs, dans l'ordre défini par le back-office. */
export async function getLeaders(): Promise<Leader[]> {
  const payload = await apiFetch<CollectionResponse<Leader> | Leader[]>(
    withQuery("/leaders", { limit: REFERENCE_LIMIT }),
  );

  return readCollection(payload);
}

type TestimonyPayload = Omit<Testimony, "photo"> & { photo: string | null };

/** Témoignages publiés (les entrées sans portrait sont écartées). */
export async function getTestimonies(): Promise<Testimony[]> {
  const payload = await apiFetch<
    CollectionResponse<TestimonyPayload> | TestimonyPayload[]
  >(withQuery("/testimonies", { limit: REFERENCE_LIMIT }));

  return keepWithPortrait(readCollection(payload), "témoignage");
}

type CommunityFacePayload = Omit<CommunityFace, "photo"> & {
  photo: string | null;
};

/** Visages de la communauté (les entrées sans portrait sont écartées). */
export async function getCommunityFaces(): Promise<CommunityFace[]> {
  const payload = await apiFetch<
    CollectionResponse<CommunityFacePayload> | CommunityFacePayload[]
  >(withQuery("/community-faces", { limit: REFERENCE_LIMIT }));

  return keepWithPortrait(readCollection(payload), "visage de la communauté");
}

/* -------------------------------------------------------------------------- */
/* Rythme hebdomadaire et versets                                             */
/* -------------------------------------------------------------------------- */

/**
 * Rythme de la semaine, dans l'ordre défini par le back-office.
 *
 * Aucune *query* : `GET /schedule` est une liste bornée non paginée, dont le
 * repository n'a pas de `ListOptions`. La *query* y est validée par un objet
 * strict, donc `?limit=…` — auparavant accepté puis ignoré — est désormais
 * refusé en `400 VALIDATION_ERROR`.
 */
export async function getSchedule(): Promise<ScheduleEntry[]> {
  const payload = await apiFetch<
    CollectionResponse<ScheduleEntry> | ScheduleEntry[]
  >("/schedule");

  return readCollection(payload);
}

/**
 * Tous les versets éditoriaux.
 *
 * Comme `getSchedule` : `GET /scriptures` ne reconnaît **aucun** paramètre, un
 * `?limit=…` y produirait un `400`.
 */
export async function getScriptures(): Promise<Scripture[]> {
  const payload = await apiFetch<CollectionResponse<Scripture> | Scripture[]>(
    "/scriptures",
  );

  return readCollection(payload);
}

/** Verset identifié par sa clé éditoriale (`rassemblement`, `parole`…). */
export async function getScripture(key: string): Promise<Scripture | null> {
  return apiFetch<Scripture>(`/scriptures/${encodeURIComponent(key)}`);
}

/* -------------------------------------------------------------------------- */
/* Réglages et pages éditables                                                */
/* -------------------------------------------------------------------------- */

/**
 * Réglages institutionnels : scalaires (`settings`) et liens sociaux ordonnés.
 *
 * La forme est revérifiée avant d'être rendue : un objet vide reste exploitable
 * par les pages, une charge inattendue ne les fait pas planter.
 */
export async function getSettings(): Promise<SiteSettings | null> {
  const payload = await apiFetch<SiteSettings>("/settings");
  if (!isRecord(payload)) return null;

  const rawSettings = isRecord(payload.settings) ? payload.settings : {};
  const settings: Record<string, string> = {};
  for (const [key, value] of Object.entries(rawSettings)) {
    if (typeof value === "string") settings[key] = value;
  }

  const socialLinks: SocialLink[] = Array.isArray(payload.socialLinks)
    ? payload.socialLinks.flatMap((link) => {
        if (!isRecord(link)) return [];
        const { label, href } = link;
        return typeof label === "string" && typeof href === "string"
          ? [{ label, href }]
          : [];
      })
    : [];

  return { settings, socialLinks };
}

/**
 * Contenu éditable d'une page (`ACCUEIL`, `QUI_SOMMES_NOUS`…).
 *
 * `content` est un objet de champs textuels nommés ; il est normalisé en objet
 * vide s'il est absent, pour que les appelants n'aient jamais à le tester.
 */
export async function getPage(pageKey: string): Promise<EditablePage | null> {
  const payload = await apiFetch<EditablePage | null>(
    `/pages/${encodeURIComponent(pageKey)}`,
  );
  if (!isRecord(payload)) return null;

  const content = isRecord(payload.content) ? payload.content : {};

  return {
    id: typeof payload.id === "string" ? payload.id : pageKey,
    pageKey: typeof payload.pageKey === "string" ? payload.pageKey : pageKey,
    content,
    updatedBy: typeof payload.updatedBy === "string" ? payload.updatedBy : null,
    createdAt: typeof payload.createdAt === "string" ? payload.createdAt : "",
    updatedAt: typeof payload.updatedAt === "string" ? payload.updatedAt : "",
  };
}
