"use client"
import {Backup, BackupWith, Restoration} from "@/db/schema/07_database";
import {Swiper, SwiperSlide} from "swiper/react";
//@ts-ignore
import "swiper/css";
import "swiper/css/pagination";
import {Pagination, Mousewheel} from "swiper/modules";
import {DatabaseActionKind, useBackupModal} from "@/components/wrappers/dashboard/database/backup/backup-modal-context";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage, useZodForm} from "@/components/ui/form";
import {
    BackupActionsSchema,
    BackupActionsType
} from "@/components/wrappers/dashboard/database/backup/actions/backup-actions.schema";
import {ButtonWithLoading} from "@/components/wrappers/common/button/button-with-loading";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {BackupStorageWith} from "@/db/schema/14_storage-backup";
import {TooltipProvider} from "@/components/ui/tooltip";
import {getChannelIcon} from "@/components/wrappers/dashboard/admin/channels/helpers/common";
import {truncateWords} from "@/utils/text";
import {useIsMobile} from "@/hooks/use-mobile";
import {Badge} from "@/components/ui/badge";
import {getStatusColor, getStatusIcon} from "@/components/wrappers/dashboard/admin/notifications/logs/columns";
import {
    createRestorationBackupAction, deleteBackupAction, deleteBackupStorageAction,
    downloadBackupAction
} from "@/components/wrappers/dashboard/database/backup/actions/backup-actions.action";
import {toast} from "sonner";
import {SafeActionResult} from "next-safe-action";
import {ServerActionResult} from "@/types/action-type";
import {ZodString} from "zod";
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert";
import {AlertCircleIcon} from "lucide-react";

type BackupActionsFormProps = {
    backup: BackupWith;
    action: DatabaseActionKind;
}

export const BackupActionsForm = ({backup, action}: BackupActionsFormProps) => {

    const filteredBackupStorages = backup.storages?.filter((storage) => storage.deletedAt === null) ?? []
    const isMobile = useIsMobile();
    const {closeModal} = useBackupModal();
    const queryClient = useQueryClient();

    const form = useZodForm({
        schema: BackupActionsSchema,
    });

    const mutation = useMutation({
        mutationFn: async (values: BackupActionsType) => {

            let result: SafeActionResult<string, ZodString, readonly [], {
                _errors?: string[] | undefined;
            }, readonly [], ServerActionResult<string | Restoration | Backup>, object> | undefined

            if (action === "download") {
                result = await downloadBackupAction({backupStorageId: values.backupStorageId})
            } else if (action === "restore") {
                result = await createRestorationBackupAction({
                    databaseId: backup.databaseId,
                    backupStorageId: values.backupStorageId,
                    backupId: backup.id
                })
            } else if (action === "delete") {
                result = await deleteBackupStorageAction({
                    databaseId: backup.databaseId,
                    backupStorageId: values.backupStorageId,
                    backupId: backup.id,
                })
            }

            const inner = result?.data;

            if (inner?.success) {
                toast.success(inner.actionSuccess?.message);
                queryClient.invalidateQueries({queryKey: ["database-data", backup.databaseId]});
                if (action === "download") {
                    const url = inner.value
                    if (typeof url === "string") {
                        window.open(url, "_self");
                    }
                    closeModal()
                } else if (action === "restore") {
                    closeModal()
                } else if (action === "delete") {
                    closeModal()
                } else {
                    closeModal()
                }
            } else {
                if (action === "delete") {
                    toast.success("Backup deleted successfully.")
                    queryClient.invalidateQueries({queryKey: ["database-data", backup.databaseId]});
                    closeModal()
                } else {
                    toast.error(inner?.actionError?.message ?? "An error occurred.");
                }
            }
        },
    });

    const mutationDeleteEntireBackup = useMutation({
        mutationFn: async () => {

            const result = await deleteBackupAction({
                databaseId: backup.databaseId,
                backupId: backup.id,
            })

            const inner = result?.data;

            if (inner?.success) {
                toast.success(inner.actionSuccess?.message);
                queryClient.invalidateQueries({queryKey: ["database-data", backup.databaseId]});
                closeModal()
            } else {
                toast.error(inner?.actionError?.message);
            }
        },
    });

    return (
        <TooltipProvider>


            <Form
                form={form}
                className="flex flex-col gap-4 mb-1"
                onSubmit={async (values) => {
                    await mutation.mutateAsync(values);
                }}
            >

                {filteredBackupStorages.length > 0 ?
                    <FormField
                        control={form.control}
                        name="backupStorageId"
                        render={({field}) => (
                            <FormItem>
                                <FormLabel>Choose a storage backup</FormLabel>
                                <FormControl>

                                    <div style={{height: "250px"}}>
                                        <Swiper
                                            direction="vertical"
                                            slidesPerView={3.5}
                                            spaceBetween={10}
                                            // pagination={{ clickable: true }}
                                            mousewheel={{releaseOnEdges: true, forceToAxis: true}}
                                            modules={[Pagination, Mousewheel]}
                                            className="mySwiper"
                                            style={{height: "100%"}}
                                        >
                                            {filteredBackupStorages.map((storage: BackupStorageWith) => (
                                                <SwiperSlide key={storage.id}>
                                                    <button
                                                        disabled={action !== "delete" && storage.status.toLowerCase() !== "success"}
                                                        type="button"
                                                        onClick={() => field.onChange(storage.id)}
                                                        className={`w-full h-full flex items-start gap-3 p-4 rounded-lg border text-left transition-colors
                                                        ${field.value === storage.id
                                                            ? "border-foreground bg-background"
                                                            : "border-border bg-background" + ((storage.status.toLowerCase() === "success" || action === "delete") ? " hover:border-muted-foreground" : "")}
                                                        ${storage.status.toLowerCase() !== "success" && action !== "delete" ? "opacity-50 cursor-not-allowed" : ""}`}
                                                    >
                                                        <div
                                                            className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border ${
                                                                field.value === storage.id ? "border-foreground" : "border-muted-foreground"
                                                            } flex items-center justify-center`}
                                                        >
                                                            {field.value === storage.id &&
                                                                <div className="h-2 w-2 rounded-full bg-foreground"/>}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex-1 min-w-0 flex flex-col gap-1">
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex items-center gap-2">
                                                                            {getChannelIcon(storage.storageChannel?.provider || "")}
                                                                            <h3 className="font-medium text-foreground">
                                                                                {isMobile ? truncateWords(storage?.storageChannel?.name ?? "", 2) : storage.storageChannel?.name}
                                                                            </h3>
                                                                            <Badge variant="secondary"
                                                                                   className="text-xs font-mono">
                                                                                {storage.storageChannel?.provider}
                                                                            </Badge>
                                                                        </div>
                                                                        <Badge variant="outline"
                                                                               className={`gap-1.5 ${getStatusColor(storage.status)}`}>
                                                                            {getStatusIcon(storage.status === "success")}
                                                                            <span
                                                                                className="capitalize">{storage.status.toUpperCase()}</span>
                                                                        </Badge>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </button>
                                                </SwiperSlide>
                                            )) ?? <p>No storages available</p>}
                                        </Swiper>
                                    </div>
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />

                    :
                    <Alert>
                        <AlertCircleIcon/>
                        <AlertTitle>Backup does not have files</AlertTitle>
                        <AlertDescription>
                            <p>You can safely delete the entire backup; no files seem to be related. Maybe an error
                                occurred.</p>
                        </AlertDescription>
                    </Alert>
                }

                <div className="flex flex-row items-center gap-x-4 w-full">
                    {action === "delete" && (
                        // <ButtonWithLoading
                        //     type="button"
                        //     variant="destructive"
                        //     onClick={() => mutationDeleteEntireBackup.mutateAsync()}
                        //     isPending={mutationDeleteEntireBackup.isPending}
                        //     disabled={mutationDeleteEntireBackup.isPending}
                        // >
                        //     Delete entire backup
                        // </ButtonWithLoading>
                        

                        <ButtonWithLoading 
                            type="button"
                            variant="destructive"
                            onClick={() => mutationDeleteEntireBackup.mutateAsync()}
                            isPending={mutationDeleteEntireBackup.isPending}
                            disabled={mutationDeleteEntireBackup.isPending}
                        >
                            Delete entire backup
                        </ButtonWithLoading>

                        // <ButtonWithConfirm
                        //     title={"Delete entire backup"}
                        //     description={"Are you sure you want to delete this entire backup?"}
                        //     button={{
                        //         main: {
                        //             type: "button",
                        //             variant: "destructive",
                        //             text: "Delete entire backup",
                        //         },
                        //         confirm: {
                        //             className: "w-full",
                        //             text: "Delete",
                        //             icon: <Trash2/>,
                        //             variant: "destructive",
                        //             onClick: async () => {
                        //                 mutationDeleteEntireBackup.mutateAsync()
                        //             },
                        //         },
                        //         cancel: {
                        //             className: "w-full",
                        //             text: "Cancel",
                        //             icon: <Trash2/>,
                        //             variant: "outline",
                        //         },
                        //     }}
                        //     isPending={mutationDeleteEntireBackup.isPending}
                        // />

                    )}

                    {filteredBackupStorages.length > 0 && (
                        <ButtonWithLoading
                            type="submit"
                            isPending={mutation.isPending}
                            disabled={mutation.isPending}
                            className="ml-auto"
                        >
                            Confirm
                        </ButtonWithLoading>

                    )}
                </div>
            </Form>
        </TooltipProvider>
    );
}
