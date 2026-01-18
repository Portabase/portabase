"use client";

import {useRouter} from "next/navigation";
import {useMutation} from "@tanstack/react-query";
import {Form, FormControl, FormField, FormItem, useZodForm} from "@/components/ui/form";
import {ButtonWithLoading} from "@/components/wrappers/common/button/button-with-loading";
import {OrganizationWithMembers} from "@/db/schema/03_organization";
import {NotificationChannelWith} from "@/db/schema/09_notification-channel";
import {MultiSelect} from "@/components/wrappers/common/multiselect/multi-select";

import {toast} from "sonner";
import {StorageChannelWith} from "@/db/schema/12_storage-channel";
import {
    ChannelsOrganizationSchema, ChannelsOrganizationType
} from "@/components/wrappers/dashboard/admin/channels/organization/channels-organization.schema";
import {
    updateNotificationChannelsOrganizationAction, updateStorageChannelsOrganizationAction
} from "@/components/wrappers/dashboard/admin/channels/organization/channels-organization.action";
import {ChannelKind} from "@/components/wrappers/dashboard/admin/channels/helpers/common";


type ChannelOrganisationFormProps = {
    organizations?: OrganizationWithMembers[];
    defaultValues?: NotificationChannelWith | StorageChannelWith
    kind: ChannelKind
};

export const ChannelOrganisationForm = ({
                                            organizations,
                                            defaultValues,
                                            kind
                                        }: ChannelOrganisationFormProps) => {

    const router = useRouter();

    const defaultOrganizationIds = defaultValues?.organizations?.map(organization => organization.organizationId) ?? []


    const form = useZodForm({
        schema: ChannelsOrganizationSchema,
        // @ts-ignore
        defaultValues: {
            organizations: defaultOrganizationIds
        },
    });

    const formatOrganizationsList = (organizations: OrganizationWithMembers[]) => {
        return organizations
            .map((organization) => ({
                value: organization.id,
                label: `${organization.name}`,
            }));
    };


    const mutationUpdateChannelOrganizations = useMutation({
        mutationFn: async (values: ChannelsOrganizationType) => {

            const payload = {
                data: values.organizations,
                id: defaultValues?.id ?? ""
            };

            const result = kind === "notification" ? await updateNotificationChannelsOrganizationAction(payload) : await updateStorageChannelsOrganizationAction(payload)
            const inner = result?.data;

            if (inner?.success) {
                toast.success(inner.actionSuccess?.message);
                router.refresh();
            } else {
                toast.error(inner?.actionError?.message);
            }
        }
    });


    return (

        <Form
            form={form}
            className="flex flex-col gap-4"
            onSubmit={async (values) => {
                await mutationUpdateChannelOrganizations.mutateAsync(values);
            }}
        >
            <FormField
                control={form.control}
                name={`organizations`}
                render={({field}) => (
                    <FormItem>
                        <FormControl>
                            <MultiSelect
                                options={formatOrganizationsList(organizations ?? [])}
                                onValueChange={field.onChange}
                                defaultValue={field.value ?? []}
                                placeholder="Select organization(s)"
                                variant="inverted"
                                animation={0}
                            />
                        </FormControl>
                    </FormItem>
                )}
            />

            <div className="flex justify-end">
                <div className="flex gap-2 justify-end">
                    <ButtonWithLoading isPending={mutationUpdateChannelOrganizations.isPending}>
                        Save
                    </ButtonWithLoading>
                </div>

            </div>
        </Form>
    );
};
