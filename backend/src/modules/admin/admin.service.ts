import { randomBytes } from "node:crypto";
import type { AdminProfile, AdminScope, PersistedAdminRole } from "@/domain/entities";
import type { AdminIdentityProvider } from "@/domain/identity/admin-identity-provider";
import type { AdminProfileRepository, DepartmentRepository, ListResult } from "@/domain/repositories";
import { UserPolicy, asUserPolicyResource } from "@/presentation/policies";
import {
  AuthRequiredError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/shared/errors/app-error";
import { toOffset } from "@/shared/http/pagination";
import { logger } from "@/infrastructure/logger";
import type {
  CreateAdminUserBody,
  ListAdminProfilesQuery,
  SetAdminActivationBody,
  UpdateAdminAuthorizationBody,
} from "./admin.schema";

/**
 * Règles métier de l'administration.
 *
 * Le service ne connaît ni Express, ni Drizzle, ni Supabase : il reçoit des
 * entités, un port d'identité et des entrées déjà validées, et lève des erreurs
 * du domaine.
 *
 * ### Les deux temps de l'autorisation (`docs/029` §4.2)
 *
 * Les routes de gestion des comptes montent `authorize(UserPolicy, ACTION)`,
 * c'est-à-dire le **premier temps** : la décision de type, qui ne dépend
 * d'aucune donnée d'entrée. Mais une action sur un compte dépend de la **cible**
 * — un `ADMIN` peut créer un responsable et ne peut pas créer un `ADMIN` — et le
 * garde de route ne charge rien, par construction. Le second temps est donc ici :
 * `assertAllowed` appelle **la même policy**, sur l'instance chargée, avant toute
 * écriture.
 *
 * Aucune règle n'est recopiée entre les deux : une seule fonction
 * (`UserPolicy.can`) décide, deux fois, sur deux niveaux d'information.
 */
export class AdminService {
  constructor(
    private readonly adminProfiles: AdminProfileRepository,
    private readonly departments: DepartmentRepository,
    private readonly identities: AdminIdentityProvider,
  ) {}

  /**
   * Profil courant.
   *
   * Le profil est celui chargé par `requireAdmin` : la route n'exige donc aucun
   * rôle particulier au-delà d'être un administrateur **actif**, et aucun appel
   * supplémentaire à la base n'est nécessaire. Le cas `undefined` ne peut pas
   * survenir derrière le middleware ; il est traité explicitement pour que le
   * service reste sûr s'il est appelé ailleurs.
   */
  currentProfile(profile: AdminProfile | undefined): AdminProfile {
    if (!profile) {
      throw new AuthRequiredError();
    }
    return profile;
  }

  /**
   * Collection administrative des profils.
   *
   * La table ne compte que quelques lignes et le contrat de persistance expose
   * `list()` sans pagination : la fenêtre est découpée ici, ce qui évite
   * d'inventer un contrat de repository différent pour cette seule route.
   */
  async listProfiles(
    query: ListAdminProfilesQuery,
  ): Promise<ListResult<AdminProfile>> {
    const profiles = await this.adminProfiles.list();
    const offset = toOffset(query.page, query.limit);

    return {
      items: profiles.slice(offset, offset + query.limit),
      total: profiles.length,
    };
  }

  /**
   * Crée un compte et son habilitation.
   *
   * L'ordre reproduit celui de `docs/023` §6, à une étape près :
   *
   * ```text
   * 1. vérifier le département de rattachement   (DR)
   * 2. décider sur la cible                      (UserPolicy)
   * 3. créer le compte d'authentification        (AuthProvider)
   * 4. écrire le profil applicatif               (UR)
   * 5. — en cas d'échec de 4 — supprimer 3
   * ```
   *
   * L'étape 5 n'est pas dans le diagramme, mais elle est nécessaire : sans elle,
   * un échec d'écriture du profil laisse un compte capable de **s'authentifier**
   * et dépourvu de tout droit — donc systématiquement refusé, et impossible à
   * recréer puisque l'adresse est désormais prise. C'est la compensation que
   * `scripts/create-admin.ts` applique déjà.
   *
   * L'étape 1 précède l'étape 3 pour une raison simple : inutile de créer un
   * compte d'authentification pour découvrir ensuite que le département n'existe
   * pas. Une action irréversible ne doit pas être tentée avant les vérifications
   * réversibles.
   */
  async createUser(
    actor: AdminProfile | undefined,
    data: CreateAdminUserBody,
  ): Promise<AdminProfile> {
    const author = this.currentProfile(actor);

    if (data.role === "DEPARTMENT_MANAGER" && data.departmentId) {
      const departmentExists = await this.departments.exists(data.departmentId);
      if (!departmentExists) {
        // `400` et non `404` : ce n'est pas la ressource visée par l'URL qui est
        // absente, c'est une **référence** du corps de requête — la convention
        // déjà retenue par le module événements (`DEPARTMENT_NOT_FOUND`).
        throw new ValidationError("Département de rattachement introuvable", [
          {
            champ: "departmentId",
            message: "Aucun département ne porte cet identifiant",
          },
        ]);
      }
    }

    const scope: AdminScope = data.role === "DEPARTMENT_MANAGER" ? "DEPARTMENT" : "GLOBAL";

    // Décision sur la **cible** : l'action dépend du rôle demandé, et c'est le
    // rôle demandé qui choisit la ligne de la policy. Pour une création,
    // `current` porte le rôle demandé — la convention documentée sur
    // `UserPolicyResource` : un compte en cours de création n'a pas d'histoire.
    this.assertAllowed(author, targetAction(data.role), {
      id: "cible-non-encore-créée",
      current: { role: data.role, scope, departmentId: data.departmentId ?? null },
    });

    const password = data.password ?? generatePassword();
    const identity = await this.identities.createUser({
      email: data.email,
      password,
      // Le compte est créé **par** un administrateur : exiger une confirmation
      // d'adresse reviendrait à demander au titulaire de valider une adresse que
      // l'administrateur vient lui-même de saisir.
      emailConfirmed: true,
    });

    try {
      const profile = await this.adminProfiles.upsert({
        id: identity.id,
        username: data.username,
        displayName: data.displayName ?? null,
        role: data.role as PersistedAdminRole,
        scope,
        departmentId: data.departmentId ?? null,
      });

      logger.info(
        {
          actorId: author.id,
          targetId: profile.id,
          role: profile.role,
          departmentId: profile.departmentId,
        },
        "Compte d'administration créé",
      );

      return profile;
    } catch (error) {
      await this.compensate(identity.id, error);
      throw error;
    }
  }

  /**
   * Réécrit l'habilitation d'un profil : rôle, périmètre, rattachement.
   *
   * Aucun appel au fournisseur d'identité : le rôle et le périmètre vivent
   * **uniquement** dans `admin_profiles` (`docs/032` §3.1, « le rôle vient de
   * cette table, jamais du jeton »). Supabase sait qu'un compte peut
   * s'authentifier ; il ne sait pas ce qu'il a le droit de faire.
   */
  async updateAuthorization(
    actor: AdminProfile | undefined,
    id: string,
    data: UpdateAdminAuthorizationBody,
  ): Promise<AdminProfile> {
    const author = this.currentProfile(actor);
    const target = await this.requireProfile(id);

    const scope: AdminScope = data.role === "DEPARTMENT_MANAGER" ? "DEPARTMENT" : "GLOBAL";

    // Décision **avant** la vérification du département, et l'ordre est
    // délibéré : `docs/029` §4.4 place l'autorisation (rang 3) avant la
    // validation (rang 4). Vérifier d'abord l'existence du département ferait de
    // cette route un **oracle d'existence** pour un appelant qui n'a pas le droit
    // d'agir — il apprendrait, par un `400`, quels identifiants existent.
    this.assertAllowed(author, "UPDATE_ROLE_SCOPE", {
      ...asUserPolicyResource(target),
      requested: {
        role: data.role,
        scope: data.role === "DEPARTMENT_MANAGER" ? "DEPARTMENT" : "GLOBAL",
        departmentId: data.departmentId ?? null,
      },
    });

    if (data.role === "DEPARTMENT_MANAGER" && data.departmentId) {
      const departmentExists = await this.departments.exists(data.departmentId);
      if (!departmentExists) {
        throw new ValidationError("Département de rattachement introuvable", [
          {
            champ: "departmentId",
            message: "Aucun département ne porte cet identifiant",
          },
        ]);
      }
    }

    const updated = await this.adminProfiles.updateAuthorization(id, {
      role: data.role as PersistedAdminRole,
      scope: data.role === "DEPARTMENT_MANAGER" ? "DEPARTMENT" : "GLOBAL",
      departmentId: data.departmentId ?? null,
    });

    if (updated === null) {
      throw notFound(id);
    }

    logger.info(
      {
        actorId: author.id,
        targetId: updated.id,
        role: updated.role,
        scope: updated.scope,
        departmentId: updated.departmentId,
      },
      "Habilitation modifiée",
    );

    return updated;
  }

  /**
   * Active ou désactive un compte.
   *
   * **Deux écritures, dans cet ordre, et l'ordre compte.** Le profil applicatif
   * est mis à jour en premier : c'est lui que `requireAdmin` relit à chaque
   * requête, donc lui qui révoque réellement l'accès aux jetons déjà émis
   * (D-14 étape 1). Le fournisseur d'identité est prévenu ensuite, pour refuser
   * les **nouvelles** authentifications. Inverser les deux laisserait une fenêtre
   * pendant laquelle le bannissement est posé mais où l'ancien jeton fonctionne
   * encore — la révocation ne serait pas immédiate, alors que c'est exactement ce
   * que D-14 exige d'elle.
   *
   * Une désactivation ne touche **pas** au rôle : réactiver doit rendre le
   * compte tel qu'il était.
   */
  async setActivation(
    actor: AdminProfile | undefined,
    id: string,
    data: SetAdminActivationBody,
  ): Promise<AdminProfile> {
    const author = this.currentProfile(actor);
    const target = await this.requireProfile(id);

    this.assertAllowed(author, "DEACTIVATE", asUserPolicyResource(target));

    const updated = await this.adminProfiles.setActive(id, data.isActive);
    if (updated === null) {
      throw notFound(id);
    }

    await this.identities.setActive(id, data.isActive);

    logger.info(
      { actorId: author.id, targetId: updated.id, isActive: updated.isActive },
      updated.isActive ? "Compte réactivé" : "Compte désactivé",
    );

    return updated;
  }

  /* ------------------------------------------------------------------------ */
  /*  Décision et résolution                                                  */
  /* ------------------------------------------------------------------------ */

  /**
   * Second temps d'autorisation : la décision sur l'instance.
   *
   * Le motif du refus n'est **pas** transmis au client — `ForbiddenError` porte
   * un message générique, comme partout ailleurs (`docs/029` §4.5 : deux refus de
   * causes différentes doivent produire une réponse identique). Il est journalisé
   * ici, avec l'acteur et l'action, jamais avec la cible : celle-ci peut porter
   * des données personnelles, et un journal n'est pas un écran d'administration.
   */
  private assertAllowed(
    actor: AdminProfile,
    action: Parameters<typeof UserPolicy.can>[1],
    target: Parameters<typeof UserPolicy.can>[2],
  ): void {
    const decision = UserPolicy.can(actor, action, target);

    if (decision.allowed) return;

    logger.warn(
      {
        actorId: actor.id,
        actorRole: actor.role,
        action,
        reason: decision.reason,
        pending: decision.pending,
      },
      "Gestion de compte refusée",
    );

    throw new ForbiddenError();
  }

  /** Charge un profil, ou répond `404` — jamais une page blanche. */
  private async requireProfile(id: string): Promise<AdminProfile> {
    const profile = await this.adminProfiles.findById(id);
    if (profile === null) {
      throw notFound(id);
    }
    return profile;
  }

  /**
   * Compense un profil non écrit en supprimant le compte d'authentification.
   *
   * L'erreur d'origine est **relevée telle quelle** : si la compensation échoue
   * à son tour, l'échec de compensation est journalisé (par le fournisseur) mais
   * ne remplace pas la cause réelle, qui est celle que l'appelant doit voir.
   */
  private async compensate(identityId: string, cause: unknown): Promise<void> {
    logger.error(
      { err: cause, identityId },
      "Écriture du profil impossible : suppression du compte d'authentification",
    );

    try {
      await this.identities.deleteUser(identityId);
    } catch (compensationError) {
      logger.error(
        { err: compensationError, identityId },
        "Compensation échouée : un compte d'authentification sans profil subsiste",
      );
    }
  }
}

/**
 * Traduit le rôle **demandé** en action de policy.
 *
 * Trois actions distinctes, et non une action paramétrée : `docs/028` D-04 fait
 * de « créer un responsable » la capacité propre de l'`ADMIN` tout en lui
 * refusant la création d'un pair ou d'un supérieur. Une action unique obligerait
 * la policy à comparer des rôles entre eux — précisément ce que D-04 refuse
 * (« l'`ADMIN` n'est pas *inférieur*, il est **différent** »).
 */
function targetAction(role: PersistedAdminRole): "CREATE" | "CREATE_ADMIN" | "CREATE_SUPER_ADMIN" {
  switch (role) {
    case "SUPER_ADMIN":
      return "CREATE_SUPER_ADMIN";
    case "ADMIN":
      return "CREATE_ADMIN";
    case "DEPARTMENT_MANAGER":
      return "CREATE";
  }
}

function notFound(id: string): NotFoundError {
  return new NotFoundError(
    "PROFILE_NOT_FOUND",
    `Aucun profil administratif ne correspond à « ${id} »`,
  );
}

/**
 * Mot de passe provisoire, généré **côté serveur** et jamais renvoyé.
 *
 * 24 octets tirés de `crypto.randomBytes` — soit 192 bits d'entropie, très
 * au-delà de ce qu'une politique de phrase secrète exige (`docs/030` §5 retient
 * 12 caractères). `base64url` évite les caractères que les interfaces web
 * transforment ou tronquent (guillemets, antislash, espaces).
 *
 * ⚠️ Ce mot de passe n'est **pas** journalisé et **pas** retourné par l'API :
 * il doit être transmis par un canal sûr, ou remplacé par le titulaire via la
 * récupération de compte. Aucun document n'arrête ce point (voir le schéma
 * `createAdminUserSchema`) — le mécanisme est donc le plus prudent disponible,
 * pas une décision arbitrée.
 */
function generatePassword(): string {
  return randomBytes(24).toString("base64url");
}
