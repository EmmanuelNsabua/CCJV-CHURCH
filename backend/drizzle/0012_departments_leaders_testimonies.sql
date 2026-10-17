DO $$ BEGIN
  CREATE TYPE "testimony_status" AS ENUM('PENDING', 'PUBLISHED', 'REJECTED', 'ARCHIVED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "departments" ADD COLUMN IF NOT EXISTS "mission" text;
--> statement-breakpoint
ALTER TABLE "departments" ADD COLUMN IF NOT EXISTS "history" text;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "department_activities" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "department_id" uuid NOT NULL REFERENCES "departments"("id") ON DELETE CASCADE,
  "title" varchar(150) NOT NULL,
  "description" text,
  "image_media_id" uuid REFERENCES "media"("id") ON DELETE SET NULL,
  "position" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "department_activities_department_idx" ON "department_activities" ("department_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "department_activities_position_idx" ON "department_activities" ("department_id", "position");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "department_archives" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "original_department_id" uuid NOT NULL,
  "name" varchar(100) NOT NULL,
  "slug" varchar(160) NOT NULL,
  "snapshot" jsonb NOT NULL,
  "archived_by" uuid REFERENCES "admin_profiles"("id") ON DELETE SET NULL,
  "archived_at" timestamp with time zone DEFAULT now() NOT NULL,
  "reason" text
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "department_archives_original_id_idx" ON "department_archives" ("original_department_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "department_archives_slug_idx" ON "department_archives" ("slug");
--> statement-breakpoint
ALTER TABLE "leaders" DROP COLUMN IF EXISTS "scope";
--> statement-breakpoint
ALTER TABLE "leaders" DROP COLUMN IF EXISTS "bio";
--> statement-breakpoint
ALTER TABLE "testimonies" ADD COLUMN IF NOT EXISTS "content" text;
--> statement-breakpoint
UPDATE "testimonies" SET "content" = "quote" WHERE "content" IS NULL;
--> statement-breakpoint
ALTER TABLE "testimonies" ADD COLUMN IF NOT EXISTS "author_name" varchar(120);
--> statement-breakpoint
UPDATE "testimonies" SET "author_name" = "person_name" WHERE "author_name" IS NULL;
--> statement-breakpoint
ALTER TABLE "testimonies" ADD COLUMN IF NOT EXISTS "is_anonymous" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "testimonies" ADD COLUMN IF NOT EXISTS "status" "testimony_status" DEFAULT 'PENDING' NOT NULL;
--> statement-breakpoint
UPDATE "testimonies" SET "status" = 'PUBLISHED' WHERE "status" = 'PENDING';
--> statement-breakpoint
ALTER TABLE "testimonies" ADD COLUMN IF NOT EXISTS "is_featured" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "testimonies" ADD COLUMN IF NOT EXISTS "consented_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "testimonies" ADD COLUMN IF NOT EXISTS "published_at" timestamp with time zone;
--> statement-breakpoint
UPDATE "testimonies" SET "published_at" = "created_at" WHERE "status" = 'PUBLISHED' AND "published_at" IS NULL;
--> statement-breakpoint
ALTER TABLE "testimonies" ADD COLUMN IF NOT EXISTS "reviewed_by" uuid REFERENCES "admin_profiles"("id") ON DELETE SET NULL;
--> statement-breakpoint
ALTER TABLE "testimonies" ADD COLUMN IF NOT EXISTS "reviewed_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "testimonies" ADD COLUMN IF NOT EXISTS "admin_notes" text;
--> statement-breakpoint
ALTER TABLE "testimonies" DROP COLUMN IF EXISTS "person_role";
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "testimonies_status_idx" ON "testimonies" ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "testimonies_featured_idx" ON "testimonies" ("is_featured");
