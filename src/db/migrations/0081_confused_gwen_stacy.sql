ALTER TABLE "account" ADD COLUMN "issuer" text;
--> statement-breakpoint
-- Backfill issuer for existing accounts (better-auth 1.7 keys account lookups on issuer).
-- Credential accounts use a synthetic local issuer.
UPDATE "account" SET "issuer" = 'local:credential' WHERE "provider_id" = 'credential' AND "issuer" IS NULL;
--> statement-breakpoint
-- Social providers that declare a real OIDC issuer in better-auth.
UPDATE "account" SET "issuer" = 'https://accounts.google.com' WHERE "provider_id" = 'google' AND "issuer" IS NULL;
--> statement-breakpoint
UPDATE "account" SET "issuer" = 'https://appleid.apple.com' WHERE "provider_id" = 'apple' AND "issuer" IS NULL;
--> statement-breakpoint
UPDATE "account" SET "issuer" = 'https://www.facebook.com' WHERE "provider_id" = 'facebook' AND "issuer" IS NULL;
--> statement-breakpoint
UPDATE "account" SET "issuer" = 'https://access.line.me' WHERE "provider_id" = 'line' AND "issuer" IS NULL;
--> statement-breakpoint
-- Remaining OAuth providers without a declared issuer use the synthetic OAuth issuer.
UPDATE "account" SET "issuer" = 'local:oauth:' || "provider_id" WHERE "issuer" IS NULL;
