"use client";
import { DataTable } from "@/components/common/data-table";
import {usersListColumns} from "@/features/users/components/user-columns";
import {User} from "@/db/schema/02_user";
import type {GenericFilterConfig} from "@/components/common/filters/types";
import {SYSTEM_ROLES} from "@/lib/acl/role";
import {capitalizeFirstLetter} from "@/utils/text";

type AdminUserListProps = {
    users: User[];
    isPasswordAuthEnabled: boolean;
    canSendEmail: boolean;
    avatarUrls?: Record<string, string | undefined>;
};

const userFiltersConfig: GenericFilterConfig[] = [
    {
        type: "role",
        label: "Role",
        options: SYSTEM_ROLES.map((role) => ({value: role, label: capitalizeFirstLetter(role)})),
    },
];

export const AdminUserList = ({ users, isPasswordAuthEnabled, canSendEmail, avatarUrls }: AdminUserListProps) => {
    return (
        <DataTable
            columns={usersListColumns({ isPasswordAuthEnabled, canSendEmail, avatarUrls })}
            data={users}
            enablePagination={true}
            enableSelect={false}
            filtersConfig={userFiltersConfig}
            searchKeys={["name", "email"]}
            searchPlaceholder="Search by name or email"
        />
    );
};
