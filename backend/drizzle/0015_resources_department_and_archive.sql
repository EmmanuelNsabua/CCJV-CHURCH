ALTER TABLE "resources" ADD COLUMN IF NOT EXISTS "department_id" uuid REFERENCES "departments"("id") ON DELETE SET NULL;
--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN IF NOT EXISTS "is_archived" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "resources_department_idx" ON "resources" ("department_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "resources_is_archived_idx" ON "resources" ("is_archived");

