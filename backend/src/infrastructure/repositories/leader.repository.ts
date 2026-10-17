import { asc, count, eq } from "drizzle-orm";
import type { Leader } from "@/domain/entities";
import type {
  LeaderInput,
  LeaderRepository,
  ListOptions,
  ListResult,
} from "@/domain/repositories";
import type { Database } from "@/infrastructure/database/client";
import type { LeaderRow } from "@/infrastructure/database/schema";
import { leaders, media } from "@/infrastructure/database/schema";
import { InternalError } from "@/shared/errors/app-error";

/**
 * Persistance des responsables.
 *
 * L'entité du domaine porte déjà une **URL** (`photoUrl`) : la résolution
 * référence `media` → URL publique appartient donc au repository, qui la fait
 * en une seule requête (`leftJoin`). Le service ne reçoit que des entités
 * prêtes à sérialiser (`docs/018` §4.5).
 */

/** Ligne jointe : la personne et l'URL publique de son portrait (ou `null`). */
interface LeaderJoinedRow {
  leader: LeaderRow;
  photoUrl: string | null;
}

function toLeader(row: LeaderJoinedRow): Leader {
  return {
    id: row.leader.id,
    name: row.leader.name,
    role: row.leader.role,
    photoMediaId: row.leader.photoMediaId,
    photoUrl: row.photoUrl,
    departmentId: row.leader.departmentId,
    position: row.leader.position,
    createdAt: row.leader.createdAt,
    updatedAt: row.leader.updatedAt,
  };
}

/**
 * Traduit une mise à jour partielle en `SET`. Les clés absentes ne sont
 * **jamais** écrites : une mise à jour ne doit pas effacer un champ que le
 * client n'a pas mentionné.
 */
function toPatch(data: Partial<LeaderInput>): Partial<typeof leaders.$inferInsert> {
  const patch: Partial<typeof leaders.$inferInsert> = {};
  if (data.name !== undefined) patch.name = data.name;
  if (data.role !== undefined) patch.role = data.role;
  if (data.photoMediaId !== undefined) patch.photoMediaId = data.photoMediaId;
  if (data.departmentId !== undefined) patch.departmentId = data.departmentId;
  if (data.position !== undefined) patch.position = data.position;
  return patch;
}

export class DrizzleLeaderRepository implements LeaderRepository {
  constructor(private readonly db: Database) {}

  async list(options: ListOptions): Promise<ListResult<Leader>> {
    const rows = await this.db
      .select({ leader: leaders, photoUrl: media.publicUrl })
      .from(leaders)
      .leftJoin(media, eq(leaders.photoMediaId, media.id))
      .orderBy(asc(leaders.position), asc(leaders.createdAt))
      .limit(options.limit)
      .offset(options.offset);

    const [totals] = await this.db.select({ total: count() }).from(leaders);

    return { items: rows.map(toLeader), total: totals?.total ?? 0 };
  }

  async listByDepartment(departmentId: string): Promise<Leader[]> {
    const rows = await this.db
      .select({ leader: leaders, photoUrl: media.publicUrl })
      .from(leaders)
      .leftJoin(media, eq(leaders.photoMediaId, media.id))
      .where(eq(leaders.departmentId, departmentId))
      .orderBy(asc(leaders.position), asc(leaders.createdAt));

    return rows.map(toLeader);
  }

  async findById(id: string): Promise<Leader | null> {
    const rows = await this.db
      .select({ leader: leaders, photoUrl: media.publicUrl })
      .from(leaders)
      .leftJoin(media, eq(leaders.photoMediaId, media.id))
      .where(eq(leaders.id, id))
      .limit(1);

    const [row] = rows;
    return row ? toLeader(row) : null;
  }

  async create(data: LeaderInput): Promise<Leader> {
    const [inserted] = await this.db
      .insert(leaders)
      .values({
        name: data.name,
        role: data.role || "Responsable",
        photoMediaId: data.photoMediaId ?? null,
        departmentId: data.departmentId ?? null,
        position: data.position ?? 0,
      })
      .returning({ id: leaders.id });

    if (!inserted) {
      throw new InternalError("La création du responsable a échoué");
    }

    const created = await this.findById(inserted.id);
    if (!created) {
      throw new InternalError("Le responsable créé est introuvable");
    }
    return created;
  }

  async update(id: string, data: Partial<LeaderInput>): Promise<Leader | null> {
    const patch = toPatch(data);
    if (Object.keys(patch).length === 0) {
      return this.findById(id);
    }

    const updated = await this.db
      .update(leaders)
      .set(patch)
      .where(eq(leaders.id, id))
      .returning({ id: leaders.id });

    if (updated.length === 0) {
      return null;
    }
    return this.findById(id);
  }

  async remove(id: string): Promise<boolean> {
    const deleted = await this.db
      .delete(leaders)
      .where(eq(leaders.id, id))
      .returning({ id: leaders.id });

    return deleted.length > 0;
  }
}
