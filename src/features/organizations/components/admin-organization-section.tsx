"use client";

import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminOrganizationList } from "@/features/organizations/components/admin-organization-list";
import { AdminOrganizationAddModal } from "@/features/organizations/components/admin-organization-add-modal";
import {OrganizationWithMembers} from "@/db/schema/03_organization";

type AdminOrganizationSectionProps = {
    organizations: OrganizationWithMembers[];
};

export const AdminOrganizationSection = ({ organizations }: AdminOrganizationSectionProps) => {

    return (
        <Card>
            <CardHeader>
                <CardTitle>Add a new organization</CardTitle>
                <CardAction>
                    <AdminOrganizationAddModal />
                </CardAction>
            </CardHeader>
            <CardContent>
                <AdminOrganizationList organizations={organizations} />
            </CardContent>
        </Card>
    );
};
