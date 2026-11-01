ALTER TABLE "teachings" ADD COLUMN IF NOT EXISTS "department_id" uuid REFERENCES "departments"("id") ON DELETE SET NULL;
--> statement-breakpoint
ALTER TABLE "teachings" ADD COLUMN IF NOT EXISTS "scope" varchar(20) DEFAULT 'CCJV' NOT NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "teachings_department_idx" ON "teachings" ("department_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "teachings_scope_idx" ON "teachings" ("scope");
--> statement-breakpoint
ALTER TABLE "publications" ADD COLUMN IF NOT EXISTS "scope" varchar(20) DEFAULT 'CCJV' NOT NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "publications_scope_idx" ON "publications" ("scope");

