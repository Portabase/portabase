"use client";

import {Card, CardContent, CardHeader} from "@/components/ui/card";
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    useZodForm
} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {Form} from "@/components/ui/form";
import {Button} from "@/components/ui/button";
import {useMutation} from "@tanstack/react-query";
import {useRouter} from "next/navigation";
import {MultiSelect} from "@/components/wrappers/common/multiselect/multi-select";
import {
    OrganizationFormSchema,
    OrganizationFormType
} from "@/components/wrappers/dashboard/organization/organization-form/organization-form.schema";
import {MemberWithUser, OrganizationWithMembers} from "@/db/schema/03_organization";
import {
    deleteOrganizationAction,
    updateOrganizationAction
} from "@/components/wrappers/dashboard/organization/organization.action";
import {toast} from "sonner";
import {User as BetterAuthUser} from "better-auth";
import {User} from "@/db/schema/02_user";
import {authClient} from "@/lib/auth/auth-client";

export type organizationFormProps = {
    defaultValues?: OrganizationWithMembers;
    users: User[];
    currentUser: BetterAuthUser;
};

export const OrganizationForm = (props: organizationFormProps) => {
    const {data: activeOrganization, refetch: refetchActiveOrga} = authClient.useActiveOrganization();
    const {data: organizations, refetch} = authClient.useListOrganizations();

    const router = useRouter();
    const isCreate = !Boolean(props.defaultValues);

    const formatUsersList = (users: User[]) => {

        return users
            .filter((user) => user.id !== props.currentUser.id)
            .map((user) => ({
                value: user.id,
                label: `${user.name} | ${user.email}`,
            }));
    };

    const formatDefaultUsers = (members: MemberWithUser[]): string[] => {
        return members
            .filter((member) => member.userId !== props.currentUser.id)
            .map((member) => member.userId);
    };

    const formattedDefaultValues = {
        name: props.defaultValues?.name,
        slug: props.defaultValues?.slug,
        users: !isCreate ? formatDefaultUsers(props.defaultValues?.members as MemberWithUser[]) : [],
    };

    const form = useZodForm({
        schema: OrganizationFormSchema,
        defaultValues: formattedDefaultValues,
    });

    const mutation = useMutation({
        mutationFn: (values: OrganizationFormType) => updateOrganizationAction({
            data: values,
            organizationId: props.defaultValues?.id ?? ""
        }),
        onSuccess: async (result) => {
            if (result?.data?.success) {
                toast.success(result.data.actionSuccess?.message || "Organization updated successfully.");
                refetch()
                refetchActiveOrga()
                router.push("/dashboard/settings");
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
        <Card>
            <CardHeader></CardHeader>
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
                        defaultValue=""
                        render={({field}) => (
                            <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Organization 1" {...field} />
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="slug"
                        defaultValue=""
                        render={({field}) => (
                            <FormItem>
                                <FormLabel>Slug</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="project-1"
                                        {...field}
                                        onChange={(e) => {
                                            const value = e.target.value.replaceAll(" ", "-").toLowerCase();
                                            field.onChange(value);
                                        }}
                                    />
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="users"
                        render={({field}) => (
                            <FormItem>
                                <FormLabel>Users</FormLabel>
                                <FormControl>
                                    <MultiSelect
                                        options={formatUsersList(props.users)}
                                        onValueChange={field.onChange}
                                        defaultValue={field.value ?? []}
                                        placeholder="Select users"
                                        variant="inverted"
                                        animation={2}
                                        // maxCount={100}
                                    />
                                </FormControl>
                                <FormDescription>Select users you want to add to this organization</FormDescription>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />
                    <Button>{isCreate ? `Create Organization` : `Update Organization`}</Button>
                </Form>
            </CardContent>
        </Card>
    );
};
