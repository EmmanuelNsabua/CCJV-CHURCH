import { count, desc, eq, sql } from "drizzle-orm";
import type { MediaAsset } from "@/domain/entities";
import type {
  ListOptions,
  ListResult,
  MediaInput,
  MediaRepository,
} from "@/domain/repositories";
import type { Database } from "@/infrastructure/database/client";
import {
  communityFaces,
  departmentMedia,
  departments,
  eventMedia,
  events,
  leaders,
  media,
  publications,
  testimonies,
} from "@/infrastructure/database/schema";
import { InternalError } from "@/shared/errors/app-error";

/**
 * Registre des médias téléversés.
 *
 * Deux responsabilités au-delà du CRUD :
 * 1. **compter les références** d'un média en **une seule requête** (neuf
 *    sous-requêtes agrégées) — indispensable avant toute suppression, pour ne
 *    jamais laisser une image cassée dans une page ;
 * 2. **retirer les références** lors d'une suppression forcée explicite.
 */

export type MediaUsageSource =
  | "event_media"
  | "department_media"
  | "events_image"
  | "events_banner"
  | "departments_banner"
  | "publications_cover"
  | "leaders_photo"
  | "testimonies_photo"
  | "community_faces_photo";

/** Une référence à un média, localisée par son usage. */
export interface MediaUsage {
  source: MediaUsageSource;
  /** Libellé lisible destiné au back-office. */
  label: string;
  count: number;
}

/**
 * Port étendu du registre des médias.
 *
 * `MediaRepository` (domaine) porte le contrat minimal ; le service média a en
 * plus besoin de savoir *où* un fichier est utilisé et de pouvoir détacher ces
 * références pour une suppression forcée. Ce sont des opérations propres au
 * stockage, on les déclare donc ici plutôt que d'élargir le contrat du domaine.
 */
export interface MediaReferenceRepository extends MediaRepository {
  /** Détail par source, en une passe. */
  listUsages(mediaId: string): Promise<MediaUsage[]>;
  /** Détache toutes les références (galeries comprises) — suppression forcée. */
  clearReferences(mediaId: string): Promise<void>;
}

/**
 * Les neuf emplacements qui peuvent référencer un média.
 * L'ordre est stable : il sert aussi à l'affichage du détail des usages.
 */
const USAGE_SOURCES: readonly { source: MediaUsageSource; label: string }[] = [
  { source: "event_media", label: "Galerie d'un événement" },
  { source: "department_media", label: "Galerie d'un département" },
  { source: "events_image", label: "Image principale d'un événement" },
  { source: "events_banner", label: "Bandeau d'un événement" },
  { source: "departments_banner", label: "Bandeau d'un département" },
  { source: "publications_cover", label: "Couverture d'une publication" },
  { source: "leaders_photo", label: "Portrait d'un responsable" },
  { source: "testimonies_photo", label: "Portrait d'un témoignage" },
  { source: "community_faces_photo", label: "Portrait d'un visage de la communauté" },
];

/** Ligne brute du comptage : une colonne par source. */
type UsageCountRow = { [source: string]: unknown };

/** Les compteurs arrivent tantôt en `number`, tantôt en chaîne (bigint). */
function toCount(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export class DrizzleMediaRepository implements MediaReferenceRepository {
  constructor(private readonly db: Database) {}

  /**
   * Collection d'administration : les téléversements les plus récents d'abord.
   */
  async list(options: ListOptions): Promise<ListResult<MediaAsset>> {
    const rows = await this.db
      .select()
      .from(media)
      .orderBy(desc(media.createdAt), desc(media.id))
      .limit(options.limit)
      .offset(options.offset);

    const [totals] = await this.db.select({ total: count() }).from(media);

    return { items: rows, total: totals?.total ?? 0 };
  }

  async findById(id: string): Promise<MediaAsset | null> {
    const [row] = await this.db.select().from(media).where(eq(media.id, id)).limit(1);
    return row ?? null;
  }

  async findByPath(path: string): Promise<MediaAsset | null> {
    const [row] = await this.db
      .select()
      .from(media)
      .where(eq(media.path, path))
      .limit(1);

    return row ?? null;
  }

  async create(data: MediaInput): Promise<MediaAsset> {
    const [row] = await this.db
      .insert(media)
      .values({
        bucket: data.bucket,
        path: data.path,
        publicUrl: data.publicUrl,
        mimeType: data.mimeType,
        sizeBytes: data.sizeBytes,
        width: data.width ?? null,
        height: data.height ?? null,
        alt: data.alt ?? null,
        uploadedBy: data.uploadedBy ?? null,
      })
      .returning();

    if (!row) {
      throw new InternalError("L'enregistrement du média a échoué");
    }
    return row;
  }

  async remove(id: string): Promise<boolean> {
    const deleted = await this.db
      .delete(media)
      .where(eq(media.id, id))
      .returning({ id: media.id });

    return deleted.length > 0;
  }

  /**
   * Nombre total de références, toutes sources confondues.
   *
   * Le calcul passe par `listUsages` : **une seule** requête SQL, donc une
   * seule passe sur la base.
   */
  async countReferences(mediaId: string): Promise<number> {
    const usages = await this.listUsages(mediaId);
    return usages.reduce((total, usage) => total + usage.count, 0);
  }

  /**
   * Où ce média est-il utilisé ? Les neuf emplacements sont interrogés dans la
   * **même** requête (sous-requêtes agrégées) : jamais une requête par table.
   */
  async listUsages(mediaId: string): Promise<MediaUsage[]> {
    const rows = await this.db.execute<UsageCountRow>(sql`
      select
        (select count(*)::int from ${eventMedia} where ${eventMedia.mediaId} = ${mediaId}) as "event_media",
        (select count(*)::int from ${departmentMedia} where ${departmentMedia.mediaId} = ${mediaId}) as "department_media",
        (select count(*)::int from ${events} where ${events.imageMediaId} = ${mediaId}) as "events_image",
        (select count(*)::int from ${events} where ${events.bannerMediaId} = ${mediaId}) as "events_banner",
        (select count(*)::int from ${departments} where ${departments.bannerMediaId} = ${mediaId}) as "departments_banner",
        (select count(*)::int from ${publications} where ${publications.coverMediaId} = ${mediaId}) as "publications_cover",
        (select count(*)::int from ${leaders} where ${leaders.photoMediaId} = ${mediaId}) as "leaders_photo",
        (select count(*)::int from ${testimonies} where ${testimonies.photoMediaId} = ${mediaId}) as "testimonies_photo",
        (select count(*)::int from ${communityFaces} where ${communityFaces.photoMediaId} = ${mediaId}) as "community_faces_photo"
    `);

    const [row] = rows;

    return USAGE_SOURCES.map(({ source, label }) => ({
      source,
      label,
      count: toCount(row?.[source]),
    }));
  }

  /**
   * Détache les références avant une suppression forcée.
   *
   * Deux natures de références, traitées différemment :
   * - les colonnes `*_media_id` acceptent `NULL` → remises à `NULL` ;
   * - les galeries (`event_media`, `department_media`) ont un `media_id`
   *   `NOT NULL` en `onDelete: restrict` → la seule façon de détacher la
   *   référence est de **supprimer la ligne de galerie**.
   *
   * Le tout dans une transaction : jamais un détachement à moitié appliqué.
   */
  async clearReferences(mediaId: string): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx.delete(eventMedia).where(eq(eventMedia.mediaId, mediaId));
      await tx.delete(departmentMedia).where(eq(departmentMedia.mediaId, mediaId));

      await tx
        .update(events)
        .set({ imageMediaId: null })
        .where(eq(events.imageMediaId, mediaId));
      await tx
        .update(events)
        .set({ bannerMediaId: null })
        .where(eq(events.bannerMediaId, mediaId));
      await tx
        .update(departments)
        .set({ bannerMediaId: null })
        .where(eq(departments.bannerMediaId, mediaId));
      await tx
        .update(publications)
        .set({ coverMediaId: null })
        .where(eq(publications.coverMediaId, mediaId));
      await tx
        .update(leaders)
        .set({ photoMediaId: null })
        .where(eq(leaders.photoMediaId, mediaId));
      await tx
        .update(testimonies)
        .set({ photoMediaId: null })
        .where(eq(testimonies.photoMediaId, mediaId));
      await tx
        .update(communityFaces)
        .set({ photoMediaId: null })
        .where(eq(communityFaces.photoMediaId, mediaId));
    });
  }
}
