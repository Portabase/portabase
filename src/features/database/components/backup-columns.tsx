"use client";

import {ColumnDef} from "@tanstack/react-table";
import {StatusBadge} from "@/components/common/status-badge";
import {BackupWith, DatabaseWith} from "@/db/schema/07_database";
import {Setting} from "@/db/schema/01_setting";
import {cn} from "@/lib/utils";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip";
import {MemberWithUser} from "@/db/schema/03_organization";
import {formatLocalizedDate, timeAgo} from "@/utils/date-formatting";
import {formatBytes, formatDuration} from "@/utils/text";
import {DatabaseActionsCell} from "@/features/database/components/backup-actions-cell";
import { Badge as BadgeC } from "@/components/ui/badge";
import {backupOnly} from "@/features/database/components/database-tabs";
import {LogsModalTrigger} from "@/features/logs/components/logs-modal-trigger";
import {summarizePresence} from "@/features/database/utils/backup-presence.logic";

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
                const storages = (row.original.storages ?? []).filter(
                    (s) => s.deletedAt == null,
                );
                const summary = summarizePresence(storages);

                const isDeleted = row.original.deletedAt != null;
                const colorStatus = isDeleted
                    ? "bg-red-400 border-red-600"
                    : summary === "missing"
                      ? "bg-red-400 border-red-600"
                      : summary === "unverified"
                        ? "bg-orange-400 border-orange-600"
                        : summary === "present"
                          ? "bg-green-400 border-green-600"
                          : "bg-gray-400 border-gray-600";

                const lines: string[] = [];
                if (isDeleted) {
                    lines.push(`Deleted: ${formatLocalizedDate(row.original.deletedAt!)}`);
                } else {
                    for (const s of storages) {
                        const channel = s.storageChannel?.name ?? "storage";
                        const checked = s.lastCheckedAt
                            ? `${formatLocalizedDate(s.lastCheckedAt)} (${timeAgo(s.lastCheckedAt)})`
                            : "never";
                        if (s.presence === "missing") {
                            lines.push(`Backup file not found on ${channel} · Checked: ${checked}`);
                        } else if (s.lastCheckError) {
                            lines.push(`Couldn't verify on ${channel}: ${s.lastCheckError} · Checked: ${checked}`);
                        } else if (s.presence === "present") {
                            lines.push(`${channel} — Last presence check: ${checked}`);
                        }
                    }
                }

                return (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className={cn("w-5 h-5 rounded-full border-4", colorStatus)} />
                            </TooltipTrigger>
                            {lines.length > 0 && (
                                <TooltipContent>
                                    {lines.map((l, i) => (
                                        <p key={i}>{l}</p>
                                    ))}
                                </TooltipContent>
                            )}
                        </Tooltip>
                    </TooltipProvider>
                );
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
                        {(() => {
                            const storages = (row.original.storages ?? []).filter(
                                (s) => s.deletedAt == null,
                            );
                            return row.original.deletedAt == null &&
                                summarizePresence(storages) === "missing" ? (
                                <BadgeC
                                    variant="outline"
                                    className="bg-yellow-400/20 border-yellow-600/50 text-yellow-700"
                                >
                                    File missing
                                </BadgeC>
                            ) : null;
                        })()}
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
                return <LogsModalTrigger backupId={row.original.id} hasLogs={row.original.hasLogs}/>;
            },
        },
        {
            id: "actions",
            cell: ({row}) => <DatabaseActionsCell isAlreadyRestore={isAlreadyRestore} activeMember={activeMember} backup={row.original} isBackupOnly={isBackupOnly}/>,
        },
    ];
}