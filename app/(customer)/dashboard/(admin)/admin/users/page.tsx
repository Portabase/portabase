import {PageParams} from "@/types/next";
import {Page, PageActions, PageContent, PageHeader, PageTitle} from "@/features/layout/components/page";
import {db} from "@/db";
import {desc, isNull} from "drizzle-orm";
import {AdminUserList} from "@/features/users/components/admin-user-list";
import {AdminUserAddModal} from "@/features/users/components/admin-user-add-modal";
import {SUPPORTED_PROVIDERS} from "@/lib/auth/config";
import {getSettings} from "@/db/services/setting";
import {resolveAvatarUrl} from "@/utils/resolve-avatar-url";
import {currentUser} from "@/lib/auth/current-user";
import {computeSystemPermissions} from "@/lib/acl/system-acl";
import {User} from "@/db/schema/02_user";

export default async function RoutePage(props: PageParams<{}>) {
    const user = (await currentUser()) as User;

    const [settings, users] = await Promise.all([
        getSettings(),
        db.query.user.findMany({
            where: (fields) => isNull(fields.deletedAt),
            with: { accounts: true },
            orderBy: (fields) => desc(fields.createdAt),
        }),
    ]);

    const avatarUrls = Object.fromEntries(
        users.map((u) => [u.id, resolveAvatarUrl(u)])
    );

    const organizations = await db.query.organization.findMany({
        with: {
            members: true,
        },
    });

    const credentialProvider = SUPPORTED_PROVIDERS.find(p => p.id === 'credential');
    const isPasswordAuthEnabled = credentialProvider?.isActive || false;

    const systemPermissions = computeSystemPermissions(user);

    return (
        <Page>
            <PageHeader className="flex flex-col">
                <div className="flex justify-between">
                    <PageTitle className="mb-3">Active users</PageTitle>
                    {systemPermissions.isSuperAdmin && (
                        <PageActions>
                            <AdminUserAddModal organizations={organizations}/>
                        </PageActions>
                    )}
                </div>
            </PageHeader>
            <PageContent className="flex flex-col gap-5">
                <AdminUserList users={users} isPasswordAuthEnabled={isPasswordAuthEnabled} avatarUrls={avatarUrls}/>
            </PageContent>
        </Page>
    );
}


