ALTER TABLE "organization_agents" ADD COLUMN "updated_at" timestamp;--> statement-breakpoint
ALTER TABLE "organization_agents" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "organization_agents" ADD COLUMN "deleted_at" timestamp;