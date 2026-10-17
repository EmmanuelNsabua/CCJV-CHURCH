import type { Department } from "@/domain/entities";
import type {
  DepartmentRepository,
  ListResult,
} from "@/domain/repositories";
import {
  DuplicateSlugError,
  NotFoundError,
} from "@/shared/errors/app-error";
import { toOffset } from "@/shared/http/pagination";
import { slugify, uniqueSlug } from "@/shared/utils/slug";
import type {
  CreateDepartmentBody,
  DepartmentListQuery,
  UpdateDepartmentBody,
} from "./department.schema";

/**
 * Règles métier des départements.
 *
 * Ce service ne connaît ni Express, ni Drizzle, ni code HTTP
 * (IMPLEMENTATION_SPEC §4.1) : il reçoit des entrées déjà validées par Zod et
 * lève des erreurs du domaine, que le middleware d'erreur traduira.
 */
export class DepartmentService {
  constructor(private readonly departments: DepartmentRepository) {}

  async list(query: DepartmentListQuery): Promise<ListResult<Department>> {
    return this.departments.list({
      limit: query.limit,
      offset: toOffset(query.page, query.limit),
    });
  }

  /** Lecture publique : `404 DEPARTMENT_NOT_FOUND` si rien ne correspond. */
  async get(idOrSlug: string): Promise<Department> {
    return this.require(idOrSlug);
  }

  async create(data: CreateDepartmentBody): Promise<Department> {
    // `slug` est extrait du corps : il n'appartient pas à `DepartmentInput`,
    // il est calculé ici puis transmis séparément au repository.
    const { slug: requestedSlug, ...input } = data;
    const slug = await this.resolveSlug(input.name, requestedSlug);

    return this.departments.create(input, slug);
  }

  async update(
    idOrSlug: string,
    data: UpdateDepartmentBody,
  ): Promise<Department> {
    const existing = await this.require(idOrSlug);

    const updated = await this.departments.update(existing.id, data);
    if (updated === null) {
      // Course entre la lecture et l'écriture : la ressource a disparu.
      throw new NotFoundError(
        "DEPARTMENT_NOT_FOUND",
        `Aucun département ne correspond à « ${idOrSlug} »`,
      );
    }

    return updated;
  }

  /**
   * Archivage préalable obligatoire puis suppression de l'entité active.
   * Garantit la préservation des données sans suppression physique des médias.
   */
  async archive(
    idOrSlug: string,
    options: { archivedBy?: string | null; reason?: string | null },
  ) {
    const existing = await this.require(idOrSlug);
    return this.departments.archiveAndDelete(existing.id, options);
  }

  /**
   * Supprime le département directement.
   */
  async remove(idOrSlug: string): Promise<void> {
    const existing = await this.require(idOrSlug);
    const removed = await this.departments.remove(existing.id);
    if (!removed) {
      throw new NotFoundError(
        "DEPARTMENT_NOT_FOUND",
        `Le département « ${idOrSlug} » a disparu avant d'être supprimé`,
      );
    }
  }

  async listActivities(idOrSlug: string) {
    const existing = await this.require(idOrSlug);
    return this.departments.listActivities(existing.id);
  }

  async saveActivities(
    idOrSlug: string,
    activities: { title: string; description?: string | null; imageMediaId?: string | null; position?: number }[],
  ) {
    const existing = await this.require(idOrSlug);
    return this.departments.saveActivities(existing.id, activities);
  }

  private async require(idOrSlug: string): Promise<Department> {
    const department = await this.departments.findByIdOrSlug(idOrSlug);
    if (department === null) {
      throw new NotFoundError(
        "DEPARTMENT_NOT_FOUND",
        `Aucun département ne correspond à « ${idOrSlug} »`,
      );
    }
    return department;
  }

  /**
   * Slug définitif de la ressource.
   *
   * - slug explicite : refusé s'il est déjà utilisé (`DUPLICATE_SLUG`) ;
   * - sinon : dérivé du nom et suffixé jusqu'à être libre.
   *
   * `slugExists` interroge la base à chaque candidat : un tableau en mémoire
   * produirait des collisions entre instances du serveur.
   */
  private async resolveSlug(
    name: string,
    requested?: string,
  ): Promise<string> {
    const explicit = requested === undefined ? "" : slugify(requested);

    if (explicit.length > 0) {
      if (await this.departments.slugExists(explicit)) {
        throw new DuplicateSlugError(explicit);
      }
      return explicit;
    }

    return uniqueSlug(name, (candidate) => this.departments.slugExists(candidate));
  }
}
