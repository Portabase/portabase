"use client";

import { useMutation } from "@tanstack/react-query";
import { User } from "@/db/schema/02_user";
import { ButtonWithLoading } from "@/components/wrappers/common/button/button-with-loading";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { authClient } from "@/lib/auth/auth-client";
import { toast } from "sonner";
import { setSuperAdminOwnerOfOrganizationsOwnedByUser } from "@/components/wrappers/dashboard/admin/users/user.action";

type AdminDeleteUserModalProps = {
  open: boolean;
  user: User;
  onOpenChange: (open: boolean) => void;
};

export const AdminDeleteUserModal = ({
  user,
  open,
  onOpenChange,
}: AdminDeleteUserModalProps) => {
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await setSuperAdminOwnerOfOrganizationsOwnedByUser({
        userId: user.id,
      });
      const result = res?.data;
      if (result?.success) {
        await authClient.admin.removeUser(
          {
            userId: user.id,
          },
          {
            onSuccess: async () => {
              toast.success(`User ${user.name} successfully deleted`);
              onOpenChange(false);
              router.refresh();
            },
            onError: async (error) => {
              toast.error("An error has occurred while deleting user");
              onOpenChange(false);
            },
          },
        );
      } else {
        toast.error("An error has occurred while deleting user");
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Are you sure you want to delete {user.name} ?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action is irreversible: it will lead to the deletion of the
            user's data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <ButtonWithLoading onClick={async () => await mutation.mutateAsync()}>
            Confirm
          </ButtonWithLoading>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
