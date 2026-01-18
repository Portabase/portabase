import {PageParams} from "@/types/next";
import {notFound, redirect} from "next/navigation";
import {Page, PageContent, PageDescription, PageTitle} from "@/features/layout/page";
import {BackupButton} from "@/components/wrappers/dashboard/backup/backup-button/backup-button";
import {DatabaseKpi} from "@/components/wrappers/dashboard/projects/database/database-kpi";
import {CronButton} from "@/components/wrappers/dashboard/database/cron-button/cron-button";
import {db} from "@/db";
import {eq, and, inArray} from "drizzle-orm";
import * as drizzleDb from "@/db";
import {getOrganizationProjectDatabases} from "@/lib/services";
import {getActiveMember, getOrganization} from "@/lib/auth/auth";
import {RetentionPolicySheet} from "@/components/wrappers/dashboard/database/retention-policy/retention-policy-sheet";
import {capitalizeFirstLetter} from "@/utils/text";
import {getOrganizationChannels} from "@/db/services/notification-channel";
import {ImportModal} from "@/components/wrappers/dashboard/database/import/import-modal";
import {getOrganizationStorageChannels} from "@/db/services/storage-channel";
import {ChannelPoliciesModal} from "@/components/wrappers/dashboard/database/channels-policy/policy-modal";
import {HardDrive, Megaphone} from "lucide-react";
import {BackupModalProvider} from "@/components/wrappers/dashboard/database/backup/backup-modal-context";
import {DatabaseContent} from "@/components/wrappers/dashboard/projects/database/database-content";

export default async function RoutePage(props: PageParams<{
    projectId: string;
    databaseId: string
}>) {
    const {projectId, databaseId} = await props.params;

    const organization = await getOrganization({});
    const activeMember = await getActiveMember()

    if (!organization || !activeMember) {
        notFound();
    }

    const databasesProject = await getOrganizationProjectDatabases({
        organizationSlug: organization.slug,
        projectId: projectId
    })

    const dbItem = await db.query.database.findFirst({
        where: and(inArray(drizzleDb.schemas.backup.id, databasesProject.ids ?? []), eq(drizzleDb.schemas.database.id, databaseId), eq(drizzleDb.schemas.database.projectId, projectId)),
        with: {
            project: true,
            retentionPolicy: true,
            alertPolicies: true,
            storagePolicies: true
        }
    });

    if (!dbItem) {
        redirect("/dashboard/projects");
    }

    const backups = await db.query.backup.findMany({
        where: eq(drizzleDb.schemas.backup.databaseId, dbItem.id),
        with: {
            restorations: true,
            storages: {
                with: {
                    storageChannel: true
                }
            }
        },
        orderBy: (b, {desc}) => [desc(b.createdAt)],
    });

    const restorations = await db.query.restoration.findMany({
        where: eq(drizzleDb.schemas.restoration.databaseId, dbItem.id),
        orderBy: (r, {desc}) => [desc(r.createdAt)],
    });

    const isAlreadyBackup = backups.some((b) => b.status === "waiting" || b.status === "ongoing");
    const isAlreadyRestore = restorations.some((r) => r.status === "waiting");

    const totalBackups = await db.select({count: drizzleDb.schemas.backup.id})
        .from(drizzleDb.schemas.backup)
        .where(eq(drizzleDb.schemas.backup.databaseId, dbItem.id))
        .then(rows => rows.length);

    const availableBackups = backups.filter(b => !b.deletedAt).length;

    const successfulBackups = await db.select({count: drizzleDb.schemas.backup.id})
        .from(drizzleDb.schemas.backup)
        .where(and(
            eq(drizzleDb.schemas.backup.databaseId, dbItem.id),
            eq(drizzleDb.schemas.backup.status, "success")
        ))
        .then(rows => rows.length);


    const [settings] = await db.select().from(drizzleDb.schemas.setting).where(eq(drizzleDb.schemas.setting.name, "system")).limit(1);
    if (!settings) {
        notFound();
    }

    const organizationChannels = await getOrganizationChannels(organization.id);
    const activeOrganizationChannels = organizationChannels.filter(channel => channel.enabled);

    const organizationStorageChannels = await getOrganizationStorageChannels(organization.id);
    const activeOrganizationStorageChannels = organizationStorageChannels.filter(channel => channel.enabled);


    const successRate = totalBackups > 0 ? (successfulBackups / totalBackups) * 100 : null;

    const isMember = activeMember?.role === "member";

    return (
        <Page>

            <div className="justify-between gap-2 sm:flex">
                <PageTitle className="flex flex-col md:flex-row items-center justify-between w-full ">
                    <div className="min-w-full md:min-w-fit ">
                        {capitalizeFirstLetter(dbItem.name)}
                    </div>
                    {!isMember && (
                        <div className="flex items-center gap-2 md:justify-between w-full ">
                            <div className="flex items-center gap-2">
                                <RetentionPolicySheet database={dbItem}/>
                                <CronButton database={dbItem}/>
                                <ChannelPoliciesModal
                                    database={dbItem}
                                    kind={"notification"}
                                    icon={<Megaphone/>}
                                    channels={activeOrganizationChannels}
                                    organizationId={organization.id}
                                />
                                <ChannelPoliciesModal
                                    database={dbItem}
                                    icon={<HardDrive/>}
                                    kind={"storage"}
                                    channels={activeOrganizationStorageChannels}
                                    organizationId={organization.id}
                                />
                                <ImportModal database={dbItem}/>
                            </div>
                            <div className="flex items-center gap-2">
                                <BackupButton disable={isAlreadyBackup} databaseId={databaseId}/>
                            </div>
                        </div>
                    )}
                </PageTitle>


            </div>

            {dbItem.description && (
                <PageDescription className="mt-5 sm:mt-0">{dbItem.description}</PageDescription>
            )}
            <PageContent className="flex flex-col w-full h-full">
                <DatabaseKpi successRate={successRate} database={dbItem} availableBackups={availableBackups}
                             totalBackups={totalBackups}/>
                <BackupModalProvider>
                    <DatabaseContent
                        activeMember={activeMember}
                        settings={settings}
                        database={dbItem}
                        isAlreadyRestore={isAlreadyRestore}
                        restorations={restorations}
                        backups={backups}
                    />
                </BackupModalProvider>
            </PageContent>
        </Page>
    );
}
