"use client";

import {useMutation} from "@tanstack/react-query";
import {Trash2} from "lucide-react";
import {ButtonWithConfirm} from "@/components/wrappers/common/button/button-with-confirm";
import {signOut} from "@/lib/auth/auth-client";
import {useRouter} from "next/navigation";
import {deleteUserAction} from "./delete-account.action";

export type ButtonDeleteAccountProps = {
    text?: string;
};

export const ButtonDeleteAccount = (props: ButtonDeleteAccountProps) => {
    const router = useRouter();

    const mutation = useMutation({
        mutationFn: () => deleteUserAction(""),
        onSuccess: async () => {
            await signOut({
                fetchOptions: {
                    onSuccess: () => {
                        router.push("/login");
                    },
                },
            });
        },
    });

    return (
        <ButtonWithConfirm
            title={props.text ? props.text : ""}
            description="Are you sure you want to delete your account ? This action cannot be undone."
            button={{
                main: {
                    text: props.text ? props.text : "",
                    variant: "outline",
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
