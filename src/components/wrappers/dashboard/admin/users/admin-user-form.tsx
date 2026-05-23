"use client";

import {useRouter} from "next/navigation";
import {useMutation} from "@tanstack/react-query";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage, useZodForm} from "@/components/ui/form";
import {Organization} from "@/db/schema/03_organization";
import {Input} from "@/components/ui/input";
import {ButtonWithLoading} from "@/components/common/button-with-loading";
import {Button} from "@/components/ui/button";
import {UserSchema, UserType} from "@/components/wrappers/dashboard/admin/users/user.schema";
import {toast} from "sonner";
import {createUserAction} from "@/components/wrappers/dashboard/admin/users/user.action";

type AdminUserFormProps = {
    onSuccess?: () => void;
    organizations: Organization[];
};

export const AdminUserForm = ({onSuccess, organizations}: AdminUserFormProps) => {


    const router = useRouter();
    const form = useZodForm({
        schema: UserSchema,
    });


    const onCancel = () => {
        form.reset();
        onSuccess?.();
    };

    const mutation = useMutation({
        mutationFn: async (data: UserType) => {
            const result = await createUserAction(data);
            const inner = result?.data;
            if (inner?.success) {
                toast.success("User Successfully created");
                onSuccess?.();
                router.refresh();
            } else {
                toast.error("An error occurred");
                onSuccess?.();
            }
        },
    });

    return (
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
                render={({field}) => (
                    <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                            <Input placeholder="Enter a name" {...field} value={field.value ?? ""}/>
                        </FormControl>
                        <FormMessage/>
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="email"
                render={({field}) => (
                    <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                            <Input placeholder="Fill user email" {...field} value={field.value ?? ""}/>
                        </FormControl>
                        <FormMessage/>
                    </FormItem>
                )}
            />


            <div className="flex gap-4 justify-end">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <ButtonWithLoading type="submit" isPending={mutation.isPending}>
                    Validate
                </ButtonWithLoading>
            </div>
        </Form>
    );
};
