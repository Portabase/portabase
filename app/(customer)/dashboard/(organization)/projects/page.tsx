import {PageParams} from "@/types/next";
import {CardsWithPagination} from "@/components/wrappers/common/cards-with-pagination";
import {Page, PageActions, PageContent, PageHeader, PageTitle} from "@/features/layout/page";
import {ProjectCard} from "@/components/wrappers/dashboard/projects/project-card/project-card";
import {db} from "@/db";
import {notFound} from "next/navigation";
import {getActiveMember, getOrganization} from "@/lib/auth/auth";
import {EmptyStatePlaceholder} from "@/components/wrappers/common/empty-state-placeholder";
import {Metadata} from "next";
import {ProjectDialog} from "@/features/projects/components/project.dialog";
import {DatabaseWith} from "@/db/schema/07_database";

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

    const availableDatabases = (
        await db.query.database.findMany({
            where: (db, {isNull}) => isNull(db.projectId),
            with: {
                agent: true,
                project: true,
                backups: true,
                restorations: true,
            },
            orderBy: (db, {desc}) => [desc(db.createdAt)],
        })
    ).filter((db) => db.project == null) as DatabaseWith[];


    return (
        <Page>
            <PageHeader>
                <PageTitle>Projects</PageTitle>
                {(projects.length > 0 && !isMember) && (
                    <PageActions>
                        <ProjectDialog databases={availableDatabases} organization={organization}/>
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
                    <ProjectDialog databases={availableDatabases} organization={organization} isEmpty={true}/>
                )}
            </PageContent>
        </Page>
    );
}