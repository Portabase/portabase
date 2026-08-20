"use client";
import type {AppColumnDef as ColumnDef} from "@/components/common/table-features";
import {ButtonDeleteOrganization} from "@/features/organizations/components/admin-organization-delete-button";
import Link from "next/link";
import {Settings} from "lucide-react";
import {buttonVariants} from "@/components/ui/button";
import {OrganizationWithMembers} from "@/db/schema/03_organization";
import {getOrganizationDisplayName} from "@/features/organizations/utils/get-organization-display-name";

export function organizationsListColumns(): ColumnDef<OrganizationWithMembers>[] {

    return [
        {
            accessorKey: "name",
            header: "Name",
            cell: ({row}) => {
                return <div>{getOrganizationDisplayName(row.original)}</div>;
            },
        },
        {
            accessorKey: "members",
            header: "Members",
            cell: ({row}) => {
                const membersCount = row.original.members?.length;
                return <div className="flex items-center gap-3">{membersCount}</div>;
            },
        },
        {
            header: "Actions",
            id: "actions",
            cell: ({row}) => {
                const isDefaultOrganization = row.original.slug == "default";
                return (
                    <div className="flex items-center gap-3">
                        {!isDefaultOrganization && (
                            <ButtonDeleteOrganization organisationId={row.original.id}/>
                        )}
                        <Link className={buttonVariants({variant: "outline"})}
                              href={`organizations/${row.original.id}`}>
                            <Settings/>
                        </Link>
                    </div>
                );
            },
        },
    ];
}
