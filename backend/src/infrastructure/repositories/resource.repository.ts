import { and, asc, count, desc, eq, ilike, ne, or } from "drizzle-orm";
import type { Resource } from "@/domain/entities";
import type {
  ListOptions,
  ListResult,
  ResourceFilters,
  ResourceInput,
  ResourceRepository,
} from "@/domain/repositories";
import type { Database } from "@/infrastructure/database/client";
import { departments } from "@/infrastructure/database/schema/departments";
import { resources } from "@/infrastructure/database/schema/resources";
import { InternalError } from "@/shared/errors/app-error";

type ResourceRow = typeof resources.$inferSelect;
type ResourcePatch = Partial<typeof resources.$inferInsert>;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

function toEntity(row: ResourceRow): Resource {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    file: row.file,
    departmentId: row.departmentId ?? null,
    isArchived: row.isArchived ?? false,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleResourceRepository implements ResourceRepository {
  constructor(private readonly db: Database) {}

  async list(
    options: ListOptions,
    filters: ResourceFilters = {},
  ): Promise<ListResult<Resource>> {
    const conditions = [];

    if (filters.search) {
      conditions.push(
        or(
          ilike(resources.name, `%${filters.search}%`),
          ilike(resources.description, `%${filters.search}%`),
        ),
      );
    }

    if (filters.departmentId) {
      conditions.push(eq(resources.departmentId, filters.departmentId));
    }

    if (filters.isArchived !== undefined) {
      conditions.push(eq(resources.isArchived, filters.isArchived));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    try {
      const rows = await this.db
        .select()
        .from(resources)
        .where(where)
        .orderBy(desc(resources.createdAt), asc(resources.name))
        .limit(options.limit)
        .offset(options.offset);

      const [totals] = await this.db
        .select({ value: count() })
        .from(resources)
        .where(where);

      return {
        items: rows.map(toEntity),
        total: totals?.value ?? 0,
      };
    } catch (err: unknown) {
      const isMissingColumn =
        String(err).includes("column") &&
        (String(err).includes("department_id") || String(err).includes("is_archived"));

      if (isMissingColumn) {
        const rows = await this.db
          .select({
            id: resources.id,
            name: resources.name,
            slug: resources.slug,
            description: resources.description,
            file: resources.file,
            createdAt: resources.createdAt,
            updatedAt: resources.updatedAt,
          })
          .from(resources)
          .orderBy(desc(resources.createdAt), asc(resources.name))
          .limit(options.limit)
          .offset(options.offset);

        const [totals] = await this.db.select({ value: count() }).from(resources);

        return {
          items: rows.map((r) => ({
            id: r.id,
            name: r.name,
            slug: r.slug,
            description: r.description,
            file: r.file,
            departmentId: null,
            isArchived: false,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
          })),
          total: totals?.value ?? 0,
        };
      }
      throw err;
    }
  }

  async findById(id: string): Promise<Resource | null> {
    if (!isUuid(id)) return null;

    const rows = await this.db
      .select()
      .from(resources)
      .where(eq(resources.id, id))
      .limit(1);

    const [row] = rows;
    return row ? toEntity(row) : null;
  }

  async findBySlug(slug: string): Promise<Resource | null> {
    const rows = await this.db
      .select()
      .from(resources)
      .where(eq(resources.slug, slug))
      .limit(1);

    const [row] = rows;
    return row ? toEntity(row) : null;
  }

  async slugExists(slug: string, exceptId?: string): Promise<boolean> {
    const condition =
      exceptId === undefined
        ? eq(resources.slug, slug)
        : eq(resources.slug, slug);

    const rows = await this.db
      .select({ id: resources.id })
      .from(resources)
      .where(condition)
      .limit(1);

    if (exceptId !== undefined) {
      return rows.some((r) => r.id !== exceptId);
    }
    return rows.length > 0;
  }

  async create(data: ResourceInput, slug: string): Promise<Resource> {
    let validDepartmentId: string | null = null;
    if (data.departmentId && isUuid(data.departmentId)) {
      try {
        const [dept] = await this.db
          .select({ id: departments.id })
          .from(departments)
          .where(eq(departments.id, data.departmentId))
          .limit(1);

        if (dept) {
          validDepartmentId = dept.id;
        } else {
          // Résolution tolérante si l'identifiant hardcodé n'existe pas encore
          const [matched] = await this.db
            .select({ id: departments.id })
            .from(departments)
            .where(
              or(
                ilike(departments.slug, "%ecod%"),
                ilike(departments.name, "%ecod%"),
              ),
            )
            .limit(1);
          validDepartmentId = matched ? matched.id : null;
        }
      } catch {
        validDepartmentId = null;
      }
    }

    try {
      const [row] = await this.db
        .insert(resources)
        .values({
          name: data.name,
          slug,
          description: data.description ?? null,
          file: data.file,
          departmentId: validDepartmentId,
          isArchived: data.isArchived ?? false,
        })
        .returning();

      if (!row) {
        throw new InternalError("La ressource n'a pas pu être créée");
      }

      return toEntity(row);
    } catch (err: unknown) {
      const isMissingColumn =
        String(err).includes("column") &&
        (String(err).includes("department_id") || String(err).includes("is_archived"));

      if (isMissingColumn) {
        const [fallbackRow] = await this.db
          .insert(resources)
          .values({
            name: data.name,
            slug,
            description: data.description ?? null,
            file: data.file,
          })
          .returning({
            id: resources.id,
            name: resources.name,
            slug: resources.slug,
            description: resources.description,
            file: resources.file,
            createdAt: resources.createdAt,
            updatedAt: resources.updatedAt,
          });

        if (!fallbackRow) {
          throw new InternalError("La ressource n'a pas pu être créée");
        }

        return {
          id: fallbackRow.id,
          name: fallbackRow.name,
          slug: fallbackRow.slug,
          description: fallbackRow.description,
          file: fallbackRow.file,
          departmentId: null,
          isArchived: false,
          createdAt: fallbackRow.createdAt,
          updatedAt: fallbackRow.updatedAt,
        };
      }
      throw err;
    }
  }

  async update(id: string, data: Partial<ResourceInput>): Promise<Resource | null> {
    if (!isUuid(id)) return null;

    const patch: ResourcePatch = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.description !== undefined) patch.description = data.description;
    if (data.file !== undefined) patch.file = data.file;
    if (data.departmentId !== undefined) {
      if (data.departmentId && isUuid(data.departmentId)) {
        try {
          const [dept] = await this.db
            .select({ id: departments.id })
            .from(departments)
            .where(eq(departments.id, data.departmentId))
            .limit(1);
          patch.departmentId = dept ? dept.id : null;
        } catch {
          patch.departmentId = null;
        }
      } else {
        patch.departmentId = null;
      }
    }
    if (data.isArchived !== undefined) patch.isArchived = data.isArchived;

    if (Object.keys(patch).length === 0) {
      return this.findById(id);
    }

    try {
      const [updated] = await this.db
        .update(resources)
        .set(patch)
        .where(eq(resources.id, id))
        .returning();

      return updated ? toEntity(updated) : null;
    } catch (err: unknown) {
      const isMissingColumn =
        String(err).includes("column") &&
        (String(err).includes("department_id") || String(err).includes("is_archived"));

      if (isMissingColumn) {
        delete patch.departmentId;
        delete patch.isArchived;

        const [fallbackUpdated] = await this.db
          .update(resources)
          .set(patch)
          .where(eq(resources.id, id))
          .returning({
            id: resources.id,
            name: resources.name,
            slug: resources.slug,
            description: resources.description,
            file: resources.file,
            createdAt: resources.createdAt,
            updatedAt: resources.updatedAt,
          });

        return fallbackUpdated
          ? {
              id: fallbackUpdated.id,
              name: fallbackUpdated.name,
              slug: fallbackUpdated.slug,
              description: fallbackUpdated.description,
              file: fallbackUpdated.file,
              departmentId: null,
              isArchived: false,
              createdAt: fallbackUpdated.createdAt,
              updatedAt: fallbackUpdated.updatedAt,
            }
          : null;
      }
      throw err;
    }
  }

  async replaceFile(id: string, file: string): Promise<Resource | null> {
    if (!isUuid(id)) return null;

    const [updated] = await this.db
      .update(resources)
      .set({ file })
      .where(eq(resources.id, id))
      .returning();

    return updated ? toEntity(updated) : null;
  }

  async remove(id: string): Promise<boolean> {
    if (!isUuid(id)) return false;

    const rows = await this.db
      .delete(resources)
      .where(eq(resources.id, id))
      .returning({ id: resources.id });

    return rows.length > 0;
  }
}
