CREATE TYPE "public"."event_visibility_scope" AS ENUM('DEPARTMENT', 'GLOBAL');--> statement-breakpoint
ALTER TYPE "public"."publication_status" ADD VALUE 'ARCHIVED';