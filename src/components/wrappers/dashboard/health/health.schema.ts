import {z} from "zod";

export const ToggleHealthDashboardSchema = z.object({
    databaseId: z.string().min(1),
    visible: z.boolean(),
});

export type ToggleHealthDashboardType = z.infer<typeof ToggleHealthDashboardSchema>;
