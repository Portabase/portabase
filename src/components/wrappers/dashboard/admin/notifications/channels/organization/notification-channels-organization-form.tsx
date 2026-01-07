"use client";

import {useRouter} from "next/navigation";
import {useMutation} from "@tanstack/react-query";
import {Form, FormControl, FormField, FormItem, useZodForm} from "@/components/ui/form";
import {ButtonWithLoading} from "@/components/wrappers/common/button/button-with-loading";
import {OrganizationWithMembers} from "@/db/schema/03_organization";
import {NotificationChannelWith} from "@/db/schema/09_notification-channel";
import {
    NotificationChannelsOrganizationSchema,
    NotificationChannelsOrganizationType
} from "@/components/wrappers/dashboard/admin/notifications/channels/organization/notification-channels-organization.schema";
import {MultiSelect} from "@/components/wrappers/common/multiselect/multi-select";
import {
    updateNotificationChannelsOrganizationAction
} from "@/components/wrappers/dashboard/admin/notifications/channels/organization/notification-channels-organization.action";
import {toast} from "sonner";


type NotifierChannelOrganisationFormProps = {
    organizations?: OrganizationWithMembers[];
    defaultValues?: NotificationChannelWith
};

export const NotifierChannelOrganisationForm = ({
                                                    organizations,
                                                    defaultValues,
                                                }: NotifierChannelOrganisationFormProps) => {

    const router = useRouter();

    const defaultOrganizationIds = defaultValues?.organizations?.map(organization => organization.organizationId) ?? []


    const form = useZodForm({
        schema: NotificationChannelsOrganizationSchema,
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


    const mutationUpdateNotificationChannelOrganizations = useMutation({
        mutationFn: async (values: NotificationChannelsOrganizationType) => {

            const payload = {
                data: values.organizations,
                notificationChannelId: defaultValues?.id ?? ""
            };

            const result = await updateNotificationChannelsOrganizationAction(payload)
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
                await mutationUpdateNotificationChannelOrganizations.mutateAsync(values);
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
                    <ButtonWithLoading isPending={mutationUpdateNotificationChannelOrganizations.isPending}>
                        Save
                    </ButtonWithLoading>
                </div>

            </div>
        </Form>
    );
};
