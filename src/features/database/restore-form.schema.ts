import { z } from "zod";

const ImmediateExecutionSchema = z.object({
    executionMode: z.literal("immediate"),
});

const ScheduledExecutionSchema = z.object({
    executionMode: z.literal("scheduled"),
    scheduledDatetime: z.date(),
});

const RemoteImmediateSchema = z
    .object({
        backupLocation: z.literal("remote-file"),
    })
    .merge(ImmediateExecutionSchema);

const RemoteScheduledSchema = z
    .object({
        backupLocation: z.literal("remote-file"),
    })
    .merge(ScheduledExecutionSchema);

const DesktopImmediateSchema = z
    .object({
        backupLocation: z.literal("desktop-file"),
        uploadedBackupFile: z.instanceof(File),
    })
    .merge(ImmediateExecutionSchema);

const DesktopScheduledSchema = z
    .object({
        backupLocation: z.literal("desktop-file"),
        uploadedBackupFile: z.instanceof(File),
    })
    .merge(ScheduledExecutionSchema);

export const RestoreSchema = z.union([RemoteImmediateSchema, RemoteScheduledSchema, DesktopImmediateSchema, DesktopScheduledSchema]);
export type RestoreType = z.infer<typeof RestoreSchema>;
