import {z} from "zod";

export const PolicySchema = z.object({
    channelId: z.string().min(1, "Please select channel"),
    eventKinds: z.array(z.enum([
        'error_backup', 'error_restore', 'success_restore', 'success_backup', 'weekly_report'
    ]))
        .optional(),
    enabled: z.boolean().default(true),
});

export const PoliciesSchema = z.object({
    policies: z.array(PolicySchema)
});


export type PoliciesType = z.infer<typeof PoliciesSchema>;
export type PolicyType = z.infer<typeof PolicySchema>;


export const EVENT_KIND_OPTIONS = [
    {label: "Error Backup", value: "error_backup"},
    {label: "Error Restore", value: "error_restore"},
    {label: "Success Restore", value: "success_restore"},
    {label: "Success Backup", value: "success_backup"},
    {label: "Weekly Report", value: "weekly_report"},
];