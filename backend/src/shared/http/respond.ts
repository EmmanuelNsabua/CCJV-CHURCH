import type { Response } from "express";
import type { PaginationMeta } from "./pagination";
import { buildPaginationMeta } from "./pagination";

/**
 * Contrat de réponse de l'API (`docs/004` §34).
 *
 * - collection : `{ data: [], meta: { page, limit, total, totalPages } }`
 * - ressource  : la ressource directement
 * - erreur     : `{ error: { code, message, details? } }`
 *
 * Ces trois formes sont les seules produites par l'API. Les centraliser ici
 * évite qu'un controller invente sa propre structure.
 */

export function sendCollection<T>(
  res: Response,
  items: T[],
  page: number,
  limit: number,
  total: number,
): void {
  const meta: PaginationMeta = buildPaginationMeta(page, limit, total);
  res.status(200).json({ data: items, meta });
}

export function sendItem<T>(res: Response, item: T, statusCode = 200): void {
  res.status(statusCode).json(item);
}

export function sendNoContent(res: Response): void {
  res.status(204).end();
}

/** Erreur normalisée. Le `details` ne contient jamais de donnée sensible. */
export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: unknown,
  extraHeaders?: Record<string, string>,
): void {
  const body: ApiErrorBody = { error: { code, message } };
  if (details !== undefined) {
    body.error.details = details;
  }
  if (extraHeaders) {
    for (const [name, value] of Object.entries(extraHeaders)) {
      res.setHeader(name, value);
    }
  }
  res.status(statusCode).json(body);
}
