import type { AdminProfile, AdminRole, AdminScope } from "@/domain/entities";
import {
  allow,
  deny,
  type AuthorizationDecision,
  type Policy,
  type PolicyAction,
} from "./authorize";

/**
 * Moteur du catalogue de policies (`docs/029` §4).
 *
 * Ce fichier n'implémente **aucune** règle métier : il implémente la **formule**
 * de `docs/029` §4.3, une fois, et pour toutes les ressources.
 *
 * ```text
 * can(user, action, resource)
 *    =   roleAllows(role, action)                               ← table §2
 *    ∧   scopeAllows(scope, action, resource)                   ← §1.2
 *    ∧   (scope ≠ DEPARTMENT ∨ resource.department_id = user.department_id)
 *    ∧   resourceAllows(user, action, resource)                 ← D-18…D-26
 * ```
 *
 * **Pourquoi une table et non des branchements.** `docs/029` §5.1 pose que
 * l'extension doit être additive : « `can(user, action, resource)` ← extension =
 * une ligne de table, pas un branchement ». Un catalogue écrit en `if/else`
 * imbriqués rend chaque nouvelle action risquée — on ne sait jamais quelle
 * combinaison existante on vient de déplacer. Ici, une policy est une **donnée**
 * auditable côte à côte avec la matrice RBAC dont elle dérive, et l'ajout d'un
 * rôle est une colonne, pas une réécriture (`docs/029` §5.2).
 *
 * **Ce que le moteur refuse de faire.** Il n'existe aucune hiérarchie de rôles et
 * aucune hiérarchie d'actions. `docs/028` D-04 : « l'`ADMIN` n'est pas
 * inférieur, il est **différent** » ; D-21 : « pas de hiérarchie
 * `DELETE ⊃ MANAGE ⊃ USE` ». Un test de non-régression (`tests/unit/policies`)
 * vérifie qu'aucune comparaison d'ordinal n'apparaît dans cette couche.
 */

/* -------------------------------------------------------------------------- */
/*  Formes de ressource                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Vue minimale d'une ressource rattachée à un département.
 *
 * Volontairement structurelle : les policies ne dépendent pas des entités
 * complètes, dont la forme évolue avec les lots 2 à 6. Ce qu'une policy a le
 * droit de savoir sur une ressource est exactement ce dont la formule de §4.3 a
 * besoin — ni plus (aucune fuite de données métier dans la couche
 * d'autorisation), ni moins.
 */
export interface DepartmentScopedResource {
  departmentId: string | null;
}

/* -------------------------------------------------------------------------- */
/*  Clause départementale                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Comment la clause départementale de `docs/029` §4.3 s'applique à une action.
 *
 * `"equality"` — l'action porte sur une **instance** : la ressource doit porter
 * le département de l'acteur. Une ressource **sans département vaut refus**
 * (« `department_id` de la ressource nul/absent → refus », §4.3). C'est le mode
 * des actions `UPDATE`, `DELETE`, `PUBLISH`, `ARCHIVE` : il n'y a pas de « je ne
 * sais pas encore » qui tienne, la ressource est chargée.
 *
 * `"declared"` — l'action porte sur une **cible déclarée ou une collection** :
 * une cible absente est **admise**, parce que le département n'est pas alors une
 * entrée mais une **sortie** — il est *forcé* depuis le profil à la création
 * (`docs/029` P-01 : « MANAGER `DEPARTMENT` (département forcé) ») et il est
 * *filtré en requête* à la lecture de collection (`listScope` ci-dessous). Une
 * cible **présente** est en revanche jugée strictement : c'est l'exigence N-10
 * de `docs/029` §6.2 — « `POST` publication avec `department_id` d'un autre
 * département dans le corps → refus ; le département vient du **profil**, jamais
 * du corps ».
 *
 * Le mode `"declared"` n'est donc pas un assouplissement : il déplace la
 * contrainte du contrôle *a posteriori* vers une contrainte *structurelle* —
 * on ne peut pas créer ailleurs que chez soi, et on ne peut pas lire ailleurs
 * que chez soi, parce que la requête elle-même est bornée.
 */
export type DepartmentClauseMode = "equality" | "declared";

/**
 * Mode d'application de la clause départementale pour une action.
 *
 * `undefined` = la ressource n'a pas de département : `Media` (X27 : « pas de
 * `media.department_id` », la bibliothèque est **centrale**), les entités
 * éditoriales globales, les paramètres. Ce n'est jamais un oubli — c'est un
 * choix documenté par la ressource elle-même.
 */
export type DepartmentClause = DepartmentClauseMode | undefined;

/* -------------------------------------------------------------------------- */
/*  Table de policy                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Une ligne de la table : tout ce qui décide d'une action, pour une ressource.
 *
 * @property roles     Rôles **explicitement** admis (`docs/029` §4.3 :
 *                     « Jamais une comparaison d'ordinal entre rôles »).
 *                     Un tableau **vide** exprime un refus pour tout le monde —
 *                     c'est ainsi que `docs/028` D-18 (`UNARCHIVE`), D-23
 *                     (créer une page) et D-16 (purge automatique) sont codés :
 *                     un refus structurel doit être **écrit**, pas déduit de
 *                     l'absence d'une ligne.
 * @property scopes    Scopes admis. Omis = tous les scopes portés par un rôle
 *                     admis. `PRIVATE` n'existe plus comme scope de profil
 *                     (`docs/032` §2.1) : le périmètre privé des prières est une
 *                     exclusion de ressource, cf. `excludedReason`.
 * @property department Mode de la clause départementale (§4.3).
 * @property pending   Référence d'une question **non tranchée** dont dépend la
 *                     ligne. La décision reste alors le **refus** (`docs/029`
 *                     §4.3 : « Défaut `✘` ») : on ne devine pas une permission
 *                     au motif qu'elle serait commode. Le champ rend la
 *                     dépendance vérifiable — et lève l'ambiguïté au moment de
 *                     l'arbitrage, sans chasse dans le code.
 * @property resource  Règles portant sur **l'instance** : irréversibilité
 *                     (`D-18`), accès média explicite (`D-21`, `D-22`), contrat
 *                     de template (`D-23`), département obligatoire (`D-26`).
 */
export interface ActionRule<TResource> {
  roles: readonly AdminRole[];
  scopes?: readonly AdminScope[];
  department?: DepartmentClause;
  pending?: string;
  resource?: (admin: AdminProfile, resource: TResource | undefined) => AuthorizationDecision;
}

/** Une policy : une ligne par action. Une action absente est refusée. */
export type PolicyTable<TResource> = Partial<Record<PolicyAction, ActionRule<TResource>>>;

/**
 * Filtre de périmètre à appliquer **en requête** (jamais après coup).
 *
 * `null` signifie « aucune contrainte » : c'est le cas d'un scope `GLOBAL`, dont
 * la clause départementale de §4.3 est **vraie par construction**.
 */
export type DepartmentScopeFilter = { readonly departmentId: string } | null;

/** Policy exploitable : la fonction `Policy` plus ce que la couche applicative doit savoir d'elle. */
export interface ResourcePolicy<TResource> {
  readonly name: string;
  /**
   * `Policy` **déjà liée** : passable directement à `authorize(can, action, …)`.
   *
   * C'est une propriété et non une méthode, pour qu'aucune policy ne dépende d'un
   * `this` : une policy est une fonction pure, elle doit rester appelable hors de
   * son objet — c'est ce qui rend `evaluate(policy, …)` utilisable en test.
   */
  readonly can: Policy<TResource>;
  readonly actions: readonly PolicyAction[];
  /**
   * Périmètre départemental à imposer aux lectures de collection.
   *
   * Exposé ici, et non recalculé dans chaque service, parce que
   * `docs/029` §4.2 l'interdit : « Une règle départementale recopiée dans chaque
   * service » est un interdit explicite, et « un **unique** prédicat
   * d'appartenance départementale, réutilisé par toutes les policies » est
   * exigé. Une policy qui accorde une lecture de collection sans que ce filtre
   * soit appliqué laisse fuir les données d'un autre département.
   */
  readonly listScope: (admin: AdminProfile) => DepartmentScopeFilter;
}

/* -------------------------------------------------------------------------- */
/*  Primitives partagées                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Prédicat **unique** d'appartenance départementale (`docs/029` §4.3).
 *
 * `docs/028` D-02 rend le rattachement **unique** : l'interdiction « accéder au
 * département d'un autre responsable » (règle X11) devient donc une simple
 * **égalité**. C'est ce qui produit « Presse ↛ Ecodume » et « Ecodume ↛ Presse »
 * **sans qu'aucun des deux noms n'apparaisse** (XD-05, XD-06, D-09) : le
 * département est une **donnée**, jamais une valeur du code.
 *
 * Trois refus, jamais un seul :
 *
 * 1. scope `DEPARTMENT` sans rattachement — impossible en base
 *    (`admin_profiles_scope_coherence`, `docs/032` §3.1), donc détecté ici comme
 *    un défaut d'intégrité, pas comme une permission.
 * 2. ressource **sans** département en mode `"equality"` — `docs/029` §0.2 :
 *    « un `department_id` absent ou nul vaut refus ».
 * 3. ressource d'un **autre** département.
 */
export function departmentClause(
  admin: AdminProfile,
  resource: DepartmentScopedResource | undefined,
  mode: DepartmentClauseMode,
): AuthorizationDecision {
  // Scope GLOBAL : la clause de §4.3 est vraie, il n'y a rien à comparer.
  if (admin.scope !== "DEPARTMENT") return allow();

  if (!admin.departmentId) {
    return deny(
      "Profil à périmètre départemental sans département de rattachement : intégrité du profil violée",
    );
  }

  const target = resource?.departmentId;
  if (target === null || target === undefined) {
    if (mode === "declared") return allow();
    return deny(
      "Ressource sans département : refus par défaut (docs/029 §4.3, « department_id nul ou absent vaut refus »)",
    );
  }

  if (target !== admin.departmentId) {
    return deny("Département de la ressource différent du département de rattachement");
  }

  return allow();
}

/**
 * Filtre de périmètre d'un acteur.
 *
 * Sert aux lectures de **collection** : une policy ne peut pas juger une
 * ressource qu'on ne lui présente pas, et un service qui énumère sans borner sa
 * requête contourne la policy par omission. Le filtre est donc la contrepartie
 * obligatoire de toute ligne `READ` en mode `"declared"`.
 */
export function listScopeFor(admin: AdminProfile): DepartmentScopeFilter {
  if (admin.scope !== "DEPARTMENT") return null;
  return admin.departmentId ? { departmentId: admin.departmentId } : null;
}

/**
 * Construit une policy depuis sa table.
 *
 * L'ordre d'évaluation est **contractuel** et suit `docs/029` §4.3 :
 * exclusions transverses → rôle → scope → département → ressource.
 *
 * Les **exclusions transverses** (`docs/029` §3.3, XD-01 → XD-17) passent en
 * premier, et ce n'est pas un détail d'implémentation : « Le rôle `SUPER_ADMIN`
 * **ne peut pas** lire les demandes de prière » (X19) n'est pas un cran de plus
 * dans une hiérarchie de rôles — c'est une exclusion **de fond**, qui doit
 * rester vraie même si la table des rôles évolue. Écrite en premier, elle ne
 * peut pas être défaite par l'ajout d'une ligne plus permissive.
 */
export function createPolicy<TResource>(
  name: string,
  table: PolicyTable<TResource>,
  excludedReason?: (admin: AdminProfile, resource: TResource | undefined) => string | null,
): ResourcePolicy<TResource> {
  const can: Policy<TResource> = (admin, action, resource) => {
    const rule = table[action];

    // L'exclusion précède la table : voir le commentaire ci-dessus. Elle ne
    // porte pas la question ouverte de la ligne, puisque aucune ligne n'a encore
    // été lue — un refus d'exclusion est une décision, pas une lacune.
    if (excludedReason) {
      const reason = excludedReason(admin, resource);
      if (reason) return deny(reason);
    }

    if (!rule) {
      return deny(
        `${name} : action ${action} non déclarée — refus par défaut (docs/029 §4.3)`,
      );
    }

    return withPending(decide(name, rule, admin, resource), rule.pending);
  };

  return {
    name,
    can,
    actions: Object.keys(table) as PolicyAction[],
    listScope: listScopeFor,
  };
}

/** Applique la formule de `docs/029` §4.3, dans l'ordre contractuel. */
function decide<TResource>(
  name: string,
  rule: ActionRule<TResource>,
  admin: AdminProfile,
  resource: TResource | undefined,
): AuthorizationDecision {
  if (!rule.roles.includes(admin.role)) {
    return deny(`${name} : rôle ${admin.role} non admis pour cette action`);
  }

  if (rule.scopes && !rule.scopes.includes(admin.scope)) {
    return deny(`${name} : périmètre ${admin.scope} non admis pour cette action`);
  }

  if (rule.department) {
    const decision = departmentClause(
      admin,
      resource as DepartmentScopedResource | undefined,
      rule.department,
    );
    if (!decision.allowed) return decision;
  }

  if (rule.resource) return rule.resource(admin, resource);

  return allow();
}

/**
 * Attache la référence de la question ouverte à la décision.
 *
 * La référence accompagne aussi bien un refus qu'une permission : une ligne
 * **accordée** sous réserve d'une question non tranchée doit être aussi
 * repérable qu'une ligne refusée, sinon l'arbitrage se ferait sur la moitié du
 * problème.
 */
function withPending(
  decision: AuthorizationDecision,
  pending: string | undefined,
): AuthorizationDecision {
  return pending ? { ...decision, pending } : decision;
}

/* -------------------------------------------------------------------------- */
/*  Vérification d'intégrité du catalogue                                     */
/* -------------------------------------------------------------------------- */

/**
 * Énumère toutes les lignes d'une policy avec leur décision, pour un acteur.
 *
 * Sert aux tests d'exhaustivité : la matrice RBAC se juge sur ses **refus**
 * (`docs/029` §3), et une exclusion transversale oubliée est un refus qui a
 * disparu. Parcourir la table entière — au lieu de tester les seules actions
 * auxquelles on pense — est ce qui rend l'oubli visible.
 */
export function sweep<TResource>(
  policy: ResourcePolicy<TResource>,
  admin: AdminProfile,
  resource?: TResource,
): { action: PolicyAction; allowed: boolean; reason?: string }[] {
  return policy.actions.map((action) => {
    const decision = policy.can(admin, action, resource);
    return decision.allowed
      ? { action, allowed: true }
      : { action, allowed: false, reason: decision.reason };
  });
}
