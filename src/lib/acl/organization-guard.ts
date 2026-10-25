import "server-only";
import {User} from "@/db/schema/02_user";
import {getActiveMember, getOrganization} from "@/lib/auth/auth";
import {computeOrganizationPermissions, type OrganizationPermissions} from "@/lib/acl/organization-acl";
import {computeSystemPermissions} from "@/lib/acl/system-acl";
import {ActionError} from "@/lib/safe-actions/actions";

export async function assertCanManageOrganization(
    user: User,
    organizationId: string | null | undefined,
    capability: keyof OrganizationPermissions = "canManageSettings",
) {
    const {isSuperAdmin, isAdmin} = computeSystemPermissions(user);
    if (isSuperAdmin || isAdmin) return;
    const organization = organizationId ? await getOrganization({}) : null;
    const activeMember = organization ? await getActiveMember() : null;
    if (
        !organization ||
        organization.id !== organizationId ||
        !activeMember ||
        !computeOrganizationPermissions(activeMember)[capability]
    ) {
        throw new ActionError("You are not allowed to perform this action");
    }
}
