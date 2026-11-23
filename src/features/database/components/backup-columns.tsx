"use client";

import type {AppColumnDef as ColumnDef} from "@/components/common/table-features";
import {StatusBadge} from "@/components/common/status-badge";
import {BackupWith, DatabaseWith} from "@/db/schema/07_database";
import type {BackupStorageWith} from "@/db/schema/14_storage-backup";
import {cn} from "@/lib/utils";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip";
import {MemberWithUser} from "@/db/schema/03_organization";
import {formatLocalizedDate} from "@/utils/date-formatting";
import {formatBytes, formatDuration} from "@/utils/text";
import {DatabaseActionsCell} from "@/features/database/components/backup-actions-cell";
import { Badge as BadgeC } from "@/components/ui/badge";
import { CountBadge } from "@/components/common/count-badge";
import {isBackupOnly} from "@/features/database/components/database-tabs";
import {describeRun} from "@/features/database/utils/backup-method";
import {RunChanges} from "@/features/database/components/run-changes";
import {LogsModalTrigger} from "@/features/logs/components/logs-modal-trigger";
import {summarizePresence} from "@/features/database/utils/backup-presence.logic";
import {useBackupModal} from "@/features/database/components/backup-modal-context";
import {Button} from "@/components/ui/button";
import {ChevronDown, ChevronRight, CornerDownRight, HardDrive, Layers} from "lucide-react";

function ChainMarker({backup, isChild, isExpanded, onToggle}: {
    backup: BackupWith;
    isChild: boolean;
    isExpanded: boolean;
    onToggle: () => void;
}) {
    const isPhysicalBackup = (backup.storages ?? []).some((storage) => storage.engine === "physical");
    const incrementals = backup.incrementals ?? [];

    if (backup.parentBackupId != null || isChild) {
        const description = backup.parentBackupId == null
            ? "Pending. The agent builds it on this chain unless a full backup is due."
            : `Incremental. ${backup.parentCreatedAt
                ? `Built on the backup of ${formatLocalizedDate(backup.parentCreatedAt)}`
                : "Built on an earlier backup"}`;
        return (
            <div className="flex w-12 shrink-0 justify-end">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button type="button" aria-label={description}>
                                <CornerDownRight className={cn("h-4 w-4", backup.parentBackupId == null ? "text-muted-foreground" : "text-blue-600")}/>
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{description}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        );
    }

    return (
        <div className="flex w-12 shrink-0 items-center gap-1">
            {incrementals.length > 0 ? (
                <button
                    type="button"
                    onClick={onToggle}
                    aria-expanded={isExpanded}
                    aria-label={`${isExpanded ? "Hide" : "Show"} ${incrementals.length} incremental backup(s)`}
                >
                    {isExpanded ? <ChevronDown className="h-4 w-4"/> : <ChevronRight className="h-4 w-4"/>}
                </button>
            ) : (
                <span className="w-4"/>
            )}
            {isPhysicalBackup && backup.status === "success" && (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button type="button" aria-label="Full backup">
                                <Layers className="h-4 w-4 text-green-600"/>
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Full backup</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
        </div>
    );
}

function chainSummary(backup: BackupWith): string | null {
    const incrementals = backup.incrementals ?? [];
    if (incrementals.length === 0) return null;
    const chainSize = [backup, ...incrementals].reduce((total, member) => total + (member.fileSize ?? 0), 0);
    const newestRestorable = incrementals.findLast((incremental) => incremental.status === "success");
    return [
        `${incrementals.length} incremental${incrementals.length > 1 ? "s" : ""}`,
        `${formatBytes(chainSize)} in chain`,
        newestRestorable ? `up to ${formatLocalizedDate(newestRestorable.createdAt)}` : null,
    ].filter(Boolean).join(" · ");
}

function StorageStatusCell({backup}: {backup: BackupWith}) {
    const {openModal} = useBackupModal();
    const storages = (backup.storages ?? []).filter((s) => s.deletedAt == null);
    const missingCount = storages.filter((s) => s.presence === "missing").length;
    const summary = summarizePresence(storages);
    const hasFiles = storages.length > 0;

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className="relative"
                        aria-label="Show storage status"
                        disabled={!hasFiles}
                        onClick={() => openModal("presence", backup)}
                    >
                        <HardDrive
                            className={cn(
                                missingCount > 0
                                    ? "text-red-600"
                                    : summary === "unverified"
                                      ? "text-orange-500"
                                      : "",
                            )}
                        />
                        <CountBadge count={missingCount}  />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{!hasFiles ? "No storage files" : missingCount > 0 ? `${missingCount} file(s) missing` : "Storage status"}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

export function backupColumns(
    isAlreadyRestore: boolean,
    database: DatabaseWith,
    activeMember: MemberWithUser
): ColumnDef<BackupWith>[] {

    const backupOnly = isBackupOnly(database);
    const isPhysicalSource = database.backupEngine === "physical";

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
                const summary = isPhysicalSource ? chainSummary(row.original) : null;
                return (
                    <div className="flex items-center space-x-2">
                        {isPhysicalSource && (
                            <ChainMarker
                                backup={row.original}
                                isChild={row.depth > 0}
                                isExpanded={row.getIsExpanded()}
                                onToggle={row.getToggleExpandedHandler()}
                            />
                        )}
                        {summary ? (
                            <div className="flex flex-col">
                                <span>{reference}</span>
                                <span className="text-xs text-muted-foreground">{summary}</span>
                            </div>
                        ) : (
                            <span>{reference}</span>
                        )}
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
        ...(database.backupEngine === "archive" || isPhysicalSource ? [] : [{
            id: "changes",
            header: "Changes",
            cell: ({row}) => {
                const runs = new Map<string, {storage: BackupStorageWith; channelNames: string[]}>();
                for (const storage of row.original.storages ?? []) {
                    const summary = storage.deletedAt == null ? describeRun(storage) : null;
                    if (!summary) continue;
                    const run = runs.get(summary) ?? {storage, channelNames: []};
                    run.channelNames.push(storage.storageChannel?.name ?? "Unknown channel");
                    runs.set(summary, run);
                }
                return runs.size ? (
                    <div className="flex flex-col gap-1">
                        {[...runs].map(([summary, run]) => (
                            <RunChanges key={summary} storage={run.storage} channelNames={run.channelNames}/>
                        ))}
                    </div>
                ) : "-";
            },
        } satisfies ColumnDef<BackupWith>]),
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
            id: "storage",
            header: "Files",
            cell: ({row}) => <StorageStatusCell backup={row.original} />,
        },
        {
            id: "actions",
            cell: ({row}) => <DatabaseActionsCell isAlreadyRestore={isAlreadyRestore} activeMember={activeMember} backup={row.original} isBackupOnly={backupOnly}/>,
        },
    ];
}