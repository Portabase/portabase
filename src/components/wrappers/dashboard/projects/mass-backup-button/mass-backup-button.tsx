"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, DatabaseZap, X } from "lucide-react";

import { ButtonWithConfirm } from "@/components/wrappers/common/button/button-with-confirm";
import { useIsMobile } from "@/hooks/use-mobile";
import { massBackupProjectAction } from "@/components/wrappers/dashboard/projects/mass-backup-button/mass-backup-project.action";

export type MassBackupButtonProps = {
  projectId: string;
  databaseCount: number;
};

export const MassBackupButton = (props: MassBackupButtonProps) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const isMobile = useIsMobile();

  const mutation = useMutation({
    mutationFn: (projectId: string) => massBackupProjectAction(projectId),
    onSuccess: (result) => {
      if (result?.data?.success) {
        toast.success(
          result.data.actionSuccess?.message ||
            "Backups have been successfully created.",
        );
        queryClient.invalidateQueries({ queryKey: ["database-data"] });
        router.refresh();
      } else {
        toast.error(
          result?.data?.actionError?.message ||
            result?.serverError ||
            "Failed to create backup.",
        );
      }
    },
    onError: () => {
      toast.error("Failed to create backup.");
    },
  });

  const disable = props.databaseCount === 0 || mutation.isPending;

  return (
    <ButtonWithConfirm
      title="Create Backup"
      description={
        props.databaseCount === 0
          ? "Add databases to this project before creating a backup."
          : "Are you sure you want to create a backup for all databases in this project? Databases that already have a backup in progress will be skipped."
      }
      button={{
        main: {
          disabled: disable,
          text: isMobile ? "" : "Backup",
          variant: "default",
          icon: <DatabaseZap />,
        },
        confirm: {
          className: "w-full",
          text: "Yes, create backup",
          icon: <Check />,
          variant: "default",
          onClick: () => {
            mutation.mutate(props.projectId);
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
