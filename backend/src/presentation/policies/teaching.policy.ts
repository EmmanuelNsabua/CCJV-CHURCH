import { allow, deny } from "./authorize";
import { createPolicy } from "./policy-kit";

export interface TeachingPolicyResource {
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  scope?: "CCJV" | "ECODIM";
  departmentId?: string | null;
}

/**
 * `TeachingPolicy` — Gouverne la gestion des enseignements (sermons).
 *
 * Rôles et périmètres :
 * - `SUPER_ADMIN` et `ADMIN` ont une portée globale : création, modification, publication et suppression
 *   sur tous les enseignements (CCJV général et Ecodim).
 * - `DEPARTMENT_MANAGER` (notamment Ecodim) peut gérer les enseignements de son périmètre (`scope: "ECODIM"`
 *   ou rattachés à son `departmentId`), sans pouvoir modifier ou dépublier les enseignements généraux du CCJV
 *   ou ceux d'autres départements.
 */
export const TeachingPolicy = createPolicy<TeachingPolicyResource>(
  "TeachingPolicy",
  {
    CREATE: {
      roles: ["SUPER_ADMIN", "ADMIN", "DEPARTMENT_MANAGER"],
      resource: (admin, resource) => {
        if (admin.role === "SUPER_ADMIN" || admin.role === "ADMIN") {
          return allow();
        }
        if (admin.role === "DEPARTMENT_MANAGER") {
          if (
            resource?.scope === "CCJV" ||
            (resource?.departmentId && resource.departmentId !== admin.departmentId)
          ) {
            return deny(
              "Un responsable départemental ne peut créer d'enseignements que dans son périmètre (Ecodim)",
            );
          }
          return allow();
        }
        return deny("Action non autorisée pour ce rôle");
      },
    },

    READ: {
      roles: ["SUPER_ADMIN", "ADMIN", "DEPARTMENT_MANAGER"],
      resource: (admin, resource) => {
        if (admin.role === "SUPER_ADMIN" || admin.role === "ADMIN") {
          return allow();
        }
        if (admin.role === "DEPARTMENT_MANAGER") {
          if (
            !resource ||
            resource.status === "PUBLISHED" ||
            resource.scope === "ECODIM" ||
            (resource.departmentId && resource.departmentId === admin.departmentId)
          ) {
            return allow();
          }
          return deny(
            "Cet enseignement non publié requiert des droits sur le périmètre général",
          );
        }
        if (!resource || resource.status === "PUBLISHED") {
          return allow();
        }
        return deny(
          "Cet enseignement n'est pas publié et requiert des droits d'administration",
        );
      },
    },

    UPDATE: {
      roles: ["SUPER_ADMIN", "ADMIN", "DEPARTMENT_MANAGER"],
      resource: (admin, resource) => {
        if (admin.role === "SUPER_ADMIN" || admin.role === "ADMIN") {
          return allow();
        }
        if (admin.role === "DEPARTMENT_MANAGER") {
          if (
            resource &&
            (resource.scope === "ECODIM" ||
              (resource.departmentId && resource.departmentId === admin.departmentId))
          ) {
            return allow();
          }
          return deny(
            "Ce contenu relève du site général CCJV et ne peut pas être modifié par un responsable départemental",
          );
        }
        return deny("Action non autorisée");
      },
    },

    PUBLISH: {
      roles: ["SUPER_ADMIN", "ADMIN", "DEPARTMENT_MANAGER"],
      resource: (admin, resource) => {
        if (admin.role === "SUPER_ADMIN" || admin.role === "ADMIN") {
          return allow();
        }
        if (admin.role === "DEPARTMENT_MANAGER") {
          if (
            resource &&
            (resource.scope === "ECODIM" ||
              (resource.departmentId && resource.departmentId === admin.departmentId))
          ) {
            return allow();
          }
          return deny(
            "Ce contenu relève du site général CCJV et ne peut pas être publié par un responsable départemental",
          );
        }
        return deny("Action non autorisée");
      },
    },

    ARCHIVE: {
      roles: ["SUPER_ADMIN", "ADMIN", "DEPARTMENT_MANAGER"],
      resource: (admin, resource) => {
        if (admin.role === "SUPER_ADMIN" || admin.role === "ADMIN") {
          return allow();
        }
        if (admin.role === "DEPARTMENT_MANAGER") {
          if (
            resource &&
            (resource.scope === "ECODIM" ||
              (resource.departmentId && resource.departmentId === admin.departmentId))
          ) {
            return allow();
          }
          return deny("Action réservée au périmètre attribué");
        }
        return deny("Action non autorisée");
      },
    },

    DELETE: {
      roles: ["SUPER_ADMIN", "ADMIN", "DEPARTMENT_MANAGER"],
      resource: (admin, resource) => {
        if (admin.role === "SUPER_ADMIN" || admin.role === "ADMIN") {
          return allow();
        }
        if (admin.role === "DEPARTMENT_MANAGER") {
          if (
            resource &&
            (resource.scope === "ECODIM" ||
              (resource.departmentId && resource.departmentId === admin.departmentId))
          ) {
            return allow();
          }
          return deny("Action réservée au périmètre attribué");
        }
        return deny("Action non autorisée");
      },
    },
  },
);
