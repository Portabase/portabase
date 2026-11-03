import { z } from "zod";
import { eventKindEnum } from "@/db/schema/10_alert-policy";
import { levelEnum } from "@/db/schema/11_notification-log";
import { providerKindEnum } from "@/db/schema/09_notification-channel";

const FilterOperatorSchema = z.enum(["is", "is_not"]).optional();

export const FetchNotificationLogsSchema = z.object({
    page: z.number().int().min(1).default(1),
    pageSize: z.number().int().min(1).max(100).default(20),
    sorting: z.any().optional(),
    status: z.array(z.enum(["delivered", "failed"])).optional(),
    statusOperator: FilterOperatorSchema,
    event: z.array(z.enum(eventKindEnum.enumValues)).optional(),
    eventOperator: FilterOperatorSchema,
    level: z.array(z.enum(levelEnum.enumValues)).optional(),
    levelOperator: FilterOperatorSchema,
    provider: z.array(z.enum(providerKindEnum.enumValues)).optional(),
    providerOperator: FilterOperatorSchema,
});
export type FetchNotificationLogsSchema = z.infer<typeof FetchNotificationLogsSchema>;
