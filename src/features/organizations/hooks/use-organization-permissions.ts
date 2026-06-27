"use client";

import {MemberWithUser} from "@/db/schema/03_organization";
import {computeOrganizationPermissions} from "@/lib/acl/organization-acl";

export const useOrganizationPermissions = (activeMember: MemberWithUser | null) => {
    return computeOrganizationPermissions(activeMember);
};
