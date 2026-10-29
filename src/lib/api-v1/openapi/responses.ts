import { z } from "zod";
import "@/lib/api-v1/openapi/registry";
import { retentionPolicySchema } from "@/db/schema/07_database";

const ErrorSchema = z.object({ error: z.string() });

export const RetentionPolicySchema = z
  .object({
    ...retentionPolicySchema.shape,
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime().nullable(),
    deletedAt: z.string().datetime().nullable(),
  })
  .openapi("RetentionPolicy");

export function dataResponse(description: string, schema: z.ZodTypeAny) {
  return {
    description,
    content: { "application/json": { schema: z.object({ data: schema }) } },
  };
}

export function errorResponses(descriptions: Record<number, string>) {
  const all: Record<number, string> = {
    401: "Missing or invalid API key",
    ...descriptions,
    500: "Internal server error",
  };
  return Object.fromEntries(
    Object.entries(all).map(([status, description]) => [
      status,
      { description, content: { "application/json": { schema: ErrorSchema } } },
    ])
  );
}

export const ChannelItemSchema = z
  .object({
    id: z.uuid(),
    name: z.string(),
    provider: z.string(),
    enabled: z.boolean(),
    owned: z.boolean().describe("false for a global channel assigned to this organization: usable in policies, managed by an instance administrator"),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime().nullable(),
  })
  .openapi("ChannelItem");

export const GlobalChannelItemSchema = ChannelItemSchema.omit({ owned: true })
  .extend({ organizationIds: z.array(z.uuid()).describe("Organizations allowed to use this channel") })
  .openapi("GlobalChannelItem");

const PolicyChannelSchema = z
  .object({ id: z.uuid(), name: z.string(), provider: z.string(), enabled: z.boolean() })
  .openapi("PolicyChannel");

export const StoragePolicyItemSchema = z
  .object({
    id: z.uuid(),
    storageChannelId: z.uuid(),
    enabled: z.boolean(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime().nullable(),
    channel: PolicyChannelSchema,
  })
  .openapi("StoragePolicyItem");

export const AlertPolicyItemSchema = StoragePolicyItemSchema.omit({ storageChannelId: true })
  .extend({ notificationChannelId: z.uuid(), eventKinds: z.array(z.string()) })
  .openapi("AlertPolicyItem");
