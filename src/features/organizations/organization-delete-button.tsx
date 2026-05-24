"use client";
import {ButtonWithConfirm} from "@/components/common/button-with-confirm";
import {deleteOrganizationAction} from "@/features/organizations/organization.action";
import {useMutation} from "@tanstack/react-query";
import {useRouter} from "next/navigation";
import {toast} from "sonner";
import {authClient} from "@/lib/auth/auth-client";
import {Trash2} from "lucide-react";
import {useIsMobile} from "@/hooks/use-mobile";

export type DeleteOrganizationButtonProps = {
    organizationSlug: string;
    disabled?: boolean
};

export const DeleteOrganizationButton = (props: DeleteOrganizationButtonProps) => {
    const router = useRouter();
    const isMobile = useIsMobile();
    const {refetch} = authClient.useListOrganizations();

    const mutation = useMutation({
        mutationFn: () => deleteOrganizationAction({slug: props.organizationSlug}),

        onSuccess: async (result) => {
            if (result?.data?.success) {
                await authClient.organization.setActive({
                    organizationSlug: "default",
                });
                toast.success(result.data.actionSuccess?.message || "Organization deleted.");
                router.refresh()
                refetch()
                router.push("/");
            } else {
                // @ts-expect-error — actionError not exposed in return type
                const errorMsg = result?.data?.actionError?.message || result?.data?.actionError?.messageParams?.message || "Failed to delete the organization.";
                toast.error(errorMsg);
            }
        },

        onError: (_e: any) => {
            toast.error(_e?.message || "A network error occurred.");
        },
    });

    return (

        <ButtonWithConfirm
            title="Delete Organization"
            description="Are you sure you want to remove this organization? This action cannot be undone."
            button={{
                main: {
                    text: !isMobile ? "Delete Organization" : "",
                    variant: "outline",
                    disabled: props.disabled,
                    icon: <Trash2 color="red"/>,
                },
                confirm: {
                    className: "w-full",
                    text: "Delete",
                    icon: <Trash2/>,
                    variant: "destructive",
                    onClick: () => {
                        mutation.mutate();
                    },
                },
                cancel: {
                    className: "w-full",
                    text: "Cancel",
                    icon: <Trash2/>,
                    variant: "outline",
                },
            }}
            isPending={mutation.isPending}
        />


    );
};
