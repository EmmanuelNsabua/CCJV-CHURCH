import type { CommunityFace } from "@/domain/entities";

/**
 * Sérialisation `CommunityFace` → contrat d'API (`IMPLEMENTATION_SPEC.md` §7) :
 * `photo` ← `photoUrl`, `name` ← `personName`, `caption` ← `caption`.
 * `position` est ajouté pour l'ordonnancement depuis le back-office.
 */
export interface CommunityFaceDto {
  id: string;
  /** URL publique du portrait (`photoUrl` côté domaine). */
  photo: string | null;
  name: string;
  caption: string;
  position: number;
}

export function toCommunityFaceDto(face: CommunityFace): CommunityFaceDto {
  return {
    id: face.id,
    photo: face.photoUrl,
    name: face.personName,
    caption: face.caption,
    position: face.position,
  };
}
