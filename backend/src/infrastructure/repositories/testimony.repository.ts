import { asc, count, eq } from "drizzle-orm";
import type { Testimony } from "@/domain/entities";
import type {
  ListOptions,
  ListResult,
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
 * Comme pour les responsables, `photoUrl` est résolu ici par une jointure vers
 * `media` : une requête par page, jamais une requête par ligne.
 */

interface TestimonyJoinedRow {
  testimony: TestimonyRow;
  photoUrl: string | null;
}

function toTestimony(row: TestimonyJoinedRow): Testimony {
  return { ...row.testimony, photoUrl: row.photoUrl };
}

function toPatch(
  data: Partial<TestimonyInput>,
): Partial<typeof testimonies.$inferInsert> {
  const patch: Partial<typeof testimonies.$inferInsert> = {};
  if (data.quote !== undefined) patch.quote = data.quote;
  if (data.personName !== undefined) patch.personName = data.personName;
  if (data.personRole !== undefined) patch.personRole = data.personRole;
  if (data.photoMediaId !== undefined) patch.photoMediaId = data.photoMediaId;
  if (data.position !== undefined) patch.position = data.position;
  return patch;
}

export class DrizzleTestimonyRepository implements TestimonyRepository {
  constructor(private readonly db: Database) {}

  async list(options: ListOptions): Promise<ListResult<Testimony>> {
    const rows = await this.db
      .select({ testimony: testimonies, photoUrl: media.publicUrl })
      .from(testimonies)
      .leftJoin(media, eq(testimonies.photoMediaId, media.id))
      .orderBy(asc(testimonies.position), asc(testimonies.createdAt))
      .limit(options.limit)
      .offset(options.offset);

    const [totals] = await this.db.select({ total: count() }).from(testimonies);

    return { items: rows.map(toTestimony), total: totals?.total ?? 0 };
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
    const [inserted] = await this.db
      .insert(testimonies)
      .values({
        quote: data.quote,
        personName: data.personName,
        personRole: data.personRole ?? null,
        photoMediaId: data.photoMediaId ?? null,
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

  async remove(id: string): Promise<boolean> {
    const deleted = await this.db
      .delete(testimonies)
      .where(eq(testimonies.id, id))
      .returning({ id: testimonies.id });

    return deleted.length > 0;
  }
}
