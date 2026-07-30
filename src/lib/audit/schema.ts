import { auditEventCatalog } from "@/features/audit/catalog";
import { z } from "zod";

export type AuditEventType = keyof typeof auditEventCatalog;

const auditEventTypeValues = Object.keys(auditEventCatalog) as AuditEventType[];

export const auditEventTypeSchema = z.enum(
    auditEventTypeValues as [AuditEventType, ...AuditEventType[]],
);

const auditNamedActorSchema = z.object({
    id: z.string().uuid().nullable(),
    name: z.string().nullable(),
    apiKeyId: z.string().uuid().nullable().optional(),
    apiKeyName: z.string().nullable().optional(),
});

export const auditActorSchema = z.discriminatedUnion("type", [
    z.object({
        type: z.literal("system"),
    }),
    z.object({
        type: z.literal("user"),
    }).extend(auditNamedActorSchema.shape),
    z.object({
        type: z.literal("api_key"),
    }).extend(auditNamedActorSchema.shape),
    z.object({
        type: z.literal("agent"),
    }).extend(auditNamedActorSchema.shape),
]);

export const auditOrganizationSchema = z.object({
    id: z.string().uuid().nullable(),
    name: z.string().nullable(),
});

export const auditTargetSchema = z.object({
    type: z.string().min(1).max(64),
    id: z.string().uuid().nullable(),
    name: z.string().nullable(),
});

export const auditMetadataSchema = z.record(z.string(), z.unknown()).default({});

export const createAuditEventInputSchema = z.object({
    eventType: auditEventTypeSchema,
    outcome: z.enum(["success", "failure", "denied"]),
    actor: auditActorSchema,
    organization: auditOrganizationSchema.nullable().optional(),
    target: auditTargetSchema.nullable().optional(),
    ipAddress: z.string().nullable().optional(),
    userAgent: z.string().nullable().optional(),
    metadata: auditMetadataSchema.optional(),
});

export const withAuditEventConfigSchema = z.object({
    eventType: auditEventTypeSchema,
    actor: auditActorSchema,
    organization: auditOrganizationSchema.nullable().optional(),
    target: auditTargetSchema.nullable().optional(),
    ipAddress: z.string().nullable().optional(),
    userAgent: z.string().nullable().optional(),
    metadata: auditMetadataSchema.optional(),
});

export const auditEventEnrichmentSchema = z.object({
    organization: auditOrganizationSchema.nullable().optional(),
    target: auditTargetSchema.nullable().optional(),
    metadata: auditMetadataSchema.optional(),
});

export type CreateAuditEventInput = z.infer<typeof createAuditEventInputSchema>;
export type WithAuditEventConfigBase = z.infer<typeof withAuditEventConfigSchema>;
export type AuditEventEnrichment = z.infer<typeof auditEventEnrichmentSchema>;
