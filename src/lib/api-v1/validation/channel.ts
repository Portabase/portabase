import {z} from "zod";
import {
    NotificationChannelFormSchema,
    StorageChannelFormSchema,
} from "@/features/channel/schemas/channel-form.schema";
import type {ChannelKind} from "@/features/channel/services/channel.service";

export function formSchemaFor(kind: ChannelKind) {
    return kind === "storage" ? StorageChannelFormSchema : NotificationChannelFormSchema;
}

export function configSchemaFor(kind: ChannelKind, provider: string): z.ZodType | null {
    const option = formSchemaFor(kind).options.find((candidate) => candidate.shape.provider.value === provider);
    return option ? option.shape.config : null;
}

export const ChannelPatchSchema = z.strictObject({
    name: StorageChannelFormSchema.options[0].shape.name.optional(),
    enabled: z.boolean().optional(),
    config: z.record(z.string(), z.unknown()).optional(),
});

export const OrganizationIdsSchema = z.object({
    organizationIds: z.array(z.uuid("organizationIds must contain valid UUIDs")),
});
