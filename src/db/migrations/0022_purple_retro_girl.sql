CREATE TYPE "public"."backup_storage_status" AS ENUM('pending', 'success', 'failed');--> statement-breakpoint
CREATE TABLE "backup_storage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"backup_id" uuid NOT NULL,
	"storage_channel_id" uuid NOT NULL,
	"status" "backup_storage_status" DEFAULT 'pending' NOT NULL,
	"path" text,
	"size" integer,
	"checksum" text,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "backup_storage" ADD CONSTRAINT "backup_storage_backup_id_backups_id_fk" FOREIGN KEY ("backup_id") REFERENCES "public"."backups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "backup_storage" ADD CONSTRAINT "backup_storage_storage_channel_id_storage_channel_id_fk" FOREIGN KEY ("storage_channel_id") REFERENCES "public"."storage_channel"("id") ON DELETE cascade ON UPDATE no action;