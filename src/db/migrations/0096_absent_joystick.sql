CREATE TABLE "backup_manifests" (
	"backup_id" uuid PRIMARY KEY NOT NULL,
	"manifest" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "backup_manifests" ADD CONSTRAINT "backup_manifests_backup_id_backups_id_fk" FOREIGN KEY ("backup_id") REFERENCES "public"."backups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "backups" DROP COLUMN "manifest";