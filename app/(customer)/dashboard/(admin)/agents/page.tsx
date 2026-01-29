import {PageParams} from "@/types/next";
import {AgentCard} from "@/components/wrappers/dashboard/agent/agent-card/agent-card";
import {CardsWithPagination} from "@/components/wrappers/common/cards-with-pagination";
import {Page, PageActions, PageContent, PageHeader, PageTitle} from "@/features/layout/page";
import {notFound} from "next/navigation";
import {db} from "@/db";
import * as drizzleDb from "@/db";
import {desc, eq, not} from "drizzle-orm";
import {Metadata} from "next";
import {AgentDialog} from "@/features/agents/components/agent.dialog";

export const metadata: Metadata = {
    title: "Agents",
};

export default async function RoutePage(props: PageParams<{}>) {

    const agents = await db.query.agent.findMany({
        where: not(eq(drizzleDb.schemas.agent.isArchived, true)),
        with: {
            databases: true
        },
        orderBy: (fields) => desc(fields.lastContact),
    });

    if (!agents) {
        notFound();
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
                    <CardsWithPagination data={agents} cardItem={AgentCard} cardsPerPage={4} numberOfColumns={1}/>
                ) : (
                     <AgentDialog typeTrigger="empty"/>
                )}
            </PageContent>
        </Page>
    );
}