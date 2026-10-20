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
  "resources",
] as const satisfies readonly StorageFolder[];

export const mediaFolderSchema = z.enum(MEDIA_FOLDERS, "Dossier de destination invalide");

export type MediaFolder = z.infer<typeof mediaFolderSchema>;

export const mediaIdParamSchema = z.object({
  id: z.uuid("Identifiant de média invalide"),
});

/**
 * Collection d'administration : paginée, sans filtre serveur.
 *
 * Alias de la pagination commune, donc **strict** : `?nimportequoi=1` est refusé
 * en `VALIDATION_ERROR` (convention des paramètres de requête).
 */
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
 * `?force=true` — explicitement littéral, et **strict**.
 *
 * On ne convertit pas une valeur quelconque en booléen (`Boolean("false")`
 * vaut `true`) : seule la chaîne `true` autorise la suppression d'un média
 * encore référencé. Aucun autre paramètre n'est reconnu : `force` est le seul
 * documenté, un `?forcee=true` (faute de frappe) est donc refusé en
 * `VALIDATION_ERROR` plutôt qu'interprété comme l'absence de `force`.
 */
export const deleteMediaQuerySchema = z.strictObject({
  force: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
});

export type DeleteMediaQuery = z.infer<typeof deleteMediaQuerySchema>;

/* -------------------------------------------------------------------------- */
/*  Droits d'accès (docs/028 D-21, D-22)                                      */
/* -------------------------------------------------------------------------- */

/**
 * Destinataire d'un accès : un département, ou un profil nommément désigné.
 *
 * C'est `docs/032` §3.4 (`media_grantee_type`) : la colonne est polymorphe, et
 * c'est ce champ qui dit comment lire l'identifiant. Un client ne peut donc pas
 * accorder un accès « à quelqu'un » sans dire de quel type de destinataire il
 * s'agit — l'ambiguïté serait une autorisation donnée à une entité non
 * identifiée.
 */
export const mediaGranteeTypeSchema = z.enum(["DEPARTMENT", "ADMIN_PROFILE"], "Type de destinataire invalide");

export const mediaAccessTargetSchema = z.object({
  granteeType: mediaGranteeTypeSchema,
  granteeId: z.uuid("Identifiant de destinataire invalide"),
});

export type MediaAccessTargetParams = z.infer<typeof mediaAccessTargetSchema>;

/**
 * Les trois droits, **indépendants**, et le refus d'une ligne vide.
 *
 * Le raffinement reproduit ici `media_access_at_least_one_right` : la base
 * refuserait de toute façon, mais elle le ferait après la décision d'accès, et
 * avec un message de contrainte. Refuser à la validation rend la réponse
 * exploitable — le client sait *quel champ* il a oublié, et non qu'une contrainte
 * SQL a échoué.
 *
 * Aucun des trois n'est déduit d'un autre (D-21) : un `canManage: true` n'ouvre
 * jamais `canUse`, et le schéma ne propose aucun raccourci qui le laisserait
 * croire.
 */
export const mediaRightsSchema = z
  .object({
    canUse: z.boolean().default(false),
    canManage: z.boolean().default(false),
    canDelete: z.boolean().default(false),
  })
  .refine((rights) => rights.canUse || rights.canManage || rights.canDelete, {
    message:
      "Un accès doit accorder au moins un droit (USE, MANAGE ou DELETE) : un droit vide n'est pas une autorisation",
  });

export type MediaRightsBody = z.infer<typeof mediaRightsSchema>;

/**
 * Refus explicite de `canDelete` sur un grant à un **département** (XD-07).
 *
 * La base l'interdit aussi (`media_access_department_no_delete`), et cette
 * redondance est assumée : elle transforme une erreur de contrainte en refus
 * lisible **avant** toute écriture. Le contrôle porte sur le couple
 * (destinataire, droits), donc sur le corps entier.
 */
export const grantMediaAccessSchema = z
  .object({
    granteeType: mediaGranteeTypeSchema,
    granteeId: z.uuid("Identifiant de destinataire invalide"),
    canUse: z.boolean().default(false),
    canManage: z.boolean().default(false),
    canDelete: z.boolean().default(false),
  })
  .refine((value) => value.canUse || value.canManage || value.canDelete, {
    message:
      "Un accès doit accorder au moins un droit (USE, MANAGE ou DELETE)",
  })
  .refine((value) => value.granteeType !== "DEPARTMENT" || value.canDelete === false, {
    message:
      "Un accès accordé à un département ne peut jamais porter DELETE (docs/028 XD-07, D-21)",
  });

export type GrantMediaAccessBody = z.infer<typeof grantMediaAccessSchema>;

export const paramsWithMediaAccessSchema = mediaIdParamSchema.merge(mediaAccessTargetSchema);

export type ParamsWithMediaAccess = z.infer<typeof paramsWithMediaAccessSchema>;
