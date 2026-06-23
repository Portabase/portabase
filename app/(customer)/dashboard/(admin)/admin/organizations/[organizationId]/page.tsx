import {notFound} from "next/navigation";
import {eq} from "drizzle-orm";
import {db} from "@/db";
import * as drizzleDb from "@/db";
import {PageParams} from "@/types/next";
import {Page} from "@/features/layout/components/page";
import {OrganizationManagement} from "@/features/organizations/components/admin-organization-management";
import {buildOrganizationWithMembers} from "@/utils/common";
import {isUUID} from "@/utils/text";
import {user} from "@/db/schema/02_user";
import {invitation} from "@/db/schema/05_invitation";
import {member} from "@/db/schema/04_member";
import {organization} from "@/db/schema/03_organization";
import {user as drizzleUser} from "@/db/schema/02_user";


export default async function RoutePage(props: PageParams<{ organizationId: string }>) {
    const {organizationId} = await props.params;

    if (!organizationId) {
        return notFound();
    }

    if (!isUUID(organizationId)) {
        return notFound();
    }

    const users = await db.select().from(drizzleUser);

    const organizationData = await db
        .select({organization, member, user, invitation})
        .from(organization)
        .leftJoin(member, eq(drizzleDb.schemas.organization.id, member.organizationId))
        .leftJoin(invitation, eq(drizzleDb.schemas.invitation.id, invitation.organizationId))
        .leftJoin(user, eq(drizzleDb.schemas.member.userId, user.id))
        .where(eq(organization.id, organizationId));

    const formattedData = buildOrganizationWithMembers(organizationData);

    if (!formattedData) return notFound();

    return (
        <Page>
            <OrganizationManagement organization={formattedData} users={users}/>
        </Page>
    );
}
