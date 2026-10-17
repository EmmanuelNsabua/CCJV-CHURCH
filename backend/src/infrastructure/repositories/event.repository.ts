import { and, asc, count, desc, eq, gte, inArray, lt, ne, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import type { Event, EventLifecycleStatus, EventStatus } from "@/domain/entities";
import type {
  EventFilters,
  EventInput,
  EventRepository,
  EventSortColumn,
  ListOptions,
  ListResult,
} from "@/domain/repositories";
import { computeEventStatus, toIsoDate } from "@/domain/rules/event-status";
import type { Database } from "@/infrastructure/database/client";
import {
  eventMedia,
  events,
  media,
} from "@/infrastructure/database/schema";
import { InternalError } from "@/shared/errors/app-error";

type EventRow = typeof events.$inferSelect;
type EventPatch = Partial<typeof events.$inferInsert>;

interface EventSort {
  column: EventSortColumn;
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

export class DrizzleEventRepository implements EventRepository {
  constructor(private readonly db: Database) {}

  async list(
    options: ListOptions,
    filters: EventFilters,
    sort: EventSort,
  ): Promise<ListResult<Event>> {
    const where = this.buildFilters(filters);

    const rows = await this.db
      .select()
      .from(events)
      .where(where)
      .orderBy(...this.buildOrder(sort))
      .limit(options.limit)
      .offset(options.offset);

    const [totals] = await this.db
      .select({ value: count() })
      .from(events)
      .where(where);

    return {
      items: await this.hydrate(rows, filters.today),
      total: totals?.value ?? 0,
    };
  }

  async findById(id: string): Promise<Event | null> {
    if (!isUuid(id)) return null;

    const rows = await this.db
      .select()
      .from(events)
      .where(eq(events.id, id))
      .limit(1);

    const [event] = await this.hydrate(rows);
    return event ?? null;
  }

  async findByIdOrSlug(value: string): Promise<Event | null> {
    if (isUuid(value)) return this.findById(value);

    const rows = await this.db
      .select()
      .from(events)
      .where(eq(events.slug, value))
      .limit(1);

    const [event] = await this.hydrate(rows);
    return event ?? null;
  }

  async slugExists(slug: string, exceptId?: string): Promise<boolean> {
    const condition =
      exceptId === undefined
        ? eq(events.slug, slug)
        : and(eq(events.slug, slug), ne(events.id, exceptId));

    const rows = await this.db
      .select({ id: events.id })
      .from(events)
      .where(condition)
      .limit(1);

    return rows.length > 0;
  }

  async create(data: EventInput, slug: string): Promise<Event> {
    const startDate = data.startDate ?? data.eventDate;
    const endDate = data.endDate ?? startDate;
    const startTime = data.startTime ?? data.eventTime ?? null;
    const endTime = data.endTime ?? null;

    const [row] = await this.db
      .insert(events)
      .values({
        title: data.title,
        slug,
        description: data.description ?? null,
        excerpt: data.excerpt ?? null,
        eventDate: startDate,
        endDate,
        eventTime: startTime,
        endTime,
        location: data.location ?? null,
        status: data.status ?? "PUBLISHED",
        imageMediaId: data.imageMediaId ?? null,
        bannerMediaId: data.bannerMediaId ?? null,
        departmentId: data.departmentId ?? null,
        visibilityScope: data.visibilityScope ?? "DEPARTMENT",
        practicalInfo: data.practicalInfo ?? null,
      })
      .returning();

    if (row === undefined) {
      throw new InternalError("L'événement n'a pas pu être créé");
    }

    await this.replaceGallery(row.id, data.galleryMediaIds);

    const created = await this.findById(row.id);
    if (created === null) {
      throw new InternalError("L'événement créé est introuvable");
    }

    return created;
  }

  async update(id: string, data: Partial<EventInput>): Promise<Event | null> {
    if (!isUuid(id)) return null;

    const patch: EventPatch = {};
    if (data.title !== undefined) patch.title = data.title;
    if (data.description !== undefined) patch.description = data.description;
    if (data.excerpt !== undefined) patch.excerpt = data.excerpt;

    const startDate = data.startDate ?? data.eventDate;
    if (startDate !== undefined) patch.eventDate = startDate;
    if (data.endDate !== undefined) patch.endDate = data.endDate;

    const startTime = data.startTime ?? data.eventTime;
    if (startTime !== undefined) patch.eventTime = startTime;
    if (data.endTime !== undefined) patch.endTime = data.endTime;

    if (data.location !== undefined) patch.location = data.location;
    if (data.status !== undefined) patch.status = data.status;
    if (data.imageMediaId !== undefined) patch.imageMediaId = data.imageMediaId;
    if (data.bannerMediaId !== undefined) patch.bannerMediaId = data.bannerMediaId;
    if (data.departmentId !== undefined) patch.departmentId = data.departmentId;
    if (data.visibilityScope !== undefined) patch.visibilityScope = data.visibilityScope;
    if (data.practicalInfo !== undefined) patch.practicalInfo = data.practicalInfo;

    if (Object.keys(patch).length > 0) {
      await this.db.update(events).set(patch).where(eq(events.id, id));
    }

    await this.replaceGallery(id, data.galleryMediaIds);

    return this.findById(id);
  }

  async publish(id: string): Promise<Event | null> {
    if (!isUuid(id)) return null;

    const [updated] = await this.db
      .update(events)
      .set({ status: "PUBLISHED" })
      .where(eq(events.id, id))
      .returning();

    return updated ? this.findById(id) : null;
  }

  async revertToDraft(id: string): Promise<Event | null> {
    if (!isUuid(id)) return null;

    const [updated] = await this.db
      .update(events)
      .set({ status: "DRAFT" })
      .where(eq(events.id, id))
      .returning();

    return updated ? this.findById(id) : null;
  }

  async cancel(id: string): Promise<Event | null> {
    if (!isUuid(id)) return null;

    const [updated] = await this.db
      .update(events)
      .set({ status: "CANCELLED" })
      .where(eq(events.id, id))
      .returning();

    return updated ? this.findById(id) : null;
  }

  async remove(id: string): Promise<boolean> {
    if (!isUuid(id)) return false;

    const rows = await this.db
      .delete(events)
      .where(eq(events.id, id))
      .returning({ id: events.id });

    return rows.length > 0;
  }

  /**
   * Filtres de liste, en liste blanche.
   * Gère les vues chronologiques (UPCOMING/ARCHIVED) basées sur la date de fin,
   * ainsi que les statuts éditoriaux DRAFT, PUBLISHED, CANCELLED.
   */
  private buildFilters(filters: EventFilters): SQL | undefined {
    const conditions: SQL[] = [];
    const today = filters.today ?? toIsoDate(new Date());

    if (filters.departmentId !== undefined) {
      conditions.push(eq(events.departmentId, filters.departmentId));
    }

    // Gestion de la vue publique (UPCOMING vs ARCHIVED)
    if (filters.view === "UPCOMING" || filters.status === "UPCOMING") {
      // Événements dont la date de fin est aujourd'hui ou dans le futur
      conditions.push(
        gte(sql`coalesce(${events.endDate}, ${events.eventDate})`, today),
      );
      // Pour les vues publiques, exclure les brouillons par défaut
      if (filters.lifecycleStatus === undefined && filters.status === "UPCOMING") {
        conditions.push(inArray(events.status, ["PUBLISHED", "CANCELLED"]));
      }
    } else if (filters.view === "ARCHIVED" || filters.status === "ARCHIVED") {
      // Événements dont la date de fin est strictement passée
      conditions.push(
        lt(sql`coalesce(${events.endDate}, ${events.eventDate})`, today),
      );
      if (filters.lifecycleStatus === undefined && filters.status === "ARCHIVED") {
        conditions.push(inArray(events.status, ["PUBLISHED", "CANCELLED"]));
      }
    }

    // Filtre direct sur le statut éditorial
    const directStatus = filters.lifecycleStatus ?? (
      filters.status === "DRAFT" || filters.status === "PUBLISHED" || filters.status === "CANCELLED"
        ? (filters.status as EventLifecycleStatus)
        : undefined
    );

    if (directStatus !== undefined) {
      conditions.push(eq(events.status, directStatus));
    }

    if (conditions.length === 0) return undefined;
    return and(...conditions);
  }

  private buildOrder(sort: EventSort): SQL[] {
    const column =
      sort.column === "created_at" ? events.createdAt : events.eventDate;
    const primary = sort.direction === "desc" ? desc(column) : asc(column);

    return [primary, asc(events.id)];
  }

  /** Remplace la galerie lorsqu'elle est fournie. `undefined` = inchangée. */
  private async replaceGallery(
    eventId: string,
    mediaIds: string[] | undefined,
  ): Promise<void> {
    if (mediaIds === undefined) return;

    const unique = [...new Set(mediaIds)];

    await this.db.transaction(async (tx) => {
      await tx.delete(eventMedia).where(eq(eventMedia.eventId, eventId));

      if (unique.length === 0) return;

      await tx.insert(eventMedia).values(
        unique.map((mediaId, position) => ({ eventId, mediaId, position })),
      );
    });
  }

  /**
   * Complète les lignes avec les URL de médias (image, bandeau, galerie).
   * Deux requêtes au total, quel que soit le nombre de lignes.
   */
  private async hydrate(rows: EventRow[], today?: string): Promise<Event[]> {
    if (rows.length === 0) return [];

    const ids = rows.map((row) => row.id);

    const links = await this.db
      .select({ eventId: eventMedia.eventId, mediaId: eventMedia.mediaId })
      .from(eventMedia)
      .where(inArray(eventMedia.eventId, ids))
      .orderBy(asc(eventMedia.position), asc(eventMedia.mediaId));

    const mediaIds = new Set<string>();
    for (const row of rows) {
      if (row.imageMediaId !== null) mediaIds.add(row.imageMediaId);
      if (row.bannerMediaId !== null) mediaIds.add(row.bannerMediaId);
    }
    for (const link of links) mediaIds.add(link.mediaId);

    const urls = await loadMediaUrls(this.db, [...mediaIds]);

    const galleries = new Map<string, string[]>();
    for (const link of links) {
      const url = urls.get(link.mediaId);
      if (url === undefined) continue;

      const gallery = galleries.get(link.eventId);
      if (gallery === undefined) {
        galleries.set(link.eventId, [url]);
      } else {
        gallery.push(url);
      }
    }

    return rows.map((row) => {
      const startDate = row.eventDate;
      const endDate = row.endDate ?? startDate;
      const startTime = row.eventTime;
      const endTime = row.endTime ?? null;

      // Le statut éditorial provient de la colonne en base, avec fallback sur "PUBLISHED"
      const status = (row.status as EventLifecycleStatus) ?? "PUBLISHED";

      return {
        id: row.id,
        title: row.title,
        slug: row.slug,
        description: row.description,
        excerpt: row.excerpt,
        startDate,
        eventDate: startDate,
        endDate,
        startTime,
        eventTime: startTime,
        endTime,
        location: row.location,
        imageMediaId: row.imageMediaId,
        bannerMediaId: row.bannerMediaId,
        imageUrl:
          row.imageMediaId === null ? null : (urls.get(row.imageMediaId) ?? null),
        bannerImageUrl:
          row.bannerMediaId === null
            ? null
            : (urls.get(row.bannerMediaId) ?? null),
        galleryUrls: galleries.get(row.id) ?? [],
        departmentId: row.departmentId,
        visibilityScope: row.visibilityScope,
        practicalInfo: row.practicalInfo,
        status,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      };
    });
  }
}
