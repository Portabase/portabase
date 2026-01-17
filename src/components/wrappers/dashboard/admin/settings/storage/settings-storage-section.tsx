"use client"
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert";
import {Info} from "lucide-react";
import {ButtonWithLoading} from "@/components/wrappers/common/button/button-with-loading";
import {useRouter} from "next/navigation";
import {Setting} from "@/db/schema/01_setting";
import {Form, FormField, FormItem, useZodForm} from "@/components/ui/form";
import {StorageChannelWith} from "@/db/schema/12_storage-channel";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {useMutation} from "@tanstack/react-query";
import {
    DefaultStorageSchema,
    DefaultStorageType
} from "@/components/wrappers/dashboard/admin/settings/storage/settings-storage.schema";
import {getChannelIcon} from "@/components/wrappers/dashboard/admin/channels/helpers/common";
import {
    updateStorageSettingsAction
} from "@/components/wrappers/dashboard/admin/settings/storage/settings-storage.action";
import {toast} from "sonner";

export type SettingsStorageSectionProps = {
    settings: Setting;
    storageChannels: StorageChannelWith[];
};

export const SettingsStorageSection = ({settings, storageChannels}: SettingsStorageSectionProps) => {
    const router = useRouter();

    const form = useZodForm({
        schema: DefaultStorageSchema,
        defaultValues: {
            storageChannelId: settings.defaultStorageChannelId ?? undefined
        }
    });


    const mutation = useMutation({
        mutationFn: async (values: DefaultStorageType) => {
            const result = await updateStorageSettingsAction({name: "system", data: values})
            const inner = result?.data;

            if (inner?.success) {
                toast.success(inner.actionSuccess?.message);
                router.refresh();
            } else {
                toast.error(inner?.actionError?.message);
            }
        }
    });

    return (
        <div className="flex flex-col h-full">
            <Alert className="mt-3">
                <Info className="h-4 w-4"/>
                <AlertTitle>Informations</AlertTitle>
                <AlertDescription>
                    The default storage channel will be used by default to store your backups if no storage policy is
                    configured at the database level. </AlertDescription>
            </Alert>
            <div className="flex flex-col h-full  py-4 ">
                <Form
                    form={form}
                    onSubmit={async (values) => {
                        await mutation.mutateAsync(values);
                    }}
                >
                    <div className="flex items-center gap-3">
                        <FormField
                            control={form.control}
                            name="storageChannelId"
                            render={({field}) => (
                                <FormItem className="flex items-center  justify-center">
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <SelectTrigger className="w-90 h-full  mb-0">
                                            <SelectValue placeholder="Select a default storage channel"/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {storageChannels.map((channel) => (
                                                <SelectItem key={channel.id} value={channel.id}>
                                                    <div className="flex items-center gap-2">
                                                        {getChannelIcon(channel.provider)}
                                                        <span className="font-medium">{channel.name}</span>
                                                        <span
                                                            className="text-[9px] uppercase bg-secondary px-1.5 py-0.5 rounded">
                                                            {channel.provider}
                                                        </span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )}
                        />
                        <ButtonWithLoading type="submit">
                            Confirm
                        </ButtonWithLoading>
                    </div>
                </Form>
            </div>
        </div>
    );
};
