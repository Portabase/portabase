"use client";

import { ColumnDef } from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Check, MoreHorizontal, Trash2, X } from "lucide-react";
import { ReloadIcon } from "@radix-ui/react-icons";
import { StatusBadge } from "@/components/wrappers/common/status-badge";
import { Restoration } from "@/db/schema/07_database";
import { formatLocalizedDate } from "@/utils/date-formatting";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  deleteRestoreAction,
  rerunRestorationAction,
} from "@/features/dashboard/restore/restore.action";
import { toast } from "sonner";
import { TooltipCustom } from "@/components/wrappers/common/tooltip-custom";
import { MemberWithUser } from "@/db/schema/03_organization";
import { ButtonWithConfirm } from "@/components/wrappers/common/button/button-with-confirm";

export function restoreColumns(
  isAlreadyRestore: boolean,
  activeMember: MemberWithUser,
): ColumnDef<Restoration>[] {
  return [
    {
      accessorKey: "id",
      header: "Reference",
    },
    {
      accessorKey: "createdAt",
      header: "Created At",
      cell: ({ row }) => {
        return formatLocalizedDate(row.getValue("createdAt"));
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        return <StatusBadge status={row.getValue("status")} />;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const status = row.getValue("status");

        const queryClient = useQueryClient();
        const rowData: Restoration = row.original;

        const mutationDeleteRestore = useMutation({
          mutationFn: async () => {
            const restoration = await deleteRestoreAction({
              restorationId: rowData.id,
            });
            // @ts-ignore
            if (restoration.data.success) {
              // @ts-ignore
              toast.success(restoration.data.actionSuccess.message);
              queryClient.invalidateQueries({
                queryKey: ["database-data", rowData.databaseId],
              });
            } else {
              // @ts-ignore
              toast.error(restoration.data.actionError.message);
            }
          },
        });

        const mutationRerunRestore = useMutation({
          mutationFn: async () => {
            const restoration = await rerunRestorationAction({
              restorationId: rowData.id,
            });
            // @ts-ignore
            if (restoration.data.success) {
              // @ts-ignore
              toast.success(restoration.data.actionSuccess.message);
              queryClient.invalidateQueries({
                queryKey: ["database-data", rowData.databaseId],
              });
            } else {
              // @ts-ignore
              toast.error(restoration.data.actionError.message);
            }
          },
        });

        const handleDelete = async () => {
          await mutationDeleteRestore.mutateAsync();
        };

        const handleRerunRestore = async () => {
          await mutationRerunRestore.mutateAsync();
        };

        return (
          <>
            {activeMember.role !== "member" && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    type="button"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  {rowData.backupStorageId && (
                    <TooltipCustom
                      disabled={isAlreadyRestore}
                      text="Already a restoration waiting"
                    >
                      <DropdownMenuItem
                        disabled={
                          mutationRerunRestore.isPending || isAlreadyRestore
                        }
                        onClick={async () => {
                          await handleRerunRestore();
                        }}
                      >
                        <ReloadIcon /> Rerun
                      </DropdownMenuItem>
                    </TooltipCustom>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <ButtonWithConfirm
                      title="Delete Restoration"
                      description={
                        "Are you sure you want to delete this restoration?"
                      }
                      button={{
                        main: {
                          text: "Delete",
                          variant: "ghost",
                          icon: (
                            <Trash2 className="text-red-500 size-4 mr-px" />
                          ),
                          disabled: status === "waiting",
                          className:
                            "text-red-500 hover:text-red-500 p-0 h-auto has-[>svg]:px-0",
                        },
                        confirm: {
                          className: "w-full",
                          text: "Yes, delete",
                          icon: <Check />,
                          variant: "destructive",
                          onClick: async () => {
                            await handleDelete();
                          },
                        },
                        cancel: {
                          className: "w-full",
                          text: "No, cancel",
                          icon: <X />,
                          variant: "outline",
                        },
                      }}
                      isPending={mutationDeleteRestore.isPending}
                    />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </>
        );
      },
    },
  ];
}
