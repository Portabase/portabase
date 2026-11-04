import {OrganizationWithMembers} from "@/db/schema/03_organization";
import {cn} from "@/lib/utils";
import {Agent} from "@/db/schema/08_agent";
import {AgentList} from "@/features/agents/components/agent-list";
import {AgentDialog} from "@/features/agents/components/agent-dialog";

export type OrganizationAgentsTabProps = {
    organization: OrganizationWithMembers;
    agents: Agent[];
    serverNow: number;
};

export const OrganizationAgentsTab = ({
                                             organization,
                                             agents,
                                             serverNow,
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
                    <AgentList agents={agents} organizationView serverNow={serverNow}/>
                ) : (
                    <AgentDialog organization={organization} typeTrigger="empty"/>
                )}
            </div>
        </div>
    );
};