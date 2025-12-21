"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormControl, FormField, FormItem, FormLabel, FormMessage, useZodForm } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UserSchema, UserType } from "@/components/wrappers/dashboard/profile2/user-form/user-form.schema";
import { toast } from "sonner";
import { updateUserAction } from "@/components/wrappers/dashboard/profile2/user-form/user-form.action";
import {DataTable} from "@/components/wrappers/common/table/data-table";
import {sessionsColumns} from "@/components/wrappers/dashboard/admin/users/sessions/table-columns";
import {accountsColumns} from "@/components/wrappers/dashboard/admin/users/accounts/table-columns";
import {Account, Session} from "better-auth";

export type UserFormProps = {
    defaultValues?: UserType;
    userId?: string;
    sessions: Session[];
    accounts?: Account[];
};

export const UserForm = (props: UserFormProps) => {
    const isCreate = !Boolean(props.defaultValues);

    const form = useZodForm({
        schema: UserSchema,
        defaultValues: props.defaultValues,
    });

    const router = useRouter();

    const mutation = useMutation({
        mutationFn: async (values: UserType) => {
            const updateUser = await updateUserAction({
                id: props.userId ?? "-",
                data: values,
            });

            const data = updateUser?.data?.data;
            if (updateUser?.serverError || !data) {
                toast.error(updateUser?.serverError);
                return;
            }

            toast.success(`Profile updated successfully.`);
            router.refresh();
            router.push(`/dashboard/profile`);
        },
    });

    return (
        <div className="flex flex-col gap-y-4 h-full py-4">
        <TooltipProvider>
            <Card>
                <CardHeader>
                    <CardTitle>Account</CardTitle>
                    <CardDescription>Your informations</CardDescription>
                </CardHeader>
                <CardContent>
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
                                        <Input placeholder={"Your Name"} {...field} />
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
                                        <Input placeholder={"exemple@portabase.com"} disabled {...field} value={field.value ?? ""} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button>{isCreate ? `` : `Save`}</Button>
                    </Form>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Active sessions</CardTitle>
                    <CardDescription>Manage your active sessions</CardDescription>
                </CardHeader>
                <CardContent>
                    <DataTable columns={sessionsColumns} data={props.sessions} enableSelect={false}/>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Auth providers</CardTitle>
                    <CardDescription>Manage your active auth providers</CardDescription>
                </CardHeader>
                <CardContent>
                    <DataTable columns={accountsColumns} data={props.accounts ?? []} enableSelect={false}/>
                </CardContent>
            </Card>
        </TooltipProvider>
        </div>
    );
};
