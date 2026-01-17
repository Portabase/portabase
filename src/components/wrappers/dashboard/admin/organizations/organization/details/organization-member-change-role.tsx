"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {useMutation} from "@tanstack/react-query";
import {toast} from "sonner";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {ButtonWithLoading} from "@/components/wrappers/common/button/button-with-loading";
import {MemberRoleType} from "@/types/common";
import {MemberWithUser} from "@/db/schema/03_organization";
import {
    updateMemberRoleAdminAction
} from "@/components/wrappers/dashboard/admin/organizations/organization/details/role-member.action";
import {RoleSchemaMember} from "@/components/wrappers/dashboard/organization/settings/member.schema";

type OrganizationMemberChangeRoleModalProps = {
    open: boolean;
    member: MemberWithUser;
    onOpenChangeAction: (open: boolean) => void;
};

export const OrganizationMemberChangeRoleModal = (props: OrganizationMemberChangeRoleModalProps) => {
    const {member, open, onOpenChangeAction} = props;

    const router = useRouter();
    const [role, setRole] = useState<MemberRoleType>(member.role as MemberRoleType);

    const mutation = useMutation({
        mutationFn: () =>
            updateMemberRoleAdminAction({
                memberId: member.id,
                organizationId: member.organizationId,
                role: RoleSchemaMember.parse(role),
            }),
        onSuccess: () => {
            toast.success("Member successfully updated");
            onOpenChangeAction(false);
            router.refresh();
        },
        onError: (error) => {
            toast.error("An error occurred while updating member");
            onOpenChangeAction(false);
        },
    });


    return (
        <Dialog open={open} onOpenChange={onOpenChangeAction}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Change the user’s role</DialogTitle>
                    <DialogDescription>Modify the role of this user within your organization.</DialogDescription>
                </DialogHeader>
                <Select defaultValue={member.role ?? ""} onValueChange={(role) => setRole(role as MemberRoleType)}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sélectionnez un rôle"/>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="owner">Owner</SelectItem>
                    </SelectContent>
                </Select>
                <DialogFooter>
                    <div className="flex gap-4 justify-end">
                        <ButtonWithLoading
                            variant="outline"
                            onClick={() => {
                                onOpenChangeAction(false);
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
