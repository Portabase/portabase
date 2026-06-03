"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/common/data-table";
import { NotificationLogModal } from "@/features/notifications/notification-log-modal";
import { getChannelIcon } from "@/features/channel/channels-helpers";
import type { NotificationLogWithRelations } from "@/db/services/notification-log";

type Props = {
  alerts: NotificationLogWithRelations[];
};

const columns: ColumnDef<NotificationLogWithRelations>[] = [
  {
    accessorKey: "channel",
    header: "Channel",
    cell: ({ row }) => {
      const channel = row.original.channel;
      return (
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-secondary border border-border shrink-0">
            {getChannelIcon(channel?.provider ?? "")}
          </div>
          <span className="text-xs truncate max-w-20">{channel?.name}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "title",
    header: "Message",
    cell: ({ row }) => (
      <span className="text-xs truncate max-w-35 block">
        {row.original.title}
      </span>
    ),
  },
  {
    id: "details",
    header: "",
    cell: ({ row }) => <NotificationLogModal notificationLog={row.original} />,
  },
];

export function NotificationPanel({ alerts }: Props) {
  return (
    <Card className="w-full h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          Last critical alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-hidden rounded-b-lg [&_.rounded-md.border]:border-0 [&_.rounded-md.border]:rounded-none">
        {alerts.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">
            No critical alerts in the last 24 hours
          </p>
        ) : (
          <DataTable
            columns={columns}
            data={alerts}
            enableSelect={false}
            enablePagination={false}
            enableFilter={false}
          />
        )}
      </CardContent>
    </Card>
  );
}
