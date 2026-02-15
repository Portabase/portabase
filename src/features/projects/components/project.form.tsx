"use client";

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage, useZodForm } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ProjectSchema, ProjectType } from "@/features/projects/projects.schema";
import { createProjectAction, updateProjectAction } from "@/features/projects/projects.action";
import { useRouter } from "next/navigation";
import { MultiSelect } from "@/components/wrappers/common/multiselect/multi-select";
import { toast } from "sonner";
import {DatabaseWith} from "@/db/schema/07_database";
import {Organization} from "@/db/schema/03_organization";

export type projectFormProps = {
    defaultValues?: ProjectType;
    databases: DatabaseWith[];
    organization: Organization;
    projectId?: string;
    onSuccess?: (data: any) => void;
};


export const ProjectForm = (props: projectFormProps) => {
    const router = useRouter();
    const queryClient = useQueryClient();
    const isCreate = !Boolean(props.defaultValues);
    const formatDatabasesList = (databases: DatabaseWith[]) => {
        return databases.map((database) => ({
            value: database.id,
            label: `${database.name} | ${database.agent?.name}`,
        }));
    };

    const formatDefaultDatabases = (databases: string[]): string[] => {
        return databases;
    };

    const formattedDefaultValues = {
        ...props.defaultValues,
        databases: !isCreate ? formatDefaultDatabases(props.defaultValues?.databases ?? []) : [],
    };

    const form = useZodForm({
        schema: ProjectSchema,
        defaultValues: formattedDefaultValues,
    });

    const mutation = useMutation({
        mutationFn: async (values: ProjectType) => {
            if (!isCreate && !props.projectId) {
                throw new Error("Project ID is required for updates");
            }
            const project = isCreate
                ? await createProjectAction({
                      data: values,
                      organizationId: props.organization.id,
                  })
                : await updateProjectAction({
                      data: values,
                      organizationId: props.organization.id,
                      projectId: props.projectId!,
                  });

            if (project && project.data) {
                if (project.data.success) {
                    project.data.actionSuccess && toast.success(project.data.actionSuccess.message);
                    
                    if (!isCreate && values.databases) {
                        values.databases.forEach(dbId => {
                            queryClient.invalidateQueries({ queryKey: ["database-data", dbId] });
                        });
                    }

                    if (props.onSuccess) {
                        props.onSuccess(project.data.value);
                    } else {
                        router.push(`/dashboard/projects/${project.data.value!.id}`);
                    }
                } else {
                    project.data.actionError && toast.error(project.data.actionError.message || "Unknown error occurred.");
                }
            } else {
                toast.error("Failed to process request. No response received.");
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
                                    <Input placeholder="Project 1" {...field} value={field.value ?? ""} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="databases"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Databases</FormLabel>
                                <FormControl>
                                    <MultiSelect
                                        options={formatDatabasesList(props.databases)}
                                        onValueChange={field.onChange}
                                        defaultValue={field.value ?? []}
                                        placeholder="Select databases"
                                        variant="inverted"
                                        animation={2}
                                        // maxCount={100}
                                    />
                                </FormControl>
                                <FormDescription>Select databases you want to add to this project</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="flex justify-end">
                        <Button type="submit">
                            {isCreate ? "Create" : "Update"}
                        </Button>
                    </div>
                </Form>
    );
};
