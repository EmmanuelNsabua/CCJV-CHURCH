import type { AdminProfile } from "@/domain/entities";
import { allow, deny, type AuthorizationDecision } from "./authorize";
import { createPolicy } from "./policy-kit";

/**
 * `MediaPolicy` — P-02 de `docs/029` §4.1.
 *
 * Deux décisions gouvernent tout ce fichier, et elles sont indissociables.
 *
 * **X27 / 021 §19 — il n'y a pas de `media.department_id`.** La bibliothèque est
 * **centrale** (D-22). Un média n'appartient donc à aucun département, et
 * aucune clause départementale ne s'applique à lui : c'est la raison pour
 * laquelle les lignes ci-dessous ne portent **aucun** `department`. Ce n'est pas
 * une omission — c'est la conséquence directe de X27. Le rattachement d'un média
 * à un département passerait par `media_access`, jamais par une colonne.
 *
 * **D-21 — les droits ne se déduisent pas.** « Le système d'autorisation teste
 * **explicitement** la permission demandée. » `USE`, `MANAGE` et `DELETE` sont
 * trois lignes indépendantes : posséder `USE` ne donne **pas** `MANAGE`, et
 * `MANAGE` ne donne **pas** `DELETE`. Le test N-18 de `docs/029` §6.2 vérifie
 * exactement ce cas. Toute factorisation qui dériverait un droit d'un autre —
 * un drapeau agrégé, un niveau, un ordinal — rouvrirait la faille que D-21
 * ferme, et `docs/032` §3.4 l'interdit aussi **en base** : trois colonnes
 * booléennes, aucun niveau. Le journal `media_access_mode` (`USE`, `MANAGE`,
 * `DELETE`) documente le vocabulaire et **ne sert pas** de colonne.
 */

/**
 * Vue d'un média telle que la policy a besoin de la connaître.
 *
 * La policy ne connaît **ni** `bucket`, **ni** `path`, **ni** `sizeBytes` : rien
 * de ce qui décrit le fichier n'intervient dans une décision d'autorisation.
 * `departmentId` est absent **par construction** (X27).
 *
 * `access` porte les droits explicitement accordés, tels qu'un service les
 * charge : c'est ce qui permet à la policy de juger `USE`/`MANAGE` sans lire la
 * base elle-même — une policy qui interroge la base n'est plus une fonction pure
 * et cesse d'être testable par table de cas.
 */
export interface MediaPolicyResource {
  /**
   * Droits accordés au département de l'acteur, s'il existe une ligne
   * `media_access` avec `grantee_type = 'DEPARTMENT'`. `undefined` = **aucun
   * partage** : « aucun partage de média par défaut » (XD-09, D-22).
   */
  departmentAccess?: MediaAccessRights;
  /** Droits accordés nommément au profil de l'acteur (`grantee_type = 'ADMIN_PROFILE'`). */
  profileAccess?: MediaAccessRights;
  /**
   * Cible d'un `GRANT_ACCESS`, lorsqu'il s'agit d'en **créer** un.
   *
   * Absente au moment du garde de route (aucune cible n'est encore chargée) ;
   * présente lorsque la décision porte sur l'instance. Même forme que le mode
   * `"declared"` de la clause départementale : une cible absente ne vaut pas
   * permission, elle vaut « décision différée à l'instance ».
   */
  grantTarget?: MediaGrantTarget;
}

/** Les trois droits **indépendants** d'un `MediaAccess` (`docs/032` §3.4). */
export interface MediaAccessRights {
  canUse: boolean;
  canManage: boolean;
  canDelete: boolean;
}

/**
 * Cible d'un `GRANT_ACCESS` — de quoi juger l'auto-attribution (XD-08).
 *
 * Le destinataire est **explicite** dans la ressource : c'est la seule façon de
 * tester « un responsable ne peut pas s'accorder lui-même un accès » sans que la
 * policy lise une base ni devine l'intention de l'appelant.
 */
export interface MediaGrantTarget {
  granteeType: "DEPARTMENT" | "ADMIN_PROFILE";
  granteeId: string;
  /** Droits demandés — un grant qui n'accorde rien est refusé (`docs/032` §3.4). */
  rights: MediaAccessRights;
}

export const MediaPolicy = createPolicy<MediaPolicyResource>("MediaPolicy", {
  /**
   * `canUpload` — `SUPER_ADMIN` · `ADMIN` · `MANAGER` (D-22).
   *
   * Aucune clause départementale : le média intégrera la bibliothèque centrale,
   * qui n'appartient à personne. Les types MIME et la taille maximale acceptés
   * sont **non tranchés** (`docs/028` Q-M4) et ne sont donc **pas** figés ici :
   * ce sont des règles de validation, pas d'autorisation, et `docs/032` §3.4
   * refuse explicitement d'inscrire ce `CHECK` au schéma pour ne pas trancher à
   * la place du commanditaire.
   */
  CREATE: { roles: ["SUPER_ADMIN", "ADMIN", "DEPARTMENT_MANAGER"] },

  /**
   * `canUse` — référencer le média dans un contenu.
   *
   * `SUPER_ADMIN` et `ADMIN` : accordé (D-22, ils détiennent les trois droits).
   * `DEPARTMENT_MANAGER` : accordé **si et seulement si** un `MediaAccess`
   * portant `can_use` existe pour **son** département. C'est la règle X18
   * reformulée : « une publication Ecodume ne peut pas référencer un média
   * réservé à Presse » devient « pas de droit `USE`, pas de référencement » —
   * sans que le nom d'aucun département n'apparaisse.
   */
  USE: {
    roles: ["SUPER_ADMIN", "ADMIN", "DEPARTMENT_MANAGER"],
    resource: (admin, resource) => requireRight(admin, resource, "canUse", "USE"),
  },

  /**
   * `canManage` — modifier la ressource média.
   *
   * Q-09 (« selon périmètre ») reste **ouverte** : le droit `MANAGE` d'un
   * département est celui que la ligne `media_access` porte explicitement, sans
   * que son étendue soit arbitrée plus finement. La policy ne l'élargit donc pas.
   */
  MANAGE: {
    roles: ["SUPER_ADMIN", "ADMIN", "DEPARTMENT_MANAGER"],
    pending: "docs/029 Q-09 (étendue de MANAGE pour un département)",
    resource: (admin, resource) => requireRight(admin, resource, "canManage", "MANAGE"),
  },

  /**
   * `canDelete` — **`DEPARTMENT_MANAGER` : `false`, toujours** (XD-07, D-21).
   *
   * Le refus n'est pas une ligne de table qu'une relecture pourrait adoucir : il
   * est confirmé **en base** par `media_access_department_no_delete`
   * (`docs/032` §3.4), « un grant à un DÉPARTEMENT ne peut JAMAIS porter
   * DELETE ». Le rôle est donc absent de cette ligne **et** la donnée ne peut
   * pas le lui accorder. Deux verrous, un seul effet.
   */
  DELETE: { roles: ["SUPER_ADMIN", "ADMIN"] },

  /**
   * `canReplace` — **non tranchée** (Q-10) → refus.
   *
   * Remplacer un binaire sans changer la ligne de média est un cas réel :
   * corriger une image déjà référencée par des contenus publiés. Mais
   * `docs/029` ne tranche ni qui y a droit, ni ce que deviennent les contenus
   * qui la référencent, ni si l'URL publique reste stable. Deviner ici
   * reviendrait à modifier rétroactivement des pages publiées — un pouvoir que
   * seule une décision explicite peut accorder.
   */
  REPLACE: { roles: [], pending: "docs/029 Q-10 (remplacement d'un média)" },

  /**
   * `canGrantAccess` — **`SUPER_ADMIN` · `ADMIN`**, `MANAGER` : `false` (D-22).
   *
   * D-22 : « L'`ADMIN` ou le `SUPER_ADMIN` accorde l'autorisation. » Le
   * responsable ne peut donc pas s'accorder lui-même un accès — c'est XD-08, et
   * la règle est confirmée **mot pour mot** par `docs/028`.
   *
   * L'auto-attribution est en outre refusée explicitement, y compris pour les
   * rôles qui détiennent le droit d'accorder : la règle existe comme **test**
   * même là où elle est déjà couverte par le rôle, afin qu'un élargissement
   * futur de la table ne la fasse pas disparaître silencieusement.
   */
  GRANT_ACCESS: {
    roles: ["SUPER_ADMIN", "ADMIN"],
    resource: (admin, resource) => {
      const target = resource?.grantTarget;
      if (!target) return allow();

      if (target.granteeType === "ADMIN_PROFILE" && target.granteeId === admin.id) {
        return deny(
          "Auto-attribution d'un MediaAccess : un grant ne peut pas se prendre soi-même pour destinataire (docs/028 XD-08, D-22)",
        );
      }

      const { rights } = target;
      if (!rights.canUse && !rights.canManage && !rights.canDelete) {
        return deny(
          "Un grant qui n'accorde aucun droit n'est pas une autorisation (docs/032 §3.4, media_access_at_least_one_right)",
        );
      }

      if (target.granteeType === "DEPARTMENT" && rights.canDelete) {
        return deny(
          "Un grant à un département ne peut jamais porter DELETE (docs/028 XD-07, D-21 — confirmé en base par media_access_department_no_delete)",
        );
      }

      return allow();
    },
  },

  /**
   * `canRevokeAccess` — retrait d'un `MediaAccess` : `SUPER_ADMIN` · `ADMIN`.
   *
   * `docs/029` §2.6 fait du retrait une action (`REVOKE`), sans en nommer les
   * titulaires. La symétrie avec `GRANT_ACCESS` est la seule lecture cohérente :
   * celui qui peut **donner** un droit est celui qui peut le **reprendre** —
   * l'inverse produirait un droit irrévocable, que `docs/028` D-14 contredit
   * (« accès futur immédiatement révoqué »). La dépendance est signalée comme
   * telle, faute d'arbitrage nommé.
   */
  REVOKE_ACCESS: {
    roles: ["SUPER_ADMIN", "ADMIN"],
    pending: "docs/029 §2.6 — symétrie avec GRANT_ACCESS, non nommée par 028",
  },
});

/**
 * Exige un droit **explicite** pour le département de l'acteur (D-21, D-22).
 *
 * Aucune déduction n'est possible entre les trois droits : la fonction ne teste
 * que celui qu'on lui demande, jamais un droit « supérieur ». Un droit personnel
 * (`profileAccess`) est également accepté : il a été accordé nommément par un
 * `ADMIN`, et le refuser obligerait à dupliquer un grant de département pour un
 * seul compte.
 */
function requireRight(
  admin: AdminProfile,
  resource: MediaPolicyResource | undefined,
  right: keyof MediaAccessRights,
  label: string,
): AuthorizationDecision {
  if (admin.role === "SUPER_ADMIN" || admin.role === "ADMIN") return allow();

  // Scope global inattendu sur un rôle départemental : intégrité du profil.
  if (admin.scope !== "DEPARTMENT" || !admin.departmentId) {
    return deny(
      "Droit média demandé sans périmètre départemental : aucune autorisation par défaut (docs/028 D-22, XD-09)",
    );
  }

  const granted = resource?.departmentAccess?.[right] === true || resource?.profileAccess?.[right] === true;
  if (!granted) {
    return deny(
      `Aucun MediaAccess ${label} explicite pour ce département : « aucun partage par défaut » (docs/028 D-22, XD-09)`,
    );
  }

  return allow();
}
