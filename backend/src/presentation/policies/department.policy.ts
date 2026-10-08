import type { DepartmentCapability } from "@/domain/departments/capabilities";
import { createPolicy } from "./policy-kit";

/**
 * `DepartmentPolicy` — P-04 de `docs/029` §4.1.
 *
 * Un département est **à la fois** une donnée éditoriale et une donnée
 * structurante, et la policy doit tenir les deux ensemble.
 *
 * - *Information métier* : nom, description, accroche, rythme de rencontre,
 *   responsable affiché, bannière. Un responsable édite la vitrine de **son**
 *   département — c'est le sens de D-02.
 * - *Propriétés structurelles* : existence du département, capacités, création,
 *   désactivation. `020` §11 les réserve aux rôles globaux, et c'est ce qui
 *   empêche un responsable de **s'octroyer** la portée globale d'un événement
 *   (`docs/029` §5.3 : « le vecteur d'escalade le plus direct du modèle »).
 *
 * **Le cas `DEACTIVATE` mérite une lecture attentive.** `docs/028` D-08 et
 * `028/Q-B3` laissent la désactivation et la suppression d'un département **non
 * tranchées**, et `docs/032` §3.1 pose la FK `admin_profiles.department_id →
 * departments.id` en `RESTRICT` : supprimer un département qui porte un
 * responsable est refusé par la base. Le refus ci-dessous n'est donc pas une
 * prudence isolée — il est cohérent avec le schéma, et il évite qu'une route
 * applicative contourne une contrainte que la base impose déjà.
 */

/** Vue d'un département telle que la policy a besoin de la connaître. */
export interface DepartmentPolicyResource {
  /**
   * Capacités portées par le département (`docs/032` §3.5).
   *
   * Présentes sur la ressource pour une raison précise : sans elles, la policy
   * ne pourrait pas distinguer un département capable de publier globalement
   * d'un autre — et retomberait sur une comparaison de nom, ce que D-25, D-09 et
   * l'invariant I12 de `021` §11 interdisent.
   */
  capabilities?: readonly DepartmentCapability[];
  /** `departments.id`, pour la clause départementale. */
  id: string;
}

export const DepartmentPolicy = createPolicy<DepartmentPolicyResource>("DepartmentPolicy", {
  /**
   * `canCreate` — `SUPER_ADMIN` `GLOBAL` · `ADMIN` `GLOBAL` (D-03, D-04).
   *
   * Créer un département, c'est créer un **périmètre d'autorisation** : un
   * `DEPARTMENT_MANAGER` qui pourrait en créer un s'ouvrirait un espace où il
   * serait seul maître. Le scope `GLOBAL` est donc explicitement exigé, en plus
   * du rôle.
   */
  CREATE: { roles: ["SUPER_ADMIN", "ADMIN"], scopes: ["GLOBAL"] },

  /**
   * `canRead` — `SUPER_ADMIN` · `ADMIN` · `MANAGER` (le sien) (D-02).
   *
   * Le lecteur public n'est pas concerné : la consultation publique des
   * départements passe par une route ouverte qui n'appelle aucune policy
   * administrative — il n'y a pas de rôle à juger.
   *
   * La ressource est jugée par son `id` comparé au rattachement de l'acteur :
   * `Department` n'a pas de champ `departmentId` puisqu'il **est** le
   * département. La clause départementale est donc exprimée ici, en mode
   * `"declared"`, via une comparaison explicite sur `id`.
   */
  READ: {
    roles: ["SUPER_ADMIN", "ADMIN", "DEPARTMENT_MANAGER"],
    resource: (admin, resource) =>
      isOwnDepartment(admin.departmentId, resource?.id)
        ? { allowed: true }
        : { allowed: false, reason: "Département hors du périmètre de rattachement (docs/028 D-02)" },
  },

  /**
   * `canUpdateBusinessInfo` — `SUPER_ADMIN` · `ADMIN` · `MANAGER` : Q-05 ouverte
   * sur l'étendue exacte des champs éditables par un responsable.
   *
   * La policy accorde l'action ; la **liste des champs** est une décision de
   * schéma de saisie (Lot 2), et elle n'est pas inventée ici. Ce partage est
   * volontaire : une policy qui énumérerait des champs deviendrait un formulaire
   * déguisé, et changer un libellé exigerait de rouvrir le RBAC.
   */
  UPDATE: {
    roles: ["SUPER_ADMIN", "ADMIN", "DEPARTMENT_MANAGER"],
    pending: "docs/029 Q-05 (champs métier éditables par un responsable)",
    resource: (admin, resource) =>
      isOwnDepartment(admin.departmentId, resource?.id)
        ? { allowed: true }
        : { allowed: false, reason: "Département hors du périmètre de rattachement (docs/028 D-02)" },
  },

  /**
   * `canUpdateStructuralProps` — `SUPER_ADMIN` · `ADMIN` ; **`MANAGER` :
   * `false`** (`020` §11).
   *
   * Les propriétés structurelles disent *ce qu'est* le département — son
   * existence, son rattachement, son ordre, sa visibilité ─ et non *ce qu'il
   * raconte*. Un responsable qui les modifierait pourrait se re-créer un
   * périmètre.
   */
  UPDATE_STRUCTURE: { roles: ["SUPER_ADMIN", "ADMIN"], scopes: ["GLOBAL"] },

  /**
   * `canDeactivate` / `canDelete` — **refus pour tous** : Q-B3 non tranchée
   * (D-08).
   *
   * Les deux lignes sont écrites en `roles: []` plutôt que laissées absentes, et
   * la nuance compte : une action absente tomberait dans le refus par défaut du
   * moteur, indiscernable d'une action jamais conçue. Ici, la ligne existe pour
   * porter la **question ouverte** — quiconque relit la table voit qu'une
   * décision manque, au lieu de conclure que le cas n'existe pas.
   */
  DEACTIVATE: { roles: [], pending: "docs/028 Q-B3 (désactivation d'un département)" },
  DELETE: { roles: [], pending: "docs/028 Q-B3 · D-08" },

  /**
   * `canEditCapabilities` — **refus pour tous** : Q-06 non tranchée (D-25).
   *
   * C'est le refus le plus important de ce fichier. `docs/029` §5.3 le dit sans
   * détour : « un responsable qui pourrait modifier les capacités de son propre
   * département s'attribuerait la portée globale : c'est le vecteur d'escalade
   * le plus direct du modèle ». Tant que Q-06 n'est pas arbitrée, personne
   * n'écrit dans `department_capabilities` — et `docs/032` §3.5 conserve
   * `granted_by` précisément pour que la première écriture soit attribuable.
   */
  EDIT_CAPABILITIES: { roles: [], pending: "docs/029 Q-06 · docs/032 Q-S6" },
});

/** Égalité de rattachement, tolérante à l'absence. */
function isOwnDepartment(actorDepartmentId: string | null, targetId: string | undefined): boolean {
  // Scope global : aucune contrainte de département (§4.3).
  if (actorDepartmentId === null) return true;
  if (!targetId) return false;
  return actorDepartmentId === targetId;
}
