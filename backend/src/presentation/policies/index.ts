/**
 * Catalogue des policies (`docs/029` §4.1) — **point d'entrée unique**.
 *
 * Une route importe ses policies d'ici, jamais d'un fichier de policy
 * directement. Ce n'est pas une convention de style : c'est ce qui rend le
 * catalogue **énumérable**. Un inventaire complet du RBAC doit pouvoir répondre
 * sans lire tout le dépôt à « quelles policies existent, et quelles actions
 * chacune couvre ? » — question à laquelle `docs/029` §6.1 répond par un
 * principe : « Toute la matrice §2, y compris les cas qu'aucune route
 * n'expose. » Un cas qu'aucune route n'expose doit tout de même être **testé**,
 * donc **atteignable**.
 *
 * ## Deux temps, une seule couche
 *
 * `docs/029` §4.2 fixe l'ordre de la chaîne :
 *
 * ```text
 * authenticate()                 → 401 AUTH_REQUIRED
 * requireAdmin(deps)             → 403 FORBIDDEN
 * authorize(Policy.can, ACTION)  → 403 FORBIDDEN   ← point unique
 * validate({ params, query, body }) → 400 VALIDATION_ERROR
 * controller → use case
 *    └── Policy.can(admin, ACTION, resource)       ← décision sur l'instance
 * ```
 *
 * Les deux appels — sur le **type** de ressource, puis sur l'**instance** —
 * invoquent **la même** fonction `can`. Aucune règle n'est écrite deux fois :
 * le premier appel juge ce qui ne dépend d'aucune donnée d'entrée (rôle, scope),
 * le second juge ce qui dépend de la ressource chargée (département,
 * `MediaAccess`, irréversibilité).
 *
 * ## Ce que l'ordre garantit
 *
 * L'autorisation passe **avant** la validation, et l'invariant est déjà verrouillé
 * par les tests d'intégration existants : `POST` sans jeton → `401`, **jamais**
 * `400`. Une entrée invalide ne doit jamais être analysée avant que l'appelant
 * ait été identifié — sinon un message de validation détaillé devient un oracle
 * pour un appelant non authentifié.
 */

export {
  allow,
  authorize,
  deny,
  evaluate,
  type AuthorizationDecision,
  type Policy,
  type PolicyAction,
  type PolicyLike,
} from "./authorize";

export {
  createPolicy,
  departmentClause,
  listScopeFor,
  sweep,
  type ActionRule,
  type DepartmentClause,
  type DepartmentClauseMode,
  type DepartmentScopedResource,
  type DepartmentScopeFilter,
  type PolicyTable,
  type ResourcePolicy,
} from "./policy-kit";

export {
  PublicationPolicy,
  type PublicationPolicyResource,
} from "./publication.policy";

export {
  MediaPolicy,
  type MediaAccessRights,
  type MediaGrantTarget,
  type MediaPolicyResource,
} from "./media.policy";

export { EventPolicy, assertDepartmentRequired, type EventPolicyResource } from "./event.policy";

export { DepartmentPolicy, type DepartmentPolicyResource } from "./department.policy";

export { PagePolicy, type PagePolicyResource } from "./page.policy";

export { PrayerPolicy, type PrayerPolicyResource } from "./prayer.policy";

export {
  UserPolicy,
  asUserPolicyResource,
  assertSingleDepartment,
  type ProfileState,
  type UserPolicyResource,
} from "./user.policy";

export {
  MediaAccessPolicy,
  type MediaAccessPolicyResource,
} from "./media-access.policy";

export {
  NotificationPolicy,
  type NotificationPolicyResource,
  type NotificationType,
} from "./notification.policy";

export {
  AuditPolicy,
  type AuditPolicyResource,
  EditorialEntityPolicy,
  type EditorialEntityKind,
  type EditorialEntityPolicyResource,
  SchedulePolicy,
  ScripturePolicy,
  SiteSettingsPolicy,
} from "./pending-arbitration.policy";

import { AuditPolicy, EditorialEntityPolicy, SchedulePolicy, ScripturePolicy, SiteSettingsPolicy } from "./pending-arbitration.policy";
import { DepartmentPolicy } from "./department.policy";
import { EventPolicy } from "./event.policy";
import { MediaPolicy } from "./media.policy";
import { MediaAccessPolicy } from "./media-access.policy";
import { NotificationPolicy } from "./notification.policy";
import { PagePolicy } from "./page.policy";
import { PrayerPolicy } from "./prayer.policy";
import { PublicationPolicy } from "./publication.policy";
import { UserPolicy } from "./user.policy";

/**
 * Le catalogue, dans l'ordre de `docs/029` §4.1 et §4.6.
 *
 * P-01 à P-07 sont les sept policies **nommées** par `docs/024` §8 ; P-08 à P-14
 * sont celles que `docs/029` §4.6 ajoute parce que la matrice exige leurs
 * ressources — et dont l'arbitrage reste, pour cinq d'entre elles, à faire.
 *
 * L'ordre du tableau est celui des documents, et il est **significatif** : c'est
 * la liste que parcourt le test d'exhaustivité du catalogue, et donc l'ordre dans
 * lequel un refus oublié se signale.
 */
export const POLICY_CATALOGUE = [
  PublicationPolicy,
  MediaPolicy,
  EventPolicy,
  DepartmentPolicy,
  PagePolicy,
  PrayerPolicy,
  UserPolicy,
  MediaAccessPolicy,
  NotificationPolicy,
  AuditPolicy,
  EditorialEntityPolicy,
  ScripturePolicy,
  SchedulePolicy,
  SiteSettingsPolicy,
] as const;
