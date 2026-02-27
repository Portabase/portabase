import {PageParams} from "@/types/next";
import {Page, PageActions, PageContent, PageHeader, PageTitle} from "@/features/layout/page";
import {db} from "@/db";
import {desc, isNull} from "drizzle-orm";
import {AdminUserList} from "@/components/wrappers/dashboard/admin/users/admin-user-list";
import {AdminUserAddModal} from "@/components/wrappers/dashboard/admin/users/admin-user-add-modal";
import {SUPPORTED_PROVIDERS} from "@/lib/auth/config";

export default async function RoutePage(props: PageParams<{}>) {

    const users = await db.query.user.findMany({
        where: (fields) => isNull(fields.deletedAt),
        with: {
            accounts: true
        },
        orderBy: (fields) => desc(fields.createdAt),

    });
    const organizations = await db.query.organization.findMany({
        with: {
            members: true,
        },
    });

    const credentialProvider = SUPPORTED_PROVIDERS.find(p => p.id === 'credential');
    const isPasswordAuthEnabled = credentialProvider?.isActive || false;

    return (
        <Page>
            <PageHeader className="flex flex-col">
                <div className="flex justify-between">
                    <PageTitle className="mb-3">Active users</PageTitle>
                    <PageActions>
                        <AdminUserAddModal organizations={organizations}/>
                    </PageActions>
                </div>
            </PageHeader>
            <PageContent className="flex flex-col gap-5">
                <AdminUserList users={users} isPasswordAuthEnabled={isPasswordAuthEnabled}/>
            </PageContent>
        </Page>
    );
}


