"use client";

import { Card, CardContent } from "@/components/ui/card";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage, useZodForm } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DatabaseSchema, DatabaseType } from "@/features/database/database-form.schema";
import { updateDatabaseAction } from "@/features/database/database-form.action";
import { toast } from "sonner";

export type DatabaseFormProps = {
    defaultValues?: DatabaseType;
    databaseId?: string;
};

export const DatabaseForm = (props: DatabaseFormProps) => {
    const { defaultValues, databaseId } = props;

    const isCreate = !Boolean(defaultValues);

    const form = useZodForm({
        schema: DatabaseSchema,
        defaultValues: { ...defaultValues },
    });

    const router = useRouter();

    const mutation = useMutation({
        mutationFn: async (values: DatabaseType) => {
            if (!databaseId) {
                throw new Error("Database ID is required");
            }
            const database = await updateDatabaseAction({ id: databaseId, data: values });

            if (!database) {
                toast.error("Failed to update database");
                return;
            }
            if (database.serverError) {
                toast.error(database.serverError);
                return;
            }
            toast.success(`Database settings successfully updated!`);

            router.back();
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
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input disabled placeholder="Database 1" {...field} />
                                    </FormControl>
                                    <FormDescription>Your database project name setup in agent</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="dbms"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Database type</FormLabel>
                                    <FormControl>
                                        <Input disabled placeholder="PostgreSQL" {...field} />
                                    </FormControl>
                                    <FormDescription>Your database project name setup in agent</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Prod database for project 1" {...field} />
                                    </FormControl>
                                    <FormDescription>Add a short description about this database</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button>{isCreate ? `Create database` : `Save database`}</Button>
                    </Form>
                </CardContent>
            </Card>
        </TooltipProvider>
    );
};
