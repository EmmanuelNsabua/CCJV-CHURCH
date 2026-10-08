import type { AdminProfile } from "@/domain/entities";
import { allow, deny, type AuthorizationDecision } from "./authorize";
import { createPolicy } from "./policy-kit";

/**
 * `PrayerPolicy` — P-06 de `docs/029` §4.1. **La policy la plus sensible du
 * système.**
 *
 * ### Le refus fondateur
 *
 * Le `SUPER_ADMIN` « possède tous les pouvoirs du système » — sauf un, et c'est
 * le plus intime : **il ne peut rien savoir des demandes de prière**. Ni le
 * texte, ni le nom, ni **le nombre**, ni les dates, ni les notifications, ni les
 * métadonnées. `docs/028` D-10 est sans nuance : « Pour lui, le domaine
 * `PrayerRequest` est **fonctionnellement inexistant**. »
 *
 * Ce refus est écrit **en premier**, avant toute table, via le paramètre
 * `excludedReason` du moteur. Ce n'est pas un détail de style. Placé en premier,
 * il **ne peut pas être défait** par l'ajout d'une ligne plus permissive : la
 * table des rôles peut évoluer, la fonction d'exclusion est évaluée avant elle.
 * Un refus de fond rangé parmi les règles ordinaires finit toujours par être
 * déplacé, puis oublié.
 *
 * ### Pourquoi ce n'est pas une simple policy
 *
 * D-03 l'exige « **cryptographiquement**, pas seulement par une policy ». Cette
 * policy est donc **nécessaire et non suffisante**, et la différence est
 * vérifiable :
 *
 * - `docs/029` §4.4 fixe l'ordre contractuel
 *   `Request → Auth → PrayerPolicy → DENY/ALLOW → Repository → CryptoService` :
 *   le déchiffrement n'est **jamais atteint** après un refus de policy.
 * - `docs/028` D-11 : « **Pas de clé maître unique accessible au backend** ».
 *   Le `SUPER_ADMIN` ne peut donc pas lire un contenu en clair même s'il
 *   modifiait cette policy ou accédait directement à la base : il n'existe aucun
 *   secret à lui donner. `docs/032` §5.3 place les données dans le schéma
 *   `prayer_private`, et la frontière de privilèges est franchie par une clé
 *   enveloppée, pas par un rôle.
 * - `docs/030` A11 : **aucun** événement `PRAYER_*` n'apparaît dans
 *   `public.audit_log` — le registre public est lisible par le `SUPER_ADMIN`.
 *   `prayer_private.prayer_audit_event` est un registre **disjoint**, qui résout
 *   la contradiction entre D-03 (journaux d'audit complets) et D-10 (aucune
 *   métadonnée de prière).
 *
 * Autrement dit : cette policy **documente** le refus, et la cryptographie le
 * **garantit**. Si les deux divergeaient un jour, c'est la cryptographie qui
 * aurait raison — et le test `N-05` de `docs/029` §6.2 (« contexte
 * `SUPER_ADMIN`, aucun chemin d'appel, aucune clé ») est là pour le constater.
 *
 * ### « Aucun compteur, aucune liste vide »
 *
 * Une liste vide n'est pas neutre : elle **révèle** qu'il n'y a rien. Un compteur
 * à zéro, une date de dernière mise à jour, un code `404` au lieu d'un `403`
 * fuient tous une information. `docs/029` §4.5 le formule comme une règle de
 * non-fuite : « Un refus d'autorisation ne doit **jamais** divulguer l'existence,
 * le volume ou la date d'une donnée privée » — d'où le `403` constant, et
 * l'interdiction corollaire, pour toute couche en aval, de renvoyer une
 * collection vide porteuse d'un `total: 0`.
 */

/** Vue d'une demande de prière telle que la policy a besoin de la connaître. */
export interface PrayerPolicyResource {
  /**
   * Identifiants des profils pour lesquels une **clé enveloppée** existe
   * (`prayer_private.data_key_envelope`, `docs/030` §3.6).
   *
   * C'est la matérialisation de D-11 dans la couche d'autorisation : « seul
   * l'`ADMIN` **autorisé** déchiffre ». Un `ADMIN` sans enveloppe voit la policy
   * refuser `DECRYPT` — et la couche cryptographique refuserait de toute façon,
   * faute de clé. Le doublon est voulu : la policy explique, la crypto garantit.
   */
  envelopeRecipientIds?: readonly string[];
}

export const PrayerPolicy = createPolicy<PrayerPolicyResource>(
  "PrayerPolicy",
  {
    /**
     * `canSubmit` — **le public uniquement** (021 §12.3).
     *
     * Ligne à `roles: []`, et elle est **volontairement vide de rôles** : la
     * soumission d'une intention de prière est un acte de visiteur, pas un acte
     * d'administration. Le test N-07 de `docs/029` §6.2 vérifie exactement ce
     * refus : « `ADMIN` / `SUPER_ADMIN` / `MANAGER` → `403` (soumission réservée
     * au visiteur) ».
     *
     * La route publique n'appelle d'ailleurs **aucune** policy : elle n'a pas
     * d'identité administrative à juger, et son contrôle est le rate limiting
     * (Lot 8). Cette ligne existe pour rendre l'asymétrie lisible : un compte
     * administratif n'utilise pas la voie publique pour déposer une demande,
     * précisément parce qu'il en verrait ensuite les métadonnées.
     */
    SUBMIT: { roles: [], pending: "021 §12.3 — soumission réservée au visiteur" },

    /**
     * `canRead` / `canReadAggregate` — **`ADMIN` uniquement**.
     *
     * `SUPER_ADMIN` : refusé par l'exclusion ci-dessus (D-10).
     * `DEPARTMENT_MANAGER` : refusé, et la raison n'est pas hiérarchique —
     * une demande de prière n'appartient à **aucun** département
     * (`prayer_private.prayer_request` ne porte pas de `department_id` : le
     * rattachement serait une métadonnée de plus). Le responsable n'a donc aucun
     * titre à en connaître l'existence, et le test N-06 le constate.
     *
     * `READ_AGGREGATE` est une action **distincte** de `READ`, et non un
     * synonyme : D-10 refuse au `SUPER_ADMIN` le **nombre** autant que le texte,
     * donc la voie « je ne montre pas les contenus, seulement le total » est
     * fermée par la même exclusion. Séparer les deux actions rend ce refus
     * testable indépendamment — c'est N-03 (« `?limit=1`, métadonnée `total`,
     * aucune requête SQL émise »).
     */
    READ: { roles: ["ADMIN"], scopes: ["GLOBAL"] },
    READ_AGGREGATE: { roles: ["ADMIN"], scopes: ["GLOBAL"] },

    /**
     * `canValidate` — marquer une demande comme prise en charge (021 §12.3, I8).
     *
     * `ADMIN` seul, pour la même raison que la lecture : on ne peut pas traiter
     * ce qu'on n'a pas le droit de lire.
     */
    VALIDATE: { roles: ["ADMIN"], scopes: ["GLOBAL"] },

    /**
     * `canDecrypt` — `ADMIN` **autorisé**, c'est-à-dire porteur d'une clé
     * enveloppée pour **cette** demande (D-11).
     *
     * Le refus n'est donc pas fonction du rôle mais d'une **clé** : un `ADMIN`
     * sans enveloppe est refusé, exactement comme un autre rôle. C'est la seule
     * policy du catalogue dont la décision dépende d'une donnée cryptographique,
     * et c'est la traduction directe de « le déchiffrement n'est jamais une
     * opération disponible simplement parce que l'utilisateur possède un rôle
     * administratif élevé » (024 §9).
     */
    DECRYPT: {
      roles: ["ADMIN"],
      scopes: ["GLOBAL"],
      resource: (admin, resource) => {
        const recipients = resource?.envelopeRecipientIds ?? [];
        if (!recipients.includes(admin.id)) {
          return deny(
            "Aucune clé enveloppée pour ce profil sur cette demande : le déchiffrement n'est pas un droit du rôle (docs/028 D-11)",
          );
        }
        return allow();
      },
    },

    /**
     * `canDelete` — **refus pour tous** : Q-19 non tranchée, et la purge
     * automatique est `false` (D-16).
     *
     * D-16 porte une double interdiction, et la seconde est la plus importante :
     * « aucune purge automatique des demandes de prière, et **aucune durée
     * arbitraire inventée** ». Rien dans la documentation ne dit combien de temps
     * une intention de prière est conservée. Inventer « 90 jours » serait
     * exactement le genre de décision qui n'appartient pas à l'implémentation —
     * elle détruirait des données que quelqu'un a confiées à l'église, sur la
     * base d'un chiffre que personne n'a validé.
     *
     * La suppression manuelle (Q-19) est donc refusée **en attendant** un
     * arbitrage, et non oubliée : `docs/029` §4.5 exige qu'un refus soit rendu
     * par une policy, jamais par une erreur `500` ni par un silence.
     */
    DELETE: { roles: [], pending: "docs/029 Q-19 · docs/028 D-16 (aucune durée arbitraire)" },

    /** `canPurge` — purge automatique : **`false`** (D-16, XD-16). */
    ARCHIVE: { roles: [], pending: "docs/028 D-16, XD-16 — refus structurel" },
  },
  /**
   * **L'exclusion fondatrice (D-10, X19, XD-01).**
   *
   * Évaluée avant la table : elle porte sur l'**acteur**, pas sur l'action, et
   * elle est donc vraie pour `READ`, `READ_AGGREGATE`, `VALIDATE`, `DECRYPT`,
   * `DELETE` — pour toute action présente ou **future**. Ajouter demain une
   * action à cette policy ne peut pas rouvrir le domaine au `SUPER_ADMIN`, ce
   * qui est précisément la propriété qu'on veut d'un refus de fond.
   */
  (admin: AdminProfile): string | null =>
    admin.role === "SUPER_ADMIN"
      ? "docs/028 D-10 : le domaine PrayerRequest est fonctionnellement inexistant pour le SUPER_ADMIN — ni contenu, ni nom, ni nombre, ni dates, ni métadonnées (X19, XD-01)"
      : null,
);
