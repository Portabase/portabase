"use client"

import {useRouter} from "next/navigation";
import {useMutation} from "@tanstack/react-query";
import {Trash2} from "lucide-react";
import {toast} from "sonner";
import {ButtonWithConfirm} from "@/components/wrappers/common/button/button-with-confirm";
import {authClient} from "@/lib/auth/auth-client";
import {deleteOrganizationAction} from "@/features/organization/organization.action";

export type ButtonDeleteFleetProps = {
    text?: string;
    organisationId: string
};

export const ButtonDeleteOrganization = (props: ButtonDeleteFleetProps) => {

    const router = useRouter();
    const {data: organizations, refetch} = authClient.useListOrganizations();


    const mutationDeleteOrganisation = useMutation({
        mutationFn: () => deleteOrganizationAction({id: props.organisationId}),
        onSuccess: async (result) => {
            if (result?.data?.success) {
                await authClient.organization.setActive({
                    organizationSlug: "default",
                });
                toast.success("Organization deleted!");
                router.refresh()
                refetch()
            } else {
                toast.error("An error occurred.");
            }
        },
        onError: (error: any) => {
            console.error("network error:", error);
            toast.error(error?.message || "A network error occurred.");
        },
    });


    return (
        <ButtonWithConfirm
            title={props.text ? props.text : ""}
            description={"Are you sure you want to delete this organization?"}
            button={{
                main: {
                    variant: "outline",
                    icon: <Trash2 color="red"/>,
                },
                confirm: {
                    className: "w-full",
                    text: "Delete",
                    icon: <Trash2/>,
                    variant: "destructive",
                    onClick: async () => {
                        await mutationDeleteOrganisation.mutateAsync()
                    },
                },
                cancel: {
                    className: "w-full",
                    text: "Cancel",
                    icon: <Trash2/>,
                    variant: "outline",
                },
            }}
            isPending={mutationDeleteOrganisation.isPending}
        />
    );
};
