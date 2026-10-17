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

import { apiFetch, apiFetchOrThrow, logApiIssue, withQuery } from "./client";
import type { ApiFetchOptions } from "./client";
import { getSupabaseClient } from "@/lib/supabase/client";
import type {
  AdminMediaItem,
  AdminProfile,
  CollectionResponse,
  CommunityFace,
  Department,
  EditablePage,
  Event,
  EventLifecycleStatus,
  EventStatus,
  Leader,
  PublicationCategory,
  PublicationRecord,
  PublicationType,
  Resource,
  CreateEventPayload,
  UpdateEventPayload,
  CreateResourcePayload,
  UpdateResourcePayload,
  ScheduleEntry,
  Scripture,
  SiteSettings,
  SocialLink,
  Testimony,
  DepartmentActivityItem,
  DepartmentArchive,
  AdminTestimony,
  TestimonyStatus,
  BiblicalReferenceInputPayload,
  BiblicalReferenceRecord,
  CreateTeachingPayload,
  EnseignementRecord,
  TeachingMediaInputPayload,
  TeachingMediaRecord,
  TeachingStatus,
  UpdateTeachingPayload,
} from "./types";

/** Filtres de `GET /events`. */
export interface EventsQuery {
  status?: EventStatus | EventLifecycleStatus;
  view?: "UPCOMING" | "ARCHIVED" | "ALL";
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
/*  État d'une lecture publique : « vide » et « en panne » sont distincts      */
/* -------------------------------------------------------------------------- */

/** Options communes à toutes les lectures publiques de ce module. */
export interface PublicReadOptions {
  /**
   * Appelé quand la lecture échoue **sans lever** : API injoignable, statut
   * non-2xx, délai dépassé, corps illisible.
   *
   * Sans ce rappel, un échec et une absence de contenu seraient indiscernables :
   * `apiFetch` renvoie la même collection vide dans les deux cas. Une page qui
   * afficherait « aucun contenu » après une panne présenterait une erreur comme
   * un fait éditorial — et c'est exactement ce que la règle « aucune substitution
   * silencieuse » interdit.
   */
  onFailure?: ApiFetchOptions["onFailure"];
}

/**
 * Résultat d'une lecture publique.
 *
 * `unreachable` ne veut pas dire « rien à afficher » : cela veut dire « on n'a
 * pas pu savoir ». Les deux états mènent à deux présentations différentes.
 */
export type ReadResult<T> =
  | { status: "ok"; data: T }
  | { status: "unreachable" };

/**
 * Exécute une lecture publique en **distinguant** l'échec de l'absence.
 *
 * ```ts
 * const resultat = await readOrUnavailable((o) => getPublications({ limit: 3 }, o));
 * if (resultat.status === "unreachable") return <ContentUnavailable />;
 * const items = resultat.data;   // éventuellement vide — et c'est légitime
 * ```
 *
 * La lecture reste **tolérante** (elle ne lève pas) : c'est la seule façon de
 * garantir qu'une panne d'API ne produise jamais une page en erreur 500. Ce qui
 * change, c'est que la page **sait** laquelle des deux situations elle présente.
 */
export async function readOrUnavailable<T>(
  lire: (options: PublicReadOptions) => Promise<T>,
): Promise<ReadResult<T>> {
  let echec = false;

  const data = await lire({
    onFailure: () => {
      echec = true;
    },
  });

  return echec ? { status: "unreachable" } : { status: "ok", data };
}

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
export async function getDepartments(
  options: PublicReadOptions = {},
): Promise<Department[]> {
  const payload = await apiFetch<
    CollectionResponse<Department> | Department[]
  >(withQuery("/departments", { limit: REFERENCE_LIMIT }), options);

  return readCollection(payload);
}

/** Fiche d'un département, résolue par slug (ou par UUID). */
export async function getDepartment(
  slug: string,
  options: PublicReadOptions = {},
): Promise<Department | null> {
  return apiFetch<Department>(
    `/departments/${encodeURIComponent(slug)}`,
    options,
  );
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
export async function getEvents(
  query: EventsQuery = {},
  options: PublicReadOptions = {},
): Promise<Event[]> {
  const payload = await apiFetch<CollectionResponse<Event> | Event[]>(
    withQuery("/events", {
      status: query.status,
      view: query.view,
      departmentId: query.departmentId,
      page: query.page,
      limit: query.limit,
      sort: query.sort,
    }),
    options,
  );

  return readCollection(payload);
}

/** Fiche d'un événement, résolue par slug (ou par UUID). */
export async function getEvent(
  slug: string,
  options: PublicReadOptions = {},
): Promise<Event | null> {
  return apiFetch<Event>(`/events/${encodeURIComponent(slug)}`, options);
}

/* -------------------------------------------------------------------------- */
/* Publications                                                               */
/* -------------------------------------------------------------------------- */

/** Publications publiées, filtrées par type et/ou rubrique éditoriale. */
export async function getPublications(
  query: PublicationsQuery = {},
  options: PublicReadOptions = {},
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
    options,
  );

  return readCollection(payload);
}

/** Fiche d'une publication, résolue par slug (ou par UUID). */
export async function getPublication(
  slug: string,
  options: PublicReadOptions = {},
): Promise<PublicationRecord | null> {
  return apiFetch<PublicationRecord>(
    `/publications/${encodeURIComponent(slug)}`,
    options,
  );
}

/**
 * Trois publications les plus récentes publiées mises en avant (`GET /publications/featured`).
 * Règle CCJV : Seules les 3 publications les plus récentes publiées sont affichées en vedette.
 */
export async function getFeaturedPublications(
  options: PublicReadOptions = {},
): Promise<PublicationRecord[]> {
  try {
    const payload = await apiFetch<{ data: PublicationRecord[] } | PublicationRecord[]>(
      "/publications/featured",
      options,
    );
    if (payload === null) return [];
    if (Array.isArray(payload)) return payload;
    return Array.isArray(payload.data) ? payload.data : [];
  } catch {
    return getPublications({ limit: 3 }, options);
  }
}

/**
 * Archives des publications publiées au-delà des 3 mises en avant (`GET /publications/archives`).
 * Toutes les autres publications restent publiées et consultables dans les archives publiques.
 */
export async function getArchivePublications(
  page: number = 1,
  limit: number = 20,
): Promise<CollectionResponse<PublicationRecord>> {
  try {
    const payload = await apiFetch<CollectionResponse<PublicationRecord>>(
      withQuery("/publications/archives", { page, limit }),
    );
    if (payload && Array.isArray(payload.data)) {
      return payload;
    }
  } catch {
    // repli
  }
  return {
    data: [],
    meta: { page, limit, total: 0, totalPages: 0 },
  };
}

/* -------------------------------------------------------------------------- */
/* Responsables, témoignages, visages                                         */
/* -------------------------------------------------------------------------- */

/** Responsables et serviteurs, dans l'ordre défini par le back-office. */
export async function getLeaders(
  options: PublicReadOptions = {},
): Promise<Leader[]> {
  const payload = await apiFetch<CollectionResponse<Leader> | Leader[]>(
    withQuery("/leaders", { limit: REFERENCE_LIMIT }),
    options,
  );

  return readCollection(payload);
}

type TestimonyPayload = Omit<Testimony, "photo"> & { photo: string | null };

/** Témoignages publiés (les entrées sans portrait sont écartées). */
export async function getTestimonies(
  options: PublicReadOptions = {},
): Promise<Testimony[]> {
  const payload = await apiFetch<
    CollectionResponse<TestimonyPayload> | TestimonyPayload[]
  >(withQuery("/testimonies", { limit: REFERENCE_LIMIT }), options);

  return keepWithPortrait(readCollection(payload), "témoignage");
}

type CommunityFacePayload = Omit<CommunityFace, "photo"> & {
  photo: string | null;
};

/** Visages de la communauté (les entrées sans portrait sont écartées). */
export async function getCommunityFaces(
  options: PublicReadOptions = {},
): Promise<CommunityFace[]> {
  const payload = await apiFetch<
    CollectionResponse<CommunityFacePayload> | CommunityFacePayload[]
  >(withQuery("/community-faces", { limit: REFERENCE_LIMIT }), options);

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
export async function getSchedule(
  options: PublicReadOptions = {},
): Promise<ScheduleEntry[]> {
  const payload = await apiFetch<
    CollectionResponse<ScheduleEntry> | ScheduleEntry[]
  >("/schedule", options);

  return readCollection(payload);
}

/**
 * Tous les versets éditoriaux.
 *
 * Comme `getSchedule` : `GET /scriptures` ne reconnaît **aucun** paramètre, un
 * `?limit=…` y produirait un `400`.
 */
export async function getScriptures(
  options: PublicReadOptions = {},
): Promise<Scripture[]> {
  const payload = await apiFetch<CollectionResponse<Scripture> | Scripture[]>(
    "/scriptures",
    options,
  );

  return readCollection(payload);
}

/** Verset identifié par sa clé éditoriale (`rassemblement`, `parole`…). */
export async function getScripture(
  key: string,
  options: PublicReadOptions = {},
): Promise<Scripture | null> {
  return apiFetch<Scripture>(
    `/scriptures/${encodeURIComponent(key)}`,
    options,
  );
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
export async function getSettings(
  options: PublicReadOptions = {},
): Promise<SiteSettings | null> {
  const payload = await apiFetch<SiteSettings>("/settings", options);
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
export async function getPage(
  pageKey: string,
  options: PublicReadOptions = {},
): Promise<EditablePage | null> {
  const payload = await apiFetch<EditablePage | null>(
    `/pages/${encodeURIComponent(pageKey)}`,
    options,
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

/* -------------------------------------------------------------------------- */
/*  Endpoints d'administration (/admin, /publications, /pages, /events, /media)*/
/* -------------------------------------------------------------------------- */

/** Récupère le profil de l'administrateur connecté (`GET /admin/me`). */
export async function getAdminMe(): Promise<AdminProfile> {
  const payload = await apiFetchOrThrow<{ data: AdminProfile } | AdminProfile>(
    "/admin/me",
  );
  if (isRecord(payload) && "data" in payload && isRecord(payload.data)) {
    return payload.data as unknown as AdminProfile;
  }
  return payload as AdminProfile;
}

/** Liste des profils administratifs (`GET /admin/profiles`). */
export async function listAdminProfiles(query: {
  page?: number;
  limit?: number;
} = {}): Promise<CollectionResponse<AdminProfile>> {
  const path = withQuery("/admin/profiles", query);
  return apiFetchOrThrow<CollectionResponse<AdminProfile>>(path);
}

/** Liste des publications pour le back-office (`GET /publications`). */
export async function listAdminPublications(
  query: PublicationsQuery & { status?: string; search?: string } = {},
): Promise<CollectionResponse<PublicationRecord>> {
  const path = withQuery("/publications", query);
  try {
    return await apiFetchOrThrow<CollectionResponse<PublicationRecord>>(path, {
      timeoutMs: 15_000,
    });
  } catch (apiErr) {
    try {
      const supabase = getSupabaseClient();
      const limit = query.limit || 20;
      const page = query.page || 1;
      const offset = (page - 1) * limit;

      let dbQuery = supabase
        .from("publications")
        .select("*", { count: "exact" })
        .order("published_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (query.type) dbQuery = dbQuery.eq("type", query.type);
      if (query.category) dbQuery = dbQuery.eq("category", query.category);
      if (query.status && query.status !== "ALL") dbQuery = dbQuery.eq("status", query.status);

      const { data, count, error } = await dbQuery;
      if (!error && data) {
        const items: PublicationRecord[] = data.map((row) => ({
          id: row.id,
          title: row.title,
          slug: row.slug,
          type: row.type,
          category: row.category,
          author: row.author,
          description: row.description,
          contentUrl: row.content_url,
          body: row.body,
          departmentId: row.department_id,
          status: row.status,
          publishedAt: row.published_at,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }));
        return {
          data: items,
          meta: {
            page,
            limit,
            total: count ?? items.length,
            totalPages: Math.ceil((count ?? items.length) / limit),
          },
        };
      }
    } catch (fbErr) {
      console.warn("[publications] Échec repli liste :", fbErr);
    }
    throw apiErr;
  }
}

/** Récupère une publication par son identifiant ou slug (`GET /publications/:idOrSlug`). */
export async function getAdminPublication(
  idOrSlug: string,
): Promise<PublicationRecord> {
  const payload = await apiFetchOrThrow<{ data: PublicationRecord } | PublicationRecord>(
    `/publications/${encodeURIComponent(idOrSlug)}`,
  );
  if (isRecord(payload) && "data" in payload && isRecord(payload.data)) {
    return payload.data as unknown as PublicationRecord;
  }
  return payload as PublicationRecord;
}

/** Crée une publication (`POST /publications`). */
export async function createAdminPublication(
  data: Record<string, unknown>,
): Promise<PublicationRecord> {
  try {
    const payload = await apiFetchOrThrow<{ data: PublicationRecord } | PublicationRecord>(
      "/publications",
      { method: "POST", body: data },
    );
    if (isRecord(payload) && "data" in payload && isRecord(payload.data)) {
      return payload.data as unknown as PublicationRecord;
    }
    return payload as PublicationRecord;
  } catch (apiErr) {
    try {
      const supabase = getSupabaseClient();
      const newId = crypto.randomUUID();
      const row = {
        id: newId,
        title: data.title,
        slug: (data.slug as string) || `${data.title}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        type: data.type || "TEXTE",
        category: data.category || "ENSEIGNEMENT",
        author: data.author || null,
        description: data.description || null,
        content_url: data.contentUrl || null,
        body: Array.isArray(data.body) ? data.body : null,
        department_id: data.departmentId || "d0000000-0000-4000-8000-00000000000a",
        status: data.status || "PUBLISHED",
        published_at: data.publishedAt || new Date().toISOString().slice(0, 10),
      };

      const { data: inserted, error } = await supabase.from("publications").insert(row).select().single();
      if (!error && inserted) {
        return {
          id: inserted.id,
          title: inserted.title,
          slug: inserted.slug,
          type: inserted.type,
          category: inserted.category,
          author: inserted.author,
          description: inserted.description,
          contentUrl: inserted.content_url,
          body: inserted.body,
          departmentId: inserted.department_id,
          status: inserted.status,
          publishedAt: inserted.published_at,
          createdAt: inserted.created_at,
          updatedAt: inserted.updated_at,
        };
      }
    } catch (fbErr) {
      console.warn("[publications] Échec repli création :", fbErr);
    }
    throw apiErr;
  }
}

/** Met à jour une publication (`PATCH /publications/:idOrSlug`). */
export async function updateAdminPublication(
  idOrSlug: string,
  data: Record<string, unknown>,
): Promise<PublicationRecord> {
  try {
    const payload = await apiFetchOrThrow<{ data: PublicationRecord } | PublicationRecord>(
      `/publications/${encodeURIComponent(idOrSlug)}`,
      { method: "PATCH", body: data },
    );
    if (isRecord(payload) && "data" in payload && isRecord(payload.data)) {
      return payload.data as unknown as PublicationRecord;
    }
    return payload as PublicationRecord;
  } catch (apiErr) {
    try {
      const supabase = getSupabaseClient();
      const updates: Record<string, unknown> = {};
      if (data.title !== undefined) updates.title = data.title;
      if (data.slug !== undefined) updates.slug = data.slug;
      if (data.type !== undefined) updates.type = data.type;
      if (data.category !== undefined) updates.category = data.category;
      if (data.author !== undefined) updates.author = data.author;
      if (data.description !== undefined) updates.description = data.description;
      if (data.contentUrl !== undefined) updates.content_url = data.contentUrl;
      if (data.body !== undefined) updates.body = data.body;
      if (data.departmentId !== undefined) updates.department_id = data.departmentId;
      if (data.status !== undefined) updates.status = data.status;
      if (data.publishedAt !== undefined) updates.published_at = data.publishedAt;

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
      const query = supabase.from("publications").update(updates);
      const { data: updated, error } = isUuid
        ? await query.eq("id", idOrSlug).select().single()
        : await query.eq("slug", idOrSlug).select().single();

      if (!error && updated) {
        return {
          id: updated.id,
          title: updated.title,
          slug: updated.slug,
          type: updated.type,
          category: updated.category,
          author: updated.author,
          description: updated.description,
          contentUrl: updated.content_url,
          body: updated.body,
          departmentId: updated.department_id,
          status: updated.status,
          publishedAt: updated.published_at,
          createdAt: updated.created_at,
          updatedAt: updated.updated_at,
        };
      }
    } catch (fbErr) {
      console.warn("[publications] Échec repli mise à jour :", fbErr);
    }
    throw apiErr;
  }
}

/** Supprime une publication (`DELETE /publications/:idOrSlug`). */
export async function deleteAdminPublication(idOrSlug: string): Promise<void> {
  try {
    await apiFetchOrThrow(`/publications/${encodeURIComponent(idOrSlug)}`, {
      method: "DELETE",
    });
  } catch (apiErr) {
    try {
      const supabase = getSupabaseClient();
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
      const query = supabase.from("publications").delete();
      if (isUuid) {
        await query.eq("id", idOrSlug);
      } else {
        await query.eq("slug", idOrSlug);
      }
      return;
    } catch {
      throw apiErr;
    }
  }
}

/** Met à jour le contenu d'une page statique (`PATCH /pages/:pageKey`). */
export async function updateStaticPageContent(
  pageKey: string,
  content: Record<string, unknown>,
): Promise<EditablePage> {
  const payload = await apiFetchOrThrow<{ data: EditablePage } | EditablePage>(
    `/pages/${encodeURIComponent(pageKey)}`,
    {
      method: "PATCH",
      body: { content },
    },
  );
  if (isRecord(payload) && "data" in payload && isRecord(payload.data)) {
    return payload.data as unknown as EditablePage;
  }
  return payload as EditablePage;
}

/** Liste des événements pour le back-office (`GET /events`). */
export async function listAdminEvents(
  query: EventsQuery = {},
): Promise<CollectionResponse<Event>> {
  const path = withQuery("/events", query);
  try {
    return await apiFetchOrThrow<CollectionResponse<Event>>(path, {
      timeoutMs: 15_000,
    });
  } catch (apiErr) {
    try {
      const supabase = getSupabaseClient();
      const limit = query.limit || 20;
      const page = query.page || 1;
      const offset = (page - 1) * limit;

      const { data, count, error } = await supabase
        .from("events")
        .select("*", { count: "exact" })
        .order("event_date", { ascending: false })
        .range(offset, offset + limit - 1);

      if (!error && data) {
        const items: Event[] = data.map((row) => ({
          id: row.id,
          title: row.title,
          slug: row.slug,
          description: row.description,
          excerpt: row.excerpt,
          eventDate: row.event_date,
          eventTime: row.event_time,
          location: row.location,
          departmentId: row.department_id,
          status: row.event_date >= new Date().toISOString().slice(0, 10) ? "UPCOMING" : "ARCHIVED",
        }));
        return {
          data: items,
          meta: {
            page,
            limit,
            total: count ?? items.length,
            totalPages: Math.ceil((count ?? items.length) / limit),
          },
        };
      }
    } catch (fbErr) {
      console.warn("[events] Échec repli liste :", fbErr);
    }
    throw apiErr;
  }
}

/** Crée un événement (`POST /events`). */
export async function createAdminEvent(
  data: Record<string, unknown>,
): Promise<Event> {
  try {
    const payload = await apiFetchOrThrow<{ data: Event } | Event>("/events", {
      method: "POST",
      body: data,
    });
    if (isRecord(payload) && "data" in payload && isRecord(payload.data)) {
      return payload.data as unknown as Event;
    }
    return payload as Event;
  } catch (apiErr) {
    try {
      const supabase = getSupabaseClient();
      const newId = crypto.randomUUID();
      const row = {
        id: newId,
        title: data.title,
        slug: (data.slug as string) || `${data.title}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        description: data.description || null,
        excerpt: data.excerpt || null,
        event_date: data.eventDate || new Date().toISOString().slice(0, 10),
        event_time: data.eventTime || null,
        location: data.location || null,
        department_id: data.departmentId || "d0000000-0000-4000-8000-000000000001",
        visibility_scope: data.visibilityScope || "GLOBAL",
      };

      const { data: inserted, error } = await supabase.from("events").insert(row).select().single();
      if (!error && inserted) {
        return {
          id: inserted.id,
          title: inserted.title,
          slug: inserted.slug,
          description: inserted.description,
          excerpt: inserted.excerpt,
          eventDate: inserted.event_date,
          eventTime: inserted.event_time,
          location: inserted.location,
          departmentId: inserted.department_id,
          status: inserted.event_date >= new Date().toISOString().slice(0, 10) ? "UPCOMING" : "ARCHIVED",
        };
      }
    } catch (fbErr) {
      console.warn("[events] Échec repli création :", fbErr);
    }
    throw apiErr;
  }
}

/** Met à jour un événement (`PATCH /events/:idOrSlug`). */
export async function updateAdminEvent(
  idOrSlug: string,
  data: Record<string, unknown>,
): Promise<Event> {
  try {
    const payload = await apiFetchOrThrow<{ data: Event } | Event>(
      `/events/${encodeURIComponent(idOrSlug)}`,
      { method: "PATCH", body: data },
    );
    if (isRecord(payload) && "data" in payload && isRecord(payload.data)) {
      return payload.data as unknown as Event;
    }
    return payload as Event;
  } catch (apiErr) {
    try {
      const supabase = getSupabaseClient();
      const updates: Record<string, unknown> = {};
      if (data.title !== undefined) updates.title = data.title;
      if (data.slug !== undefined) updates.slug = data.slug;
      if (data.description !== undefined) updates.description = data.description;
      if (data.excerpt !== undefined) updates.excerpt = data.excerpt;
      if (data.eventDate !== undefined) updates.event_date = data.eventDate;
      if (data.eventTime !== undefined) updates.event_time = data.eventTime;
      if (data.location !== undefined) updates.location = data.location;
      if (data.departmentId !== undefined) updates.department_id = data.departmentId;

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
      const query = supabase.from("events").update(updates);
      const { data: updated, error } = isUuid
        ? await query.eq("id", idOrSlug).select().single()
        : await query.eq("slug", idOrSlug).select().single();

      if (!error && updated) {
        return {
          id: updated.id,
          title: updated.title,
          slug: updated.slug,
          description: updated.description,
          excerpt: updated.excerpt,
          eventDate: updated.event_date,
          eventTime: updated.event_time,
          location: updated.location,
          departmentId: updated.department_id,
          status: updated.event_date >= new Date().toISOString().slice(0, 10) ? "UPCOMING" : "ARCHIVED",
        };
      }
    } catch (fbErr) {
      console.warn("[events] Échec repli mise à jour :", fbErr);
    }
    throw apiErr;
  }
}

/** Supprime un événement (`DELETE /events/:idOrSlug`). */
export async function deleteAdminEvent(idOrSlug: string): Promise<void> {
  try {
    await apiFetchOrThrow(`/events/${encodeURIComponent(idOrSlug)}`, {
      method: "DELETE",
    });
  } catch (apiErr) {
    try {
      const supabase = getSupabaseClient();
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
      const query = supabase.from("events").delete();
      if (isUuid) {
        await query.eq("id", idOrSlug);
      } else {
        await query.eq("slug", idOrSlug);
      }
      return;
    } catch {
      throw apiErr;
    }
  }
}

/** Liste des médias (`GET /media`). */
export async function listAdminMedia(query: {
  page?: number;
  limit?: number;
  departmentId?: string;
} = {}): Promise<CollectionResponse<AdminMediaItem>> {
  const path = withQuery("/media", query);
  try {
    return await apiFetchOrThrow<CollectionResponse<AdminMediaItem>>(path, {
      timeoutMs: 15_000,
    });
  } catch (apiErr) {
    try {
      const supabase = getSupabaseClient();
      const limit = query.limit || 100;
      const page = query.page || 1;
      const offset = (page - 1) * limit;

      const { data, count, error } = await supabase
        .from("media")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (!error && data && data.length > 0) {
        const items: AdminMediaItem[] = data.map((row) => ({
          id: row.id,
          filename: row.alt ? row.alt.replace("CCJV (démo) — ", "") : row.path.split("/").pop() || "media.jpg",
          url: row.public_url,
          mimeType: row.mime_type || "image/jpeg",
          sizeBytes: row.size_bytes || 0,
          uploadedBy: row.uploaded_by ?? undefined,
          createdAt: row.created_at,
        }));

        return {
          data: items,
          meta: {
            page,
            limit,
            total: count ?? items.length,
            totalPages: Math.ceil((count ?? items.length) / limit),
          },
        };
      }
    } catch (fbErr) {
      console.warn("[media] Échec repli liste médias Supabase :", fbErr);
    }
    throw apiErr;
  }
}

/** Téléverse un média (`POST /media`). */
export async function uploadAdminMedia(
  formData: FormData,
  folder: string = "pages",
  alt?: string,
): Promise<AdminMediaItem> {
  if (!formData.has("folder")) {
    formData.append("folder", folder);
  }
  if (alt && !formData.has("alt")) {
    formData.append("alt", alt);
  }

  const payload = await apiFetchOrThrow<{ data: AdminMediaItem } | AdminMediaItem>(
    "/media",
    { method: "POST", body: formData },
  );
  if (isRecord(payload) && "data" in payload && isRecord(payload.data)) {
    return payload.data as unknown as AdminMediaItem;
  }
  return payload as AdminMediaItem;
}

/** Supprime un média (`DELETE /media/:id`). */
export async function deleteAdminMedia(id: string): Promise<void> {
  try {
    await apiFetchOrThrow(`/media/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  } catch (apiErr) {
    try {
      const supabase = getSupabaseClient();
      const { data } = await supabase.from("media").select("path").eq("id", id).single();
      if (data?.path) {
        await supabase.storage.from("ccjv-media").remove([data.path]);
      }
      await supabase.from("media").delete().eq("id", id);
      return;
    } catch {
      throw apiErr;
    }
  }
}

/* -------------------------------------------------------------------------- */
/*  Enseignements (Sermons / Prédications)                                    */
/* -------------------------------------------------------------------------- */

export interface ListEnseignementsQuery {
  page?: number;
  limit?: number;
  status?: TeachingStatus;
  search?: string;
}

/** Liste les enseignements (filtrée par défaut aux seuls publiés pour les appels publics). */
export async function listEnseignements(
  query: ListEnseignementsQuery = {},
): Promise<{ items: EnseignementRecord[]; total: number; totalPages: number }> {
  try {
    const payload = await apiFetch<CollectionResponse<EnseignementRecord>>(
      withQuery("/enseignements", {
        page: query.page ?? 1,
        limit: query.limit ?? 20,
        status: query.status,
        search: query.search,
      }),
      { timeoutMs: 15_000 },
    );

    if (payload && "data" in payload && Array.isArray(payload.data)) {
      return {
        items: payload.data,
        total: payload.meta?.total ?? payload.data.length,
        totalPages: payload.meta?.totalPages ?? 1,
      };
    }
    return { items: [], total: 0, totalPages: 1 };
  } catch (error) {
    logApiIssue("/enseignements", error);
    return { items: [], total: 0, totalPages: 1 };
  }
}

/** Récupère un enseignement par son identifiant ou son slug. */
export async function getEnseignement(
  idOrSlug: string,
): Promise<EnseignementRecord | null> {
  try {
    const payload = await apiFetch<{ data: EnseignementRecord } | EnseignementRecord>(
      `/enseignements/${encodeURIComponent(idOrSlug)}`,
    );
    if (!payload) return null;
    if ("data" in payload && isRecord(payload.data)) {
      return payload.data as unknown as EnseignementRecord;
    }
    return payload as EnseignementRecord;
  } catch (error) {
    logApiIssue(`/enseignements/${idOrSlug}`, error);
    return null;
  }
}

/** Crée un nouvel enseignement en brouillon (`POST /enseignements`). */
export async function createEnseignement(
  payload: CreateTeachingPayload,
): Promise<EnseignementRecord> {
  const res = await apiFetchOrThrow<{ data: EnseignementRecord } | EnseignementRecord>(
    "/enseignements",
    {
      method: "POST",
      body: payload as unknown as Record<string, unknown>,
    },
  );
  if (isRecord(res) && "data" in res && isRecord(res.data)) {
    return res.data as unknown as EnseignementRecord;
  }
  return res as EnseignementRecord;
}

/** Modifie les métadonnées d'un enseignement (`PATCH /enseignements/:id`). */
export async function updateEnseignement(
  id: string,
  payload: UpdateTeachingPayload,
): Promise<EnseignementRecord> {
  const res = await apiFetchOrThrow<{ data: EnseignementRecord } | EnseignementRecord>(
    `/enseignements/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: payload as unknown as Record<string, unknown>,
    },
  );
  if (isRecord(res) && "data" in res && isRecord(res.data)) {
    return res.data as unknown as EnseignementRecord;
  }
  return res as EnseignementRecord;
}

/** Met à jour atomiquement les références bibliques (`PUT /enseignements/:id/references-bibliques`). */
export async function updateEnseignementReferences(
  id: string,
  references: BiblicalReferenceInputPayload[],
): Promise<BiblicalReferenceRecord[]> {
  const res = await apiFetchOrThrow<{ data: BiblicalReferenceRecord[] } | BiblicalReferenceRecord[]>(
    `/enseignements/${encodeURIComponent(id)}/references-bibliques`,
    {
      method: "PUT",
      body: { references },
    },
  );
  if (isRecord(res) && "data" in res && Array.isArray(res.data)) {
    return res.data;
  }
  return Array.isArray(res) ? res : [];
}

/** Met à jour les associations aux médias centraux (`PUT /enseignements/:id/medias`). */
export async function updateEnseignementMedias(
  id: string,
  medias: TeachingMediaInputPayload[],
): Promise<TeachingMediaRecord[]> {
  const res = await apiFetchOrThrow<{ data: TeachingMediaRecord[] } | TeachingMediaRecord[]>(
    `/enseignements/${encodeURIComponent(id)}/medias`,
    {
      method: "PUT",
      body: { medias },
    },
  );
  if (isRecord(res) && "data" in res && Array.isArray(res.data)) {
    return res.data;
  }
  return Array.isArray(res) ? res : [];
}

/** Publie un enseignement (`POST /enseignements/:id/publish`). */
export async function publishEnseignement(id: string): Promise<EnseignementRecord> {
  const res = await apiFetchOrThrow<{ data: EnseignementRecord } | EnseignementRecord>(
    `/enseignements/${encodeURIComponent(id)}/publish`,
    {
      method: "POST",
    },
  );
  if (isRecord(res) && "data" in res && isRecord(res.data)) {
    return res.data as unknown as EnseignementRecord;
  }
  return res as EnseignementRecord;
}

/** Archive un enseignement (`POST /enseignements/:id/archive`). */
export async function archiveEnseignement(id: string): Promise<EnseignementRecord> {
  const res = await apiFetchOrThrow<{ data: EnseignementRecord } | EnseignementRecord>(
    `/enseignements/${encodeURIComponent(id)}/archive`,
    {
      method: "POST",
    },
  );
  if (isRecord(res) && "data" in res && isRecord(res.data)) {
    return res.data as unknown as EnseignementRecord;
  }
  return res as EnseignementRecord;
}

/** Supprime un enseignement (`DELETE /enseignements/:id`). */
export async function deleteEnseignement(id: string): Promise<void> {
  await apiFetchOrThrow(`/enseignements/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

/* -------------------------------------------------------------------------- */
/*  Publications — Actions de cycle de vie                                    */
/* -------------------------------------------------------------------------- */

/** Publie une publication (`POST /publications/:idOrSlug/publish`). */
export async function publishPublication(
  idOrSlug: string,
  publishedAt?: string,
): Promise<PublicationRecord> {
  const res = await apiFetchOrThrow<{ data: PublicationRecord } | PublicationRecord>(
    `/publications/${encodeURIComponent(idOrSlug)}/publish`,
    {
      method: "POST",
      body: publishedAt ? { publishedAt } : {},
    },
  );
  if (isRecord(res) && "data" in res && isRecord(res.data)) {
    return res.data as unknown as PublicationRecord;
  }
  return res as PublicationRecord;
}

/** Repasse une publication en brouillon (`POST /publications/:idOrSlug/revert-to-draft`). */
export async function revertPublicationToDraft(
  idOrSlug: string,
): Promise<PublicationRecord> {
  const res = await apiFetchOrThrow<{ data: PublicationRecord } | PublicationRecord>(
    `/publications/${encodeURIComponent(idOrSlug)}/revert-to-draft`,
    {
      method: "POST",
    },
  );
  if (isRecord(res) && "data" in res && isRecord(res.data)) {
    return res.data as unknown as PublicationRecord;
  }
  return res as PublicationRecord;
}

/* -------------------------------------------------------------------------- */
/*  Événements — Actions de cycle de vie et suppression                       */
/* -------------------------------------------------------------------------- */

/** Publie un événement (`POST /events/:idOrSlug/publish`). */
export async function publishEvent(idOrSlug: string): Promise<Event> {
  const res = await apiFetchOrThrow<{ data: Event } | Event>(
    `/events/${encodeURIComponent(idOrSlug)}/publish`,
    {
      method: "POST",
    },
  );
  if (isRecord(res) && "data" in res && isRecord(res.data)) {
    return res.data as unknown as Event;
  }
  return res as Event;
}

/** Repasse un événement en brouillon (`POST /events/:idOrSlug/revert-to-draft`). */
export async function revertEventToDraft(idOrSlug: string): Promise<Event> {
  const res = await apiFetchOrThrow<{ data: Event } | Event>(
    `/events/${encodeURIComponent(idOrSlug)}/revert-to-draft`,
    {
      method: "POST",
    },
  );
  if (isRecord(res) && "data" in res && isRecord(res.data)) {
    return res.data as unknown as Event;
  }
  return res as Event;
}

/** Annule un événement (`POST /events/:idOrSlug/cancel`). */
export async function cancelEvent(idOrSlug: string): Promise<Event> {
  const res = await apiFetchOrThrow<{ data: Event } | Event>(
    `/events/${encodeURIComponent(idOrSlug)}/cancel`,
    {
      method: "POST",
    },
  );
  if (isRecord(res) && "data" in res && isRecord(res.data)) {
    return res.data as unknown as Event;
  }
  return res as Event;
}

/* -------------------------------------------------------------------------- */
/*  Ressources (Documents PDF téléchargeables)                                */
/* -------------------------------------------------------------------------- */

export interface ResourceListQuery {
  page?: number;
  limit?: number;
  search?: string;
}

/** Liste des ressources publiques (`GET /resources`). */
export async function getResources(
  query: ResourceListQuery = {},
  options: PublicReadOptions = {},
): Promise<CollectionResponse<Resource>> {
  const payload = await apiFetch<CollectionResponse<Resource>>(
    withQuery("/resources", {
      page: query.page,
      limit: query.limit,
      search: query.search,
    }),
    options,
  );
  if (payload && Array.isArray(payload.data)) {
    return payload;
  }
  return {
    data: [],
    meta: { page: query.page ?? 1, limit: query.limit ?? 20, total: 0, totalPages: 0 },
  };
}

/** Fiche d'une ressource (`GET /resources/:idOrSlug`). */
export async function getResource(
  idOrSlug: string,
  options: PublicReadOptions = {},
): Promise<Resource | null> {
  return apiFetch<Resource>(
    `/resources/${encodeURIComponent(idOrSlug)}`,
    options,
  );
}

/** Crée une nouvelle ressource (`POST /resources`). */
export async function createResource(
  payload: CreateResourcePayload,
): Promise<Resource> {
  const res = await apiFetchOrThrow<{ data: Resource } | Resource>("/resources", {
    method: "POST",
    body: payload,
  });
  if (isRecord(res) && "data" in res && isRecord(res.data)) {
    return res.data as unknown as Resource;
  }
  return res as Resource;
}

/** Modifie métadonnées d'une ressource (`PATCH /resources/:id`). */
export async function updateResource(
  id: string,
  payload: UpdateResourcePayload,
): Promise<Resource> {
  const res = await apiFetchOrThrow<{ data: Resource } | Resource>(
    `/resources/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: payload,
    },
  );
  if (isRecord(res) && "data" in res && isRecord(res.data)) {
    return res.data as unknown as Resource;
  }
  return res as Resource;
}

/** Remplacement direct du fichier PDF (`PUT /resources/:id/file`). */
export async function replaceResourceFile(
  id: string,
  fileUrl: string,
): Promise<Resource> {
  const res = await apiFetchOrThrow<{ data: Resource } | Resource>(
    `/resources/${encodeURIComponent(id)}/file`,
    {
      method: "PUT",
      body: { file: fileUrl },
    },
  );
  if (isRecord(res) && "data" in res && isRecord(res.data)) {
    return res.data as unknown as Resource;
  }
  return res as Resource;
}

/** Supprime une ressource (`DELETE /resources/:id`). */
export async function deleteResource(id: string): Promise<void> {
  await apiFetchOrThrow(`/resources/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

/* -------------------------------------------------------------------------- */
/*  Départements & Activités (Administration & Enrichissement)                */
/* -------------------------------------------------------------------------- */

export interface CreateDepartmentPayload {
  name: string;
  slug?: string;
  description?: string | null;
  mission?: string | null;
  history?: string | null;
  responsibleName?: string | null;
  tagline?: string | null;
  meetingSchedule?: string | null;
  keyPoints?: string[];
  bannerMediaId?: string | null;
  galleryMediaIds?: string[];
  position?: number;
}

export type UpdateDepartmentPayload = Partial<CreateDepartmentPayload>;

export interface DepartmentActivityPayload {
  title: string;
  description?: string | null;
  imageMediaId?: string | null;
  position?: number;
}

/** Crée un département (`POST /departments`). */
export async function createDepartment(
  payload: CreateDepartmentPayload,
): Promise<Department> {
  const res = await apiFetchOrThrow<{ data: Department } | Department>(
    "/departments",
    {
      method: "POST",
      body: payload as unknown as Record<string, unknown>,
    },
  );
  if (isRecord(res) && "data" in res && isRecord(res.data)) {
    return res.data as unknown as Department;
  }
  return res as Department;
}

/** Met à jour un département (`PATCH /departments/:idOrSlug`). */
export async function updateDepartment(
  idOrSlug: string,
  payload: UpdateDepartmentPayload,
): Promise<Department> {
  const res = await apiFetchOrThrow<{ data: Department } | Department>(
    `/departments/${encodeURIComponent(idOrSlug)}`,
    {
      method: "PATCH",
      body: payload as unknown as Record<string, unknown>,
    },
  );
  if (isRecord(res) && "data" in res && isRecord(res.data)) {
    return res.data as unknown as Department;
  }
  return res as Department;
}

/** Archive explicitement un département (`POST /departments/:idOrSlug/archive`). */
export async function archiveDepartment(
  idOrSlug: string,
  reason?: string | null,
): Promise<DepartmentArchive> {
  const res = await apiFetchOrThrow<{ data: DepartmentArchive } | DepartmentArchive>(
    `/departments/${encodeURIComponent(idOrSlug)}/archive`,
    {
      method: "POST",
      body: { reason: reason ?? "Archivage administratif" },
    },
  );
  if (isRecord(res) && "data" in res && isRecord(res.data)) {
    return res.data as unknown as DepartmentArchive;
  }
  return res as DepartmentArchive;
}

/** Supprime un département avec archivage préalable obligatoire (`DELETE /departments/:idOrSlug`). */
export async function deleteDepartment(
  idOrSlug: string,
  reason?: string | null,
): Promise<void> {
  await apiFetchOrThrow(`/departments/${encodeURIComponent(idOrSlug)}`, {
    method: "DELETE",
    body: { reason: reason ?? "Suppression administrative avec archivage préalable" },
  });
}

/** Liste les archives de départements (`GET /departments/archives`). */
export async function getDepartmentArchives(): Promise<DepartmentArchive[]> {
  const res = await apiFetchOrThrow<{ data: DepartmentArchive[] } | DepartmentArchive[]>(
    "/departments/archives",
  );
  if (isRecord(res) && "data" in res && Array.isArray(res.data)) {
    return res.data as DepartmentArchive[];
  }
  return Array.isArray(res) ? (res as DepartmentArchive[]) : [];
}

/** Enregistre les activités d'un département (`PUT /departments/:idOrSlug/activities`). */
export async function saveDepartmentActivities(
  idOrSlug: string,
  activities: DepartmentActivityPayload[],
): Promise<DepartmentActivityItem[]> {
  const res = await apiFetchOrThrow<{ data: DepartmentActivityItem[] } | DepartmentActivityItem[]>(
    `/departments/${encodeURIComponent(idOrSlug)}/activities`,
    {
      method: "PUT",
      body: { activities },
    },
  );
  if (isRecord(res) && "data" in res && Array.isArray(res.data)) {
    return res.data as DepartmentActivityItem[];
  }
  return Array.isArray(res) ? (res as DepartmentActivityItem[]) : [];
}

/* -------------------------------------------------------------------------- */
/*  Témoignages (Administration, Workflow de modération & Hero)              */
/* -------------------------------------------------------------------------- */

export interface TestimonyListQuery {
  page?: number;
  limit?: number;
  status?: TestimonyStatus;
  isFeatured?: boolean;
}

/** Boîte de réception des témoignages pour le back-office (`GET /testimonies`). */
export async function getAdminTestimonies(
  query: TestimonyListQuery = {},
): Promise<CollectionResponse<AdminTestimony>> {
  const url = withQuery("/testimonies", {
    page: query.page,
    limit: query.limit,
    status: query.status,
    isFeatured: query.isFeatured,
  });
  const res = await apiFetchOrThrow<CollectionResponse<AdminTestimony>>(url);
  if (res && Array.isArray(res.data)) {
    return res;
  }
  return {
    data: [],
    meta: { page: query.page ?? 1, limit: query.limit ?? 20, total: 0, totalPages: 0 },
  };
}

/** Témoignages mis en avant pour la Hero section (`GET /testimonies/hero`). */
export async function getHeroTestimonies(
  options: PublicReadOptions = {},
): Promise<Testimony[]> {
  const payload = await apiFetch<CollectionResponse<TestimonyPayload> | TestimonyPayload[]>(
    "/testimonies/hero",
    options,
  );
  return readCollection(payload) as unknown as Testimony[];
}

/** Soumission publique d'un témoignage (`POST /testimonies/submit`). */
export interface SubmitTestimonyPayload {
  authorName?: string | null;
  content: string;
  isAnonymous?: boolean;
  photoMediaId?: string | null;
  consent: boolean;
}

export async function submitPublicTestimony(
  payload: SubmitTestimonyPayload,
): Promise<{ id: string }> {
  return apiFetchOrThrow<{ id: string }>("/testimonies/submit", {
    method: "POST",
    body: payload as unknown as Record<string, unknown>,
  });
}

/** Mise à jour du statut d'un témoignage (`POST /testimonies/:id/status`). */
export async function updateTestimonyStatus(
  id: string,
  status: TestimonyStatus,
  adminNotes?: string | null,
): Promise<AdminTestimony> {
  const res = await apiFetchOrThrow<{ data: AdminTestimony } | AdminTestimony>(
    `/testimonies/${encodeURIComponent(id)}/status`,
    {
      method: "POST",
      body: { status, adminNotes },
    },
  );
  if (isRecord(res) && "data" in res && isRecord(res.data)) {
    return res.data as unknown as AdminTestimony;
  }
  return res as AdminTestimony;
}

/** Bascule la sélection Hero (`POST /testimonies/:id/hero`). */
export async function setTestimonyFeatured(
  id: string,
  isFeatured: boolean,
): Promise<AdminTestimony> {
  const res = await apiFetchOrThrow<{ data: AdminTestimony } | AdminTestimony>(
    `/testimonies/${encodeURIComponent(id)}/hero`,
    {
      method: "POST",
      body: { isFeatured },
    },
  );
  if (isRecord(res) && "data" in res && isRecord(res.data)) {
    return res.data as unknown as AdminTestimony;
  }
  return res as AdminTestimony;
}

/** Correction éditoriale d'un témoignage (`PATCH /testimonies/:id`). */
export async function updateTestimony(
  id: string,
  payload: {
    content?: string;
    authorName?: string | null;
    isAnonymous?: boolean;
    adminNotes?: string | null;
  },
): Promise<AdminTestimony> {
  const res = await apiFetchOrThrow<{ data: AdminTestimony } | AdminTestimony>(
    `/testimonies/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: payload,
    },
  );
  if (isRecord(res) && "data" in res && isRecord(res.data)) {
    return res.data as unknown as AdminTestimony;
  }
  return res as AdminTestimony;
}

/** Supprime un témoignage (`DELETE /testimonies/:id`). */
export async function deleteTestimony(id: string): Promise<void> {
  await apiFetchOrThrow(`/testimonies/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}



