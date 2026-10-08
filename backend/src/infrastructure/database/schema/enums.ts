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
 * ⚠️ **Deux valeurs, et non trois.** `docs/032` §2.1 est normatif : « PRIVATE
 * est un périmètre de **ressource**, jamais un scope de profil ». Le périmètre
 * privé des demandes de prière (D-03, D-10) est porté par la **ressource** et
 * décidé par `PrayerPolicy` : il n'est pas déclaré sur le profil, sinon le refus
 * opposé au `SUPER_ADMIN` dépendrait d'une donnée modifiable — ce que D-03
 * interdit (« garantie cryptographiquement, pas seulement par une policy »).
 * Le nom du type lui-même (`admin_scope`, et non `user_scope`) vient de
 * `docs/032` §3.2.
 */
export const adminScopeEnum = pgEnum("admin_scope", ["GLOBAL", "DEPARTMENT"]);

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

/**
 * Destinataire d'un accès média (`docs/032` §3.2, `media_grantee_type`).
 *
 * Deux formes, et deux seulement : un **département** (l'accès profite à tous ses
 * responsables) ou un **profil** nommément désigné. `media_access.grantee_id`
 * étant polymorphe, c'est cette colonne qui dit comment l'interpréter — et c'est
 * aussi elle qui porte les deux index uniques partiels, un par type de
 * destinataire (`docs/032` §3.4).
 */
export const mediaGranteeTypeEnum = pgEnum("media_grantee_type", [
  "DEPARTMENT",
  "ADMIN_PROFILE",
]);

/**
 * Vocabulaire des droits média (`docs/032` §3.2).
 *
 * ⚠️ **Ce type ne sert de colonne nulle part**, et c'est délibéré : `media_access`
 * porte **trois colonnes booléennes indépendantes**, parce que D-21 interdit toute
 * hiérarchie (« pas de hiérarchie `DELETE ⊃ MANAGE ⊃ USE` »). Un type énuméré
 * unique aurait au contraire suggéré une échelle — le genre de forme qui produit
 * une déduction. Il est conservé pour ce qu'il documente : le **vocabulaire
 * arrêté** des trois droits, et la trace de la décision.
 */
export const mediaAccessModeEnum = pgEnum("media_access_mode", [
  "USE",
  "MANAGE",
  "DELETE",
]);

export const prayerStatusEnum = pgEnum("prayer_status", ["NEW", "PRAYED"]);

/**
 * Types de notification (`docs/032` §3.2, `notification_type`).
 *
 * Liste **volontairement minimale**, et c'est une décision : `docs/032` §3.2
 * refuse d'ajouter « une valeur générique de notification métier » — « aucune
 * décision n'a été prise ». Les quatre valeurs existantes viennent toutes d'un
 * texte :
 *
 * - `PRAYER_REQUEST_RECEIVED` — la « **seule** valeur existante » de `023`/`022`
 *   (`docs/030` §6.2) ;
 * - `KEY_REGISTERED`, `KEY_REVOKED`, `RECOVERY_KEY_CHANGED` — exigées par
 *   `docs/030` §4.7 et §6.2 pour le cycle de vie des clés de prière.
 *
 * ⚠️ **Aucune valeur `PRAYER_*` n'existe dans `audit_log`** (`docs/030` A11) : le
 * registre d'audit général est lisible par le `SUPER_ADMIN`, et un événement de
 * prière y serait une fuite. Les deux vocabulaires ne se croisent pas.
 */
export const notificationTypeEnum = pgEnum("notification_type", [
  "PRAYER_REQUEST_RECEIVED",
  "KEY_REGISTERED",
  "KEY_REVOKED",
  "RECOVERY_KEY_CHANGED",
]);
