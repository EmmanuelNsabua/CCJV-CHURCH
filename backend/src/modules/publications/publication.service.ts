import type { AdminProfile, Publication, PublicationType } from "@/domain/entities";
import type {
  ListResult,
  PublicationRepository,
} from "@/domain/repositories";
import { ForbiddenError, NotFoundError, ValidationError } from "@/shared/errors/app-error";
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

  /** Lecture des publications : les brouillons sont exclus en lecture publique non authentifiée. */
  async list(query: PublicationListQuery, actor?: AdminProfile | null): Promise<ListResult<Publication>> {
    const isBackoffice = Boolean(actor);
    const status = isBackoffice ? query.status : "PUBLISHED";

    let departmentId = query.departmentId;
    let scope = query.scope;
    if (actor?.role === "DEPARTMENT_MANAGER" && actor.departmentId) {
      departmentId = actor.departmentId;
      if (actor.departmentId === "d0000000-0000-4000-8000-000000000004") {
        scope = "ECODIM";
      }
    }

    return this.publications.list(
      { limit: query.limit, offset: toOffset(query.page, query.limit) },
      {
        type: query.type,
        category: query.category,
        status,
        scope,
        departmentId,
      },
      query.sort,
    );
  }

  /** Lecture unitaire : un brouillon est accessible à un administrateur connecté. */
  async get(idOrSlug: string, actor?: AdminProfile | null): Promise<Publication> {
    const isBackoffice = Boolean(actor);
    const pub = await this.require(idOrSlug, isBackoffice);
    if (
      isBackoffice &&
      actor?.role === "DEPARTMENT_MANAGER" &&
      pub.status !== "PUBLISHED" &&
      pub.departmentId !== actor.departmentId &&
      !(actor.departmentId === "d0000000-0000-4000-8000-000000000004" && pub.scope === "ECODIM")
    ) {
      throw notFound(idOrSlug);
    }
    return pub;
  }

  async create(data: CreatePublicationBody, actor?: AdminProfile | null): Promise<Publication> {
    const { slug: requestedSlug, ...input } = data;

    if (actor?.role === "DEPARTMENT_MANAGER") {
      if (input.scope === "CCJV" || (input.departmentId && input.departmentId !== actor.departmentId)) {
        throw new ForbiddenError(
          "Un responsable départemental ne peut créer de publications que dans son périmètre (Ecodim)",
        );
      }
      input.scope = "ECODIM";
      if (actor.departmentId) {
        input.departmentId = actor.departmentId;
      }
    }

    assertContentCoherence({
      type: input.type,
      contentUrl: input.contentUrl ?? null,
      hasCover: input.coverMediaId !== undefined && input.coverMediaId !== null,
      body: input.body ?? null,
    });

    const slug = await this.resolveSlug(input.title, requestedSlug);
    const created = await this.publications.create(input, slug);

    // Une publication créée directement en ligne reste activement publiée
    // sans forcer l'archivage prématuré des publications précédentes.
    if (created.status === "PUBLISHED") {
      return created;
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
  async revertToDraft(idOrSlug: string, actor?: AdminProfile | null): Promise<Publication> {
    const existing = await this.require(idOrSlug, true);

    if (actor?.role === "DEPARTMENT_MANAGER") {
      if (
        existing.scope === "CCJV" ||
        (existing.departmentId && existing.departmentId !== actor.departmentId)
      ) {
        throw new ForbiddenError("Action réservée au périmètre attribué");
      }
    }

    const updated = await this.publications.revertToDraft(existing.id);
    if (!updated) {
      throw notFound(idOrSlug);
    }
    return updated;
  }

  /**
   * Publie une publication (brouillon ou republiée) en actualisant sa date effective.
   */
  async publish(idOrSlug: string, publishedAt?: string, actor?: AdminProfile | null): Promise<Publication> {
    const existing = await this.require(idOrSlug, true);

    if (actor?.role === "DEPARTMENT_MANAGER") {
      if (
        existing.scope === "CCJV" ||
        (existing.departmentId && existing.departmentId !== actor.departmentId)
      ) {
        throw new ForbiddenError(
          "Ce contenu relève du site général CCJV et ne peut pas être publié par un responsable départemental",
        );
      }
    }

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
    actor?: AdminProfile | null,
  ): Promise<Publication> {
    const existing = await this.require(idOrSlug, true);

    if (actor?.role === "DEPARTMENT_MANAGER") {
      if (
        existing.scope === "CCJV" ||
        (existing.departmentId && existing.departmentId !== actor.departmentId)
      ) {
        throw new ForbiddenError(
          "Ce contenu relève du site général CCJV et ne peut pas être modifié par un responsable départemental",
        );
      }
    }

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
  async remove(idOrSlug: string, actor?: AdminProfile | null): Promise<void> {
    const existing = await this.require(idOrSlug, true);

    if (actor?.role === "DEPARTMENT_MANAGER") {
      if (
        existing.scope === "CCJV" ||
        (existing.departmentId && existing.departmentId !== actor.departmentId)
      ) {
        throw new ForbiddenError("Action réservée au périmètre attribué");
      }
    }

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
