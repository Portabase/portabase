ALTER TABLE "retention_policies" ALTER COLUMN "database_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "alert_policy" ALTER COLUMN "database_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "storage_policy" ALTER COLUMN "database_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "backup_policy" text;--> statement-breakpoint
ALTER TABLE "retention_policies" ADD COLUMN "project_id" uuid;--> statement-breakpoint
ALTER TABLE "alert_policy" ADD COLUMN "project_id" uuid;--> statement-breakpoint
ALTER TABLE "storage_policy" ADD COLUMN "project_id" uuid;--> statement-breakpoint
ALTER TABLE "retention_policies" ADD CONSTRAINT "retention_policies_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert_policy" ADD CONSTRAINT "alert_policy_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storage_policy" ADD CONSTRAINT "storage_policy_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retention_policies" ADD CONSTRAINT "retention_policy_owner_xor" CHECK (num_nonnulls("retention_policies"."database_id", "retention_policies"."project_id") = 1);--> statement-breakpoint
ALTER TABLE "alert_policy" ADD CONSTRAINT "alert_policy_owner_xor" CHECK (num_nonnulls("alert_policy"."database_id", "alert_policy"."project_id") = 1);--> statement-breakpoint
ALTER TABLE "storage_policy" ADD CONSTRAINT "storage_policy_owner_xor" CHECK (num_nonnulls("storage_policy"."database_id", "storage_policy"."project_id") = 1);