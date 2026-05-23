"use client";

import {Database} from "@/db/schema/07_database";
import {DatabaseCard} from "@/components/wrappers/dashboard/projects/project-card/project-database-card";

export type agentDatabaseCardProps = {
    data: Database;
};

export const AgentDatabaseCard = (props: agentDatabaseCardProps) => {
    const {data: database} = props;

    return <DatabaseCard withDetails={false} data={database}/>;

    //Todo: Add again when impersonation system will be implemented
   /* if (!database.projectId) {
         return <DatabaseCard data={database}/>;
    }

    return (
        <Link className="group block transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
              href={`/dashboard/projects/${database.projectId}/database/${database.id}`}>
            <DatabaseCard data={database}/>
        </Link>
    );*/
};
