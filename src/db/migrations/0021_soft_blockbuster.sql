CREATE TABLE "storage_policy" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"storage_channel_id" uuid NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"database_id" uuid NOT NULL,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "storage_policy" ADD CONSTRAINT "storage_policy_storage_channel_id_storage_channel_id_fk" FOREIGN KEY ("storage_channel_id") REFERENCES "public"."storage_channel"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storage_policy" ADD CONSTRAINT "storage_policy_database_id_databases_id_fk" FOREIGN KEY ("database_id") REFERENCES "public"."databases"("id") ON DELETE cascade ON UPDATE no action;