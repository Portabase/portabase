import {z} from "zod";

export const DefaultNotificationSchema = z.object({
    notificationChannelId: z.string().optional().nullable()
});

export type DefaultNotificationType = z.infer<typeof DefaultNotificationSchema>;
