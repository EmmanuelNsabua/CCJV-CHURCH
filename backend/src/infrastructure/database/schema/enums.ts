import { pgEnum } from "drizzle-orm/pg-core";

/**
 * Énumérations PostgreSQL.
 *
 * Les valeurs sont en MAJUSCULES pour `publication_type` et alignées sur
 * `src/types/index.ts` du frontend (`"VIDEO" | "PHOTO" | "TEXTE"`), et non sur
 * les minuscules de `docs/005` §2.4. Le contrat du frontend prime : il est
 * implémenté et ne doit pas être cassé (docs/018 §1).
 *
 * `admin_role` porte les **trois rôles techniques** de `docs/028` D-01.
 * « Responsable Presse » et « Responsable Ecodume » ne sont **pas** des rôles
 * distincts : ce sont deux **instances** du même rôle `DEPARTMENT_MANAGER`,
 * différenciées par leur `department_id` (D-02). Le RBAC ne code donc jamais
 * `PRESSE` ou `ECODUME` comme rôle.
 *
 * L'ancienne valeur `ROLE_ADMIN` **disparaît** de ce type : elle n'existait que
 * dans l'implémentation V1, jamais dans le modèle de conception. Un enum
 * PostgreSQL ne se modifie pas en place — la migration associée recrée le type
 * (cf. `docs/033` §2.3.2).
 */

export const adminRoleEnum = pgEnum("admin_role", [
  "SUPER_ADMIN",
  "ADMIN",
  "DEPARTMENT_MANAGER",
]);

/**
 * Périmètre d'action d'un profil (`docs/028` D-01, D-02, D-03).
 *
 * `role` dit **ce que** le compte peut faire ; `scope` dit **sur quoi**.
 * Un `DEPARTMENT_MANAGER` porte `DEPARTMENT` et un `department_id` non nul ;
 * les rôles système portent `GLOBAL` (cf. `docs/032` §3.3).
 *
 * `PRIVATE` désigne le périmètre des données privées — les demandes de prière,
 * dont la lecture est refusée au `SUPER_ADMIN` (D-03, D-10). Il ne se confond
 * ni avec un rôle, ni avec `DEPARTMENT`.
 */
export const userScopeEnum = pgEnum("user_scope", [
  "GLOBAL",
  "DEPARTMENT",
  "PRIVATE",
]);

export const publicationTypeEnum = pgEnum("publication_type", [
  "VIDEO",
  "PHOTO",
  "TEXTE",
]);

/** Rubrique éditoriale du frontend : pilote le routage et le filtrage. */
export const publicationCategoryEnum = pgEnum("publication_category", [
  "ACTUALITE",
  "ENSEIGNEMENT",
  "MEDIA",
  "RESSOURCE",
]);

/**
 * `DRAFT` permet la dépublication demandée par le cahier §8.
 * La valeur par défaut est `PUBLISHED` : une publication créée est visible,
 * sauf choix explicite de brouillon (docs/018 §1, arbitrage n°6).
 */
export const publicationStatusEnum = pgEnum("publication_status", [
  "DRAFT",
  "PUBLISHED",
]);

/** Niveau de confidentialité choisi par la personne qui dépose une intention. */
export const prayerConfidentialityEnum = pgEnum("prayer_confidentiality", [
  "private",
  "community",
]);

export const prayerStatusEnum = pgEnum("prayer_status", ["NEW", "PRAYED"]);
