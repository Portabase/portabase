"use client";

import {useMutation} from "@tanstack/react-query";

import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage, useZodForm} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {CreateOrganizationSchema, CreateOrganizationType} from "@/features/organization/organization.schema";
import {createOrganizationAction} from "@/features/organization/organization.action";
import {useRouter} from "next/navigation";
import {useState} from "react";
import {authClient} from "@/lib/auth/auth-client";
import {toast} from "sonner";

export type createOrganizationModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
    redirect?: string;

};

export function CreateOrganizationModal({
                                            open,
                                            onOpenChange,
                                            onSuccess,
                                            redirect = "/dashboard/home"
                                        }: createOrganizationModalProps) {


    const router = useRouter();

    const form = useZodForm({
        schema: CreateOrganizationSchema,
    });


    const mutation = useMutation({
        mutationFn: async (values: CreateOrganizationType) => {

            const result = await createOrganizationAction(values);

            if (result?.data?.success && result.data.value) {
                onOpenChange(false);
                await authClient.organization.setActive({organizationSlug: result.data.value.slug});
                onSuccess?.();
                toast.success(result.data.actionSuccess?.message || "Organization Created.");
                form.reset()
                router.replace(redirect);
            } else {
                // @ts-ignore
                const errorMsg = result?.data?.actionError?.message || result?.data?.actionError?.messageParams?.message || "Failed to create the organization.";
                toast.error(errorMsg);
            }

        },
    });

    return (
        <Dialog open={open} onOpenChange={(state) => {
            form.reset()
            onOpenChange(state)
        }}>
            <DialogContent className="sm:max-w-[425px] w-full">
                <DialogHeader>
                    <DialogTitle>Create a new organization</DialogTitle>
                </DialogHeader>

                <div className="sm:max-w-[375px] w-full">
                    <Form
                        form={form}
                        className="flex flex-col gap-4"
                        onSubmit={async (values) => {
                            await mutation.mutateAsync(values);
                        }}
                    >
                        <FormField
                            control={form.control}
                            name="name"
                            defaultValue=""
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <div className="flex items-center justify-between w-full">
                                <Button type="submit">Create</Button>
                            </div>
                        </DialogFooter>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
