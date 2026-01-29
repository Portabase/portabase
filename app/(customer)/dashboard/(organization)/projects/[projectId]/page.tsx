import {PageParams} from "@/types/next";
import {Page, PageContent, PageTitle} from "@/features/layout/page";
import {
    ButtonDeleteProject
} from "@/components/wrappers/dashboard/projects/button-delete-project/button-delete-project";
import {CardsWithPagination} from "@/components/wrappers/common/cards-with-pagination";
import {ProjectDatabaseCard} from "@/components/wrappers/dashboard/projects/project-card/project-database-card";
import {notFound, redirect} from "next/navigation";

import {db} from "@/db";
import {eq} from "drizzle-orm";
import {getActiveMember, getOrganization} from "@/lib/auth/auth";
import * as drizzleDb from "@/db";
import {capitalizeFirstLetter} from "@/utils/text";
import {ProjectDialog} from "@/features/projects/components/project.dialog";
import {DatabaseWith} from "@/db/schema/07_database";
import {ProjectWith} from "@/db/schema/06_project";
import {isUuidv4} from "@/utils/verify-uuid";


export default async function RoutePage(props: PageParams<{
    projectId: string
}>) {
    const {
        projectId
    } = await props.params;

    if (!isUuidv4(projectId)) {
        notFound()
    }

    const organization = await getOrganization({});
    const activeMember = await getActiveMember()

    if (!organization) {
        notFound();
    }
    const org = await db.query.organization.findFirst({
        where: eq(drizzleDb.schemas.organization.slug, organization.slug),
    });

    if (!org) notFound();

    const proj = await db.query.project.findFirst({
        where: (proj, {
            and,
            eq,
            not
        }) => and(eq(proj.id, projectId), eq(proj.organizationId, org.id), not(eq(proj.isArchived, true))),
        with: {
            databases: true,
        },
    });

    if (!proj) {
        redirect("/dashboard/projects");
    }

    const availableDatabases = (
        await db.query.database.findMany({
            where: (db, {or, eq, isNull}) => or(isNull(db.projectId), eq(db.projectId, proj.id)),
            with: {
                agent: true,
                project: true,
                backups: true,
                restorations: true,
            },
            orderBy: (db, {desc}) => [desc(db.createdAt)],
        })
    ) as DatabaseWith[];

    const isMember = activeMember?.role === "member";

    return (
        <Page>
            <div className="justify-between gap-2 sm:flex">
                <PageTitle className="flex flex-col md:flex-row items-center justify-between w-full ">
                    <div className="min-w-full md:min-w-fit ">
                        {capitalizeFirstLetter(proj.name)}
                    </div>
                    {!isMember && (
                        <div className="flex items-center gap-2 md:justify-between w-full ">
                            <div className="flex items-center gap-2">
                                <ProjectDialog
                                    databases={availableDatabases}
                                    organization={org}
                                    project={proj as ProjectWith}
                                    isEdit={true}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <ButtonDeleteProject projectId={projectId} text={"Delete Project"}/>
                            </div>
                        </div>
                    )}
                </PageTitle>
            </div>
            <PageContent className="flex flex-col w-full h-full">
                {proj.databases.length > 0 ? (
                    <CardsWithPagination
                        data={proj.databases}
                        organizationSlug={organization.slug}
                        // @ts-ignore
                        cardItem={ProjectDatabaseCard}
                        cardsPerPage={6}
                        numberOfColumns={3}
                        extendedProps={proj}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-20">
                        <p className="text-lg font-medium">No databases found</p>
                        <p className="text-sm mt-2">You haven’t added any databases to this project yet.</p>
                    </div>
                )}
            </PageContent>
        </Page>
    );
}