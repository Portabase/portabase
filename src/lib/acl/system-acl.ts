import type { SystemRole } from "@/lib/acl/role";
import {User} from "@/db/schema/02_user";

export type SystemPermissions = {
	role: SystemRole | null;

	isSuperAdmin: boolean;
	isAdmin: boolean;
	isUser: boolean;

	canAccessSystem: boolean;

	canCreateUser: boolean;
	canUpdateUser: boolean;
	canDeleteUser: boolean;

	canAssignSuperAdmin: boolean;
	canAssignAdmin: boolean;
	canAssignUser: boolean;

	canCreateOrganization: boolean;
	canDeleteOrganization: boolean;
	canUpdateOrganization: boolean;

	canManageOrganizationUsers: boolean;
};

export const computeSystemPermissions = (
	user: User | null,
): SystemPermissions => {
	const role = (user?.role as SystemRole) ?? null;

	const isSuperAdmin = role === "superadmin";
	const isAdmin = role === "admin";
	const isUser = role === "user";

	return {
		role,

		isSuperAdmin,
		isAdmin,
		isUser,

		canAccessSystem: isSuperAdmin,

		canCreateUser: isSuperAdmin || isAdmin,
		canUpdateUser: isSuperAdmin || isAdmin,
		canDeleteUser: isSuperAdmin || isAdmin,

		canAssignSuperAdmin: isSuperAdmin,
		canAssignAdmin: isSuperAdmin || isAdmin,
		canAssignUser: isSuperAdmin || isAdmin,

		canCreateOrganization: isSuperAdmin,
		canDeleteOrganization: isSuperAdmin,
		canUpdateOrganization: isSuperAdmin || isAdmin,

		canManageOrganizationUsers: isSuperAdmin || isAdmin,
	};
};
