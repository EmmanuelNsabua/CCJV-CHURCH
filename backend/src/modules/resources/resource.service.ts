import type { AdminProfile, Resource } from "@/domain/entities";
import type { ListResult, ResourceRepository } from "@/domain/repositories";
import { ForbiddenError, NotFoundError, ValidationError } from "@/shared/errors/app-error";
import { toOffset } from "@/shared/http/pagination";
import { slugify, uniqueSlug } from "@/shared/utils/slug";
import type {
  CreateResourceInput,
  ReplaceResourceFileInput,
  ResourceListQuery,
  UpdateResourceInput,
} from "./resource.schema";

export class ResourceService {
  constructor(private readonly resources: ResourceRepository) {}

  async list(query: ResourceListQuery, actor?: AdminProfile | null): Promise<ListResult<Resource>> {
    let departmentId = query.departmentId;
    if (actor?.role === "DEPARTMENT_MANAGER" && actor.departmentId) {
      departmentId = actor.departmentId;
    }

    return this.resources.list(
      { limit: query.limit, offset: toOffset(query.page, query.limit) },
      {
        search: query.search,
        departmentId,
        isArchived: query.isArchived,
      },
    );
  }

  async get(idOrSlug: string): Promise<Resource> {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        idOrSlug,
      );

    const resource = isUuid
      ? await this.resources.findById(idOrSlug)
      : await this.resources.findBySlug(idOrSlug);

    if (resource === null) {
      throw new NotFoundError(
        "RESOURCE_NOT_FOUND",
        `Aucune ressource ne correspond à « ${idOrSlug} »`,
      );
    }

    return resource;
  }

  /**
   * Publication directe : toute ressource créée est immédiatement disponible.
   */
  async create(data: CreateResourceInput, actor?: AdminProfile | null): Promise<Resource> {
    this.assertDocumentFile(data.file);

    let departmentId = data.departmentId ?? null;
    if (actor?.role === "DEPARTMENT_MANAGER" && actor.departmentId) {
      departmentId = actor.departmentId;
    }

    const slug = await this.resolveSlug(data.name, data.slug);

    return this.resources.create(
      {
        name: data.name,
        description: data.description ?? null,
        file: data.file,
        departmentId,
        isArchived: data.isArchived ?? false,
      },
      slug,
    );
  }

  async update(id: string, data: UpdateResourceInput, actor?: AdminProfile | null): Promise<Resource> {
    const existing = await this.resources.findById(id);
    if (!existing) {
      throw new NotFoundError(
        "RESOURCE_NOT_FOUND",
        `Aucune ressource ne correspond à l'identifiant ${id}`,
      );
    }

    if (actor?.role === "DEPARTMENT_MANAGER") {
      if (existing.departmentId && existing.departmentId !== actor.departmentId) {
        throw new ForbiddenError(
          "Vous n'avez pas l'autorisation de modifier une ressource rattachée à un autre département",
        );
      }
    }

    if (data.file !== undefined) {
      this.assertDocumentFile(data.file);
    }

    const updated = await this.resources.update(id, data);
    if (!updated) {
      throw new NotFoundError(
        "RESOURCE_NOT_FOUND",
        `La mise à jour de la ressource a échoué`,
      );
    }

    return updated;
  }

  /**
   * Remplacement direct du PDF : conserve le nom, slug et description.
   */
  async replaceFile(id: string, data: ReplaceResourceFileInput, actor?: AdminProfile | null): Promise<Resource> {
    const existing = await this.resources.findById(id);
    if (!existing) {
      throw new NotFoundError(
        "RESOURCE_NOT_FOUND",
        `Aucune ressource ne correspond à l'identifiant ${id}`,
      );
    }

    if (actor?.role === "DEPARTMENT_MANAGER") {
      if (existing.departmentId && existing.departmentId !== actor.departmentId) {
        throw new ForbiddenError(
          "Vous n'avez pas l'autorisation de modifier une ressource rattachée à un autre département",
        );
      }
    }

    this.assertDocumentFile(data.file);

    const updated = await this.resources.replaceFile(id, data.file);
    if (!updated) {
      throw new NotFoundError(
        "RESOURCE_NOT_FOUND",
        `Le remplacement du fichier a échoué`,
      );
    }

    return updated;
  }

  async remove(id: string, actor?: AdminProfile | null): Promise<void> {
    const existing = await this.resources.findById(id);
    if (!existing) {
      throw new NotFoundError(
        "RESOURCE_NOT_FOUND",
        `Aucune ressource ne correspond à l'identifiant ${id}`,
      );
    }

    if (actor?.role === "DEPARTMENT_MANAGER") {
      if (existing.departmentId && existing.departmentId !== actor.departmentId) {
        throw new ForbiddenError(
          "Vous n'avez pas l'autorisation de supprimer une ressource rattachée à un autre département",
        );
      }
    }

    const removed = await this.resources.remove(id);
    if (!removed) {
      throw new NotFoundError(
        "RESOURCE_NOT_FOUND",
        `La suppression de la ressource a échoué`,
      );
    }
  }

  private assertDocumentFile(file: string): void {
    const cleanUrl = file.toLowerCase().split("?")[0] ?? "";
    const allowed = [
      ".pdf",
      ".epub",
      ".doc",
      ".docx",
      ".ppt",
      ".pptx",
      ".xls",
      ".xlsx",
      ".txt",
      ".odt",
      ".odp",
      ".ods",
    ];
    const isDoc = allowed.some((ext) => cleanUrl.endsWith(ext) || cleanUrl.includes(ext));
    if (!isDoc) {
      throw new ValidationError(
        "Le fichier doit obligatoirement être un document valide (PDF, EPUB, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT)",
      );
    }
  }

  /**
   * Slug définitif : slug explicite **suffixé** s'il est déjà pris, sinon
   * dérivé du nom.
   *
   * Une ressource est identifiée par son `id` UUID ; le slug n'est que son
   * adresse publique. Un doublon ne doit donc jamais empêcher le dépôt d'un
   * document.
   */
  private async resolveSlug(name: string, requestedSlug?: string): Promise<string> {
    const explicit = requestedSlug ? slugify(requestedSlug) : "";
    const base = explicit.length > 0 ? explicit : slugify(name);

    return uniqueSlug(base, (slug) => this.resources.slugExists(slug));
  }
}
