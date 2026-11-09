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
import { ForbiddenError, NotFoundError, ValidationError } from "@/shared/errors/app-error";
import { notificationHub } from "@/infrastructure/notifications/notification-hub";
import { slugify, uniqueSlug } from "@/shared/utils/slug";

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
    const isBackoffice = Boolean(actor);
    const status = isBackoffice ? query.status : "PUBLISHED";

    const limit = query.limit ?? 20;
    const page = query.page ?? 1;
    const offset = (page - 1) * limit;

    let departmentId = query.departmentId;
    let scope = query.scope;
    if (actor?.role === "DEPARTMENT_MANAGER" && actor.departmentId) {
      departmentId = actor.departmentId;
      if (actor.departmentId === "d0000000-0000-4000-8000-000000000004") {
        scope = "ECODIM";
      }
    }

    return this.repo.list({
      status,
      scope,
      departmentId,
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

    const canViewDraft =
      actor &&
      (actor.role === "SUPER_ADMIN" ||
        actor.role === "ADMIN" ||
        (actor.role === "DEPARTMENT_MANAGER" &&
          (actor.departmentId === teaching.departmentId ||
            (actor.departmentId === "d0000000-0000-4000-8000-000000000004" &&
              teaching.scope === "ECODIM"))));

    if (!canViewDraft && teaching.status !== "PUBLISHED") {
      throw new TeachingNotFoundError(idOrSlug);
    }

    return teaching;
  }

  /**
   * Création d'un enseignement (statut initial DRAFT par défaut).
   *
   * `PUBLISHED` est **refusé** à la création : un enseignement neuf n'a par
   * définition aucun média associé, donc la règle de publication (§4.3 —
   * au moins un média principal) ne pourrait pas être vérifiée, et aucune date
   * de publication ne serait posée. La publication passe exclusivement par
   * `publish()`, qui contrôle les médias et horodate `publishedAt`.
   */
  async create(body: CreateTeachingBody, actor?: AdminProfile | null): Promise<Teaching> {
    if (body.status === "PUBLISHED") {
      throw new ValidationError(
        "Un enseignement ne peut pas être créé directement publié",
        [
          {
            champ: "status",
            message:
              "Créez l'enseignement en brouillon, associez-lui un média principal, puis publiez-le : la date de publication doit être posée par le serveur.",
          },
        ],
      );
    }

    if (actor?.role === "DEPARTMENT_MANAGER") {
      if (body.scope === "CCJV" || (body.departmentId && body.departmentId !== actor.departmentId)) {
        throw new ForbiddenError(
          "Un responsable départemental ne peut créer d'enseignements que dans son périmètre (Ecodim)",
        );
      }
      body.scope = "ECODIM";
      if (actor.departmentId) {
        body.departmentId = actor.departmentId;
      }
    }

    validateTeachingMetadata({
      title: body.title,
      speakerName: body.speakerName,
      preachedAt: body.preachedAt,
    });

    const slug = await this.resolveSlug(body.title.trim(), body.slug);

    const created = await this.repo.create({
      title: body.title.trim(),
      slug,
      speakerName: body.speakerName.trim(),
      preachedAt: body.preachedAt.trim(),
      summary: body.summary?.trim() || null,
      description: body.description?.trim() || null,
      scope: body.scope ?? "CCJV",
      departmentId: body.departmentId ?? null,
      status: body.status ?? "DRAFT",
    });

    notificationHub.publish({
      type: "teaching",
      title: `Nouvel enseignement : ${created.title}`,
      message: `${actor?.displayName || actor?.username || "Un administrateur"} a créé un enseignement`,
      actorId: actor?.id ?? null,
      actorName: actor?.displayName || actor?.username || null,
      departmentId: created.departmentId ?? (created.scope === "ECODIM" ? "d0000000-0000-4000-8000-000000000004" : null),
    });

    return created;
  }

  /**
   * Modification des métadonnées d'un enseignement.
   *
   * Le statut n'est jamais écrit tel quel : une demande de `PUBLISHED` sur un
   * enseignement encore non publié emprunte la **transition contrôlée** de
   * `publish()` (même règle de média, même horodatage de `publishedAt`). Sans
   * cela, un `PATCH { status: "PUBLISHED" }` publierait un enseignement sans
   * média et laisserait `publishedAt` à `NULL` — la page publique ne saurait
   * alors plus quel message est le plus récent.
   *
   * Re-enregistrer un enseignement déjà publié ne modifie **pas** sa date de
   * publication : sa récence éditoriale reste celle de sa première publication.
   */
  async update(
    id: string,
    body: UpdateTeachingBody,
    actor?: AdminProfile | null,
  ): Promise<Teaching> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new TeachingNotFoundError(id);
    }

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

    validateTeachingMetadata({
      title: body.title,
      speakerName: body.speakerName,
      preachedAt: body.preachedAt,
    });

    /*
     * Slug : `undefined` = ne pas toucher à l'adresse existante ; `null` = la
     * vider explicitement ; sinon un slug libre, suffixé s'il est pris. Le
     * slug de **sa propre** ligne n'est pas un conflit (`exceptId`).
     */
    const slug =
      body.slug === undefined
        ? undefined
        : body.slug?.trim()
          ? await this.resolveSlug(body.slug.trim(), body.slug, id)
          : null;

    const requestsPublication = body.status === "PUBLISHED";
    const publishingNow = requestsPublication && existing.status !== "PUBLISHED";

    const updated = await this.repo.update(id, {
      title: body.title?.trim(),
      slug,
      speakerName: body.speakerName?.trim(),
      preachedAt: body.preachedAt?.trim(),
      summary: body.summary !== undefined ? (body.summary?.trim() || null) : undefined,
      description: body.description !== undefined ? (body.description?.trim() || null) : undefined,
      scope: body.scope,
      departmentId: body.departmentId,
      // `PUBLISHED` est appliqué plus bas par `publish()`, jamais ici ; une
      // absence de statut reste une absence de clé (aucune écriture).
      ...(body.status !== undefined && !requestsPublication
        ? { status: body.status }
        : {}),
    });

    if (!publishingNow) return updated;

    validateTeachingCanBePublished(updated.medias);
    return this.repo.publish(id, new Date());
  }

  /**
   * Mise à jour atomique de l'ensemble des références bibliques.
   */
  async updateBiblicalReferences(
    id: string,
    references: BiblicalReferenceInput[],
    actor?: AdminProfile | null,
  ): Promise<BiblicalReference[]> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new TeachingNotFoundError(id);
    }

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

    validateBiblicalReferences(references);

    return this.repo.updateBiblicalReferences(id, references);
  }

  /**
   * Mise à jour des associations avec les médias centraux.
   */
  async updateMedias(
    id: string,
    medias: TeachingMediaInput[],
    actor?: AdminProfile | null,
  ): Promise<TeachingMedia[]> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new TeachingNotFoundError(id);
    }

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
  async publish(id: string, actor?: AdminProfile | null): Promise<Teaching> {
    const teaching = await this.repo.findById(id);
    if (!teaching) {
      throw new TeachingNotFoundError(id);
    }

    if (actor?.role === "DEPARTMENT_MANAGER") {
      if (
        teaching.scope === "CCJV" ||
        (teaching.departmentId && teaching.departmentId !== actor.departmentId)
      ) {
        throw new ForbiddenError(
          "Ce contenu relève du site général CCJV et ne peut pas être publié par un responsable départemental",
        );
      }
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
  async archive(id: string, actor?: AdminProfile | null): Promise<Teaching> {
    const teaching = await this.repo.findById(id);
    if (!teaching) {
      throw new TeachingNotFoundError(id);
    }

    if (actor?.role === "DEPARTMENT_MANAGER") {
      if (
        teaching.scope === "CCJV" ||
        (teaching.departmentId && teaching.departmentId !== actor.departmentId)
      ) {
        throw new ForbiddenError(
          "Action réservée au périmètre attribué",
        );
      }
    }

    return this.repo.archive(id);
  }

  /**
   * Suppression d'un enseignement.
   */
  async delete(id: string, actor?: AdminProfile | null): Promise<void> {
    const teaching = await this.repo.findById(id);
    if (!teaching) {
      throw new TeachingNotFoundError(id);
    }

    if (actor?.role === "DEPARTMENT_MANAGER") {
      if (
        teaching.scope === "CCJV" ||
        (teaching.departmentId && teaching.departmentId !== actor.departmentId)
      ) {
        throw new ForbiddenError(
          "Action réservée au périmètre attribué",
        );
      }
    }

    await this.repo.delete(id);
  }

  /**
   * Slug définitif d'un enseignement.
   *
   * Dérivé du titre (ou du slug demandé), puis **suffixé** tant qu'il est pris
   * (`-2`, `-3`…). Deux enseignements peuvent porter le même titre — c'est même
   * fréquent, un message étant souvent prêché à nouveau — et refuser
   * l'enregistrement pour cette raison revenait à interdire de nommer un
   * enseignement comme son prédécesseur. L'identité reste l'`id` UUID.
   *
   * `exceptId` : la ligne en cours de modification ne se déclare pas en conflit
   * avec elle-même.
   */
  private async resolveSlug(
    title: string,
    requested?: string,
    exceptId?: string,
  ): Promise<string | null> {
    const base =
      requested !== undefined && requested.trim().length > 0 ? requested : title;
    const normalized = slugify(base);
    if (normalized.length === 0) return null;

    return uniqueSlug(normalized, (candidate) =>
      this.repo.slugExists(candidate, exceptId),
    );
  }
}
