-- Lot 4 (Publications) et Lot 6 (Événements) — colonnes, contraintes, trigger et
-- données de démonstration.
--
-- GÉNÉRÉE par `npm run db:generate`, puis REPRISE À LA MAIN. Deux instructions du
-- SQL produit étaient inexécutables sur une table peuplée, et ce n'est pas un
-- détail de style :
--
--   1. `ADD COLUMN publications.department_id uuid NOT NULL` sans défaut est
--      refusé dès que la table contient une ligne (10 publications) ;
--   2. `ALTER TABLE events ALTER COLUMN department_id SET NOT NULL` échoue tant
--      qu'une ligne porte `NULL` (2 événements).
--
-- D'où la séquence **nullable → renseignement → NOT NULL**, qui est celle de
-- `docs/033` §2.3.2. Les reprises de données sont les arbitrages autorisés par le
-- commanditaire : des données de **démonstration**, modifiables depuis le
-- back-office, jamais présentées comme des informations vérifiées de l'église.

-- ---------------------------------------------------------------------------------
-- 1. Colonnes, d'abord NULLABLES
-- ---------------------------------------------------------------------------------
ALTER TABLE "events" ADD COLUMN "visibility_scope" "event_visibility_scope" DEFAULT 'DEPARTMENT' NOT NULL;--> statement-breakpoint
ALTER TABLE "publications" ADD COLUMN "department_id" uuid;--> statement-breakpoint
ALTER TABLE "publications" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint

-- ---------------------------------------------------------------------------------
-- 2. Reprise des données — ARBITRAGES DE DÉMONSTRATION
-- ---------------------------------------------------------------------------------
-- Rattachement des 10 publications à **Presse** ou **Ecodume**, les deux seuls
-- départements dotés d'un espace back-office spécialisé (`PUBLICATION_SCOPE`,
-- accordée par la migration 0006). La répartition suit la nature apparente du
-- contenu — choix pragmatique, pas donnée historique :
--
--   Ecodume (4) : contenus liés aux enfants, aux jeunes et à la vie communautaire.
--   Presse   (6) : enseignements, ressources, albums et reportages, qui relèvent
--                 de la communication de l'église.
UPDATE "publications" SET "department_id" = 'd0000000-0000-4000-8000-000000000004'
 WHERE "title" IN (
   'Vie de l''Ecodim en images',
   'Annonce — Rentrée de l''Ecodim',
   'Nouvelle saison des groupes de maison',
   'Journée communautaire en images'
 );--> statement-breakpoint

UPDATE "publications" SET "department_id" = 'd0000000-0000-4000-8000-00000000000a'
 WHERE "department_id" IS NULL;--> statement-breakpoint

-- ---------------------------------------------------------------------------------
-- 3. Règle globale des 3 — archivage des 7 plus anciennes (docs/035 §1)
-- ---------------------------------------------------------------------------------
-- « PUBLISHED ≤ 3, toutes catégories et tous départements confondus » : sur les 10
-- publications existantes, **7 doivent être archivées**, définitivement. C'est
-- l'étape É24 de `docs/033`, et elle est **irréversible** (D-18).
--
-- L'ordre est celui de la règle : `published_at ASC, id ASC`. Les trois conservées
-- sont donc les trois plus récentes (2026-09-27, 2026-10-01, 2026-10-04).
--
-- Cette écriture est faite **une fois**, en migration, et non par le service : le
-- dépassement existait avant la règle, et la règle ne le résorbe pas en cascade
-- (`planPublication` n'archive qu'une ligne par publication — décision
-- délibérée, testée). Résorber un dépassement est une opération explicite, relue ;
-- c'est exactement ce que cette migration est.
UPDATE "publications"
   SET "status" = 'ARCHIVED', "archived_at" = now()
 WHERE "status" = 'PUBLISHED'
   AND "id" IN (
     SELECT "id" FROM "publications"
      WHERE "status" = 'PUBLISHED'
      ORDER BY "published_at" ASC, "id" ASC
      LIMIT 7
   );--> statement-breakpoint

-- ---------------------------------------------------------------------------------
-- 4. Contraintes, maintenant que les données sont conformes
-- ---------------------------------------------------------------------------------
ALTER TABLE "publications" ALTER COLUMN "department_id" SET NOT NULL;--> statement-breakpoint

-- Les 2 événements sans département reçoivent un **responsable** cohérent avec leur
-- nature. Le département dit *qui est responsable* ; la portée publique est
-- distincte (D-26) et traitée au point 5.
--
--   « Journée communautaire » (2026-09-22) → **Protocole** : une journée qui
--   rassemble toute l'église relève de l'organisation des rassemblements.
--   « Culte spécial — Action de grâces » (2026-10-22) → **Les Serviteurs** : un
--   culte institutionnel relève du collège qui porte la vie de l'église.
UPDATE "events" SET "department_id" = 'd0000000-0000-4000-8000-000000000007'
 WHERE "title" = 'Journée communautaire' AND "department_id" IS NULL;--> statement-breakpoint
UPDATE "events" SET "department_id" = 'd0000000-0000-4000-8000-000000000001'
 WHERE "title" = 'Culte spécial — Action de grâces' AND "department_id" IS NULL;--> statement-breakpoint

-- Toute ligne restante (créée entre-temps, ou dont le titre a changé) reçoit le
-- département de repli documenté — jamais `NULL`, car la contrainte suit.
UPDATE "events" SET "department_id" = 'd0000000-0000-4000-8000-000000000001'
 WHERE "department_id" IS NULL;--> statement-breakpoint

ALTER TABLE "events" DROP CONSTRAINT "events_department_id_departments_id_fk";--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "department_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publications" ADD CONSTRAINT "publications_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "publications_department_idx" ON "publications" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "publications_quota_idx" ON "publications" USING btree ("published_at","id") WHERE "publications"."status" = 'PUBLISHED';--> statement-breakpoint

-- ---------------------------------------------------------------------------------
-- 5. Portée publique des deux événements — la distinction D-26 en donnée
-- ---------------------------------------------------------------------------------
-- « Un événement peut être **transversal** sans perdre son rattachement
-- organisationnel. » Les deux reçoivent donc une portée `GLOBAL`, et **leurs
-- départements reçoivent la capacité correspondante** — sans quoi le trigger du
-- point 6 refuserait l'écriture, et c'est exactement ce qu'on attend de lui.
--
-- Ces capacités sont des **données de démonstration** : le back-office les
-- modifiera sans migration.
INSERT INTO "department_capabilities" ("department_id", "capability") VALUES
  ('d0000000-0000-4000-8000-000000000007', 'EVENT_SCOPE_GLOBAL'),
  ('d0000000-0000-4000-8000-000000000001', 'EVENT_SCOPE_GLOBAL')
ON CONFLICT ("department_id", "capability") DO NOTHING;--> statement-breakpoint

UPDATE "events" SET "visibility_scope" = 'GLOBAL'
 WHERE "title" IN ('Journée communautaire', 'Culte spécial — Action de grâces');--> statement-breakpoint

-- ---------------------------------------------------------------------------------
-- 6. Trigger de cohérence des capacités — docs/032 §3.6, transcrit verbatim
-- ---------------------------------------------------------------------------------
-- Drizzle ne sait pas exprimer un trigger PL/pgSQL : cette portion est ajoutée à la
-- main et doit survivre à toute régénération. Sans elle, `visibility_scope =
-- 'GLOBAL'` ne serait qu'une convention : le contrôle passerait par la seule
-- policy, qu'un script d'administration contourne. C'est D-25 appliqué **en base**.
CREATE OR REPLACE FUNCTION public.events_check_visibility_scope()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  has_global_capability boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.department_capabilities
    WHERE department_id = NEW.department_id
      AND capability    = 'EVENT_SCOPE_GLOBAL'
  ) INTO has_global_capability;

  IF NEW.visibility_scope = 'GLOBAL' AND NOT has_global_capability THEN
    RAISE EXCEPTION
      'D-25/D-26: le département % ne détient pas la capacité EVENT_SCOPE_GLOBAL; '
      'visibility_scope = GLOBAL est refusé', NEW.department_id
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;--> statement-breakpoint

CREATE TRIGGER events_visibility_scope_coherence
  BEFORE INSERT OR UPDATE OF visibility_scope, department_id ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.events_check_visibility_scope();
