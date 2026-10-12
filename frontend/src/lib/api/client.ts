/**
 * Client HTTP de l'API REST CCJV (`/api/v1`).
 *
 * ⚠️ Contrainte de production : le site est déployé sur Vercel et **doit
 * continuer à s'afficher** même si l'API est injoignable (conteneur Railway
 * endormi, réseau coupé). Aucune fonction de ce module ne propage donc une
 * erreur réseau ou un statut non-2xx par défaut :
 *
 * - `apiFetch` renvoie `null` (ou, côté endpoints, un tableau vide) et
 *   journalise l'incident côté serveur ;
 * - `apiFetchOrThrow` est la variante stricte, réservée au futur back-office,
 *   où une erreur doit au contraire être visible.
 *
 * Les lectures publiques sont mises en cache 60 s côté Next (`next.revalidate`)
 * et bornées dans le temps (`AbortSignal.timeout`), pour que des connexions
 * instables se traduisent par une page sans données — jamais par une 500 ni par
 * une requête qui bloque le rendu.
 */

import { unstable_rethrow } from "next/navigation";

/** Au-delà de ce délai, on considère que l'API ne répondra pas. */
const DEFAULT_TIMEOUT_MS = 5_000;

/** Durée de mise en cache Next appliquée par défaut aux lectures publiques. */
const PUBLIC_REVALIDATE_SECONDS = 60;

/** Version d'API portée par le client : jamais dans les fonctions d'endpoint. */
const API_PREFIX = "/api/v1";

/** Options de cache Next (`next.revalidate` / `next.tags`). */
interface NextCacheConfig {
  revalidate?: number | false;
  tags?: string[];
}

export interface ApiFetchOptions extends Omit<RequestInit, "body" | "signal"> {
  /**
   * Corps de requête. Un objet simple est sérialisé en JSON et l'en-tête
   * `Content-Type: application/json` est ajouté automatiquement.
   */
  body?: BodyInit | Record<string, unknown> | null;
  /** Signal d'annulation appelant ; combiné au délai maximal. */
  signal?: AbortSignal;
  /**
   * Fenêtre de revalidation Next. `false` (ou `0`) désactive le cache.
   * Par défaut : 60 s sur les lectures publiques, aucun cache sinon.
   */
  revalidate?: number | false;
  /** Délai maximal en millisecondes (5 000 par défaut). */
  timeoutMs?: number;
  /** Jeton d'authentification Bearer explicite (optionnel si le provider global est configuré). */
  token?: string | null;
}

/** Valeurs acceptées dans une chaîne de requête ; `null`/`undefined` sont omis. */
export type QueryValue = string | number | boolean | undefined | null;

/** Type du fournisseur global de jeton d'authentification. */
export type AuthTokenProvider = () => string | null | Promise<string | null>;

let globalAuthTokenProvider: AuthTokenProvider | null = null;

/** Définit le fournisseur global de jeton d'accès pour les requêtes administratives. */
export function setApiAuthTokenProvider(provider: AuthTokenProvider | null): void {
  globalAuthTokenProvider = provider;
}

/** Erreur normalisée, levée par la seule variante `apiFetchOrThrow`. */
export class ApiError extends Error {
  /** Statut HTTP, ou `null` si la requête n'a jamais abouti (réseau, délai). */
  readonly status: number | null;
  /** `HTTP_ERROR`, `NETWORK_ERROR` ou `INVALID_JSON`. */
  readonly code: string;
  /** Données détaillées renvoyées par le backend (erreurs de validation, champ, etc.). */
  readonly details?: unknown;

  constructor(
    message: string,
    status: number | null,
    code: string,
    details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * URL de base de l'API.
 *
 * `API_URL` a la priorité : c'est la variable à définir côté Vercel (elle peut
 * pointer vers un nom d'hôte interne ou une adresse sans préfixe `NEXT_PUBLIC_`,
 * donc sans être exposée au navigateur).
 */
export function getApiBaseUrl(): string {
  const raw =
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:4000";

  return raw.trim().replace(/\/+$/, "");
}

/**
 * Construit l'URL absolue d'une ressource.
 *
 * Les endpoints passent des chemins **relatifs à `/api/v1`** (`/events`,
 * `/publications/slug`) ; un chemin déjà préfixé est utilisé tel quel.
 */
export function buildApiUrl(path: string): string {
  const base = getApiBaseUrl();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized === API_PREFIX || normalized.startsWith(`${API_PREFIX}/`)) {
    return `${base}${normalized}`;
  }
  return `${base}${API_PREFIX}${normalized}`;
}

/** Ajoute une chaîne de requête en omettant les valeurs absentes. */
export function withQuery(
  path: string,
  params: object = {},
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params as Record<string, unknown>)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }


  const query = search.toString();
  return query === "" ? path : `${path}?${query}`;
}

/**
 * Journalisation des incidents côté serveur.
 *
 * Une panne d'API ne doit jamais faire échouer un rendu : elle doit rester
 * lisible dans les logs (terminal en développement, logs Vercel en production).
 */
export function logApiIssue(message: string, error?: unknown): void {
  const suffix = error === undefined ? "" : ` — ${describeError(error)}`;
  console.warn(`[api] ${message}${suffix}`);
}

function describeError(error: unknown): string {
  if (error instanceof Error) {
    // `AbortSignal.timeout()` lève un DOMException nommé « TimeoutError ».
    if (error.name === "TimeoutError") return "délai d'attente dépassé";
    return `${error.name}: ${error.message}`;
  }
  return String(error);
}

/**
 * Combine le délai maximal et, s'il existe, le signal de l'appelant : le
 * premier des deux qui se déclenche interrompt la requête.
 */
function resolveSignal(timeoutMs: number, external?: AbortSignal): AbortSignal {
  if (typeof AbortSignal.timeout !== "function") {
    return external ?? new AbortController().signal;
  }

  const timeout = AbortSignal.timeout(timeoutMs);
  if (!external) return timeout;

  const combine = (
    AbortSignal as unknown as {
      any?: (signals: AbortSignal[]) => AbortSignal;
    }
  ).any;

  return typeof combine === "function" ? combine([timeout, external]) : external;
}

/** Sérialise un corps d'objet en JSON ; laisse les corps natifs intacts. */
function serializeBody(
  body: BodyInit | Record<string, unknown> | null | undefined,
): BodyInit | undefined {
  if (body === undefined || body === null) return undefined;
  if (typeof body === "string") return body;
  if (typeof FormData !== "undefined" && body instanceof FormData) return body;
  if (typeof URLSearchParams !== "undefined" && body instanceof URLSearchParams) {
    return body;
  }
  if (typeof Blob !== "undefined" && body instanceof Blob) return body;
  if (body instanceof ArrayBuffer || ArrayBuffer.isView(body)) {
    return body as BodyInit;
  }
  return JSON.stringify(body);
}

/** Lit un corps de réponse sans jamais lever. */
async function readTextSafely(response: Response): Promise<string | null> {
  try {
    return await response.text();
  } catch {
    return null;
  }
}

/**
 * Extrait `error.message` d'une réponse d'erreur pour rendre les logs utiles,
 * sans jamais lever si le corps n'est pas du JSON.
 */
interface ParsedErrorResult {
  message: string;
  details?: unknown;
}

async function readErrorDetail(response: Response): Promise<ParsedErrorResult> {
  const text = await readTextSafely(response);
  if (!text) return { message: `HTTP ${response.status}` };

  try {
    const parsed: unknown = JSON.parse(text);
    if (typeof parsed === "object" && parsed !== null) {
      const record = parsed as Record<string, unknown>;
      const errorObj = record.error;
      if (typeof errorObj === "object" && errorObj !== null) {
        const errorRecord = errorObj as Record<string, unknown>;
        return {
          message: typeof errorRecord.message === "string" ? errorRecord.message : `HTTP ${response.status}`,
          details: errorRecord.details ?? errorObj,
        };
      }
      return {
        message: typeof record.message === "string" ? record.message : `HTTP ${response.status}`,
        details: parsed,
      };
    }

  } catch {
    // Corps non JSON
  }

  return { message: text.slice(0, 200) };
}

/** Mutualise l'échec : propage en mode strict, journalise et renvoie `null` sinon. */
function handleFailure(
  propagate: boolean,
  status: number | null,
  code: string,
  message: string,
  error?: unknown,
  details?: unknown,
): null {
  if (propagate) throw new ApiError(message, status, code, details);
  logApiIssue(message, error);
  return null;
}

async function request<T>(
  path: string,
  options: ApiFetchOptions,
  propagate: boolean,
): Promise<T | null> {
  const {
    revalidate,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    signal,
    headers,
    body,
    token,
    ...rest
  } = options;

  let resolvedToken = token;
  if (!resolvedToken && globalAuthTokenProvider) {
    try {
      resolvedToken = await globalAuthTokenProvider();
    } catch {
      // Échec silencieux de récupération de jeton
    }
  }

  const url = buildApiUrl(path);
  const method = (rest.method ?? "GET").toUpperCase();
  const isRead = method === "GET" || method === "HEAD";
  const cacheRevalidate = revalidate ?? (isRead ? PUBLIC_REVALIDATE_SECONDS : 0);

  const reqHeaders: Record<string, string> = {
    Accept: "application/json",
    ...(body !== undefined && body !== null && !(body instanceof FormData)
      ? { "Content-Type": "application/json" }
      : {}),
    ...(resolvedToken ? { Authorization: `Bearer ${resolvedToken}` } : {}),
    ...(headers as Record<string, string> | undefined),
  };

  const init: RequestInit & { next?: NextCacheConfig } = {
    ...rest,
    method,
    headers: reqHeaders,
    next: { revalidate: cacheRevalidate },
  };

  // Un GET/HEAD ne peut pas porter de corps
  if (!isRead) {
    const serialized = body instanceof FormData ? body : serializeBody(body);
    if (serialized !== undefined) init.body = serialized;
  }

  init.signal = resolveSignal(timeoutMs, signal);

  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (error) {
    unstable_rethrow(error);
    return handleFailure(
      propagate,
      null,
      "NETWORK_ERROR",
      `échec de l'appel à ${path} (${getApiBaseUrl()})`,
      error,
    );
  }

  if (!response.ok) {
    const errResult = await readErrorDetail(response);
    return handleFailure(
      propagate,
      response.status,
      "HTTP_ERROR",
      errResult.message,
      undefined,
      errResult.details,
    );
  }

  const text = await readTextSafely(response);
  // Corps vide (204, proxy sans contenu) : aucune donnée, mais pas une erreur.
  if (text === null || text.trim() === "") return null;

  try {
    return JSON.parse(text) as T;
  } catch (error) {
    return handleFailure(
      propagate,
      response.status,
      "INVALID_JSON",
      `réponse JSON illisible sur ${path}`,
      error,
    );
  }
}

/**
 * Appel d'API **tolérant aux pannes** : renvoie `null` en cas d'échec réseau,
 * de statut non-2xx, de délai dépassé ou de corps illisible. Ne lève jamais.
 *
 * C'est la fonction utilisée par toutes les pages publiques.
 */
export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T | null> {
  return request<T>(path, options, false);
}

/**
 * Variante stricte, réservée au back-office : même comportement de transport,
 * mais toute anomalie lève une `ApiError` au lieu de renvoyer `null`.
 *
 * Un corps vide (204) se traduit par `undefined`.
 */
export async function apiFetchOrThrow<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const result = await request<T>(path, options, true);
  return result as T;
}
