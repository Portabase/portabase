"use client"

import { useState } from "react"
import { Minus, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { LevelType } from "@/features/logs/types"
import { JobLog } from "@/db/schema/17_job-log"
import { formatLocalizedDate } from "@/utils/date-formatting"
import { formatDuration } from "@/utils/text"

const levelLabel: Record<LevelType, string> = {
    info: "Info",
    debug: "Debug",
    error: "Error",
    warn: "Warning",
}

function TypeBadge({ entry }: { entry: JobLog }) {
    const isCommand = entry.entryType === "command"
    const label = isCommand ? "Command" : levelLabel[entry.level]
    const styles = isCommand
        ? "border-transparent bg-secondary text-secondary-foreground"
        : entry.level === "error"
            ? "border-transparent bg-destructive/20 text-destructive"
            : entry.level === "warn"
                ? "border-transparent bg-amber-500/20 text-amber-600 dark:text-amber-300"
                : entry.level === "debug"
                    ? "border-transparent bg-muted text-muted-foreground"
                    : "border-transparent bg-sky-500/20 text-sky-600 dark:text-sky-300"

    return (
        <Badge variant="outline" className={cn("rounded-full", styles)}>
            {label}
        </Badge>
    )
}

export function LogRow({ entry }: { entry: JobLog }) {
    const [open, setOpen] = useState(true)
    const isCommand = entry.entryType === "command"
    const date = formatLocalizedDate(entry.loggedAt)

    const accent =
        entry.level === "error"
            ? "bg-destructive"
            : entry.level === "warn"
                ? "bg-amber-500"
                : isCommand
                    ? "bg-emerald-500"
                    : "bg-sky-500"

    return (
        <div className="relative border-b border-border last:border-b-0">
            <div className={cn("absolute left-0 top-0 h-full w-[3px]", accent)} aria-hidden="true" />

            <div className="flex flex-col gap-3 py-4 pl-6 pr-4 sm:flex-row sm:items-start sm:gap-4 sm:pr-6">
                <span className="shrink-0 font-mono text-sm text-muted-foreground sm:w-[130px] sm:pt-0.5">
                    {date}
                </span>

                <span className="shrink-0 sm:w-[90px] sm:pt-0.5">
                    <TypeBadge entry={entry} />
                </span>

                <div className="min-w-0 flex-1">
                    {isCommand ? (
                        <div className="flex items-start gap-3">
                            <code className="block flex-1 truncate rounded-md bg-muted px-3 py-1.5 font-mono text-sm text-foreground">
                                <span className="text-emerald-600 dark:text-emerald-400">$ </span>
                                {entry.message}
                            </code>
                            <button
                                type="button"
                                onClick={() => setOpen((o) => !o)}
                                aria-label={open ? "Collapse command output" : "Expand command output"}
                                className="mt-1 shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                            >
                                {open ? <Minus className="size-4" /> : <Plus className="size-4" />}
                            </button>
                        </div>
                    ) : (
                        <p className="pt-0.5 text-sm text-foreground">{entry.message}</p>
                    )}

                    {isCommand && entry.command && open && (
                        <div className="mt-4">
                            <div className="overflow-hidden rounded-xl bg-muted ring-1 ring-border">
                                <div className="max-h-[15rem] overflow-auto px-4 py-3.5">
                                    <code className="block whitespace-pre font-mono text-sm leading-relaxed text-foreground">
                                        <span className="text-emerald-600 dark:text-emerald-400">$ </span>
                                        {entry.command}
                                    </code>
                                    {entry.output ? (
                                        <pre className="mt-3 whitespace-pre font-mono text-sm leading-relaxed text-muted-foreground">
                                            {entry.output}
                                        </pre>
                                    ) : null}
                                </div>
                            </div>

                            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm sm:gap-6">
                                {entry.exitCode !== undefined && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground">Exit code:</span>
                                        <span
                                            className={cn(
                                                "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold",
                                                entry.exitCode === 0
                                                    ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300"
                                                    : "bg-destructive/20 text-destructive",
                                            )}
                                        >
                                            {entry.exitCode}
                                        </span>
                                    </div>
                                )}
                                {entry.durationMs !== null && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground">Duration:</span>
                                        <span className="font-medium text-foreground">{formatDuration(entry.durationMs)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
