import { allow, deny } from "./authorize";
import { createPolicy, type DepartmentScopedResource } from "./policy-kit";

export interface ResourcePolicyResource extends DepartmentScopedResource {
  id?: string;
  departmentId: string | null;
}

/**
 * `ResourcePolicy` — Gouverne la gestion des ressources documentaires.
 *
 * Rôles autorisés pour l'administration :
 * - `SUPER_ADMIN` et `ADMIN` : périmètre global (tous départements).
 * - `DEPARTMENT_MANAGER` : périmètre borné à son propre département.
 */
export const ResourcePolicy = createPolicy<ResourcePolicyResource>(
  "ResourcePolicy",
  {
    CREATE: {
      roles: ["SUPER_ADMIN", "ADMIN", "DEPARTMENT_MANAGER"],
      resource: (admin, resource) => {
        if (admin.role === "SUPER_ADMIN" || admin.role === "ADMIN") {
          return allow();
        }
        if (admin.role === "DEPARTMENT_MANAGER") {
          if (
            resource?.departmentId &&
            admin.departmentId &&
            resource.departmentId !== admin.departmentId
          ) {
            return deny(
              "Un responsable départemental ne peut créer de ressources que pour son propre département",
            );
          }
          return allow();
        }
        return deny("Action non autorisée pour ce rôle");
      },
    },

    READ: {
      roles: ["SUPER_ADMIN", "ADMIN", "DEPARTMENT_MANAGER"],
      department: "declared",
    },

    UPDATE: {
      roles: ["SUPER_ADMIN", "ADMIN", "DEPARTMENT_MANAGER"],
      resource: (admin, resource) => {
        if (admin.role === "SUPER_ADMIN" || admin.role === "ADMIN") {
          return allow();
        }
        if (admin.role === "DEPARTMENT_MANAGER") {
          if (
            resource?.departmentId &&
            admin.departmentId &&
            resource.departmentId !== admin.departmentId
          ) {
            return deny(
              "Un responsable départemental ne peut modifier que les ressources de son propre département",
            );
          }
          return allow();
        }
        return deny("Action non autorisée pour ce rôle");
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
            resource?.departmentId &&
            admin.departmentId &&
            resource.departmentId !== admin.departmentId
          ) {
            return deny(
              "Un responsable départemental ne peut supprimer que les ressources de son propre département",
            );
          }
          return allow();
        }
        return deny("Action non autorisée pour ce rôle");
      },
    },
  },
);
