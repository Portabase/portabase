"use client";

import {Database} from "@/db/schema/07_database";
import {DatabaseCard} from "@/features/projects/project-database-card";

export type agentDatabaseCardProps = {
    data: Database;
};

export const AgentDatabaseCard = (props: agentDatabaseCardProps) => {
    const {data: database} = props;

    return <DatabaseCard withDetails={false} data={database}/>;
};
