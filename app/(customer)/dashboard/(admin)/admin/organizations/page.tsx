import {PageParams} from "@/types/next";
import {Page, PageActions, PageContent, PageHeader, PageTitle} from "@/features/layout/components/page";
import {db} from "@/db";
import {
    AdminOrganizationAddModal
} from "@/features/organizations/components/admin-organization-add-modal";
import {AdminOrganizationList} from "@/features/organizations/components/admin-organization-list";
import {isNull} from "drizzle-orm";

export default async function RoutePage(props: PageParams<{}>) {

    const organizations = await db.query.organization.findMany({
        where: (fields) => isNull(fields.deletedAt),
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
