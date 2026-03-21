ALTER TYPE "public"."event_kind" ADD VALUE 'health_ping_fail';--> statement-breakpoint
CREATE TABLE "health_dashboard_preference" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"database_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"visible" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "health_dashboard_preference" ADD CONSTRAINT "health_dashboard_preference_database_id_databases_id_fk" FOREIGN KEY ("database_id") REFERENCES "public"."databases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health_dashboard_preference" ADD CONSTRAINT "health_dashboard_preference_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;