import {PageParams} from "@/types/next";
import {Page, PageContent, PageHeader, PageTitle} from "@/features/layout/page";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Building2, Database, DatabaseBackup, Folder, RefreshCcw, Server, Workflow} from "lucide-react";
import {currentUser} from "@/lib/auth/current-user";
import {notFound} from "next/navigation";
import {db} from "@/db";
import {asc, inArray} from "drizzle-orm";
import * as drizzleDb from "@/db";
import {listOrganizations} from "@/lib/auth/auth";
import {Metadata} from "next";
import {getHealthDashboardPreferences} from "@/db/services/health-dashboard-preference";
import {getHealthPingFailures} from "@/db/services/health-ping";
import {HealthPingChart} from "@/components/wrappers/dashboard/health/health-ping-chart";
import {Badge} from "@/components/ui/badge";

export const metadata: Metadata = {
    title: "Home",
};

export default async function RoutePage(props: PageParams<{}>) {

    const user = await currentUser();
    const organizations = await listOrganizations()

    if (!user || !organizations) notFound();

    const organizationIds = organizations.map(project => project.id);

    const agents = await db.query.agent.findMany({});

    const projects = await db.query.project.findMany({
        where: inArray(drizzleDb.schemas.project.organizationId, organizationIds),
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
            deletedAt: true,
        },
        orderBy: [asc(drizzleDb.schemas.backup.id)],
        where: inArray(drizzleDb.schemas.backup.databaseId, databaseIds),
    });

    const availableBackups = backupsEvolution.filter(backup => backup.deletedAt == null);

    // Health dashboard: fetch pinned databases and their failure data
    const pinnedPrefs = await getHealthDashboardPreferences(user.id);
    const pinnedDbIds = pinnedPrefs.map((p) => p.databaseId);
    const pinnedDatabases = databasesOfAllProjects.filter((db) => pinnedDbIds.includes(db.id));

    let pinnedFailures: {databaseId: string; databaseName: string; timestamp: Date}[] = [];
    if (pinnedDbIds.length > 0) {
        pinnedFailures = await getHealthPingFailures(pinnedDbIds, 180);
    }

    return (
        <Page>
            <PageHeader>
                <PageTitle>Dashboard</PageTitle>
            </PageHeader>
            <PageContent className="flex flex-col gap-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="w-full">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Organizations</CardTitle>
                            <Building2 className="h-4 w-4 text-muted-foreground"/>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{organizations.length}</div>
                            <p className="text-xs text-muted-foreground">Number of organizations</p>
                        </CardContent>
                    </Card>

                    <Card className="w-full">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Projects</CardTitle>
                            <Folder className="h-4 w-4 text-muted-foreground"/>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{projects.length}</div>
                            <p className="text-xs text-muted-foreground">Number of projects</p>
                        </CardContent>
                    </Card>

                    <Card className="w-full">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Databases</CardTitle>
                            <Database className="h-4 w-4 text-muted-foreground"/>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{databasesOfAllProjects.length}</div>
                            <p className="text-xs text-muted-foreground">Databases across all projects</p>
                        </CardContent>
                    </Card>

                    <Card className="w-full">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Agents</CardTitle>
                            <Workflow className="h-4 w-4 text-muted-foreground"/>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{agents.length}</div>
                            <p className="text-xs text-muted-foreground">Registered agents</p>
                        </CardContent>
                    </Card>

                    <Card className="w-full">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Backups</CardTitle>
                            <DatabaseBackup className="h-4 w-4 text-muted-foreground"/>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{backupsEvolution.length}</div>
                            <p className="text-xs text-muted-foreground">All backups recorded</p>
                        </CardContent>
                    </Card>

                    <Card className="w-full">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Available Backups</CardTitle>
                            <RefreshCcw className="h-4 w-4 text-muted-foreground"/>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{availableBackups.length}</div>
                            <p className="text-xs text-muted-foreground">Currently active backups</p>
                        </CardContent>
                    </Card>
                </div>
                {pinnedDatabases.length > 0 && (
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-semibold">Health Monitoring</h2>
                            <Badge variant="secondary" className="text-xs">Agent Health</Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {pinnedDatabases.map((database) => {
                                const dbFailures = pinnedFailures
                                    .filter((f) => f.databaseId === database.id)
                                    .map((f) => ({timestamp: f.timestamp}));

                                return (
                                    <HealthPingChart
                                        key={database.id}
                                        databaseName={database.name}
                                        databaseId={database.id}
                                        dbms={database.dbms}
                                        lastContact={database.lastContact}
                                        failedPings={dbFailures}
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}
                {/*Do not delete*/}
                {/*<div className="flex flex-1 flex-col gap-4">*/}
                {/*    <div className="grid auto-rows-min gap-4 md:grid-cols-3">*/}
                {/*        <div className="aspect-video rounded-xl bg-muted/50"/>*/}
                {/*        <div className="aspect-video rounded-xl bg-muted/50"/>*/}
                {/*        <div className="aspect-video rounded-xl bg-muted/50"/>*/}
                {/*    </div>*/}
                {/*</div>*/}
            </PageContent>
        </Page>

    );
}
