import { createPolicy } from "./policy-kit";

export interface ResourcePolicyResource {
  id?: string;
}

/**
 * `ResourcePolicy` — Gouverne la gestion des ressources téléchargeables (PDF).
 *
 * Rôles autorisés pour l'administration :
 * Seuls `SUPER_ADMIN` et `ADMIN` (périmètre global de l'église) peuvent créer,
 * modifier ou supprimer des ressources.
 */
export const ResourcePolicy = createPolicy<ResourcePolicyResource>(
  "ResourcePolicy",
  {
    CREATE: {
      roles: ["SUPER_ADMIN", "ADMIN"],
    },

    READ: {
      roles: ["SUPER_ADMIN", "ADMIN", "DEPARTMENT_MANAGER"],
    },

    UPDATE: {
      roles: ["SUPER_ADMIN", "ADMIN"],
    },

    DELETE: {
      roles: ["SUPER_ADMIN", "ADMIN"],
    },
  },
);
