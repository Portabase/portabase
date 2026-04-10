import {OrganizationWithMembers} from "@/db/schema/03_organization";
import {cn} from "@/lib/utils";
import {Agent} from "@/db/schema/08_agent";
import {CardsWithPagination} from "@/components/wrappers/common/cards-with-pagination";
import {AgentCard} from "@/components/wrappers/dashboard/agent/agent-card/agent-card";
import {AgentDialog} from "@/features/agents/components/agent.dialog";

export type OrganizationAgentsTabProps = {
    organization: OrganizationWithMembers;
    agents: Agent[];
};

export const OrganizationAgentsTab = ({
                                             organization,
                                             agents,
                                         }: OrganizationAgentsTabProps) => {

    const hasAgent = agents.length > 0;
    return (
        <div className="flex flex-col gap-y-6 h-full py-4">
            <div className="h-full flex flex-col gap-y-6">
                <div className={cn("hidden flex-row justify-between items-start", hasAgent && "flex")}>
                    <div className="max-w-2xl ">
                        <h3 className="text-xl font-semibold text-balance mb-1">
                            Agent Settings
                        </h3>
                    </div>
                    <AgentDialog organization={organization} typeTrigger="create"/>
                </div>
                {hasAgent ? (
                    <CardsWithPagination data={agents} organizationView={true} cardItem={AgentCard} cardsPerPage={4} numberOfColumns={1}/>
                ) : (
                    <AgentDialog organization={organization} typeTrigger="empty"/>
                )}
            </div>
        </div>
    );
};