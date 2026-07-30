"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { User } from "@/db/schema/02_user";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ButtonWithLoading } from "@/components/common/button-with-loading";
import { setUserRoleAction } from "@/features/users/user.action";

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
            if (!role) {
                throw new Error("Role is required");
            }

            return await setUserRoleAction({
                userId: user.id,
                role: role as "pending" | "user" | "admin" | "superadmin",
            });
        },
        onSuccess: async (result) => {
            const inner = result?.data;

            if (inner?.success) {
                toast.success("User role changed successfully.");
                onOpenChange(false);
                router.refresh();
                return;
            }

            toast.error(inner?.actionError?.message || "An error occurred while updating user roles.");
        },
        onError: async () => {
            toast.error("An error occurred while updating user roles.");
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
