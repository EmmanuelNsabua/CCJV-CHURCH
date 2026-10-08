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

/**
 * Enveloppe d'écriture (`docs/031` §3.3).
 *
 * **`strictObject`, et c'est une exigence du document, pas un détail.** §3.4
 * exige que `{ content: {…}, extra: 1 }` soit refusé en `400` en **nommant**
 * `extra`. Un `z.object` ordinaire, lui, *retirerait* la clé inconnue : la
 * requête passerait pour un succès, et le client croirait avoir écrit un champ
 * qui n'existe pas. Sur un contenu éditorial, un faux succès se paie en
 * relecture humaine — quelqu'un cherchera longtemps pourquoi son texte ne
 * s'affiche pas.
 *
 * Le tableau est refusé explicitement : en JavaScript un tableau **est** un
 * objet, et `z.record` l'accepterait. §3.4 attend un `400` sur `content: []`.
 */
export const pageContentUpdateSchema = z.strictObject({
  content: z
    .record(z.string(), z.unknown())
    .refine((value) => !Array.isArray(value), {
      message: "Le contenu doit être un objet, jamais un tableau",
    }),
});

export type PageContentUpdateInput = z.infer<typeof pageContentUpdateSchema>;
