CREATE TYPE "public"."media_access_mode" AS ENUM('USE', 'MANAGE', 'DELETE');--> statement-breakpoint
CREATE TYPE "public"."media_grantee_type" AS ENUM('DEPARTMENT', 'ADMIN_PROFILE');--> statement-breakpoint
CREATE TABLE "media_access" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"media_id" uuid NOT NULL,
	"grantee_type" "media_grantee_type" NOT NULL,
	"grantee_id" uuid NOT NULL,
	"can_use" boolean DEFAULT false NOT NULL,
	"can_manage" boolean DEFAULT false NOT NULL,
	"can_delete" boolean DEFAULT false NOT NULL,
	"granted_by" uuid NOT NULL,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_access_at_least_one_right" CHECK ("media_access"."can_use" OR "media_access"."can_manage" OR "media_access"."can_delete"),
	CONSTRAINT "media_access_department_no_delete" CHECK ("media_access"."grantee_type" <> 'DEPARTMENT' OR "media_access"."can_delete" = false),
	CONSTRAINT "media_access_timestamps_order" CHECK ("media_access"."updated_at" >= "media_access"."granted_at")
);
--> statement-breakpoint
ALTER TABLE "media_access" ADD CONSTRAINT "media_access_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_access" ADD CONSTRAINT "media_access_granted_by_admin_profiles_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."admin_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "media_access_department_unique" ON "media_access" USING btree ("media_id","grantee_id") WHERE "media_access"."grantee_type" = 'DEPARTMENT';--> statement-breakpoint
CREATE UNIQUE INDEX "media_access_profile_unique" ON "media_access" USING btree ("media_id","grantee_id") WHERE "media_access"."grantee_type" = 'ADMIN_PROFILE';--> statement-breakpoint
CREATE INDEX "media_access_grantee_idx" ON "media_access" USING btree ("grantee_id");--> statement-breakpoint

-- ---------------------------------------------------------------------------------
-- [AJOUTÉ À LA MAIN] Vérification de l'existence du destinataire.
--
-- Drizzle ne sait pas exprimer un trigger PL/pgSQL : cette portion est transcrite
-- **verbatim** depuis docs/032 §3.4, et c'est la seule partie de ce fichier que
-- `npm run db:generate` ne reproduira pas. Elle doit donc survivre à toute
-- régénération — un trigger perdu se traduirait par des droits accordés à un
-- département qui n'existe pas.
--
-- Pourquoi un trigger plutôt qu'une clé étrangère : `grantee_id` est
-- POLYMORPHE (département ou profil, selon `grantee_type`) et une FK
-- conditionnelle n'existe pas en SQL. docs/033 R-NT1 signale la réserve : un
-- trigger reste « contournable par désactivation ». Elle est connue et assumée —
-- l'alternative serait de scinder la table en deux, ce qu'aucune décision ne
-- retient, et ce que l'unicité partielle par type rend inutile.
--
-- L'erreur est levée avec ERRCODE = 'foreign_key_violation' (23503) : le service
-- la reconnaît comme un conflit de référence, comme il reconnaîtrait une FK.
-- ---------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.media_access_check_grantee()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.grantee_type = 'DEPARTMENT' THEN
    IF NOT EXISTS (SELECT 1 FROM public.departments WHERE id = NEW.grantee_id) THEN
      RAISE EXCEPTION 'media_access: département % inexistant', NEW.grantee_id
        USING ERRCODE = 'foreign_key_violation';
    END IF;
  ELSIF NEW.grantee_type = 'ADMIN_PROFILE' THEN
    IF NOT EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = NEW.grantee_id) THEN
      RAISE EXCEPTION 'media_access: profil % inexistant', NEW.grantee_id
        USING ERRCODE = 'foreign_key_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;--> statement-breakpoint

CREATE TRIGGER media_access_grantee_exists
  BEFORE INSERT OR UPDATE OF grantee_type, grantee_id ON public.media_access
  FOR EACH ROW EXECUTE FUNCTION public.media_access_check_grantee();