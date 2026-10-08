import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AdminIdentityProvider,
  CreatedIdentity,
  IdentityToCreate,
} from "@/domain/identity/admin-identity-provider";
import { DuplicateEmailError, InternalError } from "@/shared/errors/app-error";
import { logger } from "@/infrastructure/logger";

/**
 * Implémentation Supabase Auth du port d'identité.
 *
 * Le client est **injecté**, pas importé : c'est ce qui permet de monter ce
 * provider avec un double en test, et c'est aussi ce qui rend visible dans le
 * constructeur le fait qu'il détient un client à privilèges élevés
 * (`service_role`, qui contourne les Row Level Security).
 *
 * `docs/004` §33 interdit que ce client atteigne le navigateur ; il ne quitte
 * donc jamais ce processus, et aucune de ces méthodes n'est exposée par une
 * route publique.
 */
export class SupabaseAdminIdentityProvider implements AdminIdentityProvider {
  constructor(private readonly supabase: SupabaseClient) {}

  async createUser(identity: IdentityToCreate): Promise<CreatedIdentity> {
    const { data, error } = await this.supabase.auth.admin.createUser({
      email: identity.email,
      password: identity.password,
      email_confirm: identity.emailConfirmed,
    });

    if (error) {
      const status = "status" in error ? error.status : undefined;

      // 422 est la réponse de Supabase pour une adresse déjà enregistrée. Elle
      // est traduite en **conflit métier** (409) plutôt qu'en panne : c'est une
      // situation que l'administrateur peut corriger lui-même en changeant
      // d'adresse, et un `500` le lui cacherait.
      if (status === 422 || /already|registered|exists/i.test(error.message)) {
        throw new DuplicateEmailError();
      }

      logger.error({ err: error }, "Création du compte d'authentification refusée");
      throw new InternalError(
        "Le compte d'authentification n'a pas pu être créé",
      );
    }

    const id = data.user?.id;
    if (!id) {
      // Sans identifiant, aucune ligne `admin_profiles` ne peut être écrite :
      // mieux vaut un échec net qu'un succès partiel inexploitable.
      logger.error({ email: identity.email }, "Compte créé sans identifiant");
      throw new InternalError(
        "Le fournisseur d'identité n'a pas renvoyé d'identifiant",
      );
    }

    return { id };
  }

  /**
   * Désactive ou réactive un compte.
   *
   * Deux mécanismes sont appliqués ensemble, et aucun n'est redondant :
   *
   * - `ban_duration` refuse les **nouvelles** authentifications ;
   * - le drapeau `is_active` de `admin_profiles` révoque l'usage des **jetons
   *   déjà émis**, que `requireAdmin` relit à chaque requête.
   *
   * Le second est indispensable : un jeton d'accès reste valide jusqu'à son
   * expiration, et bannir un compte sans toucher au profil laisserait un accès
   * utilisable pendant toute cette fenêtre — exactement ce que D-14 étape 1
   * interdit (« accès futur immédiatement révoqué »).
   *
   * `"none"` (et non `undefined`) lève le bannissement : c'est la valeur
   * documentée par Supabase pour une réactivation.
   */
  async setActive(id: string, isActive: boolean): Promise<void> {
    const { error } = await this.supabase.auth.admin.updateUserById(id, {
      ban_duration: isActive ? "none" : "876000h",
    });

    if (error) {
      // Un utilisateur absent côté fournisseur n'est pas une panne : le profil
      // peut survivre à un compte d'authentification supprimé, et l'état du
      // profil reste alors l'autorité. On le signale sans faire échouer.
      if ("status" in error && error.status === 404) {
        logger.warn(
          { userId: id },
          "Compte d'authentification introuvable : seul le profil a été modifié",
        );
        return;
      }

      logger.error({ err: error, userId: id }, "Changement d'état du compte refusé");
      throw new InternalError(
        "L'état du compte d'authentification n'a pas pu être modifié",
      );
    }
  }

  async deleteUser(id: string): Promise<void> {
    const { error } = await this.supabase.auth.admin.deleteUser(id);

    if (error) {
      // La compensation est une tentative de dernière chance : si elle échoue,
      // le compte orphelin est signalé — jamais masqué, jamais transformé en
      // succès. Il devra être supprimé à la main, et l'exploitant doit le savoir.
      logger.error(
        { err: error, userId: id },
        "Compensation impossible : compte d'authentification orphelin à supprimer manuellement",
      );
      throw new InternalError(
        "Le compte d'authentification n'a pas pu être supprimé",
      );
    }
  }
}
