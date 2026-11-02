"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { backupButtonAction } from "@/features/database/actions/backup-button.action";
import { Check, DatabaseZap, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { ButtonWithConfirm } from "@/components/common/button-with-confirm";
import type { BackupEngine } from "@/features/database/utils/backup-method";

export type BackupButtonProps = {
  databaseId: string;
  disable: boolean;
  engine: BackupEngine;
};

const REPLICA_RUNS: Partial<Record<BackupEngine, { noun: string; description: string }>> = {
  sync: {
    noun: "Sync",
    description: "Mirror the directory to its storages now? Files removed from the source are deleted from the replica.",
  },
  copy: {
    noun: "Copy",
    description: "Copy new and changed files to its storages now? Nothing is deleted from the replica.",
  },
};

export const BackupButton = (props: BackupButtonProps) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const isMobile = useIsMobile();
  const replicaRun = REPLICA_RUNS[props.engine];

  const mutation = useMutation({
    mutationFn: async (databaseId: string) => {
      const backup = await backupButtonAction(databaseId);
      if (backup?.data?.success) {
        toast.success(
          replicaRun
            ? `${replicaRun.noun} has been successfully requested.`
            : backup.data.actionSuccess?.message || "Backup created successfully!",
        );
        queryClient.invalidateQueries({
          queryKey: ["database-data", props.databaseId],
        });
        queryClient.invalidateQueries({
          queryKey: ["backups", props.databaseId],
        });
        router.refresh();
      } else {
        toast.error(backup?.serverError || (replicaRun ? `Failed to request a ${replicaRun.noun.toLowerCase()}.` : "Failed to create backup."));
      }
    },
  });
  const HandleAction = async () => {
    await mutation.mutateAsync(props.databaseId);
  };

  return (
    <ButtonWithConfirm
      title={replicaRun ? `Run ${replicaRun.noun}` : "Create Backup"}
      description={replicaRun ? replicaRun.description : "Are you sure you want to create a backup?"}
      button={{
        main: {
          disabled: props.disable,
          text: isMobile ? "" : replicaRun ? replicaRun.noun : "Backup",
          variant: "default",
          icon: <DatabaseZap />,
        },
        confirm: {
          className: "w-full",
          text: replicaRun ? `Yes, ${replicaRun.noun.toLowerCase()} now` : "Yes, create backup",
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
