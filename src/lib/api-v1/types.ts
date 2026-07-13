import {SystemPermissions} from "@/lib/acl/system-acl";
import {OrganizationPermissions} from "@/lib/acl/organization-acl";

export type ApiKeyContextUser = {
        id: string;
        permissions: SystemPermissions;
};

export type ApiKeyContextOrganizations = {
    id: string;
    permissions: OrganizationPermissions
}[];

export type ApiKeyContext = {
    user: ApiKeyContextUser;
    organizations: ApiKeyContextOrganizations
};