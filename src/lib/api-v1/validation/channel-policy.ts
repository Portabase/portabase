import {z} from "zod";
import type {eventKindEnum} from "@/db/schema/10_alert-policy";
import {EVENT_KIND_OPTIONS} from "@/features/database/schemas/channels-policy.schema";

type EventKind = (typeof eventKindEnum.enumValues)[number];

const EVENT_KINDS = EVENT_KIND_OPTIONS.map((option) => option.value) as [EventKind, ...EventKind[]];

export const StoragePoliciesBodySchema = z.object({
    policies: z.array(
        z.object({
            storageChannelId: z.uuid("storageChannelId must be a valid UUID"),
            enabled: z.boolean().default(true),
        }),
    ),
});

export const AlertPoliciesBodySchema = z.object({
    policies: z.array(
        z.object({
            notificationChannelId: z.uuid("notificationChannelId must be a valid UUID"),
            eventKinds: z.array(z.enum(EVENT_KINDS)).min(1, "eventKinds must contain at least one event"),
            enabled: z.boolean().default(true),
        }),
    ),
});

export type StoragePolicyInput = z.infer<typeof StoragePoliciesBodySchema>["policies"][number];
export type AlertPolicyInput = z.infer<typeof AlertPoliciesBodySchema>["policies"][number];
