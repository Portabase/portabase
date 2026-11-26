ALTER TABLE "organization" ADD COLUMN "encryption" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "encryption" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "databases" ADD COLUMN "encryption" boolean DEFAULT false NOT NULL;