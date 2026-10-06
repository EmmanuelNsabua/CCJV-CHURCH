import { z } from "zod";

/**
 * Conventions de pagination, de tri et de filtrage partagées par toutes les
 * collections (`docs/004` §34, `docs/018` §6.3).
 *
 * Bornes délibérément strictes : le projet cible des connexions instables
 * (`docs/006` §22), une réponse volumineuse est un défaut, pas une option.
 *
 * ## Convention des paramètres de requête : refus, jamais d'ignorance
 *
 * Tous les schémas de *query* de ce fichier sont des **objets stricts** : un
 * paramètre non reconnu (`?nimportequoi=1`, ou une faute de frappe sur un filtre)
 * produit un `400 VALIDATION_ERROR` nommant le paramètre fautif, au lieu d'être
 * silencieusement écarté par Zod. C'est la convention homogène de **toutes** les
 * routes de collection : une irrégularité de contrat entre ressources obligeait
 * sinon le client à connaître, ressource par ressource, ce que le serveur ignore.
 *
 * Un schéma de *query* étendu doit donc préserver la stricteur. En Zod 4 :
 *
 * - `.extend({ ... })` **la préserve** — c'est la forme à utiliser ;
 * - un étalement `z.object({ ...paginationQuerySchema.shape })` **la perd** (il
 *   construit un objet neuf, non strict) : ne jamais l'utiliser pour un schéma
 *   de *query*.
 *
 * Les deux points sont verrouillés par `tests/unit/pagination.test.ts`.
 */

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/** Pagination commune, **stricte** : seuls `page` et `limit` sont reconnus. */
export const paginationQuerySchema = z.strictObject({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_PAGE_SIZE)
    .default(DEFAULT_PAGE_SIZE),
});

/**
 * *Query* d'une collection qui n'accepte **aucun** paramètre.
 *
 * Les listes bornées (`schedule`, `scriptures`, `social-links`) ne sont pas
 * paginées : elles ne reconnaissent donc ni `page`, ni `limit`, ni aucun filtre.
 * Ce schéma le dit explicitement — un objet vide non strict accepterait tout en
 * silence, ce qui est exactement ce que la convention interdit.
 */
export const emptyQuerySchema = z.strictObject({});

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
