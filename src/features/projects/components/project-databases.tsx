"use client";

import {useQuery} from "@tanstack/react-query";
import {CardsWithPagination} from "@/components/common/cards-with-pagination";
import type {GenericFilterConfig} from "@/components/common/filters/types";
import {getProjectDatabasesAction} from "@/features/projects/actions/project-databases.action";
import {ProjectDatabaseCard} from "@/features/projects/components/project-database-card";
import {ProjectDatabaseSelection} from "@/features/projects/components/project-database-selection";
import type {ProjectDatabase} from "@/features/projects/utils/project-databases";

export type ProjectDatabasesProps = {
    projectId: string;
    organizationSlug: string;
    isMember: boolean;
    databases: ProjectDatabase[];
    filtersConfig: GenericFilterConfig[];
};

export const ProjectDatabases = ({projectId, organizationSlug, isMember, databases: initialDatabases, filtersConfig}: ProjectDatabasesProps) => {
    const {data: databases} = useQuery({
        queryKey: ["project-databases", projectId],
        queryFn: async () => {
            const result = await getProjectDatabasesAction({projectId});
            if (!result?.data) throw new Error(result?.serverError ?? "Failed to load the project databases.");
            return result.data;
        },
        initialData: initialDatabases,
        staleTime: 0,
        gcTime: 0,
        refetchInterval: 4000,
    });

    if (!isMember) {
        return <ProjectDatabaseSelection projectId={projectId} databases={databases} filtersConfig={filtersConfig}/>;
    }

    return (
        <CardsWithPagination
            data={[...databases].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())}
            organizationSlug={organizationSlug}
            // @ts-expect-error
            cardItem={ProjectDatabaseCard}
            cardsPerPage={20}
            numberOfColumns={3}
            pageSizeOptions={[10, 20, 50]}
            extendedProps={{id: projectId}}
            filtersConfig={filtersConfig}
            searchKeys={["name"]}
            searchPlaceholder="Search by name"
        />
    );
};
