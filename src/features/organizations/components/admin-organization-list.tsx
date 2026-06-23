"use client"
import { DataTable } from "@/components/common/data-table";
import { organizationsListColumns } from "@/features/organizations/components/admin-org-columns";
import {OrganizationWithMembers} from "@/db/schema/03_organization";

type AdminOrganizationListProps = {
    organizations: OrganizationWithMembers[];
};

export const AdminOrganizationList = ({ organizations }: AdminOrganizationListProps) => {
    return <DataTable columns={organizationsListColumns()} data={organizations} enablePagination={true} enableSelect={false} />;
};
