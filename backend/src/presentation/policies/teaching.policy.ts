import { allow, deny } from "./authorize";
import { createPolicy } from "./policy-kit";

export interface TeachingPolicyResource {
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
}

/**
 * `TeachingPolicy` — Gouverne la gestion des enseignements (sermons).
 *
 * Rôles autorisés pour l'administration :
 * Seuls `SUPER_ADMIN` et `ADMIN` (périmètre global de l'église) peuvent créer,
 * modifier, publier, archiver ou administrer les enseignements.
 * Les `DEPARTMENT_MANAGER` n'ont pas de gestion implicite sur les enseignements transverses.
 */
export const TeachingPolicy = createPolicy<TeachingPolicyResource>(
  "TeachingPolicy",
  {
    CREATE: {
      roles: ["SUPER_ADMIN", "ADMIN"],
    },

    READ: {
      roles: ["SUPER_ADMIN", "ADMIN", "DEPARTMENT_MANAGER"],
      resource: (admin, resource) => {
        if (admin.role === "SUPER_ADMIN" || admin.role === "ADMIN") {
          return allow();
        }
        // Pour les autres rôles ou le public, seuls les enseignements publiés sont visibles
        if (!resource || resource.status === "PUBLISHED") {
          return allow();
        }
        return deny(
          "Cet enseignement n'est pas publié et requiert des droits d'administration",
        );
      },
    },

    UPDATE: {
      roles: ["SUPER_ADMIN", "ADMIN"],
    },

    PUBLISH: {
      roles: ["SUPER_ADMIN", "ADMIN"],
    },

    ARCHIVE: {
      roles: ["SUPER_ADMIN", "ADMIN"],
    },

    DELETE: {
      roles: ["SUPER_ADMIN", "ADMIN"],
    },
  },
);
