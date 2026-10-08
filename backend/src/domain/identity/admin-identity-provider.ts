/**
 * Port d'identité administrative.
 *
 * `docs/023` §6 nomme ce collaborateur `AuthProvider` et lui confie une seule
 * responsabilité : `createUser(identity)`. Il est déclaré ici, dans le domaine,
 * pour une raison que le projet applique partout ailleurs : le **service ne
 * connaît pas Supabase**. Une règle d'habilitation qui appellerait directement
 * `supabaseAdmin.auth.admin` deviendrait intestable sans réseau, et le jour où
 * le fournisseur d'identité changerait, la règle changerait avec lui.
 *
 * Ce que ce port ne fait **pas** : décider. Il n'existe ici ni rôle, ni
 * département, ni policy. `docs/006` §2.2 délègue à Supabase Auth la garde du
 * **secret** (mot de passe, jetons, sessions) ; tout le reste — qui a le droit
 * d'exister, avec quel rôle et sur quel périmètre — appartient à
 * `admin_profiles` et aux policies. La frontière est exactement celle-là :
 * Supabase sait *qu'un compte peut s'authentifier*, il ne sait pas *ce qu'il a
 * le droit de faire*.
 */

/** Identité transmise au fournisseur. Aucun rôle : ce n'est pas son affaire. */
export interface IdentityToCreate {
  /** Adresse de connexion. Unique chez le fournisseur. */
  email: string;
  /**
   * Mot de passe initial.
   *
   * Le fournisseur ne le conserve jamais en clair, et le backend ne le relit
   * jamais : il n'existe que le temps de l'appel.
   */
  password: string;
  /**
   * Marque l'adresse comme confirmée.
   *
   * Un compte créé **par un administrateur** ne peut pas attendre un clic dans
   * un courriel de confirmation : sans cette option, l'utilisateur devrait
   * confirmer une adresse que l'administrateur vient lui-même de saisir, et la
   * création resterait bloquée tant qu'il ne l'aurait pas fait.
   */
  emailConfirmed: boolean;
}

export interface CreatedIdentity {
  /** Identifiant chez le fournisseur — il devient `admin_profiles.id`. */
  id: string;
}

export interface AdminIdentityProvider {
  /**
   * Crée le compte d'authentification et renvoie son identifiant.
   *
   * Échoue si l'adresse est déjà prise : c'est le fournisseur qui est l'autorité
   * sur l'unicité des adresses, et cette erreur doit remonter comme un
   * `DUPLICATE_EMAIL` (409), jamais comme une panne.
   */
  createUser(identity: IdentityToCreate): Promise<CreatedIdentity>;

  /**
   * Désactive (`isActive = false`) ou réactive un compte.
   *
   * `docs/028` D-03 ne parle que de **désactivation** et de **révocation**,
   * jamais de suppression physique — et c'est cohérent avec le schéma, où
   * `media_access.granted_by` est en `RESTRICT` et où `audit_log.actor_user_id`
   * est en `SET NULL` « parce qu'un journal doit survivre » (`docs/032` §4.3).
   * Supprimer un compte rendrait inattribuables les autorisations qu'il a
   * accordées ; le désactiver les conserve tout en révoquant l'accès.
   *
   * La révocation doit être **immédiate** (D-14 étape 1) : un jeton déjà émis
   * reste cryptographiquement valide jusqu'à son expiration, et c'est
   * `requireAdmin` qui le rattrape à chaque requête en relisant `is_active`.
   * Le fournisseur, lui, doit refuser toute **nouvelle** authentification.
   */
  setActive(id: string, isActive: boolean): Promise<void>;

  /**
   * Supprime définitivement le compte d'authentification.
   *
   * **N'est pas une opération métier.** `docs/029` cellule 1.8 laisse la
   * suppression physique en `?` (Q-24) et `UserPolicy.DELETE` la refuse à tout le
   * monde. Cette méthode existe pour une seule situation : la **compensation**.
   * Si le profil applicatif n'a pas pu être écrit après la création du compte
   * d'authentification, on ne laisse pas derrière soi un utilisateur capable de
   * se connecter mais dépourvu de profil — donc systématiquement refusé à
   * l'usage, et impossible à recréer (l'adresse est prise). `scripts/create-admin.ts`
   * applique déjà exactement cette compensation.
   */
  deleteUser(id: string): Promise<void>;
}
