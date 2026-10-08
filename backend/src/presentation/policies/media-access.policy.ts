import { MediaPolicy, type MediaGrantTarget } from "./media.policy";
import { createPolicy } from "./policy-kit";

/**
 * `MediaAccessPolicy` — P-08 de `docs/029` §4.1 et §4.6, **policy non nommée par
 * `docs/024` §8**.
 *
 * ### Pourquoi elle existe
 *
 * `docs/024` §11 distingue trois ressources — `Media`, `MediaAccess`,
 * `StorageObject` — mais ne nomme qu'une policy, `MediaPolicy`. Or `MediaAccess`
 * est une **ressource à part entière** de la matrice `docs/029` §2.6, avec ses
 * propres actions : `GRANT`, `UPDATE`, `REVOKE`, et le cas particulier de
 * l'auto-attribution. `docs/029` §4.6 signale explicitement que sa création
 * « n'est pas arbitrée par 028 », en laissant ouverte la possibilité que les
 * règles restent dans `MediaPolicy.canGrantAccess`.
 *
 * Cette policy existe donc **parce que la ressource existe**, et elle se limite
 * strictement à ce que la ressource ajoute : juger un **droit d'accès** — qui le
 * détient, sur quel média, et pour quel département. Elle ne juge **aucune**
 * propriété du média lui-même.
 *
 * ### Aucune règle recopiée
 *
 * `docs/029` §4.2 interdit qu'une règle soit recopiée d'un endroit à l'autre.
 * `GRANT_ACCESS` et `REVOKE_ACCESS` **délèguent** donc à `MediaPolicy` au lieu de
 * redire D-22 : une seconde formulation de « seul l'`ADMIN` ou le
 * `SUPER_ADMIN` accorde l'autorisation » finirait par diverger de la première, et
 * rien ne signalerait laquelle fait foi. Ce fichier ne possède que les règles
 * que `MediaPolicy` **ne peut pas** porter, parce qu'elles portent sur la ligne
 * de droit elle-même.
 */

/** Vue d'une ligne `media_access` (`docs/032` §3.4). */
export interface MediaAccessPolicyResource {
  /** `media_access.grantee_type` : département ou profil nommément désigné. */
  granteeType: "DEPARTMENT" | "ADMIN_PROFILE";
  /** `media_access.grantee_id` — colonne polymorphe, sans FK (§4.3, Q-S4). */
  granteeId: string;
  /** Les trois droits indépendants, jamais hiérarchisés (D-21). */
  canUse: boolean;
  canManage: boolean;
  canDelete: boolean;
}

export const MediaAccessPolicy = createPolicy<MediaAccessPolicyResource>(
  "MediaAccessPolicy",
  {
    /**
     * `canRead` — lecture des autorisations existantes : `SUPER_ADMIN` ·
     * `ADMIN` seulement (cellule 6.1) ; **`MANAGER` : `?` Q-11** → refus.
     *
     * Le refus n'isole pas le responsable : la cellule 5.2 lui ouvre le
     * **registre des médias** pour les médias où un droit existe. Il sait donc ce
     * qu'il peut utiliser, sans lire la table des autorisations elle-même — qui
     * décrit aussi, en creux, ce que **d'autres** départements peuvent utiliser.
     * C'est cette seconde information que Q-11 laisse ouverte.
     */
    READ: {
      roles: ["SUPER_ADMIN", "ADMIN"],
      pending: "docs/029 Q-11 (lecture des autorisations par un responsable)",
    },

    /**
     * `canUpdate` — modification des trois droits d'une ligne existante :
     * `SUPER_ADMIN` · `ADMIN` seulement.
     *
     * Modifier un droit, c'est **redistribuer** une autorisation — la même
     * opération que `GRANT`, à une ligne près. L'accorder à un responsable
     * rouvrirait D-22 par la porte de derrière : il ne pourrait pas *créer* le
     * droit, mais pourrait l'élargir. Le refus est donc le même que pour
     * `GRANT_ACCESS`, et pour la même raison.
     */
    UPDATE: { roles: ["SUPER_ADMIN", "ADMIN"] },

    /**
     * `canGrantAccess` — **délégué à `MediaPolicy`** (D-22, XD-08).
     *
     * Le droit de créer une autorisation est une décision sur le **média**
     * (`MediaPolicy`), pas sur la ligne de droit qui n'existe pas encore. La
     * délégation évite la duplication **et** garantit que les deux portes
     * d'entrée appliquent la même règle — y compris le refus d'auto-attribution,
     * qui est XD-08 « repris mot pour mot par 028 ».
     */
    GRANT_ACCESS: {
      roles: ["SUPER_ADMIN", "ADMIN", "DEPARTMENT_MANAGER"],
      resource: (admin, resource) => {
        // Aucune cible chargée (garde de route) : la décision de type est prise
        // sur le média, sans instance à juger. Fabriquer ici une cible vide
        // ferait refuser un ADMIN au titre d'un « grant qui n'accorde rien » —
        // alors que rien n'a encore été demandé.
        if (!resource) return MediaPolicy.can(admin, "GRANT_ACCESS");

        const target: MediaGrantTarget = {
          granteeType: resource.granteeType,
          granteeId: resource.granteeId,
          rights: {
            canUse: resource.canUse,
            canManage: resource.canManage,
            canDelete: resource.canDelete,
          },
        };
        return MediaPolicy.can(admin, "GRANT_ACCESS", { grantTarget: target });
      },
    },

    /**
     * `canRevokeAccess` — **délégué à `MediaPolicy`**, pour la même raison.
     *
     * Le retrait suit la symétrie posée dans `MediaPolicy.canRevokeAccess`
     * (`docs/029` §2.6, non nommée par 028) : celui qui peut donner peut
     * reprendre.
     */
    REVOKE_ACCESS: {
      roles: ["SUPER_ADMIN", "ADMIN", "DEPARTMENT_MANAGER"],
      resource: (admin) => MediaPolicy.can(admin, "REVOKE_ACCESS"),
    },
  },
  /**
   * **XD-08 — un `DEPARTMENT_MANAGER` ne peut jamais s'accorder à lui-même un
   * accès.**
   *
   * La règle est écrite **deux fois**, ici et dans `MediaPolicy`. Ce n'est pas
   * une contradiction avec « aucune règle recopiée » : c'est la seule exception
   * assumée, et elle est documentée comme telle. La raison est que les deux
   * policies sont deux **portes d'entrée distinctes** sur la même opération, et
   * qu'un refus absolu doit tenir même si l'une des deux tables était élargie
   * par erreur. Une exclusion évaluée avant la table est le seul endroit où un
   * « jamais » de `docs/028` survit à une relecture distraite.
   */
  (admin, resource) =>
    admin.role === "DEPARTMENT_MANAGER" && resource?.granteeType === "ADMIN_PROFILE" && resource.granteeId === admin.id
      ? "docs/028 XD-08, D-22 : un DEPARTMENT_MANAGER ne peut jamais s'accorder à lui-même un MediaAccess"
      : null,
);
