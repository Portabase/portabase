"use client";
import { DataTable } from "@/components/common/data-table";
import {usersListColumns} from "@/features/users/components/user-columns";
import {User} from "@/db/schema/02_user";

type AdminUserListProps = {
    users: User[];
    isPasswordAuthEnabled: boolean;
    avatarUrls?: Record<string, string | undefined>;
};

export const AdminUserList = ({ users, isPasswordAuthEnabled, avatarUrls }: AdminUserListProps) => {
    return <DataTable columns={usersListColumns({ isPasswordAuthEnabled, avatarUrls })} data={users} enablePagination={true} enableSelect={false} />;
};
