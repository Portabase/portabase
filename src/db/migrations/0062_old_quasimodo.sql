CREATE TYPE "public"."audit_actor_type" AS ENUM('user', 'api_key', 'agent', 'system');--> statement-breakpoint
CREATE TYPE "public"."audit_outcome" AS ENUM('success', 'failure', 'denied');--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"event_type" varchar(128) NOT NULL,
	"category" varchar(64) NOT NULL,
	"outcome" "audit_outcome" NOT NULL,
	"actor_type" "audit_actor_type" NOT NULL,
	"actor_id" uuid,
	"actor_name" text,
	"actor_api_key_id" uuid,
	"actor_api_key_name" text,
	"organization_id" uuid,
	"organization_name" text,
	"target_type" varchar(64),
	"target_id" uuid,
	"target_name" text,
	"ip_address" "inet",
	"user_agent" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE INDEX "audit_events_created_at_idx" ON "audit_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_events_organization_created_at_idx" ON "audit_events" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_events_category_created_at_idx" ON "audit_events" USING btree ("category","created_at");--> statement-breakpoint
CREATE INDEX "audit_events_event_type_created_at_idx" ON "audit_events" USING btree ("event_type","created_at");--> statement-breakpoint
CREATE INDEX "audit_events_outcome_created_at_idx" ON "audit_events" USING btree ("outcome","created_at");