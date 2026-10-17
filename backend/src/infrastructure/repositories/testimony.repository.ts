import { and, asc, count, desc, eq } from "drizzle-orm";
import type { Testimony, TestimonyStatus } from "@/domain/entities";
import type {
  ListOptions,
  ListResult,
  TestimonyFilters,
  TestimonyInput,
  TestimonyRepository,
} from "@/domain/repositories";
import type { Database } from "@/infrastructure/database/client";
import type { TestimonyRow } from "@/infrastructure/database/schema";
import { media, testimonies } from "@/infrastructure/database/schema";
import { InternalError } from "@/shared/errors/app-error";

/**
 * Persistance des témoignages.
 *
 * Gère le cycle de modération complet (PENDING, PUBLISHED, REJECTED, ARCHIVED),
 * la sélection éditoriale pour la section Hero, et la résolution des portraits médias.
 */

interface TestimonyJoinedRow {
  testimony: TestimonyRow;
  photoUrl: string | null;
}

function toTestimony(row: TestimonyJoinedRow): Testimony {
  const t = row.testimony;
  return {
    id: t.id,
    content: t.content || t.quote || "",
    quote: t.quote || t.content || "",
    authorName: t.authorName || t.personName || null,
    personName: t.personName || t.authorName || "",
    isAnonymous: t.isAnonymous ?? false,
    status: t.status as TestimonyStatus,
    isFeatured: t.isFeatured ?? false,
    photoMediaId: t.photoMediaId,
    photoUrl: row.photoUrl,
    consentedAt: t.consentedAt,
    publishedAt: t.publishedAt,
    reviewedBy: t.reviewedBy,
    reviewedAt: t.reviewedAt,
    adminNotes: t.adminNotes,
    position: t.position,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}

function toPatch(
  data: Partial<TestimonyInput>,
): Partial<typeof testimonies.$inferInsert> {
  const patch: Partial<typeof testimonies.$inferInsert> = {};
  if (data.content !== undefined) {
    patch.content = data.content;
    patch.quote = data.content;
  } else if (data.quote !== undefined) {
    patch.content = data.quote;
    patch.quote = data.quote;
  }

  if (data.authorName !== undefined) {
    patch.authorName = data.authorName;
    patch.personName = data.authorName ?? "";
  } else if (data.personName !== undefined) {
    patch.authorName = data.personName;
    patch.personName = data.personName;
  }

  if (data.isAnonymous !== undefined) patch.isAnonymous = data.isAnonymous;
  if (data.status !== undefined) patch.status = data.status;
  if (data.isFeatured !== undefined) patch.isFeatured = data.isFeatured;
  if (data.photoMediaId !== undefined) patch.photoMediaId = data.photoMediaId;
  if (data.consentedAt !== undefined) patch.consentedAt = data.consentedAt;
  if (data.publishedAt !== undefined) patch.publishedAt = data.publishedAt;
  if (data.reviewedBy !== undefined) patch.reviewedBy = data.reviewedBy;
  if (data.reviewedAt !== undefined) patch.reviewedAt = data.reviewedAt;
  if (data.adminNotes !== undefined) patch.adminNotes = data.adminNotes;
  if (data.position !== undefined) patch.position = data.position;
  return patch;
}

export class DrizzleTestimonyRepository implements TestimonyRepository {
  constructor(private readonly db: Database) {}

  async list(
    options: ListOptions,
    filters?: TestimonyFilters,
  ): Promise<ListResult<Testimony>> {
    const conditions = [];
    if (filters?.status) {
      conditions.push(eq(testimonies.status, filters.status));
    }
    if (filters?.isFeatured !== undefined) {
      conditions.push(eq(testimonies.isFeatured, filters.isFeatured));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await this.db
      .select({ testimony: testimonies, photoUrl: media.publicUrl })
      .from(testimonies)
      .leftJoin(media, eq(testimonies.photoMediaId, media.id))
      .where(whereClause)
      .orderBy(desc(testimonies.createdAt))
      .limit(options.limit)
      .offset(options.offset);

    const [totals] = await this.db
      .select({ total: count() })
      .from(testimonies)
      .where(whereClause);

    return { items: rows.map(toTestimony), total: totals?.total ?? 0 };
  }

  async listPublic(options: ListOptions): Promise<ListResult<Testimony>> {
    const rows = await this.db
      .select({ testimony: testimonies, photoUrl: media.publicUrl })
      .from(testimonies)
      .leftJoin(media, eq(testimonies.photoMediaId, media.id))
      .where(eq(testimonies.status, "PUBLISHED"))
      .orderBy(desc(testimonies.publishedAt), desc(testimonies.createdAt))
      .limit(options.limit)
      .offset(options.offset);

    const [totals] = await this.db
      .select({ total: count() })
      .from(testimonies)
      .where(eq(testimonies.status, "PUBLISHED"));

    return { items: rows.map(toTestimony), total: totals?.total ?? 0 };
  }

  async listHeroFeatured(limit = 3): Promise<Testimony[]> {
    const rows = await this.db
      .select({ testimony: testimonies, photoUrl: media.publicUrl })
      .from(testimonies)
      .leftJoin(media, eq(testimonies.photoMediaId, media.id))
      .where(
        and(
          eq(testimonies.status, "PUBLISHED"),
          eq(testimonies.isFeatured, true),
        ),
      )
      .orderBy(desc(testimonies.publishedAt), desc(testimonies.createdAt))
      .limit(limit);

    return rows.map(toTestimony);
  }

  async findById(id: string): Promise<Testimony | null> {
    const rows = await this.db
      .select({ testimony: testimonies, photoUrl: media.publicUrl })
      .from(testimonies)
      .leftJoin(media, eq(testimonies.photoMediaId, media.id))
      .where(eq(testimonies.id, id))
      .limit(1);

    const [row] = rows;
    return row ? toTestimony(row) : null;
  }

  async create(data: TestimonyInput): Promise<Testimony> {
    const textContent = data.content || data.quote || "";
    const name = data.authorName || data.personName || null;

    const [inserted] = await this.db
      .insert(testimonies)
      .values({
        content: textContent,
        quote: textContent,
        authorName: name,
        personName: name ?? "",
        isAnonymous: data.isAnonymous ?? false,
        status: data.status ?? "PENDING",
        isFeatured: data.isFeatured ?? false,
        photoMediaId: data.photoMediaId ?? null,
        consentedAt: data.consentedAt ?? new Date(),
        publishedAt: data.status === "PUBLISHED" ? (data.publishedAt ?? new Date()) : null,
        reviewedBy: data.reviewedBy ?? null,
        reviewedAt: data.reviewedAt ?? null,
        adminNotes: data.adminNotes ?? null,
        position: data.position ?? 0,
      })
      .returning({ id: testimonies.id });

    if (!inserted) {
      throw new InternalError("La création du témoignage a échoué");
    }

    const created = await this.findById(inserted.id);
    if (!created) {
      throw new InternalError("Le témoignage créé est introuvable");
    }
    return created;
  }

  async update(id: string, data: Partial<TestimonyInput>): Promise<Testimony | null> {
    const patch = toPatch(data);
    if (Object.keys(patch).length === 0) {
      return this.findById(id);
    }

    const updated = await this.db
      .update(testimonies)
      .set(patch)
      .where(eq(testimonies.id, id))
      .returning({ id: testimonies.id });

    if (updated.length === 0) {
      return null;
    }
    return this.findById(id);
  }

  async updateStatus(
    id: string,
    status: TestimonyStatus,
    meta?: { reviewedBy?: string | null; reviewedAt?: Date; adminNotes?: string | null },
  ): Promise<Testimony | null> {
    const patch: Partial<typeof testimonies.$inferInsert> = {
      status,
      reviewedBy: meta?.reviewedBy ?? null,
      reviewedAt: meta?.reviewedAt ?? new Date(),
    };

    if (meta?.adminNotes !== undefined) {
      patch.adminNotes = meta.adminNotes;
    }

    if (status === "PUBLISHED") {
      patch.publishedAt = new Date();
    }

    const updated = await this.db
      .update(testimonies)
      .set(patch)
      .where(eq(testimonies.id, id))
      .returning({ id: testimonies.id });

    if (updated.length === 0) {
      return null;
    }
    return this.findById(id);
  }

  async setFeatured(id: string, isFeatured: boolean): Promise<Testimony | null> {
    const updated = await this.db
      .update(testimonies)
      .set({ isFeatured })
      .where(eq(testimonies.id, id))
      .returning({ id: testimonies.id });

    if (updated.length === 0) {
      return null;
    }
    return this.findById(id);
  }

  async remove(id: string): Promise<boolean> {
    const deleted = await this.db
      .delete(testimonies)
      .where(eq(testimonies.id, id))
      .returning({ id: testimonies.id });

    return deleted.length > 0;
  }
}
