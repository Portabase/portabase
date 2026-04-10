CREATE TABLE "organization_agents" (
	"organization_id" uuid NOT NULL,
	"agent_id" uuid NOT NULL,
	CONSTRAINT "organization_agents_organization_id_agent_id_unique" UNIQUE("organization_id","agent_id")
);
--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "organization_id" uuid;--> statement-breakpoint
ALTER TABLE "organization_agents" ADD CONSTRAINT "organization_agents_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_agents" ADD CONSTRAINT "organization_agents_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agents" ADD CONSTRAINT "agents_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;