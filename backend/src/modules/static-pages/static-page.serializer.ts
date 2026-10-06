import type { StaticPage } from "@/domain/entities";

/**
 * Représentation API d'une page éditable.
 *
 * `content` est renvoyé tel que stocké : un objet de **champs textuels nommés**,
 * jamais du HTML ni une mise en page. Le frontend sait quels champs lire pour
 * chaque `pageKey` (registre `domain/content/page-content.ts`).
 *
 * `updatedBy` identifie l'administrateur de la dernière modification : c'est une
 * donnée de traçabilité, jamais une donnée d'affichage public.
 */
export interface StaticPageDto {
  id: string;
  pageKey: string;
  content: Record<string, unknown>;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export function toStaticPageDto(page: StaticPage): StaticPageDto {
  return {
    id: page.id,
    pageKey: page.pageKey,
    content: page.content,
    updatedBy: page.updatedBy,
    createdAt: page.createdAt.toISOString(),
    updatedAt: page.updatedAt.toISOString(),
  };
}
