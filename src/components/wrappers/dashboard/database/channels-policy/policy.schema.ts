import {z} from "zod";

export const PolicySchema = z.object({
    channelId: z.string().min(1, "Please select channel"),
    eventKinds: z.array(z.enum([
        'error_backup', 'error_restore', 'success_restore', 'success_backup', 'weekly_report', 'error_health_database'
    ]))
        .optional(),
    enabled: z.boolean().default(true),
});

export const PoliciesSchema = z.object({
    policies: z.array(PolicySchema)
});


export type PoliciesType = z.infer<typeof PoliciesSchema>;
export type PolicyType = z.infer<typeof PolicySchema>;

export const EVENT_KIND_BACKUP_ONLY_OPTIONS = [
    {label: "Error Backup", value: "error_backup"},
    {label: "Success Backup", value: "success_backup"},
    {label: "Health Ping Fail", value: "error_health_database"},
];

export const EVENT_KIND_OPTIONS = [
    ...EVENT_KIND_BACKUP_ONLY_OPTIONS,
    {label: "Error Restore", value: "error_restore"},
    {label: "Success Restore", value: "success_restore"},
    // {label: "Weekly Report", value: "weekly_report"},
];

