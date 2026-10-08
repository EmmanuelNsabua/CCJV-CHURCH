-- Lot 1a — refonte du modèle de données d'identité (docs/028 D-01, D-02, D-05).
--
-- ⚠️ Ce fichier est GÉNÉRÉ par `npm run db:generate`, puis CORRIGÉ À LA MAIN.
-- L'ordre des opérations sur les énumérations est une contrainte PostgreSQL,
-- pas une préférence de style : `docs/033` §2.3.2. Les corrections apportées au
-- SQL produit par Drizzle sont marquées « [CORRIGÉ] » ci-dessous.
--
-- Ce fichier n'est PAS appliqué : l'application relève du commanditaire.

-- [CORRIGÉ 1] Le `DEFAULT 'ROLE_ADMIN'` hérité doit être retiré AVANT toute
-- conversion de type. Drizzle plaçait ce `DROP DEFAULT` APRÈS le
-- `SET DATA TYPE` : PostgreSQL refuse alors la conversion, le défaut restant
-- typé `admin_role` (« default for column "role" cannot be cast automatically »).
-- Le schéma cible (`docs/032` §3.3) ne prévoit aucun défaut sur `role` : il
-- n'est donc pas reposé.
ALTER TABLE "admin_profiles" ALTER COLUMN "role" DROP DEFAULT;--> statement-breakpoint

CREATE TYPE "public"."admin_scope" AS ENUM('GLOBAL', 'DEPARTMENT');--> statement-breakpoint

-- [CORRIGÉ 2] Un type énuméré ne se modifie pas en place : la séquence
-- « conversion en text → DROP TYPE → CREATE TYPE → conversion retour » est la
-- reconstruction du type. Elle est conservée telle que Drizzle la produit, à
-- une exception près, ci-dessous.
ALTER TABLE "admin_profiles" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."admin_role";--> statement-breakpoint
CREATE TYPE "public"."admin_role" AS ENUM('SUPER_ADMIN', 'ADMIN', 'DEPARTMENT_MANAGER');--> statement-breakpoint

-- [CORRIGÉ 3] Le `USING "role"::"admin_role"` généré ÉCHOUE : la valeur
-- existante `ROLE_ADMIN` n'existe plus dans le nouveau type (« invalid input
-- value for enum admin_role »). Le `CASE` mappe explicitement toutes les valeurs
-- survivantes — `ROLE_ADMIN` → `ADMIN`, conformément à D-05 (« le compte
-- administrateur déjà créé devient ADMIN »).
--
-- Note : `admin_role` est RECRÉÉ (CREATE TYPE), il n'est pas étendu par
-- `ALTER TYPE ... ADD VALUE`. La restriction « une valeur ajoutée par
-- `ADD VALUE` n'est pas utilisable dans la même transaction » NE S'APPLIQUE
-- DONC PAS ici : `'ADMIN'` est utilisable immédiatement. Aucun découpage en
-- deux migrations n'est nécessaire.
ALTER TABLE "admin_profiles" ALTER COLUMN "role" SET DATA TYPE "public"."admin_role" USING (CASE "role" WHEN 'ROLE_ADMIN' THEN 'ADMIN' ELSE "role" END)::"public"."admin_role";--> statement-breakpoint

-- [CORRIGÉ 4] `ADD COLUMN "scope" "admin_scope" NOT NULL` sans défaut est refusé
-- dès que la table contient une ligne (« column "scope" contains null values »).
-- Le schéma cible n'admet aucun défaut sur `scope` : la colonne est donc ajoutée
-- en trois temps — nullable, renseignée, puis contrainte (`docs/033` §2.3.2,
-- temps 1 et 3). Le compte préexistant est un `ADMIN` : `GLOBAL` est sa valeur,
-- et `department_id` reste nul pour lui (D-05).
--
-- [CORRIGÉ 5] Le type est `admin_scope` (`GLOBAL`, `DEPARTMENT`) et non
-- `user_scope` : `docs/032` §2.1 est normatif — « PRIVATE est un périmètre de
-- ressource, jamais un scope de profil ». Le périmètre privé des prières est
-- décidé par `PrayerPolicy`, il ne se déclare pas sur un profil.
ALTER TABLE "admin_profiles" ADD COLUMN "scope" "admin_scope";--> statement-breakpoint
UPDATE "admin_profiles" SET "scope" = 'GLOBAL' WHERE "scope" IS NULL;--> statement-breakpoint
ALTER TABLE "admin_profiles" ALTER COLUMN "scope" SET NOT NULL;--> statement-breakpoint

ALTER TABLE "admin_profiles" ADD COLUMN "department_id" uuid;--> statement-breakpoint

-- [CORRIGÉ 6] `RESTRICT` et non `SET NULL` (`docs/032` §3.1). Un `SET NULL`
-- produirait un `DEPARTMENT_MANAGER` sans département — précisément l'état que
-- la contrainte de cohérence ci-dessous interdit, et que `docs/029` §0.2 traduit
-- par « un department_id absent ou nul vaut refus ». Supprimer un département
-- qui porte un responsable est donc refusé : il faut réaffecter le compte
-- d'abord. C'est la lecture qui préserve l'accès, là où `SET NULL` l'aurait
-- silencieusement supprimé.
ALTER TABLE "admin_profiles" ADD CONSTRAINT "admin_profiles_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint

-- [CORRIGÉ 7] D-02 explicité en base (`docs/032` §3.1, contrainte
-- `admin_profiles_scope_coherence`). Elle est ajoutée APRÈS le renseignement de
-- `scope` et de `department_id`, et après le passage du compte hérité en
-- `ADMIN` + `GLOBAL` + `NULL` : la contrainte valide les lignes existantes, donc
-- l'ordre n'est pas cosmétique.
ALTER TABLE "admin_profiles" ADD CONSTRAINT "admin_profiles_scope_coherence" CHECK (("admin_profiles"."role" = 'DEPARTMENT_MANAGER' AND "admin_profiles"."scope" = 'DEPARTMENT' AND "admin_profiles"."department_id" IS NOT NULL) OR ("admin_profiles"."role" <> 'DEPARTMENT_MANAGER' AND "admin_profiles"."scope" = 'GLOBAL' AND "admin_profiles"."department_id" IS NULL));
