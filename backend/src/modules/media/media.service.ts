import type {
  AdminProfile,
  MediaAccess,
  MediaAccessRights,
  MediaAsset,
  MediaGranteeType,
} from "@/domain/entities";
import type {
  ListOptions,
  ListResult,
  MediaAccessRepository,
} from "@/domain/repositories";
import { MediaAccessPolicy } from "@/presentation/policies";
import { logger } from "@/infrastructure/logger";
import { ConflictError, ForbiddenError, NotFoundError } from "@/shared/errors/app-error";
import { formatIssues } from "@/shared/http/issues";
import { ValidationError } from "@/shared/errors/app-error";
import type {
  MediaReferenceRepository,
  MediaUsage,
} from "@/infrastructure/repositories/media.repository";
import type { StorageFolder, StorageService } from "@/infrastructure/supabase/storage";

/**
 * Règles métier des médias.
 *
 * Trois garanties, dans cet ordre :
 * 1. le fichier est **téléversé** vers Supabase Storage — c'est `StorageService`
 *    qui borne la taille, déduit le type MIME des octets et génère le nom ;
 * 2. la ligne `media` est **insérée ensuite** ;
 * 3. si l'insertion échoue, le fichier est **supprimé** (compensation) : jamais
 *    d'orphelin dans le bucket.
 *
 * En suppression, l'ordre est inverse : les références sont détachées et la
 * ligne supprimée **avant** le fichier, pour qu'un échec ne laisse jamais une
 * page pointant vers une image absente.
 */

export interface UploadMediaCommand {
  folder: StorageFolder;
  buffer: Buffer;
  /** Taille annoncée par multer ; revérifiée par `StorageService`. */
  size: number;
  alt: string | null;
  uploadedBy: string | null;
}

export interface MediaUsageReport {
  media: MediaAsset;
  /** Total des références, toutes sources confondues. */
  total: number;
  /** Emplacements référençant réellement le média. */
  usages: MediaUsage[];
}

function countTotal(usages: readonly MediaUsage[]): number {
  return usages.reduce((total, usage) => total + usage.count, 0);
}

function notFound(id: string): NotFoundError {
  return new NotFoundError("MEDIA_NOT_FOUND", "Média introuvable", { id });
}

/**
 * Aucun droit d'accès pour ce destinataire sur ce média.
 *
 * Le message ne dit pas **qui** détient un accès, ni combien de lignes existent :
 * `docs/029` §4.5 interdit qu'un refus divulgue l'existence ou le volume d'une
 * donnée d'autorisation. Il dit seulement qu'il n'y a rien à modifier ici.
 */
function notFoundAccess(
  mediaId: string,
  granteeType: MediaGranteeType,
): NotFoundError {
  return new NotFoundError(
    "MEDIA_ACCESS_NOT_FOUND",
    "Aucun droit d'accès n'existe pour ce destinataire sur ce média",
    { mediaId, granteeType },
  );
}

export class MediaService {
  constructor(
    private readonly media: MediaReferenceRepository,
    private readonly storage: StorageService,
    private readonly access: MediaAccessRepository,
  ) {}

  /**
   * Droits d'accès enregistrés pour un média (cellule 6.1).
   *
   * La lecture est **décidée par la policy**, jamais par le service : `ADMIN` et
   * `SUPER_ADMIN` la détiennent, le responsable non (Q-11, non tranchée). Un
   * service qui renverrait la liste sans décision ferait exactement ce que
   * `docs/029` §4.2 interdit — une autorisation décidée ailleurs que dans la
   * couche d'autorisation.
   */
  async listAccess(actor: AdminProfile, mediaId: string): Promise<MediaAccess[]> {
    await this.get(mediaId);
    this.assertAllowed(actor, "READ", undefined);

    return this.access.listForMedia(mediaId);
  }

  /**
   * Accorde des droits à un département ou à un profil (cellule 6.2, D-22).
   *
   * Deux refus sont ici **structurels**, et l'ordre compte :
   *
   * 1. la **policy** décide — `MANAGER` n'accorde jamais rien (D-22), et personne
   *    ne s'accorde un accès à soi-même (XD-08) ;
   * 2. la **base** confirme — un département ne peut pas porter `DELETE` (XD-07),
   *    une ligne sans droit n'existe pas, et le destinataire doit exister.
   *
   * Aucune des deux ne redouble l'autre : la policy juge l'**intention**, la base
   * garantit l'**état**. Un script d'administration qui contournerait le service
   * violerait toujours les contraintes ; une contrainte relâchée un jour ne
   * rouvrirait pas le droit pour autant.
   */
  async grantAccess(
    actor: AdminProfile,
    mediaId: string,
    target: { granteeType: MediaGranteeType; granteeId: string; rights: MediaAccessRights },
  ): Promise<MediaAccess> {
    await this.get(mediaId);
    this.assertAllowed(actor, "GRANT_ACCESS", {
      granteeType: target.granteeType,
      granteeId: target.granteeId,
      ...target.rights,
    });

    const granted = await this.access.grant({
      mediaId,
      granteeType: target.granteeType,
      granteeId: target.granteeId,
      rights: target.rights,
      grantedBy: actor.id,
    });

    logger.info(
      {
        actorId: actor.id,
        mediaId,
        granteeType: granted.granteeType,
        granteeId: granted.granteeId,
        canUse: granted.canUse,
        canManage: granted.canManage,
        canDelete: granted.canDelete,
      },
      "Droit d'accès média accordé",
    );

    return granted;
  }

  /** Modifie les trois droits d'une ligne existante (cellule 6.3). */
  async updateAccess(
    actor: AdminProfile,
    mediaId: string,
    granteeType: MediaGranteeType,
    granteeId: string,
    rights: MediaAccessRights,
  ): Promise<MediaAccess> {
    await this.get(mediaId);

    const existing = await this.access.findFor(mediaId, granteeType, granteeId);
    if (existing === null) {
      throw notFoundAccess(mediaId, granteeType);
    }

    this.assertAllowed(actor, "UPDATE", { ...existing, ...rights });

    const updated = await this.access.updateRights(mediaId, granteeType, granteeId, rights);
    if (updated === null) {
      // Course entre la lecture et l'écriture : la ligne a disparu.
      throw notFoundAccess(mediaId, granteeType);
    }

    logger.info(
      { actorId: actor.id, mediaId, granteeType, granteeId, ...rights },
      "Droits d'accès média modifiés",
    );

    return updated;
  }

  /**
   * Retire un accès (action `REVOKE`, cellule 6.4, `docs/029` §2.6).
   *
   * Le retrait **supprime la ligne** au lieu de mettre les trois droits à `false` :
   * `media_access_at_least_one_right` interdit une ligne vide, et une ligne
   * inactive laisserait croire à un accès existant. `docs/029` §2.6 dit la même
   * chose — « l'autorisation se retire par `DELETE` ».
   */
  async revokeAccess(
    actor: AdminProfile,
    mediaId: string,
    granteeType: MediaGranteeType,
    granteeId: string,
  ): Promise<void> {
    await this.get(mediaId);

    // La ligne est chargée **avant** la décision, pour deux raisons : la policy
    // juge une instance complète (`MediaAccessPolicyResource`), et l'absence de
    // droits se traduit par un `404` métier plutôt que par un `DELETE` sans effet.
    const existing = await this.access.findFor(mediaId, granteeType, granteeId);
    if (existing === null) {
      throw notFoundAccess(mediaId, granteeType);
    }

    this.assertAllowed(actor, "REVOKE_ACCESS", existing);

    const removed = await this.access.revoke(mediaId, granteeType, granteeId);
    if (!removed) {
      throw notFoundAccess(mediaId, granteeType);
    }

    logger.info(
      { actorId: actor.id, mediaId, granteeType, granteeId },
      "Droit d'accès média retiré",
    );
  }

  /**
   * Décision sur l'instance, déléguée aux policies.
   *
   * **Deux lectures distinctes, deux cellules distinctes** — et les confondre
   * serait une erreur d'autorisation, pas une imprécision :
   *
   * - cellule **5.2** — le **registre des médias** (« quels médias existent, et
   *   lesquels puis-je voir ») est ouvert au responsable, pour les médias où un
   *   droit existe. C'est `MediaPolicy.READ`, appelée par le chemin de liste.
   * - cellule **6.1** — la **table des autorisations** (« qui a le droit de faire
   *   quoi ») ne l'est pas : `docs/029` Q-11 n'est pas tranchée, et le refus par
   *   défaut s'applique. C'est `MediaAccessPolicy.READ`, appelée ici.
   *
   * Le raisonnement du refus est journalisé — jamais retourné. Deux refus de
   * causes différentes doivent produire une réponse **identique** (`docs/029`
   * §4.5, règles de non-fuite) : c'est le même message générique que `authorize`.
   */
  private assertAllowed(
    actor: AdminProfile,
    action: Parameters<typeof MediaAccessPolicy.can>[1],
    resource: Parameters<typeof MediaAccessPolicy.can>[2],
  ): void {
    // `MediaAccessPolicy` délègue elle-même à `MediaPolicy` pour `GRANT_ACCESS`
    // et `REVOKE_ACCESS` (`docs/029` §4.6) : une seule formulation de D-22.
    const decision = MediaAccessPolicy.can(actor, action, resource);

    if (decision.allowed) return;

    logger.warn(
      {
        actorId: actor.id,
        actorRole: actor.role,
        action,
        reason: decision.reason,
        pending: decision.pending,
      },
      "Accès média refusé",
    );

    throw new ForbiddenError();
  }

  list(options: ListOptions): Promise<ListResult<MediaAsset>> {
    return this.media.list(options);
  }

  async get(id: string): Promise<MediaAsset> {
    const asset = await this.media.findById(id);
    if (!asset) {
      throw notFound(id);
    }
    return asset;
  }

  /** Où ce média est-il utilisé ? (une seule requête de comptage) */
  async usage(id: string): Promise<MediaUsageReport> {
    const media = await this.get(id);
    const usages = await this.media.listUsages(id);

    return {
      media,
      total: countTotal(usages),
      usages: usages.filter((usage) => usage.count > 0),
    };
  }

  async upload(command: UploadMediaCommand): Promise<MediaAsset> {
    const uploaded = await this.storage.upload(
      command.folder,
      { buffer: command.buffer, size: command.size },
      command.alt,
    );

    try {
      return await this.media.create({
        bucket: uploaded.bucket,
        path: uploaded.path,
        publicUrl: uploaded.publicUrl,
        mimeType: uploaded.mimeType,
        sizeBytes: uploaded.sizeBytes,
        width: uploaded.width,
        height: uploaded.height,
        alt: uploaded.alt,
        uploadedBy: command.uploadedBy,
      });
    } catch (error) {
      await this.compensate(uploaded.path, error);
      throw error;
    }
  }

  /**
   * Suppression d'un média.
   *
   * Refusée par défaut si le fichier est encore référencé (`CONFLICT` avec le
   * détail des usages) ; `force=true` détache d'abord les références.
   */
  async remove(id: string, force: boolean): Promise<void> {
    const asset = await this.get(id);
    const usages = await this.media.listUsages(id);
    const total = countTotal(usages);

    if (total > 0 && !force) {
      throw new ConflictError(
        "CONFLICT",
        "Ce média est encore utilisé : retirez-le des contenus concernés, ou forcez la suppression",
        { total, usages: usages.filter((usage) => usage.count > 0) },
      );
    }

    if (total > 0) {
      logger.warn(
        { mediaId: id, path: asset.path, total },
        "Suppression forcée d'un média référencé : les références sont détachées",
      );
      await this.media.clearReferences(id);
    }

    const removed = await this.media.remove(id);
    if (!removed) {
      throw notFound(id);
    }

    await this.storage.remove(asset.path);
  }

  /**
   * Compensation : la ligne `media` n'a pas été créée, le fichier ne doit pas
   * rester. Un échec de compensation est journalisé — il est préférable de
   * perdre un raisonnement de propreté que de masquer l'erreur d'origine.
   */
  private async compensate(path: string, cause: unknown): Promise<void> {
    try {
      await this.storage.remove(path);
    } catch (error) {
      logger.error(
        { err: error, cause, path },
        "Compensation impossible : le fichier téléversé reste orphelin dans le Storage",
      );
    }
  }
}
