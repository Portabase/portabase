import {MemberWithUser, Organization, OrganizationWithMembersAndUsers} from "@/db/schema/03_organization";
import {OrganizationMember} from "@/db/schema/04_member";
import {OrganizationInvitation} from "@/db/schema/05_invitation";
import {User} from "@/db/schema/02_user";


export function buildOrganizationWithMembers(
    rows: {
        organization: Organization;
        member: OrganizationMember | null;
        invitation: OrganizationInvitation | null;
        user: User | null;
    }[]
): OrganizationWithMembersAndUsers | null {
    if (rows.length === 0) return null;

    const org = rows[0].organization;


    const invitations: OrganizationInvitation[] = rows
        .filter(r => r.invitation)
        .map(r => ({
            ...r.invitation!,
        }));

    const members: MemberWithUser[] = rows
        .filter(r => r.member && r.user)
        .map(r => ({
            ...r.member!,
            user: r.user!,
        }));

    return {
        ...org,
        invitations,
        members,
    };
}


export function getFileExtension(dbType: string) {
    switch (dbType) {
        case "postgresql":
            return ".dump";
        case "mysql":
            return ".sql";
        default:
            return ".dump";
    }
}

export function getFileHeadersBasedOnDbms(dbType: string): Record<string, string[]> {
    switch (dbType) {
        case "postgresql":
            return {
                "application/octet-stream": [".dump"],
            };
        case "mysql":
        case "mariadb":
            return {
                "application/sql": [".sql"],
                "application/x-sql": [".sql"],
            };
        case "mongodb":
            return {
                "application/gzip": [".archive.gz"],
            };
        case "firebird":
            return {
                "application/octet-stream": [".fbk"],
            };
        case "valkey":
        case "redis":
            return {
                "application/octet-stream": [".rdb"],
            };
        case "sqlite":
            return {
                "application/octet-stream": [".backup"],
            };
        default:
            return {};
    }
}
