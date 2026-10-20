import type { Department, DepartmentArchive } from "@/domain/entities";

/**
 * Représentation API d'un département.
 *
 * Elle est calquée **strictement** sur `frontend/src/types/index.ts`
 * (`interface Department`) : mêmes noms de champs, mêmes types. La seule
 * transformation est le passage des URL résolues du domaine (`bannerImageUrl`,
 * `galleryUrls`) aux noms attendus par le frontend (`bannerImage`, `gallery`),
 * conformément au tableau de correspondances de l'IMPLEMENTATION_SPEC §7.
 *
 * Les champs facultatifs sont omis (`undefined`) plutôt qu'émis à `null` : le
 * frontend les teste avec `if (department.bannerImage)`, et l'absence de clé
 * évite de transporter du bruit dans chaque réponse de collection.
 */
export interface DepartmentDto {
  id: string;
  name: string;
  slug: string;
  description?: string;
  mission?: string;
  history?: string;
  responsibleName?: string;
  /** Ex-`bannerImageUrl` : image d'en-tête de la fiche. */
  bannerImage?: string;
  bannerMediaId?: string;
  meetingSchedule?: string;
  keyPoints?: string[];
  /** Ex-`galleryUrls` : galerie photographique réelle. */
  gallery?: string[];
  activities?: {
    id: string;
    title: string;
    description?: string;
    imageMediaId?: string;
    imageUrl?: string;
    position: number;
  }[];
  leaders?: {
    id: string;
    name: string;
    role: string;
    photoUrl?: string;
    photoMediaId?: string;
    position: number;
  }[];
  tagline?: string;
  position?: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Représentation API d'une archive de département.
 *
 * Calquée sur `frontend/src/types` (`DepartmentArchive`) : l'instantané est
 * transmis **tel quel**, sans réécriture des champs qu'il contient — c'est une
 * pièce justificative, la réécrire la rendrait infidèle.
 */
export interface DepartmentArchiveDto {
  id: string;
  originalDepartmentId: string;
  name: string;
  slug: string;
  snapshot: Record<string, unknown>;
  archivedBy?: string | null;
  archivedAt: string;
  reason?: string | null;
}

export function toDepartmentArchiveDto(
  archive: DepartmentArchive,
): DepartmentArchiveDto {
  return {
    id: archive.id,
    originalDepartmentId: archive.originalDepartmentId,
    name: archive.name,
    slug: archive.slug,
    snapshot: archive.snapshot,
    archivedBy: archive.archivedBy,
    archivedAt: archive.archivedAt.toISOString(),
    reason: archive.reason,
  };
}

export function toDepartmentDto(department: Department): DepartmentDto {
  return {
    id: department.id,
    name: department.name,
    slug: department.slug,
    description: department.description ?? undefined,
    mission: department.mission ?? undefined,
    history: department.history ?? undefined,
    responsibleName: department.responsibleName ?? undefined,
    bannerImage: department.bannerImageUrl ?? undefined,
    bannerMediaId: department.bannerMediaId ?? undefined,
    meetingSchedule: department.meetingSchedule ?? undefined,
    keyPoints: department.keyPoints ?? undefined,
    gallery: department.galleryUrls.length > 0 ? department.galleryUrls : undefined,
    activities: department.activities?.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description ?? undefined,
      imageMediaId: a.imageMediaId ?? undefined,
      imageUrl: a.imageUrl ?? undefined,
      position: a.position,
    })),
    leaders: department.leaders?.map((l) => ({
      id: l.id,
      name: l.name,
      role: l.role,
      photoUrl: l.photoUrl ?? undefined,
      photoMediaId: l.photoMediaId ?? undefined,
      position: l.position,
    })),
    tagline: department.tagline ?? undefined,
    position: department.position,
    createdAt: department.createdAt.toISOString(),
    updatedAt: department.updatedAt.toISOString(),
  };
}
