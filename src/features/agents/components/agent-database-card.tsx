"use client";

import { Database } from "@/db/schema/07_database";
import { DatabaseCard } from "@/components/common/database-card";
import { DatabaseDeleteButton } from "@/features/agents/components/database-delete-button";
import { DatabaseConfigModal } from "@/features/database/components/database-config-modal";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

export type AgentDatabaseCardProps = {
    data: Database;
    canDeleteDatabases?: boolean;
    agentLastContact?: Date | string | null;
};

export const AgentDatabaseCard = (props: AgentDatabaseCardProps) => {
    const { data: database, canDeleteDatabases = false, agentLastContact } = props;

    return (
        <DatabaseCard
            withDetails={false}
            data={database}
            configureButton={
                database.agentId ? (
                    <DatabaseConfigModal
                        agentId={database.agentId}
                        database={database}
                        trigger={
                            <Button variant="outline" size="icon" onClick={(e) => e.stopPropagation()}>
                                <Settings className="h-4 w-4" />
                            </Button>
                        }
                    />
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
