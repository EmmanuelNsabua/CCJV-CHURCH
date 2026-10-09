-- Migration 0006 — Départements de référence (arbitrage du commanditaire)
--
-- ÉCRITE À LA MAIN : c'est une migration de **données**, pas de schéma. Drizzle ne
-- génère que du DDL ; la transformation ci-dessous doit être explicite, traçable,
-- et rejouable — trois propriétés qu'un `UPDATE` généré n'aurait pas.
--
-- ---------------------------------------------------------------------------------
-- CE QUI EST REMPLACÉ, ET POURQUOI
-- ---------------------------------------------------------------------------------
-- Les trois départements `adultes`, `chorale` et `enfants-ecodim` proviennent des
-- données de démonstration d'origine. Le commanditaire les déclare **obsolètes** :
-- la liste de référence est celle du document organisationnel de l'église, dix
-- départements, dont les noms sont donnés ci-dessous en dur.
--
-- Les identifiants des dix départements sont **fixés et lisibles**
-- (`d0000000-0000-4000-8000-0000000000NN`) : c'est délibéré. Une migration de
-- données doit être **rejouable** et ses références **stables** — des UUID
-- aléatoires obligeraient à relire la base pour savoir où chaque événement a été
-- rattaché, et rendraient la transformation invérifiable. Ces valeurs n'ont aucune
-- prétention à représenter autre chose qu'elles-mêmes.
--
-- ---------------------------------------------------------------------------------
-- MAPPING DES RÉFÉRENCES HISTORIQUES (26 lignes, mesurées avant écriture)
-- ---------------------------------------------------------------------------------
-- Inventaire exhaustif des tables qui référencent `departments` :
--   department_media 18 lignes · events 5 · leaders 3 · admin_profiles 0 ·
--   department_capabilities 0
--
--   ancien                   → nouveau                     justification
--   ------------------------------------------------------------------------------
--   adultes                  → Les Serviteurs               le collège des
--     (2 « Culte dominical »)                               serviteurs est le
--                                                           successeur de
--                                                           l'assemblée adultes
--   chorale                  → La Chorale Grand Groupe CCVJ  les « Répétition de
--     (2 événements)                                        la chorale » sont du
--                                                           grand groupe
--   enfants-ecodim           → L'Ecodume                    `Ecodim` est
--     (1 « Rencontre Ecodim »,                              l'ancienne
--      1 responsable, sa galerie)                           appellation — règle
--                                                           explicite du
--                                                           commanditaire
--
-- ⚠️ Ces rattachements sont des **données de démonstration**. Ils sont cohérents
-- avec la nature apparente des contenus, ils ne sont pas des informations
-- historiques vérifiées, et ils sont modifiables depuis le back-office.
--
-- ---------------------------------------------------------------------------------
-- CAPACITÉS — seuls Presse et Ecodume publient
-- ---------------------------------------------------------------------------------
-- `PUBLICATION_SCOPE` marque l'entrée d'un département dans le périmètre des
-- publications (docs/035 §3.2, mécanisme D-25). Elle est accordée à **Presse** et
-- **Ecodume**, les deux seuls départements dotés d'un espace back-office
-- spécialisé — « Affaires Sociales » reste un département de présentation
-- statique, et l'existence d'un département n'implique aucun droit de gestion.
--
-- `EVENT_SCOPE_GLOBAL` marque la portée **globale** d'un événement. Elle est
-- accordée à **Presse** seule, sur le fondement explicite de `docs/029` §2.4 :
-- « ce que publie la Presse concerne tout le monde ; ce que publie l'Ecodume reste
-- un événement de l'Ecodume ». Aucun autre département ne la reçoit : c'est un
-- refus par défaut, jamais un oubli.
--
-- `granted_by` reste NUL : ces capacités sont posées par la migration, sans auteur
-- applicatif. La colonne est nullable précisément pour ce cas (docs/032 §3.5), et
-- le jour où quelqu'un les modifiera depuis le back-office, l'auteur sera inscrit.

-- ---------------------------------------------------------------------------------
-- 1. Les dix départements de référence
-- ---------------------------------------------------------------------------------
INSERT INTO "departments" ("id", "name", "slug", "position", "description") VALUES
  ('d0000000-0000-4000-8000-000000000001', 'Les Serviteurs',                'les-serviteurs',             1, NULL),
  ('d0000000-0000-4000-8000-000000000002', 'La Chorale Grand Groupe CCVJ',  'chorale-grand-groupe-ccjv',  2, NULL),
  ('d0000000-0000-4000-8000-000000000003', 'La Chorale de Cano Vocal',      'chorale-cano-vocal',         3, NULL),
  ('d0000000-0000-4000-8000-000000000004', 'L''Ecodume',                    'ecodume',                    4, NULL),
  ('d0000000-0000-4000-8000-000000000005', 'Affaires Sociales',             'affaires-sociales',          5, NULL),
  ('d0000000-0000-4000-8000-000000000006', 'Hygiène et Ancienneté',         'hygiene-et-anciennete',      6, NULL),
  ('d0000000-0000-4000-8000-000000000007', 'Protocole',                     'protocole',                  7, NULL),
  ('d0000000-0000-4000-8000-000000000008', 'Évangélisation',                'evangelisation',             8, NULL),
  ('d0000000-0000-4000-8000-000000000009', 'Intercession',                  'intercession',               9, NULL),
  ('d0000000-0000-4000-8000-00000000000a', 'Presse',                        'presse',                    10, NULL)
ON CONFLICT ("slug") DO NOTHING;--> statement-breakpoint

-- ---------------------------------------------------------------------------------
-- 2. Reprise des références — AVANT toute suppression
-- ---------------------------------------------------------------------------------
-- L'ordre est contractuel : si la suppression des anciens départements précédait la
-- reprise, `department_media` perdrait ses galeries par `CASCADE`, et `events` et
-- `leaders` verraient leur rattachement passer à `NULL` par `SET NULL`. On ne
-- « supprime pas aveuglément les données historiques » : on les **rattache**.
UPDATE "department_media" SET "department_id" = 'd0000000-0000-4000-8000-000000000001'
  WHERE "department_id" = (SELECT "id" FROM "departments" WHERE "slug" = 'adultes');--> statement-breakpoint
UPDATE "department_media" SET "department_id" = 'd0000000-0000-4000-8000-000000000002'
  WHERE "department_id" = (SELECT "id" FROM "departments" WHERE "slug" = 'chorale');--> statement-breakpoint
UPDATE "department_media" SET "department_id" = 'd0000000-0000-4000-8000-000000000004'
  WHERE "department_id" = (SELECT "id" FROM "departments" WHERE "slug" = 'enfants-ecodim');--> statement-breakpoint

UPDATE "events" SET "department_id" = 'd0000000-0000-4000-8000-000000000001'
  WHERE "department_id" = (SELECT "id" FROM "departments" WHERE "slug" = 'adultes');--> statement-breakpoint
UPDATE "events" SET "department_id" = 'd0000000-0000-4000-8000-000000000002'
  WHERE "department_id" = (SELECT "id" FROM "departments" WHERE "slug" = 'chorale');--> statement-breakpoint
UPDATE "events" SET "department_id" = 'd0000000-0000-4000-8000-000000000004'
  WHERE "department_id" = (SELECT "id" FROM "departments" WHERE "slug" = 'enfants-ecodim');--> statement-breakpoint

UPDATE "leaders" SET "department_id" = 'd0000000-0000-4000-8000-000000000001'
  WHERE "department_id" = (SELECT "id" FROM "departments" WHERE "slug" = 'adultes');--> statement-breakpoint
UPDATE "leaders" SET "department_id" = 'd0000000-0000-4000-8000-000000000002'
  WHERE "department_id" = (SELECT "id" FROM "departments" WHERE "slug" = 'chorale');--> statement-breakpoint
UPDATE "leaders" SET "department_id" = 'd0000000-0000-4000-8000-000000000004'
  WHERE "department_id" = (SELECT "id" FROM "departments" WHERE "slug" = 'enfants-ecodim');--> statement-breakpoint

UPDATE "admin_profiles" SET "department_id" = 'd0000000-0000-4000-8000-000000000001'
  WHERE "department_id" = (SELECT "id" FROM "departments" WHERE "slug" = 'adultes');--> statement-breakpoint
UPDATE "admin_profiles" SET "department_id" = 'd0000000-0000-4000-8000-000000000004'
  WHERE "department_id" = (SELECT "id" FROM "departments" WHERE "slug" = 'enfants-ecodim');--> statement-breakpoint

-- ---------------------------------------------------------------------------------
-- 3. Retrait des trois départements obsolètes
-- ---------------------------------------------------------------------------------
-- Ils ne portent plus aucune référence : l'étape 2 les a toutes reprises. La
-- suppression est donc l'aboutissement d'une transformation explicite, et non un
-- effacement. La garde `NOT EXISTS` est une ceinture de sécurité : si une référence
-- subsistait (table ajoutée plus tard, ligne créée entre-temps), la suppression est
-- **annulée** plutôt que de propager un `SET NULL` ou un `CASCADE` silencieux.
DELETE FROM "departments"
 WHERE "slug" IN ('adultes', 'chorale', 'enfants-ecodim')
   AND NOT EXISTS (SELECT 1 FROM "department_media" dm WHERE dm."department_id" = "departments"."id")
   AND NOT EXISTS (SELECT 1 FROM "events" e WHERE e."department_id" = "departments"."id")
   AND NOT EXISTS (SELECT 1 FROM "leaders" l WHERE l."department_id" = "departments"."id")
   AND NOT EXISTS (SELECT 1 FROM "admin_profiles" ap WHERE ap."department_id" = "departments"."id");--> statement-breakpoint

-- ---------------------------------------------------------------------------------
-- 4. Capacités — seuls Presse et Ecodume publient ; seule la Presse publie « global »
-- ---------------------------------------------------------------------------------
INSERT INTO "department_capabilities" ("department_id", "capability") VALUES
  ('d0000000-0000-4000-8000-000000000004', 'PUBLICATION_SCOPE'),
  ('d0000000-0000-4000-8000-00000000000a', 'PUBLICATION_SCOPE'),
  ('d0000000-0000-4000-8000-00000000000a', 'EVENT_SCOPE_GLOBAL')
ON CONFLICT ("department_id", "capability") DO NOTHING;
