import { z } from "zod";
import { paginationQuerySchema } from "@/shared/http/pagination";

/**
 * Schémas d'entrée du module d'administration.
 *
 * Toutes les routes de ce module sont des **lectures**, et aucune d'elles ne
 * reçoit d'identifiant : le profil courant est déduit du jeton vérifié — jamais
 * d'un paramètre d'URL — ce qui interdit de lire le profil d'un autre
 * administrateur. Il n'y a donc ni schéma de corps, ni schéma de paramètres à
 * déclarer ici : la seule entrée à valider est la *query* de la collection.
 */

/**
 * *Query* de `GET /admin/profiles` : pagination commune, bornes identiques au
 * reste de l'API (`page` ≥ 1, `limit` 1–100).
 *
 * Alias de la pagination commune, donc **strict** : c'est la convention de
 * toutes les collections, admin comprise.
 */
export const listAdminProfilesQuerySchema = paginationQuerySchema;

export type ListAdminProfilesQuery = z.infer<typeof listAdminProfilesQuerySchema>;
