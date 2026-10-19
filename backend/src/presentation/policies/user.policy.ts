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
     * `canReadProfiles` — `SUPER_ADMIN` · **`ADMIN` (arbitrage du commanditaire)**.
     *
     * La cellule 1.4 de `docs/029` §2.1 portait `ADMIN : ? (Q-02)`. **Q-02 est
     * tranchée en faveur de l'`ADMIN`** : il consulte l'annuaire.
     *
     * Ce que cette ouverture ne donne pas : administrer un compte trouvé dans la
     * liste. XD-03 exclut toujours toute action de l'`ADMIN` contre un
     * `SUPER_ADMIN`, et les deux actions d'administration restent bornées aux
     * responsables de département (`refusePeerAdministrationByAdmin`). Lire n'est
     * pas administrer : c'est la distinction que les cellules 1.4 et 1.5
     * expriment séparément.
     */
    READ: {
      roles: ["SUPER_ADMIN", "ADMIN"],
      scopes: ["GLOBAL"],
    },

    /**
     * `canUpdateRoleScope` — `SUPER_ADMIN` · **`ADMIN` sur les responsables**
     * (arbitrage du commanditaire ; la cellule 1.5 portait `ADMIN : ? (Q-02)`).
     *
     * L'ouverture est **bornée par D-04**, qui n'est pas modifiée : « l'`ADMIN`
     * n'est pas *inférieur*, il est **différent** ». Il gère les responsables de
     * département, et rien d'autre. Pour un acteur `ADMIN` :
     * - la **cible** doit être un `DEPARTMENT_MANAGER` (ni un pair, ni un
     *   `SUPER_ADMIN`, que XD-03 exclut de toute façon) ;
     * - le rôle **écrit** doit rester `DEPARTMENT_MANAGER` : promouvoir vers un
     *   rôle qu'il ne détient pas serait s'attribuer un pouvoir par personne
     *   interposée (D-03, mission §5).
     */
    UPDATE_ROLE_SCOPE: {
      roles: ["SUPER_ADMIN", "ADMIN"],
      scopes: ["GLOBAL"],
      resource: (admin, resource) => {
        // L'exclusion est évaluée sur l'état **actuel** de la cible : c'est
        // administrer un compte `SUPER_ADMIN` qui est en cause, pas le rôle
        // qu'on prétend lui donner. Sans cela, réécrire ce compte en `ADMIN`
        // suffirait à faire disparaître la cible de l'exclusion — le défaut
        // exact que la séparation `current` / `requested` ferme.
        const untranched = refuseSuperAdminTargetBySuperAdmin(admin, resource);
        if (!untranched.allowed) return untranched;

        const peer = refusePeerAdministrationByAdmin(admin, resource);
        if (!peer.allowed) return peer;

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
      roles: ["SUPER_ADMIN", "ADMIN"],
      scopes: ["GLOBAL"],
      resource: (admin, resource) => {
        const untranched = refuseSuperAdminTargetBySuperAdmin(admin, resource);
        if (!untranched.allowed) return untranched;

        const peer = refusePeerAdministrationByAdmin(admin, resource);
        if (!peer.allowed) return peer;

        return refuseSelfAdministration(admin, resource);
      },
    },

    /**
     * `canUpdateIdentity` — **cellule absente de `docs/029` §2.1**.
     *
     * Ni la matrice gelée ni `docs/028` n'énumèrent la correction des
     * informations d'un compte (nom d'utilisateur, nom affiché, adresse de
     * connexion). Le vide est donc traité selon la règle du projet — refus par
     * défaut (`docs/029` §4.3) — et **aligné sur la cellule la plus proche** :
     * 1.5 (`UPDATE` rôle / scope), réservée au `SUPER_ADMIN`. Modifier l'identité
     * d'un compte, c'est toucher à qui peut se connecter : cela relève de la
     * même gouvernance que les rôles (X5).
     *
     * Les deux exclusions existantes s'appliquent sans être recopiées : XD-03
     * (l'`ADMIN` n'administre pas un `SUPER_ADMIN`) précède la table, et Q-03
     * (un `SUPER_ADMIN` n'administre pas un autre `SUPER_ADMIN`) est posée sur
     * la ressource.
     */
    UPDATE_IDENTITY: {
      roles: ["SUPER_ADMIN"],
      scopes: ["GLOBAL"],
      pending:
        "docs/029 — aucune cellule pour la modification d'identité ; hypothèse alignée sur la cellule 1.5 (SUPER_ADMIN), à arbitrer en Phase 6",
      resource: refuseSuperAdminTargetBySuperAdmin,
    },

    /**
     * `canResetPassword` — **cellule absente de `docs/029` §2.1**.
     *
     * Définir le mot de passe d'un **autre** compte est l'acte d'administration
     * le plus direct sur un accès : il est réservé au `SUPER_ADMIN`, par
     * cohérence avec 1.5 et 1.6, et refusé par défaut puisqu'aucun document ne
     * l'attribue.
     *
     * Ce que cette action ne couvre **pas** : le changement de son **propre**
     * mot de passe, qui n'est pas une administration d'autrui. Ce parcours-là
     * (`PATCH /admin/me/password`) n'exige aucune permission supplémentaire
     * au-delà d'être un administrateur actif, et il est volontairement
     * distinct : sans lui, Q-03 rendrait impossible la rotation du secret du
     * seul compte `SUPER_ADMIN` — donc un verrouillage.
     */
    RESET_PASSWORD: {
      roles: ["SUPER_ADMIN"],
      scopes: ["GLOBAL"],
      pending:
        "docs/029 — aucune cellule pour la réinitialisation administrative du mot de passe ; hypothèse alignée sur les cellules 1.5 et 1.6, à arbitrer en Phase 6",
      resource: refuseSuperAdminTargetBySuperAdmin,
    },

    /**
     * `DELETE` — **suppression physique, `SUPER_ADMIN` uniquement**
     * (arbitrage du commanditaire ; la cellule 1.8 portait `?  (Q-24)`).
     *
     * L'arbitrage ouvre la suppression **au seul `SUPER_ADMIN`** : `ADMIN` et
     * responsable restent refusés. Trois bornes l'accompagnent, et aucune n'est
     * décorative :
     *
     * - **pas de compte `SUPER_ADMIN` pour cible** : Q-03 reste en vigueur, donc
     *   le dernier compte suprême ne peut pas être supprimé — la protection
     *   contre le verrouillage découle de la règle existante, elle n'est pas
     *   réinventée ;
     * - **pas de suppression de son propre compte** : l'exploitant se couperait
     *   l'administration dans le même geste ;
     * - **`media_access.granted_by` est en `RESTRICT`** : un compte qui a accordé
     *   des droits sur des médias ne peut pas disparaître, la base le refuse
     *   (traduit en `409` par le repository). Effacer l'auteur rendrait
     *   l'autorisation inattribuable — `docs/032` §3.4.
     *
     * La suppression n'est **jamais** une désactivation déguisée : elle efface
     * le profil et le compte d'authentification, sans retour possible.
     */
    DELETE: {
      roles: ["SUPER_ADMIN"],
      scopes: ["GLOBAL"],
      resource: (admin, resource) => {
        const untranched = refuseSuperAdminTargetBySuperAdmin(admin, resource);
        if (!untranched.allowed) return untranched;
        return refuseSelfAdministration(admin, resource);
      },
    },
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
 * Un `ADMIN` n'administre que des **responsables de département** — D-04.
 *
 * L'ouverture des cellules 1.5 et 1.6 à l'`ADMIN` (arbitrage du commanditaire)
 * ne fait pas de lui un administrateur d'administrateurs : « l'`ADMIN` n'est pas
 * *inférieur*, il est **différent** ». Deux bornes en découlent, et elles sont
 * vérifiées ici, une fois :
 *
 * 1. la **cible** doit être un `DEPARTMENT_MANAGER` — un pair `ADMIN` ne
 *    s'administre pas, un `SUPER_ADMIN` est déjà exclu par XD-03 ;
 * 2. le rôle **écrit** doit rester `DEPARTMENT_MANAGER` — promouvoir vers un
 *    rôle que l'acteur ne détient pas serait s'attribuer un pouvoir par personne
 *    interposée (D-03, mission §5).
 *
 * Les autres rôles d'acteur ne sont pas concernés : cette fonction ne restreint
 * que l'`ADMIN`, exactement comme `refuseSuperAdminTargetBySuperAdmin`.
 */
function refusePeerAdministrationByAdmin(
  admin: AdminProfile,
  resource: UserPolicyResource | undefined,
): AuthorizationDecision {
  if (admin.role !== "ADMIN" || !resource) return allow();

  // `current`, jamais `requested` : ce qui est en cause, c'est le compte visé.
  if (resource.current.role !== "DEPARTMENT_MANAGER") {
    return deny(
      "docs/028 D-04 : un ADMIN n'administre que les responsables de département (ni un pair ADMIN, ni un SUPER_ADMIN)",
    );
  }

  const written = resource.requested ?? resource.current;
  if (written.role !== "DEPARTMENT_MANAGER") {
    return deny(
      "docs/028 D-03/D-04 : un ADMIN ne peut pas attribuer un rôle qu'il ne détient pas — il ne crée ni n'administre d'ADMIN",
    );
  }

  return allow();
}

/**
 * Personne n'administre **son propre** compte par ces actions.
 *
 * Désactiver ou supprimer son propre compte, c'est se retirer l'accès
 * d'administration dans le geste même — un verrouillage, pas une décision. Pour
 * un `SUPER_ADMIN`, Q-03 le refusait déjà ; la règle est ici rendue **explicite
 * et générale**, afin qu'elle ne dépende pas d'un détour par Q-03.
 *
 * Le changement de **son propre mot de passe** ne passe pas par cette policy : il
 * a sa route dédiée (`PATCH /admin/me/password`), et c'est précisément ce qui
 * permet au compte suprême de faire tourner son secret.
 */
function refuseSelfAdministration(
  admin: AdminProfile,
  resource: UserPolicyResource | undefined,
): AuthorizationDecision {
  if (resource && admin.id === resource.id) {
    return deny(
      "Administrer son propre compte couperait l'accès d'administration : opération refusée (le mot de passe personnel a sa propre route)",
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
