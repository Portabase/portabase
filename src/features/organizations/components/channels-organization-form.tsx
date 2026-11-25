"use client";

import {useRouter} from "next/navigation";
import {useMutation} from "@tanstack/react-query";
import {Form, FormControl, FormField, FormItem, useZodForm} from "@/components/ui/form";
import {ButtonWithLoading} from "@/components/common/button-with-loading";
import {OrganizationWithMembers} from "@/db/schema/03_organization";
import {NotificationChannelWith} from "@/db/schema/09_notification-channel";
import {MultiSelect} from "@/components/common/multi-select";

import {toast} from "sonner";
import {StorageChannelWith} from "@/db/schema/12_storage-channel";
import {
    ChannelsOrganizationSchema, ChannelsOrganizationType
} from "@/features/organizations/schemas/channels-organization.schema";
import {
    updateNotificationChannelsOrganizationAction, updateStorageChannelsOrganizationAction
} from "@/features/organizations/actions/channels-organization.action";
import {ChannelKind} from "@/features/channel/components/channels-helpers";
import {getOrganizationDisplayName} from "@/features/organizations/utils/get-organization-display-name";
import {useReportFormDirty} from "@/hooks/use-report-form-dirty";
import {Alert, AlertDescription} from "@/components/ui/alert";
import {AlertTriangle} from "lucide-react";


type ChannelOrganisationFormProps = {
    organizations?: OrganizationWithMembers[];
    defaultValues?: NotificationChannelWith | StorageChannelWith;
    channelId?: string;
    kind: ChannelKind
    onDirtyChange?: (dirty: boolean) => void;
    onSuccessAction?: () => void;
    submitLabel?: string;
    showEmptySelectionWarning?: boolean;
};

export const ChannelOrganisationForm = ({
                                            organizations,
                                            defaultValues,
                                            channelId,
                                            kind,
                                            onDirtyChange,
                                            onSuccessAction,
                                            submitLabel = "Save",
                                            showEmptySelectionWarning = false,
                                        }: ChannelOrganisationFormProps) => {

    const router = useRouter();

    const defaultOrganizationIds = defaultValues?.organizations?.map(organization => organization.organizationId) ?? []

    const form = useZodForm({
        schema: ChannelsOrganizationSchema,
        defaultValues: {
            organizations: defaultOrganizationIds
        },
    });
    useReportFormDirty(form, onDirtyChange);

    const formatOrganizationsList = (organizations: OrganizationWithMembers[]) => {
        return organizations
            .map((organization) => ({
                value: organization.id,
                label: getOrganizationDisplayName(organization),
            }));
    };


    const mutationUpdateChannelOrganizations = useMutation({
        mutationFn: async (values: ChannelsOrganizationType) => {

            const payload = {
                data: values.organizations,
                id: channelId ?? defaultValues?.id ?? ""
            };

            const result = kind === "notification" ? await updateNotificationChannelsOrganizationAction(payload) : await updateStorageChannelsOrganizationAction(payload)
            const inner = result?.data;

            if (inner?.success) {
                toast.success(inner.actionSuccess?.message);
                form.reset(form.getValues());
                router.refresh();
                onSuccessAction?.();
            } else {
                toast.error(inner?.actionError?.message);
            }
        }
    });


    const selectedOrganizations = form.watch("organizations");

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

            {showEmptySelectionWarning && selectedOrganizations.length === 0 && (
                <Alert>
                    <AlertTriangle className="h-4 w-4"/>
                    <AlertDescription>
                        No organization selected. This channel cannot be used by a policy at project or data source level.
                    </AlertDescription>
                </Alert>
            )}

            <div className="flex justify-end">
                <ButtonWithLoading isPending={mutationUpdateChannelOrganizations.isPending}>
                    {submitLabel}
                </ButtonWithLoading>
            </div>
        </Form>
    );
};
