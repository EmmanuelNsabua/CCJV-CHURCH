-- Lot 7 — notifications (docs/032 §3.3, docs/030 §6.2).
--
-- Migration **purement additive** : un type énuméré et une table créés, 0 ligne
-- concernée (docs/033 M-H3). Elle n'est **pas appliquée** : comme les
-- précédentes, elle est préparée, prouvée par exécution annulée, et attend le feu
-- vert du commanditaire.
--
-- Conformité à docs/032 §3.3 :
--   · `reference_id` POLYMORPHE et SANS clé étrangère : soit un identifiant de
--     demande de prière — dont l'existence est invisible hors du schéma isolé —
--     soit une référence de clé. Une FK franchirait la frontière de privilèges
--     que docs/030 §4.6 interdit ;
--   · AUCUN contenu, aucun nom, aucun extrait, aucune longueur : « cette
--     interdiction est structurelle : les colonnes n'existent pas » ;
--   · `recipient_user_id` ON DELETE CASCADE : une notification sans destinataire
--     n'a plus d'objet, et D-14 étape 1 exige qu'un accès révoqué ne laisse rien.
--
-- ⚠️ DÉPENDANCE D'ORDRE, ÉTABLIE PAR EXÉCUTION — à lire avant d'appliquer.
--
-- Cette migration suppose la migration **0001** appliquée. Le trigger ci-dessous
-- lit le rôle du destinataire et le compare à `'ADMIN'`, valeur qui n'existe PAS
-- dans l'énumération `admin_role` tant que 0001 n'a pas reconstruit celle-ci.
--
-- Conséquence mesurée sur la base actuelle (exécution réelle, transaction
-- annulée) : **toute** écriture dans `notifications` échoue, y compris celles qui
-- devraient être acceptées, avec
--
--     invalid input value for enum admin_role: "ADMIN"
--
-- L'erreur ne vient pas d'un refus logique mais de la **résolution du littéral
-- d'énumération** : PostgreSQL refuse de comparer un rôle à une valeur qui
-- n'existe pas encore.
--
-- Ce n'est pas un défaut du trigger — c'est la transcription fidèle de
-- `docs/032` §3.3, qui décrit le schéma **cible**. Deux conséquences pratiques :
--
--   1. l'ordre d'application est **contractuel** : 0001 avant 0004. `docs/033`
--      le respecte déjà (É19 crée ces tables après la refonte des rôles) ;
--   2. l'échec est **total et bruyant**, jamais silencieux. La table venant
--      d'être créée et rien ne la lisant encore, appliquer 0004 avant 0001 ne
--      casserait aucun service — mais rendrait le diagnostic pénible.
--

CREATE TYPE "public"."notification_type" AS ENUM('PRAYER_REQUEST_RECEIVED', 'KEY_REGISTERED', 'KEY_REVOKED', 'RECOVERY_KEY_CHANGED');--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipient_user_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"reference_id" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_user_id_admin_profiles_id_fk" FOREIGN KEY ("recipient_user_id") REFERENCES "public"."admin_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notifications_recipient_idx" ON "notifications" USING btree ("recipient_user_id","is_read");--> statement-breakpoint
CREATE INDEX "notifications_created_at_idx" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "notifications_type_idx" ON "notifications" USING btree ("type");--> statement-breakpoint

-- ---------------------------------------------------------------------------------
-- [AJOUTÉ À LA MAIN] D-10 — « une exception absolue » (docs/028 D-03).
--
-- Transcrit **verbatim** depuis docs/032 §3.3. Drizzle ne sait pas exprimer un
-- trigger PL/pgSQL : cette portion doit survivre à toute régénération, et un
-- trigger perdu se traduirait immédiatement par des notifications de prière
-- envoyées à qui ne doit pas les recevoir.
--
-- Pourquoi un trigger et non un CHECK : la règle exige de lire
-- `public.admin_profiles` pour connaître le rôle du destinataire, et PostgreSQL
-- INTERDIT toute sous-requête dans une contrainte CHECK. Le trigger offre le même
-- niveau de garantie — il s'applique à toute écriture, y compris directe en base
-- — sans être déclaratif.
--
-- Deux règles, toutes deux fondées sur D-10 :
--   1. une notification de PRIÈRE ne vise que les ADMIN **actifs** (030 §6.2) ;
--   2. une notification de SÉCURITÉ des clés va à tous les Admins et JAMAIS au
--      SUPER_ADMIN (030 §4.7, §6.2).
--
-- C'est la différence entre une règle DÉCLARÉE (la policy, qui refuse déjà ces
-- cas) et une règle GARANTIE : un script d'administration ou un correctif manuel
-- ne produira pas davantage de notification interdite.
-- ---------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notifications_check_recipient_role()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  recipient_role admin_role;
  recipient_ok   boolean;
BEGIN
  SELECT p.role, (p.role = 'ADMIN' AND p.is_active) = true
    INTO recipient_role, recipient_ok
    FROM public.admin_profiles p
    WHERE p.id = NEW.recipient_user_id;

  IF recipient_role IS NULL THEN
    RAISE EXCEPTION 'notifications: destinataire % inexistant', NEW.recipient_user_id
      USING ERRCODE = 'foreign_key_violation';
  END IF;

  IF NEW.type = 'PRAYER_REQUEST_RECEIVED' AND NOT recipient_ok THEN
    RAISE EXCEPTION
      'D-10 / 030 §6.2: une notification PRAYER_REQUEST_RECEIVED ne peut viser '
      'qu''un ADMIN actif (destinataire % a le rôle %)',
      NEW.recipient_user_id, recipient_role
      USING ERRCODE = 'check_violation';
  END IF;

  IF NEW.type IN ('KEY_REGISTERED', 'KEY_REVOKED', 'RECOVERY_KEY_CHANGED')
     AND recipient_role <> 'ADMIN' THEN
    RAISE EXCEPTION
      'D-10 / 030 §6.2: une notification % est destinée aux ADMIN uniquement ; '
      'le SUPER_ADMIN ne reçoit AUCUNE notification du domaine des prières '
      '(destinataire % a le rôle %)',
      NEW.type, NEW.recipient_user_id, recipient_role
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;--> statement-breakpoint

CREATE TRIGGER notifications_recipient_role_check
  BEFORE INSERT OR UPDATE OF recipient_user_id, type ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.notifications_check_recipient_role();