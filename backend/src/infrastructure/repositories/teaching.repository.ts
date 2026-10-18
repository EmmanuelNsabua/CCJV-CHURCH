import { and, asc, count, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import type {
  BiblicalReference,
  Teaching,
  TeachingMedia,
} from "@/domain/entities";
import type {
  BiblicalReferenceInput,
  CreateTeachingInput,
  TeachingFilter,
  TeachingMediaInput,
  TeachingRepository,
  UpdateTeachingInput,
} from "@/domain/repositories";
import type { Database } from "@/infrastructure/database/client";
import {
  media,
  teachingBiblicalReferences,
  teachingMedia,
  teachings,
} from "@/infrastructure/database/schema";
import { NotFoundError } from "@/shared/errors/app-error";

export class DrizzleTeachingRepository implements TeachingRepository {
  constructor(private readonly db: Database) {}

  /**
   * Hydrate un ensemble d'enseignements avec leurs références bibliques et médias en 2 requêtes groupées.
   * Supprime le problème N+1 et garantit une complexité O(1) en requêtes réseau.
   */
  private async hydrate(rows: (typeof teachings.$inferSelect)[]): Promise<Teaching[]> {
    if (rows.length === 0) return [];

    const ids = rows.map((r) => r.id);

    // Requête groupée pour toutes les références bibliques des IDs demandés
    const refs = await this.db
      .select()
      .from(teachingBiblicalReferences)
      .where(inArray(teachingBiblicalReferences.teachingId, ids))
      .orderBy(asc(teachingBiblicalReferences.position));

    // Requête groupée pour tous les médias des IDs demandés
    const mediaRows = await this.db
      .select({
        id: teachingMedia.id,
        teachingId: teachingMedia.teachingId,
        mediaId: teachingMedia.mediaId,
        role: teachingMedia.role,
        isPrimary: teachingMedia.isPrimary,
        position: teachingMedia.position,
        createdAt: teachingMedia.createdAt,
        publicUrl: media.publicUrl,
        mimeType: media.mimeType,
        sizeBytes: media.sizeBytes,
        alt: media.alt,
      })
      .from(teachingMedia)
      .leftJoin(media, eq(teachingMedia.mediaId, media.id))
      .where(inArray(teachingMedia.teachingId, ids))
      .orderBy(asc(teachingMedia.position));

    const refsByTeachingId = new Map<string, BiblicalReference[]>();
    for (const r of refs) {
      const list = refsByTeachingId.get(r.teachingId) ?? [];
      list.push({
        id: r.id,
        teachingId: r.teachingId,
        book: r.book,
        startChapter: r.startChapter,
        startVerse: r.startVerse,
        endChapter: r.endChapter,
        endVerse: r.endVerse,
        position: r.position,
        createdAt: r.createdAt,
      });
      refsByTeachingId.set(r.teachingId, list);
    }

    const mediasByTeachingId = new Map<string, TeachingMedia[]>();
    for (const m of mediaRows) {
      const list = mediasByTeachingId.get(m.teachingId) ?? [];
      list.push({
        id: m.id,
        teachingId: m.teachingId,
        mediaId: m.mediaId,
        role: m.role,
        isPrimary: m.isPrimary,
        position: m.position,
        createdAt: m.createdAt,
        publicUrl: m.publicUrl ?? undefined,
        mimeType: m.mimeType ?? undefined,
        sizeBytes: m.sizeBytes ?? undefined,
        alt: m.alt,
      });
      mediasByTeachingId.set(m.teachingId, list);
    }

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      speakerName: row.speakerName,
      preachedAt:
        typeof row.preachedAt === "string"
          ? row.preachedAt
          : new Date(row.preachedAt).toISOString().slice(0, 10),
      summary: row.summary,
      description: row.description,
      status: row.status,
      publishedAt: row.publishedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      biblicalReferences: refsByTeachingId.get(row.id) ?? [],
      medias: mediasByTeachingId.get(row.id) ?? [],
    }));
  }

  private async loadFullTeaching(id: string): Promise<Teaching | null> {
    const [row] = await this.db
      .select()
      .from(teachings)
      .where(eq(teachings.id, id));

    if (!row) return null;
    const [hydrated] = await this.hydrate([row]);
    return hydrated ?? null;
  }

  async findById(id: string): Promise<Teaching | null> {
    return this.loadFullTeaching(id);
  }

  async findBySlug(slug: string): Promise<Teaching | null> {
    const [row] = await this.db
      .select({ id: teachings.id })
      .from(teachings)
      .where(eq(teachings.slug, slug));

    if (!row) return null;
    return this.loadFullTeaching(row.id);
  }

  async list(filter: TeachingFilter = {}): Promise<{ items: Teaching[]; total: number }> {
    const conditions = [];

    if (filter.status) {
      conditions.push(eq(teachings.status, filter.status));
    }

    if (filter.search && filter.search.trim()) {
      const term = `%${filter.search.trim()}%`;
      conditions.push(
        or(
          ilike(teachings.title, term),
          ilike(teachings.speakerName, term),
        ),
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await this.db
      .select({ value: count() })
      .from(teachings)
      .where(whereClause);

    const total = Number(countResult?.value ?? 0);

    const limit = filter.limit ?? 20;
    const offset = filter.offset ?? 0;

    const rows = await this.db
      .select()
      .from(teachings)
      .where(whereClause)
      .orderBy(
        sql`${teachings.publishedAt} DESC NULLS LAST`,
        desc(teachings.preachedAt),
        desc(teachings.createdAt),
      )
      .limit(limit)
      .offset(offset);

    const items = await this.hydrate(rows);

    return { items, total };
  }

  async create(data: CreateTeachingInput): Promise<Teaching> {
    const [inserted] = await this.db
      .insert(teachings)
      .values({
        title: data.title,
        slug: data.slug,
        speakerName: data.speakerName,
        preachedAt: data.preachedAt,
        summary: data.summary ?? null,
        description: data.description ?? null,
        status: data.status ?? "DRAFT",
      })
      .returning({ id: teachings.id });

    if (!inserted) throw new Error("Échec d'insertion de l'enseignement");

    const full = await this.loadFullTeaching(inserted.id);
    if (!full) throw new Error("Échec de relecture de l'enseignement inséré");
    return full;
  }

  async update(id: string, data: UpdateTeachingInput): Promise<Teaching> {
    const patch: Partial<typeof teachings.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (data.title !== undefined) patch.title = data.title;
    if (data.slug !== undefined) patch.slug = data.slug;
    if (data.speakerName !== undefined) patch.speakerName = data.speakerName;
    if (data.preachedAt !== undefined) patch.preachedAt = data.preachedAt;
    if (data.summary !== undefined) patch.summary = data.summary;
    if (data.description !== undefined) patch.description = data.description;
    if (data.status !== undefined) patch.status = data.status;

    const [updated] = await this.db
      .update(teachings)
      .set(patch)
      .where(eq(teachings.id, id))
      .returning({ id: teachings.id });

    if (!updated) {
      throw new NotFoundError("NOT_FOUND", `Enseignement introuvable (${id})`);
    }

    const full = await this.loadFullTeaching(id);
    if (!full) throw new NotFoundError("NOT_FOUND", `Enseignement introuvable (${id})`);
    return full;
  }

  async updateBiblicalReferences(
    teachingId: string,
    references: BiblicalReferenceInput[],
  ): Promise<BiblicalReference[]> {
    const exists = await this.findById(teachingId);
    if (!exists) {
      throw new NotFoundError("NOT_FOUND", `Enseignement introuvable (${teachingId})`);
    }

    return await this.db.transaction(async (tx) => {
      await tx
        .delete(teachingBiblicalReferences)
        .where(eq(teachingBiblicalReferences.teachingId, teachingId));

      if (references.length === 0) {
        return [];
      }

      const rowsToInsert = references.map((ref, idx) => ({
        teachingId,
        book: ref.book.trim(),
        startChapter: ref.startChapter,
        startVerse: ref.startVerse,
        endChapter: ref.endChapter ?? null,
        endVerse: ref.endVerse ?? null,
        position: ref.position ?? idx,
      }));

      const inserted = await tx
        .insert(teachingBiblicalReferences)
        .values(rowsToInsert)
        .returning();

      return inserted.map((r) => ({
        id: r.id,
        teachingId: r.teachingId,
        book: r.book,
        startChapter: r.startChapter,
        startVerse: r.startVerse,
        endChapter: r.endChapter,
        endVerse: r.endVerse,
        position: r.position,
        createdAt: r.createdAt,
      }));
    });
  }

  async updateMedias(
    teachingId: string,
    medias: TeachingMediaInput[],
  ): Promise<TeachingMedia[]> {
    const exists = await this.findById(teachingId);
    if (!exists) {
      throw new NotFoundError("NOT_FOUND", `Enseignement introuvable (${teachingId})`);
    }

    return await this.db.transaction(async (tx) => {
      await tx
        .delete(teachingMedia)
        .where(eq(teachingMedia.teachingId, teachingId));

      if (medias.length === 0) {
        return [];
      }

      const rowsToInsert = medias.map((m, idx) => ({
        teachingId,
        mediaId: m.mediaId,
        role: m.role,
        isPrimary: m.isPrimary ?? false,
        position: m.position ?? idx,
      }));

      await tx.insert(teachingMedia).values(rowsToInsert);

      const refreshed = await this.loadFullTeaching(teachingId);
      return refreshed?.medias ?? [];
    });
  }

  async publish(id: string, publishedAt: Date): Promise<Teaching> {
    const [updated] = await this.db
      .update(teachings)
      .set({
        status: "PUBLISHED",
        publishedAt,
        updatedAt: new Date(),
      })
      .where(eq(teachings.id, id))
      .returning({ id: teachings.id });

    if (!updated) {
      throw new NotFoundError("NOT_FOUND", `Enseignement introuvable (${id})`);
    }

    const full = await this.loadFullTeaching(id);
    if (!full) throw new NotFoundError("NOT_FOUND", `Enseignement introuvable (${id})`);
    return full;
  }

  async archive(id: string): Promise<Teaching> {
    const [updated] = await this.db
      .update(teachings)
      .set({
        status: "ARCHIVED",
        updatedAt: new Date(),
      })
      .where(eq(teachings.id, id))
      .returning({ id: teachings.id });

    if (!updated) {
      throw new NotFoundError("NOT_FOUND", `Enseignement introuvable (${id})`);
    }

    const full = await this.loadFullTeaching(id);
    if (!full) throw new NotFoundError("NOT_FOUND", `Enseignement introuvable (${id})`);
    return full;
  }

  async delete(id: string): Promise<boolean> {
    const [deleted] = await this.db
      .delete(teachings)
      .where(eq(teachings.id, id))
      .returning({ id: teachings.id });

    return Boolean(deleted);
  }
}
