"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, useZodForm } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ButtonWithLoading } from "@/components/wrappers/common/button/button-with-loading";
import {Button} from "@/components/ui/button";
import {UserEditSchema, UserEditType, UserSchema} from "@/components/wrappers/dashboard/admin/users/user.schema";
import {updateUserAction} from "@/components/wrappers/dashboard/admin/users/user.action";
type AdminUserEditFormProps = {
    onSuccess?: () => void;
    defaultValues: {
        id: string;
    } & UserEditType;
};

export const AdminUserEditForm = ({ onSuccess, defaultValues }: AdminUserEditFormProps) => {


    const router = useRouter();
    const form = useZodForm({
        schema: defaultValues ? UserEditSchema : UserSchema,
        defaultValues: {
            name: defaultValues.name,
            email: defaultValues.email,
        },
    });

    const onCancel = () => {
        form.reset();
        onSuccess?.();
    };

    const mutation = useMutation({
        mutationFn: async (data: UserEditType) => {
            const result = await updateUserAction({
                ...data,
                id: defaultValues?.id || "",
            });
            const inner = result?.data;
            if (inner?.success) {
                toast.success("User Successfully updated");
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
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                            <Input placeholder="Enter a name" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}

                name="email"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                            <Input disabled placeholder="Fill user email" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <div className="flex gap-4 justify-end">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <ButtonWithLoading type="submit" isPending={mutation.isPending}>Validate</ButtonWithLoading>
            </div>
        </Form>
    );
};
