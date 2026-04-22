"use client"

import {
    Database,
    HardDrive,
    Calendar,
    Check,
    ChevronLeft,
    FolderOpen,
    Server,
} from "lucide-react"
import {cn} from "@/lib/utils"
import {ProjectWithDatabasesAndBackups as ProjectWith} from "@/db/schema/06_project";
import {Backup, DatabaseWith} from "@/db/schema/07_database";
import {ScrollArea} from "@/components/ui/scroll-area";
import {formatLocalizedDate} from "@/utils/date-formatting";

type ViewState = "projects" | "databases" | "backups"

interface SourcePanelProps {
    projects: ProjectWith[]
    selectedProject: ProjectWith | null
    selectedDatabase: DatabaseWith | null
    selectedBackups: Backup[]
    onSelectProject: (project: ProjectWith | null) => void
    onSelectDatabase: (database: DatabaseWith | null) => void
    onSelectBackup: (backup: Backup) => void
    disabled?: boolean
}

export function SourcePanel({
                                projects,
                                selectedProject,
                                selectedDatabase,
                                selectedBackups,
                                onSelectProject,
                                onSelectDatabase,
                                onSelectBackup,
                                disabled,
                            }: SourcePanelProps) {
    const currentView: ViewState = selectedDatabase
        ? "backups"
        : selectedProject
            ? "databases"
            : "projects"


    const handleBack = () => {
        if (currentView === "backups") {
            onSelectDatabase(null)
        } else if (currentView === "databases") {
            onSelectProject(null)
        }
    }

    const getHeaderInfo = () => {
        if (currentView === "backups" && selectedDatabase) {
            return {
                title: selectedDatabase.name,
                subtitle: selectedDatabase.backups?.length? `${selectedBackups.length} of ${selectedDatabase.backups.length} backups selected` : "",
                icon: <Database className="h-5 w-5 text-primary"/>,
            }
        }
        if (currentView === "databases" && selectedProject) {
            return {
                title: selectedProject.name,
                subtitle: `${selectedProject.databases.length} database${selectedProject.databases.length !== 1 ? "s" : ""} available`,
                icon: <FolderOpen className="h-5 w-5 text-primary"/>,
            }
        }
        return {
            title: "Source",
            subtitle: "Select a project to start",
            icon: <FolderOpen className="h-5 w-5 text-primary"/>,
        }
    }

    const headerInfo = getHeaderInfo()

    return (
        <div className="rounded-xl border border-border bg-card h-full flex flex-col overflow-hidden">
            <div className="border-b border-border px-5 py-4">
                <div className="flex items-center gap-3">
                    {currentView !== "projects" ? (
                        <button
                            onClick={handleBack}
                            disabled={disabled}
                            className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary transition-colors hover:bg-secondary/80 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <ChevronLeft className="h-5 w-5 text-secondary-foreground"/>
                        </button>
                    ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                            {headerInfo.icon}
                        </div>
                    )}
                    <div className="min-w-0 flex-1">
                        <h2 className="truncate font-semibold text-foreground">
                            {headerInfo.title}
                        </h2>
                        <p className="text-sm text-muted-foreground">{headerInfo.subtitle}</p>
                    </div>
                </div>

                {currentView !== "projects" && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <button
                            onClick={() => {
                                onSelectDatabase(null)
                                onSelectProject(null)
                            }}
                            disabled={disabled}
                            className="hover:text-foreground disabled:opacity-50"
                        >
                            Projects
                        </button>
                        {selectedProject && (
                            <>
                                <span>/</span>
                                <button
                                    onClick={() => onSelectDatabase(null)}
                                    disabled={disabled}
                                    className={cn(
                                        "truncate hover:text-foreground disabled:opacity-50",
                                        currentView === "databases" && "text-foreground"
                                    )}
                                >
                                    {selectedProject.name}
                                </button>
                            </>
                        )}
                        {selectedDatabase && (
                            <>
                                <span>/</span>
                                <span className="truncate text-foreground">
                                  {selectedDatabase.name}
                                </span>
                            </>
                        )}
                    </div>
                )}
            </div>

            <ScrollArea
                // Do not remove the radix scroll
                className="w-full flex-1 [&>[data-radix-scroll-area-viewport]]:max-h-[calc(100vh-320px)]"
            >
                <div className="p-4">
                    {currentView === "projects" && (
                        <div className="flex flex-col gap-2">
                            {projects.length === 0 ? (
                                <div
                                    className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-6 text-center">
                                    <p className="text-sm text-muted-foreground">
                                        No projects available
                                    </p>
                                </div>
                            ) : (
                                projects.map((project) => (
                                    <button
                                        key={project.id}
                                        onClick={() => onSelectProject(project)}
                                        disabled={disabled}
                                        className={cn(
                                            "group w-full rounded-lg border border-border bg-card p-4 text-left transition-all",
                                            "hover:border-primary/50 hover:bg-accent/50",
                                            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                                            disabled && "cursor-not-allowed opacity-50"
                                        )}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div
                                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                                                <Server className="h-5 w-5 text-muted-foreground"/>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="truncate font-medium text-foreground">
                                                    {project.name}
                                                </h3>

                                                <p className="mt-2 text-sm text-muted-foreground">
                                                    {project.databases.length} database
                                                    {project.databases.length !== 1 ? "s" : ""}
                                                </p>
                                            </div>

                                            <ChevronLeft
                                                className="h-5 w-5 rotate-180 text-muted-foreground transition-transform group-hover:translate-x-1"/>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    )}

                    {currentView === "databases" && selectedProject && (
                        <div className="flex flex-col gap-2">
                            {selectedProject.databases.length === 0 ? (
                                <div className="py-8 text-center">
                                    <Database className="mx-auto h-10 w-10 text-muted-foreground/50"/>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        No databases in this project
                                    </p>
                                </div>
                            ) : (
                                selectedProject.databases.map((database) => (
                                    <button
                                        key={database.id}
                                        onClick={() => onSelectDatabase(database)}
                                        disabled={disabled}
                                        className={cn(
                                            "group w-full rounded-lg border border-border bg-card p-4 text-left transition-all",
                                            "hover:border-primary/50 hover:bg-accent/50",
                                            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                                            disabled && "cursor-not-allowed opacity-50"
                                        )}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div
                                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                                                <Database className="h-5 w-5 text-muted-foreground"/>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="truncate font-medium text-foreground">
                                                    {database.name}
                                                </h3>
                                                <p className="mt-0.5 text-sm text-muted-foreground">
                                                    {database.dbms}
                                                </p>
                                                <p className="mt-2 text-sm text-muted-foreground">
                                                    {database?.backups?.length} backup
                                                    {database?.backups?.length !== 1 ? "s" : ""} available
                                                </p>
                                            </div>
                                            <ChevronLeft
                                                className="h-5 w-5 rotate-180 text-muted-foreground transition-transform group-hover:translate-x-1"/>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    )}

                    {currentView === "backups" && selectedDatabase && (
                        <div className="flex flex-col gap-2">
                            {selectedDatabase?.backups?.length === 0 ? (
                                <div className="py-8 text-center">
                                    <HardDrive className="mx-auto h-10 w-10 text-muted-foreground/50"/>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        No backups available for this database
                                    </p>
                                </div>
                            ) : (
                                selectedDatabase?.backups?.map((backup) => {
                                    const isSelected = selectedBackups.some((b) => b.id === backup.id)
                                    return (
                                        <button
                                            key={backup.id}
                                            onClick={() => onSelectBackup(backup)}
                                            disabled={disabled}
                                            className={cn(
                                                "group relative w-full rounded-lg border p-4 text-left transition-all",
                                                "hover:border-primary/50 hover:bg-accent/50",
                                                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                                                isSelected
                                                    ? "border-primary bg-primary/5"
                                                    : "border-border bg-card",
                                                disabled && "cursor-not-allowed opacity-50"
                                            )}
                                        >
                                            <div
                                                className={cn(
                                                    "absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all",
                                                    isSelected
                                                        ? "border-primary bg-primary"
                                                        : "border-muted-foreground/30 bg-transparent"
                                                )}
                                            >
                                                {isSelected && (
                                                    <Check className="h-3 w-3 text-primary-foreground"/>
                                                )}
                                            </div>

                                            <div className="mb-3 pr-8">
                                                <h3 className="font-medium text-foreground">{backup.id}</h3>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                                    <HardDrive className="h-3.5 w-3.5"/>
                                                    <span>{backup.fileSize}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                                    <Calendar className="h-3.5 w-3.5"/>
                                                    <span>{ formatLocalizedDate(backup.createdAt)}</span>
                                                </div>
                                            </div>
                                        </button>
                                    )
                                })
                            )}
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    )
}
