import {PageParams} from "@/types/next";
import {AgentCard} from "@/features/agents/components/agent-card";
import {CardsWithPagination} from "@/components/common/cards-with-pagination";
import {Page, PageActions, PageContent, PageHeader, PageTitle} from "@/features/layout/components/page";
import {notFound} from "next/navigation";
import {db} from "@/db";
import * as drizzleDb from "@/db";
import {and, desc, eq, inArray, isNull, not} from "drizzle-orm";
import {Metadata} from "next";
import {AgentDialog} from "@/features/agents/components/agent-dialog";
import {currentUser} from "@/lib/auth/current-user";
import {User} from "@/db/schema/02_user";
import {env} from "@/env.mjs";
import {getOrganization} from "@/lib/auth/auth";

export const metadata: Metadata = {
    title: "Agents",
};

export default async function RoutePage(props: PageParams<{}>) {
    const user = (await currentUser()) as User;

    // Demo mode: show only the agents attached to the visitor's own org,
    // instead of the global (unassigned) ones.
    const isDemoUser = env.DEMO_ENABLED && user.isAnonymous === true;
    const activeOrg = isDemoUser ? await getOrganization({}) : null;

    const agents = await db.query.agent.findMany({
        where: and(
            not(eq(drizzleDb.schemas.agent.isArchived, true)),
            activeOrg
                ? inArray(
                      drizzleDb.schemas.agent.id,
                      db
                          .select({ id: drizzleDb.schemas.organizationAgent.agentId })
                          .from(drizzleDb.schemas.organizationAgent)
                          .where(
                              eq(
                                  drizzleDb.schemas.organizationAgent.organizationId,
                                  activeOrg.id,
                              ),
                          ),
                  )
                : isNull(drizzleDb.schemas.agent.organizationId),
        ),
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