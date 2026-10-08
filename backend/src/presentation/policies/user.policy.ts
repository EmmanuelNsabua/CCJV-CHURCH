import type { AdminRole, AdminScope, PersistedAdminRole } from "@/domain/entities";
import { allow, deny, type AuthorizationDecision } from "./authorize";
import { createPolicy } from "./policy-kit";

/**
 * `UserPolicy` — P-07 de `docs/029` §4.1.
 *
 * ### La hiérarchie qui n'en est pas une
 *
 * Il serait tentant de lire « `SUPER_ADMIN` > `ADMIN` > `DEPARTMENT_MANAGER` »
 * et d'écrire un ordinal. `docs/028` D-04 l'interdit, et la règle X1 **modifiée**
 * dit pourquoi : « l'`ADMIN` n'est pas *inférieur*, il est **différent** ». Les
 * deux rôles ne sont pas deux niveaux d'un même pouvoir, ce sont deux pouvoirs
 * disjoints :
 *
 * | | `SUPER_ADMIN` | `ADMIN` |
 * | --- | --- | --- |
 * | Créer un `SUPER_ADMIN` | ✅ | ❌ (D-03, D-04) |
 * | Créer un `ADMIN` | ✅ | ❌ (D-03) |
 * | Créer un responsable | ✅ | ✅ (D-04) |
 * | Lire les demandes de prière | ❌ **jamais** (D-10) | ✅ |
 *
 * La dernière ligne est décisive : aucun ordinal ne peut produire ce tableau.
 * C'est pourquoi chaque création est une **action distincte** —
 * `CREATE_SUPER_ADMIN`, `CREATE_ADMIN`, `CREATE` — plutôt qu'une action
 * `CREATE` paramétrée par un rôle cible. Une action unique obligerait la policy
 * à comparer des rôles entre eux, exactement ce que D-04 refuse.
 *
 * ### L'exclusion XD-03
 *
 * `docs/028` D-04 : « L'`ADMIN` ne peut **pas** administrer un compte
 * `SUPER_ADMIN` (ni le créer, ni le modifier, ni le désactiver) » — c'est XD-03.
 * Elle est portée par le paramètre d'exclusion du moteur, donc évaluée **avant**
 * la table : elle reste vraie pour toute action, y compris celles qu'on
 * ajouterait plus tard. Un `ADMIN` ne peut pas devenir `SUPER_ADMIN` par une
 * action qu'on aurait oublié de fermer.
 */

/** Vue d'un profil **cible** telle que la policy a besoin de la connaître. */
export interface UserPolicyResource {
  id: string;
  role: AdminRole;
  scope: AdminScope;
  departmentId: string | null;
}

export const UserPolicy = createPolicy<UserPolicyResource>(
  "UserPolicy",
  {
    /**
     * `canCreateSuperAdmin` — `SUPER_ADMIN` **uniquement** (D-03, D-04).
     *
     * Le compte d'administration suprême ne se fabrique pas depuis un compte
     * d'administration ordinaire. C'est la seule opération du catalogue dont
     * l'exercice crée un pouvoir que l'auteur ne possédait pas.
     */
    CREATE_SUPER_ADMIN: {
      roles: ["SUPER_ADMIN"],
      scopes: ["GLOBAL"],
      /**
       * La cible d'une création est un profil **à naître** : sa cohérence
       * rôle ↔ scope ↔ département est vérifiée ici, en amont de la base — où
       * `admin_profiles_scope_coherence` la refuserait de toute façon
       * (`docs/032` §3.1). Vérifier deux fois est délibéré : l'erreur remontée
       * par la base est une `500`, celle-ci est un refus lisible.
       */
      resource: (_, resource) => assertCoherentProfile(resource, "SUPER_ADMIN"),
    },

    /** `canCreateAdmin` — `SUPER_ADMIN` **uniquement** (D-03). */
    CREATE_ADMIN: {
      roles: ["SUPER_ADMIN"],
      scopes: ["GLOBAL"],
      resource: (_, resource) => assertCoherentProfile(resource, "ADMIN"),
    },

    /**
     * `canCreateManager` — `SUPER_ADMIN` · `ADMIN` (D-04).
     *
     * C'est **la** capacité propre de l'`ADMIN` : il est le gestionnaire des
     * responsables de département. Il n'a rien de moins que le `SUPER_ADMIN` sur
     * ce point précis, et rien de plus : il ne peut pas créer un pair, ni
     * au-dessus de lui.
     */
    CREATE: {
      roles: ["SUPER_ADMIN", "ADMIN"],
      scopes: ["GLOBAL"],
      resource: (_, resource) => assertCoherentProfile(resource, "DEPARTMENT_MANAGER"),
    },

    /**
     * `canReadProfiles` — `SUPER_ADMIN` ; **`ADMIN` : Q-02** non tranchée →
     * refus (`docs/029` §4.3, défaut `✘`).
     *
     * Refuser à l'`ADMIN` l'énumération des profils ne l'empêche pas de gérer
     * les responsables qu'il crée : `GET /admin/me` lit le profil courant, et
     * l'administration d'un compte précis est une décision sur **instance**
     * (`UPDATE_ROLE_SCOPE`, `DEACTIVATE`), pas une énumération. La question Q-02
     * porte bien sur la **liste**, et c'est cette lecture-là qui reste fermée.
     */
    READ: {
      roles: ["SUPER_ADMIN"],
      scopes: ["GLOBAL"],
      pending: "docs/029 Q-02 (lecture des profils par l'ADMIN)",
    },

    /**
     * `canUpdateRoleScope` — `SUPER_ADMIN` ; **`ADMIN` : Q-02** → refus.
     *
     * Modifier le rôle ou le périmètre d'un compte, c'est redistribuer des
     * pouvoirs. Tant que Q-02 n'est pas arbitrée, l'`ADMIN` ne le fait pas — et
     * l'exclusion XD-03 garantit qu'il ne pourrait de toute façon pas viser un
     * `SUPER_ADMIN`.
     */
    UPDATE_ROLE_SCOPE: {
      roles: ["SUPER_ADMIN"],
      scopes: ["GLOBAL"],
      pending: "docs/029 Q-02",
      resource: (_, resource) => assertCoherentProfile(resource, undefined),
    },

    /**
     * `canDeactivate` — `SUPER_ADMIN` ; **`ADMIN` : `028/Q-A4`** → refus.
     *
     * `docs/028` D-03 parle de « désactivation » et « révocation », jamais de
     * suppression physique. La conséquence est double : un compte ne
     * **disparaît** pas (l'inverse rendrait inattribuables les grants
     * `media_access.granted_by` et les journaux d'audit, cf. `docs/032` §3.4), et
     * l'effet de la désactivation doit être **immédiat** — D-14 étape 1 : « accès
     * futur immédiatement révoqué ». Un jeton Supabase encore valide ne doit pas
     * survivre à la désactivation : c'est `requireAdmin` qui le rattrape à
     * chaque requête en relisant `is_active`, et c'est la raison pour laquelle il
     * consulte la base à chaque appel plutôt que de faire confiance au jeton.
     */
    DEACTIVATE: {
      roles: ["SUPER_ADMIN"],
      scopes: ["GLOBAL"],
      pending: "docs/028 Q-A4 (désactivation par l'ADMIN)",
    },

    /**
     * `DELETE` — **refus pour tous**.
     *
     * Aucune décision n'autorise la suppression physique d'un profil, et
     * plusieurs l'excluent : `media_access.granted_by` est en `RESTRICT`,
     * `audit_log.actor_user_id` en `SET NULL` « parce qu'un journal doit
     * survivre » (`docs/032` §4.3), et D-03 ne parle que de désactivation. La
     * ligne est écrite pour rendre ce refus **visible** au lieu de le laisser
     * dépendre de l'absence d'une action dans le vocabulaire.
     */
    DELETE: { roles: [], pending: "docs/028 D-03 — désactivation, jamais suppression physique" },
  },
  /**
   * **XD-03 — l'`ADMIN` ne peut pas administrer un `SUPER_ADMIN`.**
   *
   * « Ni le créer, ni le modifier, ni le désactiver » (`docs/028` D-04). Placée
   * en exclusion, la règle précède la table : elle s'applique à **toute** action
   * contre un `SUPER_ADMIN`, y compris celles qu'un lot futur ajouterait sans
   * penser à cette cible. Une règle recopiée dans chaque ligne serait, elle,
   * immanquablement oubliée sur la dernière ajoutée.
   */
  (admin, resource) =>
    admin.role === "ADMIN" && resource?.role === "SUPER_ADMIN"
      ? "docs/028 D-04, XD-03 : un ADMIN ne peut ni créer, ni modifier, ni désactiver un compte SUPER_ADMIN"
      : null,
);

/**
 * Vérifie la cohérence rôle ↔ scope ↔ département (D-02).
 *
 * `docs/032` §3.1 porte cette règle **en base** (`admin_profiles_scope_coherence`).
 * La répéter ici n'est pas une duplication de logique métier mais un **confort de
 * diagnostic** : la base produit une erreur d'intégrité (`500`), la policy
 * produit un refus lisible (`403`). Les deux disent la même chose, et la base
 * reste l'autorité — un chemin qui contournerait cette fonction ne gagnerait
 * rien, la contrainte s'appliquant à l'écriture.
 *
 * @param expectedRole Rôle attendu par l'action ; `undefined` pour une mise à
 *                     jour, où c'est la cohérence interne de la cible qui est
 *                     vérifiée plutôt que son rôle.
 */
function assertCoherentProfile(
  resource: UserPolicyResource | undefined,
  expectedRole: PersistedAdminRole | undefined,
): AuthorizationDecision {
  if (!resource) return allow();

  if (expectedRole && resource.role !== expectedRole && resource.role !== "ROLE_ADMIN") {
    return deny(
      `Action réservée à la création d'un profil ${expectedRole} : le rôle cible est ${resource.role}`,
    );
  }

  const isManager = resource.role === "DEPARTMENT_MANAGER";
  if (isManager && (resource.scope !== "DEPARTMENT" || !resource.departmentId)) {
    return deny(
      "Un DEPARTMENT_MANAGER porte un scope DEPARTMENT et un département de rattachement non nul (docs/028 D-02)",
    );
  }
  if (!isManager && resource.role !== "ROLE_ADMIN" && (resource.scope !== "GLOBAL" || resource.departmentId)) {
    return deny(
      "Un rôle système porte un scope GLOBAL et aucun département : docs/028 D-02, contrainte admin_profiles_scope_coherence (docs/032 §3.1)",
    );
  }

  return allow();
}

/**
 * Exige **un** département pour un responsable (D-02).
 *
 * `docs/029` §4.1 l'inscrit comme membre de la policy
 * (`assertSingleDepartment`) : « Un `DEPARTMENT_MANAGER` porte **un**
 * `department_id` non nul ». La règle X11 (« accéder au département d'un autre
 * responsable ») devient, grâce à cette unicité, une simple **égalité** — c'est
 * tout l'intérêt de D-02, et c'est ce qui produit les refus croisés entre
 * départements sans en nommer aucun.
 */
export function assertSingleDepartment(candidate: {
  role: AdminRole;
  departmentId?: string | null;
}): void {
  if (candidate.role === "DEPARTMENT_MANAGER" && !candidate.departmentId) {
    throw new Error(
      "Un DEPARTMENT_MANAGER doit porter un département de rattachement non nul (docs/028 D-02)",
    );
  }
}
