ALTER TABLE "healthcheck_log" ALTER COLUMN "date" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "healthcheck_log" ALTER COLUMN "status" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "healthcheck_log" ALTER COLUMN "object_id" SET NOT NULL;