import { z } from "zod";

/**
 * Conventions de pagination, de tri et de filtrage partagées par toutes les
 * collections (`docs/004` §34, `docs/018` §6.3).
 *
 * Bornes délibérément strictes : le projet cible des connexions instables
 * (`docs/006` §22), une réponse volumineuse est un défaut, pas une option.
 */

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_PAGE_SIZE)
    .default(DEFAULT_PAGE_SIZE),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function buildPaginationMeta(
  page: number,
  limit: number,
  total: number,
): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / limit),
  };
}

export function toOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

/** Enveloppe d'une réponse de collection. */
export interface CollectionResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Construit un schéma de tri à partir d'une liste blanche de colonnes.
 * Le nom de colonne vient toujours du serveur : jamais du client, ce qui
 * interdirait toute injection par `sort`.
 */
export function createSortSchema<const T extends readonly [string, ...string[]]>(
  columns: T,
  fallback: T[number],
) {
  return z
    .string()
    .optional()
    .transform((raw) => {
      const value = (raw ?? fallback).trim();
      const direction = value.startsWith("-") ? "desc" : "asc";
      const column = value.replace(/^-/, "");
      return { column, direction } as {
        column: T[number];
        direction: "asc" | "desc";
      };
    })
    .refine((parsed) => columns.includes(parsed.column), {
      message: `Tri non autorisé : colonnes acceptées ${columns.join(", ")}`,
    });
}
