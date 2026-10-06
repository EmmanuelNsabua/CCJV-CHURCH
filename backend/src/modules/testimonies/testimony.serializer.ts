import type { Testimony } from "@/domain/entities";

/**
 * Sérialisation `Testimony` → contrat d'API (`IMPLEMENTATION_SPEC.md` §7) :
 * `photo` ← `photoUrl`, `name` ← `personName`, `role` ← `personRole`.
 * `position` est ajouté pour l'ordonnancement depuis le back-office.
 */
export interface TestimonyDto {
  id: string;
  /** URL publique du portrait (`photoUrl` côté domaine). */
  photo: string | null;
  quote: string;
  name: string;
  role: string | null;
  position: number;
}

export function toTestimonyDto(testimony: Testimony): TestimonyDto {
  return {
    id: testimony.id,
    photo: testimony.photoUrl,
    quote: testimony.quote,
    name: testimony.personName,
    role: testimony.personRole,
    position: testimony.position,
  };
}
