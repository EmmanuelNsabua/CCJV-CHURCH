import { z } from "zod";
import type { StorageFolder } from "@/infrastructure/supabase/storage";
import { paginationQuerySchema } from "@/shared/http/pagination";

/**
 * Schémas Zod du module « médias ».
 *
 * Point sensible : le **dossier de destination** est une liste fermée. Il ne
 * doit jamais venir d'une chaîne libre, sinon un client pourrait écrire
 * n'importe où dans le bucket (`docs/018` §8).
 */

/**
 * Dossiers autorisés. La contrainte `satisfies` garantit à la compilation que
 * cette liste reste alignée sur `StorageFolder` : ajouter un dossier au Storage
 * sans l'autoriser ici — ou l'inverse — ne compilerait pas.
 */
export const MEDIA_FOLDERS = [
  "events",
  "departments",
  "publications",
  "leaders",
  "testimonies",
  "community",
  "pages",
] as const satisfies readonly StorageFolder[];

export const mediaFolderSchema = z.enum(MEDIA_FOLDERS, "Dossier de destination invalide");

export type MediaFolder = z.infer<typeof mediaFolderSchema>;

export const mediaIdParamSchema = z.object({
  id: z.uuid("Identifiant de média invalide"),
});

/** Collection d'administration : paginée, sans filtre serveur. */
export const listQuerySchema = paginationQuerySchema;

/**
 * Corps du `POST /media` (formulaire multipart).
 *
 * Le fichier lui-même n'est pas décrit ici : il est traité par multer, puis son
 * type réel est déduit de ses octets par `StorageService` — jamais du
 * `Content-Type` ni du nom de fichier envoyés par le client.
 */
export const uploadMediaBodySchema = z.object({
  folder: mediaFolderSchema,
  /** Texte alternatif : requis pour l'accessibilité (WCAG 2.2 AA). */
  alt: z.string().trim().max(300).optional(),
});

export type UploadMediaBody = z.infer<typeof uploadMediaBodySchema>;

/**
 * `?force=true` — explicitement littéral.
 *
 * On ne convertit pas une valeur quelconque en booléen (`Boolean("false")`
 * vaut `true`) : seule la chaîne `true` autorise la suppression d'un média
 * encore référencé.
 */
export const deleteMediaQuerySchema = z.object({
  force: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
});

export type DeleteMediaQuery = z.infer<typeof deleteMediaQuerySchema>;
