import type { AdminProfile, AdminRole } from "@/domain/entities";

/**
 * Sérialisation des profils administratifs.
 *
 * Deux représentations :
 *
 * - `AdminProfileDto` : le **profil courant** (`GET /admin/me`), strictement
 *   les quatre champs du contrat — identifiant, nom d'utilisateur, nom
 *   d'affichage, rôle ;
 * - `AdminProfileSummaryDto` : l'entrée de la collection, qui ajoute l'état
 *   d'activation et la date de création, utiles pour administrer les accès.
 *
 * Aucune de ces formes ne porte d'information d'authentification : ni jeton,
 * ni secret, ni adresse e-mail d'authentification. Le mot de passe n'existe
 * d'ailleurs pas dans le domaine (il reste chez Supabase Auth).
 */

export interface AdminProfileDto {
  id: string;
  username: string;
  displayName: string | null;
  role: AdminRole;
}

export interface AdminProfileSummaryDto extends AdminProfileDto {
  isActive: boolean;
  createdAt: string;
}

export function toAdminProfileDto(profile: AdminProfile): AdminProfileDto {
  return {
    id: profile.id,
    username: profile.username,
    displayName: profile.displayName,
    role: profile.role,
  };
}

export function toAdminProfileSummaryDto(
  profile: AdminProfile,
): AdminProfileSummaryDto {
  return {
    ...toAdminProfileDto(profile),
    isActive: profile.isActive,
    createdAt: profile.createdAt.toISOString(),
  };
}
