import {PageParams} from "@/types/next";
import {Page, PageContent, PageHeader, PageTitle} from "@/features/layout/page";
import {notFound} from "next/navigation";
import {getOrganization} from "@/lib/auth/auth";
import {Metadata} from "next";
import {db} from "@/db";
import {MigrationTool} from "@/components/wrappers/dashboard/organization/migration/migration-tool";

export const metadata: Metadata = {
    title: "Projects",
};

export default async function RoutePage(props: PageParams<{}>) {

    const organization = await getOrganization({});

    if (!organization) {
        notFound();
    }

    const projects = await db.query.project.findMany({
        where: (project, {eq, and, not}) =>
            and(
                eq(project.organizationId, organization.id),
                not(eq(project.isArchived, true))
            ),
        with: {
            organization: true,
            databases: {
                where: (database, {isNull}) => isNull(database.deletedAt),
                with: {
                    backups: {
                        where: (backup, {isNull}) => isNull(backup.deletedAt),
                        orderBy: (backup, {desc}) => [desc(backup.createdAt)],
                        limit: 10,
                    }
                }
            },
        },
    });
    return (
        <Page>
            <PageHeader className="flex flex-col items-start justify-between mb-6">
                <PageTitle className="mb-2">
                    Database Migration
                </PageTitle>
                <p className="text-sm text-muted-foreground">
                    Import backups from a source project into your target database
                </p>
            </PageHeader>
            <PageContent>
                <MigrationTool projects={projects}/>
            </PageContent>
        </Page>
    );
}