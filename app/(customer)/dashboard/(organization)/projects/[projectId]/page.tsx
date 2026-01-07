import {PageParams} from "@/types/next";
import {Page, PageActions, PageContent, PageDescription, PageTitle} from "@/features/layout/page";
import {buttonVariants} from "@/components/ui/button";
import {GearIcon} from "@radix-ui/react-icons";
import Link from "next/link";
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

export default async function RoutePage(props: PageParams<{
    projectId: string
}>) {
    const {
        projectId
    } = await props.params;

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

    const isMember = activeMember?.role === "member";

    return (
        <Page>
            <div className="justify-between gap-2 sm:flex">
                <PageTitle className="flex items-center">
                    {capitalizeFirstLetter(proj.name)}
                    {!isMember && (
                        <Link className={buttonVariants({variant: "outline"})}
                              href={`/dashboard/projects/${proj.id}/edit`}>
                            <GearIcon className="w-7 h-7"/>
                        </Link>
                    )}
                </PageTitle>
                {!isMember && (
                    <PageActions className="justify-between">
                        <ButtonDeleteProject projectId={projectId} text={"Delete Project"}/>
                    </PageActions>
                )}
            </div>
            <PageDescription>The list of associated databases</PageDescription>
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
