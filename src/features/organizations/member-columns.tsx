"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MemberWithUser } from "@/db/schema/03_organization";
import { useState } from "react";
import { authClient, useSession } from "@/lib/auth/auth-client";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {updateMemberRoleAction} from "@/features/organizations/update-member.action";
import {RoleSchemaMember} from "@/features/organizations/member.schema";

export const organizationMemberColumns: ColumnDef<MemberWithUser>[] = [
    {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => {
            const [role, setRole] = useState<string>(row.getValue("role"));
            const { data: session } = useSession();
            const activeOrgaMember = authClient.useActiveMember();

            const updateMutation = useMutation({
                mutationFn: (nextRole: string) =>
                    updateMemberRoleAction({
                        memberId: row.original.id,
                        organizationId: row.original.organizationId,
                        role: RoleSchemaMember.parse(nextRole),
                    }),
                onSuccess: (result, nextRole) => {
                    const inner = result?.data;

                    if (inner?.success) {
                        setRole(nextRole);
                        toast.success("User updated successfully.");
                        return;
                    }

                    toast.error(inner?.actionError?.message || "An error occurred while updating user information.");
                },
                onError: () => {
                    toast.error("An error occurred while updating user information.");
                },
            });

            // Only allow cycling between admin <-> member
            const handleUpdateRole = async () => {
                const nextRole = role === "admin" ? "member" : "admin";
                await updateMutation.mutateAsync(nextRole);
            };

            const isCurrentUser = session?.user.email === row.original.user.email;
            const isMember = activeOrgaMember.data?.role === "member";
            const isRowRoleOwner = role === "owner";

            const isDisabled = isMember || isCurrentUser || isRowRoleOwner;

            // Dynamic tooltip reason
            const disabledReason = isCurrentUser
                ? "You cannot change your own role"
                : isRowRoleOwner
                    ? "Owner role cannot be modified"
                    : "Members cannot edit roles";

            const badge = (
                <Badge
                    className={
                        isDisabled
                            ? "cursor-not-allowed opacity-50"
                            : "cursor-pointer hover:bg-accent"
                    }
                    onClick={isDisabled ? undefined : handleUpdateRole}
                    variant="outline"
                >
                    {role}
                </Badge>
            );

            return isDisabled ? (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>{badge}</TooltipTrigger>
                        <TooltipContent>
                            <p>{disabledReason}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            ) : (
                badge
            );
        },
    },
    {
        accessorKey: "user.name",
        header: "Name",
    },
    {
        accessorKey: "user.email",
        header: "Email",
    },
];
