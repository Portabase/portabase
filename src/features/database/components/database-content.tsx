"use client";
import {DatabaseBackupActionsModal} from "@/features/database/components/backup-actions-modal";
import {DatabaseTabs, isBackupOnly} from "@/features/database/components/database-tabs";
import {DatabaseWith} from "@/db/schema/07_database";
import {MemberWithUser} from "@/db/schema/03_organization";
import {useBackupModal} from "@/features/database/components/backup-modal-context";
import {DatabaseKpi} from "@/features/database/components/database-kpi";
import {useQuery} from "@tanstack/react-query";
import {getDatabaseDataAction} from "@/features/database/actions/backup-get-data.action";
import {
    PageContent,
    PageDescription,
    PageTitle,
} from "@/features/layout/components/page";
import {capitalizeFirstLetter} from "@/utils/text";
import {RetentionPolicySheet} from "@/features/database/components/retention-policy-sheet";
import {CronButton} from "@/features/database/components/cron-button";
import {ChannelPoliciesModal} from "@/features/database/components/channels-policy-modal";
import {HardDrive, Megaphone} from "lucide-react";
import {ImportModal} from "@/features/database/components/import-modal";
import {BackupButton} from "@/features/database/components/backup-button";
import {HealthModal} from "@/features/database/components/health-modal";
import {HealthcheckLog} from "@/db/schema/15_healthcheck-log";
import {Badge} from "@/components/ui/badge";
import {LogsModal} from "@/features/logs/components/logs-modal";
import {InfoTooltip} from "@/features/stats/components/info-tooltip";
import {METHOD_DESCRIPTIONS, METHOD_LABELS} from "@/features/database/utils/backup-method";
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert";
import {AlertCircleIcon} from "lucide-react";

export type DatabaseContentProps = {
    isAlreadyRestore: boolean;
    database: DatabaseWith;
    activeMember: MemberWithUser;
    totalBackups: number;
    availableBackups: number;
    successRate: number | null;
    organizationId: string;
    activeOrganizationChannels: any[];
    activeOrganizationStorageChannels: any[];
    databaseHealthLogs: HealthcheckLog[]
};

export const DatabaseContent = (props: DatabaseContentProps) => {
    const {} = useBackupModal();

    const {data} = useQuery({
        queryKey: ["database-data", props.database.id],
        queryFn: async () => {
            const result = await getDatabaseDataAction({
                databaseId: props.database.id,
            });
            return result?.data;
        },
        initialData: {
            // @ts-ignore
            database: {
                ...props.database,
                project: props.database.project ?? null,
            },
            activeOrganizationChannels: props.activeOrganizationChannels,
            activeOrganizationStorageChannels:
            props.activeOrganizationStorageChannels,
            stats: {
                totalBackups: props.totalBackups,
                availableBackups: props.availableBackups,
                successRate: props.successRate,
            },
            isAlreadyRestore: props.isAlreadyRestore,
            isAlreadyBackup: false,
            health: props.databaseHealthLogs
        },
        staleTime: 0,
        gcTime: 0,
        refetchInterval: 4000,
    });

    const database = data?.database ?? props.database;
    const activeOrganizationChannels =
        data?.activeOrganizationChannels ?? props.activeOrganizationChannels;
    const activeOrganizationStorageChannels =
        data?.activeOrganizationStorageChannels ??
        props.activeOrganizationStorageChannels;
    const stats = data?.stats ?? {
        totalBackups: props.totalBackups,
        availableBackups: props.availableBackups,
        successRate: props.successRate,
    };

    const isAlreadyRestore = data?.isAlreadyRestore ?? props.isAlreadyRestore;
    const isAlreadyBackup = data?.isAlreadyBackup ?? false;

    const isMember = props.activeMember.role === "member";

    return (
        <>
            <div className="justify-between gap-2 sm:flex">
                <PageTitle className="flex flex-col md:flex-row items-center justify-between w-full ">
                    <div className="flex min-w-full md:min-w-fit justify-between gap-2 items-center ">
                        {capitalizeFirstLetter(database.name)}
                        <div className="flex items-center justify-center gap-2">
                            <Badge variant="outline" className="bg-orange-400/10 border-orange-600/50 text-orange-600">
                                {database.dbms}
                            </Badge>
                            {database.dbms === "files" && (
                                <>
                                    <Badge variant="outline">
                                        {METHOD_LABELS[database.backupEngine]}
                                    </Badge>
                                    <InfoTooltip
                                        content={`${METHOD_DESCRIPTIONS[database.backupEngine]} Set at creation.`}
                                    />
                                </>
                            )}
                        </div>
                    </div>
                    {!isMember && (
                        <div className="flex items-center gap-2 md:justify-between w-full ">
                            <div className="flex items-center gap-2">
                                <RetentionPolicySheet
                                    scope={{type: "database", id: database.id}}
                                    retentionPolicy={database.retentionPolicy ?? null}
                                    hasBackupPolicy={database.backupPolicy !== null}
                                    queryKey={["database-data", database.id]}
                                />
                                <CronButton
                                    scope={{type: "database", id: database.id}}
                                    currentCron={database.backupPolicy}
                                    queryKey={["database-data", database.id]}
                                />
                                <ChannelPoliciesModal
                                    scope={{type: "database", id: database.id}}
                                    alertPolicies={database.alertPolicies ?? []}
                                    kind={"notification"}
                                    icon={<Megaphone/>}
                                    channels={activeOrganizationChannels}
                                    organizationId={props.organizationId}
                                    queryKey={["database-data", database.id]}
                                    isBackupOnly={isBackupOnly(database)}
                                />
                                <ChannelPoliciesModal
                                    scope={{type: "database", id: database.id}}
                                    storagePolicies={database.storagePolicies ?? []}
                                    icon={<HardDrive/>}
                                    kind={"storage"}
                                    channels={activeOrganizationStorageChannels}
                                    organizationId={props.organizationId}
                                    queryKey={["database-data", database.id]}
                                />
                                {database.dbms !== "docker-volume" && database.dbms !== "files" && (
                                    <ImportModal database={database}/>
                                )}
                                <HealthModal database={database} healthLogs={data?.health ?? []}/>
                                <InfoTooltip
                                    content={
                                        "Leave a policy unset to inherit the project's default; configure it here to override it for this database."
                                    }
                                />
                            </div>


                            <div className="flex items-center gap-2">
                                <BackupButton
                                    disable={isAlreadyBackup || !database.lastContact || !!database.methodConflict}
                                    databaseId={database.id}
                                    engine={database.backupEngine}
                                />
                            </div>
                        </div>
                    )}
                </PageTitle>
            </div>

            {database.methodConflict && (
                <Alert variant="destructive" className="mt-4 mb-2.5">
                    <AlertCircleIcon/>
                    <AlertTitle>Backups suspended</AlertTitle>
                    <AlertDescription>
                        databases.json announces &quot;{database.methodConflict}&quot;, this source uses{" "}
                        {METHOD_LABELS[database.backupEngine]}. Fix the file, or create a new source to change method.
                    </AlertDescription>
                </Alert>
            )}

            {database.description && (
                <PageDescription className="mt-5 sm:mt-0">
                    {database.description}
                </PageDescription>
            )}

            <PageContent className="flex flex-col w-full h-full">
                <DatabaseKpi
                    successRate={stats.successRate}
                    database={database}
                    availableBackups={stats.availableBackups}
                    totalBackups={stats.totalBackups}
                />
                <LogsModal/>
                <DatabaseBackupActionsModal dbms={database.dbms}/>
                <DatabaseTabs
                    activeMember={props.activeMember}
                    database={database}
                    isAlreadyRestore={isAlreadyRestore}
                />
            </PageContent>
        </>
    );
};
