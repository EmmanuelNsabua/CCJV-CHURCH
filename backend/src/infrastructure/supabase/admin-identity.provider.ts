import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AdminIdentityProvider,
  CreatedIdentity,
  IdentityToCreate,
} from "@/domain/identity/admin-identity-provider";
import {
  DuplicateEmailError,
  InternalError,
  NotFoundError,
} from "@/shared/errors/app-error";
import { logger } from "@/infrastructure/logger";

/** Bornes de la lecture d'adresses (`findEmails`) : 4 pages de 200 comptes. */
const MAX_LISTED_USER_PAGES = 4;

/**
 * L'erreur du fournisseur dit-elle « adresse déjà prise » ?
 *
 * Supabase répond `422` pour une adresse déjà enregistrée ; le message est
 * vérifié en second recours, car cette bibliothèque a déjà changé de statut
 * selon les versions.
 */
function isDuplicateEmail(error: {
  message: string;
  status?: number | undefined;
}): boolean {
  return error.status === 422 || /already|registered|exists/i.test(error.message);
}

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
      // `isDuplicateEmail` couvre le statut **et** le message : cette
      // bibliothèque a déjà changé de code selon les versions.
      if (isDuplicateEmail(error)) {
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

  /**
   * Remplace l'adresse de connexion.
   *
   * `email_confirm: true` est aligné sur la création : l'adresse est saisie et
   * assumée par un administrateur, exiger du titulaire qu'il confirme une
   * adresse qu'il n'a pas choisie bloquerait le compte sans rien protéger.
   *
   * ⚠️ Ce choix est une **hypothèse d'implémentation**, pas une règle du
   * dépôt : si la configuration Supabase du projet impose une double
   * confirmation, `updateUserById` produira une adresse en attente et la
   * connexion continuera de se faire avec l'ancienne jusqu'à validation. Le
   * compte rendu le signale ; l'interface ne prétend pas que le changement est
   * actif tant que le fournisseur ne l'a pas dit.
   */
  async updateEmail(id: string, email: string): Promise<void> {
    const { error } = await this.supabase.auth.admin.updateUserById(id, {
      email,
      email_confirm: true,
    });

    if (error) {
      if (isDuplicateEmail(error)) {
        throw new DuplicateEmailError();
      }

      logger.error({ err: error, userId: id }, "Changement d'adresse refusé");
      throw new InternalError(
        "L'adresse de connexion n'a pas pu être modifiée",
      );
    }
  }

  /**
   * Définit un nouveau mot de passe.
   *
   * Le secret traverse cette méthode **une seule fois**, vers l'API
   * d'administration, qui l'empreint elle-même. Il n'est jamais journalisé : le
   * `logger` ne reçoit que l'identifiant du compte.
   */
  async updatePassword(id: string, password: string): Promise<void> {
    const { error } = await this.supabase.auth.admin.updateUserById(id, {
      password,
    });

    if (error) {
      if ("status" in error && error.status === 404) {
        throw new NotFoundError(
          "PROFILE_NOT_FOUND",
          "Ce compte n'existe pas chez le fournisseur d'identité",
          { id },
        );
      }

      logger.error(
        { err: { message: error.message, status: "status" in error ? error.status : undefined }, userId: id },
        "Changement de mot de passe refusé",
      );
      throw new InternalError(
        "Le mot de passe n'a pas pu être modifié",
      );
    }
  }

  /**
   * Adresses de connexion des comptes demandés.
   *
   * Lecture **tolérante** : l'annuaire administratif doit rester consultable
   * même si le fournisseur ne répond pas. Une adresse manquante s'affiche comme
   * « non résolue » — elle n'empêche ni la modification d'habilitation ni la
   * désactivation d'un compte.
   *
   * La pagination est bornée : `admin_profiles` compte quelques lignes, et une
   * boucle non bornée sur un annuaire inattendu serait pire qu'une adresse
   * manquante.
   */
  async findEmails(ids: readonly string[]): Promise<Map<string, string>> {
    const emails = new Map<string, string>();
    if (ids.length === 0) return emails;

    const wanted = new Set(ids);
    const perPage = 200;

    for (let page = 1; page <= MAX_LISTED_USER_PAGES; page += 1) {
      const { data, error } = await this.supabase.auth.admin.listUsers({
        page,
        perPage,
      });

      if (error) {
        logger.warn(
          { err: error, page },
          "Adresses de connexion illisibles : l'annuaire est affiché sans elles",
        );
        return emails;
      }

      for (const user of data.users) {
        if (user.email && wanted.has(user.id)) {
          emails.set(user.id, user.email);
        }
      }

      if (emails.size === wanted.size || data.users.length < perPage) break;
    }

    return emails;
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
