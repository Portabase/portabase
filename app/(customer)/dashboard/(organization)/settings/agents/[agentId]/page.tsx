import {PageParams} from "@/types/next";
import {
    Page,
    PageContent,
    PageDescription,
    PageTitle,
} from "@/features/layout/page";
import {db} from "@/db";
import * as drizzleDb from "@/db";
import {eq} from "drizzle-orm";
import {notFound} from "next/navigation";
import {ButtonDeleteAgent} from "@/components/wrappers/dashboard/agent/button-delete-agent/button-delete-agent";
import {capitalizeFirstLetter} from "@/utils/text";
import {generateEdgeKey} from "@/utils/edge_key";
import {getServerUrl} from "@/utils/get-server-url";
import {AgentContentPage} from "@/components/wrappers/dashboard/agent/agent-content";
import {AgentDialog} from "@/features/agents/components/agent.dialog";
import {getActiveMember, getOrganization} from "@/lib/auth/auth";
import {currentUser} from "@/lib/auth/current-user";
import {computeOrganizationPermissions} from "@/lib/acl/organization-acl";


export default async function RoutePage(
    props: PageParams<{ agentId: string }>,
) {
    const {agentId} = await props.params;

    const organization = await getOrganization({});
    const user = await currentUser();
    const activeMember = await getActiveMember();

    if (!organization || !activeMember || !user) {
        notFound();
    }

    const {canManageAgents} = computeOrganizationPermissions(activeMember);

    if (!canManageAgents){
        notFound();
    }

    const agent = await db.query.agent.findFirst({
        where: eq(drizzleDb.schemas.agent.id, agentId),
        with: {
            databases: true,
            organizations: true,
        },
    });


    if (!agent) {
        notFound();
    }

    const hasAccess =
        agent.organizationId === organization.id ||
        agent.organizations.some(org => org.organizationId === organization.id);

    if (!hasAccess) {
        notFound();
    }

    const isOwned = agent.organizationId
    const edgeKey = await generateEdgeKey(getServerUrl(), agent.id);

    return (
        <Page>
            <div className="justify-between gap-2 sm:flex">
                <PageTitle className="flex flex-col md:flex-row items-center justify-between w-full ">
                    <div className="min-w-full md:min-w-fit ">
                        {capitalizeFirstLetter(agent.name)}
                    </div>
                    {isOwned && (
                        <div className="flex items-center gap-2 md:justify-between w-full ">
                            <div className="flex items-center gap-2">
                                <AgentDialog
                                    agent={agent}
                                    typeTrigger={"edit"}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <ButtonDeleteAgent organizationId={organization.id ?? null} agentId={agentId} text={"Delete Agent"}/>
                            </div>

                        </div>
                    )}
                </PageTitle>
            </div>

            {agent.description && (
                <PageDescription className="mt-5 sm:mt-0">
                    {agent.description}
                </PageDescription>
            )}
            <PageContent className="flex flex-col w-full h-full justify-between gap-6">
                <AgentContentPage agent={agent} edgeKey={edgeKey}/>
            </PageContent>
        </Page>
    );
}
