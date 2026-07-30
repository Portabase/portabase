"use client";

import { type ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import type { AuditEvent } from "@/db/schema/18_audit-event";
import { AuditLogDetailsModal } from "@/features/audit/audit-log-details-modal";
import type { AuditLogsScope } from "@/features/audit/audit-types";
import { formatAuditActor, formatAuditDateTime, getOutcomeBadgeClass } from "@/features/audit/audit-utils";

export function auditLogColumns(scope: AuditLogsScope): ColumnDef<AuditEvent>[] {
    return [
        {
            accessorKey: "createdAt",
            header: "Date",
            cell: ({ row }) => (
                <div className="whitespace-nowrap tabular-nums">
                    {formatAuditDateTime(row.original.createdAt)}
                </div>
            ),
        },
        {
            accessorKey: "eventType",
            header: "Event type",
            cell: ({ row }) => (
                <div className="grid gap-1">
                    <div className="whitespace-nowrap font-mono text-xs">{row.original.eventType}</div>
                    {scope === "admin" && row.original.organizationName ? (
                        <div className="text-xs text-muted-foreground">{row.original.organizationName}</div>
                    ) : null}
                </div>
            ),
        },
        {
            accessorKey: "outcome",
            header: "Outcome",
            cell: ({ row }) => (
                <Badge variant="outline" className={getOutcomeBadgeClass(row.original.outcome)}>
                    {row.original.outcome}
                </Badge>
            ),
        },
        {
            id: "actor",
            header: "Actor",
            cell: ({ row }) => <div className="font-medium">{formatAuditActor(row.original)}</div>,
        },
        {
            id: "details",
            header: "Details",
            cell: ({ row }) => <AuditLogDetailsModal event={row.original} scope={scope} />,
        },
    ];
}
