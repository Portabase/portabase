"use client";
import { DataTable } from "@/components/common/data-table";
import {usersListColumns} from "@/features/users/user-columns";
import {User} from "@/db/schema/02_user";

type AdminUserListProps = {
    users: User[];
    isPasswordAuthEnabled: boolean;
};

export const AdminUserList = ({ users, isPasswordAuthEnabled }: AdminUserListProps) => {
    return <DataTable columns={usersListColumns({ isPasswordAuthEnabled })} data={users} enablePagination={true} enableSelect={false} />;
};
