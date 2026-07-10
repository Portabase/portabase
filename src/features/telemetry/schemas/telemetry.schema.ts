import { z } from "zod";

export const distributionEntrySchema = z.object({
    label: z.string(),
    count: z.number().int().nonnegative(),
});

export const telemetryPayloadSchema = z.object({
    instanceId: z.string(),
    dashboardVersion: z.string(),
    orgsTotal: z.number().int().nonnegative(),
    usersTotal: z.number().int().nonnegative(),
    agentsTotal: z.number().int().nonnegative(),
    databasesTotal: z.number().int().nonnegative(),
    databasesByType: z.array(distributionEntrySchema),
    storageByBackend: z.array(distributionEntrySchema),
    notificationsByChannel: z.array(distributionEntrySchema),
    agentsByVersion: z.array(distributionEntrySchema),
    encryptionEnabled: z.boolean(),
});

export type DistributionEntry = z.infer<typeof distributionEntrySchema>;
export type TelemetryPayload = z.infer<typeof telemetryPayloadSchema>;
