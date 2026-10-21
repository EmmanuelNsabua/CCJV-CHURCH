/**
 * Endpoints de l'API publique CCJV (`/api/v1`).
 *
 * Une fonction par ressource. Les **lectures publiques** sont tolérantes aux
 * pannes : elles renvoient un tableau vide (collection) ou `null` (ressource
 * unique) quand l'API est injoignable, de sorte qu'une page puisse toujours
 * être rendue. Les **écritures** et les lectures d'administration, elles,
 * lèvent : un back-office qui échoue doit le dire.
 *
 * Aucune fonction de ce module n'accède à PostgreSQL ni au Storage : l'API REST
 * est le seul chemin d'écriture. Les replis directs qui existaient ici
 * contournaient les règles métier (quota de publications, contrôle d'usage des
 * médias, RBAC) et transformaient un échec serveur en succès apparent.
 *
 * Les chemins restent relatifs à `/api/v1` : c'est `client.ts` qui porte la
 * version d'API et l'URL de base.
 */

import { apiFetch, apiFetchOrThrow, logApiIssue, withQuery } from "./client";
import type { ApiFetchOptions } from "./client";
import { pickMostRecentlyPublished as pickLatest } from "@/lib/teaching-recency";
import type {
  AdminMediaItem,
  AdminProfile,
  AdminRole,
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
  CreateResourcePayload,
  UpdateResourcePayload,
  ScheduleEntry,
  ScheduleEntryInput,
  Scripture,
  SiteSettings,
  SocialLink,
  SocialLinkInput,
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
  /** Tags de cache pour l'invalidation à la demande (On-Demand ISR). */
  tags?: string[];
  /** Fenêtre de revalidation Next. `false` active l'On-Demand ISR pur. */
  revalidate?: number | false;
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
  options: PublicReadOptions & { departmentId?: string; limit?: number } = {},
): Promise<Leader[]> {
  const { departmentId, limit, ...fetchOptions } = options;
  const payload = await apiFetch<CollectionResponse<Leader> | Leader[]>(
    withQuery("/leaders", {
      limit: limit ?? REFERENCE_LIMIT,
      departmentId: departmentId ?? undefined,
    }),
    fetchOptions,
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
        const { label, href, platform, isActive, id, position } = link;
        return typeof label === "string" && typeof href === "string"
          ? [
              {
                id: typeof id === "string" ? id : undefined,
                platform: typeof platform === "string" ? platform : null,
                label,
                href,
                isActive: typeof isActive === "boolean" ? isActive : true,
                position: typeof position === "number" ? position : 0,
              },
            ]
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

/* -------------------------------------------------------------------------- */
/*  Gestion des comptes administrateurs                                       */
/* -------------------------------------------------------------------------- */

/**
 * Corps de `POST /admin/users`.
 *
 * `password` est **facultatif** : sans lui, le serveur en génère un et ne le
 * renvoie jamais. Le rôle demandé n'est pas une décision du client : la policy
 * le vérifie côté serveur (D-03, D-04) — un `ADMIN` qui demande un compte
 * `ADMIN` reçoit un `403`.
 */
export interface CreateAdminUserPayload {
  email: string;
  username: string;
  displayName?: string | null;
  role: AdminRole;
  departmentId?: string | null;
  password?: string;
}

/** Réécriture complète d'une habilitation (`PATCH /admin/users/:id/authorization`). */
export interface UpdateAdminAuthorizationPayload {
  role: AdminRole;
  departmentId?: string | null;
}

/**
 * Correction de l'identité d'un compte (`PATCH /admin/users/:id/identity`).
 *
 * `username` et `displayName` sont écrits dans `admin_profiles`, `email` chez le
 * fournisseur d'identité. Le rôle ne figure **pas** ici : autre permission,
 * autre route.
 */
export interface UpdateAdminIdentityPayload {
  username?: string;
  displayName?: string | null;
  email?: string;
}

/** Crée un compte et son habilitation (`POST /admin/users`). */
export async function createAdminUser(
  payload: CreateAdminUserPayload,
): Promise<AdminProfile> {
  return apiFetchOrThrow<AdminProfile>("/admin/users", {
    method: "POST",
    body: payload as unknown as Record<string, unknown>,
  });
}

/** Réécrit l'habilitation d'un compte (`PATCH /admin/users/:id/authorization`). */
export async function updateAdminAuthorization(
  id: string,
  payload: UpdateAdminAuthorizationPayload,
): Promise<AdminProfile> {
  return apiFetchOrThrow<AdminProfile>(
    `/admin/users/${encodeURIComponent(id)}/authorization`,
    { method: "PATCH", body: payload as unknown as Record<string, unknown> },
  );
}

/** Active ou désactive un compte (`PATCH /admin/users/:id/activation`). */
export async function setAdminActivation(
  id: string,
  isActive: boolean,
): Promise<AdminProfile> {
  return apiFetchOrThrow<AdminProfile>(
    `/admin/users/${encodeURIComponent(id)}/activation`,
    { method: "PATCH", body: { isActive } },
  );
}

/** Corrige l'identité d'un compte (`PATCH /admin/users/:id/identity`). */
export async function updateAdminIdentity(
  id: string,
  payload: UpdateAdminIdentityPayload,
): Promise<AdminProfile> {
  return apiFetchOrThrow<AdminProfile>(
    `/admin/users/${encodeURIComponent(id)}/identity`,
    { method: "PATCH", body: payload as unknown as Record<string, unknown> },
  );
}

/**
 * Réinitialise le mot de passe d'un **autre** compte
 * (`PATCH /admin/users/:id/password`).
 *
 * Le secret ne revient jamais : la réponse est un `204` sans corps. Il n'est ni
 * relu, ni conservé côté client, ni affiché après coup.
 */
export async function setAdminPassword(
  id: string,
  password: string,
): Promise<void> {
  await apiFetchOrThrow<null>(
    `/admin/users/${encodeURIComponent(id)}/password`,
    { method: "PATCH", body: { password } },
  );
}

/**
 * Change **son propre** mot de passe (`PATCH /admin/me/password`).
 *
 * Aucun identifiant transmis : la cible est l'identité du jeton vérifié.
 */
export async function changeOwnPassword(password: string): Promise<void> {
  await apiFetchOrThrow<null>("/admin/me/password", {
    method: "PATCH",
    body: { password },
  });
}

/**
 * Supprime **définitivement** un compte (`DELETE /admin/users/:id`).
 *
 * Réservé au super administrateur ; la réponse est un `204` sans corps. Un
 * `409` signifie que le compte a accordé des droits d'accès média : la base
 * refuse tant que ces autorisations existent.
 */
export async function deleteAdminUser(id: string): Promise<void> {
  await apiFetchOrThrow<null>(`/admin/users/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

/**
 * Liste des publications pour le back-office (`GET /publications`).
 *
 * **Aucun repli direct vers Supabase.** Le repli qui existait ici contournait
 * l'API : il ignorait les règles métier (quota de publications publiées,
 * visibilité des brouillons) et, surtout, il transformait un échec en succès
 * apparent. Un back-office doit dire quand il n'a pas pu lire.
 */
export async function listAdminPublications(
  query: PublicationsQuery & { status?: string; search?: string } = {},
): Promise<CollectionResponse<PublicationRecord>> {
  const path = withQuery("/publications", query);
  return apiFetchOrThrow<CollectionResponse<PublicationRecord>>(path, {
    timeoutMs: 15_000,
  });
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

/**
 * Crée une publication (`POST /publications`).
 *
 * Le repli direct en base a été supprimé : il inventait un `id`, une date de
 * publication et un département, et n'appliquait ni le quota des publications
 * publiées ni la règle de contenu par type. Une création qui échoue doit
 * échouer.
 */
export async function createAdminPublication(
  data: Record<string, unknown>,
): Promise<PublicationRecord> {
  const payload = await apiFetchOrThrow<{ data: PublicationRecord } | PublicationRecord>(
    "/publications",
    { method: "POST", body: data },
  );
  if (isRecord(payload) && "data" in payload && isRecord(payload.data)) {
    return payload.data as unknown as PublicationRecord;
  }
  return payload as PublicationRecord;
}

/** Met à jour une publication (`PATCH /publications/:idOrSlug`). */
export async function updateAdminPublication(
  idOrSlug: string,
  data: Record<string, unknown>,
): Promise<PublicationRecord> {
  const payload = await apiFetchOrThrow<{ data: PublicationRecord } | PublicationRecord>(
    `/publications/${encodeURIComponent(idOrSlug)}`,
    { method: "PATCH", body: data },
  );
  if (isRecord(payload) && "data" in payload && isRecord(payload.data)) {
    return payload.data as unknown as PublicationRecord;
  }
  return payload as PublicationRecord;
}

/** Supprime une publication (`DELETE /publications/:idOrSlug`). */
export async function deleteAdminPublication(idOrSlug: string): Promise<void> {
  await apiFetchOrThrow(`/publications/${encodeURIComponent(idOrSlug)}`, {
    method: "DELETE",
  });
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
  return apiFetchOrThrow<CollectionResponse<Event>>(path, {
    timeoutMs: 15_000,
  });
}

/** Crée un événement (`POST /events`). */
export async function createAdminEvent(
  data: Record<string, unknown>,
): Promise<Event> {
  const payload = await apiFetchOrThrow<{ data: Event } | Event>("/events", {
    method: "POST",
    body: data,
  });
  if (isRecord(payload) && "data" in payload && isRecord(payload.data)) {
    return payload.data as unknown as Event;
  }
  return payload as Event;
}

/** Met à jour un événement (`PATCH /events/:idOrSlug`). */
export async function updateAdminEvent(
  idOrSlug: string,
  data: Record<string, unknown>,
): Promise<Event> {
  const payload = await apiFetchOrThrow<{ data: Event } | Event>(
    `/events/${encodeURIComponent(idOrSlug)}`,
    { method: "PATCH", body: data },
  );
  if (isRecord(payload) && "data" in payload && isRecord(payload.data)) {
    return payload.data as unknown as Event;
  }
  return payload as Event;
}

/** Supprime un événement (`DELETE /events/:idOrSlug`). */
export async function deleteAdminEvent(idOrSlug: string): Promise<void> {
  await apiFetchOrThrow(`/events/${encodeURIComponent(idOrSlug)}`, {
    method: "DELETE",
  });
}

/** Liste des médias (`GET /media`). */
export async function listAdminMedia(query: {
  page?: number;
  limit?: number;
  departmentId?: string;
} = {}): Promise<CollectionResponse<AdminMediaItem>> {
  const path = withQuery("/media", query);
  return apiFetchOrThrow<CollectionResponse<AdminMediaItem>>(path, {
    timeoutMs: 15_000,
  });
}

/**
 * Délai d'un téléversement, en millisecondes.
 *
 * 30 s et non les 5 s par défaut : une photo de plusieurs mégaoctets ou un PDF
 * de 15 Mo sur une connexion mobile ne montent pas en 5 secondes. Couper la
 * requête plus tôt n'annule pas l'écriture côté serveur — l'utilisateur voyait
 * un échec pour un fichier pourtant enregistré.
 */
const UPLOAD_TIMEOUT_MS = 30_000;

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
    { method: "POST", body: formData, timeoutMs: UPLOAD_TIMEOUT_MS },
  );
  if (isRecord(payload) && "data" in payload && isRecord(payload.data)) {
    return payload.data as unknown as AdminMediaItem;
  }
  return payload as AdminMediaItem;
}

/**
 * Supprime un média (`DELETE /media/:id`).
 *
 * Le repli direct (suppression du fichier Storage puis de la ligne) a été
 * supprimé : il contournait la vérification d'usage — un média encore
 * référencé doit être refusé en `409`, pas effacé du bucket.
 */
export async function deleteAdminMedia(id: string): Promise<void> {
  await apiFetchOrThrow(`/media/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
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

/**
 * Taille de page maximale acceptée par l'API (`shared/http/pagination.ts`,
 * `MAX_PAGE_SIZE`). Elle permet de lire **toutes** les pages en un minimum de
 * requêtes.
 */
const TEACHING_PAGE_SIZE = 100;

/** Liste les enseignements (filtrée par défaut aux seuls publiés pour les appels publics). */
export async function listEnseignements(
  query: ListEnseignementsQuery = {},
  options: PublicReadOptions = {},
): Promise<{ items: EnseignementRecord[]; total: number; totalPages: number }> {
  try {
    const payload = await apiFetch<CollectionResponse<EnseignementRecord>>(
      withQuery("/enseignements", {
        page: query.page ?? 1,
        limit: query.limit ?? 20,
        status: query.status,
        search: query.search,
      }),
      { timeoutMs: 15_000, ...options },
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

/**
 * Lien public d'un enseignement.
 *
 * **Identifiant, pas slug.** Constat mesuré sur l'API actuellement déployée :
 * `GET /api/v1/enseignements/la-puissance-du-pardon` répond `404 NOT_FOUND`
 * alors que `GET /api/v1/enseignements/<uuid>` répond `200`. Le contrat serveur
 * expose bien un `slug` et la route de détail accepte « identifiant ou slug »,
 * mais la résolution par slug ne fonctionne pas en production (déploiement
 * antérieur au code courant, ou `slug` absent de la ligne en base).
 *
 * Le lien doit donc rester résoluble **aujourd'hui** : un visiteur ne doit pas
 * tomber sur un 404 depuis la liste. Dès que la résolution par slug est
 * rétablie côté API, cette fonction peut renvoyer
 * `teaching.slug ?? teaching.id` — le reste du site suivra sans autre
 * modification, tous les liens passant par ici.
 */
export function enseignementHref(
  teaching: Pick<EnseignementRecord, "id" | "slug">,
): string {
  return `/publications/enseignements/${encodeURIComponent(teaching.id)}`;
}

/**
 * **Tous** les enseignements publiés.
 *
 * `limit` étant plafonné à 100 par l'API, une page unique en tronquerait la
 * liste : on parcourt donc les pages jusqu'à `totalPages`. Le nombre de
 * résultats n'est jamais réduit arbitrairement côté site public.
 *
 * Un échec sur **n'importe quelle** page déclenche `onFailure` : l'appelant
 * doit alors présenter « indisponible » plutôt qu'une liste partielle qui se
 * ferait passer pour complète.
 */
export async function listAllEnseignements(
  options: PublicReadOptions = {},
): Promise<EnseignementRecord[]> {
  const first = await listEnseignements(
    { page: 1, limit: TEACHING_PAGE_SIZE },
    options,
  );
  const items = [...first.items];

  for (let page = 2; page <= first.totalPages; page += 1) {
    const next = await listEnseignements(
      { page, limit: TEACHING_PAGE_SIZE },
      options,
    );
    items.push(...next.items);
  }

  return items;
}

/**
 * Enseignement le plus récemment **publié**.
 *
 * Le critère est `publishedAt` — jamais `preachedAt` (date de prédication), ni
 * `createdAt`, ni `updatedAt`. Le serveur trie déjà par date de publication
 * décroissante ; cette sélection explicite rend la règle lisible côté client et
 * reste vraie si l'ordre de la réponse venait à changer.
 *
 * La règle elle-même vit dans `@/lib/teaching-recency` (module pur, sans
 * dépendance), où elle est vérifiable isolément.
 */
export function pickMostRecentlyPublished(
  items: readonly EnseignementRecord[],
): EnseignementRecord | null {
  return pickLatest(items);
}

/**
 * Enseignement mis en avant sur la page d'accueil : **le plus récemment
 * publié**, et lui seul.
 *
 * La fenêtre demandée est courte (le serveur trie déjà correctement) ; la
 * décision finale reste prise sur `publishedAt` par `pickMostRecentlyPublished`.
 */
export async function getLatestPublishedEnseignement(
  options: PublicReadOptions = {},
): Promise<EnseignementRecord | null> {
  const { items } = await listEnseignements({ page: 1, limit: 5 }, options);
  return pickMostRecentlyPublished(items);
}

/** Récupère un enseignement par son identifiant ou son slug. */
export async function getEnseignement(
  idOrSlug: string,
  options: PublicReadOptions = {},
): Promise<EnseignementRecord | null> {
  try {
    const payload = await apiFetch<{ data: EnseignementRecord } | EnseignementRecord>(
      `/enseignements/${encodeURIComponent(idOrSlug)}`,
      options,
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
/*  Responsables / Leaders (Administration)                                   */
/* -------------------------------------------------------------------------- */

export interface CreateLeaderPayload {
  name: string;
  role: string;
  photoMediaId?: string | null;
  departmentId?: string | null;
  position?: number;
}

export type UpdateLeaderPayload = Partial<CreateLeaderPayload>;

/** Crée un responsable (`POST /leaders`). */
export async function createLeader(
  payload: CreateLeaderPayload,
): Promise<Leader> {
  const res = await apiFetchOrThrow<{ data: Leader } | Leader>("/leaders", {
    method: "POST",
    body: payload as unknown as Record<string, unknown>,
  });
  if (isRecord(res) && "data" in res && isRecord(res.data)) {
    return res.data as unknown as Leader;
  }
  return res as Leader;
}

/** Met à jour un responsable (`PATCH /leaders/:id`). */
export async function updateLeader(
  id: string,
  payload: UpdateLeaderPayload,
): Promise<Leader> {
  const res = await apiFetchOrThrow<{ data: Leader } | Leader>(
    `/leaders/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: payload as unknown as Record<string, unknown>,
    },
  );
  if (isRecord(res) && "data" in res && isRecord(res.data)) {
    return res.data as unknown as Leader;
  }
  return res as Leader;
}

/** Supprime un responsable (`DELETE /leaders/:id`). */
export async function deleteLeader(id: string): Promise<void> {
  await apiFetchOrThrow(`/leaders/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
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

/* -------------------------------------------------------------------------- */
/*  Demandes de prière — dépôt public uniquement                              */
/* -------------------------------------------------------------------------- */

/**
 * Niveau de confidentialité d'une demande de prière.
 *
 * Valeurs de l'enum PostgreSQL `prayer_confidentiality`, telles qu'acceptées
 * par `createPrayerRequestSchema` côté backend.
 */
export type PrayerConfidentiality = "private" | "community";

/**
 * Corps de `POST /prayer-requests`.
 *
 * Le schéma serveur est un `z.strictObject` : **toute clé inconnue produit un
 * `400 VALIDATION_ERROR`**. Ce contrat n'envoie donc que les champs prévus, et
 * **omet** les champs facultatifs vides au lieu de transmettre `null` (que le
 * schéma refuse). Le `confidentiality` est toujours explicite : la valeur par
 * défaut du serveur (`private`) est celle que présélectionne le formulaire.
 */
export interface SubmitPrayerRequestPayload {
  requestText: string;
  requesterName?: string;
  requesterContact?: string;
  confidentiality?: PrayerConfidentiality;
}

/**
 * Accusé de réception d'une demande de prière (`PrayerRequestCreatedDto`).
 *
 * Il ne porte **ni texte, ni prénom, ni contact** : le visiteur n'a pas besoin
 * de relire ce qu'il vient d'envoyer, et faire transiter à nouveau une donnée
 * personnelle sensible l'exposerait inutilement (`docs/030`).
 */
export interface PrayerRequestReceipt {
  id: string;
  createdAt: string;
  status: "NEW" | "PRAYED";
}

/**
 * Dépôt public d'une intention de prière (`POST /prayer-requests`).
 *
 * Route publique (aucune authentification) protégée par un plafond dédié de
 * 5 dépôts par heure et par IP : un `429 RATE_LIMITED` est un cas d'erreur à
 * présenter explicitement au visiteur. La date de dépôt et l'identifiant sont
 * générés côté serveur.
 */
export async function submitPublicPrayerRequest(
  payload: SubmitPrayerRequestPayload,
): Promise<PrayerRequestReceipt> {
  return apiFetchOrThrow<PrayerRequestReceipt>("/prayer-requests", {
    method: "POST",
    body: payload as unknown as Record<string, unknown>,
  });
}

/* -------------------------------------------------------------------------- */
/* Paramètres de l'église, Horaires et Liens Sociaux (Administration)          */
/* -------------------------------------------------------------------------- */

/** Met à jour les réglages du site (`PATCH /settings`). */
export async function updateSettings(
  settings: Record<string, string>,
): Promise<SiteSettings> {
  const res = await apiFetchOrThrow<{ data: SiteSettings } | SiteSettings>(
    "/settings",
    {
      method: "PATCH",
      body: { settings },
    },
  );
  if (isRecord(res) && "data" in res && isRecord(res.data)) {
    return res.data as unknown as SiteSettings;
  }
  return res as SiteSettings;
}

/** Crée une entrée d'horaire / rassemblement (`POST /schedule`). */
export async function createScheduleEntry(
  input: ScheduleEntryInput,
): Promise<ScheduleEntry> {
  const res = await apiFetchOrThrow<{ data: ScheduleEntry } | ScheduleEntry>(
    "/schedule",
    {
      method: "POST",
      body: input as unknown as Record<string, unknown>,
    },
  );
  if (isRecord(res) && "data" in res && isRecord(res.data)) {
    return res.data as unknown as ScheduleEntry;
  }
  return res as ScheduleEntry;
}

/** Met à jour une entrée d'horaire / rassemblement (`PATCH /schedule/:id`). */
export async function updateScheduleEntry(
  id: string,
  input: Partial<ScheduleEntryInput>,
): Promise<ScheduleEntry> {
  const res = await apiFetchOrThrow<{ data: ScheduleEntry } | ScheduleEntry>(
    `/schedule/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: input as unknown as Record<string, unknown>,
    },
  );
  if (isRecord(res) && "data" in res && isRecord(res.data)) {
    return res.data as unknown as ScheduleEntry;
  }
  return res as ScheduleEntry;
}

/** Supprime une entrée d'horaire / rassemblement (`DELETE /schedule/:id`). */
export async function deleteScheduleEntry(id: string): Promise<void> {
  await apiFetchOrThrow(`/schedule/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

/** Liste complète des liens sociaux pour l'administration (`GET /social-links`). */
export async function getSocialLinks(): Promise<SocialLink[]> {
  const payload = await apiFetch<CollectionResponse<SocialLink> | SocialLink[]>(
    "/social-links",
  );
  return readCollection(payload);
}

/** Crée un lien de réseau social (`POST /social-links`). */
export async function createSocialLink(
  input: SocialLinkInput,
): Promise<SocialLink> {
  const res = await apiFetchOrThrow<{ data: SocialLink } | SocialLink>(
    "/social-links",
    {
      method: "POST",
      body: input as unknown as Record<string, unknown>,
    },
  );
  if (isRecord(res) && "data" in res && isRecord(res.data)) {
    return res.data as unknown as SocialLink;
  }
  return res as SocialLink;
}

/** Met à jour un lien de réseau social (`PATCH /social-links/:id`). */
export async function updateSocialLink(
  id: string,
  input: Partial<SocialLinkInput>,
): Promise<SocialLink> {
  const res = await apiFetchOrThrow<{ data: SocialLink } | SocialLink>(
    `/social-links/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: input as unknown as Record<string, unknown>,
    },
  );
  if (isRecord(res) && "data" in res && isRecord(res.data)) {
    return res.data as unknown as SocialLink;
  }
  return res as SocialLink;
}

/** Supprime un lien de réseau social (`DELETE /social-links/:id`). */
export async function deleteSocialLink(id: string): Promise<void> {
  await apiFetchOrThrow(`/social-links/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}



