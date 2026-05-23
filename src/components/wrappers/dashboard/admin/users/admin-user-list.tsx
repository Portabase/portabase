"use client";
import { DataTable } from "@/components/common/data-table";
import {usersListColumns} from "@/components/wrappers/dashboard/admin/users/table-colums";
import {User} from "@/db/schema/02_user";

type AdminUserListProps = {
    users: User[];
    isPasswordAuthEnabled: boolean;
};

export const AdminUserList = ({ users, isPasswordAuthEnabled }: AdminUserListProps) => {
    return <DataTable columns={usersListColumns({ isPasswordAuthEnabled })} data={users} enablePagination={true} enableSelect={false} />;
};
