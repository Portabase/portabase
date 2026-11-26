"use client";

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage, useZodForm } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ProjectSchema, ProjectType } from "@/features/projects/schemas/projects.schema";
import { createProjectAction, updateProjectAction } from "@/features/projects/actions/projects.action";
import { useRouter } from "next/navigation";
import { MultiSelect } from "@/components/common/multi-select";
import { toast } from "sonner";
import {DatabaseWith} from "@/db/schema/07_database";
import {Organization} from "@/db/schema/03_organization";
import {useReportFormDirty} from "@/hooks/use-report-form-dirty";
import { Switch } from "@/components/ui/switch";
import type { EncryptionLevel } from "@/features/database/utils/policy-resolution";

export type projectFormProps = {
    defaultValues?: ProjectType;
    databases: DatabaseWith[];
    organization: Organization;
    projectId?: string;
    onSuccess?: (data: any) => void;
    onDirtyChange?: (dirty: boolean) => void;
    encryptionEnforcedBy: EncryptionLevel | null;
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
        name: props.defaultValues?.name ?? "",
        databases: !isCreate ? formatDefaultDatabases(props.defaultValues?.databases ?? []) : [],
        encryption: props.defaultValues?.encryption ?? false,
    };

    const form = useZodForm({
        schema: ProjectSchema,
        defaultValues: formattedDefaultValues,
    });
    useReportFormDirty(form, props.onDirtyChange);

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
                                        modalPopover={true}
                                    />
                                </FormControl>
                                <FormDescription>Select databases you want to add to this project</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="encryption"
                        render={({ field }) => (
                            <FormItem>
                                <div className="flex items-center gap-2">
                                    <FormLabel>Encrypt backups</FormLabel>
                                    <FormControl>
                                        <Switch
                                            checked={field.value || props.encryptionEnforcedBy !== null}
                                            disabled={props.encryptionEnforcedBy !== null}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </div>
                                <FormDescription>
                                    {props.encryptionEnforcedBy
                                        ? `Enforced by ${props.encryptionEnforcedBy}`
                                        : "Applies to every database in this project"}
                                </FormDescription>
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
