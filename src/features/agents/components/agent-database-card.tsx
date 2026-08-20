"use client";

import { Database } from "@/db/schema/07_database";
import { DatabaseCard } from "@/components/common/database-card";
import { DatabaseDeleteButton } from "@/features/agents/components/database-delete-button";
import { DatabaseConfigModal } from "@/features/database/components/database-config-modal";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    MIN_DATABASE_CONFIG_AGENT_VERSION,
} from "@/features/agents/utils/version";

export type AgentDatabaseCardProps = {
    data: Database;
    canDeleteDatabases?: boolean;
    canConfigureDatabases?: boolean;
    agentLastContact?: Date | string | null;
};

export const AgentDatabaseCard = (props: AgentDatabaseCardProps) => {
    const {
        data: database,
        canDeleteDatabases = false,
        canConfigureDatabases = true,
        agentLastContact,
    } = props;

    return (
        <DatabaseCard
            withDetails={false}
            data={database}
            configureButton={
                canDeleteDatabases && database.agentId ? (
                    canConfigureDatabases ? (
                        <DatabaseConfigModal
                            agentId={database.agentId}
                            database={database}
                            trigger={
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Settings className="h-4 w-4" />
                                </Button>
                            }
                        />
                    ) : (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            disabled
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Settings className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{`Requires agent version ${MIN_DATABASE_CONFIG_AGENT_VERSION} or newer.`}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )
                ) : undefined
            }
            deleteButton={
                canDeleteDatabases && database.agentId ? (
                    <DatabaseDeleteButton
                        databaseId={database.id}
                        databaseName={database.name}
                        agentId={database.agentId}
                        agentLastContact={agentLastContact}
                    />
                ) : undefined
            }
        />
    );
};
