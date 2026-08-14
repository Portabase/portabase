import {PageParams} from "@/types/next";
import {Page, PageActions, PageContent, PageHeader, PageTitle} from "@/features/layout/components/page";
import {db} from "@/db";
import * as drizzleDb from "@/db";
import {desc, isNull} from "drizzle-orm";
import {AdminUserList} from "@/features/users/components/admin-user-list";
import {AdminUserAddModal} from "@/features/users/components/admin-user-add-modal";
import {SUPPORTED_PROVIDERS} from "@/lib/auth/config";
import {getSettings} from "@/db/services/setting";
import {resolveAvatarUrl} from "@/utils/resolve-avatar-url";
import {currentUser} from "@/lib/auth/current-user";
import {computeSystemPermissions} from "@/lib/acl/system-acl";
import {User} from "@/db/schema/02_user";
import {and, eq} from "drizzle-orm";
import {env} from "@/env.mjs";

export default async function RoutePage(props: PageParams<{}>) {
    const user = (await currentUser()) as User;

    // Demo mode: the visitor only ever sees their own account, never anyone else.
    const isDemoUser = env.DEMO_ENABLED && user.isAnonymous === true;

    const [settings, users] = await Promise.all([
        getSettings(),
        db.query.user.findMany({
            where: (fields) =>
                isDemoUser
                    ? and(isNull(fields.deletedAt), eq(fields.id, user.id))
                    : isNull(fields.deletedAt),
            with: { accounts: true },
            orderBy: (fields) => desc(fields.createdAt),
        }),
    ]);

    const avatarUrls = Object.fromEntries(
        users.map((u) => [u.id, resolveAvatarUrl(u)])
    );

    const organizations = await db.query.organization.findMany({
        where: isDemoUser
            ? (fields, { inArray }) =>
                  inArray(
                      fields.id,
                      db
                          .select({ id: drizzleDb.schemas.member.organizationId })
                          .from(drizzleDb.schemas.member)
                          .where(eq(drizzleDb.schemas.member.userId, user.id)),
                  )
            : undefined,
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


