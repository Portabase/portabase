"use client";

import {useState} from "react";
import {Button} from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {MoreHorizontal, Settings, Trash2, RotateCcwKey, UserCog} from "lucide-react";
import {authClient} from "@/lib/auth/auth-client";
import {cn} from "@/lib/utils";
import {User} from "@/db/schema/02_user";
import {AdminUserChangePassword} from "./admin-user-change-password-modal";
import {AdminUserEdit} from "./admin-user-edit-modal";
import {AdminUserChangeRoleModal} from "@/components/wrappers/dashboard/admin/users/admin-user-change-role-modal";
import {AdminDeleteUserModal} from "@/components/wrappers/dashboard/admin/users/admin-user-delete-modal";

interface UserActionsCellProps {
    user: User;
    isPasswordAuthEnabled: boolean;
}

export function UserActionsCell({user, isPasswordAuthEnabled}: UserActionsCellProps) {

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isModalChangePasswordOpen, setIsModalChangePasswordOpen] = useState(false);
    const [isModalEditUserOpen, setIsModalEditUserOpen] = useState(false);
    const [isModalDeleteOpen, setIsModalDeleteOpen] = useState(false);
    const {data: session, isPending, error} = authClient.useSession();
    if (isPending || error) return null;
    const isCurrentUser = session?.user?.id === user.id;
    const isSuperAdmin = session?.user?.role === "superadmin";

    if (isCurrentUser || user.role === "superadmin") return null;

    return (
        <>
            <AdminUserChangeRoleModal user={user} open={isModalOpen} onOpenChange={setIsModalOpen}/>
            <AdminDeleteUserModal user={user} open={isModalDeleteOpen} onOpenChange={setIsModalDeleteOpen}/>
            <AdminUserChangePassword user={user} open={isModalChangePasswordOpen}
                                     onOpenChange={setIsModalChangePasswordOpen}/>
            <AdminUserEdit user={user} open={isModalEditUserOpen} onOpenChange={setIsModalEditUserOpen}/>
            <div className={cn("flex items-center space-x-2")}>
                {isPasswordAuthEnabled && (
                    <Button variant="outline" size="icon" onClick={() => setIsModalChangePasswordOpen(true)}>
                        <RotateCcwKey className="w-4 h-4"/>
                    </Button>
                )}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4"/>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setIsModalOpen(true)}>
                            <Settings className="w-4 h-4 mr-2"/>
                            Role
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setIsModalEditUserOpen(true)}>
                            <UserCog className="w-4 h-4 mr-2"/>
                            Edit User
                        </DropdownMenuItem>
                        {isSuperAdmin && (
                            <>
                                <DropdownMenuSeparator/>
                                <DropdownMenuItem onSelect={() => setIsModalDeleteOpen(true)} className="text-red-600">
                                    <Trash2 className="w-4 h-4 mr-2"/>
                                    Delete
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </>
    );
}
