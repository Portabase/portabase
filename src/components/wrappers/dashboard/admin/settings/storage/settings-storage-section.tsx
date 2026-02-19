"use client"
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert";
import {Info} from "lucide-react";
import {ButtonWithLoading} from "@/components/wrappers/common/button/button-with-loading";
import {useRouter} from "next/navigation";
import {Setting} from "@/db/schema/01_setting";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    useZodForm
} from "@/components/ui/form";
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
import {Switch} from "@/components/ui/switch";
import {downloadMasterKeyAction} from "@/features/keys/keys.action";

export type SettingsStorageSectionProps = {
    settings: Setting;
    storageChannels: StorageChannelWith[];
};

export const SettingsStorageSection = ({settings, storageChannels}: SettingsStorageSectionProps) => {
    const router = useRouter();

    const form = useZodForm({
        schema: DefaultStorageSchema,
        defaultValues: {
            storageChannelId: settings.defaultStorageChannelId ?? undefined,
            encryption: settings.encryption ?? false
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


    const handleDownload = async () => {
        const result = await downloadMasterKeyAction();

        if (!result?.success) {
            toast.error(result?.message ?? "Download failed");
            return;
        }

        const byteCharacters = atob(result.data as string);
        const byteNumbers = new Array(byteCharacters.length)
            .fill(null)
            .map((_, i) => byteCharacters.charCodeAt(i));

        const blob = new Blob([new Uint8Array(byteNumbers)], {
            type: "application/octet-stream",
        });

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "master_key.bin";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="flex flex-col h-full">
            <Alert className="mt-3">
                <Info className="h-4 w-4"/>
                <AlertTitle>Informations</AlertTitle>
                <AlertDescription>
                    The default storage channel will be used by default to store your backups if no storage policy is
                    configured at the database level. </AlertDescription>
            </Alert>
            <div className="flex flex-col h-full py-4 gap-3">
                <Form
                    className="space-y-4"
                    form={form}
                    onSubmit={async (values) => {
                        await mutation.mutateAsync(values);
                    }}
                >
                    <div className="flex flex-wrap items-center gap-3">
                        <FormField
                            control={form.control}
                            name="storageChannelId"
                            render={({field}) => (
                                <FormItem className="flex-grow min-w-[200px] sm:flex-grow-0 sm:w-64">
                                    <FormLabel>Default Storage Provider</FormLabel>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <SelectTrigger className="w-full h-full mb-0">
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
                        <FormField
                            control={form.control}
                            name="encryption"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>Backups Encryption</FormLabel>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                    </div>

                    <ButtonWithLoading className="flex-shrink-0 w-full sm:w-auto" type="submit">
                        Confirm
                    </ButtonWithLoading>
                </Form>

                <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium ">
                        Download instance <button
                        type="button"
                        onClick={handleDownload}
                        className="text-sm hover:text-muted-foreground underline underline-offset-4 transition-colors w-fit"
                    >
                        Master Key
                    </button>
                    </span>
                </div>
            </div>
        </div>
    );
};
