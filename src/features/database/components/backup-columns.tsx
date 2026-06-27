"use client";

import {ColumnDef} from "@tanstack/react-table";
import {StatusBadge} from "@/components/common/status-badge";
import {BackupWith, DatabaseWith} from "@/db/schema/07_database";
import {Setting} from "@/db/schema/01_setting";
import {cn} from "@/lib/utils";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip";
import {MemberWithUser} from "@/db/schema/03_organization";
import {formatLocalizedDate} from "@/utils/date-formatting";
import {formatBytes, formatDuration} from "@/utils/text";
import {DatabaseActionsCell} from "@/features/database/components/backup-actions-cell";
import { Badge as BadgeC } from "@/components/ui/badge";
import {backupOnly} from "@/features/database/components/database-tabs";
import {LogsModalTrigger} from "@/features/logs/components/logs-modal-trigger";

export function backupColumns(
    isAlreadyRestore: boolean,
    settings: Setting,
    database: DatabaseWith,
    activeMember: MemberWithUser
): ColumnDef<BackupWith>[] {

    const isBackupOnly = backupOnly.some((type) => database.dbms === type)


    return [
        {
            id: "availability",
            cell: ({row}) => {
                const statusColors: Record<string, string> = {
                    waiting: "bg-gray-400 border-gray-600",
                    ongoing: "bg-orange-400 border-orange-600",
                    success: "bg-green-400 border-green-600",
                };

                const colorStatus =
                    row.original.deletedAt != null
                        ? "bg-red-400 border-red-600"
                        : statusColors[row.original.status] ?? "bg-gray-400 border-gray-600";

                return (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className={cn("w-5 h-5 rounded-full border-4", colorStatus)}/>
                            </TooltipTrigger>
                            {row.original.deletedAt != null && (
                                <TooltipContent>
                                    <p>{formatLocalizedDate(row.original.deletedAt)}</p>
                                </TooltipContent>
                            )}
                        </Tooltip>
                    </TooltipProvider>
                )
            },
        },
        {
            accessorKey: "id",
            header: "Reference",
            cell: ({row}) => {
                const reference = row.original.id
                const isImported = row.original.imported
                const isMigrated = row.original.migrated
                return (
                    <div className="flex items-center space-x-2">
                        <span>{reference}</span>
                       {isImported && (
                            <BadgeC variant="outline" className="bg-orange-400/10 border-orange-600/50 text-orange-600">
                                Imported
                            </BadgeC>
                        )}
                        {isMigrated && (
                            <BadgeC variant="outline" className="bg-blue-400/10 border-blue-600/50 text-blue-600">
                                Migrated
                            </BadgeC>
                        )}
                    </div>
                )
            },
        },
        {
            accessorKey: "fileSize",
            header: "Size",
            cell: ({row}) => {
                return formatBytes(row.getValue("fileSize"))
            },
        },
        {
            accessorKey: "durationMs",
            header: "Duration",
            cell: ({row}) => {
                const durationMs = row.getValue("durationMs");
                return durationMs ? formatDuration(row.getValue("durationMs")) : "-"
            },
        },
        {
            accessorKey: "createdAt",
            header: "Created At",
            cell: ({row}) => {
                return formatLocalizedDate(row.getValue("createdAt"))
            },
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({row}) => {
                return <StatusBadge status={row.getValue("status")}/>;
            },
        },
        {
            accessorKey: "logs",
            header: "Logs",
            cell: ({row}) => {
                const logs = row.original.logs ?? [];
                return <LogsModalTrigger logs={logs}/>;
            },
        },
        {
            id: "actions",
            cell: ({row}) => <DatabaseActionsCell isAlreadyRestore={isAlreadyRestore} activeMember={activeMember} backup={row.original} isBackupOnly={isBackupOnly}/>,
        },
    ];
}