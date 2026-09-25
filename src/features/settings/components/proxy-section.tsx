"use client";

import {useMutation} from "@tanstack/react-query";
import {useRouter} from "next/navigation";
import {toast} from "sonner";
import {ButtonWithLoading} from "@/components/common/button-with-loading";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    useZodForm,
} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import type {Setting} from "@/db/schema/01_setting";
import {updateProxySettingsAction} from "@/features/settings/actions/proxy.action";
import {
    ProxySettingsSchema,
    type ProxySettingsType,
} from "@/features/settings/schemas/proxy.schema";

export const SettingsProxySection = ({settings}: {settings: Setting}) => {
    const router = useRouter();
    const form = useZodForm({
        schema: ProxySettingsSchema,
        defaultValues: {httpProxy: settings.httpProxy ?? ""},
    });

    const mutation = useMutation({
        mutationFn: async (values: ProxySettingsType) => {
            const result = await updateProxySettingsAction({
                name: "system",
                data: values,
            });
            const data = result?.data?.data;
            if (result?.serverError || !data) {
                throw new Error(result?.serverError || "Unable to update proxy settings");
            }
            return data;
        },
        onSuccess: (data) => {
            form.reset({httpProxy: data.httpProxy ?? ""});
            toast.success("HTTP proxy settings updated");
            router.refresh();
        },
        onError: (error) => toast.error(error.message),
    });

    return (
        <Form
            form={form}
            className="flex flex-col gap-4 py-4"
            onSubmit={(values) => mutation.mutateAsync(values)}
        >
            <FormField
                control={form.control}
                name="httpProxy"
                render={({field}) => (
                    <FormItem>
                        <FormLabel>HTTP proxy URL</FormLabel>
                        <FormControl>
                            <Input
                                type="url"
                                placeholder="http://user:password@proxy.example.com:8080"
                                autoComplete="off"
                                {...field}
                            />
                        </FormControl>
                        <FormDescription>
                            Used by storage and notification services. Leave empty to connect directly.
                        </FormDescription>
                        <FormMessage/>
                    </FormItem>
                )}
            />
            <div className="flex justify-end">
                <ButtonWithLoading
                    type="submit"
                    isPending={mutation.isPending}
                    disabled={!form.formState.isDirty}
                >
                    Save
                </ButtonWithLoading>
            </div>
        </Form>
    );
};
