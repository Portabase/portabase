"use client";

import {useRouter} from "next/navigation";
import {useMutation} from "@tanstack/react-query";

import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage, useZodForm} from "@/components/ui/form";
import {
    UpdateOrganizationSchema,
    UpdateOrganizationSchemaType
} from "@/components/wrappers/dashboard/admin/organizations/organization/organization.schema";
import {ButtonWithLoading} from "@/components/wrappers/common/button/button-with-loading";
import {Input} from "@/components/ui/input";
import {authClient} from "@/lib/auth/auth-client";
import {toast} from "sonner";
import {OrganizationWithMembersAndUsers} from "@/db/schema/03_organization";
import {updateOrganizationAction} from "@/features/organization/organization.action";

type UpdateOrganizationFormProps = {
    onSuccessAction?: () => void;
    defaultValues: OrganizationWithMembersAndUsers;
};

export const UpdateOrganizationForm = ({onSuccessAction, defaultValues}: UpdateOrganizationFormProps) => {

    const router = useRouter();
    const {data: organizations, refetch} = authClient.useListOrganizations();

    const isDefaultOrganization = defaultValues.slug == "default";

    const form = useZodForm({
        schema: UpdateOrganizationSchema,
        defaultValues: defaultValues,
        disabled: isDefaultOrganization,
    });


    const mutationUpdateOrganisation = useMutation({
        mutationFn: ({name}: UpdateOrganizationSchemaType) => updateOrganizationAction({
            data: {
                name: name,
                users: [],
                slug: defaultValues.slug
            },
            organizationId: defaultValues.id,
        }),
        onSuccess: async (result) => {
            if (result?.data?.success) {
                toast.success("Organization updated successfully.");
                router.refresh();
                refetch()
            } else {
                // @ts-ignore
                const errorMsg = result?.data?.actionError?.message || result?.data?.actionError?.messageParams?.message || "Failed to update the organization.";
                toast.error(errorMsg);
            }
        },
        onError: (error: any) => {
            console.error("Mutation network error:", error);
            toast.error(error?.message || "A network error occurred.");
        },
    });


    return (
        <Form
            form={form}
            className="flex flex-col gap-4"
            onSubmit={async (values) => {
                await mutationUpdateOrganisation.mutateAsync(values);
            }}
        >
            <FormField
                control={form.control}
                name="name"
                render={({field}) => (
                    <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                            <Input placeholder="" {...field} value={field.value ?? ""}/>
                        </FormControl>
                        <FormMessage/>
                    </FormItem>
                )}
            />

            <div className="flex gap-4 justify-end">
                <ButtonWithLoading disabled={isDefaultOrganization} isPending={mutationUpdateOrganisation.isPending}>Validate</ButtonWithLoading>
            </div>
        </Form>
    );
};
