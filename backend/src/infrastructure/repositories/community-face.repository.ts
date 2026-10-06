import { asc, count, eq } from "drizzle-orm";
import type { CommunityFace } from "@/domain/entities";
import type {
  CommunityFaceInput,
  CommunityFaceRepository,
  ListOptions,
  ListResult,
} from "@/domain/repositories";
import type { Database } from "@/infrastructure/database/client";
import type { CommunityFaceRow } from "@/infrastructure/database/schema";
import { communityFaces, media } from "@/infrastructure/database/schema";
import { InternalError } from "@/shared/errors/app-error";

/**
 * Persistance des visages de la communauté.
 *
 * `photoUrl` est résolu par la jointure `media`, en une requête par page.
 */

interface CommunityFaceJoinedRow {
  face: CommunityFaceRow;
  photoUrl: string | null;
}

function toCommunityFace(row: CommunityFaceJoinedRow): CommunityFace {
  return { ...row.face, photoUrl: row.photoUrl };
}

function toPatch(
  data: Partial<CommunityFaceInput>,
): Partial<typeof communityFaces.$inferInsert> {
  const patch: Partial<typeof communityFaces.$inferInsert> = {};
  if (data.personName !== undefined) patch.personName = data.personName;
  if (data.caption !== undefined) patch.caption = data.caption;
  if (data.photoMediaId !== undefined) patch.photoMediaId = data.photoMediaId;
  if (data.position !== undefined) patch.position = data.position;
  return patch;
}

export class DrizzleCommunityFaceRepository implements CommunityFaceRepository {
  constructor(private readonly db: Database) {}

  async list(options: ListOptions): Promise<ListResult<CommunityFace>> {
    const rows = await this.db
      .select({ face: communityFaces, photoUrl: media.publicUrl })
      .from(communityFaces)
      .leftJoin(media, eq(communityFaces.photoMediaId, media.id))
      .orderBy(asc(communityFaces.position), asc(communityFaces.createdAt))
      .limit(options.limit)
      .offset(options.offset);

    const [totals] = await this.db.select({ total: count() }).from(communityFaces);

    return { items: rows.map(toCommunityFace), total: totals?.total ?? 0 };
  }

  async findById(id: string): Promise<CommunityFace | null> {
    const rows = await this.db
      .select({ face: communityFaces, photoUrl: media.publicUrl })
      .from(communityFaces)
      .leftJoin(media, eq(communityFaces.photoMediaId, media.id))
      .where(eq(communityFaces.id, id))
      .limit(1);

    const [row] = rows;
    return row ? toCommunityFace(row) : null;
  }

  async create(data: CommunityFaceInput): Promise<CommunityFace> {
    const [inserted] = await this.db
      .insert(communityFaces)
      .values({
        personName: data.personName,
        caption: data.caption,
        photoMediaId: data.photoMediaId ?? null,
        position: data.position ?? 0,
      })
      .returning({ id: communityFaces.id });

    if (!inserted) {
      throw new InternalError("La création du visage a échoué");
    }

    const created = await this.findById(inserted.id);
    if (!created) {
      throw new InternalError("Le visage créé est introuvable");
    }
    return created;
  }

  async update(
    id: string,
    data: Partial<CommunityFaceInput>,
  ): Promise<CommunityFace | null> {
    const patch = toPatch(data);
    if (Object.keys(patch).length === 0) {
      return this.findById(id);
    }

    const updated = await this.db
      .update(communityFaces)
      .set(patch)
      .where(eq(communityFaces.id, id))
      .returning({ id: communityFaces.id });

    if (updated.length === 0) {
      return null;
    }
    return this.findById(id);
  }

  async remove(id: string): Promise<boolean> {
    const deleted = await this.db
      .delete(communityFaces)
      .where(eq(communityFaces.id, id))
      .returning({ id: communityFaces.id });

    return deleted.length > 0;
  }
}
