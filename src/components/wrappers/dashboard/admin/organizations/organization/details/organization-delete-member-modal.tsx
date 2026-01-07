"use client";

import { useMutation } from "@tanstack/react-query";
import { ButtonWithLoading } from "@/components/wrappers/common/button/button-with-loading";
import { useRouter } from "next/navigation";
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { authClient } from "@/lib/auth/auth-client";
import { toast } from "sonner";
import {MemberWithUser} from "@/db/schema/03_organization";

type OrganizationDeleteMemberModalProps = {
    open: boolean;
    member: MemberWithUser;
    onOpenChangeAction: (open: boolean) => void;
};

export const OrganizationDeleteMemberModal = ({ member, open, onOpenChangeAction }: OrganizationDeleteMemberModalProps) => {

    const router = useRouter();

    const mutation = useMutation({
        mutationFn: async () => {
            await authClient.organization.removeMember(
                {
                    memberIdOrEmail: member.id,
                    organizationId: member.organizationId,
                },
                {
                    onSuccess: async (response) => {
                        toast.success("Member successfully deleted!");
                        onOpenChangeAction(false);
                        router.refresh();
                    },
                    onError: async (error) => {
                        toast.error("An error occurred while deleting member!");
                        onOpenChangeAction(false);
                    },
                }
            );
        },
    });

    return (
        <AlertDialog open={open} onOpenChange={onOpenChangeAction}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to delete {member.user.name } ?</AlertDialogTitle>
                    <AlertDialogDescription>This action is irreversible: it will permanently delete this member’s data.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <ButtonWithLoading onClick={async () => await mutation.mutateAsync()}>Validate</ButtonWithLoading>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};
