"use client"

import { useState } from "react"
import {ProjectWithDatabasesAndBackups as ProjectWith} from "@/db/schema/06_project";
import {SourcePanel} from "@/components/wrappers/dashboard/organization/migration/source-panel";
import {Backup, DatabaseWith} from "@/db/schema/07_database";
import {MigrationFlow, MigrationStatus} from "@/components/wrappers/dashboard/organization/migration/migration-flow";
import {TargetPanel} from "@/components/wrappers/dashboard/organization/migration/target-panel";

interface MigrationToolProps {
    projects: ProjectWith[]
}

export const MigrationTool = ({projects}:MigrationToolProps) => {

    const [sourceProject, setSourceProject] = useState<ProjectWith | null>(null)
    const [sourceDatabase, setSourceDatabase] = useState<DatabaseWith | null>(null)
    const [selectedBackups, setSelectedBackups] = useState<Backup[]>([])

    const [targetProject, setTargetProject] = useState<ProjectWith | null>(null)
    const [targetDatabase, setTargetDatabase] = useState<DatabaseWith | null>(null)

    const [migrationStatus, setMigrationStatus] = useState<MigrationStatus>("idle")
    const [migrationProgress, setMigrationProgress] = useState(0)

    const handleSelectSourceProject = (project: ProjectWith | null) => {
        setSourceProject(project)
        setSourceDatabase(null)
        setSelectedBackups([])
    }

    const handleSelectSourceDatabase = (database: DatabaseWith | null) => {
        setSourceDatabase(database)
        setSelectedBackups([])
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

    const handleStartMigration = () => {
        if (selectedBackups.length === 0 || !targetDatabase) return

        setMigrationStatus("migrating")
        setMigrationProgress(0)

        const interval = setInterval(() => {
            setMigrationProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval)
                    setMigrationStatus("completed")
                    handleReset()
                    return 100
                }
                return prev + Math.random() * 15
            })
        }, 500)
    }

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
        <div className=" h-full">
                <div className="grid grid-cols-12 gap-6  h-full">
                    <div className="col-span-4 ">
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
                            progress={migrationProgress}
                            onStartMigration={handleStartMigration}
                            canStart={canStartMigration}
                        />
                    </div>
                    <div className="col-span-4">
                        <TargetPanel
                            projects={projects}
                            selectedProject={targetProject}
                            selectedDatabase={targetDatabase}
                            onSelectProject={handleSelectTargetProject}
                            onSelectDatabase={handleSelectTargetDatabase}
                            disabled={migrationStatus !== "idle"}
                        />
                    </div>
                </div>
        </div>
    )
}
