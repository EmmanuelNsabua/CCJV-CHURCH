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
import { getSupabaseClient } from "@/lib/supabase/client";
import type {
  AdminMediaItem,
  AdminProfile,
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
    return await apiFetchOrThrow<CollectionResponse<PublicationRecord>>(path);
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
    return await apiFetchOrThrow<CollectionResponse<Event>>(path);
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
    return await apiFetchOrThrow<CollectionResponse<AdminMediaItem>>(path);
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

