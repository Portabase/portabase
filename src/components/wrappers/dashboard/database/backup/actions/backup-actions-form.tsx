"use client"
import {BackupWith} from "@/db/schema/07_database";
import React, {useState} from "react";
import {Swiper, SwiperSlide} from "swiper/react";

import "swiper/css";
import "swiper/css/pagination";

import {Pagination, Mousewheel} from "swiper/modules";
import {DatabaseActionKind} from "@/components/wrappers/dashboard/database/backup/backup-modal-context";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage, useZodForm} from "@/components/ui/form";
import {
    BackupActionsSchema,
    BackupActionsType
} from "@/components/wrappers/dashboard/database/backup/actions/backup-actions.schema";
import {ButtonWithLoading} from "@/components/wrappers/common/button/button-with-loading";
import {useMutation} from "@tanstack/react-query";
import {BackupStorageWith} from "@/db/schema/14_storage-backup";
import {TooltipProvider} from "@/components/ui/tooltip";
import {getChannelIcon} from "@/components/wrappers/dashboard/admin/channels/helpers/common";
import {truncateWords} from "@/utils/text";
import {useIsMobile} from "@/hooks/use-mobile";
import {Badge} from "@/components/ui/badge";
import {getStatusColor, getStatusIcon} from "@/components/wrappers/dashboard/admin/notifications/logs/columns";
import {downloadBackupAction} from "@/components/wrappers/dashboard/database/backup/actions/backup-actions.action";
import {toast} from "sonner";

type BackupActionsFormProps = {
    backup: BackupWith;
    action: DatabaseActionKind;
}

export const BackupActionsForm = ({backup, action}: BackupActionsFormProps) => {
    const isMobile = useIsMobile();

    const form = useZodForm({
        schema: BackupActionsSchema,
    });

    const mutation = useMutation({
        mutationFn: async (values: BackupActionsType) => {
            // implement your mutation logic here
            console.log(values);

            const result = await downloadBackupAction({backupStorageId: values.backupStorageId})

            const inner = result?.data;

            console.log(inner);


            if (inner?.success) {
                toast.success(inner.actionSuccess?.message);
            } else {
                toast.error(inner?.actionError?.message);
            }


        },
    });


    return (
        <TooltipProvider>


            {action == "delete" ?
                <>
                </>
                :
                <Form
                    form={form}
                    className="flex flex-col gap-4 mb-1"
                    onSubmit={async (values) => {
                        await mutation.mutateAsync(values);
                    }}
                >
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
                                            {backup.storages?.map((storage: BackupStorageWith) => (
                                                <SwiperSlide key={storage.id}>
                                                    <button
                                                        type="button"
                                                        onClick={() => field.onChange(storage.id)}
                                                        className={`w-full h-full flex items-start gap-3 p-4 rounded-lg border text-left transition-colors ${
                                                            field.value === storage.id
                                                                ? "border-foreground bg-background"
                                                                : "border-border bg-background hover:border-muted-foreground"
                                                        }`}
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
                                                                            <h3 className="font-medium text-foreground">{isMobile ? truncateWords(storage?.storageChannel?.name ?? "", 2) : storage.storageChannel?.name}</h3>
                                                                            <Badge variant="secondary"
                                                                                   className="text-xs font-mono">
                                                                                {storage.storageChannel?.provider}
                                                                            </Badge>
                                                                        </div>
                                                                        <Badge variant="outline"
                                                                               className={`gap-1.5 ${getStatusColor(storage.status)}`}>
                                                                            {getStatusIcon(storage.status === "success")}
                                                                            <span
                                                                                className="capitalize">  {storage.status.toUpperCase()}</span>
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
                    <div className="flex flex-col items-center gap-y-6 w-full">
                        <ButtonWithLoading className="mt-2 w-full" isPending={mutation.isPending} disabled={mutation.isPending }>
                            Confirm
                        </ButtonWithLoading>
                    </div>
                </Form>
            }

        </TooltipProvider>
    );
}
