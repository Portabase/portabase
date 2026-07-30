"use client";

import { useMutation } from "@tanstack/react-query";
import { ButtonWithLoading } from "@/components/common/button-with-loading";
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
import { toast } from "sonner";
import {MemberWithUser} from "@/db/schema/03_organization";
import { removeMemberOrganizationAction } from "@/features/organizations/remove-member.action";

type OrganizationDeleteMemberModalProps = {
    open: boolean;
    member: MemberWithUser;
    onOpenChangeAction: (open: boolean) => void;
};

export const OrganizationDeleteMemberModal = ({ member, open, onOpenChangeAction }: OrganizationDeleteMemberModalProps) => {

    const router = useRouter();

    const mutation = useMutation({
        mutationFn: async () => {
            return await removeMemberOrganizationAction({
                memberId: member.id,
                organizationId: member.organizationId,
            });
        },
        onSuccess: async (result) => {
            const inner = result?.data;

            if (inner?.success) {
                toast.success("Member successfully deleted!");
                onOpenChangeAction(false);
                router.refresh();
                return;
            }

            toast.error(inner?.actionError?.message || "An error occurred while deleting member!");
        },
        onError: async () => {
            toast.error("An error occurred while deleting member!");
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
