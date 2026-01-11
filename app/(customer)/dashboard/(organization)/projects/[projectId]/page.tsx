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
import {RetentionPolicySheet} from "@/components/wrappers/dashboard/database/retention-policy/retention-policy-sheet";
import {CronButton} from "@/components/wrappers/dashboard/database/cron-button/cron-button";
import {AlertPolicyModal} from "@/components/wrappers/dashboard/database/alert-policy/alert-policy-modal";
import {ImportModal} from "@/components/wrappers/dashboard/database/import/import-modal";
import {BackupButton} from "@/components/wrappers/dashboard/backup/backup-button/backup-button";

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
                <PageTitle className="flex flex-col md:flex-row items-center justify-between w-full ">
                    <div className="min-w-full md:min-w-fit ">
                        {capitalizeFirstLetter(proj.name)}
                    </div>
                    {!isMember && (
                        <div className="flex items-center gap-2 md:justify-between w-full ">
                            <div className="flex items-center gap-2">
                                <Link className={buttonVariants({variant: "outline"})}
                                      href={`/dashboard/projects/${proj.id}/edit`}>
                                    <GearIcon className="w-7 h-7"/>
                                </Link>
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
