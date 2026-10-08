import type { Request, Response } from "express";
import type { AdminProfile } from "@/domain/entities";
import { AuthRequiredError, ValidationError } from "@/shared/errors/app-error";
import { toOffset, type PaginationQuery } from "@/shared/http/pagination";
import { sendCollection, sendItem, sendNoContent } from "@/shared/http/respond";
import {
  validatedParams,
  validatedQuery,
} from "@/presentation/middlewares/validate";
import type {
  DeleteMediaQuery,
  GrantMediaAccessBody,
  MediaRightsBody,
  ParamsWithMediaAccess,
  UploadMediaBody,
} from "./media.schema";
import type { MediaDto } from "./media.serializer";
import {
  toMediaAccessDto,
  toMediaDto,
  toMediaUsageReportDto,
} from "./media.serializer";
import type { MediaService } from "./media.service";

export interface MediaIdParams {
  id: string;
}

/**
 * Controller des médias.
 *
 * Le fichier est déjà en mémoire (`multer.memoryStorage()`) et son contenu n'a
 * pas encore été examiné : c'est `StorageService` qui vérifie la taille, déduit
 * le type réel des octets et génère le nom. Aucune donnée fournie par le client
 * (nom de fichier, `Content-Type`) n'est utilisée.
 */
export function createMediaController(service: MediaService) {
  return {
    async list(req: Request, res: Response): Promise<void> {
      const { page, limit } = validatedQuery<PaginationQuery>(req);
      const { items, total } = await service.list({
        limit,
        offset: toOffset(page, limit),
      });
      sendCollection<MediaDto>(res, items.map(toMediaDto), page, limit, total);
    },

    async get(req: Request, res: Response): Promise<void> {
      const { id } = validatedParams<MediaIdParams>(req);
      sendItem(res, toMediaDto(await service.get(id)));
    },

    async usage(req: Request, res: Response): Promise<void> {
      const { id } = validatedParams<MediaIdParams>(req);
      sendItem(res, toMediaUsageReportDto(await service.usage(id)));
    },

    async upload(req: Request, res: Response): Promise<void> {
      const file = req.file;
      if (!file) {
        throw new ValidationError(
          "Aucun fichier reçu : le champ de formulaire « file » est requis",
        );
      }

      // `validate({ body })` a remplacé `req.body` par les champs validés.
      const { folder, alt } = req.body as UploadMediaBody;

      const asset = await service.upload({
        folder,
        buffer: file.buffer,
        size: file.size,
        alt: alt ?? null,
        uploadedBy: req.admin?.id ?? null,
      });

      sendItem(res, toMediaDto(asset), 201);
    },

    async remove(req: Request, res: Response): Promise<void> {
      const { id } = validatedParams<MediaIdParams>(req);
      const { force } = validatedQuery<DeleteMediaQuery>(req);
      await service.remove(id, force);
      sendNoContent(res);
    },

    /* ---------------------------------------------------------------------- */
    /*  Droits d'accès (docs/028 D-21, D-22)                                  */
    /* ---------------------------------------------------------------------- */

    /**
     * `GET /media/:id/access` — qui a accès à ce média, et pour quoi faire.
     *
     * `req.admin` est transmis au service : la décision (cellule 6.1, refusée au
     * responsable par Q-11) n'est pas prise ici — un controller qui inspecterait
     * le rôle serait l'`if (req.admin.role === …)` interdit par `docs/029` §4.2.
     */
    async listAccess(req: Request, res: Response): Promise<void> {
      const { id } = validatedParams<MediaIdParams>(req);
      const access = await service.listAccess(requireAdmin(req), id);

      // Liste **bornée**, non paginée — comme celles de `scriptures`, `schedule`
      // et `social-links` : le nombre de lignes de droits d'un média est celui de
      // ses destinataires, pas une collection qu'on parcourt. L'enveloppe de
      // collection avec `meta` laisserait croire à une pagination qui n'existe
      // pas, et l'API n'a qu'une forme pour les listes bornées.
      sendItem(res, { data: access.map(toMediaAccessDto) });
    },

    async grantAccess(req: Request, res: Response): Promise<void> {
      const { id } = validatedParams<MediaIdParams>(req);
      const body = req.body as GrantMediaAccessBody;

      const granted = await service.grantAccess(requireAdmin(req), id, {
        granteeType: body.granteeType,
        granteeId: body.granteeId,
        rights: {
          canUse: body.canUse,
          canManage: body.canManage,
          canDelete: body.canDelete,
        },
      });

      sendItem(res, toMediaAccessDto(granted), 201);
    },

    async updateAccess(req: Request, res: Response): Promise<void> {
      const { id, granteeType, granteeId } = validatedParams<ParamsWithMediaAccess>(req);
      const body = req.body as MediaRightsBody;

      const updated = await service.updateAccess(requireAdmin(req), id, granteeType, granteeId, {
        canUse: body.canUse,
        canManage: body.canManage,
        canDelete: body.canDelete,
      });

      sendItem(res, toMediaAccessDto(updated));
    },

    async revokeAccess(req: Request, res: Response): Promise<void> {
      const { id, granteeType, granteeId } = validatedParams<ParamsWithMediaAccess>(req);

      await service.revokeAccess(requireAdmin(req), id, granteeType, granteeId);
      sendNoContent(res);
    },
  };
}

/**
 * L'administrateur courant, garanti par la chaîne de middlewares.
 *
 * `authorize` refuse déjà une requête sans profil ; cette fonction ne duplique pas
 * ce contrôle, elle évite un `?.` partout dans le controller. Le cas `undefined`
 * ne peut pas survenir derrière `requireAdmin` — il est traité explicitement pour
 * que le controller reste sûr s'il était monté autrement.
 */
function requireAdmin(req: Request): AdminProfile {
  if (!req.admin) {
    throw new AuthRequiredError();
  }
  return req.admin;
}

export type MediaController = ReturnType<typeof createMediaController>;
