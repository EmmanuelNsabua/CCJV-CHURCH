import type { MediaAsset } from "@/domain/entities";
import type { ListOptions, ListResult } from "@/domain/repositories";
import { logger } from "@/infrastructure/logger";
import type {
  MediaReferenceRepository,
  MediaUsage,
} from "@/infrastructure/repositories/media.repository";
import type { StorageFolder, StorageService } from "@/infrastructure/supabase/storage";
import { ConflictError, NotFoundError } from "@/shared/errors/app-error";

/**
 * Règles métier des médias.
 *
 * Trois garanties, dans cet ordre :
 * 1. le fichier est **téléversé** vers Supabase Storage — c'est `StorageService`
 *    qui borne la taille, déduit le type MIME des octets et génère le nom ;
 * 2. la ligne `media` est **insérée ensuite** ;
 * 3. si l'insertion échoue, le fichier est **supprimé** (compensation) : jamais
 *    d'orphelin dans le bucket.
 *
 * En suppression, l'ordre est inverse : les références sont détachées et la
 * ligne supprimée **avant** le fichier, pour qu'un échec ne laisse jamais une
 * page pointant vers une image absente.
 */

export interface UploadMediaCommand {
  folder: StorageFolder;
  buffer: Buffer;
  /** Taille annoncée par multer ; revérifiée par `StorageService`. */
  size: number;
  alt: string | null;
  uploadedBy: string | null;
}

export interface MediaUsageReport {
  media: MediaAsset;
  /** Total des références, toutes sources confondues. */
  total: number;
  /** Emplacements référençant réellement le média. */
  usages: MediaUsage[];
}

function countTotal(usages: readonly MediaUsage[]): number {
  return usages.reduce((total, usage) => total + usage.count, 0);
}

function notFound(id: string): NotFoundError {
  return new NotFoundError("MEDIA_NOT_FOUND", "Média introuvable", { id });
}

export class MediaService {
  constructor(
    private readonly media: MediaReferenceRepository,
    private readonly storage: StorageService,
  ) {}

  list(options: ListOptions): Promise<ListResult<MediaAsset>> {
    return this.media.list(options);
  }

  async get(id: string): Promise<MediaAsset> {
    const asset = await this.media.findById(id);
    if (!asset) {
      throw notFound(id);
    }
    return asset;
  }

  /** Où ce média est-il utilisé ? (une seule requête de comptage) */
  async usage(id: string): Promise<MediaUsageReport> {
    const media = await this.get(id);
    const usages = await this.media.listUsages(id);

    return {
      media,
      total: countTotal(usages),
      usages: usages.filter((usage) => usage.count > 0),
    };
  }

  async upload(command: UploadMediaCommand): Promise<MediaAsset> {
    const uploaded = await this.storage.upload(
      command.folder,
      { buffer: command.buffer, size: command.size },
      command.alt,
    );

    try {
      return await this.media.create({
        bucket: uploaded.bucket,
        path: uploaded.path,
        publicUrl: uploaded.publicUrl,
        mimeType: uploaded.mimeType,
        sizeBytes: uploaded.sizeBytes,
        width: uploaded.width,
        height: uploaded.height,
        alt: uploaded.alt,
        uploadedBy: command.uploadedBy,
      });
    } catch (error) {
      await this.compensate(uploaded.path, error);
      throw error;
    }
  }

  /**
   * Suppression d'un média.
   *
   * Refusée par défaut si le fichier est encore référencé (`CONFLICT` avec le
   * détail des usages) ; `force=true` détache d'abord les références.
   */
  async remove(id: string, force: boolean): Promise<void> {
    const asset = await this.get(id);
    const usages = await this.media.listUsages(id);
    const total = countTotal(usages);

    if (total > 0 && !force) {
      throw new ConflictError(
        "CONFLICT",
        "Ce média est encore utilisé : retirez-le des contenus concernés, ou forcez la suppression",
        { total, usages: usages.filter((usage) => usage.count > 0) },
      );
    }

    if (total > 0) {
      logger.warn(
        { mediaId: id, path: asset.path, total },
        "Suppression forcée d'un média référencé : les références sont détachées",
      );
      await this.media.clearReferences(id);
    }

    const removed = await this.media.remove(id);
    if (!removed) {
      throw notFound(id);
    }

    await this.storage.remove(asset.path);
  }

  /**
   * Compensation : la ligne `media` n'a pas été créée, le fichier ne doit pas
   * rester. Un échec de compensation est journalisé — il est préférable de
   * perdre un raisonnement de propreté que de masquer l'erreur d'origine.
   */
  private async compensate(path: string, cause: unknown): Promise<void> {
    try {
      await this.storage.remove(path);
    } catch (error) {
      logger.error(
        { err: error, cause, path },
        "Compensation impossible : le fichier téléversé reste orphelin dans le Storage",
      );
    }
  }
}
