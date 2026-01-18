import {MemberWithUser} from "@/db/schema/03_organization";


export type OrganizationPermissions = {
    role: string | null;
    isOwner: boolean;
    isAdmin: boolean;
    isMember: boolean;

    canManageSettings: boolean;
    canManageUsers: boolean;
    canManageNotifications: boolean;
    canManageStorages: boolean;
    canManageDangerZone: boolean;
};


export const computeOrganizationPermissions = (
    activeMember: MemberWithUser | null
): OrganizationPermissions => {
    const role = activeMember?.role ?? null;

    const isOwner = role === "owner";
    const isAdmin = role === "admin";
    const isMember = role === "member";

    return {
        role,
        isOwner,
        isAdmin,
        isMember,

        canManageSettings: isOwner || isAdmin,
        canManageUsers: isOwner || isAdmin,
        canManageNotifications: isOwner || isAdmin,
        canManageStorages: isOwner || isAdmin,
        canManageDangerZone: isOwner,
    };
};
