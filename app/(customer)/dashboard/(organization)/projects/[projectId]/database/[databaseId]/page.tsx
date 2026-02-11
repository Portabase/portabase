import {PageParams} from "@/types/next";
import {notFound, redirect} from "next/navigation";
import {Page} from "@/features/layout/page";
import {db} from "@/db";
import {eq, and, inArray} from "drizzle-orm";
import * as drizzleDb from "@/db";
import {getOrganizationProjectDatabases} from "@/lib/services";
import {getActiveMember, getOrganization} from "@/lib/auth/auth";
import {getOrganizationChannels} from "@/db/services/notification-channel";
import {getOrganizationStorageChannels} from "@/db/services/storage-channel";
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
            <BackupModalProvider>
                <DatabaseContent
                    activeMember={activeMember}
                    settings={settings}
                    database={dbItem}
                    isAlreadyRestore={isAlreadyRestore}
                    restorations={restorations}
                    backups={backups}
                    totalBackups={totalBackups}
                    availableBackups={availableBackups}
                    successRate={successRate}
                    organizationId={organization.id}
                    activeOrganizationChannels={activeOrganizationChannels}
                    activeOrganizationStorageChannels={activeOrganizationStorageChannels}
                />
            </BackupModalProvider>
        </Page>
    );
}