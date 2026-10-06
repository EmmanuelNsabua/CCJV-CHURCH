import { z } from "zod";

/**
 * Entrées des routes `/pages/:pageKey`.
 *
 * Le schéma du **contenu** n'est pas ici : il dépend de la page
 * (`domain/content/page-content.ts`, un schéma par `pageKey`). Le corps est donc
 * validé en deux temps : forme générale par Zod ici, contenu par le schéma de la
 * page dans le service — c'est la seule façon de rejeter une `pageKey` inconnue
 * avec `PAGE_NOT_FOUND` et un contenu non conforme avec `VALIDATION_ERROR`.
 */

export const pageParamsSchema = z.object({
  // Volontairement permissif : une clé inconnue doit produire un 404 métier
  // (`PAGE_NOT_FOUND`), pas un 400 de forme.
  pageKey: z.string().trim().min(1).max(60),
});

export const pageContentUpdateSchema = z.object({
  content: z.record(z.string(), z.unknown()),
});

export type PageContentUpdateInput = z.infer<typeof pageContentUpdateSchema>;
