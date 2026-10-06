import type { MediaAsset } from "@/domain/entities";
import type { MediaUsage } from "@/infrastructure/repositories/media.repository";
import type { MediaUsageReport } from "./media.service";

/**
 * Sérialisation d'un média pour le back-office.
 *
 * Aucun champ interne n'est exposé : ni clé, ni jeton. Le fichier est décrit
 * par son URL publique et ses métadonnées utiles (dimensions, poids, texte
 * alternatif requis pour l'accessibilité).
 */
export interface MediaDto {
  id: string;
  /** URL publique du fichier (`publicUrl` côté domaine). */
  url: string;
  bucket: string;
  /** Chemin interne au bucket, généré par le serveur. */
  path: string;
  /** Premier segment du chemin (`events`, `leaders`…), ou `null`. */
  folder: string | null;
  /** Type MIME déduit des octets du fichier, jamais de l'en-tête client. */
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  alt: string | null;
  uploadedBy: string | null;
  createdAt: string;
}

/** Où un média est utilisé : une entrée par emplacement référençant. */
export interface MediaUsageDto {
  source: string;
  label: string;
  count: number;
}

export interface MediaUsageReportDto {
  media: MediaDto;
  total: number;
  /** Uniquement les emplacements qui référencent réellement ce média. */
  usages: MediaUsageDto[];
}

function folderOf(path: string): string | null {
  const index = path.indexOf("/");
  return index === -1 ? null : path.slice(0, index);
}

export function toMediaDto(asset: MediaAsset): MediaDto {
  return {
    id: asset.id,
    url: asset.publicUrl,
    bucket: asset.bucket,
    path: asset.path,
    folder: folderOf(asset.path),
    mimeType: asset.mimeType,
    sizeBytes: asset.sizeBytes,
    width: asset.width,
    height: asset.height,
    alt: asset.alt,
    uploadedBy: asset.uploadedBy,
    createdAt: asset.createdAt.toISOString(),
  };
}

export function toMediaUsageDto(usage: MediaUsage): MediaUsageDto {
  return { source: usage.source, label: usage.label, count: usage.count };
}

export function toMediaUsageReportDto(report: MediaUsageReport): MediaUsageReportDto {
  return {
    media: toMediaDto(report.media),
    total: report.total,
    usages: report.usages.map(toMediaUsageDto),
  };
}
