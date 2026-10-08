import type { AdminProfile } from "@/domain/entities";
import {
  DEPARTMENT_CAPABILITIES,
  type DepartmentCapability,
  type EventVisibilityScope,
} from "@/domain/departments/capabilities";
import { allow, deny, type AuthorizationDecision } from "./authorize";
import { createPolicy, type DepartmentScopedResource } from "./policy-kit";

/**
 * `EventPolicy` — P-03 de `docs/029` §4.1.
 *
 * **Deux notions que le langage courant confond, et que D-26 sépare.**
 *
 * - `department_id` : **qui est responsable** de l'événement. `NOT NULL` —
 *   « aucun événement sans département responsable » (XD-15). Le cas
 *   `department_id = NULL` **n'existe pas**, ni en base (`docs/032` §3.3) ni
 *   ici.
 * - `visibilityScope` : **qui est concerné** — un département, ou toute
 *   l'église.
 *
 * **Il n'existe pas d'« événement global ».** C'est la conclusion à laquelle
 * conduit D-25 : un événement est *toujours* porté par un département ; ce qui
 * peut être global, c'est sa **portée publique**, et elle est décidée par une
 * **capacité du département** — jamais par son nom. Le code interdit est cité
 * littéralement par `docs/028` D-25 :
 *
 * ```ts
 * if (department.code === "PRESSE") { … }   // ❌
 * ```
 *
 * La conséquence pratique de D-25 est qu'**aucun département n'est nommé** dans
 * ce fichier : un autre département peut recevoir `EVENT_SCOPE_GLOBAL` sans
 * qu'une ligne de code change. Un test de non-régression
 * (`tests/unit/policies.test.ts`) compare la source de la couche d'autorisation
 * à la liste des noms de départements en base : la capacité est une donnée, et
 * une donnée ne s'écrit pas en dur.
 *
 * **La règle est vérifiée deux fois.** `docs/032` §3.6 pose un trigger
 * PostgreSQL qui refuse `visibility_scope = 'GLOBAL'` sur un département sans la
 * capacité. Ce n'est pas une redondance inutile : une policy protège l'API, un
 * trigger protège la **donnée** — y compris contre un script d'administration ou
 * une écriture directe. L'une des deux couches serait franchie sans l'autre.
 */

/** Vue d'un événement telle que la policy a besoin de la connaître. */
export interface EventPolicyResource extends DepartmentScopedResource {
  visibilityScope: EventVisibilityScope;
  /**
   * Capacités du **département de rattachement de l'acteur**, résolues par le
   * service depuis `department_capabilities`.
   *
   * Les faire porter par la ressource, et non les charger ici, garde la policy
   * **pure** : c'est ce qui permet de tester « un département sans capacité ne
   * peut pas publier globalement » en une ligne, sans base ni double.
   */
  actorDepartmentCapabilities?: readonly DepartmentCapability[];
}

export const EventPolicy = createPolicy<EventPolicyResource>("EventPolicy", {
  /**
   * `canCreate` — `SUPER_ADMIN` · `ADMIN` · `MANAGER`, **département
   * obligatoire** (D-26, XD-15).
   *
   * Le mode `"declared"` porte ici une exigence plus forte que pour une
   * publication : `assertDepartmentRequired` ci-dessous est le pendant
   * exécutable de XD-15, et la colonne est `NOT NULL` en base. « Un autre
   * département que le sien » est refusé comme partout ailleurs — la cible est
   * jugée dès qu'elle est déclarée.
   *
   * `028/Q-EV2` (« un responsable peut-il créer un événement pour un autre
   * département ? ») reste **ouverte** : le refus par défaut s'applique donc, et
   * c'est l'égalité départementale qui décide.
   */
  CREATE: {
    roles: ["SUPER_ADMIN", "ADMIN", "DEPARTMENT_MANAGER"],
    department: "declared",
    pending: "docs/028 Q-EV2 (création pour un autre département)",
    resource: refuseGlobalWithoutCapability,
  },

  /**
   * `canRead` — `SUPER_ADMIN` · `ADMIN` · `MANAGER`, portée départementale
   * (Q-04, `028/Q-EV3` ouvertes).
   *
   * La lecture de collection d'un responsable est bornée en requête par
   * `listScope` : la question ouverte ne peut pas devenir une fuite
   * inter-départements.
   */
  READ: {
    roles: ["SUPER_ADMIN", "ADMIN", "DEPARTMENT_MANAGER"],
    department: "declared",
    pending: "docs/029 Q-04 · docs/028 Q-EV3",
  },

  /**
   * `canUpdate` — égalité départementale (D-26).
   *
   * `department_id` **ne se réaffecte pas** par cette action : changer le
   * département responsable d'un événement public en changerait l'auteur. Aucune
   * décision ne l'autorise, et la policy ne l'ouvre donc pas — le service de
   * mise à jour n'expose pas ce champ.
   */
  UPDATE: {
    roles: ["SUPER_ADMIN", "ADMIN", "DEPARTMENT_MANAGER"],
    department: "equality",
    resource: refuseGlobalWithoutCapability,
  },

  /**
   * `canDelete` — `SUPER_ADMIN` · `ADMIN` ; **`MANAGER` : Q-08**, non tranchée
   * → refus (défaut `✘`, `docs/029` §4.3).
   *
   * Noter l'asymétrie avec `PublicationPolicy.canDelete`, qui suit la même
   * règle : ce n'est pas une incohérence mais la trace d'une question ouverte
   * commune, signalée séparément pour que l'arbitrage puisse les traiter
   * ensemble ou séparément.
   */
  DELETE: {
    roles: ["SUPER_ADMIN", "ADMIN"],
    department: "equality",
    pending: "docs/029 Q-08 (suppression d'événement par un responsable)",
  },

  /**
   * `canSetVisibilityScope` — **dérivé de la capacité du département** (D-25,
   * D-26), et non du rôle.
   *
   * `ADMIN` et `SUPER_ADMIN` peuvent tout porter : leur périmètre est global, la
   * portée publique d'un événement n'est donc pas contrainte pour eux. Un
   * `DEPARTMENT_MANAGER` ne peut fixer `GLOBAL` que si **son** département porte
   * la capacité — la règle est la même que pour les actions précédentes, écrite
   * une fois dans `refuseGlobalWithoutCapability`.
   */
  SET_VISIBILITY_SCOPE: {
    roles: ["SUPER_ADMIN", "ADMIN", "DEPARTMENT_MANAGER"],
    department: "equality",
    pending: "docs/029 Q-06 (qui édite les capacités)",
    resource: refuseGlobalWithoutCapability,
  },
});

/**
 * Publier à portée **globale** exige la capacité du département (D-25).
 *
 * La fonction lit une **capacité**, jamais un nom, jamais un `slug`. C'est la
 * différence entre une règle qui se lit en base et une règle qui se lit dans le
 * code — et c'est exactement ce que D-25 a arbitré.
 *
 * Un acteur dont le scope est global (`ADMIN`, `SUPER_ADMIN`) n'est pas
 * concerné : la notion de capacité de département n'a de sens que pour un
 * département.
 */
function refuseGlobalWithoutCapability(
  admin: AdminProfile,
  resource: EventPolicyResource | undefined,
): AuthorizationDecision {
  if (admin.scope !== "DEPARTMENT") return allow();
  if (resource?.visibilityScope !== "GLOBAL") return allow();

  const capabilities = resource.actorDepartmentCapabilities ?? [];
  if (!capabilities.includes(DEPARTMENT_CAPABILITIES.EVENT_SCOPE_GLOBAL)) {
    return deny(
      "Portée GLOBAL demandée par un département qui ne porte pas la capacité EVENT_SCOPE_GLOBAL (docs/028 D-25 : la règle vient de la capacité, jamais du nom du département)",
    );
  }

  return allow();
}

/**
 * Exige un département **responsable** (D-26, XD-15).
 *
 * `Event.department_id` est `NOT NULL` : la fonction est le pendant applicatif
 * de la contrainte de base, appelée à la création avant l'écriture. Elle existe
 * séparément parce que `docs/029` §4.1 l'inscrit comme membre de la policy
 * (`assertDepartmentRequired`) : la règle doit être **visible** dans la couche
 * d'autorisation, et non enfouie dans un `NOT NULL` que personne ne lit.
 */
export function assertDepartmentRequired(candidate: { departmentId?: string | null }): void {
  if (!candidate.departmentId) {
    throw new Error(
      "Un événement doit porter un département responsable : department_id = NULL n'existe pas (docs/028 D-26, XD-15)",
    );
  }
}
