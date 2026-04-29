"use client";

import {useRouter} from "next/navigation";
import {useMutation} from "@tanstack/react-query";
import {Form, FormControl, FormField, FormItem, useZodForm} from "@/components/ui/form";
import {ButtonWithLoading} from "@/components/wrappers/common/button/button-with-loading";
import {OrganizationWithMembers} from "@/db/schema/03_organization";
import {MultiSelect} from "@/components/wrappers/common/multiselect/multi-select";
import {toast} from "sonner";
import {AgentWith} from "@/db/schema/08_agent";
import {AgentOrganizationSchema, AgentOrganizationType} from "@/features/agents/components/agent-organizations.schema";
import {updateAgentOrganizationsAction} from "@/features/agents/components/agent-organizations.action";


type AgentOrganisationFormProps = {
    organizations?: OrganizationWithMembers[];
    defaultValues?: AgentWith
};

export const AgentOrganisationForm = ({
                                          organizations,
                                          defaultValues,
                                      }: AgentOrganisationFormProps) => {

    const router = useRouter();

    const defaultOrganizationIds = defaultValues?.organizations?.map(organization => organization.organizationId) ?? []


    const form = useZodForm({
        schema: AgentOrganizationSchema,
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


    const mutation = useMutation({
        mutationFn: async (values: AgentOrganizationType) => {

            const payload = {
                data: values.organizations,
                id: defaultValues?.id ?? ""
            };

            const result =  await updateAgentOrganizationsAction(payload)
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
                await mutation.mutateAsync(values);
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
                    <ButtonWithLoading isPending={mutation.isPending}>
                        Save
                    </ButtonWithLoading>
                </div>

            </div>
        </Form>
    );
};
