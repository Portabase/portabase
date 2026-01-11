import Link from "next/link";
import {GearIcon} from "@radix-ui/react-icons";
import {PageParams} from "@/types/next";
import {Page, PageActions, PageContent, PageDescription, PageTitle} from "@/features/layout/page";
import {buttonVariants} from "@/components/ui/button";
import {db} from "@/db";
import * as drizzleDb from "@/db";
import {eq} from "drizzle-orm";
import {notFound} from "next/navigation";
import {ButtonDeleteAgent} from "@/components/wrappers/dashboard/agent/button-delete-agent/button-delete-agent";
import {capitalizeFirstLetter} from "@/utils/text";
import {generateEdgeKey} from "@/utils/edge_key";
import {getServerUrl} from "@/utils/get-server-url";
import {AgentContentPage} from "@/components/wrappers/dashboard/agent/agent-content";

export default async function RoutePage(props: PageParams<{ agentId: string }>) {

    const {agentId} = await props.params

    const agent = await db.query.agent.findFirst({
        where: eq(drizzleDb.schemas.agent.id, agentId),
        with: {
            databases: true
        }
    })

    if (!agent) {
        notFound()
    }

    const edgeKey = await generateEdgeKey(getServerUrl(), agent.id);

    return (
        <Page>
            <div className="justify-between gap-2 sm:flex">
                <PageTitle className="flex flex-col md:flex-row items-center justify-between w-full ">
                    <div className="min-w-full md:min-w-fit ">
                        {capitalizeFirstLetter(agent.name)}
                    </div>
                        <div className="flex items-center gap-2 md:justify-between w-full ">
                            <div className="flex items-center gap-2">
                                <Link className={buttonVariants({variant: "outline"})}
                                      href={`/dashboard/agents/${agent.id}/edit`}>
                                    <GearIcon className="w-7 h-7"/>
                                </Link>
                            </div>
                            <div className="flex items-center gap-2">
                                <ButtonDeleteAgent agentId={agentId} text={"Delete Agent"}/>
                            </div>
                        </div>
                </PageTitle>
            </div>

            {agent.description && (
                <PageDescription className="mt-5 sm:mt-0">{agent.description}</PageDescription>
            )}
            <PageContent className="flex flex-col w-full h-full justify-between gap-6">
                <AgentContentPage
                    agent={agent}
                    edgeKey={edgeKey}
                />
            </PageContent>
        </Page>
    )
}