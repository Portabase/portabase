"use client"
import {DataTable} from "@/components/common/data-table";
import {
    notificationLogsColumns,
} from "@/features/notifications/components/notification-log-columns";
import {NotificationLogWithRelations} from "@/db/services/notification-log";


type NotificationsLogsListProps = {
    notificationLogs: NotificationLogWithRelations[]
}

export const NotificationLogsList = (props: NotificationsLogsListProps) => {
    return (
        <DataTable
            enableSelect={false}
            columns={notificationLogsColumns()}
            data={props.notificationLogs}
            enablePagination
        />
    )
}