"use client"
import {DatabaseBackupActionsModal} from "@/components/wrappers/dashboard/database/backup/actions/backup-actions-modal";
import {DatabaseTabs} from "@/components/wrappers/dashboard/projects/database/database-tabs";
import {Setting} from "@/db/schema/01_setting";
import {BackupWith, DatabaseWith, Restoration} from "@/db/schema/07_database";
import {MemberWithUser} from "@/db/schema/03_organization";
import {useBackupModal} from "@/components/wrappers/dashboard/database/backup/backup-modal-context";
import {DatabaseKpi} from "@/components/wrappers/dashboard/projects/database/database-kpi";
import {useQuery, useQueryClient} from "@tanstack/react-query";
import {getDatabaseDataAction} from "@/components/wrappers/dashboard/database/backup/actions/get-data.action";
import {PageContent, PageDescription, PageTitle} from "@/features/layout/page";
import {capitalizeFirstLetter} from "@/utils/text";
import {RetentionPolicySheet} from "@/components/wrappers/dashboard/database/retention-policy/retention-policy-sheet";
import {CronButton} from "@/components/wrappers/dashboard/database/cron-button/cron-button";
import {ChannelPoliciesModal} from "@/components/wrappers/dashboard/database/channels-policy/policy-modal";
import {HardDrive, Megaphone} from "lucide-react";
import {ImportModal} from "@/components/wrappers/dashboard/database/import/import-modal";
import {BackupButton} from "@/components/wrappers/dashboard/backup/backup-button/backup-button";


export type DatabaseContentProps = {
    settings: Setting,
    backups: BackupWith[],
    restorations: Restoration[],
    isAlreadyRestore: boolean,
    database: DatabaseWith,
    activeMember: MemberWithUser,
    totalBackups: number,
    availableBackups: number,
    successRate: number | null,
    organizationId: string,
    activeOrganizationChannels: any[],
    activeOrganizationStorageChannels: any[]
}


export const DatabaseContent = (props: DatabaseContentProps) => {
    const {} = useBackupModal();


    const {data} = useQuery({
        queryKey: ["database-data", props.database.id],
        queryFn: async () => {
            const result = await getDatabaseDataAction({databaseId: props.database.id});
            return result?.data;
        },
        initialData: {
            // TODO : to be patched
            // @ts-ignore
            database: {
                ...props.database,
                project: props.database.project ?? null,
            },
            backups: props.backups,
            restorations: props.restorations,
            activeOrganizationChannels: props.activeOrganizationChannels,
            activeOrganizationStorageChannels: props.activeOrganizationStorageChannels,
            stats: {
                totalBackups: props.totalBackups,
                availableBackups: props.availableBackups,
                successRate: props.successRate
            }
        },
        staleTime: 0,
        gcTime: 0,
        refetchInterval: 1000,
    });

    const database = data?.database ?? props.database;
    const backups = data?.backups ?? props.backups;
    const restorations = data?.restorations ?? props.restorations;
    const activeOrganizationChannels = data?.activeOrganizationChannels ?? props.activeOrganizationChannels;
    const activeOrganizationStorageChannels = data?.activeOrganizationStorageChannels ?? props.activeOrganizationStorageChannels;
    const stats = data?.stats ?? {
        totalBackups: props.totalBackups,
        availableBackups: props.availableBackups,
        successRate: props.successRate
    };

    const isAlreadyRestore = restorations.some((r) => r.status === "waiting");
    const isAlreadyBackup = backups.some((b) => b.status === "waiting" || b.status === "ongoing");

    const isMember = props.activeMember.role === "member";

    return (
        <>
            <div className="justify-between gap-2 sm:flex">
                <PageTitle className="flex flex-col md:flex-row items-center justify-between w-full ">
                    <div className="min-w-full md:min-w-fit ">
                        {capitalizeFirstLetter(database.name)}
                    </div>
                    {!isMember && (
                        <div className="flex items-center gap-2 md:justify-between w-full ">
                            <div className="flex items-center gap-2">
                                <RetentionPolicySheet database={database}/>
                                <CronButton database={database}/>
                                <ChannelPoliciesModal
                                    database={database}
                                    kind={"notification"}
                                    icon={<Megaphone/>}
                                    channels={activeOrganizationChannels}
                                    organizationId={props.organizationId}
                                />
                                <ChannelPoliciesModal
                                    database={database}
                                    icon={<HardDrive/>}
                                    kind={"storage"}
                                    channels={activeOrganizationStorageChannels}
                                    organizationId={props.organizationId}
                                />
                                <ImportModal database={database}/>
                            </div>
                            <div className="flex items-center gap-2">
                                <BackupButton disable={isAlreadyBackup} databaseId={database.id}/>
                            </div>
                        </div>
                    )}
                </PageTitle>
            </div>

            {database.description && (
                <PageDescription className="mt-5 sm:mt-0">{database.description}</PageDescription>
            )}

            <PageContent className="flex flex-col w-full h-full">
                <DatabaseKpi
                    successRate={stats.successRate}
                    database={database}
                    availableBackups={stats.availableBackups}
                    totalBackups={stats.totalBackups}
                />
                <DatabaseBackupActionsModal/>
                <DatabaseTabs
                    activeMember={props.activeMember}
                    settings={props.settings}
                    database={database}
                    isAlreadyRestore={isAlreadyRestore}
                    backups={backups}
                    restorations={restorations}
                />
            </PageContent>
        </>
    )
}