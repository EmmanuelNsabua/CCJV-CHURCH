import type { AdminProfile, AdminRole, AdminScope } from "@/domain/entities";
import { env } from "@/config/env";

/**
 * Sérialisation des profils administratifs.
 *
 * Deux représentations :
 *
 * - `AdminProfileDto` : le **profil courant** (`GET /admin/me`) ;
 * - `AdminProfileSummaryDto` : l'entrée de la collection, qui ajoute l'état
 *   d'activation, le scope, le rattachement de département et la date de création.
 *
 * Aucune de ces formes ne porte d'information sensible d'authentification.
 */

export interface AdminProfileDto {
  id: string;
  username: string;
  displayName: string | null;
  role: AdminRole;
  scope?: AdminScope;
  departmentId?: string | null;
  avatarUrl?: string;
}

export interface AdminProfileSummaryDto extends AdminProfileDto {
  isActive: boolean;
  createdAt: string;
  scope: AdminScope;
  departmentId: string | null;
  avatarUrl: string;
  /**
   * Adresse de connexion, lue chez le fournisseur d'identité.
   *
   * `null` quand elle n'a pas pu être résolue (fournisseur muet, ou compte
   * d'authentification absent). Elle est **nécessaire à l'annuaire** : c'est
   * l'identifiant avec lequel on se connecte, et administrer un compte sans
   * savoir par quelle adresse il se connecte n'aurait pas de sens.
   */
  email: string | null;
}

export function toAdminProfileDto(profile: AdminProfile): AdminProfileDto {
  return {
    id: profile.id,
    username: profile.username,
    displayName: profile.displayName,
    role: profile.role,
    scope: profile.scope,
    departmentId: profile.departmentId,
    avatarUrl: `${env.SUPABASE_URL}/storage/v1/object/public/${env.SUPABASE_STORAGE_BUCKET}/avatars/${profile.id}.jpg`,
  };
}

export function toAdminProfileSummaryDto(
  profile: AdminProfile,
  email: string | null = null,
): AdminProfileSummaryDto {
  return {
    ...toAdminProfileDto(profile),
    isActive: profile.isActive,
    createdAt: profile.createdAt.toISOString(),
    email,
    scope: profile.scope,
    departmentId: profile.departmentId,
    avatarUrl: `${env.SUPABASE_URL}/storage/v1/object/public/${env.SUPABASE_STORAGE_BUCKET}/avatars/${profile.id}.jpg`,
  };
}
