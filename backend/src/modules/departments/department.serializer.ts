import type { Department } from "@/domain/entities";

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
  responsibleName?: string;
  /** Ex-`bannerImageUrl` : image d'en-tête de la fiche. */
  bannerImage?: string;
  meetingSchedule?: string;
  keyPoints?: string[];
  /** Ex-`galleryUrls` : galerie photographique réelle. */
  gallery?: string[];
  tagline?: string;
}

export function toDepartmentDto(department: Department): DepartmentDto {
  return {
    id: department.id,
    name: department.name,
    slug: department.slug,
    description: department.description ?? undefined,
    responsibleName: department.responsibleName ?? undefined,
    bannerImage: department.bannerImageUrl ?? undefined,
    meetingSchedule: department.meetingSchedule ?? undefined,
    keyPoints: department.keyPoints ?? undefined,
    gallery: department.galleryUrls.length > 0 ? department.galleryUrls : undefined,
    tagline: department.tagline ?? undefined,
  };
}
