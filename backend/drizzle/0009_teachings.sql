CREATE TYPE "public"."teaching_media_role" AS ENUM('VIDEO', 'AUDIO', 'THUMBNAIL');--> statement-breakpoint
CREATE TABLE "teachings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(200) NOT NULL,
	"slug" varchar(220) NOT NULL,
	"speaker_name" varchar(150) NOT NULL,
	"preached_at" date NOT NULL,
	"summary" text,
	"description" text,
	"status" "publication_status" DEFAULT 'DRAFT' NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teaching_biblical_references" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"teaching_id" uuid NOT NULL,
	"book" varchar(100) NOT NULL,
	"start_chapter" integer NOT NULL,
	"start_verse" integer NOT NULL,
	"end_chapter" integer,
	"end_verse" integer,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teaching_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"teaching_id" uuid NOT NULL,
	"media_id" uuid NOT NULL,
	"role" "teaching_media_role" NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "teaching_biblical_references" ADD CONSTRAINT "teaching_biblical_references_teaching_id_teachings_id_fk" FOREIGN KEY ("teaching_id") REFERENCES "public"."teachings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teaching_media" ADD CONSTRAINT "teaching_media_teaching_id_teachings_id_fk" FOREIGN KEY ("teaching_id") REFERENCES "public"."teachings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teaching_media" ADD CONSTRAINT "teaching_media_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "teachings_slug_idx" ON "teachings" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "teachings_status_idx" ON "teachings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "teachings_preached_at_idx" ON "teachings" USING btree ("preached_at");--> statement-breakpoint
CREATE INDEX "teaching_biblical_ref_teaching_idx" ON "teaching_biblical_references" USING btree ("teaching_id");--> statement-breakpoint
CREATE INDEX "teaching_media_teaching_idx" ON "teaching_media" USING btree ("teaching_id");--> statement-breakpoint
CREATE INDEX "teaching_media_media_idx" ON "teaching_media" USING btree ("media_id");
