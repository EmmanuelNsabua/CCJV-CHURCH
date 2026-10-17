import type {
  Publication,
  PublicationCategory,
  PublicationStatus,
  PublicationType,
} from "@/domain/entities";

/**
 * Représentation API d'une publication.
 *
 * Les champs `id`, `title`, `slug`, `type`, `contentUrl`, `description`,
 * `publishedAt`, `category`, `author` et `body` sont **strictement** ceux de
 * `frontend/src/types/index.ts` (`interface Publication`), dont les rubriques
 * Actualités / Enseignements / Médiathèque / Ressources dépendent.
 *
 * Deux champs additifs les complètent, sans rompre la compatibilité (un client
 * qui les ignore ne voit aucune différence) :
 * - `status` : sans lui, un back-office ne saurait pas ce qu'il vient de
 *   dépublier (`DRAFT`), et une liste publique ne pourrait pas être distinguée
 *   d'une liste d'administration ;
 * - `coverImage` : URL résolue du média de couverture, que le repository a
 *   chargée et que le frontend n'a pas encore de champ pour recevoir.
 */
export interface PublicationDto {
  id: string;
  title: string;
  slug: string;
  type: PublicationType;
  /** Lien vidéo externe (YouTube/Facebook) ou chemin image. */
  contentUrl?: string;
  description?: string;
  /** Date ISO `YYYY-MM-DD`. */
  publishedAt: string;
  category?: PublicationCategory;
  author?: string;
  /** Corps éditorial des publications TEXTE. */
  body?: string[];
  status: PublicationStatus;
  /** Identifiant du média de couverture. */
  coverMediaId?: string;
  /** Ex-`coverImageUrl` : média de couverture résolu. */
  coverImage?: string;
}

export function toPublicationDto(publication: Publication): PublicationDto {
  return {
    id: publication.id,
    title: publication.title,
    slug: publication.slug,
    type: publication.type,
    contentUrl: publication.contentUrl ?? undefined,
    description: publication.description ?? undefined,
    publishedAt: publication.publishedAt,
    category: publication.category,
    author: publication.author ?? undefined,
    body: publication.body ?? undefined,
    status: publication.status,
    coverMediaId: publication.coverMediaId ?? undefined,
    coverImage: publication.coverImageUrl ?? undefined,
  };
}
