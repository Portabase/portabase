CREATE TYPE "public"."backup_presence" AS ENUM('present', 'missing', 'unknown');--> statement-breakpoint
ALTER TYPE "public"."event_kind" ADD VALUE 'error_backup_missing';--> statement-breakpoint
ALTER TYPE "public"."event_kind" ADD VALUE 'success_backup_recovered';--> statement-breakpoint
ALTER TABLE "backup_storage" ADD COLUMN "presence" "backup_presence" DEFAULT 'unknown' NOT NULL;--> statement-breakpoint
ALTER TABLE "backup_storage" ADD COLUMN "last_checked_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "backup_storage" ADD COLUMN "last_check_error" text;--> statement-breakpoint
CREATE INDEX "idx_backup_storage_presence_due" ON "backup_storage" USING btree ("presence","last_checked_at") WHERE deleted_at IS NULL AND status = 'success';