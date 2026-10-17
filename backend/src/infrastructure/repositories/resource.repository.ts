import { asc, count, desc, eq, ilike, ne, or } from "drizzle-orm";
import type { Resource } from "@/domain/entities";
import type {
  ListOptions,
  ListResult,
  ResourceFilters,
  ResourceInput,
  ResourceRepository,
} from "@/domain/repositories";
import type { Database } from "@/infrastructure/database/client";
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
    const where = filters.search
      ? or(
          ilike(resources.name, `%${filters.search}%`),
          ilike(resources.description, `%${filters.search}%`),
        )
      : undefined;

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
    const [row] = await this.db
      .insert(resources)
      .values({
        name: data.name,
        slug,
        description: data.description ?? null,
        file: data.file,
      })
      .returning();

    if (!row) {
      throw new InternalError("La ressource n'a pas pu être créée");
    }

    return toEntity(row);
  }

  async update(id: string, data: Partial<ResourceInput>): Promise<Resource | null> {
    if (!isUuid(id)) return null;

    const patch: ResourcePatch = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.description !== undefined) patch.description = data.description;
    if (data.file !== undefined) patch.file = data.file;

    if (Object.keys(patch).length === 0) {
      return this.findById(id);
    }

    const [updated] = await this.db
      .update(resources)
      .set(patch)
      .where(eq(resources.id, id))
      .returning();

    return updated ? toEntity(updated) : null;
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
