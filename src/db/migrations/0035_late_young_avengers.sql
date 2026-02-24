CREATE TABLE "sso_provider" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"issuer" text NOT NULL,
	"oidc_config" json,
	"saml_config" json,
	"user_id" uuid,
	"provider_id" text NOT NULL,
	"organization_id" text,
	"domain" text NOT NULL,
	CONSTRAINT "sso_provider_provider_id_unique" UNIQUE("provider_id")
);
--> statement-breakpoint
ALTER TABLE "passkey" DROP CONSTRAINT "passkey_userId_user_id_fk";
--> statement-breakpoint
ALTER TABLE "passkey" ADD COLUMN "public_key" text NOT NULL;--> statement-breakpoint
ALTER TABLE "passkey" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "passkey" ADD COLUMN "credential_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "passkey" ADD COLUMN "device_type" text NOT NULL;--> statement-breakpoint
ALTER TABLE "passkey" ADD COLUMN "backed_up" boolean NOT NULL;--> statement-breakpoint
ALTER TABLE "passkey" ADD COLUMN "aaguid" text;--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "provider_id" text;--> statement-breakpoint
ALTER TABLE "sso_provider" ADD CONSTRAINT "sso_provider_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "passkey" ADD CONSTRAINT "passkey_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "passkey" DROP COLUMN "publicKey";--> statement-breakpoint
ALTER TABLE "passkey" DROP COLUMN "userId";--> statement-breakpoint
ALTER TABLE "passkey" DROP COLUMN "credentialId";--> statement-breakpoint
ALTER TABLE "passkey" DROP COLUMN "deviceType";--> statement-breakpoint
ALTER TABLE "passkey" DROP COLUMN "backedUp";