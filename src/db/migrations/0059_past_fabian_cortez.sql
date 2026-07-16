CREATE TYPE "public"."job_log_entry_type" AS ENUM('log', 'command');--> statement-breakpoint
CREATE TYPE "public"."job_log_level" AS ENUM('debug', 'info', 'warn', 'error');--> statement-breakpoint
ALTER TABLE "job_log" ADD COLUMN "logged_at" timestamp with time zone NOT NULL;--> statement-breakpoint
ALTER TABLE "job_log" ADD COLUMN "entry_type" "job_log_entry_type" NOT NULL;--> statement-breakpoint
ALTER TABLE "job_log" ADD COLUMN "level" "job_log_level" NOT NULL;--> statement-breakpoint
ALTER TABLE "job_log" ADD COLUMN "message" text NOT NULL;--> statement-breakpoint
ALTER TABLE "job_log" ADD COLUMN "command" text;--> statement-breakpoint
ALTER TABLE "job_log" ADD COLUMN "output" text;--> statement-breakpoint
ALTER TABLE "job_log" ADD COLUMN "exit_code" integer;--> statement-breakpoint
ALTER TABLE "job_log" ADD COLUMN "duration_ms" bigint;
