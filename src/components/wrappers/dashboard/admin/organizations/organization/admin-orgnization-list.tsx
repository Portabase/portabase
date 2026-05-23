"use client"
import { DataTable } from "@/components/common/data-table";
import { organizationsListColumns } from "@/components/wrappers/dashboard/admin/organizations/organization/table-colums";
import {OrganizationWithMembers} from "@/db/schema/03_organization";

type AdminOrganizationListProps = {
    organizations: OrganizationWithMembers[];
};

export const AdminOrganizationList = ({ organizations }: AdminOrganizationListProps) => {
    return <DataTable columns={organizationsListColumns()} data={organizations} enablePagination={true} enableSelect={false} />;
};
