"use client";

import { computeOrganizationPermissions } from "@/lib/acl/organization-acl";
import {MemberWithUser} from "@/db/schema/03_organization";

export const useOrganizationPermissions = (
	activeMember: MemberWithUser | null,
) => {
	return computeOrganizationPermissions(activeMember);
};
