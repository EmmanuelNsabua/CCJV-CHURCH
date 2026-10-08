import type { AdminProfile, AdminRole, AdminScope, PersistedAdminRole } from "@/domain/entities";
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

/** Habilitation d'un profil : rôle, périmètre, rattachement. */
export interface ProfileState {
  role: AdminRole;
  scope: AdminScope;
  departmentId: string | null;
}

/**
 * Vue d'un profil **cible** telle que la policy a besoin de la connaître.
 *
 * ### Pourquoi deux états, et non un seul
 *
 * Une même requête porte souvent **deux** habilitations : celle que le compte a
 * aujourd'hui, et celle qu'on veut lui écrire. Les confondre produit un défaut
 * précis, et silencieux. `docs/028` D-04 interdit à l'`ADMIN` d'administrer un
 * compte `SUPER_ADMIN` (XD-03), et `docs/029` Q-03 laisse ouverte la même
 * question pour un `SUPER_ADMIN` vis-à-vis d'un autre. Si la policy ne lit que
 * l'état **demandé**, alors une requête qui réécrit un `SUPER_ADMIN` en `ADMIN`
 * présente un rôle ordinaire — l'exclusion ne se déclenche pas, et le compte
 * suprême est administré sans que rien ne l'ait signalé.
 *
 * Inversement, si la policy ne lisait que l'état **actuel**, elle ne pourrait pas
 * vérifier la cohérence rôle ↔ périmètre de ce qu'on s'apprête à écrire, et
 * laisserait passer un responsable sans département.
 *
 * Les deux informations sont donc explicites, et chacune sert ce qu'elle est
 * seule à pouvoir dire : `current` décide des **exclusions**, `requested` décide
 * de la **cohérence**.
 */
export interface UserPolicyResource {
  id: string;
  /**
   * État **actuel** du compte cible.
   *
   * Pour une **création**, il n'y a pas d'état actuel : la convention est d'y
   * placer le rôle demandé, et `requested` reste absent. C'est exact — un compte
   * en cours de création n'a pas d'histoire à administrer.
   */
  current: ProfileState;
  /**
   * Habilitation **demandée** (cellule 1.5), absente hors réécriture.
   */
  requested?: ProfileState;
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
      resource: (_, resource) => assertCoherentProfile(resource),
    },

    /** `canCreateAdmin` — `SUPER_ADMIN` **uniquement** (D-03). */
    CREATE_ADMIN: {
      roles: ["SUPER_ADMIN"],
      scopes: ["GLOBAL"],
      resource: (_, resource) => assertCoherentProfile(resource),
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
      resource: (_, resource) => assertCoherentProfile(resource),
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
      pending: "docs/029 Q-02 · Q-03",
      resource: (admin, resource) => {
        // L'exclusion est évaluée sur l'état **actuel** de la cible : c'est
        // administrer un compte `SUPER_ADMIN` qui est en cause, pas le rôle
        // qu'on prétend lui donner. Sans cela, réécrire ce compte en `ADMIN`
        // suffirait à faire disparaître la cible de l'exclusion — le défaut
        // exact que la séparation `current` / `requested` ferme.
        const untranched = refuseSuperAdminTargetBySuperAdmin(admin, resource);
        if (!untranched.allowed) return untranched;
        return assertCoherentProfile(resource);
      },
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
      pending: "docs/028 Q-A4 · docs/029 Q-03",
      resource: refuseSuperAdminTargetBySuperAdmin,
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
    admin.role === "ADMIN" && resource?.current.role === "SUPER_ADMIN"
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
 * L'état vérifié est celui qui **sera écrit** : `requested` lorsqu'une
 * habilitation est réécrite, `current` sinon (création, ou action qui ne change
 * pas l'habilitation). Vérifier `current` lors d'une réécriture reviendrait à
 * valider l'ancien état et à laisser passer le nouveau — l'inverse exact de ce
 * que la contrainte protège.
 */
function assertCoherentProfile(
  resource: UserPolicyResource | undefined,
): AuthorizationDecision {
  if (!resource) return allow();

  const state = resource.requested ?? resource.current;
  const isManager = state.role === "DEPARTMENT_MANAGER";

  if (isManager && (state.scope !== "DEPARTMENT" || !state.departmentId)) {
    return deny(
      "Un DEPARTMENT_MANAGER porte un scope DEPARTMENT et un département de rattachement non nul (docs/028 D-02)",
    );
  }
  if (!isManager && (state.scope !== "GLOBAL" || state.departmentId)) {
    return deny(
      "Un rôle système porte un scope GLOBAL et aucun département : docs/028 D-02, contrainte admin_profiles_scope_coherence (docs/032 §3.1)",
    );
  }

  return allow();
}

/**
 * Un `SUPER_ADMIN` ne peut pas administrer un autre `SUPER_ADMIN` — **Q-03**.
 *
 * La cellule 1.7 de `docs/029` §2.1 laisse cette case en `?` : « 028 ne dit pas
 * si un `SUPER_ADMIN` peut en administrer un autre (ni lui-même) ». Le refus par
 * défaut s'applique donc, et il est **volontairement visible** ici plutôt
 * qu'obtenu par l'absence d'un rôle dans une liste.
 *
 * Ce n'est pas une précaution théorique : le compte `SUPER_ADMIN` est créé
 * **hors de l'application** (règle d'arrêt du mandat — l'identité doit être
 * désignée par l'organisation). Une policy qui permettrait à un `SUPER_ADMIN` de
 * modifier un autre `SUPER_ADMIN` ouvrirait donc, depuis un compte applicatif, une
 * voie sur un compte que l'application n'a jamais eu le droit de fabriquer.
 */
function refuseSuperAdminTargetBySuperAdmin(
  admin: AdminProfile,
  resource: UserPolicyResource | undefined,
): AuthorizationDecision {
  // `current`, jamais `requested` : ce qui est en cause, c'est le compte que l'on
  // administre — et non le rôle qu'on prétend lui donner.
  if (admin.role === "SUPER_ADMIN" && resource?.current.role === "SUPER_ADMIN") {
    return deny(
      "docs/029 Q-03 : administrer un compte SUPER_ADMIN depuis l'application n'est pas tranché — refus par défaut (docs/029 §4.3)",
    );
  }
  return allow();
}

/**
 * Traduit un profil du domaine en ressource de policy.
 *
 * Existe pour qu'aucun appelant n'ait à reconstruire `current` à la main : le
 * jour où `AdminProfile` gagne un champ qui compte pour une décision (un état
 * d'habilitation, une date de révocation), c'est **ici** que la traduction se
 * met à jour — au lieu d'être oubliée dans l'un des trois services qui
 * administrent des comptes.
 */
export function asUserPolicyResource(profile: AdminProfile): UserPolicyResource {
  return {
    id: profile.id,
    current: {
      role: profile.role,
      scope: profile.scope,
      departmentId: profile.departmentId,
    },
  };
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
