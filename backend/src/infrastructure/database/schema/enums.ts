import { pgEnum } from "drizzle-orm/pg-core";

/**
 * Énumérations PostgreSQL.
 *
 * Les valeurs sont en MAJUSCULES pour `publication_type` et alignées sur
 * `src/types/index.ts` du frontend (`"VIDEO" | "PHOTO" | "TEXTE"`), et non sur
 * les minuscules de `docs/005` §2.4. Le contrat du frontend prime : il est
 * implémenté et ne doit pas être cassé (docs/018 §1).
 *
 * `admin_role` est un enum à valeur unique en V1, mais un enum PostgreSQL :
 * ajouter `ROLE_DEPARTMENT_EDITOR` se fera par `ALTER TYPE ... ADD VALUE`,
 * sans migration destructrice (docs/004 §24).
 */

export const adminRoleEnum = pgEnum("admin_role", ["ROLE_ADMIN"]);

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
