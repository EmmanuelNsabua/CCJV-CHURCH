import type { AdminProfile } from "@/domain/entities";
import { allow, deny, type AuthorizationDecision } from "./authorize";
import { createPolicy, type DepartmentScopedResource } from "./policy-kit";

/**
 * `PublicationPolicy` — P-01 de `docs/029` §4.1.
 *
 * **Ce que D-06 a changé.** La V1 concevait un responsable départemental dont
 * les contenus étaient *validés* par l'`ADMIN` avant publication. D-06 supprime
 * cette validation préalable : « le responsable publie directement ». La
 * conséquence est structurelle — il n'existe **aucune** étape d'approbation dans
 * cette policy, et il ne doit jamais en apparaître une : un `canPublish` qui
 * exigerait un état intermédiaire contredirait D-06.
 *
 * Ce que l'`ADMIN` conserve (règle X15, modifiée) : modification, archivage,
 * suppression — sur **tous** les départements, parce que son scope est `GLOBAL`.
 *
 * **Ce que cette policy ne décide pas.** La règle des 3 (`docs/035`) : « trois
 * `PUBLISHED` au maximum, tous départements confondus ; la quatrième archive la
 * plus ancienne (`published_at ASC, id ASC`) ». Elle n'est **pas** ici, et ce
 * n'est pas un oubli : elle est *transactionnelle* et *concurrente*. Une policy
 * juge une intention ; le plafond dépend de l'état de la table au moment du
 * `COMMIT`, sous verrou. La placer ici la rendrait vulnérable à une course entre
 * deux publications simultanées — le cas exact que `docs/026` §Lot 4 exige de
 * traiter « transactionnellement et sûrement en concurrence ». Le service de
 * publication (Lot 4) en est seul responsable.
 */

/**
 * Cycle de vie d'une publication **tel que la policy doit le juger**.
 *
 * Trois états, conformément à `docs/032` §3.2 (D-18, D-20) — et non les deux que
 * porte aujourd'hui l'énumération PostgreSQL. La distinction est délibérée : une
 * policy juge une **intention sur une cible**, pas l'état d'une colonne. La
 * valeur `'ARCHIVED'` s'ajoute par `ALTER TYPE … ADD VALUE` au Lot 4 (elle ne se
 * retire jamais) ; en attendant, aucune ligne de code n'écrit `ARCHIVED` — le
 * type le permet, la base ne l'a pas encore, et aucun chemin ne l'emprunte.
 *
 * Écrire ici la forme **cible** plutôt que la forme actuelle évite le piège
 * inverse : une policy qui ignorerait `ARCHIVED` accorderait silencieusement des
 * actions sur des publications archivées le jour où la migration passe — un
 * défaut qui n'apparaîtrait qu'en production, sur les données de la règle des 3.
 */
export type PublicationLifecycleState = "DRAFT" | "PUBLISHED" | "ARCHIVED";

/** Vue d'une publication telle que la policy a besoin de la connaître. */
export interface PublicationPolicyResource extends DepartmentScopedResource {
  /**
   * État courant de la publication.
   *
   * Optionnel **pour une seule raison** : à la création, aucune publication
   * n'existe encore et l'état initial n'est pas une entrée mais une
   * conséquence — il est décidé par le service (Lot 4) selon que la publication
   * est mise en ligne ou enregistrée en brouillon. Pour toute action portant sur
   * une instance (`UPDATE`, `DELETE`, `PUBLISH`, `ARCHIVE`), le service charge
   * la ligne complète : un `status` absent y serait un défaut d'appel, et la
   * garde `refuseIfArchived` laisse alors passer — c'est le prix assumé d'un
   * type qui décrit aussi bien une cible qu'une instance, et il est couvert par
   * le mode `"equality"` de la clause départementale, qui refuse toute
   * ressource non chargée.
   */
  status?: PublicationLifecycleState;
}

export const PublicationPolicy = createPolicy<PublicationPolicyResource>(
  "PublicationPolicy",
  {
    /**
     * `canCreate` — `SUPER_ADMIN` `GLOBAL` · `ADMIN` `GLOBAL` ·
     * `DEPARTMENT_MANAGER` `DEPARTMENT` (**département forcé**).
     *
     * Mode `"declared"` : une cible absente est admise, car le département est
     * *forcé depuis le profil* par la couche applicative. Une cible **présente**
     * est jugée strictement — c'est l'exigence N-10 : « `POST` publication avec
     * `department_id` d'un autre département dans le corps → refus ; le
     * département vient du **profil**, jamais du corps ». Accepter le corps
     * reviendrait à laisser choisir son périmètre à celui qui agit.
     */
    CREATE: {
      roles: ["SUPER_ADMIN", "ADMIN", "DEPARTMENT_MANAGER"],
      department: "declared",
    },

    /**
     * `canRead` — Q-P4 de `docs/028` reste **ouverte** sur le périmètre de
     * lecture du responsable.
     *
     * La lecture de collection d'un responsable est **bornée en requête** par
     * `listScope` : il ne peut pas énumérer les publications d'un autre
     * département, si bien que la question ouverte ne peut pas devenir une fuite.
     * Une ressource **présente** est jugée par l'égalité départementale.
     */
    READ: {
      roles: ["SUPER_ADMIN", "ADMIN", "DEPARTMENT_MANAGER"],
      department: "declared",
      pending: "docs/028 Q-P4",
    },

    /**
     * `canReadDraft` — même périmètre que `canRead`.
     *
     * Séparer les deux actions n'est pas redondant : le brouillon d'un
     * département n'est pas public, et une action distincte permet de refuser un
     * brouillon sans refuser la lecture d'une publication en ligne. Les deux
     * lignes partagent aujourd'hui la même décision ; elles peuvent diverger sans
     * qu'une route change d'action.
     */
    READ_DRAFT: {
      roles: ["SUPER_ADMIN", "ADMIN", "DEPARTMENT_MANAGER"],
      department: "declared",
      pending: "docs/028 Q-P4",
    },

    /**
     * `canUpdate` — `SUPER_ADMIN` · `ADMIN` · `MANAGER` si `department_id` égal
     * (D-06).
     *
     * Mode `"equality"` : la ressource est chargée, une ressource **sans
     * département vaut refus** (`docs/029` §4.3). `Publication.department_id`
     * est `NOT NULL` au lot 4 : ce refus ne se produira pas, et c'est voulu — il
     * transforme une donnée manquante en refus plutôt qu'en accès.
     */
    UPDATE: {
      roles: ["SUPER_ADMIN", "ADMIN", "DEPARTMENT_MANAGER"],
      department: "equality",
      resource: refuseIfArchived,
    },

    /**
     * `canDelete` — `SUPER_ADMIN` · `ADMIN`. **`DEPARTMENT_MANAGER` : Q-07**,
     * non tranchée → refus (`docs/029` §4.3, défaut `✘`).
     */
    DELETE: {
      roles: ["SUPER_ADMIN", "ADMIN"],
      department: "equality",
      pending: "docs/029 Q-07 (suppression de publication par un responsable)",
      resource: refuseIfArchived,
    },

    /** `canPublish` — **sans validation** (D-06). */
    PUBLISH: {
      roles: ["SUPER_ADMIN", "ADMIN", "DEPARTMENT_MANAGER"],
      department: "equality",
      resource: refuseIfArchived,
    },

    /** `canArchive` — D-18 : `PUBLISHED → ARCHIVED`, irréversible. */
    ARCHIVE: {
      roles: ["SUPER_ADMIN", "ADMIN", "DEPARTMENT_MANAGER"],
      department: "equality",
      resource: (admin, resource) => {
        const archived = refuseIfArchived(admin, resource);
        if (!archived.allowed) return archived;
        if (resource?.status !== "PUBLISHED") {
          return deny(
            "Seule une publication PUBLISHED peut être archivée : docs/028 D-18 ne définit que la transition PUBLISHED → ARCHIVED",
          );
        }
        return allow();
      },
    },

    /**
     * `canUnarchive` — **`false` pour tout le monde** (D-18, XD-14).
     *
     * La ligne existe pour être **lue**, pas pour être utile : un
     * `roles: []` inscrit noir sur blanc qu'aucun rôle — pas même le
     * `SUPER_ADMIN` — ne rouvre une publication archivée. Le retrait de cette
     * ligne ferait retomber `UNARCHIVE` sur le refus par défaut du moteur, si
     * bien que la règle cesserait d'être explicite et deviendrait une
     * conséquence du silence.
     */
    UNARCHIVE: {
      roles: [],
      pending: "docs/028 D-18 — refus structurel, non une question ouverte",
    },
  },
);

/**
 * Une publication archivée n'est plus modifiable ni supprimable.
 *
 * `docs/028` D-18 et D-20 font d'`ARCHIVED` un **état métier persistant** : ce
 * n'est ni une suppression, ni un filtre d'affichage. Modifier un contenu archivé
 * changerait rétroactivement un texte qui a été public ; le supprimer
 * anéantirait précisément la persistance que D-20 exige. Le refus ne s'appuie
 * donc pas sur une permission manquante mais sur la **nature** de l'état —
 * c'est un `resourceAllows` de `docs/029` §4.3.
 */
function refuseIfArchived(
  _admin: AdminProfile,
  resource: PublicationPolicyResource | undefined,
): AuthorizationDecision {
  if (resource?.status === "ARCHIVED") {
    return deny(
      "Publication ARCHIVED : état persistant et irréversible (docs/028 D-18, D-20) — refus par défaut (docs/029 §4.3)",
    );
  }
  return allow();
}
