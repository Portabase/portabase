import {PageParams} from "@/types/next";
import {Page, PageContent, PageDescription, PageHeader, PageTitle} from "@/features/layout/page";
import {currentUser} from "@/lib/auth/current-user";
import {notFound} from "next/navigation";
import {listOrganizations} from "@/lib/auth/auth";
import {getDatabasesWithHealth, getHealthPingFailures} from "@/db/services/health-ping";
import {getAllHealthDashboardPreferences} from "@/db/services/health-dashboard-preference";
import {HealthStatusList} from "@/components/wrappers/dashboard/health/health-status-list";
import {Metadata} from "next";

export const metadata: Metadata = {
    title: "Health Status",
};

export default async function RoutePage(props: PageParams<{}>) {
    const user = await currentUser();
    const organizations = await listOrganizations();

    if (!user || !organizations) notFound();

    const organizationIds = organizations.map((org) => org.id);
    const databases = await getDatabasesWithHealth(organizationIds);
    const databaseIds = databases.map((db) => db.id);

    const [failedPings, preferences] = await Promise.all([
        getHealthPingFailures(databaseIds, 90),
        getAllHealthDashboardPreferences(user.id),
    ]);

    const prefsMap: Record<string, boolean> = {};
    for (const pref of preferences) {
        prefsMap[pref.databaseId] = pref.visible;
    }

    const serializedDatabases = databases.map((db) => ({
        id: db.id,
        name: db.name,
        dbms: db.dbms,
        lastContact: db.lastContact,
    }));

    const serializedFailures = failedPings.map((f) => ({
        databaseId: f.databaseId,
        timestamp: f.timestamp,
    }));

    return (
        <Page>
            <PageHeader>
                <PageTitle>Health Status</PageTitle>
            </PageHeader>
            <PageDescription>
                Monitor database connectivity. Toggle the switch to pin a chart to your main dashboard.
            </PageDescription>
            <PageContent>
                <HealthStatusList
                    databases={serializedDatabases}
                    failedPings={serializedFailures}
                    preferences={prefsMap}
                />
            </PageContent>
        </Page>
    );
}
