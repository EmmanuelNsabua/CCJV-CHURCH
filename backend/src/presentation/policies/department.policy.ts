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
   * `canUpdateBusinessInfo` — `SUPER_ADMIN` · `ADMIN` ; **`MANAGER` : `?` Q-05**
   * → refus (`docs/029` §4.3, défaut `✘`).
   *
   * La cellule 2.3 est explicite sur le fondement du refus : « 028 **n'attribue
   * pas** la modification des informations d'un département à son responsable ».
   * Ce n'est donc pas une lacune à combler par commodité — c'est un pouvoir qui
   * n'a jamais été donné, et la policy ne le donne pas.
   *
   * La policy accorde l'action aux rôles globaux ; la **liste des champs**
   * éditables est une décision de schéma de saisie (Lot 2) et n'est pas inventée
   * ici. Ce partage est volontaire : une policy qui énumérerait des champs
   * deviendrait un formulaire déguisé, et changer un libellé exigerait de
   * rouvrir le RBAC.
   */
  UPDATE: {
    roles: ["SUPER_ADMIN", "ADMIN"],
    pending: "docs/029 Q-05 (informations métier d'un département par son responsable)",
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
   * `canDeactivate` — **refus pour tous** : Q-B3 non tranchée (D-08).
   *
   * La question ouverte ne porte plus que sur la **désactivation sans
   * suppression** : la suppression, elle, a été arbitrée (voir `DELETE`
   * ci-dessous). La ligne reste écrite en `roles: []` plutôt que laissée
   * absente, pour que la question reste visible : une action absente tomberait
   * dans le refus par défaut du moteur, indiscernable d'une action jamais
   * conçue.
   */
  DEACTIVATE: { roles: [], pending: "docs/028 Q-B3 (désactivation d'un département)" },

  /**
   * `canDelete` — **`SUPER_ADMIN` · `ADMIN`**, scope `GLOBAL` exigé
   * (cellule 2.6 ; arbitrage du commanditaire du 23/10/2026).
   *
   * Jusqu'ici la ligne était refusée **à tout le monde** au motif que Q-B3 était
   * ouverte. Or Q-B3 porte sur la *désactivation sans suppression* ; la
   * suppression n'avait été laissée en `?` que par association. Le résultat
   * était concret : le back-office propose « Archiver et supprimer », la route
   * `DELETE /departments/:idOrSlug` et `POST /departments/:idOrSlug/archive`
   * exigent cette action, et le serveur répondait `403` à `SUPER_ADMIN`
   * lui-même.
   *
   * Le garde-fou de **D-08** n'est pas dans la policy, il est dans
   * `DepartmentRepository.archiveAndDelete()` : l'instantané complet de la fiche
   * (champs, activités, responsables, références médias) est écrit dans
   * `department_archives` **dans la même transaction** que la suppression. La
   * conservation est donc vérifiable en base, pas seulement promise.
   *
   * Pourquoi `DEPARTMENT_MANAGER` reste exclu : sa ligne de `CREATE` exige déjà
   * `GLOBAL` parce que créer un département revient à créer un périmètre
   * d'autorisation. Supprimer est plus fort encore — le responsable effacerait
   * le périmètre auquel il est rattaché, et `archived_by` lui en attribuerait la
   * trace. Le rôle est donc absent, et le scope `GLOBAL` est exigé en plus du
   * rôle, exactement comme pour `CREATE`.
   */
  DELETE: { roles: ["SUPER_ADMIN", "ADMIN"], scopes: ["GLOBAL"] },

  /**
   * `canEditCapabilities` — **`SUPER_ADMIN` · `ADMIN`** (réponse du commanditaire).
   *
   * `docs/029` §5.3 signalait ce droit comme « le vecteur d'escalade le plus
   * direct du modèle » : un **responsable** qui pourrait modifier les capacités de
   * son propre département s'attribuerait la portée globale des événements. Le
   * risque n'est pas dans la capacité elle-même, il est dans **qui** l'édite — et
   * la réponse reçue (« c'est l'admin qui fait ces configurations ») désigne les
   * rôles globaux, jamais un responsable.
   *
   * La ligne est donc écrite pour ce qu'elle refuse autant que pour ce qu'elle
   * accorde : le `DEPARTMENT_MANAGER` en est **absent**, et il le restera même si
   * la table des capacités s'élargit — c'est la propriété qui compte, et
   * `docs/032` §3.5 conserve `granted_by` pour que chaque écriture reste
   * attribuable à son auteur.
   */
  EDIT_CAPABILITIES: {
    roles: ["SUPER_ADMIN", "ADMIN"],
    scopes: ["GLOBAL"],
  },
});

/** Égalité de rattachement, tolérante à l'absence. */
function isOwnDepartment(actorDepartmentId: string | null, targetId: string | undefined): boolean {
  // Scope global : aucune contrainte de département (§4.3).
  if (actorDepartmentId === null) return true;
  if (!targetId) return false;
  return actorDepartmentId === targetId;
}
