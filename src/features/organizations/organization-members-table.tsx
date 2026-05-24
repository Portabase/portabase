import {DataTable} from "@/components/common/data-table";
import {MemberWithUser, OrganizationWithMembers} from "@/db/schema/03_organization";
import {
    organizationMemberColumns
} from "@/features/organizations/member-columns";

interface SettingsOrganizationMembersTableProps {
    organization: OrganizationWithMembers
}

export const SettingsOrganizationMembersTable = ({organization}: SettingsOrganizationMembersTableProps) => {
    return (
        <div className="flex flex-col h-full ">
            <div className=" h-full">
                <DataTable
                    columns={organizationMemberColumns}
                    enableSelect={false}
                    data={organization.members as MemberWithUser[]}/>
            </div>
        </div>
    )
}