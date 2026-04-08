import { PageParams } from "@/types/next";
import {
  Page,
  PageContent,
  PageDescription,
  PageTitle,
} from "@/features/layout/page";
import { db } from "@/db";
import * as drizzleDb from "@/db";
import {eq, isNull} from "drizzle-orm";
import { notFound } from "next/navigation";
import { ButtonDeleteAgent } from "@/components/wrappers/dashboard/agent/button-delete-agent/button-delete-agent";
import { capitalizeFirstLetter } from "@/utils/text";
import { generateEdgeKey } from "@/utils/edge_key";
import { getServerUrl } from "@/utils/get-server-url";
import { AgentContentPage } from "@/components/wrappers/dashboard/agent/agent-content";
import { AgentDialog } from "@/features/agents/components/agent.dialog";


export default async function RoutePage(
  props: PageParams<{ agentId: string }>,
) {
  const { agentId } = await props.params;

  const agent = await db.query.agent.findFirst({
    where: eq(drizzleDb.schemas.agent.id, agentId),
    with: {
      databases: true,
      organizations: true,
    },
  });

  const organizations = await db.query.organization.findMany({
    where: (fields) => isNull(fields.deletedAt),
    with: {
      members: true,
    },
  });


  if (!agent) {
    notFound();
  }

  const isOwnerByAnOrganization = agent.organizationId

  if (isOwnerByAnOrganization){
    notFound();
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
              <AgentDialog
                agent={agent}
                typeTrigger={"edit"}
                adminView={true}
                organizations={organizations}
              />
            </div>
            <div className="flex items-center gap-2">
              <ButtonDeleteAgent agentId={agentId} text={"Delete Agent"} />
            </div>
          </div>
        </PageTitle>
      </div>

      {agent.description && (
        <PageDescription className="mt-5 sm:mt-0">
          {agent.description}
        </PageDescription>
      )}
      <PageContent className="flex flex-col w-full h-full justify-between gap-6">
        <AgentContentPage agent={agent} edgeKey={edgeKey} />
      </PageContent>
    </Page>
  );
}
