import {PageParams} from "@/types/next";
import {AgentList} from "@/features/agents/components/agent-list";
import {Page, PageActions, PageContent, PageHeader, PageTitle} from "@/features/layout/components/page";
import {notFound} from "next/navigation";
import {db} from "@/db";
import * as drizzleDb from "@/db";
import {and, desc, eq, isNull, not} from "drizzle-orm";
import {Metadata} from "next";
import {AgentDialog} from "@/features/agents/components/agent-dialog";
import {maskDatabasesSecretsForClient} from "@/features/database/utils/credential-fields";

export const metadata: Metadata = {
    title: "Agents",
};

export default async function RoutePage(props: PageParams<{}>) {

    const agents = await db.query.agent.findMany({
        where: and(not(eq(drizzleDb.schemas.agent.isArchived, true)),isNull(drizzleDb.schemas.agent.organizationId)),
        with: {
            databases: true
        },
        orderBy: (fields) => desc(fields.lastContact),
    });
    
    if (!agents) {
        notFound();
    }

    // Never send secret credential fields to the browser.
    for (const a of agents) {
        a.databases = maskDatabasesSecretsForClient(a.databases);
    }

    return (
        <Page>
            <PageHeader>
                <PageTitle>Agents</PageTitle>
                {agents.length > 0 && (
                    <PageActions>
                         <AgentDialog typeTrigger={"create"} />
                    </PageActions>
                )}
            </PageHeader>
            <PageContent>
                {agents.length > 0 ? (
                    <AgentList agents={agents} serverNow={Date.now()}/>
                ) : (
                     <AgentDialog typeTrigger="empty"/>
                )}
            </PageContent>
        </Page>
    );
}