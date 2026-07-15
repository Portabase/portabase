CREATE TABLE "job_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"backup_id" uuid,
	"restoration_id" uuid,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "job_log" ADD CONSTRAINT "job_log_backup_id_backups_id_fk" FOREIGN KEY ("backup_id") REFERENCES "public"."backups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_log" ADD CONSTRAINT "job_log_restoration_id_restorations_id_fk" FOREIGN KEY ("restoration_id") REFERENCES "public"."restorations"("id") ON DELETE cascade ON UPDATE no action;
