import { Router, type RequestHandler } from "express";
import multer from "multer";
import { env } from "@/config/env";
import { PayloadTooLargeError, ValidationError } from "@/shared/errors/app-error";
import type { AuthDependencies } from "@/presentation/middlewares/auth";
import { requireAuthenticatedAdmin } from "@/presentation/middlewares/auth";
import { authorize, MediaAccessPolicy, MediaPolicy } from "@/presentation/policies";
import { validate } from "@/presentation/middlewares/validate";
import { createMediaController } from "./media.controller";
import {
  deleteMediaQuerySchema,
  grantMediaAccessSchema,
  listQuerySchema,
  mediaIdParamSchema,
  mediaRightsSchema,
  paramsWithMediaAccessSchema,
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
 *
 * Aucune route n'étant publique, chacune monte la chaîne complète, dans l'ordre
 * `authenticate` → `requireAdmin` → `authorize(MediaPolicy, ACTION)` →
 * `validate`. La bibliothèque étant **centrale** (X27 : pas de
 * `media.department_id`), la clause départementale de `docs/029` §4.3 est sans
 * objet ici : la policy décide sur le rôle, le scope et les droits d'accès
 * explicites.
 */
export function createMediaRouter(deps: MediaRouterDeps): Router {
  const router = Router();
  const controller = createMediaController(deps.service);
  const admin = requireAuthenticatedAdmin(deps.authDeps);

  router.get(
    "/",
    ...admin,
    authorize(MediaPolicy, "READ"),
    validate({ query: listQuerySchema }),
    controller.list,
  );
  router.get(
    "/:id/usage",
    ...admin,
    authorize(MediaPolicy, "READ"),
    validate({ params: mediaIdParamSchema }),
    controller.usage,
  );
  router.get(
    "/:id",
    ...admin,
    authorize(MediaPolicy, "READ"),
    validate({ params: mediaIdParamSchema }),
    controller.get,
  );

  // Ordre : administration → autorisation de téléversement → multer (mémoire) →
  // validation des champs texte → service. Le dossier de destination est validé
  // avant tout appel au Storage, et aucun octet n'est mis en mémoire tampon
  // avant que la policy ait admis l'action.
  router.post(
    "/",
    ...admin,
    authorize(MediaPolicy, "CREATE"),
    singleFileUpload(),
    validate({ body: uploadMediaBodySchema }),
    controller.upload,
  );
  router.delete(
    "/:id",
    ...admin,
    authorize(MediaPolicy, "DELETE"),
    validate({ params: mediaIdParamSchema, query: deleteMediaQuerySchema }),
    controller.remove,
  );

  /* ---------------------------------------------------------------------- */
  /*  Droits d'accès (docs/028 D-21, D-22)                                  */
  /* ---------------------------------------------------------------------- */

  /*
   * Quatre routes, quatre actions **distinctes** — et cette distinction est le
   * cœur de D-21 : lire les droits, les accorder, les modifier et les retirer
   * sont quatre décisions différentes, jamais quatre degrés d'un même droit.
   * `MediaAccessPolicy` porte les deux dernières ; les deux premières délèguent
   * à `MediaPolicy` (`docs/029` §4.6), pour qu'il n'existe qu'une seule
   * formulation de « seul l'ADMIN ou le SUPER_ADMIN accorde ».
   *
   * Aucune de ces routes n'est publique : le registre des autorisations dit qui
   * peut faire quoi, et cette information n'appartient pas aux visiteurs.
   */

  router.get(
    "/:id/access",
    ...admin,
    authorize(MediaAccessPolicy, "READ"),
    validate({ params: mediaIdParamSchema }),
    controller.listAccess,
  );

  router.post(
    "/:id/access",
    ...admin,
    authorize(MediaAccessPolicy, "GRANT_ACCESS"),
    validate({ params: mediaIdParamSchema, body: grantMediaAccessSchema }),
    controller.grantAccess,
  );

  router.patch(
    "/:id/access/:granteeType/:granteeId",
    ...admin,
    authorize(MediaAccessPolicy, "UPDATE"),
    validate({ params: paramsWithMediaAccessSchema, body: mediaRightsSchema }),
    controller.updateAccess,
  );

  router.delete(
    "/:id/access/:granteeType/:granteeId",
    ...admin,
    authorize(MediaAccessPolicy, "REVOKE_ACCESS"),
    validate({ params: paramsWithMediaAccessSchema }),
    controller.revokeAccess,
  );

  return router;
}
