"use client";

import {User} from "@/db/schema/02_user";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import {AdminUserEditForm} from "./admin-user-edit-form";

type AdminUserEditPasswordProps = {
    open: boolean;
    user: User;
    onOpenChange: (open: boolean) => void;
};

export const AdminUserEdit = ({user, open, onOpenChange}: AdminUserEditPasswordProps) => {

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit ${user.name}'s profile</DialogTitle>
                    <DialogDescription>Update following information</DialogDescription>
                </DialogHeader>
                <DialogContent
                    onOpenAutoFocus={(e) => e.preventDefault()}
                >
                    <AdminUserEditForm
                        defaultValues={{
                            name: user.name,
                            email: user.email,
                            id: user.id,
                        }}
                        onSuccess={() => onOpenChange(false)}
                    />
                </DialogContent>
            </DialogContent>
        </Dialog>
    );
};
