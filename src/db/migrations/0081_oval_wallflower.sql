CREATE TYPE "public"."backup_presence" AS ENUM('present', 'missing', 'unknown');--> statement-breakpoint
ALTER TABLE "backup_storage" ADD COLUMN "presence" "backup_presence" DEFAULT 'unknown' NOT NULL;--> statement-breakpoint
ALTER TABLE "backup_storage" ADD COLUMN "last_checked_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "backup_storage" ADD COLUMN "missing_since" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "backup_storage" ADD COLUMN "missing_strike_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "backup_storage" ADD COLUMN "last_check_error" text;--> statement-breakpoint
CREATE INDEX "idx_backup_storage_presence_due" ON "backup_storage" USING btree ("presence","last_checked_at") WHERE deleted_at IS NULL AND status = 'success';