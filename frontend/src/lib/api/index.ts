/**
 * Point d'entrée unique de l'accès à l'API REST CCJV.
 *
 * ```ts
 * import { getEvents, getPublications } from "@/lib/api";
 * ```
 *
 * Aucune fonction de ce module ne lève d'exception réseau : les pages publiques
 * peuvent appeler les endpoints sans `try/catch` et doivent simplement traiter
 * le cas « donnée absente » (tableau vide ou `null`).
 */

export {
  ApiError,
  apiFetch,
  apiFetchOrThrow,
  buildApiUrl,
  getApiBaseUrl,
  logApiIssue,
  withQuery,
  type ApiFetchOptions,
  type QueryValue,
} from "./client";

export {
  getCommunityFaces,
  getDepartment,
  getDepartments,
  getEvent,
  getEvents,
  getLeaders,
  getPage,
  getPublication,
  getPublications,
  getSchedule,
  getScripture,
  getScriptures,
  getSettings,
  getTestimonies,
  type EventsQuery,
  type PublicationsQuery,
} from "./endpoints";

export type * from "./types";
