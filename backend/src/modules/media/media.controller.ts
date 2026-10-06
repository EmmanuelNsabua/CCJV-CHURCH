import type { Request, Response } from "express";
import { ValidationError } from "@/shared/errors/app-error";
import { toOffset, type PaginationQuery } from "@/shared/http/pagination";
import { sendCollection, sendItem, sendNoContent } from "@/shared/http/respond";
import {
  validatedParams,
  validatedQuery,
} from "@/presentation/middlewares/validate";
import type { DeleteMediaQuery, UploadMediaBody } from "./media.schema";
import type { MediaDto } from "./media.serializer";
import { toMediaDto, toMediaUsageReportDto } from "./media.serializer";
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
  };
}

export type MediaController = ReturnType<typeof createMediaController>;
