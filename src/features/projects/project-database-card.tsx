"use client";

import Link from "next/link";
import {Database} from "@/db/schema/07_database";
import {DatabaseCard} from "@/components/common/database-card";

export type projectDatabaseCardProps = {
    data: Database;
    extendedProps: { id: string };
    organizationSlug: string;
};

export const ProjectDatabaseCard = (props: projectDatabaseCardProps) => {
    const {data: database, extendedProps} = props;

    return (
        <Link
            className="group block transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
            href={`/dashboard/projects/${extendedProps.id}/database/${database.id}`}>
            <DatabaseCard data={database}/>
        </Link>
    );
};
