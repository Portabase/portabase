"use client";

import {DataTable} from "@/components/common/data-table";
import {MemberWithUser, OrganizationWithMembers} from "@/db/schema/03_organization";
import {
    organizationMemberColumns
} from "@/features/organizations/components/member-columns";
import {useAcl} from "@/lib/acl/acl-context";
import type {GenericFilterConfig} from "@/components/common/filters/types";

const memberFiltersConfig: GenericFilterConfig[] = [
    {
        type: "role",
        label: "Role",
        options: [
            {value: "owner", label: "Owner"},
            {value: "admin", label: "Admin"},
            {value: "member", label: "Member"},
        ],
    },
];

interface SettingsOrganizationMembersTableProps {
    organization: OrganizationWithMembers
}

export const SettingsOrganizationMembersTable = ({organization}: SettingsOrganizationMembersTableProps) => {
    const {isDemoEnabled} = useAcl();
    return (
        <div className="flex flex-col h-full ">
            <div className=" h-full">
                <DataTable
                    columns={organizationMemberColumns(isDemoEnabled && organization.slug === "default")}
                    enableSelect={false}
                    data={organization.members as MemberWithUser[]}
                    filtersConfig={memberFiltersConfig}
                    searchKeys={["user.name", "user.email"]}
                    searchPlaceholder="Search by name or email"/>
            </div>
        </div>
    )
}