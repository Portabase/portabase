"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/common/data-table";
import Link from "next/link";
import { NotificationLogModal } from "@/features/notifications/notification-log-modal";
import { getChannelIcon } from "@/features/channel/channels-helpers";
import { timeAgo } from "@/utils/date-formatting";
import type { NotificationLogWithRelations } from "@/db/services/notification-log";
import { Check } from "lucide-react";

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
        </div>
      );
    },
  },
  {
    accessorKey: "policy",
    header: "Event",
    cell: ({ row }) => {
      const event = row.original.policy?.event;
      return (
        <Badge variant="default" className="text-xs rounded-lg">
          {event}
        </Badge>
      );
    },
  },
  {
    accessorKey: "sentAt",
    header: "When",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {timeAgo(row.original.sentAt)}
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
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <CardTitle className="text-sm font-medium">
          Last critical alerts in 24h
        </CardTitle>
        <Button variant="ghost" size="sm" className="text-xs h-7 px-2" asChild>
          <Link href="/dashboard/notifications/logs">Show more</Link>
        </Button>
      </CardHeader>
      <CardContent className="p-0 overflow-hidden rounded-b-lg [&_.rounded-md.border]:border-0 [&_.rounded-md.border]:rounded-none">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <Check className="mb-2 text-green-500 size-18" />
            <p className="text-sm text-muted-foreground text-center py-4">
              No critical alerts in the last 24 hours
            </p>
          </div>
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
