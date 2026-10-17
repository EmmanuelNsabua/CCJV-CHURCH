import { and, asc, count, eq, inArray, ne } from "drizzle-orm";
import type {
  Department,
  DepartmentActivity,
  DepartmentArchive,
} from "@/domain/entities";
import type {
  DepartmentActivityInput,
  DepartmentInput,
  DepartmentRepository,
  ListOptions,
  ListResult,
} from "@/domain/repositories";
import type { Database } from "@/infrastructure/database/client";
import {
  departmentActivities,
  departmentArchives,
  departmentMedia,
  departments,
  leaders,
  media,
} from "@/infrastructure/database/schema";
import { InternalError } from "@/shared/errors/app-error";

/**
 * Implémentation Drizzle du contrat `DepartmentRepository`.
 *
 * Deux responsabilités, volontairement réunies ici et nulle part ailleurs :
 *
 * 1. **Traduire** les lignes SQL en entités du domaine ;
 * 2. **Résoudre les médias** : le domaine expose des URL (`bannerImageUrl`,
 *    `galleryUrls`), jamais des identifiants de média. Les services reçoivent
 *    donc des entités prêtes à sérialiser (docs/018 §4.5).
 *
 * Aucune requête n'est émise dans une boucle : une galerie se charge par un
 * `inArray` unique puis se regroupe en mémoire (IMPLEMENTATION_SPEC §3.2).
 */

type DepartmentRow = typeof departments.$inferSelect;
type DepartmentPatch = Partial<typeof departments.$inferInsert>;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * `findByIdOrSlug` bascule entre les deux colonnes sur ce test. Il est aussi
 * utilisé comme garde avant tout `eq(id, …)` : PostgreSQL rejette une chaîne
 * qui n'est pas un UUID, or un slug n'en est pas un.
 */
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

export class DrizzleDepartmentRepository implements DepartmentRepository {
  constructor(private readonly db: Database) {}

  async list(options: ListOptions): Promise<ListResult<Department>> {
    const rows = await this.db
      .select()
      .from(departments)
      // L'ordre est voulu par l'administration, puis stabilisé par le nom :
      // deux départements de même `position` ne doivent pas s'échanger d'un
      // appel à l'autre, sinon la pagination devient incohérente.
      .orderBy(asc(departments.position), asc(departments.name))
      .limit(options.limit)
      .offset(options.offset);

    const [totals] = await this.db.select({ value: count() }).from(departments);

    return { items: await this.hydrate(rows), total: totals?.value ?? 0 };
  }

  async findById(id: string): Promise<Department | null> {
    if (!isUuid(id)) return null;

    const rows = await this.db
      .select()
      .from(departments)
      .where(eq(departments.id, id))
      .limit(1);

    const [department] = await this.hydrate(rows);
    return this.enrichWithRelations(department ?? null);
  }

  async findByIdOrSlug(value: string): Promise<Department | null> {
    if (isUuid(value)) return this.findById(value);

    const rows = await this.db
      .select()
      .from(departments)
      .where(eq(departments.slug, value))
      .limit(1);

    const [department] = await this.hydrate(rows);
    return this.enrichWithRelations(department ?? null);
  }

  private async enrichWithRelations(
    dept: Department | null,
  ): Promise<Department | null> {
    if (!dept) return null;
    const activities = await this.listActivities(dept.id);
    const leaderRows = await this.db
      .select({
        leader: leaders,
        photoUrl: media.publicUrl,
      })
      .from(leaders)
      .leftJoin(media, eq(leaders.photoMediaId, media.id))
      .where(eq(leaders.departmentId, dept.id))
      .orderBy(asc(leaders.position), asc(leaders.createdAt));

    const enrichedLeaders = leaderRows.map((r) => ({
      id: r.leader.id,
      name: r.leader.name,
      role: r.leader.role,
      photoMediaId: r.leader.photoMediaId,
      photoUrl: r.photoUrl,
      departmentId: r.leader.departmentId,
      position: r.leader.position,
      createdAt: r.leader.createdAt,
      updatedAt: r.leader.updatedAt,
    }));

    return {
      ...dept,
      activities,
      leaders: enrichedLeaders,
    };
  }

  async slugExists(slug: string, exceptId?: string): Promise<boolean> {
    const condition =
      exceptId === undefined
        ? eq(departments.slug, slug)
        : and(eq(departments.slug, slug), ne(departments.id, exceptId));

    const rows = await this.db
      .select({ id: departments.id })
      .from(departments)
      .where(condition)
      .limit(1);

    return rows.length > 0;
  }

  async exists(id: string): Promise<boolean> {
    if (!isUuid(id)) return false;

    const rows = await this.db
      .select({ id: departments.id })
      .from(departments)
      .where(eq(departments.id, id))
      .limit(1);

    return rows.length > 0;
  }

  async create(data: DepartmentInput, slug: string): Promise<Department> {
    const [row] = await this.db
      .insert(departments)
      .values({
        name: data.name,
        slug,
        description: data.description ?? null,
        mission: data.mission ?? null,
        history: data.history ?? null,
        responsibleName: data.responsibleName ?? null,
        tagline: data.tagline ?? null,
        meetingSchedule: data.meetingSchedule ?? null,
        keyPoints: data.keyPoints ?? null,
        bannerMediaId: data.bannerMediaId ?? null,
        position: data.position ?? 0,
      })
      .returning();

    if (row === undefined) {
      throw new InternalError("Le département n'a pas pu être créé");
    }

    await this.replaceGallery(row.id, data.galleryMediaIds);

    if (data.activities !== undefined) {
      await this.saveActivities(row.id, data.activities);
    }

    const created = await this.findById(row.id);
    if (created === null) {
      throw new InternalError("Le département créé est introuvable");
    }

    return created;
  }

  async update(
    id: string,
    data: Partial<DepartmentInput>,
  ): Promise<Department | null> {
    if (!isUuid(id)) return null;

    // Un champ absent n'est pas un champ vidé : on ne recopie que ce qui est
    // explicitement fourni, ce qui rend `PATCH` partiel au sens strict.
    const patch: DepartmentPatch = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.description !== undefined) patch.description = data.description;
    if (data.mission !== undefined) patch.mission = data.mission;
    if (data.history !== undefined) patch.history = data.history;
    if (data.responsibleName !== undefined) {
      patch.responsibleName = data.responsibleName;
    }
    if (data.tagline !== undefined) patch.tagline = data.tagline;
    if (data.meetingSchedule !== undefined) {
      patch.meetingSchedule = data.meetingSchedule;
    }
    if (data.keyPoints !== undefined) patch.keyPoints = data.keyPoints;
    if (data.bannerMediaId !== undefined) {
      patch.bannerMediaId = data.bannerMediaId;
    }
    if (data.position !== undefined) patch.position = data.position;

    if (Object.keys(patch).length > 0) {
      await this.db.update(departments).set(patch).where(eq(departments.id, id));
    }

    await this.replaceGallery(id, data.galleryMediaIds);

    if (data.activities !== undefined) {
      await this.saveActivities(id, data.activities);
    }

    return this.findById(id);
  }

  async listActivities(departmentId: string): Promise<DepartmentActivity[]> {
    if (!isUuid(departmentId)) return [];

    const rows = await this.db
      .select({
        activity: departmentActivities,
        imageUrl: media.publicUrl,
      })
      .from(departmentActivities)
      .leftJoin(media, eq(departmentActivities.imageMediaId, media.id))
      .where(eq(departmentActivities.departmentId, departmentId))
      .orderBy(asc(departmentActivities.position), asc(departmentActivities.createdAt));

    return rows.map((r) => ({
      ...r.activity,
      imageUrl: r.imageUrl,
    }));
  }

  async saveActivities(
    departmentId: string,
    activities: DepartmentActivityInput[],
  ): Promise<DepartmentActivity[]> {
    if (!isUuid(departmentId)) return [];

    await this.db.transaction(async (tx) => {
      await tx
        .delete(departmentActivities)
        .where(eq(departmentActivities.departmentId, departmentId));

      if (activities.length > 0) {
        await tx.insert(departmentActivities).values(
          activities.map((act, index) => ({
            departmentId,
            title: act.title,
            description: act.description ?? null,
            imageMediaId: act.imageMediaId ?? null,
            position: act.position ?? index,
          })),
        );
      }
    });

    return this.listActivities(departmentId);
  }

  /**
   * Archivage préalable complet et sécurisé avant suppression de l'entité active.
   * Conserve un snapshot JSON des données, activités, galerie et responsables.
   * Ne supprime jamais les fichiers physiques de la bibliothèque média.
   */
  async archiveAndDelete(
    id: string,
    options: { archivedBy?: string | null; reason?: string | null },
  ): Promise<DepartmentArchive> {
    if (!isUuid(id)) {
      throw new InternalError("Identifiant de département invalide");
    }

    const dept = await this.findById(id);
    if (!dept) {
      throw new InternalError("Département introuvable pour archivage");
    }

    const currentActivities = await this.listActivities(id);
    const galleryLinks = await this.db
      .select()
      .from(departmentMedia)
      .where(eq(departmentMedia.departmentId, id));

    const currentLeaders = await this.db
      .select()
      .from(leaders)
      .where(eq(leaders.departmentId, id));

    const snapshot = {
      department: {
        id: dept.id,
        name: dept.name,
        slug: dept.slug,
        description: dept.description,
        mission: dept.mission,
        history: dept.history,
        responsibleName: dept.responsibleName,
        tagline: dept.tagline,
        meetingSchedule: dept.meetingSchedule,
        keyPoints: dept.keyPoints,
        bannerMediaId: dept.bannerMediaId,
        position: dept.position,
        createdAt: dept.createdAt,
        updatedAt: dept.updatedAt,
      },
      activities: currentActivities,
      galleryMediaIds: galleryLinks.map((g) => g.mediaId),
      leaders: currentLeaders,
    };

    let archiveRow: typeof departmentArchives.$inferSelect | undefined;

    await this.db.transaction(async (tx) => {
      // 1. Sauvegarde sûre dans les archives
      const [insertedArchive] = await tx
        .insert(departmentArchives)
        .values({
          originalDepartmentId: id,
          name: dept.name,
          slug: dept.slug,
          snapshot,
          archivedBy: options.archivedBy ?? null,
          reason: options.reason ?? null,
        })
        .returning();

      if (!insertedArchive) {
        throw new InternalError(
          "Impossible de créer l'archive préalable du département",
        );
      }
      archiveRow = insertedArchive;

      // 2. Nettoyage des activités et galerie
      await tx
        .delete(departmentActivities)
        .where(eq(departmentActivities.departmentId, id));

      await tx
        .delete(departmentMedia)
        .where(eq(departmentMedia.departmentId, id));

      // 3. Détachement explicite des responsables (sans supprimer les personnes)
      await tx
        .update(leaders)
        .set({ departmentId: null })
        .where(eq(leaders.departmentId, id));

      // 4. Suppression de l'entité active
      await tx.delete(departments).where(eq(departments.id, id));
    });

    if (!archiveRow) {
      throw new InternalError("Échec de l'archivage du département");
    }

    return {
      id: archiveRow.id,
      originalDepartmentId: archiveRow.originalDepartmentId,
      name: archiveRow.name,
      slug: archiveRow.slug,
      snapshot: archiveRow.snapshot as Record<string, unknown>,
      archivedBy: archiveRow.archivedBy,
      archivedAt: archiveRow.archivedAt,
      reason: archiveRow.reason,
    };
  }

  /**
   * Suppression simple du département (alternative sans archive si appelé directement).
   */
  async remove(id: string): Promise<boolean> {
    if (!isUuid(id)) return false;

    const rows = await this.db
      .delete(departments)
      .where(eq(departments.id, id))
      .returning({ id: departments.id });

    return rows.length > 0;
  }

  /** Remplace la galerie lorsqu'elle est fournie. `undefined` = inchangée. */
  private async replaceGallery(
    departmentId: string,
    mediaIds: string[] | undefined,
  ): Promise<void> {
    if (mediaIds === undefined) return;

    const unique = [...new Set(mediaIds)];

    await this.db.transaction(async (tx) => {
      await tx
        .delete(departmentMedia)
        .where(eq(departmentMedia.departmentId, departmentId));

      if (unique.length === 0) return;

      await tx.insert(departmentMedia).values(
        unique.map((mediaId, position) => ({
          departmentId,
          mediaId,
          position,
        })),
      );
    });
  }

  /**
   * Complète les lignes avec les URL de médias.
   *
   * Deux requêtes au total, quel que soit le nombre de lignes : une pour les
   * liaisons de galerie, une pour les médias référencés (bannière comprise).
   */
  private async hydrate(rows: DepartmentRow[]): Promise<Department[]> {
    if (rows.length === 0) return [];

    const ids = rows.map((row) => row.id);

    const links = await this.db
      .select({
        departmentId: departmentMedia.departmentId,
        mediaId: departmentMedia.mediaId,
      })
      .from(departmentMedia)
      .where(inArray(departmentMedia.departmentId, ids))
      .orderBy(asc(departmentMedia.position), asc(departmentMedia.mediaId));

    const mediaIds = new Set<string>();
    for (const row of rows) {
      if (row.bannerMediaId !== null) mediaIds.add(row.bannerMediaId);
    }
    for (const link of links) mediaIds.add(link.mediaId);

    const urls = await loadMediaUrls(this.db, [...mediaIds]);

    const galleries = new Map<string, string[]>();
    for (const link of links) {
      const url = urls.get(link.mediaId);
      // Média absent du registre : la liaison est orpheline, on l'ignore
      // plutôt que d'exposer `undefined` dans la galerie.
      if (url === undefined) continue;

      const gallery = galleries.get(link.departmentId);
      if (gallery === undefined) {
        galleries.set(link.departmentId, [url]);
      } else {
        gallery.push(url);
      }
    }

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      mission: row.mission,
      history: row.history,
      responsibleName: row.responsibleName,
      tagline: row.tagline,
      meetingSchedule: row.meetingSchedule,
      keyPoints: row.keyPoints,
      bannerMediaId: row.bannerMediaId,
      bannerImageUrl:
        row.bannerMediaId === null
          ? null
          : (urls.get(row.bannerMediaId) ?? null),
      galleryUrls: galleries.get(row.id) ?? [],
      position: row.position,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }
}
