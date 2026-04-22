"use client"

import {
    ArrowRight,
    CheckCircle2,
    Circle,
    Loader2,
    Play,
    Server,
    FolderOpen,
    HardDrive,
} from "lucide-react"
import {cn} from "@/lib/utils"
import {ProjectWithDatabasesAndBackups as ProjectWith} from "@/db/schema/06_project";
import {Backup, DatabaseWith} from "@/db/schema/07_database";

interface MigrationFlowProps {
    sourceProject: ProjectWith | null
    sourceDatabase: DatabaseWith | null
    selectedBackups: Backup[]
    targetProject: ProjectWith | null
    targetDatabase: DatabaseWith | null
    status: MigrationStatus
    progress: number
    onStartMigration: () => void
    canStart: boolean
}

export type MigrationStatus = "idle" | "migrating" | "completed" | "error"


export function MigrationFlow({
                                  sourceProject,
                                  sourceDatabase,
                                  selectedBackups,
                                  targetProject,
                                  targetDatabase,
                                  status,
                                  progress,
                                  onStartMigration,
                                  canStart,
                              }: MigrationFlowProps) {

    const steps = [
        {
            id: "source-project",
            label: "Source Project",
            description: "Choose source project",
            completed: sourceProject !== null,
            active: status === "idle" && !sourceProject,
        },
        {
            id: "source-database",
            label: "Source Database",
            description: "Select database",
            completed: sourceDatabase !== null,
            active: status === "idle" && sourceProject !== null && !sourceDatabase,
        },
        {
            id: "backups",
            label: "Select Backups",
            description: "Choose backups to migrate",
            completed: selectedBackups.length > 0,
            active: status === "idle" && sourceDatabase !== null && selectedBackups.length === 0,
        },
        {
            id: "target-project",
            label: "Target Project",
            description: "Choose destination project",
            completed: targetProject !== null,
            active: status === "idle" && selectedBackups.length > 0 && !targetProject,
        },
        {
            id: "target-database",
            label: "Target Database",
            description: "Select destination database",
            completed: targetDatabase !== null,
            active: status === "idle" && targetProject !== null && !targetDatabase,
        },
        {
            id: "migrate",
            label: "Migrate Data",
            description: "Transfer to target",
            completed: status === "completed",
            active: status === "migrating",
        },
    ]

    return (
        <div className="flex h-full flex-col rounded-xl border border-border bg-card">
            <div className="border-b border-border px-5 py-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                        <ArrowRight className="h-5 w-5 text-primary"/>
                    </div>
                    <div>
                        <h2 className="font-semibold text-foreground">Migration Flow</h2>
                        <p className="text-sm text-muted-foreground">
                            {status === "idle" && "Configure your migration"}
                            {status === "migrating" && "Migration in progress..."}
                            {status === "completed" && "Migration completed!"}
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
                <div className="mb-6 flex flex-col gap-3">
                    {steps.map((step, index) => (
                        <div key={step.id} className="flex items-start gap-3">
                            <div className="flex flex-col items-center">
                                <div
                                    className={cn(
                                        "flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all",
                                        step.completed
                                            ? "border-emerald-500 bg-emerald-500 text-white"
                                            : step.active
                                                ? "border-primary bg-primary/10 text-primary"
                                                : "border-muted-foreground/30 bg-muted text-muted-foreground"
                                    )}
                                >
                                    {step.completed ? (
                                        <CheckCircle2 className="h-4 w-4"/>
                                    ) : step.active && status === "migrating" ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin"/>
                                    ) : (
                                        <Circle className="h-3.5 w-3.5"/>
                                    )}
                                </div>
                                {index < steps.length - 1 && (
                                    <div
                                        className={cn(
                                            "mt-1 h-6 w-0.5",
                                            step.completed ? "bg-emerald-500" : "bg-border"
                                        )}
                                    />
                                )}
                            </div>
                            <div className="pt-0.5">
                                <p
                                    className={cn(
                                        "text-sm font-medium",
                                        step.completed || step.active
                                            ? "text-foreground"
                                            : "text-muted-foreground"
                                    )}
                                >
                                    {step.label}
                                </p>
                                <p className="text-xs text-muted-foreground">{step.description}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {(sourceProject || targetProject) && (
                    <div className="mb-6 rounded-lg border border-border bg-muted/30 p-4">
                        <h3 className="mb-3 text-sm font-medium text-foreground">
                            Migration Summary
                        </h3>
                        <div className="flex flex-col gap-2.5 text-sm">
                            {/* Source */}
                            {sourceProject && (
                                <div className="flex items-start gap-2">
                                    <FolderOpen className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"/>
                                    <div className="min-w-0">
                                        <span className="text-muted-foreground">From: </span>
                                        <span className="font-medium text-foreground">
                      {sourceProject.name}
                    </span>
                                        {sourceDatabase && (
                                            <span className="text-muted-foreground">
                        {" "}/ {sourceDatabase.name}
                      </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {selectedBackups.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <HardDrive className="h-4 w-4 text-muted-foreground"/>
                                    <span className="text-muted-foreground">Backups:</span>
                                    <span className="font-medium text-foreground">
                                    {selectedBackups.length}
                                  </span>
                                </div>
                            )}

                            {targetProject && (
                                <div className="flex items-start gap-2">
                                    <Server className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"/>
                                    <div className="min-w-0">
                                        <span className="text-muted-foreground">To: </span>
                                        <span className="font-medium text-foreground">
                      {targetProject.name}
                    </span>
                                        {targetDatabase && (
                                            <span className="text-muted-foreground">
                        {" "}/ {targetDatabase.name}
                      </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {status === "migrating" && (
                    <div className="mb-6">
                        <div className="mb-2 flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium text-foreground">
                {Math.min(100, Math.round(progress))}%
              </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                            <div
                                className="h-full rounded-full bg-primary transition-all duration-300"
                                style={{width: `${Math.min(100, progress)}%`}}
                            />
                        </div>
                    </div>
                )}

                {status === "completed" && (
                    <div className="mb-6 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-emerald-600"/>
                            <span className="font-medium text-emerald-600">
                Migration completed successfully!
              </span>
                        </div>
                    </div>
                )}
            </div>

            <div className="border-t border-border p-5">
                <button
                    onClick={onStartMigration}
                    disabled={!canStart}
                    className={cn(
                        "flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 font-medium transition-all",
                        canStart
                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                            : "cursor-not-allowed bg-muted text-muted-foreground"
                    )}
                >
                    {status === "migrating" ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin"/>
                            Migrating...
                        </>
                    ) : status === "completed" ? (
                        <>
                            <CheckCircle2 className="h-4 w-4"/>
                            Completed
                        </>
                    ) : (
                        <>
                            <Play className="h-4 w-4"/>
                            Start Migration
                        </>
                    )}
                </button>
                {!canStart && status === "idle" && (
                    <p className="mt-2 text-center text-xs text-muted-foreground">
                        {!sourceProject
                            ? "Select a source project"
                            : !sourceDatabase
                                ? "Select a source database"
                                : selectedBackups.length === 0
                                    ? "Select at least one backup"
                                    : !targetProject
                                        ? "Select a target project"
                                        : !targetDatabase
                                            ? "Select a target database"
                                            : "Ready to start"}
                    </p>
                )}
            </div>
        </div>
    )
}
