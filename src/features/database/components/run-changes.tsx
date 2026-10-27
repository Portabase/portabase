"use client";

import {FileMinus, FilePen, FilePlus, Upload, type LucideIcon} from "lucide-react";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip";
import type {BackupStorage} from "@/db/schema/14_storage-backup";
import {describeRun, signedBytes} from "@/features/database/utils/backup-method";
import {formatBytes} from "@/utils/text";
import {cn} from "@/lib/utils";

type Item = {key: string; icon: LucideIcon; count: number; className: string; detail?: string};

type RunChangesProps = {
    storage: Pick<BackupStorage, "status" | "size" | "stats" | "engine">;
    channelNames: string[];
};

export function RunChanges({storage, channelNames}: RunChangesProps) {
    const summary = describeRun(storage);
    const stats = storage.stats;
    if (!summary || !stats) return null;

    const isSnapshot = "filesNew" in stats;
    const items: Item[] = isSnapshot
        ? [
              {key: "new", icon: FilePlus, count: stats.filesNew, className: "text-green-600"},
              {key: "changed", icon: FilePen, count: stats.filesChanged, className: "text-orange-600"},
              {key: "removed", icon: FileMinus, count: stats.filesRemoved ?? 0, className: "text-red-600"},
          ]
        : [
              {key: "transferred", icon: Upload, count: stats.filesTransferred, className: "text-foreground", detail: formatBytes(storage.size ?? 0)},
              {key: "deleted", icon: FileMinus, count: stats.filesDeleted, className: "text-red-600"},
          ];
    const shown = items.filter((item) => item.count > 0);
    const delta = isSnapshot ? (storage.size ?? 0) : stats.sizeDelta;
    const hasDelta = delta != null && delta !== 0;

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="inline-flex items-center gap-3 text-xs tabular-nums" aria-label={summary}>
                        {shown.map(({key, icon: Icon, count, className, detail}) => (
                            <span key={key} className={cn("inline-flex items-center gap-1 font-medium", className)}>
                                <Icon className="size-3.5"/>
                                {count}
                                {detail && <span className="font-normal text-muted-foreground">{detail}</span>}
                            </span>
                        ))}
                        {!shown.length && !hasDelta && (
                            <span className="text-muted-foreground">{isSnapshot ? "No changes" : "Replica up to date"}</span>
                        )}
                        {hasDelta && (
                            <span className="rounded-md border px-1.5 py-0.5 font-mono text-muted-foreground">
                                {signedBytes(delta)}
                            </span>
                        )}
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p className="font-medium">{channelNames.join(", ")}</p>
                    <p>{summary}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
