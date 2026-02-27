ALTER TABLE "passkey" RENAME COLUMN "public_key" TO "publicKey";--> statement-breakpoint
ALTER TABLE "passkey" RENAME COLUMN "credential_id" TO "credentialId";--> statement-breakpoint
ALTER TABLE "passkey" RENAME COLUMN "device_type" TO "deviceType";--> statement-breakpoint
ALTER TABLE "passkey" RENAME COLUMN "backed_up" TO "backedUp";