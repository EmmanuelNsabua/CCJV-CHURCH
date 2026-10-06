CREATE TYPE "public"."admin_role" AS ENUM('ROLE_ADMIN');--> statement-breakpoint
CREATE TYPE "public"."prayer_confidentiality" AS ENUM('private', 'community');--> statement-breakpoint
CREATE TYPE "public"."prayer_status" AS ENUM('NEW', 'PRAYED');--> statement-breakpoint
CREATE TYPE "public"."publication_category" AS ENUM('ACTUALITE', 'ENSEIGNEMENT', 'MEDIA', 'RESSOURCE');--> statement-breakpoint
CREATE TYPE "public"."publication_status" AS ENUM('DRAFT', 'PUBLISHED');--> statement-breakpoint
CREATE TYPE "public"."publication_type" AS ENUM('VIDEO', 'PHOTO', 'TEXTE');--> statement-breakpoint
CREATE TABLE "admin_profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"username" varchar(50) NOT NULL,
	"display_name" varchar(120),
	"role" "admin_role" DEFAULT 'ROLE_ADMIN' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bucket" varchar(100) NOT NULL,
	"path" text NOT NULL,
	"public_url" text NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"size_bytes" integer NOT NULL,
	"width" integer,
	"height" integer,
	"alt" text,
	"uploaded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_path_unique" UNIQUE("path")
);
--> statement-breakpoint
CREATE TABLE "department_media" (
	"department_id" uuid NOT NULL,
	"media_id" uuid NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "department_media_department_id_media_id_pk" PRIMARY KEY("department_id","media_id")
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(160) NOT NULL,
	"description" text,
	"responsible_name" varchar(120),
	"tagline" varchar(200),
	"meeting_schedule" varchar(255),
	"key_points" text[],
	"banner_media_id" uuid,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_media" (
	"event_id" uuid NOT NULL,
	"media_id" uuid NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "event_media_event_id_media_id_pk" PRIMARY KEY("event_id","media_id")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(150) NOT NULL,
	"slug" varchar(180) NOT NULL,
	"description" text,
	"excerpt" text,
	"event_date" date NOT NULL,
	"event_time" time,
	"location" varchar(150),
	"image_media_id" uuid,
	"banner_media_id" uuid,
	"department_id" uuid,
	"practical_info" text[],
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "publications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(150) NOT NULL,
	"slug" varchar(180) NOT NULL,
	"type" "publication_type" NOT NULL,
	"category" "publication_category" NOT NULL,
	"content_url" text,
	"description" text,
	"body" text[],
	"author" varchar(120),
	"published_at" date NOT NULL,
	"status" "publication_status" DEFAULT 'PUBLISHED' NOT NULL,
	"cover_media_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_faces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"person_name" varchar(120) NOT NULL,
	"caption" text NOT NULL,
	"photo_media_id" uuid,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leaders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"role" varchar(120) NOT NULL,
	"scope" varchar(120),
	"bio" text,
	"photo_media_id" uuid,
	"department_id" uuid,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "testimonies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quote" text NOT NULL,
	"person_name" varchar(120) NOT NULL,
	"person_role" varchar(120),
	"photo_media_id" uuid,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "schedule_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"day" varchar(20) NOT NULL,
	"title" varchar(120) NOT NULL,
	"time_label" varchar(60) NOT NULL,
	"audience" varchar(120),
	"is_confirmed" boolean DEFAULT false NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scriptures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(60) NOT NULL,
	"text" text NOT NULL,
	"reference" varchar(80) NOT NULL,
	"translation" varchar(80) DEFAULT 'Louis Segond 1910' NOT NULL,
	"context" varchar(200),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"key" varchar(80) PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" varchar(60) NOT NULL,
	"href" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "static_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page_key" varchar(60) NOT NULL,
	"content" jsonb NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prayer_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_text" text NOT NULL,
	"requester_name" varchar(120),
	"requester_contact" varchar(120),
	"confidentiality" "prayer_confidentiality" DEFAULT 'private' NOT NULL,
	"status" "prayer_status" DEFAULT 'NEW' NOT NULL,
	"handled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_uploaded_by_admin_profiles_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."admin_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "department_media" ADD CONSTRAINT "department_media_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "department_media" ADD CONSTRAINT "department_media_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_banner_media_id_media_id_fk" FOREIGN KEY ("banner_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_media" ADD CONSTRAINT "event_media_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_media" ADD CONSTRAINT "event_media_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_image_media_id_media_id_fk" FOREIGN KEY ("image_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_banner_media_id_media_id_fk" FOREIGN KEY ("banner_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publications" ADD CONSTRAINT "publications_cover_media_id_media_id_fk" FOREIGN KEY ("cover_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_faces" ADD CONSTRAINT "community_faces_photo_media_id_media_id_fk" FOREIGN KEY ("photo_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leaders" ADD CONSTRAINT "leaders_photo_media_id_media_id_fk" FOREIGN KEY ("photo_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leaders" ADD CONSTRAINT "leaders_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testimonies" ADD CONSTRAINT "testimonies_photo_media_id_media_id_fk" FOREIGN KEY ("photo_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "static_pages" ADD CONSTRAINT "static_pages_updated_by_admin_profiles_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."admin_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "admin_profiles_username_lower_idx" ON "admin_profiles" USING btree (lower("username"));--> statement-breakpoint
CREATE INDEX "admin_profiles_role_idx" ON "admin_profiles" USING btree ("role");--> statement-breakpoint
CREATE INDEX "media_uploaded_by_idx" ON "media" USING btree ("uploaded_by");--> statement-breakpoint
CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "department_media_position_idx" ON "department_media" USING btree ("department_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "departments_slug_idx" ON "departments" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "departments_position_idx" ON "departments" USING btree ("position");--> statement-breakpoint
CREATE INDEX "event_media_position_idx" ON "event_media" USING btree ("event_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "events_slug_idx" ON "events" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "events_event_date_idx" ON "events" USING btree ("event_date");--> statement-breakpoint
CREATE INDEX "events_department_id_idx" ON "events" USING btree ("department_id");--> statement-breakpoint
CREATE UNIQUE INDEX "publications_slug_idx" ON "publications" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "publications_published_at_idx" ON "publications" USING btree ("published_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "publications_category_idx" ON "publications" USING btree ("category");--> statement-breakpoint
CREATE INDEX "publications_type_idx" ON "publications" USING btree ("type");--> statement-breakpoint
CREATE INDEX "publications_status_idx" ON "publications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "community_faces_position_idx" ON "community_faces" USING btree ("position");--> statement-breakpoint
CREATE INDEX "leaders_position_idx" ON "leaders" USING btree ("position");--> statement-breakpoint
CREATE INDEX "leaders_department_id_idx" ON "leaders" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "testimonies_position_idx" ON "testimonies" USING btree ("position");--> statement-breakpoint
CREATE INDEX "schedule_entries_position_idx" ON "schedule_entries" USING btree ("position");--> statement-breakpoint
CREATE UNIQUE INDEX "scriptures_key_idx" ON "scriptures" USING btree ("key");--> statement-breakpoint
CREATE INDEX "social_links_position_idx" ON "social_links" USING btree ("position");--> statement-breakpoint
CREATE UNIQUE INDEX "static_pages_page_key_idx" ON "static_pages" USING btree ("page_key");--> statement-breakpoint
CREATE INDEX "prayer_requests_created_at_idx" ON "prayer_requests" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "prayer_requests_status_idx" ON "prayer_requests" USING btree ("status");