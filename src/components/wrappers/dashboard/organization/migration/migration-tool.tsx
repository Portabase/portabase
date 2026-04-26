"use client"

import {useState, useMemo} from "react"
import {ProjectWithDatabasesAndBackups as ProjectWith} from "@/db/schema/06_project"
import {SourcePanel} from "@/components/wrappers/dashboard/organization/migration/source-panel"
import {Backup, DatabaseWith} from "@/db/schema/07_database"
import {MigrationFlow, MigrationStatus} from "@/components/wrappers/dashboard/organization/migration/migration-flow"
import {TargetPanel} from "@/components/wrappers/dashboard/organization/migration/target-panel"
import {useMutation} from "@tanstack/react-query";
import {toast} from "sonner";
import {migrationAction} from "@/components/wrappers/dashboard/organization/migration/migration.action";
import {useRouter} from "next/navigation";

interface MigrationToolProps {
    projects: ProjectWith[]
}

export const MigrationTool = ({projects}: MigrationToolProps) => {
    const [sourceProject, setSourceProject] = useState<ProjectWith | null>(null)
    const [sourceDatabase, setSourceDatabase] = useState<DatabaseWith | null>(null)
    const [selectedBackups, setSelectedBackups] = useState<Backup[]>([])
    const router = useRouter()
    const [targetProject, setTargetProject] = useState<ProjectWith | null>(null)
    const [targetDatabase, setTargetDatabase] = useState<DatabaseWith | null>(null)

    const [migrationStatus, setMigrationStatus] = useState<MigrationStatus>("idle")
    const [migrationProgress, setMigrationProgress] = useState(0)

    const sourceDbKind = sourceDatabase?.dbms

    const isTargetEnabled = useMemo(() => {
        return migrationStatus === "idle" &&
            sourceDatabase !== null &&
            selectedBackups.length > 0
    }, [sourceDatabase, migrationStatus, selectedBackups])

    const filteredProjects = useMemo(() => {
        if (!sourceDbKind) return []

        return projects.map((project) => ({
            ...project,
            databases: project.databases.filter((db) => {
                const sameKind = db.dbms === sourceDbKind
                const notSource = db.id !== sourceDatabase?.id
                return sameKind && notSource
            }),
        }))
    }, [projects, sourceDbKind, sourceDatabase])

    const handleSelectSourceProject = (project: ProjectWith | null) => {
        setSourceProject(project)
        setSourceDatabase(null)
        setSelectedBackups([])
        setTargetProject(null)
        setTargetDatabase(null)
    }

    const handleSelectSourceDatabase = (database: DatabaseWith | null) => {
        setSourceDatabase(database)
        setSelectedBackups([])

        if (targetDatabase && database?.dbms !== targetDatabase.dbms) {
            setTargetProject(null)
            setTargetDatabase(null)
        }

        if (targetDatabase && database?.id === targetDatabase.id) {
            setTargetProject(null)
            setTargetDatabase(null)
        }
    }

    const handleSelectBackup = (backup: Backup) => {
        setSelectedBackups((prev) => {
            const isSelected = prev.some((b) => b.id === backup.id)
            if (isSelected) {
                return prev.filter((b) => b.id !== backup.id)
            }
            return [...prev, backup]
        })
    }

    const handleSelectTargetProject = (project: ProjectWith | null) => {
        setTargetProject(project)
        setTargetDatabase(null)
    }

    const handleSelectTargetDatabase = (database: DatabaseWith | null) => {
        setTargetDatabase(database)
    }

    const mutation = useMutation({
        mutationFn: async () => {
            if (selectedBackups.length === 0 || !targetDatabase) return
            setMigrationStatus("migrating")

            const result = await migrationAction({
                targetDatabaseId: targetDatabase?.id,
                backupIds: selectedBackups.map((backup) => backup.id)
            })
            const inner = result?.data;
            console.log(inner)
            if (inner?.success) {
                toast.success(inner.actionSuccess?.message);
                handleReset()
                router.refresh();
            } else {
                toast.error(inner?.actionError?.message);
            }
        },
    });

    const handleReset = () => {
        setMigrationStatus("idle")
        setMigrationProgress(0)
        setSelectedBackups([])
        setSourceProject(null)
        setSourceDatabase(null)
        setTargetProject(null)
        setTargetDatabase(null)
    }

    const canStartMigration =
        selectedBackups.length > 0 &&
        targetDatabase !== null &&
        migrationStatus === "idle"

    return (
        <div className="h-full">
            <div className="grid grid-cols-12 gap-6 h-full">
                <div className="col-span-4">
                    <SourcePanel
                        projects={projects}
                        selectedProject={sourceProject}
                        selectedDatabase={sourceDatabase}
                        selectedBackups={selectedBackups}
                        onSelectProject={handleSelectSourceProject}
                        onSelectDatabase={handleSelectSourceDatabase}
                        onSelectBackup={handleSelectBackup}
                        disabled={migrationStatus !== "idle"}
                    />
                </div>

                <div className="col-span-4">
                    <MigrationFlow
                        sourceProject={sourceProject}
                        sourceDatabase={sourceDatabase}
                        selectedBackups={selectedBackups}
                        targetProject={targetProject}
                        targetDatabase={targetDatabase}
                        status={migrationStatus}
                        onStartMigration={() => mutation.mutateAsync()}
                        canStart={canStartMigration}
                    />
                </div>

                <div className="col-span-4">
                    <TargetPanel
                        projects={filteredProjects}
                        selectedProject={targetProject}
                        selectedDatabase={targetDatabase}
                        onSelectProject={handleSelectTargetProject}
                        onSelectDatabase={handleSelectTargetDatabase}
                        disabled={!isTargetEnabled}
                    />
                </div>
            </div>
        </div>
    )
}