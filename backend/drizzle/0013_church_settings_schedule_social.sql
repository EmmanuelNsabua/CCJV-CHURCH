-- Migration 0013 : Module Paramètres de l'église (Rassemblements structurés, Catalogue réseaux sociaux, Contact & Localisation)

-- 1. جدول schedule_entries : prise en charge des rassemblements multi-jours et heures précises
ALTER TABLE "schedule_entries" ALTER COLUMN "day" TYPE varchar(100);
ALTER TABLE "schedule_entries" ADD COLUMN IF NOT EXISTS "days" text[];
ALTER TABLE "schedule_entries" ADD COLUMN IF NOT EXISTS "start_time" varchar(10);
ALTER TABLE "schedule_entries" ADD COLUMN IF NOT EXISTS "end_time" varchar(10);
ALTER TABLE "schedule_entries" ADD COLUMN IF NOT EXISTS "time_zone" varchar(80) DEFAULT 'Africa/Lubumbashi';

-- 2. جدول social_links : identifiant stable et drapeau d'activation
ALTER TABLE "social_links" ADD COLUMN IF NOT EXISTS "platform" varchar(40);
ALTER TABLE "social_links" ADD COLUMN IF NOT EXISTS "is_active" boolean NOT NULL DEFAULT true;

-- 3. Rétro-alimentation du catalogue des réseaux existants
UPDATE "social_links" SET "platform" = 'youtube' WHERE LOWER("label") LIKE '%youtube%' AND "platform" IS NULL;
UPDATE "social_links" SET "platform" = 'instagram' WHERE LOWER("label") LIKE '%instagram%' AND "platform" IS NULL;
UPDATE "social_links" SET "platform" = 'tiktok' WHERE LOWER("label") LIKE '%tiktok%' AND "platform" IS NULL;
UPDATE "social_links" SET "platform" = 'facebook' WHERE LOWER("label") LIKE '%facebook%' AND "platform" IS NULL;
UPDATE "social_links" SET "platform" = 'whatsapp' WHERE LOWER("label") LIKE '%whatsapp%' AND "platform" IS NULL;
UPDATE "social_links" SET "platform" = 'x' WHERE (LOWER("label") LIKE '%twitter%' OR LOWER("label") = 'x') AND "platform" IS NULL;
UPDATE "social_links" SET "platform" = 'other' WHERE "platform" IS NULL;
