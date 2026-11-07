"use server";
import type { SQL } from "drizzle-orm";
import { systemAdminAction } from "@/lib/safe-actions/actions";
import { notificationLog } from "@/db/schema/11_notification-log";
import { countNotificationHistory, getNotificationHistory } from "@/db/services/notification-log";
import { filterCondition } from "@/db/utils";
import { FetchNotificationLogsSchema } from "@/features/notifications/actions/notification-log-list.schema";

export const fetchNotificationLogsAction = systemAdminAction
    .inputSchema(FetchNotificationLogsSchema)
    .action(async ({ parsedInput }) => {
        const { page, pageSize } = parsedInput;

        const conditions = [
            filterCondition(notificationLog.success, parsedInput.status?.map((status) => status === "delivered"), parsedInput.statusOperator),
            filterCondition(notificationLog.event, parsedInput.event, parsedInput.eventOperator),
            filterCondition(notificationLog.provider, parsedInput.provider, parsedInput.providerOperator),
        ].filter((condition): condition is SQL => condition !== undefined);

        const [data, total] = await Promise.all([
            getNotificationHistory({ conditions, limit: pageSize, offset: (page - 1) * pageSize }),
            countNotificationHistory(conditions),
        ]);

        return {
            data,
            meta: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
        };
    });
