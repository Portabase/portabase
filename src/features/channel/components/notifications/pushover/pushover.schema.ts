import {z} from "zod";

export const PUSHOVER_PRIORITIES = [
    {value: "-2", label: "Lowest - no sound, no vibration, no alert"},
    {value: "-1", label: "Low - quiet notification, no sound"},
    {value: "0", label: "Normal - default sound and alert"},
    {value: "1", label: "High - bypass quiet hours"},
    {value: "2", label: "Emergency - repeat until acknowledged"},
] as const;

export const PushoverChannelConfigSchema = z.object({
    pushoverUserKey: z.string().min(30, "User key must be 30 characters").max(30, "User key must be 30 characters"),
    pushoverApiToken: z.string().min(30, "API token must be 30 characters").max(30, "API token must be 30 characters"),
    pushoverPriority: z.enum(["-2", "-1", "0", "1", "2"]).default("0"),
    pushoverDevice: z.string().max(25, "Device name must be at most 25 characters").optional().or(z.literal("")),
});
