ALTER TABLE "backups" ADD COLUMN "full_requested" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "databases" ADD COLUMN "full_backup_cron" text;