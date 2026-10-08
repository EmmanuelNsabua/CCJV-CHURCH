/**
 * Point d'entrée unique du schéma Drizzle.
 *
 * `drizzle-kit` et les repositories importent depuis ce fichier : une seule
 * source de vérité, aucune divergence possible entre le schéma et les requêtes.
 */
export * from "./enums";
export * from "./admin";
export * from "./media";
export * from "./departments";
export * from "./events";
export * from "./publications";
export * from "./people";
export * from "./editorial";
export * from "./prayer-requests";
export * from "./notifications";
