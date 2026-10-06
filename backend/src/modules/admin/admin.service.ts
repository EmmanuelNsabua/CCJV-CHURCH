import type { AdminProfile } from "@/domain/entities";
import type { AdminProfileRepository, ListResult } from "@/domain/repositories";
import { AuthRequiredError } from "@/shared/errors/app-error";
import { toOffset } from "@/shared/http/pagination";
import type { ListAdminProfilesQuery } from "./admin.schema";

/**
 * Règles métier de l'administration.
 *
 * Le service ne connaît ni Express, ni Drizzle : il reçoit des entités et des
 * entrées déjà validées, et lève des erreurs du domaine.
 */

export class AdminService {
  constructor(private readonly adminProfiles: AdminProfileRepository) {}

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
}
