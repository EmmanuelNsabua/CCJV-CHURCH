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
  mustChangePassword?: boolean;
  allowedNavModules?: string[];
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

function formatCapitalizedName(name: string | null | undefined): string | null {
  if (!name) return null;
  const trimmed = name.trim();
  if (trimmed.length === 0) return null;
  return trimmed
    .split(/\s+/)
    .map((word) =>
      word
        .split("-")
        .map((part) => (part.length > 0 ? part.charAt(0).toUpperCase() + part.slice(1) : ""))
        .join("-"),
    )
    .join(" ");
}

export function toAdminProfileDto(
  profile: AdminProfile,
  options?: { mustChangePassword?: boolean },
): AdminProfileDto {
  const isGlobal = profile.scope === "GLOBAL";
  const isSuperAdmin = profile.role === "SUPER_ADMIN";

  const allowedNavModules = [
    "overview",
    "publications",
    "teachings",
    "agenda",
    "media",
    "resources",
  ];

  if (isGlobal) {
    allowedNavModules.push(
      "prayers",
      "testimonies",
      "departments",
      "pages",
      "settings",
      "admins",
    );
    if (isSuperAdmin) {
      allowedNavModules.push("logs");
    }
  }

  const capitalizedDisplayName =
    formatCapitalizedName(profile.displayName) ??
    (profile.username ? profile.username.charAt(0).toUpperCase() + profile.username.slice(1) : null);

  return {
    id: profile.id,
    username: profile.username,
    displayName: capitalizedDisplayName,
    role: profile.role,
    scope: profile.scope,
    departmentId: profile.departmentId,
    avatarUrl: `${env.SUPABASE_URL}/storage/v1/object/public/${env.SUPABASE_STORAGE_BUCKET}/avatars/${profile.id}.jpg`,
    mustChangePassword: options?.mustChangePassword ?? false,
    allowedNavModules,
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
