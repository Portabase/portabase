"use client";

import { useRouter } from "next/navigation";
import { ErrorContext } from "@better-fetch/fetch";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, useZodForm } from "@/components/ui/form";
import { OrganizationSchema } from "@/components/wrappers/dashboard/admin/organizations/organization/organization.schema";
import { ButtonWithLoading } from "@/components/common/button-with-loading";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth/auth-client";
import { slugify } from "@/utils/slugify";

type AdminOrganizationFormProps = {
    onSuccess?: () => void;
};

export const AdminOrganizationForm = ({ onSuccess }: AdminOrganizationFormProps) => {

    const router = useRouter();
    const form = useZodForm({ schema: OrganizationSchema });

    const mutationCreateOrganisation = useMutation({
        mutationFn: async ({ name }: OrganizationSchema) => {
            const slug = slugify(name);
            await authClient.organization.checkSlug(
                {
                    slug: slug,
                },
                {
                    onSuccess: async () => {
                        await authClient.organization.create(
                            {
                                name: name,
                                slug: slug,
                            },
                            {
                                onSuccess: () => {
                                    toast.success("Organization created successfully.");
                                    router.refresh();
                                    onSuccess?.();
                                },
                                onError: (error) => {
                                    toast.error(error.error.message);
                                },
                            }
                        );
                    },
                    onError: (error: ErrorContext) => {
                        toast.error(error.error.message);
                        onSuccess?.();
                    },
                }
            );
        },
    });

    return (
        <Form
            form={form}
            className="flex flex-col gap-4"
            onSubmit={async (values) => {
                await mutationCreateOrganisation.mutateAsync(values);
            }}
        >
            <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                            <Input placeholder="Name of your organization" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <div className="flex gap-4 justify-end">
                <ButtonWithLoading isPending={mutationCreateOrganisation.isPending}>Validate</ButtonWithLoading>
            </div>
        </Form>
    );
};
