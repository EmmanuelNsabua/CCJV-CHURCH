import { randomUUID } from "node:crypto";
import { env } from "@/config/env";
import { logger } from "@/infrastructure/logger";
import { supabaseAdmin } from "./client";
import {
  PayloadTooLargeError,
  UnsupportedMediaTypeError,
  InternalError,
} from "@/shared/errors/app-error";
import {
  ACCEPTED_IMAGE_MIME_TYPES,
  detectImageMimeType,
  extensionForMimeType,
  readImageDimensions,
} from "@/shared/utils/file-signature";

/**
 * Dossiers logiques du bucket. Un préfixe par usage rend le stockage lisible
 * et permet d'appliquer des politiques différentes par la suite
 * (docs/018 §8).
 */
export type StorageFolder =
  | "events"
  | "departments"
  | "publications"
  | "leaders"
  | "testimonies"
  | "community"
  | "pages";

export interface UploadedFile {
  bucket: string;
  path: string;
  publicUrl: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
}

/**
 * Téléversement vers Supabase Storage.
 *
 * Trois garanties de sécurité, appliquées dans cet ordre :
 * 1. **taille** vérifiée avant tout traitement ;
 * 2. **type réel** déduit des octets, jamais de l'extension ni du `Content-Type` ;
 * 3. **nom de fichier généré par le serveur** — aucun nom fourni par le client
 *    n'atteint le Storage, ce qui élimine les traversées de chemin (`../`) et
 *    les collisions.
 */
export class StorageService {
  constructor(private readonly bucket: string = env.SUPABASE_STORAGE_BUCKET) {}

  async upload(
    folder: StorageFolder,
    file: { buffer: Buffer; size: number },
    alt?: string | null,
  ): Promise<UploadedFile & { alt: string | null }> {
    if (file.size > env.MAX_UPLOAD_BYTES) {
      throw new PayloadTooLargeError(env.MAX_UPLOAD_BYTES);
    }
    if (file.buffer.length === 0) {
      throw new UnsupportedMediaTypeError(ACCEPTED_IMAGE_MIME_TYPES);
    }

    const mimeType = detectImageMimeType(file.buffer);
    if (!mimeType) {
      throw new UnsupportedMediaTypeError(ACCEPTED_IMAGE_MIME_TYPES);
    }

    const extension = extensionForMimeType(mimeType);
    const path = `${folder}/${randomUUID()}.${extension}`;

    const { error } = await supabaseAdmin.storage
      .from(this.bucket)
      .upload(path, file.buffer, {
        contentType: mimeType,
        upsert: false,
        cacheControl: "31536000", // 1 an : le nom contient un UUID, immuable.
      });

    if (error) {
      logger.error({ err: error, folder }, "Échec du téléversement Storage");
      throw new InternalError("Le téléversement du fichier a échoué", error);
    }

    const dimensions = readImageDimensions(file.buffer, mimeType);
    const { data } = supabaseAdmin.storage.from(this.bucket).getPublicUrl(path);

    return {
      bucket: this.bucket,
      path,
      publicUrl: data.publicUrl,
      mimeType,
      sizeBytes: file.size,
      width: dimensions?.width ?? null,
      height: dimensions?.height ?? null,
      alt: alt ?? null,
    };
  }

  /**
   * Supprime un fichier. `restrict` est appliqué côté base : un média encore
   * référencé ne peut pas être supprimé (contrainte d'intégrité), sauf
   * contournement explicite décidé par le service appelant.
   */
  async remove(path: string): Promise<void> {
    const { error } = await supabaseAdmin.storage.from(this.bucket).remove([path]);
    if (error) {
      logger.error({ err: error, path }, "Échec de la suppression Storage");
      throw new InternalError("La suppression du fichier a échoué", error);
    }
  }

  getPublicUrl(path: string): string {
    return supabaseAdmin.storage.from(this.bucket).getPublicUrl(path).data.publicUrl;
  }
}

export const storageService = new StorageService();
