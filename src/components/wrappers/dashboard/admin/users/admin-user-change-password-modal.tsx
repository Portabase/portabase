"use client";

import { useMutation } from "@tanstack/react-query";
import { User } from "@/db/schema/02_user";
import { ButtonWithLoading } from "@/components/common/button-with-loading";
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { requestPasswordReset } from "@/lib/auth/auth-client";
import { toast } from "sonner";

type AdminUserChangePasswordProps = {
    open: boolean;
    user: User;
    onOpenChange: (open: boolean) => void;
};

export const AdminUserChangePassword = ({ user, open, onOpenChange }: AdminUserChangePasswordProps) => {

    const mutation = useMutation({
        mutationFn: async () => {
            await requestPasswordReset(
                {
                    email: user.email,

                },
                {
                    onSuccess: () => {
                        toast.success("Reset password request successfully sent!");
                        onOpenChange(false);
                    },
                    onError: (error) => {
                        toast.error(error.error.message);
                    },
                }
            );
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Change {user.name}'s password</AlertDialogTitle>
                    <AlertDialogDescription>This action will send an email to the user to reset their password.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <ButtonWithLoading onClick={async () => await mutation.mutateAsync()} isPending={mutation.isPending}>
                        Validate
                    </ButtonWithLoading>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};
