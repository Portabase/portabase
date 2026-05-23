"use client"
import {DataTable} from "@/components/common/data-table";
import {useRouter} from "next/navigation";
import {
    notificationLogsColumns,
} from "@/components/wrappers/dashboard/admin/notifications/logs/columns";
import {NotificationLogWithRelations} from "@/db/services/notification-log";


type NotificationsLogsListProps = {
    notificationLogs: NotificationLogWithRelations[]
}

export const NotificationLogsList = (props: NotificationsLogsListProps) => {
    const router = useRouter();

    return (
        <DataTable
            enableSelect={false}
            columns={notificationLogsColumns()}
            data={props.notificationLogs}
            enablePagination
        />
    )
}