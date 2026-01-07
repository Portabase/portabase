import Link from "next/link";

import {PageParams} from "@/types/next";
import {CardsWithPagination} from "@/components/wrappers/common/cards-with-pagination";
import {Button} from "@/components/ui/button";
import {Page, PageActions, PageContent, PageHeader, PageTitle} from "@/features/layout/page";
import {ProjectCard} from "@/components/wrappers/dashboard/projects/project-card/project-card";
import {db} from "@/db";
import {notFound} from "next/navigation";
import {getActiveMember, getOrganization} from "@/lib/auth/auth";
import {EmptyStatePlaceholder} from "@/components/wrappers/common/empty-state-placeholder";
import {Metadata} from "next";

export const metadata: Metadata = {
    title: "Projects",
};

export default async function RoutePage(props: PageParams<{}>) {

    const organization = await getOrganization({});
    const activeMember = await getActiveMember()

    if (!organization) {
        notFound();
    }

    const projects = await db.query.project.findMany({
        where: (project, {
            eq,
            and,
            not
        }) => and(eq(project.organizationId, organization.id), not(eq(project.isArchived, true))),
        with: {
            databases: true,
        },
    });
    const isMember = activeMember?.role === "member";


    return (
        <Page>
            <PageHeader>
                <PageTitle>Projects</PageTitle>
                {(projects.length > 0 && !isMember) && (
                    <PageActions>
                        <Link href={`/dashboard/projects/new`}>
                            <Button>+ Create Project</Button>
                        </Link>
                    </PageActions>
                )}
            </PageHeader>

            <PageContent>
                {projects.length > 0 ? (
                    <CardsWithPagination
                        organizationSlug={organization.slug}
                        data={projects}
                        cardItem={ProjectCard}
                        cardsPerPage={6}
                        numberOfColumns={3}
                    />
                ) : isMember ? (
                    <EmptyStatePlaceholder text="No project available"/>
                ) : (
                    <EmptyStatePlaceholder url="/dashboard/projects/new" text="Create new Project"/>
                )}
            </PageContent>
        </Page>
    );
}
