import type { Leader } from "@/domain/entities";

/**
 * Sérialisation `Leader` → contrat d'API (`IMPLEMENTATION_SPEC.md` §7).
 *
 * Le frontend attend `photo` : la source domaine est `photoUrl`, déjà résolue
 * par le repository. `departmentId` et `position` sont ajoutés en plus du
 * contrat public — ils sont nécessaires au back-office pour réafficher et
 * réordonner les responsables sans requête supplémentaire.
 */
export interface LeaderDto {
  id: string;
  name: string;
  role: string;
  /** URL publique du portrait (`photoUrl` côté domaine). */
  photo: string | null;
  photoMediaId: string | null;
  departmentId: string | null;
  position: number;
}

export function toLeaderDto(leader: Leader): LeaderDto {
  return {
    id: leader.id,
    name: leader.name,
    role: leader.role,
    photo: leader.photoUrl,
    photoMediaId: leader.photoMediaId,
    departmentId: leader.departmentId,
    position: leader.position,
  };
}
