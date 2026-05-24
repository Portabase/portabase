"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { authClient } from "@/lib/auth/auth-client";
import { User } from "@/db/schema/02_user";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ButtonWithLoading } from "@/components/common/button-with-loading";

type AdminUserChangeRoleModalProps = {
    open: boolean;
    user: User;
    onOpenChange: (open: boolean) => void;
};

export const AdminUserChangeRoleModal = (props: AdminUserChangeRoleModalProps) => {


    const { user, open, onOpenChange } = props;
    const router = useRouter();
    const [role, setRole] = useState<string | null>(user.role);

    const mutation = useMutation({
        mutationFn: async () => {
            await authClient.admin.setRole(
                {
                    userId: user.id,
                    // @ts-ignore
                    role: role,
                },
                {
                    onSuccess: async (response) => {
                        toast.success("User role changed successfully.");
                        onOpenChange(false);
                        router.refresh();
                    },
                    onError: async (error) => {
                        console.error("AdminUserChangeRoleModal - setRole", error);
                        toast.error("An error occurred while updating user roles.");
                        onOpenChange(false);
                    },
                }
            );
        },
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Change the user's role</DialogTitle>
                    <DialogDescription>Modify this user's role within your organization.</DialogDescription>
                </DialogHeader>
                <Select defaultValue={user.role ?? ""} onValueChange={setRole}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sélectionnez un rôle" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                </Select>
                <DialogFooter>
                    <div className="flex gap-4 justify-end">
                        <ButtonWithLoading
                            variant="outline"
                            onClick={() => {
                                onOpenChange(false);
                            }}
                        >
                            Cancel
                        </ButtonWithLoading>
                        <ButtonWithLoading
                            isPending={mutation.isPending}
                            onClick={async () => {
                                await mutation.mutateAsync();
                            }}
                        >
                            Validate
                        </ButtonWithLoading>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
