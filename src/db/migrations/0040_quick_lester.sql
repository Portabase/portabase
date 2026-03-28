CREATE TYPE "public"."healthcheck_status" AS ENUM('success', 'failed');--> statement-breakpoint
CREATE TYPE "public"."healthcheck_kind" AS ENUM('database', 'agent');--> statement-breakpoint
CREATE TABLE "healthcheck_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "healthcheck_kind" NOT NULL,
	"date" timestamp,
	"status" "healthcheck_status",
	"object_id" uuid,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
