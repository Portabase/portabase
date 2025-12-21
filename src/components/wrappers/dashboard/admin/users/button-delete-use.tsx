"use client";

import {Trash2} from "lucide-react";
import {ButtonWithConfirm} from "@/components/wrappers/common/button/button-with-confirm";
import {useMutation} from "@tanstack/react-query";
import {useRouter} from "next/navigation";
import {toast} from "sonner";
import {deleteUserAction} from "@/components/wrappers/dashboard/profile2/button-delete-account/delete-account.action";

export type ButtonDeleteUserProps = {
    userId: string;
    disabled?: boolean;
};

export const ButtonDeleteUser = (props: ButtonDeleteUserProps) => {
    const router = useRouter();

    const mutation = useMutation({
        mutationFn: () => deleteUserAction(props.userId),
        onSuccess: async () => {
            toast.success("User deleted successfully.");
            router.refresh();
        },
    });

    return (
        <div className="flex items-center gap-2">

            <ButtonWithConfirm
                title={""}

                description="Are you sure you want to remove this user? This action cannot be undone."
                button={{
                    main: {
                        disabled: !!props.disabled,
                        text: "",
                        variant: "outline",
                        size: "sm",
                        icon: <Trash2 color="red" size={15}/>,
                    },
                    confirm: {
                        className: "w-full",
                        text: "Delete",
                        icon: <Trash2/>,
                        variant: "destructive",
                        onClick: () => {
                            mutation.mutate()
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
        </div>
    );
};
