"use client"
import {ColumnDef} from "@tanstack/react-table";
import {Badge} from "@/components/ui/badge";
import {updateUserAction} from "@/components/wrappers/dashboard/profile2/user-form/user-form.action";
import {useMutation} from "@tanstack/react-query";
import {toast} from "sonner";
import {useRouter} from "next/navigation";
import {useState} from "react";
import {UserWithAccounts} from "@/db/schema/02_user";
import {authClient, useSession} from "@/lib/auth/auth-client";
import {providerSwitch} from "@/components/wrappers/common/provider-switch";
import {ButtonDeleteUser} from "@/components/wrappers/dashboard/admin/users/button-delete-use";
import {formatLocalizedDate} from "@/utils/date-formatting";

export const usersColumnsAdmin: ColumnDef<UserWithAccounts>[] = [
    {
        accessorKey: "role",
        header: "Role",
        cell: ({row}) => {
            const [role, setRole] = useState<string>(row.getValue("role"));

            const {data: session, isPending, error} = authClient.useSession();
            const isSuperAdmin = session?.user.role == "superadmin";
            const isCurrentUser = session?.user.email === row.original.email;

            const updateMutation = useMutation({
                mutationFn: () => updateUserAction({id: row.original.id, data: {role: role}}),
                onSuccess: () => {
                    toast.success(`User updated successfully.`);
                },
                onError: () => {
                    toast.error(`An error occurred while updating user information.`);
                },
            });

            const handleUpdateRole = async () => {
                const nextRole = role === "admin" ? "pending" : role === "pending" ? "user" : "admin";
                setRole(nextRole);
                await updateMutation.mutateAsync();
            };


            if (isPending) return null;

            if (error || !session) {
                return null;
            }


            return (
                <Badge
                    className={isCurrentUser || !isSuperAdmin ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
                    onClick={isCurrentUser || !isSuperAdmin ? undefined : () => handleUpdateRole()}
                    variant="outline"
                >
                    {role}
                </Badge>
            );
        },
    },
    {
        accessorKey: "name",
        header: "Name",
    },
    {
        accessorKey: "email",
        header: "Email",
    },
    {
        accessorKey: "accounts",
        header: "Provider(s)",
        cell: ({row}) => {
            return (
                <div className="flex flex-row items-center  gap-x-2">
                    {row.original.accounts.map((item) => (
                        <div key={item.id}>
                            {providerSwitch(item.providerId, true)}
                        </div>
                    ))}
                </div>
            )
        }
    },
    {
        accessorKey: "updatedAt",
        header: "Updated At",
        cell: ({row}) => {
            return formatLocalizedDate(row.getValue("updatedAt"))
        },
    },
    {
        header: "Action",
        id: "actions",
        cell: ({row}) => {
            const router = useRouter();
            const {data: session, isPending, error} = useSession();
            const isSuperAdmin = session?.user.role == "superadmin";

            if (isPending || error) return null;

            return (
                <ButtonDeleteUser
                    disabled={!isSuperAdmin || !session || session?.user.email === row.original.email}
                    userId={row.original.id}/>
            );
        },
    },
];
