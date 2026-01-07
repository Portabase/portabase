"use client";

import { Card, CardContent } from "@/components/ui/card";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage, useZodForm } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";

import { S3FormSchema, S3FormType } from "@/components/wrappers/dashboard/admin/settings/storage/storage-s3/s3-form.schema";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateS3SettingsAction } from "@/components/wrappers/dashboard/admin/settings/storage/storage-s3/s3-form.action";
import {PasswordInput} from "@/components/ui/password-input";

export type S3FormProps = {
    defaultValues?: S3FormType;
};

export const StorageS3Form = (props: S3FormProps) => {
    const form = useZodForm({
        schema: S3FormSchema,
        defaultValues: props.defaultValues,
    });

    const router = useRouter();

    const mutation = useMutation({
        mutationFn: async (values: S3FormType) => {
            const updateS3Settings = await updateS3SettingsAction({ name: "system", data: values });
            const data = updateS3Settings?.data?.data;
            if (updateS3Settings?.serverError || !data) {
                toast.error(updateS3Settings?.serverError);
                return;
            }
            toast.success(`Success updating storage informations`);
            router.refresh();
        },
    });

    return (
        <TooltipProvider>
            <Card>
                <CardContent>
                    <Form
                        form={form}
                        className="flex flex-col gap-4 mt-3"
                        onSubmit={async (values) => {
                            await mutation.mutateAsync(values);
                        }}
                    >
                        <FormField
                            control={form.control}
                            name="s3EndPointUrl"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Endpoint Url *</FormLabel>
                                    <FormControl>
                                        <Input placeholder={"s3.eu-west-3.amazonaws.com"} {...field} />
                                    </FormControl>
                                    <FormDescription>{"Your s3 compatible url"}</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="s3AccessKeyId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Access Key *</FormLabel>
                                    <FormControl>
                                        <Input placeholder={"The access key token"} {...field} />
                                    </FormControl>
                                    <FormDescription>{"Add your access key"}</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="s3SecretAccessKey"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Secret Key *</FormLabel>
                                    <FormControl>
                                        <PasswordInput placeholder={"The secret key token"} {...field} />
                                    </FormControl>
                                    <FormDescription>{"Add your secret key"}</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="S3BucketName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Bucket name *</FormLabel>
                                    <FormControl>
                                        <Input placeholder={"my-bucket"} {...field} />
                                    </FormControl>
                                    <FormDescription>{"The bucket name where you want to store your data"}</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex justify-end gap-4">
                            <Button>Save</Button>
                        </div>
                    </Form>
                </CardContent>
            </Card>
        </TooltipProvider>
    );
};
