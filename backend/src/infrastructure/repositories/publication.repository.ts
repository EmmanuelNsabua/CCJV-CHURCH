import { and, asc, count, desc, eq, inArray, ne } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import type { Publication } from "@/domain/entities";
import type {
  ListOptions,
  ListResult,
  PublicationFilters,
  PublicationInput,
  PublicationRepository,
  PublicationSortColumn,
} from "@/domain/repositories";
import type { Database } from "@/infrastructure/database/client";
import {
  media,
  publications,
} from "@/infrastructure/database/schema";
import { InternalError } from "@/shared/errors/app-error";

/**
 * Implémentation Drizzle du contrat `PublicationRepository`.
 *
 * Deux points de vigilance :
 *
 * 1. La **visibilité** est explicite : `findByIdOrSlug(value, includeDrafts)`
 *    refuse les brouillons quand `includeDrafts` vaut `false`. Une lecture
 *    publique ne peut donc pas exposer un contenu dépublié, même si l'appelant
 *    se trompe de filtre (`status` est un filtre de liste, pas une garde).
 * 2. `published_at` est une colonne `date` : elle reste une chaîne
 *    `YYYY-MM-DD`, jamais un objet `Date` (pas de décalage de fuseau).
 */

type PublicationRow = typeof publications.$inferSelect;
type PublicationPatch = Partial<typeof publications.$inferInsert>;

interface PublicationSort {
  column: PublicationSortColumn;
  direction: "asc" | "desc";
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

/** URL publiques des médias demandés — une requête, jamais une par ligne. */
async function loadMediaUrls(
  db: Database,
  mediaIds: readonly string[],
): Promise<Map<string, string>> {
  if (mediaIds.length === 0) return new Map();

  const rows = await db
    .select({ id: media.id, publicUrl: media.publicUrl })
    .from(media)
    .where(inArray(media.id, [...mediaIds]));

  return new Map(rows.map((row) => [row.id, row.publicUrl] as const));
}

export class DrizzlePublicationRepository implements PublicationRepository {
  constructor(private readonly db: Database) {}

  async list(
    options: ListOptions,
    filters: PublicationFilters,
    sort: PublicationSort,
  ): Promise<ListResult<Publication>> {
    const where = this.buildFilters(filters);

    const rows = await this.db
      .select()
      .from(publications)
      .where(where)
      .orderBy(...this.buildOrder(sort))
      .limit(options.limit)
      .offset(options.offset);

    const [totals] = await this.db
      .select({ value: count() })
      .from(publications)
      .where(where);

    return { items: await this.hydrate(rows), total: totals?.value ?? 0 };
  }

  async findById(id: string): Promise<Publication | null> {
    if (!isUuid(id)) return null;

    const rows = await this.db
      .select()
      .from(publications)
      .where(eq(publications.id, id))
      .limit(1);

    const [publication] = await this.hydrate(rows);
    return publication ?? null;
  }

  async findByIdOrSlug(
    value: string,
    includeDrafts: boolean,
  ): Promise<Publication | null> {
    const identity = isUuid(value)
      ? eq(publications.id, value)
      : eq(publications.slug, value);

    // Un brouillon n'est jamais renvoyé à une lecture publique : la garde est
    // ici, au plus près de la base, et non dans un contrôleur.
    const where = includeDrafts
      ? identity
      : and(identity, eq(publications.status, "PUBLISHED"));

    const rows = await this.db
      .select()
      .from(publications)
      .where(where)
      .limit(1);

    const [publication] = await this.hydrate(rows);
    return publication ?? null;
  }

  async slugExists(slug: string, exceptId?: string): Promise<boolean> {
    const condition =
      exceptId === undefined
        ? eq(publications.slug, slug)
        : and(eq(publications.slug, slug), ne(publications.id, exceptId));

    const rows = await this.db
      .select({ id: publications.id })
      .from(publications)
      .where(condition)
      .limit(1);

    return rows.length > 0;
  }

  async create(data: PublicationInput, slug: string): Promise<Publication> {
    const [row] = await this.db
      .insert(publications)
      .values({
        title: data.title,
        slug,
        type: data.type,
        category: data.category,
        status: data.status ?? "PUBLISHED",
        contentUrl: data.contentUrl ?? null,
        coverMediaId: data.coverMediaId ?? null,
        description: data.description ?? null,
        body: data.body ?? null,
        author: data.author ?? null,
        publishedAt: data.publishedAt,
      })
      .returning();

    if (row === undefined) {
      throw new InternalError("La publication n'a pas pu être créée");
    }

    const created = await this.findById(row.id);
    if (created === null) {
      throw new InternalError("La publication créée est introuvable");
    }

    return created;
  }

  async update(
    id: string,
    data: Partial<PublicationInput>,
  ): Promise<Publication | null> {
    if (!isUuid(id)) return null;

    const patch: PublicationPatch = {};
    if (data.title !== undefined) patch.title = data.title;
    if (data.type !== undefined) patch.type = data.type;
    if (data.category !== undefined) patch.category = data.category;
    if (data.status !== undefined) patch.status = data.status;
    if (data.contentUrl !== undefined) patch.contentUrl = data.contentUrl;
    if (data.coverMediaId !== undefined) patch.coverMediaId = data.coverMediaId;
    if (data.description !== undefined) patch.description = data.description;
    if (data.body !== undefined) patch.body = data.body;
    if (data.author !== undefined) patch.author = data.author;
    if (data.publishedAt !== undefined) patch.publishedAt = data.publishedAt;

    if (Object.keys(patch).length > 0) {
      await this.db
        .update(publications)
        .set(patch)
        .where(eq(publications.id, id));
    }

    return this.findById(id);
  }

  async remove(id: string): Promise<boolean> {
    if (!isUuid(id)) return false;

    const rows = await this.db
      .delete(publications)
      .where(eq(publications.id, id))
      .returning({ id: publications.id });

    return rows.length > 0;
  }

  /** Filtres de liste, en liste blanche ; `status` inclus. */
  private buildFilters(filters: PublicationFilters): SQL | undefined {
    const conditions: SQL[] = [];

    if (filters.type !== undefined) {
      conditions.push(eq(publications.type, filters.type));
    }
    if (filters.category !== undefined) {
      conditions.push(eq(publications.category, filters.category));
    }
    if (filters.status !== undefined) {
      conditions.push(eq(publications.status, filters.status));
    }

    if (conditions.length === 0) return undefined;
    return and(...conditions);
  }

  private buildOrder(sort: PublicationSort): SQL[] {
    const column =
      sort.column === "created_at"
        ? publications.createdAt
        : publications.publishedAt;
    const primary = sort.direction === "desc" ? desc(column) : asc(column);

    // Départage déterministe : plusieurs publications peuvent partager la même
    // date ; sans cela, deux pages consécutives peuvent montrer deux fois le
    // même élément.
    return [primary, asc(publications.id)];
  }

  /** Résout l'URL de couverture — une seule requête pour toute la page. */
  private async hydrate(rows: PublicationRow[]): Promise<Publication[]> {
    if (rows.length === 0) return [];

    const mediaIds = new Set<string>();
    for (const row of rows) {
      if (row.coverMediaId !== null) mediaIds.add(row.coverMediaId);
    }

    const urls = await loadMediaUrls(this.db, [...mediaIds]);

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      type: row.type,
      category: row.category,
      status: row.status,
      contentUrl: row.contentUrl,
      coverImageUrl:
        row.coverMediaId === null
          ? null
          : (urls.get(row.coverMediaId) ?? null),
      description: row.description,
      body: row.body,
      author: row.author,
      publishedAt: row.publishedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }
}
