"use client";

import {useMutation, useQueryClient} from "@tanstack/react-query";
import {useRouter} from "next/navigation";
import {toast} from "sonner";

import {backupButtonAction} from "@/components/wrappers/dashboard/backup/backup-button/backup-button.action";
import {ButtonWithLoading} from "@/components/wrappers/common/button/button-with-loading";
import {Database, DatabaseZap} from "lucide-react";
import {useIsMobile} from "@/hooks/use-mobile";

export type BackupButtonProps = {
    databaseId: string;
    disable: boolean;
};

export const BackupButton = (props: BackupButtonProps) => {
    const queryClient = useQueryClient();
    const router = useRouter();
    const isMobile = useIsMobile()

    const mutation = useMutation({
        mutationFn: async (databaseId: string) => {
            const backup = await backupButtonAction(databaseId);
            if (backup?.data?.success) {
                toast.success(backup.data.actionSuccess?.message || "Backup created successfully!");
                queryClient.invalidateQueries({queryKey: ["database-data", props.databaseId]});
                router.refresh();
            } else {
                toast.error(backup?.serverError || "Failed to create backup.");
            }
        },
    });
    const HandleAction = async () => {
        await mutation.mutateAsync(props.databaseId);
    };

    return (
        <ButtonWithLoading
            icon={<DatabaseZap/>}
            disabled={props.disable}
            isPending={mutation.isPending}
            size={"default"}
            onClick={async () => {
                await HandleAction();
            }}
        >{isMobile ? "" : "Backup"}</ButtonWithLoading>
    );
};
