ALTER TYPE "public"."backup_engine" ADD VALUE 'physical';--> statement-breakpoint
ALTER TABLE "backups" ADD COLUMN "parent_backup_id" uuid;--> statement-breakpoint
ALTER TABLE "backups" ADD COLUMN "manifest" text;--> statement-breakpoint
ALTER TABLE "backups" ADD CONSTRAINT "backups_parent_backup_id_backups_id_fk" FOREIGN KEY ("parent_backup_id") REFERENCES "public"."backups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_backups_parent" ON "backups" USING btree ("parent_backup_id");