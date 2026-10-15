ALTER TABLE "teachings" ALTER COLUMN "slug" DROP NOT NULL;--> statement-breakpoint
DROP INDEX IF EXISTS "teachings_slug_idx";--> statement-breakpoint
CREATE INDEX "teachings_slug_idx" ON "teachings" USING btree ("slug");
