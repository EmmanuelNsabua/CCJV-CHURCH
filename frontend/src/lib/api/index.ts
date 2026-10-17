/**
 * Point d'entrée unique de l'accès à l'API REST CCJV.
 *
 * ```ts
 * import { readOrUnavailable, getEvents } from "@/lib/api";
 * ```
 *
 * Aucune fonction de lecture publique ne lève d'exception réseau : les pages
 * peuvent appeler les endpoints sans `try/catch`. Ce qui a changé, c'est que
 * l'échec n'est plus **indiscernable** d'une réponse vide — `readOrUnavailable`
 * porte l'état de la lecture, et les pages distinguent alors deux situations qui
 * n'ont ni le même sens ni la même présentation :
 *
 * - `{ status: "ok", data: [] }` → l'API a répondu, il n'y a rien : `EmptyState` ;
 * - `{ status: "unreachable" }` → on n'a pas pu lire : `ContentUnavailable`.
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
  publishEvent,
  revertEventToDraft,
  cancelEvent,
  getLeaders,
  getPage,
  getPublication,
  getPublications,
  getFeaturedPublications,
  getArchivePublications,
  publishPublication,
  revertPublicationToDraft,
  getResources,
  getResource,
  createResource,
  updateResource,
  replaceResourceFile,
  deleteResource,
  getSchedule,
  getScripture,
  getScriptures,
  getSettings,
  getTestimonies,
  listEnseignements,
  createDepartment,
  updateDepartment,
  archiveDepartment,
  deleteDepartment,
  getDepartmentArchives,
  saveDepartmentActivities,
  getAdminTestimonies,
  getHeroTestimonies,
  submitPublicTestimony,
  updateTestimonyStatus,
  setTestimonyFeatured,
  updateTestimony,
  deleteTestimony,
  readOrUnavailable,
  type EventsQuery,
  type PublicationsQuery,
  type ResourceListQuery,
  type TestimonyListQuery,
  type PublicReadOptions,
  type ReadResult,
} from "./endpoints";

export type * from "./types";
