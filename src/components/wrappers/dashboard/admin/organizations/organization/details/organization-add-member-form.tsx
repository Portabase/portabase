"use client";

import {useRouter} from "next/navigation";
import {useMutation} from "@tanstack/react-query";

import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage, useZodForm} from "@/components/ui/form";
import {
    AddMemberSchema,
    AddMemberSchemaType
} from "@/components/wrappers/dashboard/admin/organizations/organization/organization.schema";
import {SearchInput} from "@/components/ui/search-input";
import {
    addMemberOrganizationAction
} from "@/components/wrappers/dashboard/admin/organizations/organization/details/add-member.action";
import {toast} from "sonner";
import {OrganizationWithMembers, OrganizationWithMembersAndUsers} from "@/db/schema/03_organization";
import {User} from "@/db/schema/02_user";
import {ButtonWithLoading} from "@/components/wrappers/common/button/button-with-loading";

type OrganizationAddMemberFormProps = {
    onSuccessAction?: () => void;
    users: User[];
    organization: OrganizationWithMembersAndUsers;
};

export const OrganizationAddMemberForm = ({onSuccessAction, users, organization}: OrganizationAddMemberFormProps) => {

    const organizationMemberUserIds = organization.members.map((member) => member.user.id);
    const filteredUsers = users
        .filter((user) => !organizationMemberUserIds.includes(user.id))
        .map((user) => ({value: user.id, label: `${user.name} | ${user.email}`}));
    const router = useRouter();
    const form = useZodForm({schema: AddMemberSchema});

    const mutationAddMemberOrganisation = useMutation({
        mutationFn: async (data: AddMemberSchemaType) => {
            const result = await addMemberOrganizationAction({
                userId: data.userId,
                organizationId: organization.id,
                role: "member",
            });
            toast.success("Member successfully added!");
            router.refresh();
            onSuccessAction?.();
        },
        onError: (error) => {
            toast.error(error.message);
            onSuccessAction?.();
        },
    });

    return (
        <Form
            form={form}
            className="flex flex-col gap-4"
            onSubmit={async (values) => {
                await mutationAddMemberOrganisation.mutateAsync(values);
            }}
        >
            <FormField
                control={form.control}
                name="userId"
                render={({field}) => (
                    <FormItem>
                        <FormLabel>User</FormLabel>
                        <FormControl>
                            <SearchInput
                                name="userId"
                                placeholder="Enter a user email"
                                entries={filteredUsers}
                                onSelect={(entySelected: any) => {
                                    field.onChange(entySelected.value);
                                }}
                            />
                        </FormControl>
                        <FormMessage/>
                    </FormItem>
                )}
            />

            <div className="flex gap-4 justify-end">
                <ButtonWithLoading
                    isPending={mutationAddMemberOrganisation.isPending}>Confirm</ButtonWithLoading>
            </div>
        </Form>
    );
};
