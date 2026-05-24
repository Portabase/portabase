"use client"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {OrganizationWithMembers} from "@/db/schema/03_organization";
import {AdminOrganizationList} from "@/features/organizations/admin-organization-list";

export type AdminOrganizationsTableProps = {
    organizations: OrganizationWithMembers[];

};

export const AdminOrganizationsTable = (props: AdminOrganizationsTableProps) => {
    const {organizations} = props;
    return (
        <div className="flex flex-col gap-y-4 h-full py-4 ">
            <Card className="h-full">
                <CardHeader>
                    <CardTitle>Active organizations</CardTitle>
                    <CardDescription>Manage all system organizations</CardDescription>
                </CardHeader>
                <CardContent className="h-full">
                    <AdminOrganizationList organizations={organizations} />
                </CardContent>
            </Card>
        </div>
    );
};
