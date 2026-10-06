import { Router, type RequestHandler } from "express";
import multer from "multer";
import { env } from "@/config/env";
import { PayloadTooLargeError, ValidationError } from "@/shared/errors/app-error";
import type { AuthDependencies } from "@/presentation/middlewares/auth";
import { requireAnyAdmin } from "@/presentation/middlewares/auth";
import { validate } from "@/presentation/middlewares/validate";
import { createMediaController } from "./media.controller";
import {
  deleteMediaQuerySchema,
  listQuerySchema,
  mediaIdParamSchema,
  uploadMediaBodySchema,
} from "./media.schema";
import type { MediaService } from "./media.service";

export interface MediaRouterDeps {
  service: MediaService;
  authDeps: AuthDependencies;
}

/**
 * Téléversement **en mémoire** uniquement.
 *
 * Rien n'est jamais écrit sur le disque du serveur : le système de fichiers de
 * l'hébergement est éphémère et le fichier doit partir vers Supabase Storage.
 * La limite de taille est appliquée ici *et* revérifiée par `StorageService`,
 * qui ne fait confiance à aucune métadonnée de la requête.
 */
const uploadFile = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_UPLOAD_BYTES, files: 1 },
});

/**
 * Adapte le middleware multer pour que ses erreurs sortent au format de l'API.
 *
 * Sans cette traduction, un dépassement de taille remonterait en erreur brute
 * (500 `INTERNAL_ERROR`) au lieu d'un `413 FILE_TOO_LARGE` exploitable par le
 * back-office.
 */
function singleFileUpload(): RequestHandler {
  const handler = uploadFile.single("file");

  return (req, res, next) => {
    handler(req, res, (error: unknown) => {
      if (error instanceof multer.MulterError) {
        if (error.code === "LIMIT_FILE_SIZE") {
          next(new PayloadTooLargeError(env.MAX_UPLOAD_BYTES));
          return;
        }

        next(
          new ValidationError("Téléversement invalide", [
            { champ: error.field ?? "file", message: error.message },
          ]),
        );
        return;
      }

      next(error);
    });
  };
}

/**
 * Routes `/api/v1/media` — **entièrement administratives** : le registre des
 * fichiers téléversés n'est jamais public (`docs/018` §6.2).
 */
export function createMediaRouter(deps: MediaRouterDeps): Router {
  const router = Router();
  const controller = createMediaController(deps.service);
  const admin = requireAnyAdmin(deps.authDeps, "ROLE_ADMIN");

  router.get("/", ...admin, validate({ query: listQuerySchema }), controller.list);
  router.get(
    "/:id/usage",
    ...admin,
    validate({ params: mediaIdParamSchema }),
    controller.usage,
  );
  router.get("/:id", ...admin, validate({ params: mediaIdParamSchema }), controller.get);

  // Ordre : administration → multer (mémoire) → validation des champs texte →
  // service. Le dossier de destination est validé avant tout appel au Storage.
  router.post(
    "/",
    ...admin,
    singleFileUpload(),
    validate({ body: uploadMediaBodySchema }),
    controller.upload,
  );
  router.delete(
    "/:id",
    ...admin,
    validate({ params: mediaIdParamSchema, query: deleteMediaQuerySchema }),
    controller.remove,
  );

  return router;
}
