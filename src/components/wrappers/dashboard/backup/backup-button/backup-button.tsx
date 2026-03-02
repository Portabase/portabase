"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { backupButtonAction } from "@/components/wrappers/dashboard/backup/backup-button/backup-button.action";
import { Check, DatabaseZap, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { ButtonWithConfirm } from "@/components/wrappers/common/button/button-with-confirm";

export type BackupButtonProps = {
  databaseId: string;
  disable: boolean;
};

export const BackupButton = (props: BackupButtonProps) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const isMobile = useIsMobile();

  const mutation = useMutation({
    mutationFn: async (databaseId: string) => {
      const backup = await backupButtonAction(databaseId);
      if (backup?.data?.success) {
        toast.success(
          backup.data.actionSuccess?.message || "Backup created successfully!",
        );
        queryClient.invalidateQueries({
          queryKey: ["database-data", props.databaseId],
        });
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
    <ButtonWithConfirm
      title="Create Backup"
      description={"Are you sure you want to create a backup?"}
      button={{
        main: {
          text: isMobile ? "" : "Backup",
          variant: "default",
          icon: <DatabaseZap />,
        },
        confirm: {
          className: "w-full",
          text: "Yes, create backup",
          icon: <Check />,
          variant: "default",
          onClick: async () => {
            await HandleAction();
          },
        },
        cancel: {
          className: "w-full",
          text: "No, cancel",
          icon: <X />,
          variant: "outline",
        },
      }}
      isPending={mutation.isPending}
    />
  );
};
