"use client";

import {ColumnDef} from "@tanstack/react-table";
import {StatusBadge} from "@/components/wrappers/common/status-badge";
import {Backup, DatabaseWith} from "@/db/schema/07_database";
import {Setting} from "@/db/schema/01_setting";
import {cn} from "@/lib/utils";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip";
import {MemberWithUser} from "@/db/schema/03_organization";
import {formatLocalizedDate} from "@/utils/date-formatting";
import {formatBytes} from "@/utils/text";
import {DatabaseActionsCell} from "@/components/wrappers/dashboard/database/backup/actions/backup-actions-cell";
import { Badge as BadgeC } from "@/components/ui/badge";

export function backupColumns(
    isAlreadyRestore: boolean,
    settings: Setting,
    database: DatabaseWith,
    activeMember: MemberWithUser
): ColumnDef<Backup>[] {
    return [
        {
            id: "availability",
            cell: ({row}) => {
                const statusColors: Record<string, string> = {
                    waiting: "bg-gray-400 border-gray-600",
                    ongoing: "bg-orange-400 border-orange-600",
                    success: "bg-green-400 border-green-600",
                };

                const colorStatus =
                    row.original.deletedAt != null
                        ? "bg-red-400 border-red-600"
                        : statusColors[row.original.status] ?? "bg-gray-400 border-gray-600";

                return (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className={cn("w-5 h-5 rounded-full border-4", colorStatus)}/>
                            </TooltipTrigger>
                            {row.original.deletedAt != null && (
                                <TooltipContent>
                                    <p>{formatLocalizedDate(row.original.deletedAt)}</p>
                                </TooltipContent>
                            )}
                        </Tooltip>
                    </TooltipProvider>
                )
            },
        },
        {
            accessorKey: "id",
            header: "Reference",
            cell: ({row}) => {
                const reference = row.original.id
                const isImported = row.original.imported
                return (
                    <div className="flex items-center space-x-2">
                        <span>{reference}</span>
                       {isImported && (
                            <BadgeC variant="outline" className="bg-orange-400/10 border-orange-600/50 text-orange-600">
                                Imported
                            </BadgeC>
                        )}
                    </div>
                )
            },
        },
        {
            accessorKey: "fileSize",
            header: "Size",
            cell: ({row}) => {
                return formatBytes(row.getValue("fileSize"))
            },
        },
        {
            accessorKey: "createdAt",
            header: "Created At",
            cell: ({row}) => {
                return formatLocalizedDate(row.getValue("createdAt"))
            },
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({row}) => {
                return <StatusBadge status={row.getValue("status")}/>;
            },
        },
        {
            id: "actions",
            cell: ({row}) => <DatabaseActionsCell isAlreadyRestore={isAlreadyRestore} activeMember={activeMember} backup={row.original}/>,
        },
        // {
        //     id: "actions",
        //     cell: ({row, table}) => {
        //         const status = row.getValue("status");
        //         const rowData: Backup = row.original;
        //         const fileName = rowData.file;
        //
        //         const router = useRouter();
        //
        //         const mutationRestore = useMutation({
        //             mutationFn: async () => {
        //                 const restoration = await createRestorationAction({
        //                     backupId: rowData.id,
        //                     databaseId: rowData.databaseId,
        //                 });
        //                 // @ts-ignore
        //                 if (restoration.data.success) {
        //                     // @ts-ignore
        //                     toast.success(restoration.data.actionSuccess?.message || "Restoration created successfully!");
        //                     router.refresh();
        //                 } else {
        //                     // @ts-ignore
        //                     toast.error(restoration.serverError || "Failed to create restoration.");
        //                 }
        //             },
        //         });
        //
        //         const mutationDeleteBackup = useMutation({
        //             mutationFn: async () => {
        //                 const deletion = await deleteBackupAction({
        //                     backupId: rowData.id,
        //                     databaseId: rowData.databaseId,
        //                     status: rowData.status,
        //                     file: rowData.file ?? "",
        //                     projectSlug: database.project?.slug!
        //                 });
        //                 // @ts-ignore
        //                 if (deletion.data.success) {
        //                     // @ts-ignore
        //                     toast.success(deletion.data.actionSuccess.message);
        //                     router.refresh();
        //                 } else {
        //                     // @ts-ignore
        //                     toast.error(deletion.data.actionError.message);
        //                 }
        //             },
        //         });
        //
        //         const handleRestore = async () => {
        //             await mutationRestore.mutateAsync();
        //         };
        //
        //         const handleDelete = async () => {
        //             await mutationDeleteBackup.mutateAsync();
        //         };
        //
        //         const handleDownload = async (fileName: string) => {
        //
        //             let url: string = "";
        //             let data: SafeActionResult<string, ZodString, readonly [], {
        //                 _errors?: string[] | undefined;
        //             }, readonly [], ServerActionResult<string>, object> | undefined
        //
        //             if (settings.storage == "local") {
        //                 data = await getFileUrlPresignedLocal({fileName: fileName!})
        //             } else if (settings.storage == "s3") {
        //                 data = await getFileUrlPreSignedS3Action(`backups/${database.project?.slug}/${fileName}`);
        //             }
        //             if (data?.data?.success) {
        //                 url = data.data.value ?? "";
        //             } else {
        //                 // @ts-ignore
        //                 const errorMessage = data?.data?.actionError?.message || "Failed to get file!";
        //                 toast.error(errorMessage);
        //             }
        //
        //             window.open(url, "_self");
        //         };
        //
        //         return (
        //             <>
        //                 {(rowData.deletedAt == null && activeMember.role != "member") && (
        //                     <DropdownMenu>
        //                         <DropdownMenuTrigger asChild>
        //                             <Button variant="ghost" className="h-8 w-8 p-0">
        //                                 <span className="sr-only">Open menu</span>
        //                                 <MoreHorizontal className="h-4 w-4"/>
        //                             </Button>
        //                         </DropdownMenuTrigger>
        //                         <DropdownMenuContent align="end">
        //                             <DropdownMenuLabel>Actions</DropdownMenuLabel>
        //                             {status == "success" ? (
        //                                 <>
        //                                     <TooltipCustom disabled={isAlreadyRestore}
        //                                                    text="Already a restoration waiting">
        //                                         <DropdownMenuItem
        //                                             disabled={mutationRestore.isPending || isAlreadyRestore}
        //                                             onClick={async () => {
        //                                                 await handleRestore();
        //                                             }}
        //                                         >
        //                                             <ReloadIcon/> Restore
        //                                         </DropdownMenuItem>
        //                                     </TooltipCustom>
        //                                     <DropdownMenuItem
        //                                         onClick={async () => {
        //                                             await handleDownload(fileName ?? "");
        //                                         }}
        //                                     >
        //                                         <Download/> Download
        //                                     </DropdownMenuItem>
        //                                 </>
        //                             ) : null}
        //                             <DropdownMenuSeparator/>
        //                             <DropdownMenuItem
        //                                 className="text-red-600"
        //                                 onClick={async () => {
        //                                     await handleDelete();
        //                                 }}
        //                             >
        //                                 <Trash2/> Delete
        //                             </DropdownMenuItem>
        //                         </DropdownMenuContent>
        //                     </DropdownMenu>
        //                 )}
        //             </>
        //
        //         );
        //     },
        // },
    ];
}