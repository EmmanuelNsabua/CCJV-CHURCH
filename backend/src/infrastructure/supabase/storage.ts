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
  ACCEPTED_DOCUMENT_MIME_TYPES,
  ACCEPTED_IMAGE_MIME_TYPES,
  ACCEPTED_VIDEO_MIME_TYPES,
  ACCEPTED_AUDIO_MIME_TYPES,
  detectDocumentMimeType,
  detectImageMimeType,
  detectVideoMimeType,
  detectAudioMimeType,
  extensionForMimeType,
  isImageMimeType,
  isVideoMimeType,
  isAudioMimeType,
  readImageDimensions,
  type AcceptedUploadMimeType,
} from "@/shared/utils/file-signature";

/**
 * Dossiers logiques du bucket. Un préfixe par usage rend le stockage lisible
 * et permet d'appliquer des politiques différentes par la suite
 * (docs/018 §8).
 *
 * `resources` accueille les documents PDF (bulletins, brochures, guides).
 * `pages`, `publications` et `testimonies` accueillent la médiathèque multimédia (images, vidéos, audios).
 * Les autres dossiers restent réservés aux photos éditoriales (bannières, trombinoscopes).
 */
export type StorageFolder =
  | "events"
  | "departments"
  | "publications"
  | "leaders"
  | "testimonies"
  | "community"
  | "pages"
  | "resources";

const ALL_MEDIA_TYPES: readonly AcceptedUploadMimeType[] = [
  ...ACCEPTED_IMAGE_MIME_TYPES,
  ...ACCEPTED_VIDEO_MIME_TYPES,
  ...ACCEPTED_AUDIO_MIME_TYPES,
];

/**
 * Types acceptés **par dossier**.
 *
 * La règle dépend de la destination, jamais du client : un PDF déposé dans
 * `events` est refusé (le site y attend une photo), et une photo déposée dans
 * `resources` aussi (la fiche ressource promet un document téléchargeable).
 * Déclarer cette table ici — et non dans la couche HTTP — garantit qu'aucune
 * route ne peut téléverser un type que le dossier n'autorise pas.
 */
const ACCEPTED_TYPES_BY_FOLDER: Record<
  StorageFolder,
  readonly AcceptedUploadMimeType[]
> = {
  events: ACCEPTED_IMAGE_MIME_TYPES,
  departments: ACCEPTED_IMAGE_MIME_TYPES,
  publications: ALL_MEDIA_TYPES,
  leaders: ACCEPTED_IMAGE_MIME_TYPES,
  testimonies: ALL_MEDIA_TYPES,
  community: ACCEPTED_IMAGE_MIME_TYPES,
  pages: ALL_MEDIA_TYPES,
  resources: ACCEPTED_DOCUMENT_MIME_TYPES,
};

/**
 * Types réellement acceptés pour un dossier, pour les messages d'erreur.
 *
 * Exporté afin que la couche HTTP puisse annoncer `415` avec la liste **du
 * dossier visé** plutôt qu'une liste d'images sans rapport avec le document
 * refusé.
 */
export function acceptedMimeTypesFor(folder: StorageFolder): readonly string[] {
  return ACCEPTED_TYPES_BY_FOLDER[folder];
}

/**
 * Type réel du fichier, limité à ce que le dossier accepte.
 *
 * Les détections sont tentées puis confrontées à la liste du dossier :
 * un contenu qui n'est ni image, ni vidéo, ni audio, ni document reconnu,
 * ou qui ne correspond pas au dossier visé, donne `null` — jamais un type « par défaut ».
 */
function detectAcceptedMimeType(
  buffer: Buffer,
  accepted: readonly AcceptedUploadMimeType[],
): AcceptedUploadMimeType | null {
  const imageType = detectImageMimeType(buffer);
  if (imageType !== null && accepted.includes(imageType)) return imageType;

  const videoType = detectVideoMimeType(buffer);
  if (videoType !== null && accepted.includes(videoType)) return videoType;

  const audioType = detectAudioMimeType(buffer);
  if (audioType !== null && accepted.includes(audioType)) return audioType;

  const documentType = detectDocumentMimeType(buffer);
  if (documentType !== null && accepted.includes(documentType)) {
    return documentType;
  }

  return null;
}

/**
 * Plafond propre aux **images**, en octets (5 Mo).
 *
 * `MAX_UPLOAD_BYTES` est la borne mémoire absolue du serveur ; ce plafond-ci est une
 * règle éditoriale : une photo d'événement de plus de 5 Mo alourdit les pages
 * publiques sans rien apporter à l'écran.
 */
export const IMAGE_MAX_BYTES = 5_242_880;

/** Plafond propre aux fichiers **audio** (100 Mo pour les longs enregistrements). */
export const AUDIO_MAX_BYTES = 104_857_600;

/** Plafond propre aux fichiers **vidéo** (300 Mo pour les enseignements et cultes vidéo). */
export const VIDEO_MAX_BYTES = 314_572_800;

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
    const accepted = acceptedMimeTypesFor(folder);

    if (file.buffer.length === 0) {
      throw new UnsupportedMediaTypeError(accepted);
    }

    const mimeType = detectAcceptedMimeType(file.buffer, ACCEPTED_TYPES_BY_FOLDER[folder]);
    if (!mimeType) {
      throw new UnsupportedMediaTypeError(accepted);
    }

    // Plafond adapté selon la nature du média détecté
    let maxBytes: number;
    if (isImageMimeType(mimeType)) {
      maxBytes = Math.min(env.MAX_UPLOAD_BYTES, IMAGE_MAX_BYTES);
    } else if (isAudioMimeType(mimeType)) {
      maxBytes = Math.min(env.MAX_UPLOAD_BYTES, AUDIO_MAX_BYTES);
    } else if (isVideoMimeType(mimeType)) {
      maxBytes = Math.min(env.MAX_UPLOAD_BYTES, VIDEO_MAX_BYTES);
    } else {
      // Document (PDF)
      maxBytes = env.MAX_UPLOAD_BYTES;
    }

    if (file.size > maxBytes) {
      throw new PayloadTooLargeError(maxBytes);
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

    // Les dimensions ne concernent que les images : un PDF n'en a pas, et
    // annoncer `0 × 0` ferait croire à une mesure ratée.
    const dimensions = isImageMimeType(mimeType)
      ? readImageDimensions(file.buffer, mimeType)
      : null;

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
