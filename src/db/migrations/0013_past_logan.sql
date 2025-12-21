ALTER TABLE "user" ADD COLUMN "lastChangedPasswordAt" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "two_factor_enabled" boolean DEFAULT false;