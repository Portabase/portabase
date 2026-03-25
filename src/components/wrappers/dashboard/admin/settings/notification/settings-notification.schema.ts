import {z} from "zod";

export const DefaultNotificationSchema = z.object({
    notificationChannelId: z.string(),
});

export type DefaultNotificationType = z.infer<typeof DefaultNotificationSchema>;
