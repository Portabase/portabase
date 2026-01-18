"use client";

import {ColumnDef} from "@tanstack/react-table";
import {NotificationLogWithRelations} from "@/db/services/notification-log";
import {humanReadableDate} from "@/utils/date-formatting";
import {CheckCircle2, XCircle} from "lucide-react";
import {Badge} from "@/components/ui/badge";
import {NotificationLogModal} from "@/components/wrappers/dashboard/admin/notifications/logs/notification-log-modal";
import {getChannelIcon} from "@/components/wrappers/dashboard/admin/channels/helpers/common";


export function notificationLogsColumns(): ColumnDef<NotificationLogWithRelations>[] {
    return [
        {
            accessorKey: "success",
            header: "Status",
            cell: ({row}) => {
                const status = row.original.success ? "delivered" : "failed";
                return(
                    <Badge variant="outline" className={`gap-1.5 ${getStatusColor(status)}`}>
                        {getStatusIcon(row.original.success)}
                        <span className="capitalize">{status}</span>
                    </Badge>
                )
            }
        },
        {
            accessorKey: "channel",
            header: "Channel",
            cell: ({row}) => {
                const channel = row.original.channel
                return (
                    <div className="flex items-center gap-2">
                        <div
                            className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary border border-border">
                            {getChannelIcon(channel?.provider ?? "")}
                        </div>
                        {channel?.name}
                    </div>
                )
            }
        },
        {
            accessorKey: "sentAt",
            header: "Sent At",
            cell: ({row}) => {
                const sentAt = humanReadableDate(row.original.sentAt)
                return (
                    <div>
                        {sentAt}
                    </div>
                )
            }
        },
        {
            accessorKey: "policy",
            header: "Event Kind",
            cell: ({ row }) => {
                const eventKind = row.original.policy?.event;

                if (!eventKind) {
                    return (
                        <div className="text-muted-foreground italic">
                            No event
                        </div>
                    );
                }

                return (
                    <div className="flex items-center gap-2">
                        <Badge>{eventKind}</Badge>
                    </div>
                );
            }
        },
        {
            accessorKey: "details",
            header: "Details",
            cell: ({row}) => {

                return (
                    <div>
                        <NotificationLogModal notificationLog={row.original} />
                    </div>
                );
            }
        }
    ];
}


export const getStatusIcon = (status: boolean) => {
    switch (status) {
        case true:
            return <CheckCircle2 className="h-4 w-4"/>
        case false:
            return <XCircle className="h-4 w-4"/>
    }
}

export const getStatusColor = (status: string) => {
    switch (status) {
        case "delivered":
            return "bg-green-100 dark:bg-green-100/10"
        case "success":
            return "bg-green-100 dark:bg-green-100/10"
        case "failed":
            return "bg-red-100 dark:bg-red-100/10"
        case "pending":
            return "bg-orange-100 dark:bg-orange-100/10"
    }
}