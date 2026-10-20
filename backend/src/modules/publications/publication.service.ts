import type { Publication, PublicationType } from "@/domain/entities";
import type {
  ListResult,
  PublicationRepository,
} from "@/domain/repositories";
import { NotFoundError, ValidationError } from "@/shared/errors/app-error";
import { toOffset } from "@/shared/http/pagination";
import { slugify, uniqueSlug } from "@/shared/utils/slug";
import type {
  CreatePublicationBody,
  PublicationListQuery,
  UpdatePublicationBody,
} from "./publication.schema";

/**
 * Règles métier des publications.
 *
 * ⚠️ **Aucun brouillon ne sort d'une lecture publique.** Le service force
 * `status: "PUBLISHED"` en liste et appelle `findByIdOrSlug(value, false)` en
 * lecture unitaire : la garde est appliquée à chaque point d'entrée public, et
 * pas seulement dans la *query* du client, qui est de toute façon dépourvue de
 * ce filtre.
 *
 * Les opérations d'administration (`update`, `remove`) résolvent au contraire la
 * ressource **brouillons compris** : sans cela, un administrateur ne pourrait
 * ni corriger ni supprimer ce qu'il a dépublié.
 */
export class PublicationService {
  constructor(private readonly publications: PublicationRepository) {}

  /** Lecture publique : les brouillons sont exclus, quoi qu'il arrive. */
  async list(query: PublicationListQuery): Promise<ListResult<Publication>> {
    return this.publications.list(
      { limit: query.limit, offset: toOffset(query.page, query.limit) },
      { type: query.type, category: query.category, status: "PUBLISHED" },
      query.sort,
    );
  }

  /** Lecture publique unitaire : un brouillon est indistinguable d'un absent. */
  async get(idOrSlug: string): Promise<Publication> {
    return this.require(idOrSlug, false);
  }

  async create(data: CreatePublicationBody): Promise<Publication> {
    const { slug: requestedSlug, ...input } = data;

    assertContentCoherence({
      type: input.type,
      contentUrl: input.contentUrl ?? null,
      hasCover: input.coverMediaId !== undefined && input.coverMediaId !== null,
      body: input.body ?? null,
    });

    const slug = await this.resolveSlug(input.title, requestedSlug);
    const created = await this.publications.create(input, slug);

    // **Règle globale des 3** (`docs/035` §1) : une publication créée
    // directement en ligne passe par le quota, jamais par une écriture de statut.
    // Sans ce détour, créer une quatrième publication `PUBLISHED` laisserait le
    // site à quatre publications — la règle serait décrite, pas appliquée.
    if (created.status === "PUBLISHED") {
      return (await this.publications.publishWithQuota(created.id, created.publishedAt)) ?? created;
    }

    return created;
  }

  /** Les 3 publications publiées les plus récentes (mises en avant). */
  async listFeatured(limit: number = 3): Promise<Publication[]> {
    return this.publications.listFeatured(limit);
  }

  /** Archives des publications publiées. */
  async listArchives(query: PublicationListQuery): Promise<ListResult<Publication>> {
    return this.publications.listArchives({
      limit: query.limit,
      offset: toOffset(query.page, query.limit),
    });
  }

  /**
   * Repasse une publication publiée en brouillon pour autoriser sa modification (règle §3.3).
   */
  async revertToDraft(idOrSlug: string): Promise<Publication> {
    const existing = await this.require(idOrSlug, true);
    const updated = await this.publications.revertToDraft(existing.id);
    if (!updated) {
      throw notFound(idOrSlug);
    }
    return updated;
  }

  /**
   * Publie une publication (brouillon ou republiée) en actualisant sa date effective.
   */
  async publish(idOrSlug: string, publishedAt?: string): Promise<Publication> {
    const existing = await this.require(idOrSlug, true);
    const updated = await this.publications.publish(existing.id, publishedAt);
    if (!updated) {
      throw notFound(idOrSlug);
    }
    return updated;
  }

  /**
   * Mise à jour partielle.
   *
   * Règle §3.3 : Toute modification d'une publication déjà publiée exige un retour
   * explicite au brouillon. Si la ressource est PUBLISHED et que l'appel ne demande pas
   * explicitement status: "DRAFT", la modification directe est refusée.
   */
  async update(
    idOrSlug: string,
    data: UpdatePublicationBody,
  ): Promise<Publication> {
    const existing = await this.require(idOrSlug, true);

    if (existing.status === "PUBLISHED" && data.status !== "DRAFT") {
      throw new ValidationError(
        "Une publication déjà publiée ne peut pas être modifiée directement. Veuillez d'abord la repasser en brouillon.",
      );
    }

    assertContentCoherence({
      type: data.type ?? existing.type,
      contentUrl:
        data.contentUrl !== undefined ? data.contentUrl : existing.contentUrl,
      hasCover:
        data.coverMediaId !== undefined
          ? data.coverMediaId !== null
          : existing.coverImageUrl !== null,
      body: data.body !== undefined ? data.body : existing.body,
    });

    const updated = await this.publications.update(existing.id, data);
    if (updated === null) {
      throw notFound(idOrSlug);
    }

    return updated;
  }

  /** Administration : un brouillon est supprimable comme une publication. */
  async remove(idOrSlug: string): Promise<void> {
    const existing = await this.require(idOrSlug, true);

    const removed = await this.publications.remove(existing.id);
    if (!removed) {
      throw notFound(idOrSlug);
    }
  }

  private async require(
    idOrSlug: string,
    includeDrafts: boolean,
  ): Promise<Publication> {
    const publication = await this.publications.findByIdOrSlug(
      idOrSlug,
      includeDrafts,
    );
    if (publication === null) {
      throw notFound(idOrSlug);
    }
    return publication;
  }

  /**
   * Slug définitif : slug explicite **suffixé** s'il est déjà pris, sinon
   * dérivé du titre.
   *
   * Le slug est une adresse, pas une identité : deux publications peuvent
   * porter le même titre. Refuser l'enregistrement sur un doublon de slug
   * obligeait à renommer une publication pour une contrainte d'URL.
   */
  private async resolveSlug(title: string, requested?: string): Promise<string> {
    const explicit = requested === undefined ? "" : slugify(requested);
    const base = explicit.length > 0 ? explicit : title;

    return uniqueSlug(base, (candidate) =>
      this.publications.slugExists(candidate),
    );
  }
}

interface ContentShape {
  type: PublicationType;
  contentUrl: string | null;
  /** Une couverture est-elle associée (média résolu ou identifiant fourni) ? */
  hasCover: boolean;
  body: string[] | null;
}

/**
 * Cohérence entre le type déclaré et le contenu réellement fourni.
 *
 * - `VIDEO` : le lien est la ressource, il doit être une URL http(s) — le
 *   fichier vidéo n'est jamais hébergé par CCJV ;
 * - `PHOTO` : une image suffit, sous forme d'URL **ou** de média de couverture
 *   (le frontend accepte un chemin relatif `/media/…`) ;
 * - `TEXTE` : le propos est porté par `body`, une URL n'y remplace rien.
 */
function assertContentCoherence(input: ContentShape): void {
  if (input.type === "VIDEO") {
    if (input.contentUrl === null || !isHttpUrl(input.contentUrl)) {
      throw new ValidationError(
        "Une publication VIDEO doit avoir un contentUrl http(s) valide",
        { champ: "contentUrl" },
      );
    }
    return;
  }

  if (input.type === "PHOTO") {
    if (input.contentUrl === null && !input.hasCover) {
      throw new ValidationError(
        "Une publication PHOTO doit avoir un contentUrl ou un coverMediaId",
        { champ: "contentUrl" },
      );
    }
    return;
  }

  const paragraphs = (input.body ?? []).filter(
    (paragraph) => paragraph.trim().length > 0,
  );
  if (paragraphs.length === 0) {
    throw new ValidationError(
      "Une publication TEXTE doit avoir un body non vide",
      { champ: "body" },
    );
  }
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function notFound(idOrSlug: string): NotFoundError {
  return new NotFoundError(
    "PUBLICATION_NOT_FOUND",
    `Aucune publication ne correspond à « ${idOrSlug} »`,
  );
}
