import {PageParams} from "@/types/next";
import {Page, PageContent, PageHeader, PageTitle} from "@/features/layout/components/page";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {EvolutionLineChart} from "@/features/statistics/components/evolution-line-chart";
import {PercentageLineChart} from "@/features/statistics/components/percentage-line-chart";
import {notFound} from "next/navigation";
import {db} from "@/db";
import {and, asc, count, eq, inArray} from "drizzle-orm";
import * as drizzleDb from "@/db";
import {getOrganization} from "@/lib/auth/auth";
import {Building2, DatabaseBackup, Folder, RefreshCcw} from "lucide-react";
import {Metadata} from "next";

export const metadata: Metadata = {
    title: "Statistics",
};

export default async function RoutePage(props: PageParams<{}>) {
    const organization = await getOrganization({});

    if (!organization) {
        notFound();
    }

    const org = await db.query.organization.findFirst({
        where: eq(drizzleDb.schemas.organization.slug, organization.slug),
    });

    if (!org) notFound();

    const projects = await db.query.project.findMany({
        where: and(eq(drizzleDb.schemas.project.organizationId, org.id), eq(drizzleDb.schemas.project.isArchived, false))
    });

    const projectIds = projects.map(project => project.id);

    const databasesOfAllProjects = await db.query.database.findMany({
        where: inArray(drizzleDb.schemas.database.projectId, projectIds),
    })
    const databaseIds = databasesOfAllProjects.map((database) => database.id);


    const backupsEvolution = await db.query.backup.findMany({
        columns: {
            id: true,
            createdAt: true,
        },
        orderBy: [asc(drizzleDb.schemas.backup.id)],
        where: inArray(drizzleDb.schemas.backup.databaseId, databaseIds),
    });


    const backupsRate = await db
        .select({
            createdAt: drizzleDb.schemas.backup.createdAt,
            status: drizzleDb.schemas.backup.status,
            _count: count(),
        })
        .from(drizzleDb.schemas.backup)
        .where(and(inArray(drizzleDb.schemas.backup.status, ["success", "failed"]), inArray(drizzleDb.schemas.backup.databaseId, databaseIds)))
        .groupBy(drizzleDb.schemas.backup.createdAt, drizzleDb.schemas.backup.status)
        .orderBy(drizzleDb.schemas.backup.createdAt);


    const restorationsCountResult = await db
        .select({
            count: count(),
        })
        .from(drizzleDb.schemas.restoration)
        .where(inArray(drizzleDb.schemas.restoration.databaseId, databaseIds));


    const restorationsCount = restorationsCountResult[0]?.count ?? 0;
    const projectsCount = projects.length;
    const backupsEvolutionCount = backupsEvolution.length;

    const sortedBackupsEvolution = backupsEvolution.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );


    return (
        <Page>
            <PageHeader>
                <PageTitle>Statistics Overview</PageTitle>
            </PageHeader>

            <PageContent className="flex flex-col gap-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="w-full">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Projects</CardTitle>
                            <Building2 className="h-4 w-4 text-muted-foreground"/>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{projectsCount}</div>
                            <p className="text-xs text-muted-foreground">Active projects in this organization</p>
                        </CardContent>
                    </Card>

                    <Card className="w-full">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Backups</CardTitle>
                            <DatabaseBackup className="h-4 w-4 text-muted-foreground"/>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{backupsEvolutionCount}</div>
                            <p className="text-xs text-muted-foreground">Total backups executed across all databases</p>
                        </CardContent>
                    </Card>

                    <Card className="w-full">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Restorations</CardTitle>
                            <RefreshCcw className="h-4 w-4 text-muted-foreground"/>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{restorationsCount}</div>
                            <p className="text-xs text-muted-foreground">Total restoration operations performed</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                    <EvolutionLineChart
                        data={sortedBackupsEvolution}
                    />

                    <PercentageLineChart
                        data={backupsRate}/>
                </div>
            </PageContent>
        </Page>
    );
}
