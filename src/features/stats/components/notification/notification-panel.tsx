"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import { DataTable } from "@/components/common/data-table";
import { NotificationLogModal } from "@/features/notifications/notification-log-modal";
import { getChannelIcon } from "@/features/channel/channels-helpers";
import {
  getStatusColor,
  getStatusIcon,
} from "@/features/notifications/notification-log-columns";
import type { NotificationLogWithRelations } from "@/db/services/notification-log";

type Props = {
  alerts: NotificationLogWithRelations[];
};

const columns: ColumnDef<NotificationLogWithRelations>[] = [
  {
    accessorKey: "success",
    header: "",
    cell: ({ row }) => {
      const status = row.original.success ? "delivered" : "failed";
      return (
        <Badge variant="outline" className={`gap-1 ${getStatusColor(status)}`}>
          {getStatusIcon(row.original.success)}
        </Badge>
      );
    },
  },
  {
    accessorKey: "channel",
    header: "Canal",
    cell: ({ row }) => {
      const channel = row.original.channel;
      return (
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-secondary border border-border shrink-0">
            {getChannelIcon(channel?.provider ?? "")}
          </div>
          <span className="text-xs truncate max-w-[80px]">{channel?.name}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "title",
    header: "Titre",
    cell: ({ row }) => (
      <span className="text-xs truncate max-w-[140px] block">
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
          <AlertCircle className="h-4 w-4 text-red-500" />
          Dernières alertes critiques
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {alerts.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">
            Aucune alerte critique
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
