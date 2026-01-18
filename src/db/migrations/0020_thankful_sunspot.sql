CREATE TYPE "public"."provider_storage_kind" AS ENUM('local', 's3');--> statement-breakpoint
CREATE TABLE "organization_storage_channels" (
	"organization_id" uuid NOT NULL,
	"storage_channel_id" uuid NOT NULL,
	CONSTRAINT "organization_storage_channels_organization_id_storage_channel_id_unique" UNIQUE("organization_id","storage_channel_id")
);
--> statement-breakpoint
CREATE TABLE "storage_channel" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" "provider_storage_kind" NOT NULL,
	"name" varchar(255) NOT NULL,
	"config" jsonb NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "organization_storage_channels" ADD CONSTRAINT "organization_storage_channels_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_storage_channels" ADD CONSTRAINT "organization_storage_channels_storage_channel_id_storage_channel_id_fk" FOREIGN KEY ("storage_channel_id") REFERENCES "public"."storage_channel"("id") ON DELETE cascade ON UPDATE no action;