import type {
  AdminProfile,
  BiblicalReference,
  Teaching,
  TeachingMedia,
} from "@/domain/entities";
import type {
  BiblicalReferenceInput,
  MediaRepository,
  TeachingMediaInput,
  TeachingRepository,
} from "@/domain/repositories";
import {
  validateBiblicalReferences,
  validateTeachingCanBePublished,
  validateTeachingMetadata,
} from "@/domain/rules/teaching-validation";
import type {
  CreateTeachingBody,
  TeachingListQuery,
  UpdateTeachingBody,
} from "./teaching.schema";
import {
  DuplicateSlugError,
  NotFoundError,
  ValidationError,
} from "@/shared/errors/app-error";
import { slugify } from "@/shared/utils/slug";

export class TeachingNotFoundError extends NotFoundError {
  constructor(idOrSlug: string) {
    super("NOT_FOUND", `Enseignement introuvable (${idOrSlug})`, { idOrSlug });
  }
}

export class TeachingService {
  constructor(
    private readonly repo: TeachingRepository,
    private readonly mediaRepo: MediaRepository,
  ) {}

  /**
   * Liste paginée des enseignements.
   * Si l'utilisateur n'est pas un administrateur authentifié, seuls les enseignements PUBLISHED sont retournés.
   */
  async list(
    query: Partial<TeachingListQuery> = {},
    actor?: AdminProfile | null,
  ): Promise<{ items: Teaching[]; total: number }> {
    const isAdmin =
      actor && (actor.role === "SUPER_ADMIN" || actor.role === "ADMIN");

    let status = query.status;
    if (!isAdmin) {
      status = "PUBLISHED";
    }

    const limit = query.limit ?? 20;
    const page = query.page ?? 1;
    const offset = (page - 1) * limit;

    return this.repo.list({
      status,
      search: query.search,
      limit,
      offset,
    });
  }

  /**
   * Détail d'un enseignement par son identifiant UUID ou son slug.
   */
  async get(idOrSlug: string, actor?: AdminProfile | null): Promise<Teaching> {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        idOrSlug,
      );

    const teaching = isUuid
      ? await this.repo.findById(idOrSlug)
      : await this.repo.findBySlug(idOrSlug);

    if (!teaching) {
      throw new TeachingNotFoundError(idOrSlug);
    }

    const isAdmin =
      actor && (actor.role === "SUPER_ADMIN" || actor.role === "ADMIN");

    if (!isAdmin && teaching.status !== "PUBLISHED") {
      throw new TeachingNotFoundError(idOrSlug);
    }

    return teaching;
  }

  /**
   * Création d'un enseignement (statut initial DRAFT par défaut).
   */
  async create(body: CreateTeachingBody): Promise<Teaching> {
    validateTeachingMetadata({
      title: body.title,
      speakerName: body.speakerName,
      preachedAt: body.preachedAt,
    });

    const slug = body.slug?.trim()
      ? slugify(body.slug.trim())
      : body.title?.trim()
        ? slugify(body.title.trim())
        : null;

    return this.repo.create({
      title: body.title.trim(),
      slug,
      speakerName: body.speakerName.trim(),
      preachedAt: body.preachedAt.trim(),
      summary: body.summary?.trim() || null,
      description: body.description?.trim() || null,
      status: body.status ?? "DRAFT",
    });
  }

  /**
   * Modification des métadonnées d'un enseignement.
   */
  async update(id: string, body: UpdateTeachingBody): Promise<Teaching> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new TeachingNotFoundError(id);
    }

    validateTeachingMetadata({
      title: body.title,
      speakerName: body.speakerName,
      preachedAt: body.preachedAt,
    });

    const slug =
      body.slug !== undefined
        ? body.slug?.trim()
          ? slugify(body.slug.trim())
          : null
        : undefined;

    return this.repo.update(id, {
      title: body.title?.trim(),
      slug,
      speakerName: body.speakerName?.trim(),
      preachedAt: body.preachedAt?.trim(),
      summary: body.summary !== undefined ? (body.summary?.trim() || null) : undefined,
      description: body.description !== undefined ? (body.description?.trim() || null) : undefined,
      status: body.status,
    });
  }

  /**
   * Mise à jour atomique de l'ensemble des références bibliques.
   */
  async updateBiblicalReferences(
    id: string,
    references: BiblicalReferenceInput[],
  ): Promise<BiblicalReference[]> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new TeachingNotFoundError(id);
    }

    validateBiblicalReferences(references);

    return this.repo.updateBiblicalReferences(id, references);
  }

  /**
   * Mise à jour des associations avec les médias centraux.
   */
  async updateMedias(
    id: string,
    medias: TeachingMediaInput[],
  ): Promise<TeachingMedia[]> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new TeachingNotFoundError(id);
    }

    // Vérifier l'existence de chaque média
    for (const item of medias) {
      const mediaRecord = await this.mediaRepo.findById(item.mediaId);
      if (!mediaRecord) {
        throw new NotFoundError(
          "MEDIA_NOT_FOUND",
          `Média central introuvable pour l'identifiant ${item.mediaId}`,
        );
      }
    }

    // Un seul média principal peut être défini
    const primaryCount = medias.filter((m) => m.isPrimary).length;
    if (primaryCount > 1) {
      throw new ValidationError(
        "Un seul média peut être désigné comme média principal",
        [{ champ: "medias", message: "Plusieurs médias principaux spécifiés" }],
      );
    }

    return this.repo.updateMedias(id, medias);
  }

  /**
   * Publication contrôlée de l'enseignement.
   * Règle impérative : au moins un média visuel (vidéo ou image) ou audio valide doit être attaché.
   */
  async publish(id: string): Promise<Teaching> {
    const teaching = await this.repo.findById(id);
    if (!teaching) {
      throw new TeachingNotFoundError(id);
    }

    validateTeachingMetadata({
      title: teaching.title,
      speakerName: teaching.speakerName,
      preachedAt: teaching.preachedAt,
    });

    validateTeachingCanBePublished(teaching.medias);

    return this.repo.publish(id, new Date());
  }

  /**
   * Archivage d'un enseignement.
   */
  async archive(id: string): Promise<Teaching> {
    const teaching = await this.repo.findById(id);
    if (!teaching) {
      throw new TeachingNotFoundError(id);
    }

    return this.repo.archive(id);
  }

  /**
   * Suppression d'un enseignement.
   */
  async delete(id: string): Promise<void> {
    const teaching = await this.repo.findById(id);
    if (!teaching) {
      throw new TeachingNotFoundError(id);
    }

    await this.repo.delete(id);
  }
}
