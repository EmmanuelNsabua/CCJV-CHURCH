import { and, asc, count, desc, eq, gte, inArray, lt, ne } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import type { Event, EventStatus } from "@/domain/entities";
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

/**
 * Implémentation Drizzle du contrat `EventRepository`.
 *
 * Point central : **`is_archived` n'existe pas**. Le statut est recalculé
 * depuis `event_date`, et le filtre `status` est traduit en comparaison de
 * dates — `UPCOMING` ⇔ `event_date >= aujourd'hui`. La borne `today` est
 * injectable (`EventFilters.today`) pour que les tests ne dépendent pas du
 * jour où ils s'exécutent.
 *
 * Les colonnes `date`/`time` restent des chaînes : `client.ts` configure
 * `postgres.js` pour ne jamais les convertir en `Date`, ce qui supprime tout
 * décalage de fuseau entre le serveur et Lubumbashi.
 */

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

/**
 * Statut d'une ligne.
 *
 * `computeEventStatus` est la règle de référence. Quand la borne `today` est
 * injectée, on applique la même comparaison de chaînes que le filtre SQL :
 * les items renvoyés sont alors cohérents avec le filtre demandé.
 */
function statusOf(eventDate: string, today: string | undefined): EventStatus {
  if (today === undefined) return computeEventStatus(eventDate);
  return eventDate >= today ? "UPCOMING" : "ARCHIVED";
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

    // Le `total` provient d'un `count()` distinct portant **exactement** les
    // mêmes filtres : sans cela la pagination annoncerait un nombre de pages
    // qui ne correspond pas au contenu (IMPLEMENTATION_SPEC §3.3).
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
    const [row] = await this.db
      .insert(events)
      .values({
        title: data.title,
        slug,
        description: data.description ?? null,
        excerpt: data.excerpt ?? null,
        // Chaîne `YYYY-MM-DD` : jamais un objet `Date` sur une colonne `date`.
        eventDate: data.eventDate,
        eventTime: data.eventTime ?? null,
        location: data.location ?? null,
        imageMediaId: data.imageMediaId ?? null,
        bannerMediaId: data.bannerMediaId ?? null,
        departmentId: data.departmentId ?? null,
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
    if (data.eventDate !== undefined) patch.eventDate = data.eventDate;
    if (data.eventTime !== undefined) patch.eventTime = data.eventTime;
    if (data.location !== undefined) patch.location = data.location;
    if (data.imageMediaId !== undefined) patch.imageMediaId = data.imageMediaId;
    if (data.bannerMediaId !== undefined) {
      patch.bannerMediaId = data.bannerMediaId;
    }
    if (data.departmentId !== undefined) {
      patch.departmentId = data.departmentId;
    }
    if (data.practicalInfo !== undefined) {
      patch.practicalInfo = data.practicalInfo;
    }

    if (Object.keys(patch).length > 0) {
      await this.db.update(events).set(patch).where(eq(events.id, id));
    }

    await this.replaceGallery(id, data.galleryMediaIds);

    return this.findById(id);
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
   * Filtres de liste, en liste blanche. Le statut n'est jamais lu en base : il
   * se traduit par une comparaison avec la date du jour.
   */
  private buildFilters(filters: EventFilters): SQL | undefined {
    const conditions: SQL[] = [];

    if (filters.departmentId !== undefined) {
      conditions.push(eq(events.departmentId, filters.departmentId));
    }

    if (filters.status !== undefined) {
      const today = filters.today ?? toIsoDate(new Date());
      conditions.push(
        filters.status === "UPCOMING"
          ? gte(events.eventDate, today)
          : lt(events.eventDate, today),
      );
    }

    if (conditions.length === 0) return undefined;
    return and(...conditions);
  }

  private buildOrder(sort: EventSort): SQL[] {
    const column =
      sort.column === "created_at" ? events.createdAt : events.eventDate;
    const primary = sort.direction === "desc" ? desc(column) : asc(column);

    // Départage déterministe : deux événements de même date ne doivent pas
    // permuter entre deux pages d'une même pagination.
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

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      description: row.description,
      excerpt: row.excerpt,
      eventDate: row.eventDate,
      eventTime: row.eventTime,
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
      practicalInfo: row.practicalInfo,
      // Jamais lu en base : toujours recalculé.
      status: statusOf(row.eventDate, today),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }
}
