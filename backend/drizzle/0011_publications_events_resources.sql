CREATE TABLE IF NOT EXISTS "resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"slug" varchar(220) NOT NULL,
	"description" text,
	"file" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "end_date" date;
--> statement-breakpoint
UPDATE "events" SET "end_date" = "event_date" WHERE "end_date" IS NULL;
--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "end_date" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "end_time" time;
--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "status" varchar(20) DEFAULT 'PUBLISHED' NOT NULL;
--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "department_id" DROP NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "resources_slug_idx" ON "resources" USING btree ("slug");
