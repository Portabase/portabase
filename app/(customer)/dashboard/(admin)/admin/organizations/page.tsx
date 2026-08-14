import {PageParams} from "@/types/next";
import {Page, PageActions, PageContent, PageHeader, PageTitle} from "@/features/layout/components/page";
import {db} from "@/db";
import * as drizzleDb from "@/db";
import {
    AdminOrganizationAddModal
} from "@/features/organizations/components/admin-organization-add-modal";
import {AdminOrganizationList} from "@/features/organizations/components/admin-organization-list";
import {and, eq, isNull} from "drizzle-orm";
import {currentUser} from "@/lib/auth/current-user";
import {User} from "@/db/schema/02_user";
import {env} from "@/env.mjs";

export default async function RoutePage(props: PageParams<{}>) {
    const user = (await currentUser()) as User;

    // Demo mode: the visitor only ever sees their own organization.
    const isDemoUser = env.DEMO_ENABLED && user.isAnonymous === true;

    const organizations = await db.query.organization.findMany({
        where: (fields, {inArray}) =>
            isDemoUser
                ? and(
                      isNull(fields.deletedAt),
                      inArray(
                          fields.id,
                          db
                              .select({ id: drizzleDb.schemas.member.organizationId })
                              .from(drizzleDb.schemas.member)
                              .where(eq(drizzleDb.schemas.member.userId, user.id)),
                      ),
                  )
                : isNull(fields.deletedAt),
        with: {
            members: true,
        },
    });


    return (
        <Page>
            <PageHeader className="flex flex-col">
                <div className="flex justify-between">
                    <PageTitle className="mb-3">Active organizations</PageTitle>
                    <PageActions>
                        <AdminOrganizationAddModal/>
                    </PageActions>
                </div>
            </PageHeader>
            <PageContent className="flex flex-col gap-5">
                <AdminOrganizationList organizations={organizations}/>
            </PageContent>
        </Page>
    );
}
